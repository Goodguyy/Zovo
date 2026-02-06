/**
 * Supabase Data Services for Zovo
 *
 * Service functions to create and update data in Supabase
 */

import { supabase, isSupabaseConfigured, DBPost, DBUser } from '../supabase';

/**
 * Create a new post in Supabase
 */
export async function createPost(post: {
  userId: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption: string;
  skills: string[];
  area: string;
}): Promise<{ success: boolean; postId?: string; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: post.userId,
        media_url: post.mediaUrl,
        media_type: post.mediaType,
        caption: post.caption,
        skills: post.skills,
        area: post.area,
        view_count: 0,
        share_count: 0,
        endorsement_count: 0,
        trending_score: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.log('Error creating post:', error);
      return { success: false, error: error.message };
    }

    return { success: true, postId: data?.id };
  } catch (err) {
    console.log('Error creating post:', err);
    return { success: false, error: 'Failed to create post' };
  }
}

/**
 * Create a new user profile in Supabase
 */
export async function createProfile(profile: {
  id?: string;
  phone: string;
  name: string;
  whatsapp: string;
  skills: string[];
  area: string;
}): Promise<{ success: boolean; profile?: DBUser; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: profile.id,
        phone: profile.phone,
        name: profile.name,
        whatsapp: profile.whatsapp,
        skills: profile.skills,
        area: profile.area,
        total_views: 0,
        total_shares: 0,
        total_endorsements: 0,
      })
      .select()
      .single();

    if (error) {
      console.log('Error creating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true, profile: data };
  } catch (err) {
    console.log('Error creating profile:', err);
    return { success: false, error: 'Failed to create profile' };
  }
}

/**
 * Get a user profile by phone number
 */
export async function getProfileByPhone(phone: string): Promise<DBUser | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error) {
      console.log('Error getting profile by phone:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.log('Error getting profile by phone:', err);
    return null;
  }
}

/**
 * Get a user profile by ID
 */
export async function getProfileById(userId: string): Promise<DBUser | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.log('Error getting profile by ID:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.log('Error getting profile by ID:', err);
    return null;
  }
}

/**
 * Get posts by user ID
 */
export async function getPostsByUserId(userId: string): Promise<DBPost[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error getting posts by user ID:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.log('Error getting posts by user ID:', err);
    return [];
  }
}

/**
 * Get endorsements for a user
 */
export async function getEndorsementsForUser(userId: string): Promise<any[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('engagements')
      .select('*, posts!inner(user_id)')
      .eq('posts.user_id', userId)
      .eq('type', 'endorsement')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error getting endorsements:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.log('Error getting endorsements:', err);
    return [];
  }
}

/**
 * Get a single post by ID
 */
export async function getPostById(postId: string): Promise<DBPost | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) {
      console.log('Error getting post by ID:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.log('Error getting post by ID:', err);
    return null;
  }
}
