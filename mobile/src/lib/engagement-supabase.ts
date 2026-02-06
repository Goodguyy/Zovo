/**
 * Supabase-backed Engagement Tracking Service for HustleWall
 *
 * Replaces the AsyncStorage-based engagement system with real-time Supabase
 * Provides fraud prevention, cooldowns, and rate limiting
 */

import { supabase, getDeviceFingerprint, DBEngagement, DBPost } from './supabase';

// Constants
const VIEW_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const MAX_VIEWS_PER_HOUR = 100;

// Engagement result types
export interface ViewRecord {
  postId: string;
  userId: string;
  timestamp: number;
  deviceId?: string;
}

export interface ShareRecord {
  postId: string;
  userId: string;
  timestamp: number;
  platform: 'whatsapp' | 'link' | 'other';
}

export interface EndorsementRecord {
  id: string;
  postId: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  timestamp: number;
}

export interface PostEngagement {
  viewCount: number;
  shareCount: number;
  endorsementCount: number;
  lastUpdated: number;
}

// Track view with Supabase (triggers function on backend)
export const recordView = async (
  postId: string,
  userId: string
): Promise<{ success: boolean; message: string }> => {
  if (!userId) {
    return { success: false, message: 'User not authenticated' };
  }

  try {
    const deviceFingerprint = await getDeviceFingerprint();

    // Call Supabase function to handle view recording with fraud prevention
    const { data, error } = await supabase.rpc('record_view', {
      p_user_id: userId,
      p_post_id: postId,
      p_device_fingerprint: deviceFingerprint,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (data && data.success) {
      return { success: true, message: data.message };
    }

    return { success: false, message: data?.message || 'Failed to record view' };
  } catch (error) {
    console.log('Error recording view:', error);
    return { success: false, message: 'Error recording view' };
  }
};

// Track share with Supabase
export const recordShare = async (
  postId: string,
  userId: string,
  platform: ShareRecord['platform'] = 'other'
): Promise<{ success: boolean; shareCount?: number; message?: string }> => {
  if (!userId) {
    return { success: false, message: 'User not authenticated', shareCount: 0 };
  }

  try {
    const { data, error } = await supabase.rpc('record_share', {
      p_user_id: userId,
      p_post_id: postId,
      p_platform: platform,
    });

    if (error) {
      return { success: false, message: error.message, shareCount: 0 };
    }

    if (data && data.success) {
      return { success: true, shareCount: 0, message: 'Share recorded' };
    }

    return { success: false, message: data?.message || 'Failed to record share', shareCount: 0 };
  } catch (error) {
    console.log('Error recording share:', error);
    return { success: false, message: 'Error recording share', shareCount: 0 };
  }
};

// Check if user can endorse
export const canEndorse = (
  postId: string,
  userId: string,
  postOwnerId: string
): { canEndorse: boolean; reason?: string } => {
  if (!userId) {
    return { canEndorse: false, reason: 'Please log in to endorse' };
  }

  if (userId === postOwnerId) {
    return { canEndorse: false, reason: "You can't endorse your own work" };
  }

  return { canEndorse: true };
};

// Check if user has already endorsed (requires fetching from DB)
export const hasUserEndorsed = async (
  postId: string,
  userId: string
): Promise<boolean> => {
  try {
    const { count } = await supabase
      .from('engagement')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'endorsement');

    return (count ?? 0) > 0;
  } catch (error) {
    console.log('Error checking endorsement:', error);
    return false;
  }
};

// Record endorsement with Supabase
export const recordEndorsement = async (
  postId: string,
  fromUserId: string,
  toUserId: string,
  message: string
): Promise<{ success: boolean; endorsement?: any; error?: string }> => {
  const check = canEndorse(postId, fromUserId, toUserId);
  if (!check.canEndorse) {
    return { success: false, error: check.reason };
  }

  // Check if already endorsed
  const alreadyEndorsed = await hasUserEndorsed(postId, fromUserId);
  if (alreadyEndorsed) {
    return { success: false, error: 'You already endorsed this post' };
  }

  try {
    const { data, error } = await supabase.rpc('record_endorsement', {
      p_user_id: fromUserId,
      p_post_id: postId,
      p_message: message.trim(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data && data.success) {
      return { success: true, endorsement: { message, createdAt: new Date().toISOString() } };
    }

    return { success: false, error: data?.error || 'Failed to submit endorsement' };
  } catch (error) {
    console.log('Error recording endorsement:', error);
    return { success: false, error: 'Error submitting endorsement' };
  }
};

// Get post engagement stats from Supabase
export const getPostEngagement = async (postId: string): Promise<PostEngagement> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('view_count, share_count, endorsement_count')
      .eq('id', postId)
      .single();

    if (error) throw error;

    return {
      viewCount: data?.view_count ?? 0,
      shareCount: data?.share_count ?? 0,
      endorsementCount: data?.endorsement_count ?? 0,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.log('Error getting engagement:', error);
    return {
      viewCount: 0,
      shareCount: 0,
      endorsementCount: 0,
      lastUpdated: Date.now(),
    };
  }
};

// Get endorsements for a post
export const getPostEndorsements = async (postId: string): Promise<EndorsementRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('engagement')
      .select('*')
      .eq('post_id', postId)
      .eq('type', 'endorsement')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((e: any) => ({
      id: e.id,
      postId: e.post_id,
      fromUserId: e.user_id,
      toUserId: e.post_id, // Would need post user_id
      message: e.message,
      timestamp: new Date(e.created_at).getTime(),
    }));
  } catch (error) {
    console.log('Error getting endorsements:', error);
    return [];
  }
};

