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

### Safety Features
- No precise location sharing - only broad area displayed
- Clear safety disclaimers throughout the app
- Traceable endorsement history for accountability
- Public endorser profiles to verify credibility

### User Flow
1. Sign up via phone + OTP verification
2. Post proof-of-work with photo, skills, and area
3. Profile auto-created with first post
4. Browse feed, filter by area/skill
5. View worker profiles with full history
6. Contact via WhatsApp or phone
7. Leave endorsements after work completed
8. Share posts to drive organic growth

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
│   │   ├── index.tsx        # Feed screen
│   │   ├── create.tsx       # Post creation
│   │   └── profile.tsx      # User's own profile
│   ├── auth.tsx             # Phone + OTP auth
│   ├── post/[id].tsx        # Post detail with endorsements
│   ├── profile/[id].tsx     # Worker profile view
│   └── settings.tsx         # App settings
├── components/
│   └── PostCard.tsx         # Feed post card component
└── lib/
    ├── store.ts             # Zustand store with mock data
    └── cn.ts                # Tailwind class merge utility
```

## Screens Overview

### Feed (Home Tab)
- Green header with HustleWall branding
- Filter button to show/hide area and skill filters
- Pull-to-refresh functionality
- Post cards with media, skills, profile info, and share button
- Safety disclaimer at bottom

### Post Creation (Create Tab)
- Photo capture or gallery selection
- Caption input
- Skill tag picker (max 3)
- Area selector
- Privacy notice about location

### Profile (Profile Tab)
- User stats: posts, endorsements, total views
- Recent posts horizontal scroll
- Recent endorsements received
- Account age display
- Logout option

### Post Detail
- Full-size media
- Skills and caption
- Worker profile link
- WhatsApp and Call contact buttons
- Endorsement form and list
- Safety tips

### Worker Profile View
- Profile card with stats
- Contact buttons
- Complete work history
- Endorsements received (traceable)
- Endorsements given (shows credibility)
- Safety verification notice

### Auth Flow
- Phone number entry (+234 format)
- OTP verification (demo: 1234)
- Profile creation for new users

## Design Principles

- **Mobile-First**: Optimized for Nigerian mobile users
- **Clean Nigerian UX**: Simple, minimal friction
- **Zero Capital**: Free to use, grows organically
- **Trust Building**: Traceable endorsements, view counts, account age
- **Safety First**: No precise locations, clear disclaimers

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
