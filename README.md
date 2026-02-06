# HustleWall

A mobile-first proof-of-work showcase app for Nigerian informal workers. Workers post photos of completed jobs with skill tags and area, build reputation through endorsements, and customers can contact them directly via WhatsApp or phone.

## Features

### Core Functionality
- **Proof-of-Work Feed**: Scrollable feed showing work posts from skilled workers, newest first
- **Filtering**: Filter posts by area (e.g., Lekki, Ikeja, Victoria Island) and skill (e.g., Electrician, Plumber)
- **Post Creation**: Upload photos of completed work with captions, skill tags, and service area
- **Auto-Generated Profiles**: Profiles created automatically when users post for the first time
- **Endorsements**: Soft endorsements from satisfied customers, traceable to endorser's profile
- **Contact Options**: WhatsApp click-to-chat and direct phone call buttons
- **Sharing**: Share posts to WhatsApp, Status, and other apps for viral growth

### Real-Time Backend (Supabase)
- **PostgreSQL Database**: Scalable backend for all user data, posts, and engagement
- **Real-Time Subscriptions**: Live updates across all users using Supabase Realtime
- **Engagement Tracking**: Real-time tracking of views, shares, and endorsements with fraud prevention
- **Trending Posts**: Automatically computed trending posts with weighted scoring algorithm
- **Weekly Leaderboard**: Live creator rankings updated in real-time with badges

### Safety Features
- No precise location sharing - only broad area displayed
- Clear safety disclaimers throughout the app
- Traceable endorsement history for accountability
- Public endorser profiles to verify credibility
- Server-side fraud prevention with rate limiting and cooldowns

### User Flow
1. Sign up via phone + OTP verification
2. Post proof-of-work with photo, skills, and area
3. Profile auto-created with first post
4. Browse feed, filter by area/skill, see trending posts
5. View worker profiles with full engagement history
6. Contact via WhatsApp or phone
7. Leave endorsements after work completed
8. Share posts to drive organic growth
9. Climb weekly leaderboard for creator badges

## Supabase Integration

HustleWall uses **Supabase** (PostgreSQL + Realtime) for a scalable, real-time backend.

### What Changed
- **Engagement Storage**: Moved from AsyncStorage to Supabase `engagement` table
- **Real-Time Updates**: All metrics (views, shares, endorsements) update live via subscriptions
- **Trending Posts**: Computed server-side with weighted scoring (views × 1, shares × 2, endorsements × 3)
- **Leaderboard**: Weekly rankings automatically calculated and updated
- **Fraud Prevention**: Server-side validation with 30-min cooldowns, rate limits, and device fingerprinting

### Setup Guide
See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete setup instructions.

Quick start:
1. Create Supabase project at supabase.com
2. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to ENV tab
3. Run SQL schema in Supabase SQL Editor
4. App auto-connects and syncs in real-time

## Real-Time Engagement Tracking

### Features
- **Post Views**: Tracks unique views per user with 30-minute cooldown to prevent inflation
- **Post Shares**: Records each share action with platform info (WhatsApp, link, other)
- **Endorsements**: One endorsement per user per post, prevents self-endorsement
- **Live Updates**: All metrics update in real-time across feed, post details, and profiles
- **Animated Feedback**: Visual pulse animations when metrics change

### Trending Algorithm
```
Score = (Views × 1) + (Shares × 2) + (Endorsements × 3)
```

Posts are ranked by score in last 24 hours (top 5) and last 7 days (top 10).

### Leaderboard
**Weekly Rankings** showing:
- Top creators by engagement score
- Badge system for top 3 (Gold, Silver, Bronze)
- Real-time updates as users engage
- Resets every Monday

### Fraud Prevention
- **30-minute view cooldown**: Same user can't inflate view count repeatedly
- **One endorsement per post**: Users can only endorse a post once
- **No self-endorsement**: Users cannot endorse their own work
- **Device fingerprinting**: Device ID tracking for coordinated fraud detection
- **Rate limiting**: Maximum 100 engagement actions per user per hour
- **Server-side validation**: All rules enforced by PostgreSQL functions

## Database Structure

### Core Tables

**posts** - Work entries
```typescript
{
  id: UUID,
  user_id: UUID,           // Reference to users
  media_url: string,
  caption: string,
  skills: string[],        // Array of skill tags
  area: string,
  view_count: number,      // Aggregate view count
  share_count: number,     // Aggregate share count
  endorsement_count: number,
  trending_score: decimal, // Updated every 5 min
  created_at: timestamp
}
```

