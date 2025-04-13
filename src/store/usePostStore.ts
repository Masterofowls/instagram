'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/database.types';
import { useAuthStore } from './useAuthStore';
import { v4 as uuidv4 } from 'uuid';

type PostWithUser = Tables<'posts'> & {
  profiles: Tables<'profiles'>;
  likes: Tables<'likes'>[];
  comments: Tables<'comments'>[];
};

interface PostState {
  posts: PostWithUser[];
  feedPosts: PostWithUser[];
  isLoading: boolean;
  createPost: (caption: string, imageFile: File, location?: string) => Promise<{ success: boolean; error: any | null }>;
  fetchPosts: () => Promise<void>;
  fetchFeedPosts: () => Promise<void>;
  fetchUserPosts: (userId: string) => Promise<PostWithUser[]>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
}

export const usePostStore = create<PostState>()((set, get) => ({
  posts: [],
  feedPosts: [],
  isLoading: false,

  createPost: async (caption: string, imageFile: File, location?: string) => {
    set({ isLoading: true });
    const user = useAuthStore.getState().user;

    if (!user) {
      set({ isLoading: false });
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      // Upload image to storage
      const { error: uploadError } = await supabase
        .storage
        .from('instagram')
        .upload(filePath, imageFile);

      if (uploadError) {
        set({ isLoading: false });
        return { success: false, error: uploadError };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('instagram')
        .getPublicUrl(filePath);

      // Create post in database
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          caption,
          location,
        });

      if (postError) {
        set({ isLoading: false });
        return { success: false, error: postError };
      }

      // Refresh posts
      await get().fetchPosts();
      set({ isLoading: false });
      return { success: true, error: null };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error };
    }
  },

  fetchPosts: async () => {
    set({ isLoading: true });
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles(*),
        likes(*),
        comments(*)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      set({ posts: data as unknown as PostWithUser[] });
    }
    
    set({ isLoading: false });
  },

  fetchFeedPosts: async () => {
    set({ isLoading: true });
    const user = useAuthStore.getState().user;

    if (!user) {
      set({ isLoading: false, feedPosts: [] });
      return;
    }

    // Get IDs of users the current user follows
    const { data: followingData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = followingData?.map(f => f.following_id) || [];
    
    // Always include the current user's posts in the feed
    followingIds.push(user.id);

    // Get posts from followed users
    const { data: postsData, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles(*),
        likes(*),
        comments(*)
      `)
      .in('user_id', followingIds)
      .order('created_at', { ascending: false });

    if (!error && postsData) {
      set({ feedPosts: postsData as unknown as PostWithUser[] });
    }
    
    set({ isLoading: false });
  },

  fetchUserPosts: async (userId: string) => {
    set({ isLoading: true });
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles(*),
        likes(*),
        comments(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    set({ isLoading: false });
    
    if (error) {
      return [];
    }
    
    return data as unknown as PostWithUser[];
  },

  likePost: async (postId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    await supabase
      .from('likes')
      .insert({
        post_id: postId,
        user_id: user.id,
      });

    // Update local state
    const posts = get().posts;
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: [...post.likes, { user_id: user.id, post_id: postId, id: '', created_at: new Date().toISOString() }]
        };
      }
      return post;
    });

    set({ posts: updatedPosts });

    // Update feed posts too if needed
    const feedPosts = get().feedPosts;
    const updatedFeedPosts = feedPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: [...post.likes, { user_id: user.id, post_id: postId, id: '', created_at: new Date().toISOString() }]
        };
      }
      return post;
    });

    set({ feedPosts: updatedFeedPosts });
  },

  unlikePost: async (postId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    await supabase
      .from('likes')
      .delete()
      .match({
        post_id: postId,
        user_id: user.id,
      });

    // Update local state
    const posts = get().posts;
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.likes.filter(like => like.user_id !== user.id)
        };
      }
      return post;
    });

    set({ posts: updatedPosts });

    // Update feed posts too if needed
    const feedPosts = get().feedPosts;
    const updatedFeedPosts = feedPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.likes.filter(like => like.user_id !== user.id)
        };
      }
      return post;
    });

    set({ feedPosts: updatedFeedPosts });
  },

  addComment: async (postId: string, content: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // Add comment to database
    const { data: newComment } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
      })
      .select('*, profiles(*)');

    if (!newComment) return;

    // Update local state
    const posts = get().posts;
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment[0]]
        };
      }
      return post;
    });

    set({ posts: updatedPosts });

    // Update feed posts too if needed
    const feedPosts = get().feedPosts;
    const updatedFeedPosts = feedPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment[0]]
        };
      }
      return post;
    });

    set({ feedPosts: updatedFeedPosts });
  },
}));
