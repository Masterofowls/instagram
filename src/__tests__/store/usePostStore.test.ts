import { act } from 'react-dom/test-utils';
import { renderHook } from '@testing-library/react';
import { usePostStore } from '@/store/usePostStore';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

// Mock the auth store
jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: {
    getState: jest.fn(),
  },
}));

// Mock the supabase client (already done in jest.setup.ts)

describe('usePostStore', () => {
  const mockUser = { id: 'user1', email: 'test@example.com' };
  const mockPosts = [
    {
      id: 'post1',
      user_id: 'user1',
      image_url: 'https://example.com/image1.jpg',
      caption: 'Test post 1',
      created_at: '2025-04-13T12:00:00Z',
      profiles: { id: 'user1', username: 'testuser' },
      likes: [],
      comments: [],
    },
    {
      id: 'post2',
      user_id: 'user2',
      image_url: 'https://example.com/image2.jpg',
      caption: 'Test post 2',
      created_at: '2025-04-13T13:00:00Z',
      profiles: { id: 'user2', username: 'otheruser' },
      likes: [],
      comments: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the store state before each test
    act(() => {
      usePostStore.setState({
        posts: [],
        feedPosts: [],
        isLoading: false,
      });
    });
    
    // Mock the auth store to return a logged-in user
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      user: mockUser,
    });
  });
  
  describe('fetchPosts', () => {
    it('should fetch and set all posts', async () => {
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'posts') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: mockPosts,
              error: null,
            }),
          };
        }
        return jest.fn().mockReturnThis();
      });
      
      const { result } = renderHook(() => usePostStore());
      
      await act(async () => {
        await result.current.fetchPosts();
      });
      
      expect(result.current.posts).toEqual(mockPosts);
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should handle error when fetching posts', async () => {
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'posts') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Failed to fetch posts' },
            }),
          };
        }
        return jest.fn().mockReturnThis();
      });
      
      const { result } = renderHook(() => usePostStore());
      
      await act(async () => {
        await result.current.fetchPosts();
      });
      
      expect(result.current.posts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  describe('fetchFeedPosts', () => {
    it('should fetch posts from followed users', async () => {
      const followingData = [{ following_id: 'user2' }];
      
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'follows') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: followingData,
              error: null,
            }),
          };
        }
        if (table === 'posts') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: mockPosts,
              error: null,
            }),
          };
        }
        return jest.fn().mockReturnThis();
      });
      
      const { result } = renderHook(() => usePostStore());
      
      await act(async () => {
        await result.current.fetchFeedPosts();
      });
      
      expect(result.current.feedPosts).toEqual(mockPosts);
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should not fetch feed posts if user is not logged in', async () => {
      // Mock the auth store to return null user
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        user: null,
      });
      
      const { result } = renderHook(() => usePostStore());
      
      await act(async () => {
        await result.current.fetchFeedPosts();
      });
      
      expect(result.current.feedPosts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  describe('fetchUserPosts', () => {
    it('should fetch posts for a specific user', async () => {
      const userId = 'user2';
      const userPosts = mockPosts.filter(post => post.user_id === userId);
      
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'posts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: userPosts,
              error: null,
            }),
          };
        }
        return jest.fn().mockReturnThis();
      });
      
      const { result } = renderHook(() => usePostStore());
      
      let posts;
      await act(async () => {
        posts = await result.current.fetchUserPosts(userId);
      });
      
      expect(posts).toEqual(userPosts);
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  describe('createPost', () => {
    it('should create a new post and refresh posts', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockCaption = 'New test post';
      const mockLocation = 'Test Location';
      
      // Mock storage upload
      (supabase.storage.from().upload as jest.Mock).mockResolvedValue({
        error: null,
      });
      
      // Mock post insertion
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'posts') {
          return {
            insert: jest.fn().mockResolvedValue({
              error: null,
            }),
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [...mockPosts, {
                id: 'newpost',
                user_id: mockUser.id,
                image_url: 'https://example.com/newimage.jpg',
                caption: mockCaption,
                location: mockLocation,
                created_at: new Date().toISOString(),
                profiles: { id: mockUser.id, username: 'testuser' },
                likes: [],
                comments: [],
              }],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
        };
      });
      
      const { result } = renderHook(() => usePostStore());
      
      let response;
      await act(async () => {
        response = await result.current.createPost(mockCaption, mockFile, mockLocation);
      });
      
      expect(response.success).toBe(true);
      expect(response.error).toBeNull();
      expect(supabase.storage.from).toHaveBeenCalledWith('instagram');
      expect(supabase.storage.from().upload).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('posts');
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should handle error during post creation', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockCaption = 'New test post';
      
      // Mock storage upload failure
      (supabase.storage.from().upload as jest.Mock).mockResolvedValue({
        error: { message: 'Upload failed' },
      });
      
      const { result } = renderHook(() => usePostStore());
      
      let response;
      await act(async () => {
        response = await result.current.createPost(mockCaption, mockFile);
      });
      
      expect(response.success).toBe(false);
      expect(response.error).toEqual({ message: 'Upload failed' });
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  describe('likePost and unlikePost', () => {
    it('should add a like to a post', async () => {
      const postId = 'post1';
      
      // Setup initial state with posts
      act(() => {
        usePostStore.setState({
          posts: [...mockPosts],
          feedPosts: [...mockPosts],
          isLoading: false,
        });
      });
      
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'likes') {
          return {
            insert: jest.fn().mockResolvedValue({
              error: null,
            }),
          };
        }
        return jest.fn().mockReturnThis();
      });
      
      const { result } = renderHook(() => usePostStore());
      
      await act(async () => {
        await result.current.likePost(postId);
      });
      
      // Check if the post has been liked in the store
      const likedPost = result.current.posts.find(p => p.id === postId);
      expect(likedPost?.likes.some(like => like.user_id === mockUser.id)).toBe(true);
      
      // Check feed posts too
      const likedFeedPost = result.current.feedPosts.find(p => p.id === postId);
      expect(likedFeedPost?.likes.some(like => like.user_id === mockUser.id)).toBe(true);
    });
    
    it('should remove a like from a post', async () => {
      const postId = 'post1';
      
      // Setup initial state with a liked post
      const postsWithLike = mockPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: [{ user_id: mockUser.id, post_id: postId, id: 'like1', created_at: '2025-04-13T14:00:00Z' }],
          };
        }
        return post;
      });
      
      act(() => {
        usePostStore.setState({
          posts: [...postsWithLike],
          feedPosts: [...postsWithLike],
          isLoading: false,
        });
      });
      
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'likes') {
          return {
            delete: jest.fn().mockReturnThis(),
            match: jest.fn().mockResolvedValue({
              error: null,
            }),
          };
        }
        return jest.fn().mockReturnThis();
      });
      
      const { result } = renderHook(() => usePostStore());
      
      await act(async () => {
        await result.current.unlikePost(postId);
      });
      
      // Check if the like has been removed in the store
      const unlikedPost = result.current.posts.find(p => p.id === postId);
      expect(unlikedPost?.likes.some(like => like.user_id === mockUser.id)).toBe(false);
      
      // Check feed posts too
      const unlikedFeedPost = result.current.feedPosts.find(p => p.id === postId);
      expect(unlikedFeedPost?.likes.some(like => like.user_id === mockUser.id)).toBe(false);
    });
  });
  
  describe('addComment', () => {
    it('should add a comment to a post', async () => {
      const postId = 'post1';
      const commentContent = 'Test comment';
      const newComment = {
        id: 'comment1',
        post_id: postId,
        user_id: mockUser.id,
        content: commentContent,
        created_at: '2025-04-13T15:00:00Z',
        profiles: { id: mockUser.id, username: 'testuser' },
      };
      
      // Setup initial state with posts
      act(() => {
        usePostStore.setState({
          posts: [...mockPosts],
          feedPosts: [...mockPosts],
          isLoading: false,
        });
      });
      
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'comments') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({
              data: [newComment],
              error: null,
            }),
          };
        }
        return jest.fn().mockReturnThis();
      });
      
      const { result } = renderHook(() => usePostStore());
      
      await act(async () => {
        await result.current.addComment(postId, commentContent);
      });
      
      // Check if the comment has been added in the store
      const commentedPost = result.current.posts.find(p => p.id === postId);
      expect(commentedPost?.comments).toContainEqual(newComment);
      
      // Check feed posts too
      const commentedFeedPost = result.current.feedPosts.find(p => p.id === postId);
      expect(commentedFeedPost?.comments).toContainEqual(newComment);
    });
  });
});
