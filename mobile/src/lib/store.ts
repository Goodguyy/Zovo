import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface Post {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption: string;
  skills: string[];
  area: string;
  viewCount: number;
  shareCount: number;
  createdAt: string;
}

export interface Profile {
  id: string;
  phone: string;
  name: string;
  whatsapp: string;
  skills: string[];
  area: string;
  createdAt: string;
  endorsementCount: number;
}

export interface Endorsement {
  id: string;
  fromUserId: string;
  toUserId: string;
  postId: string;
  message: string;
  createdAt: string;
}

interface AppState {
  // Auth
  currentUser: Profile | null;
  isAuthenticated: boolean;

  // Data
  posts: Post[];
  profiles: Profile[];
  endorsements: Endorsement[];

  // Seed status
  isSeeded: boolean;

  // Actions
  login: (profile: Profile) => void;
  logout: () => void;
  addPost: (post: Post) => void;
  incrementViewCount: (postId: string) => void;
  incrementShareCount: (postId: string) => void;
  addProfile: (profile: Profile) => void;
  updateProfile: (userId: string, updates: Partial<Profile>) => void;
  addEndorsement: (endorsement: Endorsement) => void;
  getPostsByUser: (userId: string) => Post[];
  getProfileById: (userId: string) => Profile | undefined;
  getEndorsementsByUser: (userId: string) => Endorsement[];
  getEndorsementsGivenByUser: (userId: string) => Endorsement[];
  initializeSeedData: () => void;
}

// Nigerian areas for filtering
export const NIGERIAN_AREAS = [
  'Lagos Island',
  'Lagos Mainland',
  'Ikeja',
  'Lekki',
  'Victoria Island',
  'Surulere',
  'Yaba',
  'Ikorodu',
  'Ajah',
  'Abuja Central',
  'Wuse',
  'Garki',
  'Maitama',
  'Gwarinpa',
  'Port Harcourt',
  'Ibadan',
  'Kano',
  'Kaduna',
  'Enugu',
  'Benin City',
  'Warri',
  'Owerri',
  'Calabar',
  'Jos',
  'Abeokuta',
];

// Common skill tags
export const SKILL_TAGS = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Mason',
  'Tiler',
  'Welder',
  'AC Technician',
  'Generator Repair',
  'Phone Repair',
  'Laptop Repair',
  'Tailor',
  'Fashion Designer',
  'Hair Stylist',
  'Barber',
  'Makeup Artist',
  'Chef',
  'Caterer',
  'Driver',
  'Dispatch Rider',
  'Cleaner',
  'Security',
  'Gardener',
  'POP Installer',
  'Aluminium Fabricator',
  'Furniture Maker',
  'Upholstery',
  'Auto Mechanic',
  'Panel Beater',
  'Vulcanizer',
  'Photographer',
  'Videographer',
  'DJ',
  'Event Planner',
  'Decorator',
];

// Initial seed profiles - 5 real Nigerian workers
const SEED_PROFILES: Profile[] = [
  {
    id: 'user_chidi_001',
    phone: '+2348012345678',
    name: 'Chidi Okonkwo',
    whatsapp: '+2348012345678',
    skills: ['Electrician', 'AC Technician'],
    area: 'Lekki',
    createdAt: '2024-08-15T10:00:00Z',
    endorsementCount: 3,
  },
  {
    id: 'user_amaka_002',
    phone: '+2348023456789',
    name: 'Amaka Johnson',
    whatsapp: '+2348023456789',
    skills: ['Hair Stylist', 'Makeup Artist'],
    area: 'Victoria Island',
    createdAt: '2024-09-20T14:30:00Z',
    endorsementCount: 5,
  },
  {
    id: 'user_emeka_003',
    phone: '+2348034567890',
    name: 'Emeka Nwosu',
    whatsapp: '+2348034567890',
    skills: ['Plumber', 'Tiler'],
    area: 'Ikeja',
    createdAt: '2024-07-10T09:15:00Z',
    endorsementCount: 2,
  },
  {
    id: 'user_fatima_004',
    phone: '+2348045678901',
    name: 'Fatima Bello',
    whatsapp: '+2348045678901',
    skills: ['Tailor', 'Fashion Designer'],
    area: 'Surulere',
    createdAt: '2024-10-01T11:45:00Z',
    endorsementCount: 4,
  },
  {
    id: 'user_kunle_005',
    phone: '+2348056789012',
    name: 'Kunle Adeyemi',
    whatsapp: '+2348056789012',
    skills: ['Auto Mechanic', 'Panel Beater'],
    area: 'Yaba',
    createdAt: '2024-06-05T08:00:00Z',
    endorsementCount: 6,
  },
];

