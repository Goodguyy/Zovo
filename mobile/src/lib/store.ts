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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      posts: [],
      profiles: [],
      endorsements: [],

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
      name: 'zovo-storage',
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