**users** - Worker profiles
```typescript
{
  id: UUID,
  phone: string,           // Unique
  name: string,
  whatsapp: string,
  skills: string[],
  area: string,
  total_views: number,     // Aggregate across all posts
  total_shares: number,
  total_endorsements: number,
  device_fingerprint: string,
  created_at: timestamp
}
```

**engagement** - Unified engagement log
```typescript
{
  id: UUID,
  post_id: UUID,
  user_id: UUID,
  type: 'view' | 'share' | 'endorsement',  // Action type
  platform: string,        // For shares: 'whatsapp', 'link', 'other'
  message: string,         // For endorsements
  device_fingerprint: string,
  ip_address: string,
  created_at: timestamp
}
```

**leaderboard_weekly** - Pre-computed rankings
```typescript
{
  user_id: UUID,
  week_start: date,
  total_views: number,
  total_shares: number,
  total_endorsements: number,
  engagement_score: number,  // Weighted sum
  rank: number,              // Position in rankings
  created_at: timestamp
}
```

### Supporting Tables
- `user_view_cooldowns` - Tracks 30-minute cooldown per user per post
- `rate_limits` - Tracks engagement actions per user per hour

## Screens Overview

### Feed (Home Tab)
- Green header with HustleWall branding and "Live" indicator
- Filter button to show/hide area and skill filters
- Pull-to-refresh functionality
- **Trending section** (top 5 posts from last 24h)
- Post cards with live view/share/endorsement counts
- Animated metric updates with haptic feedback
- Safety disclaimer at bottom

### Leaderboard (Leaderboard Tab) ⭐ NEW
- **Top 3 Podium**: Gold/Silver/Bronze badges with scores
- **Stats Panel**: Top score, total creators
- **Rankings List**: Detailed leaderboard with rank, engagement score
- **Real-time Updates**: Leaderboard refreshes as users engage
- **How it works**: Info card explaining point system
- Subscribe to live leaderboard changes

### Post Creation (Create Tab)
- Photo capture or gallery selection
- Caption input
- Skill tag picker (max 3)
- Area selector
- Privacy notice about location

### Profile (Profile Tab)
- Real-time user stats: views, shares, endorsements
- Animated stat updates with visual feedback
- "Live" indicator showing real-time tracking
- Recent posts horizontal scroll
- Recent endorsements received
- Account age display
- Logout option

### Post Detail
- Full-size media
- Skills and caption
- Live engagement stats (views, shares, endorsements)
- Unique viewers and 24h views analytics
- Worker profile link
- WhatsApp and Call contact buttons
- Endorsement form (with duplicate prevention)
- Endorsement list with timestamps
- Safety tips

### Worker Profile View
- Profile card with real-time stats
- Contact buttons
- Complete work history
- Endorsements received (traceable)
- Endorsements given (shows credibility)
- Safety verification notice

### Auth Flow
- Phone number entry (+234 format)
- OTP verification via SMS (Firebase Auth)
- 30-second resend timer
- Profile creation for new users
- Carrier detection (MTN, Glo, Airtel, 9mobile)

## Phone Authentication (OTP)

### Current Implementation (Demo Mode)
The app includes a mock Firebase implementation for development:
- Enter any valid Nigerian phone number (+234XXXXXXXXXX)
- Use code `123456` or any 6-digit code to verify
- Simulates network delays and occasional failures

### Production Setup (Firebase)
To enable real SMS OTP verification:

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project or use existing
   - Enable Phone Authentication in Authentication > Sign-in method

2. **Add Environment Variables** (in Vibecode ENV tab)
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. **For Production Build**
   After publishing, install Firebase packages:
   ```bash
   npx expo install @react-native-firebase/app @react-native-firebase/auth
   ```

### Nigerian Network Considerations
- SMS delivery can take 30-60 seconds on busy networks
- Users should disable DND (Do Not Disturb) for OTP receipt
- App detects carrier (MTN, Glo, Airtel, 9mobile) from phone prefix
- Resend button activates after 30 seconds

### Security Best Practices
- OTP codes expire after 5 minutes
- Rate limiting prevents brute force attempts
- Phone numbers stored in +234 international format
- No precise location data collected

## App Structure

