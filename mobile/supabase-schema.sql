-- HustleWall Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  area TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  total_views INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_endorsements INTEGER DEFAULT 0,
  device_fingerprint TEXT
);

-- Index for phone lookup
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- =====================================================
-- POSTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
  caption TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  area TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  endorsement_count INTEGER DEFAULT 0,
  trending_score DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_trending_score ON posts(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_area ON posts(area);

-- =====================================================
-- ENGAGEMENT TABLE
-- Tracks all engagement actions (views, shares, endorsements)
-- =====================================================
CREATE TABLE IF NOT EXISTS engagement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('view', 'share', 'endorsement')),
  platform TEXT, -- For shares: 'whatsapp', 'link', 'other'
  message TEXT, -- For endorsements
  device_fingerprint TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint for endorsements (one per user per post)
  CONSTRAINT unique_endorsement UNIQUE (post_id, user_id, type)
    DEFERRABLE INITIALLY DEFERRED
);

-- Remove the constraint for views and shares (allow multiple)
-- Actually we need a different approach - use partial unique index
DROP INDEX IF EXISTS idx_unique_endorsement;
ALTER TABLE engagement DROP CONSTRAINT IF EXISTS unique_endorsement;

-- Add partial unique index only for endorsements
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_endorsement
ON engagement(post_id, user_id)
WHERE type = 'endorsement';

