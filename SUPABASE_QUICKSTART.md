# HustleWall - Supabase Quick Start

## Step 1: Create Supabase Account & Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Choose organization, project name, password
5. Wait for project to initialize (2-3 minutes)

## Step 2: Get Your Credentials

In Supabase Dashboard:
1. Go to **Settings** (bottom left)
2. Click **API**
3. Copy the following:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Step 3: Add Environment Variables

In Vibecode:
1. Click **ENV** tab
2. Add these variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```
3. Save

The app will auto-detect the configuration. Check LOGS tab - you should NOT see a warning about missing credentials.

## Step 4: Create Database Schema

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `supabase-schema.sql` from your workspace
4. Copy **entire contents**
5. Paste into Supabase SQL editor
6. Click **Run**
7. Wait for completion (should see green checkmark)

This creates:
- All tables (users, posts, engagement, leaderboard_weekly, etc.)
- All functions (record_view, record_share, record_endorsement, etc.)
- Realtime subscriptions
- Security policies (RLS)

## Step 5: Enable Realtime

1. In Supabase Dashboard → **Database** → **Replication**
2. Under "Replication" section, toggle ON for:
   - `posts`
   - `engagement`
   - `leaderboard_weekly`
   - `users`

(These should already be enabled by the SQL schema, but verify)

## Step 6: Test Connection

1. Check Vibecode **LOGS** tab
2. You should see logs from the app initializing
3. No error messages about Supabase credentials = ✅ Working!

## Step 7: Migrate Mock Data (Optional)

The app comes with mock data in Zustand store. To use real Supabase data:

1. Delete or comment out mock data in `src/lib/store.ts`
2. Create users manually in Supabase via SQL:
   ```sql
   INSERT INTO users (id, phone, name, whatsapp, skills, area) VALUES
     ('11111111-1111-1111-1111-111111111111', '+2348012345678', 'Chidi', '+2348012345678', ARRAY['Electrician'], 'Lekki'),
     ('22222222-2222-2222-2222-222222222222', '+2348023456789', 'Amaka', '+2348023456789', ARRAY['Hair Stylist'], 'VI');
   ```
3. Create test posts similarly in posts table

Or keep using mock data while developing - it works alongside Supabase!

## What's Now Powered by Supabase

### Real-Time Engagement
- Views are tracked server-side with 30-minute cooldown
- Shares recorded with platform info
- Endorsements enforced one-per-user
- All counts update live across devices

### Trending Posts
- Automatically computed with weighted scoring
- Score = (views × 1) + (shares × 2) + (endorsements × 3)
- Updated every 5 minutes via scheduled job

### Leaderboard
- Weekly rankings of top creators
- Badges for top 3 (Gold/Silver/Bronze)
- Real-time updates as users engage
- Resets every Monday

### Fraud Prevention
- 30-minute view cooldown per user per post
- One endorsement per user per post
- Cannot endorse own posts
- Device fingerprinting
- Rate limiting (100 actions/hour)
- All enforced server-side

## Common Issues & Fixes

### Issue: "Supabase credentials not configured"
**Fix**:
- Double-check ENV variables in Vibecode ENV tab
- Make sure you copied the FULL URL and key
- Restart app after adding ENV variables

### Issue: "Function does not exist"
**Fix**:
- Re-run the SQL schema in Supabase SQL Editor
- Functions like `record_view()` must be created first
- Check SQL Editor for any error messages

### Issue: Real-time updates not working
**Fix**:
- Verify realtime is enabled in Supabase Replication
- Check LOGS tab for subscription errors
- Ensure you're using Chrome/Safari (some browsers have WebSocket issues)

### Issue: Database write errors
**Fix**:
- Check Row Level Security (RLS) policies in Supabase
- Verify user is authenticated before writing
- Check SQL error message for specific constraint violation

### Issue: "Already endorsed this post" but I haven't
**Fix**:
- This is a server-side unique constraint working correctly
- Try refreshing the app
- Or check if you're logged in as the right user

## Monitoring & Debugging

### View Database Activity
1. Supabase Dashboard → **Database** → **Tables**
2. Click any table to see recent rows
3. Check `engagement` table to see recorded views/shares/endorsements

### Check Logs
1. Vibecode **LOGS** tab shows real-time app logs
2. Look for errors like `Error recording view:` or `Error getting engagement:`
3. Share logs if you need help debugging

### Test Engagement Recording
1. View a post in the app
2. Go to Supabase → engagement table
3. Should see new row with `type='view'`

### Verify Trending Posts
```sql
-- In Supabase SQL Editor
SELECT * FROM posts ORDER BY trending_score DESC LIMIT 5;
```

### Check Leaderboard
```sql
SELECT * FROM get_weekly_leaderboard(10);
```

## Next Steps

1. **Understand the code**:
   - `src/lib/supabase.ts` - Client configuration
   - `src/lib/engagement-supabase.ts` - Engagement service
   - `src/app/(tabs)/leaderboard.tsx` - Leaderboard screen

2. **Test features**:
   - View a post (should increment view_count)
   - Share a post (should record share with platform)
   - Give an endorsement (should prevent duplicates)
   - Check leaderboard (should show top creators)

3. **Customize**:
   - Change colors in components
   - Add more skills or areas
   - Modify scoring algorithm
   - Add more tables as needed

4. **Deploy**:
   - Use Vibecode publish feature
   - Supabase automatically scales with you
   - Monitor performance in production

## For Help

- **Supabase docs**: https://supabase.com/docs
- **App code comments**: Check `src/lib/supabase.ts` and `SUPABASE_SETUP.md`
- **Error messages**: Always check LOGS tab first
- **Database queries**: Use Supabase SQL Editor to test

## Production Checklist

Before going live:

- [ ] Supabase project created and credentials added to ENV
- [ ] Database schema created via SQL
- [ ] Realtime enabled for required tables
- [ ] RLS policies reviewed and appropriate
- [ ] Rate limits tested (100 actions/hour)
- [ ] Fraud prevention tested (30-min cooldown, no self-endorsement)
- [ ] Trending algorithm verified (working as expected)
- [ ] Leaderboard computing correctly
- [ ] Logs show no errors
- [ ] User testing with real data
- [ ] Performance monitoring set up
- [ ] Backup plan for data loss

You're ready to launch! 🚀