```
src/
├── app/
│   ├── _layout.tsx              # Root layout with navigation
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigator (4 tabs)
│   │   ├── index.tsx            # Feed screen with trending posts
│   │   ├── leaderboard.tsx      # Weekly leaderboard with badges ⭐ NEW
│   │   ├── create.tsx           # Post creation
│   │   └── profile.tsx          # User's own profile with live stats
│   ├── auth.tsx                 # Phone + OTP auth
│   ├── post/[id].tsx            # Post detail with live engagement
│   ├── profile/[id].tsx         # Worker profile view
│   └── settings.tsx             # App settings
├── components/
│   └── PostCard.tsx             # Feed post card with live metrics
└── lib/
    ├── store.ts                 # Zustand store with mock data
    ├── supabase.ts              # Supabase client config ⭐ NEW
    ├── engagement-supabase.ts   # Engagement service with Supabase ⭐ NEW
    ├── engagement.ts            # Legacy AsyncStorage engagement (deprecated)
    ├── useEngagement.ts         # React hooks for engagement data
    ├── firebase-mock.ts         # Mock Firebase for development
    └── cn.ts                    # Tailwind class merge utility
```

## Design Principles

- **Mobile-First**: Optimized for Nigerian mobile users
- **Clean Nigerian UX**: Simple, minimal friction
- **Zero Capital**: Free to use, grows organically
- **Trust Building**: Traceable endorsements, view counts, account age
- **Safety First**: No precise locations, clear disclaimers
- **Real-Time**: Live engagement tracking builds trust and excitement
- **Scalable**: PostgreSQL backend handles millions of posts and engagements

## Color Palette

