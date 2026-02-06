# HustleWall Supabase Integration Guide

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your **Project URL** and **Anon Public Key**

### 2. Add Environment Variables

In Vibecode, go to the **ENV tab** and add:

```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from your workspace
4. Paste and run the SQL
5. The schema will create all tables, functions, and real-time subscriptions

### 4. Enable Realtime

In Supabase Dashboard:
1. Go to Database → Replication
2. Enable realtime for: `posts`, `engagement`, `leaderboard_weekly`, `users`
3. This is already configured in the schema, but verify it's enabled

### 5. Test the Connection

The app will auto-detect if Supabase is configured. Check the LOGS tab in Vibecode to see if the client initializes without warnings.

---

## Architecture Overview

### Database Tables

#### `users`
Stores user profiles with engagement aggregates:
- `id`, `phone`, `name`, `whatsapp`, `skills`, `area`
- `total_views`, `total_shares`, `total_endorsements` (aggregated)
- `device_fingerprint` (for fraud prevention)

#### `posts`
Stores all posts with engagement counts:
- `id`, `user_id`, `media_url`, `caption`, `skills`, `area`
- `view_count`, `share_count`, `endorsement_count`
- `trending_score` (updated every 5 minutes)

#### `engagement`
Unified engagement tracking for views, shares, endorsements:
- `type`: 'view' | 'share' | 'endorsement'
- `platform`: For shares (whatsapp, link, other)
- `message`: For endorsements
- Enforces: One endorsement per user per post
- Tracks: `device_fingerprint`, `ip_address` for fraud prevention

#### `user_view_cooldowns`
Tracks 30-minute cooldown between views from same user per post

#### `rate_limits`
Enforces 100 engagement actions per user per hour

#### `leaderboard_weekly`
Pre-computed weekly rankings with engagement scores

---

## Real-Time Features

### Live Engagement Updates

The app subscribes to post changes in real-time:

```typescript
// In your components
subscribeToPostEngagement(postId, (post) => {
  // Update UI with new engagement counts
  setViewCount(post.view_count);
  setShareCount(post.share_count);
  setEndorsementCount(post.endorsement_count);
});
```

### Trending Posts

Computed via SQL function with weighted scoring:
- Views × 1 point
- Shares × 2 points
- Endorsements × 3 points

### Leaderboard

Updated hourly via scheduled job. Get current week rankings:

```typescript
const leaderboard = await supabase.rpc('get_weekly_leaderboard', { p_limit: 10 });
```

---

## Fraud Prevention & Security

### 1. View Cooldown (30 minutes)
- Same user cannot increment view count on same post twice within 30 minutes
- Implemented via `user_view_cooldowns` table

### 2. Rate Limiting (100 actions/hour)
- Max 100 engagement actions per user per hour
- Enforced server-side in `check_rate_limit()` function

### 3. Device Fingerprinting
- Unique device ID generated on first use
- Stored in `AsyncStorage` and sent with engagement actions
- Helps detect coordinated fraud from same device

### 4. One Endorsement Per User Per Post
- Unique constraint on `(post_id, user_id)` for type='endorsement'
- Users cannot endorse their own posts

### 5. Cannot View Own Posts
- Views don't increment if `user_id == post.user_id`
- Prevents self-inflation

### 6. Server-Side Validation
- All fraud prevention rules enforced by PostgreSQL functions
- Client-side checks are convenience only

---

## Performance Optimization

### 1. Pagination
Load posts in batches of 10-20 to reduce network load:

```typescript
const { data } = await supabase
  .from('posts')
  .select()
  .order('created_at', { ascending: false })
  .range(0, 19); // First 20 posts