-- Indexes for engagement queries
CREATE INDEX IF NOT EXISTS idx_engagement_post_id ON engagement(post_id);
CREATE INDEX IF NOT EXISTS idx_engagement_user_id ON engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_type ON engagement(type);
CREATE INDEX IF NOT EXISTS idx_engagement_created_at ON engagement(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_post_type ON engagement(post_id, type);

-- =====================================================
-- USER VIEWS COOLDOWN TABLE
-- Tracks when users last viewed each post (for 30-min cooldown)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_view_cooldowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  last_view_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_view_cooldowns_user_post ON user_view_cooldowns(user_id, post_id);

-- =====================================================
-- RATE LIMITING TABLE
-- Tracks engagement actions per user per hour
-- =====================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- WEEKLY LEADERBOARD TABLE
-- Computed weekly rankings
-- =====================================================
CREATE TABLE IF NOT EXISTS leaderboard_weekly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  total_views INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_endorsements INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_week ON leaderboard_weekly(week_start);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard_weekly(engagement_score DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to check view cooldown (30 minutes)
CREATE OR REPLACE FUNCTION can_record_view(p_user_id UUID, p_post_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_view TIMESTAMPTZ;
BEGIN
  SELECT last_view_at INTO last_view
  FROM user_view_cooldowns
  WHERE user_id = p_user_id AND post_id = p_post_id;

  IF last_view IS NULL THEN
    RETURN TRUE;
  END IF;

  -- 30 minute cooldown
  RETURN (NOW() - last_view) > INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limit (100 actions per hour)
CREATE OR REPLACE FUNCTION check_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_time TIMESTAMPTZ;
BEGIN
  SELECT action_count, window_start INTO current_count, window_time
  FROM rate_limits
  WHERE user_id = p_user_id;

  IF window_time IS NULL OR (NOW() - window_time) > INTERVAL '1 hour' THEN
    -- Reset or create new window
    INSERT INTO rate_limits (user_id, action_count, window_start)
    VALUES (p_user_id, 1, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET action_count = 1, window_start = NOW();
    RETURN TRUE;
  END IF;

  IF current_count >= 100 THEN
    RETURN FALSE;
  END IF;

  -- Increment count
  UPDATE rate_limits
  SET action_count = action_count + 1
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to record a view with fraud prevention
CREATE OR REPLACE FUNCTION record_view(
  p_user_id UUID,
  p_post_id UUID,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  post_owner_id UUID;
BEGIN
  -- Check if user owns the post
  SELECT user_id INTO post_owner_id FROM posts WHERE id = p_post_id;
  IF post_owner_id = p_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Cannot view your own post for engagement');
  END IF;

  -- Check rate limit
  IF NOT check_rate_limit(p_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'Rate limit exceeded. Try again later.');
  END IF;

  -- Check cooldown
  IF NOT can_record_view(p_user_id, p_post_id) THEN
    RETURN json_build_object('success', false, 'message', 'View already counted. Wait 30 minutes.');
  END IF;

  -- Record the view
  INSERT INTO engagement (post_id, user_id, type, device_fingerprint)
  VALUES (p_post_id, p_user_id, 'view', p_device_fingerprint);

  -- Update cooldown
  INSERT INTO user_view_cooldowns (user_id, post_id, last_view_at)
  VALUES (p_user_id, p_post_id, NOW())
  ON CONFLICT (user_id, post_id)
  DO UPDATE SET last_view_at = NOW();

  -- Update post view count
  UPDATE posts SET view_count = view_count + 1, updated_at = NOW()
  WHERE id = p_post_id;

  -- Update user total views
  UPDATE users SET total_views = total_views + 1
  WHERE id = post_owner_id;

  RETURN json_build_object('success', true, 'message', 'View recorded');
END;
$$ LANGUAGE plpgsql;

-- Function to record a share
CREATE OR REPLACE FUNCTION record_share(
  p_user_id UUID,
  p_post_id UUID,
  p_platform TEXT DEFAULT 'other'
)
RETURNS JSON AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Check rate limit
  IF NOT check_rate_limit(p_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'Rate limit exceeded');
  END IF;

  SELECT user_id INTO post_owner_id FROM posts WHERE id = p_post_id;

  -- Record the share
  INSERT INTO engagement (post_id, user_id, type, platform)
  VALUES (p_post_id, p_user_id, 'share', p_platform);

  -- Update post share count
  UPDATE posts SET share_count = share_count + 1, updated_at = NOW()
  WHERE id = p_post_id;

  -- Update user total shares
  UPDATE users SET total_shares = total_shares + 1
  WHERE id = post_owner_id;

  RETURN json_build_object('success', true, 'message', 'Share recorded');
END;
$$ LANGUAGE plpgsql;

-- Function to record an endorsement
CREATE OR REPLACE FUNCTION record_endorsement(
  p_user_id UUID,
  p_post_id UUID,
  p_message TEXT
)
RETURNS JSON AS $$
DECLARE
  post_owner_id UUID;
  existing_endorsement UUID;
BEGIN
  -- Check rate limit
  IF NOT check_rate_limit(p_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Rate limit exceeded');
  END IF;

  SELECT user_id INTO post_owner_id FROM posts WHERE id = p_post_id;

  -- Check if user is endorsing their own post
  IF post_owner_id = p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot endorse your own post');
  END IF;

  -- Check if already endorsed
  SELECT id INTO existing_endorsement
  FROM engagement
  WHERE post_id = p_post_id AND user_id = p_user_id AND type = 'endorsement';

  IF existing_endorsement IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already endorsed this post');
  END IF;

  -- Record the endorsement
  INSERT INTO engagement (post_id, user_id, type, message)
  VALUES (p_post_id, p_user_id, 'endorsement', p_message);

  -- Update post endorsement count
  UPDATE posts SET endorsement_count = endorsement_count + 1, updated_at = NOW()
  WHERE id = p_post_id;

  -- Update user total endorsements
  UPDATE users SET total_endorsements = total_endorsements + 1
  WHERE id = post_owner_id;

  RETURN json_build_object('success', true, 'message', 'Endorsement recorded');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate trending score
-- Score formula: views * 1 + shares * 2 + endorsements * 3
CREATE OR REPLACE FUNCTION calculate_trending_score(p_post_id UUID, p_hours INTEGER DEFAULT 24)
RETURNS DECIMAL AS $$
DECLARE
  view_count INTEGER;
  share_count INTEGER;
  endorsement_count INTEGER;
  score DECIMAL;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE type = 'view'),
    COUNT(*) FILTER (WHERE type = 'share'),
    COUNT(*) FILTER (WHERE type = 'endorsement')
  INTO view_count, share_count, endorsement_count
  FROM engagement
  WHERE post_id = p_post_id
    AND created_at > NOW() - (p_hours || ' hours')::INTERVAL;

  score := (view_count * 1) + (share_count * 2) + (endorsement_count * 3);
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to update all trending scores
CREATE OR REPLACE FUNCTION update_trending_scores()
RETURNS void AS $$
BEGIN
  UPDATE posts p
  SET trending_score = calculate_trending_score(p.id, 24),
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get trending posts
CREATE OR REPLACE FUNCTION get_trending_posts(p_hours INTEGER DEFAULT 24, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  media_url TEXT,
  media_type TEXT,
  caption TEXT,
  skills TEXT[],
  area TEXT,
  view_count INTEGER,
  share_count INTEGER,
  endorsement_count INTEGER,
  trending_score DECIMAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.media_url,
    p.media_type,
    p.caption,
    p.skills,
    p.area,
    p.view_count,
    p.share_count,
    p.endorsement_count,
    calculate_trending_score(p.id, p_hours) as trending_score,
    p.created_at
  FROM posts p
  WHERE p.created_at > NOW() - (p_hours || ' hours')::INTERVAL
  ORDER BY calculate_trending_score(p.id, p_hours) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update weekly leaderboard
CREATE OR REPLACE FUNCTION update_weekly_leaderboard()
RETURNS void AS $$
DECLARE
  week_start_date DATE;
BEGIN
  week_start_date := date_trunc('week', CURRENT_DATE)::DATE;

  -- Upsert leaderboard entries for all users with engagement this week
  INSERT INTO leaderboard_weekly (user_id, week_start, total_views, total_shares, total_endorsements, engagement_score)
  SELECT
    u.id,
    week_start_date,
    COALESCE(SUM(CASE WHEN e.type = 'view' THEN 1 ELSE 0 END), 0)::INTEGER,
    COALESCE(SUM(CASE WHEN e.type = 'share' THEN 1 ELSE 0 END), 0)::INTEGER,
    COALESCE(SUM(CASE WHEN e.type = 'endorsement' THEN 1 ELSE 0 END), 0)::INTEGER,
    COALESCE(
      SUM(CASE WHEN e.type = 'view' THEN 1 ELSE 0 END) +
      SUM(CASE WHEN e.type = 'share' THEN 2 ELSE 0 END) +
      SUM(CASE WHEN e.type = 'endorsement' THEN 3 ELSE 0 END),
      0
    )::INTEGER
  FROM users u
  LEFT JOIN posts p ON p.user_id = u.id
  LEFT JOIN engagement e ON e.post_id = p.id
    AND e.created_at >= week_start_date
    AND e.created_at < week_start_date + INTERVAL '7 days'
  GROUP BY u.id
  ON CONFLICT (user_id, week_start) DO UPDATE SET
    total_views = EXCLUDED.total_views,
    total_shares = EXCLUDED.total_shares,
    total_endorsements = EXCLUDED.total_endorsements,
    engagement_score = EXCLUDED.engagement_score,
    updated_at = NOW();

  -- Update ranks
  UPDATE leaderboard_weekly lw
  SET rank = subq.rank
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY engagement_score DESC) as rank
    FROM leaderboard_weekly
    WHERE week_start = week_start_date
  ) subq
  WHERE lw.id = subq.id;
END;
$$ LANGUAGE plpgsql;

-- Function to get current week leaderboard
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_skills TEXT[],
  user_area TEXT,
  total_views INTEGER,
  total_shares INTEGER,
  total_endorsements INTEGER,
  engagement_score INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lw.user_id,
    u.name,
    u.skills,
    u.area,
    lw.total_views,
    lw.total_shares,
    lw.total_endorsements,
    lw.engagement_score,
    lw.rank
  FROM leaderboard_weekly lw
  JOIN users u ON u.id = lw.user_id
  WHERE lw.week_start = date_trunc('week', CURRENT_DATE)::DATE
  ORDER BY lw.rank ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_view_cooldowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_weekly ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Posts policies
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create their own posts" ON posts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid()::text = user_id::text);

-- Engagement policies
CREATE POLICY "Anyone can view engagement" ON engagement FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create engagement" ON engagement FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- View cooldowns policies
CREATE POLICY "Users can view their own cooldowns" ON user_view_cooldowns FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage their own cooldowns" ON user_view_cooldowns FOR ALL USING (auth.uid()::text = user_id::text);

-- Rate limits policies
CREATE POLICY "Users can view their own rate limits" ON rate_limits FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage their own rate limits" ON rate_limits FOR ALL USING (auth.uid()::text = user_id::text);

-- Leaderboard policies
CREATE POLICY "Anyone can view leaderboard" ON leaderboard_weekly FOR SELECT USING (true);

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime for specific tables
-- =====================================================

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- Enable realtime for engagement
ALTER PUBLICATION supabase_realtime ADD TABLE engagement;

-- Enable realtime for leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard_weekly;

-- Enable realtime for users (for profile updates)
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update user stats when engagement is added
CREATE OR REPLACE FUNCTION update_user_stats_trigger()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;

  IF NEW.type = 'view' THEN
    UPDATE users SET total_views = total_views + 1 WHERE id = post_owner_id;
  ELSIF NEW.type = 'share' THEN
    UPDATE users SET total_shares = total_shares + 1 WHERE id = post_owner_id;
  ELSIF NEW.type = 'endorsement' THEN
    UPDATE users SET total_endorsements = total_endorsements + 1 WHERE id = post_owner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (disabled by default since functions already handle this)
-- DROP TRIGGER IF EXISTS engagement_user_stats_trigger ON engagement;
-- CREATE TRIGGER engagement_user_stats_trigger
-- AFTER INSERT ON engagement
-- FOR EACH ROW EXECUTE FUNCTION update_user_stats_trigger();

-- =====================================================
-- SCHEDULED JOBS (using pg_cron if available)
-- These should be set up in Supabase dashboard
-- =====================================================

-- Update trending scores every 5 minutes
-- SELECT cron.schedule('update-trending', '*/5 * * * *', 'SELECT update_trending_scores()');

-- Update weekly leaderboard every hour
-- SELECT cron.schedule('update-leaderboard', '0 * * * *', 'SELECT update_weekly_leaderboard()');

-- =====================================================
-- SAMPLE DATA (for testing - remove in production)
-- =====================================================

-- Uncomment below to insert sample data
/*
INSERT INTO users (id, phone, name, whatsapp, skills, area) VALUES
  ('11111111-1111-1111-1111-111111111111', '+2348012345678', 'Chidi Okonkwo', '+2348012345678', ARRAY['Electrician', 'AC Technician'], 'Lekki'),
  ('22222222-2222-2222-2222-222222222222', '+2348023456789', 'Amaka Johnson', '+2348023456789', ARRAY['Hair Stylist', 'Makeup Artist'], 'Victoria Island'),
  ('33333333-3333-3333-3333-333333333333', '+2348034567890', 'Emeka Nwosu', '+2348034567890', ARRAY['Plumber', 'Tiler'], 'Ikeja');

INSERT INTO posts (id, user_id, media_url, caption, skills, area) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800', 'Just completed full house wiring for a 4-bedroom duplex in Lekki Phase 1.', ARRAY['Electrician'], 'Lekki'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800', 'Bridal makeup and styling for my client.', ARRAY['Makeup Artist', 'Hair Stylist'], 'Victoria Island');
*/