- Primary: Emerald (#059669, #047857)
- Accent: Amber (#f59e0b) for endorsements and badges
- Gold: Amber (#fbbf24) for top creator
- Success: Green (#10b981)
- Contact: Blue (#3b82f6) for calls
- Background: Gray (#f9fafb)
- Text: Gray (#111827, #6b7280, #9ca3af)

## Nigerian Areas Supported

Lagos: Island, Mainland, Ikeja, Lekki, VI, Surulere, Yaba, Ikorodu, Ajah
Abuja: Central, Wuse, Garki, Maitama, Gwarinpa
Others: Port Harcourt, Ibadan, Kano, Kaduna, Enugu, Benin City, Warri, Owerri, Calabar, Jos, Abeokuta

## Skill Categories

Trades: Electrician, Plumber, Carpenter, Painter, Mason, Tiler, Welder
Tech: AC Technician, Generator Repair, Phone Repair, Laptop Repair
Fashion: Tailor, Fashion Designer, Hair Stylist, Barber, Makeup Artist
Food: Chef, Caterer
Transport: Driver, Dispatch Rider
Home: Cleaner, Security, Gardener
Construction: POP Installer, Aluminium Fabricator, Furniture Maker, Upholstery
Auto: Mechanic, Panel Beater, Vulcanizer
Events: Photographer, Videographer, DJ, Event Planner, Decorator

## Environment Variables Required

Add these to Vibecode ENV tab:

```
# Supabase (for real-time backend)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Firebase (for SMS OTP - optional, demo mode works without this)
EXPO_PUBLIC_FIREBASE_API_KEY=optional
EXPO_PUBLIC_FIREBASE_PROJECT_ID=optional
```

## Zero-Capital Implementation Notes

1. **Scalable backend**: Uses Supabase (PostgreSQL) instead of local storage
2. **Real-time sync**: All users see updates instantly across devices
3. **Organic growth via sharing**: Native share to WhatsApp/Status
4. **Free hosting**: Can deploy via Expo
5. **No payment processing**: Direct WhatsApp/phone contact between parties
6. **User-generated content**: Workers create their own marketing material
7. **Viral mechanics**: Trending posts, leaderboard badges, shareable content
8. **Real-time engagement**: Live tracking creates excitement and trust

## Performance & Scaling

- **Pagination**: Load posts in batches of 20
- **Indexed queries**: All frequent queries are optimized with indexes
- **Selective subscriptions**: Only subscribe to visible posts
- **Aggregate counts**: Post/user stats stored directly, not computed on query
- **Archive old data**: Remove engagement data older than 90 days
- **Bandwidth optimization**: Realtime limits to 10 events/second per client

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed scaling strategies.

## Real-Time Engagement Tracking

HustleWall includes a comprehensive real-time engagement tracking system that records and displays live metrics for all user interactions.

### Features
- **Post Views**: Tracks unique views per user with 30-minute cooldown to prevent inflation
- **Post Shares**: Records each share action with platform info (WhatsApp, link, other)
- **Endorsements**: One endorsement per user per post, prevents self-endorsement
- **Live Updates**: All metrics update in real-time across feed, post details, and profiles
- **Animated Feedback**: Visual pulse animations when metrics change

### Database Structure

```typescript
// Engagement tracking structure
interface ViewRecord {
  postId: string;
  userId: string;
  timestamp: number;
  deviceId?: string;  // For fraud prevention
}

interface ShareRecord {
  postId: string;
  userId: string;
  timestamp: number;
  platform: 'whatsapp' | 'link' | 'other';
}

interface EndorsementRecord {
  id: string;
  postId: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  timestamp: number;
}
```

### Fraud Prevention
- **30-minute view cooldown**: Same user can't inflate view count repeatedly
- **One endorsement per post**: Users can only endorse a post once
- **No self-endorsement**: Users cannot endorse their own work
- **Device fingerprinting**: Optional device ID tracking for additional verification
- **Rate limiting**: Maximum 100 views per user per hour

### Analytics Available
- Unique viewers count (distinct users who viewed a post)
- Recent views (last 24 hours)
- Popular posts ranking (weighted by views, shares, endorsements)
- User engagement stats (total views, shares, endorsements across all posts)

### Usage in Components

```typescript
// Hook for real-time engagement data
const {
  viewCount,
  shareCount,
  endorsementCount,
  endorsements,
  uniqueViewers,
  recentViews24h,
  canUserEndorse,
  hasEndorsed,
  trackView,
  trackShare,
  submitEndorsement,
} = useEngagement(postId, postOwnerId);

// Hook for user profile stats
const { totalViews, totalShares, totalEndorsements } = useEngagementStats(userId);
```

## Technical Architecture

### Database Structure

```typescript
// Posts - proof of work entries
interface Post {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption: string;
  skills: string[];      // e.g., ['Electrician', 'AC Technician']
  area: string;          // e.g., 'Lekki'
  viewCount: number;
  shareCount: number;
  createdAt: string;
}

// Profiles - auto-generated worker profiles
interface Profile {
  id: string;
  phone: string;
  name: string;
  whatsapp: string;
  skills: string[];
  area: string;
  createdAt: string;
  endorsementCount: number;
}

// Endorsements - traceable recommendations
interface Endorsement {
  id: string;
  fromUserId: string;   // Who gave the endorsement
  toUserId: string;     // Who received it
  postId: string;       // Which work was endorsed
  message: string;
  createdAt: string;
}
```

### App Structure

```
src/
├── app/
│   ├── _layout.tsx          # Root layout with navigation
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab navigator
│   │   ├── index.tsx        # Feed screen with real-time updates
│   │   ├── create.tsx       # Post creation
│   │   └── profile.tsx      # User's own profile with live stats
│   ├── auth.tsx             # Phone + OTP auth
│   ├── post/[id].tsx        # Post detail with live engagement
│   ├── profile/[id].tsx     # Worker profile view
│   └── settings.tsx         # App settings
├── components/
│   └── PostCard.tsx         # Feed post card with live metrics
└── lib/
    ├── store.ts             # Zustand store with mock data
    ├── engagement.ts        # Real-time engagement tracking service
    ├── useEngagement.ts     # React hooks for engagement data
    ├── firebase-mock.ts     # Mock Firebase for development
    └── cn.ts                # Tailwind class merge utility
```

## Screens Overview

### Feed (Home Tab)
- Green header with HustleWall branding and "Live" indicator
- Filter button to show/hide area and skill filters
- Pull-to-refresh functionality
- Post cards with live view/share/endorsement counts
- Animated metric updates with haptic feedback
- Safety disclaimer at bottom

### Post Creation (Create Tab)
- Photo capture or gallery selection
- Caption input
- Skill tag picker (max 3)
- Area selector
- Privacy notice about location

### Profile (Profile Tab)
- Real-time user stats: views, shares, endorsements
- Animated stat updates with visual feedback
- "Live" indicator showing real-time tracking
- Recent posts horizontal scroll
- Recent endorsements received
- Account age display
- Logout option

### Post Detail
- Full-size media
- Skills and caption
- Live engagement stats (views, shares, endorsements)
- Unique viewers and 24h views analytics
- Worker profile link
- WhatsApp and Call contact buttons
- Endorsement form (with duplicate prevention)
- Endorsement list with timestamps
- Safety tips

### Worker Profile View
- Profile card with real-time stats
- Contact buttons
- Complete work history
- Endorsements received (traceable)
- Endorsements given (shows credibility)
- Safety verification notice

### Auth Flow
- Phone number entry (+234 format)
- OTP verification via SMS (Firebase Auth)
- 30-second resend timer
- Profile creation for new users
- Carrier detection (MTN, Glo, Airtel, 9mobile)

## Phone Authentication (OTP)

### Current Implementation (Demo Mode)
The app includes a mock Firebase implementation for development:
- Enter any valid Nigerian phone number (+234XXXXXXXXXX)
- Use code `123456` or any 6-digit code to verify
- Simulates network delays and occasional failures

### Production Setup (Firebase)
To enable real SMS OTP verification:

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project or use existing
   - Enable Phone Authentication in Authentication > Sign-in method

2. **Add Environment Variables** (in Vibecode ENV tab)
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. **For Production Build**
   After publishing, install Firebase packages:
   ```bash
   npx expo install @react-native-firebase/app @react-native-firebase/auth
   ```

### Nigerian Network Considerations
- SMS delivery can take 30-60 seconds on busy networks
- Users should disable DND (Do Not Disturb) for OTP receipt
- App detects carrier (MTN, Glo, Airtel, 9mobile) from phone prefix
- Resend button activates after 30 seconds

### Security Best Practices
- OTP codes expire after 5 minutes
- Rate limiting prevents brute force attempts
- Phone numbers stored in +234 international format
- No precise location data collected

## Design Principles

- **Mobile-First**: Optimized for Nigerian mobile users
- **Clean Nigerian UX**: Simple, minimal friction
- **Zero Capital**: Free to use, grows organically
- **Trust Building**: Traceable endorsements, view counts, account age
- **Safety First**: No precise locations, clear disclaimers
- **Real-Time**: Live engagement tracking builds trust and excitement

## Color Palette

- Primary: Emerald (#059669, #047857)
- Accent: Amber (#f59e0b) for endorsements
- Success: Green (#10b981)
- Contact: Blue (#3b82f6) for calls
- Background: Gray (#f9fafb)
- Text: Gray (#111827, #6b7280, #9ca3af)

## Nigerian Areas Supported

Lagos: Island, Mainland, Ikeja, Lekki, VI, Surulere, Yaba, Ikorodu, Ajah
Abuja: Central, Wuse, Garki, Maitama, Gwarinpa
Others: Port Harcourt, Ibadan, Kano, Kaduna, Enugu, Benin City, Warri, Owerri, Calabar, Jos, Abeokuta

## Skill Categories

Trades: Electrician, Plumber, Carpenter, Painter, Mason, Tiler, Welder
Tech: AC Technician, Generator Repair, Phone Repair, Laptop Repair
Fashion: Tailor, Fashion Designer, Hair Stylist, Barber, Makeup Artist
Food: Chef, Caterer
Transport: Driver, Dispatch Rider
Home: Cleaner, Security, Gardener
Construction: POP Installer, Aluminium Fabricator, Furniture Maker, Upholstery
Auto: Mechanic, Panel Beater, Vulcanizer
Events: Photographer, Videographer, DJ, Event Planner, Decorator

## Zero-Capital Implementation Notes

1. **No backend required initially**: Uses Zustand with AsyncStorage for local persistence
2. **Organic growth via sharing**: Native share to WhatsApp/Status
3. **Free hosting**: Can deploy as PWA or via Expo
4. **No payment processing**: Direct WhatsApp/phone contact between parties
5. **User-generated content**: Workers create their own marketing material
6. **Viral mechanics**: View counts, shareable posts, endorsement chains
7. **Real-time engagement**: Live tracking creates excitement and trust

## Production Backend (Future)

For production-scale deployment with real-time sync across devices:

1. **Firebase Realtime Database or Firestore**
   - Replace AsyncStorage with Firebase SDK
   - Enable real-time listeners for cross-device sync
   - Use Firebase Security Rules for fraud prevention

2. **Recommended Structure**
   ```
   /posts/{postId}
   /profiles/{userId}
   /engagement/views/{postId}/{odifiedUserId}
   /engagement/shares/{postId}/{shareId}
   /engagement/endorsements/{postId}/{fromUserId}
   ```

3. **Security Rules**
   - Validate view cooldowns server-side
   - Enforce one endorsement per user per post
   - Rate limit write operations
