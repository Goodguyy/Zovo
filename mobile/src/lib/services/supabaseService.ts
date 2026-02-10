/**
 * Supabase Data Services for Zovo
 *
 * Service functions to create and update data in Supabase
 */

import { supabase, isSupabaseConfigured, DBPost, DBUser } from '../supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(
  fileUri: string,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Generate unique filename
    const fileExt = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('posts')
      .upload(fileName, decode(base64), {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        upsert: false,
      });

    if (error) {
      console.log('Error uploading image:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('posts')
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (err) {
    console.log('Error uploading image:', err);
    return { success: false, error: 'Failed to upload image' };
  }
}

/**
 * Create a new post in Supabase
 * If mediaUrl is a local file (file://), it will be uploaded to Supabase Storage first
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
    let finalMediaUrl = post.mediaUrl;

    // If it's a local file, upload it first
    if (post.mediaUrl.startsWith('file://')) {
      const uploadResult = await uploadImage(post.mediaUrl, post.userId);
      if (!uploadResult.success || !uploadResult.url) {
        return { success: false, error: uploadResult.error || 'Failed to upload image' };
      }
      finalMediaUrl = uploadResult.url;
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: post.userId,
        media_url: finalMediaUrl,
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

/**
 * Delete a post by ID
 */
export async function deletePost(postId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // First get the post to check ownership and get media URL
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !post) {
      return { success: false, error: 'Post not found or you do not have permission to delete it' };
    }

    // Delete the image from storage if it's a Supabase URL
    if (post.media_url && post.media_url.includes('supabase')) {
      const urlParts = post.media_url.split('/posts/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('posts').remove([filePath]);
      }
    }

    // Delete related engagements first
    await supabase
      .from('engagements')
      .delete()
      .eq('post_id', postId);

    // Delete the post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (deleteError) {
      console.log('Error deleting post:', deleteError);
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (err) {
    console.log('Error deleting post:', err);
    return { success: false, error: 'Failed to delete post' };
  }
}
