import { supabase } from './supabase';
import { Tables } from '@/types/database.types';
import { currentUser } from '@clerk/nextjs/server';

export type UserProfile = Tables<'profiles'>;

/**
 * Get current user profile from Supabase
 */
export async function getCurrentUserProfile(): Promise<{ data: UserProfile | null; error: Error | null }> {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    const userId = user.id;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting current user profile:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Search for users by username or full name
 */
export async function searchUsers(query: string): Promise<{ data: UserProfile[] | null; error: Error | null }> {
  try {
    if (!query.trim()) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(20);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error searching users:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Follow a user
 */
export async function followUser(targetUserId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    const userId = user.id;

    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: userId,
        following_id: targetUserId,
        created_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(targetUserId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    const userId = user.id;

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetUserId);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Check if the current user is following a specific user
 */
export async function isFollowing(targetUserId: string): Promise<{ following: boolean; error: Error | null }> {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    const userId = user.id;

    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', userId)
      .eq('following_id', targetUserId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return { following: !!data, error: null };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return { following: false, error: error as Error };
  }
}

/**
 * Get followers count for a user
 */
export async function getFollowersCount(userId: string): Promise<{ count: number; error: Error | null }> {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (error) {
      throw error;
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error getting followers count:', error);
    return { count: 0, error: error as Error };
  }
}

/**
 * Get following count for a user
 */
export async function getFollowingCount(userId: string): Promise<{ count: number; error: Error | null }> {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (error) {
      throw error;
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error getting following count:', error);
    return { count: 0, error: error as Error };
  }
}

/**
 * Get suggested users to follow (users with most followers who current user doesn't follow)
 */
export async function getSuggestedUsers(limit: number = 5): Promise<{ data: UserProfile[] | null; error: Error | null }> {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    const userId = user.id;

    // Get users the current user is already following
    const { data: followingData, error: followingError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (followingError) {
      throw followingError;
    }

    const followingIds = followingData.map(f => f.following_id);
    
    // Include the current user's ID in the exclusion list
    const excludeIds = [...followingIds, userId];

    // Get users with the most followers who aren't already followed
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('followers_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting suggested users:', error);
    return { data: null, error: error as Error };
  }
}
