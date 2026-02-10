/**
 * Supabase Data Hooks for Zovo
 *
 * Hooks to fetch and manage data from Supabase database
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured, DBPost, DBUser, subscribeToAllPosts } from '../supabase';

// Transform database post to app post format
export interface AppPost {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption: string;
  skills: string[];
  area: string;
  viewCount: number;
  shareCount: number;
  endorsementCount: number;
  createdAt: string;
}

export interface AppProfile {
  id: string;
  phone: string;
  name: string;
  whatsapp: string;
  skills: string[];
  area: string;
  createdAt: string;
  endorsementCount: number;
  totalViews: number;
  totalShares: number;
}

const transformDBPostToAppPost = (dbPost: DBPost): AppPost => ({
  id: dbPost.id,
  userId: dbPost.user_id,
  mediaUrl: dbPost.media_url,
  mediaType: dbPost.media_type,
  caption: dbPost.caption,
  skills: dbPost.skills,
  area: dbPost.area,
  viewCount: dbPost.view_count,
  shareCount: dbPost.share_count,
  endorsementCount: dbPost.endorsement_count,
  createdAt: dbPost.created_at,
});

const transformDBUserToAppProfile = (dbUser: DBUser): AppProfile => ({
  id: dbUser.id,
  phone: dbUser.phone,
  name: dbUser.name,
  whatsapp: dbUser.whatsapp,
  skills: dbUser.skills,
  area: dbUser.area,
  createdAt: dbUser.created_at,
  endorsementCount: dbUser.total_endorsements,
  totalViews: dbUser.total_views,
  totalShares: dbUser.total_shares,
});

/**
 * Hook to fetch posts from Supabase with real-time updates and pagination
 */
export function useSupabasePosts(options?: {
  area?: string;
  skill?: string;
  userId?: string;
  limit?: number;
  pageSize?: number;
}) {
  const [posts, setPosts] = useState<AppPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const pageSize = options?.pageSize || 20;

  const fetchPosts = useCallback(async (reset = true) => {
    if (!isSupabaseConfigured() || !supabase) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 0 : page;
      const offset = currentPage * pageSize;

      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (options?.area) {
        query = query.ilike('area', `%${options.area}%`);
      }

      if (options?.skill) {
        query = query.contains('skills', [options.skill]);
      }

      if (options?.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.log('Error fetching posts:', fetchError);
        setError(fetchError.message);
      } else {
        const newPosts = (data || []).map(transformDBPostToAppPost);
        if (reset) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
        setHasMore(newPosts.length === pageSize);
        setError(null);
      }
    } catch (err) {
      console.log('Error fetching posts:', err);
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [options?.area, options?.skill, options?.userId, options?.limit, page, pageSize]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loadingMore, hasMore]);

  // Initial fetch
  useEffect(() => {
    fetchPosts(true);
  }, [options?.area, options?.skill, options?.userId]);

  // Load more when page changes
  useEffect(() => {
    if (page > 0) {
      fetchPosts(false);
    }
  }, [page]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const unsubscribe = subscribeToAllPosts((dbPost, eventType) => {
      if (eventType === 'INSERT') {
        const newPost = transformDBPostToAppPost(dbPost);
        // Check if post matches filters
        if (options?.area && !newPost.area.toLowerCase().includes(options.area.toLowerCase())) return;
        if (options?.skill && !newPost.skills.includes(options.skill)) return;
        if (options?.userId && newPost.userId !== options.userId) return;

        setPosts(prev => [newPost, ...prev]);
      } else if (eventType === 'UPDATE') {
        setPosts(prev => prev.map(p =>
          p.id === dbPost.id ? transformDBPostToAppPost(dbPost) : p
        ));
      } else if (eventType === 'DELETE') {
        setPosts(prev => prev.filter(p => p.id !== dbPost.id));
      }
    });

    return unsubscribe;
  }, [options?.area, options?.skill, options?.userId]);

  return { posts, loading, loadingMore, error, hasMore, refetch: () => fetchPosts(true), loadMore };
}

/**
 * Hook to fetch profiles from Supabase
 */
export function useSupabaseProfiles(options?: {
  limit?: number;
}) {
  const [profiles, setProfiles] = useState<AppProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('users')
        .select('*')
        .order('total_endorsements', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.log('Error fetching profiles:', fetchError);
        setError(fetchError.message);
      } else {
        setProfiles((data || []).map(transformDBUserToAppProfile));
        setError(null);
      }
    } catch (err) {
      console.log('Error fetching profiles:', err);
      setError('Failed to fetch profiles');
    } finally {
      setLoading(false);
    }
  }, [options?.limit]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return { profiles, loading, error, refetch: fetchProfiles };
}

/**
 * Hook to fetch a single profile by ID
 */
export function useSupabaseProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.log('Error fetching profile:', fetchError);
        setError(fetchError.message);
        setProfile(null);
      } else if (data) {
        setProfile(transformDBUserToAppProfile(data));
        setError(null);
      }
    } catch (err) {
      console.log('Error fetching profile:', err);
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

/**
 * Hook to fetch leaderboard data
 */
export function useSupabaseLeaderboard(limit: number = 20) {
  const [leaderboard, setLeaderboard] = useState<AppProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch users ordered by total endorsements (engagement score)
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('total_endorsements', { ascending: false })
        .limit(limit);

      if (fetchError) {
        console.log('Error fetching leaderboard:', fetchError);
        setError(fetchError.message);
      } else {
        setLeaderboard((data || []).map(transformDBUserToAppProfile));
        setError(null);
      }
    } catch (err) {
      console.log('Error fetching leaderboard:', err);
      setError('Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { leaderboard, loading, error, refetch: fetchLeaderboard };
}
