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

  // Actions
  login: (profile: Profile) => void;
  logout: () => void;
  addPost: (post: Post) => void;
  incrementViewCount: (postId: string) => void;
  addProfile: (profile: Profile) => void;
  updateProfile: (userId: string, updates: Partial<Profile>) => void;
  addEndorsement: (endorsement: Endorsement) => void;
  getPostsByUser: (userId: string) => Post[];
  getProfileById: (userId: string) => Profile | undefined;
  getEndorsementsByUser: (userId: string) => Endorsement[];
  getEndorsementsGivenByUser: (userId: string) => Endorsement[];
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

// Generate mock data
const generateMockData = () => {
  const mockProfiles: Profile[] = [
    {
      id: 'user1',
      phone: '+2348012345678',
      name: 'Chidi Okonkwo',
      whatsapp: '+2348012345678',
      skills: ['Electrician', 'AC Technician'],
      area: 'Lekki',
      createdAt: '2024-08-15T10:00:00Z',
      endorsementCount: 12,
    },
    {
      id: 'user2',
      phone: '+2348023456789',
      name: 'Amaka Johnson',
      whatsapp: '+2348023456789',
      skills: ['Hair Stylist', 'Makeup Artist'],
      area: 'Victoria Island',
      createdAt: '2024-09-20T14:30:00Z',
      endorsementCount: 28,
    },
    {
      id: 'user3',
      phone: '+2348034567890',
      name: 'Emeka Nwosu',
      whatsapp: '+2348034567890',
      skills: ['Plumber', 'Tiler'],
      area: 'Ikeja',
      createdAt: '2024-07-10T09:15:00Z',
      endorsementCount: 8,
    },
    {
      id: 'user4',
      phone: '+2348045678901',
      name: 'Fatima Bello',
      whatsapp: '+2348045678901',
      skills: ['Tailor', 'Fashion Designer'],
      area: 'Surulere',
      createdAt: '2024-10-01T11:45:00Z',
      endorsementCount: 15,
    },
    {
      id: 'user5',
      phone: '+2348056789012',
      name: 'Kunle Adeyemi',
      whatsapp: '+2348056789012',
      skills: ['Auto Mechanic', 'Panel Beater'],
      area: 'Yaba',
      createdAt: '2024-06-05T08:00:00Z',
      endorsementCount: 22,
    },
  ];

  const mockPosts: Post[] = [
    {
      id: 'post1',
      userId: 'user1',
      mediaUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800',
      mediaType: 'photo',
      caption: 'Just completed full house wiring for a 4-bedroom duplex in Lekki Phase 1. Quality work, no shortcuts! Call me for your electrical needs.',
      skills: ['Electrician'],
      area: 'Lekki',
      viewCount: 234,
      createdAt: '2024-12-01T15:30:00Z',
    },
    {
      id: 'post2',
      userId: 'user2',
      mediaUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
      mediaType: 'photo',
      caption: 'Bridal makeup and styling for my client. She looked absolutely stunning! Book me for your special day.',
      skills: ['Makeup Artist', 'Hair Stylist'],
      area: 'Victoria Island',
      viewCount: 567,
      createdAt: '2024-12-02T10:00:00Z',
    },
    {
      id: 'post3',
      userId: 'user3',
      mediaUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800',
      mediaType: 'photo',
      caption: 'Bathroom renovation completed today. New tiles, new pipes, everything fresh! No leaks guaranteed.',
      skills: ['Plumber', 'Tiler'],
      area: 'Ikeja',
      viewCount: 189,
      createdAt: '2024-12-03T14:20:00Z',
    },
    {
      id: 'post4',
      userId: 'user4',
      mediaUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
      mediaType: 'photo',
      caption: 'Custom agbada and matching cap for a client. Traditional wear with modern touches. DM for orders!',
      skills: ['Tailor', 'Fashion Designer'],
      area: 'Surulere',
      viewCount: 412,
      createdAt: '2024-12-04T09:45:00Z',
    },
    {
      id: 'post5',
      userId: 'user5',
      mediaUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800',
      mediaType: 'photo',
      caption: 'Toyota Camry engine overhaul complete. This car was knocking bad, now it runs smooth like butter!',
      skills: ['Auto Mechanic'],
      area: 'Yaba',
      viewCount: 321,
      createdAt: '2024-12-05T16:00:00Z',
    },
    {
      id: 'post6',
      userId: 'user1',
      mediaUrl: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=800',
      mediaType: 'photo',
      caption: 'AC installation and servicing. Beat the Lagos heat with properly working AC. Weekend availability!',
      skills: ['AC Technician'],
      area: 'Lekki',
      viewCount: 156,
      createdAt: '2024-12-06T11:30:00Z',
    },
  ];

  const mockEndorsements: Endorsement[] = [
    {
      id: 'end1',
      fromUserId: 'user2',
      toUserId: 'user1',
      postId: 'post1',
      message: 'Chidi did excellent work at my aunty\'s house. Very professional!',
      createdAt: '2024-12-02T09:00:00Z',
    },
    {
      id: 'end2',
      fromUserId: 'user3',
      toUserId: 'user1',
      postId: 'post6',
      message: 'Fixed my AC same day I called. Highly recommend!',
      createdAt: '2024-12-07T10:00:00Z',
    },
    {
      id: 'end3',
      fromUserId: 'user1',
      toUserId: 'user2',
      postId: 'post2',
      message: 'My wife used Amaka for her birthday party. Amazing work!',
      createdAt: '2024-12-03T15:00:00Z',
    },
  ];

  return { mockProfiles, mockPosts, mockEndorsements };
};

const { mockProfiles, mockPosts, mockEndorsements } = generateMockData();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      posts: mockPosts,
      profiles: mockProfiles,
      endorsements: mockEndorsements,

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
        const profile = state.profiles.find(p => p.id === endorsement.toUserId);
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
    }),
    {
      name: 'hustlewall-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        posts: state.posts,
        profiles: state.profiles,
        endorsements: state.endorsements,
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