```

### 2. Selective Subscriptions
Only subscribe to posts currently visible on screen:

```typescript
// Subscribe when post enters viewport
// Unsubscribe when post leaves viewport
```

### 3. Caching
Use React Query to cache engagement data locally:

```typescript
const { data: engagement } = useQuery({
  queryKey: ['engagement', postId],
  queryFn: () => getPostEngagement(postId),
});
```

### 4. Batch Queries
Fetch multiple posts' engagement in one query:

```typescript
const { data } = await supabase
  .from('posts')
  .select()
  .in('id', postIds); // Fetch multiple at once
```

---

## Scaling Strategies

### 1. Archive Old Data
Keep engagement table lean by archiving data older than 90 days:

```sql
-- Run periodically (e.g., monthly)
DELETE FROM engagement
WHERE created_at < NOW() - INTERVAL '90 days';
```

### 2. Precompute Aggregates
The `posts` table stores `view_count`, `share_count`, `endorsement_count` directly (not computed on-the-fly).

Update counts whenever engagement is recorded (done via triggers).

### 3. Limit Realtime Subscriptions
Don't subscribe to entire tables. Use specific post/user filters:

```typescript
// Good: Subscribe to specific post
subscribeToPostEngagement(postId, callback);

// Bad: Subscribe to all posts
supabase
  .from('posts')
  .on('*', callback)
  .subscribe(); // This will be expensive at scale
```

### 4. Index Strategy
All frequently queried columns are indexed:
- `posts.user_id`
- `posts.created_at`
- `engagement.post_id`
- `engagement.created_at`

---

## Troubleshooting

### Issue: "Supabase credentials not configured"
**Solution**: Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to ENV tab

### Issue: "Function does not exist"
**Solution**: Run the SQL schema in Supabase. Functions like `record_view()` must be created first.

### Issue: Real-time updates not working
**Solution**:
1. Verify realtime is enabled in Supabase Dashboard
2. Check LOGS tab for subscription errors
3. Ensure filters match your data

### Issue: Rate limit errors
**Solution**: This is normal. Users can't make >100 engagement actions per hour. Wait and try again.

### Issue: "Already endorsed this post"
**Solution**: This is expected. Users can only endorse once per post.

---

## API Functions Reference

### Engagement Tracking

```typescript
// Record a view (checks cooldown & rate limit)
recordView(postId: string, userId: string)
→ { success: boolean; message: string }

// Record a share
recordShare(postId: string, userId: string, platform: 'whatsapp'|'link'|'other')
→ { success: boolean; shareCount?: number }

// Record an endorsement
recordEndorsement(postId: string, fromUserId: string, toUserId: string, message: string)
→ { success: boolean; endorsement?: any; error?: string }

// Get post engagement stats
getPostEngagement(postId: string)
→ { viewCount, shareCount, endorsementCount, lastUpdated }

// Get endorsements for a post
getPostEndorsements(postId: string)
→ EndorsementRecord[]

// Get trending posts
getTrendingPosts(hours: number = 24, limit: number = 10)
→ DBPost[]
```

### Subscriptions

```typescript
// Real-time post engagement updates
subscribeToPostEngagement(postId: string, callback: (engagement) => void)
→ unsubscribe function

// Real-time leaderboard updates
subscribeToLeaderboard(callback: (entries) => void)
→ unsubscribe function

// Real-time user stats
subscribeToUserStats(userId: string, callback: (user) => void)
→ unsubscribe function
```

---

## Next Steps

1. **Migrate existing data** from AsyncStorage to Supabase
2. **Update components** to use Supabase engagement functions
3. **Test real-time** updates by opening multiple devices
4. **Monitor performance** in production
5. **Set up scheduled jobs** for trending score updates and leaderboard (via Supabase cron)

---

## Support

For issues with:
- **Supabase setup**: Refer to [Supabase docs](https://supabase.com/docs)
- **Real-time**: Check [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- **Database**: Check [PostgreSQL docs](https://www.postgresql.org/docs/)
- **HustleWall**: Check the code comments in `src/lib/supabase.ts` and `src/lib/engagement-supabase.ts`