// Get endorsements received by user
export const getUserEndorsementsReceived = async (userId: string) => {
  try {
    const { data: userPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', userId);

    if (!userPosts || userPosts.length === 0) return [];

    const postIds = userPosts.map((p) => p.id);

    const { data, error } = await supabase
      .from('engagement')
      .select('*')
      .in('post_id', postIds)
      .eq('type', 'endorsement')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data ?? [];
  } catch (error) {
    console.log('Error getting endorsements received:', error);
    return [];
  }
};

// Get unique viewers count
export const getUniqueViewers = async (postId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('engagement')
      .select('user_id', { count: 'exact' })
      .eq('post_id', postId)
      .eq('type', 'view');

    if (error) throw error;

    // Count unique users
    const uniqueUsers = new Set((data ?? []).map((e: any) => e.user_id));
    return uniqueUsers.size;
  } catch (error) {
    console.log('Error getting unique viewers:', error);
    return 0;
  }
};

// Get recent views count
export const getRecentViews = async (postId: string, hours: number = 24): Promise<number> => {
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('engagement')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('type', 'view')
      .gte('created_at', cutoff);

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    console.log('Error getting recent views:', error);
    return 0;
  }
};

// Subscribe to post engagement changes
export const subscribeToPostEngagement = (
  postId: string,
  callback: (engagement: PostEngagement) => void
) => {
  const channel = supabase
    .channel(`post_${postId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'posts', filter: `id=eq.${postId}` },
      async (payload: any) => {
        const engagement = await getPostEngagement(postId);
        callback(engagement);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Get trending posts
export const getTrendingPosts = async (
  hours: number = 24,
  limit: number = 10
): Promise<DBPost[]> => {
  try {
    const { data, error } = await supabase.rpc('get_trending_posts', {
      p_hours: hours,
      p_limit: limit,
    });

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.log('Error getting trending posts:', error);
    return [];
  }
};

export default {
  recordView,
  recordShare,
  recordEndorsement,
  getPostEngagement,
  getPostEndorsements,
  getUserEndorsementsReceived,
  getUniqueViewers,
  getRecentViews,
  getTrendingPosts,
  subscribeToPostEngagement,
};
