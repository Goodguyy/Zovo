/**
 * Supabase Client Configuration for HustleWall
 *
 * This module provides the Supabase client for real-time data,
 * authentication, and database operations.
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment variables - set these in your Vibecode ENV tab
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase credentials not configured. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your ENV tab.'
  );
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});


// Types for database tables
export interface DBUser {
  id: string;
  phone: string;
  name: string;
  whatsapp: string;
  skills: string[];
  area: string;
  created_at: string;
  updated_at: string;
  total_views: number;
  total_shares: number;
  total_endorsements: number;
  device_fingerprint: string | null;
}

export interface DBPost {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'photo' | 'video';
  caption: string;
  skills: string[];
  area: string;
  view_count: number;
  share_count: number;
  endorsement_count: number;
  trending_score: number;
  created_at: string;
  updated_at: string;
}

export interface DBEngagement {
  id: string;
  post_id: string;
  user_id: string;
  type: 'view' | 'share' | 'endorsement';
  platform: string | null;
  message: string | null;
  device_fingerprint: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface DBLeaderboardEntry {
  user_id: string;
  user_name: string;
  user_skills: string[];
  user_area: string;
  total_views: number;
  total_shares: number;
  total_endorsements: number;
  engagement_score: number;
  rank: number;
}

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Device fingerprint for fraud prevention
let cachedFingerprint: string | null = null;

export const getDeviceFingerprint = async (): Promise<string> => {
  if (cachedFingerprint) return cachedFingerprint;

  try {
    let fingerprint = await AsyncStorage.getItem('device_fingerprint');
    if (!fingerprint) {
      fingerprint = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('device_fingerprint', fingerprint);
    }
    cachedFingerprint = fingerprint;
    return fingerprint;
  } catch (error) {
    console.log('Error getting device fingerprint:', error);
    return `temp_${Date.now()}`;
  }
};

// Real-time subscription helper
export type RealtimeCallback<T> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
}) => void;

export const subscribeToTable = <T,>(
  table: string,
  callback: RealtimeCallback<T>,
  filter?: { column: string; value: string }
) => {
  const config: any = {
    event: '*',
    schema: 'public',
    table,
  };

  if (filter) {
    config.filter = `${filter.column}=eq.${filter.value}`;
  }

  const channel = supabase.channel(`${table}_changes`).on(
    'postgres_changes',
    config,
    (payload: any) => {
      callback({
        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        new: payload.new as T | null,
        old: payload.old as T | null,
      });
    }
  );

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to post engagement updates
export const subscribeToPostEngagement = (
  postId: string,
  callback: (post: DBPost) => void
) => {
  return subscribeToTable<DBPost>(
    'posts',
    (payload) => {
      if (payload.new && payload.new.id === postId) {
        callback(payload.new);
      }
    },
    { column: 'id', value: postId }
  );
};

// Subscribe to all posts for feed
export const subscribeToAllPosts = (callback: (post: DBPost, eventType: string) => void) => {
  const channel = supabase
    .channel('posts_feed')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'posts' } as any,
      (payload: any) => {
        const post = (payload.new || payload.old) as DBPost;
        if (post) {
          callback(post, payload.eventType);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to leaderboard updates
export const subscribeToLeaderboard = (
  callback: (entries: DBLeaderboardEntry[]) => void
) => {
  const channel = supabase
    .channel('leaderboard_updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'leaderboard_weekly' } as any,
      async () => {
        // Fetch updated leaderboard
        const { data } = await supabase.rpc('get_weekly_leaderboard', { p_limit: 20 });
        if (data) {
          callback(data as DBLeaderboardEntry[]);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to user stats updates
export const subscribeToUserStats = (
  userId: string,
  callback: (user: DBUser) => void
) => {
  return subscribeToTable<DBUser>(
    'users',
    (payload) => {
      if (payload.new && payload.new.id === userId) {
        callback(payload.new);
      }
    },
    { column: 'id', value: userId }
  );
};

export default supabase;