// Initial seed posts - realistic work showcases
const SEED_POSTS: Post[] = [
  // Chidi - Electrician
  {
    id: 'post_chidi_001',
    userId: 'user_chidi_001',
    mediaUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
    mediaType: 'photo',
    caption: 'Just completed full house wiring for a 4-bedroom duplex in Lekki Phase 1. All cables properly concealed, DB board installed with surge protection. Quality work, no shortcuts! Available for residential and commercial electrical jobs.',
    skills: ['Electrician'],
    area: 'Lekki',
    viewCount: 45,
    shareCount: 3,
    createdAt: '2025-01-28T15:30:00Z',
  },
  {
    id: 'post_chidi_002',
    userId: 'user_chidi_001',
    mediaUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',
    mediaType: 'photo',
    caption: 'AC installation and servicing completed today. Split unit properly mounted, copper pipes insulated, and drainage sorted. Beat the Lagos heat with a properly working AC! Weekend appointments available.',
    skills: ['AC Technician'],
    area: 'Lekki',
    viewCount: 32,
    shareCount: 2,
    createdAt: '2025-02-01T11:30:00Z',
  },
  // Amaka - Hair Stylist & Makeup Artist
  {
    id: 'post_amaka_001',
    userId: 'user_amaka_002',
    mediaUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
    mediaType: 'photo',
    caption: 'Bridal glam for my beautiful client! Full beat makeup with lashes, and elegant updo hairstyle. She looked absolutely stunning on her special day. Book early for wedding season - slots filling up fast!',
    skills: ['Makeup Artist', 'Hair Stylist'],
    area: 'Victoria Island',
    viewCount: 128,
    shareCount: 12,
    createdAt: '2025-01-25T10:00:00Z',
  },
  {
    id: 'post_amaka_002',
    userId: 'user_amaka_002',
    mediaUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
    mediaType: 'photo',
    caption: 'Knotless braids done for a client today. Clean partings, no tension on the edges. I specialize in protective styles that keep your natural hair healthy. Home service available in VI and Lekki.',
    skills: ['Hair Stylist'],
    area: 'Victoria Island',
    viewCount: 89,
    shareCount: 7,
    createdAt: '2025-02-03T14:20:00Z',
  },
  // Emeka - Plumber & Tiler
  {
    id: 'post_emeka_001',
    userId: 'user_emeka_003',
    mediaUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
    mediaType: 'photo',
    caption: 'Complete bathroom renovation finished today in Ikeja GRA. New toilet, shower, tiles from floor to ceiling. No leaks guaranteed! From demolition to final polish, I handle everything.',
    skills: ['Plumber', 'Tiler'],
    area: 'Ikeja',
    viewCount: 56,
    shareCount: 4,
    createdAt: '2025-01-30T09:45:00Z',
  },
  {
    id: 'post_emeka_002',
    userId: 'user_emeka_003',
    mediaUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
    mediaType: 'photo',
    caption: 'Kitchen sink and water heater installation done. Proper PVC piping, no shortcuts. If your tap is dripping or you need new plumbing work, call me. Same day service for emergencies!',
    skills: ['Plumber'],
    area: 'Ikeja',
    viewCount: 38,
    shareCount: 2,
    createdAt: '2025-02-04T16:00:00Z',
  },
  // Fatima - Tailor & Fashion Designer
  {
    id: 'post_fatima_001',
    userId: 'user_fatima_004',
    mediaUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
    mediaType: 'photo',
    caption: 'Custom agbada set completed for a client. Hand-embroidered details, perfect fit. Traditional Nigerian wear with modern touches. DM for orders - I work with ankara, lace, and aso-oke.',
    skills: ['Tailor', 'Fashion Designer'],
    area: 'Surulere',
    viewCount: 95,
    shareCount: 8,
    createdAt: '2025-01-22T09:45:00Z',
  },
  {
    id: 'post_fatima_002',
    userId: 'user_fatima_004',
    mediaUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
    mediaType: 'photo',
    caption: 'Aso-ebi for a wedding party - 15 pieces delivered on time! I specialize in group orders for owambe. Consistent quality across all pieces. Book 3 weeks in advance for large orders.',
    skills: ['Tailor'],
    area: 'Surulere',
    viewCount: 72,
    shareCount: 5,
    createdAt: '2025-02-02T11:30:00Z',
  },
  // Kunle - Auto Mechanic & Panel Beater
  {
    id: 'post_kunle_001',
    userId: 'user_kunle_005',
    mediaUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800',
    mediaType: 'photo',
    caption: 'Toyota Camry engine overhaul completed. This car came in knocking badly - now it runs smooth like butter! Full timing belt replacement, new gaskets, and oil change. I specialize in Toyota and Honda.',
    skills: ['Auto Mechanic'],
    area: 'Yaba',
    viewCount: 67,
    shareCount: 4,
    createdAt: '2025-01-26T16:00:00Z',
  },
  {
    id: 'post_kunle_002',
    userId: 'user_kunle_005',
    mediaUrl: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800',
    mediaType: 'photo',
    caption: 'Panel beating and spray painting done on this Honda Accord. Accident damage completely fixed - you cannot even tell! Full body work, primer, and factory-match paint. Bring your damaged car, I will restore it.',
    skills: ['Panel Beater'],
    area: 'Yaba',
    viewCount: 84,
    shareCount: 6,
    createdAt: '2025-02-05T08:00:00Z',
  },
];

// Seed endorsements
const SEED_ENDORSEMENTS: Endorsement[] = [
  {
    id: 'end_001',
    fromUserId: 'user_amaka_002',
    toUserId: 'user_chidi_001',
    postId: 'post_chidi_001',
    message: 'Chidi did excellent work at my aunty\'s house. Very professional and neat!',
    createdAt: '2025-01-29T09:00:00Z',
  },
  {
    id: 'end_002',
    fromUserId: 'user_emeka_003',
    toUserId: 'user_chidi_001',
    postId: 'post_chidi_002',
    message: 'Fixed my AC same day I called. Highly recommend!',
    createdAt: '2025-02-02T10:00:00Z',
  },
  {
    id: 'end_003',
    fromUserId: 'user_chidi_001',
    toUserId: 'user_amaka_002',
    postId: 'post_amaka_001',
    message: 'My wife used Amaka for her birthday party. Amazing work!',
    createdAt: '2025-01-26T15:00:00Z',
  },
  {
    id: 'end_004',
    fromUserId: 'user_fatima_004',
    toUserId: 'user_amaka_002',
    postId: 'post_amaka_002',
    message: 'The braids lasted 6 weeks and still looked fresh. Will definitely book again.',
    createdAt: '2025-02-04T11:00:00Z',
  },
  {
    id: 'end_005',
    fromUserId: 'user_kunle_005',
    toUserId: 'user_emeka_003',
    postId: 'post_emeka_001',
    message: 'Emeka fixed my bathroom leak that 2 other plumbers couldn\'t solve. Real pro!',
    createdAt: '2025-01-31T14:00:00Z',
  },
  {
    id: 'end_006',
    fromUserId: 'user_amaka_002',
    toUserId: 'user_fatima_004',
    postId: 'post_fatima_001',
    message: 'Fatima made my owambe outfit and I received so many compliments!',
    createdAt: '2025-01-24T16:00:00Z',
  },
  {
    id: 'end_007',
    fromUserId: 'user_chidi_001',
    toUserId: 'user_kunle_005',
    postId: 'post_kunle_001',
    message: 'Kunle fixed my generator that Honda place said was beyond repair. Genius!',
    createdAt: '2025-01-28T09:00:00Z',
  },
  {
    id: 'end_008',
    fromUserId: 'user_emeka_003',
    toUserId: 'user_kunle_005',
    postId: 'post_kunle_002',
    message: 'My car looks brand new after Kunle\'s bodywork. Fair price too!',
    createdAt: '2025-02-06T10:00:00Z',
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      posts: [],
      profiles: [],
      endorsements: [],
      isSeeded: false,

      login: (profile) => set({ currentUser: profile, isAuthenticated: true }),

      logout: () => set({ currentUser: null, isAuthenticated: false }),

      addPost: (post) => set((state) => ({
        posts: [post, ...state.posts]
      })),

      incrementViewCount: (postId) => set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, viewCount: p.viewCount + 1 } : p
        ),
      })),

      incrementShareCount: (postId) => set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, shareCount: p.shareCount + 1 } : p
        ),
      })),

      addProfile: (profile) => set((state) => ({
        profiles: [...state.profiles, profile]
      })),

      updateProfile: (userId, updates) => set((state) => ({
        profiles: state.profiles.map((p) =>
          p.id === userId ? { ...p, ...updates } : p
        ),
        currentUser: state.currentUser?.id === userId
          ? { ...state.currentUser, ...updates }
          : state.currentUser,
      })),

      addEndorsement: (endorsement) => set((state) => {
        return {
          endorsements: [...state.endorsements, endorsement],
          profiles: state.profiles.map((p) =>
            p.id === endorsement.toUserId
              ? { ...p, endorsementCount: p.endorsementCount + 1 }
              : p
          ),
        };
      }),

      getPostsByUser: (userId) => get().posts.filter((p) => p.userId === userId),

      getProfileById: (userId) => get().profiles.find((p) => p.id === userId),

      getEndorsementsByUser: (userId) => get().endorsements.filter((e) => e.toUserId === userId),

      getEndorsementsGivenByUser: (userId) => get().endorsements.filter((e) => e.fromUserId === userId),

      initializeSeedData: () => {
        const state = get();
        if (!state.isSeeded && state.posts.length === 0) {
          set({
            profiles: SEED_PROFILES,
            posts: SEED_POSTS,
            endorsements: SEED_ENDORSEMENTS,
            isSeeded: true,
          });
        }
      },
    }),
    {
      name: 'zovo-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        posts: state.posts,
        profiles: state.profiles,
        endorsements: state.endorsements,
        isSeeded: state.isSeeded,
      }),
    }
  )
);

// Utility functions
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return `${diffMonths}mo ago`;
};

export const formatAccountAge = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffDays < 30) return `${diffDays} days`;
  if (diffMonths < 12) return `${diffMonths} months`;
  return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
