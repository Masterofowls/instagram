import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Feed from '@/components/feed/Feed';
import { usePostStore } from '@/store/usePostStore';

// Mock the post store
jest.mock('@/store/usePostStore', () => ({
  usePostStore: jest.fn(),
}));

// Mock components used in Feed
jest.mock('@/components/stories/Stories', () => {
  return function MockStories() {
    return <div data-testid="stories-component">Stories Component</div>;
  };
});

jest.mock('@/components/post/PostCard', () => {
  return function MockPostCard({ post }: { post: any }) {
    return <div data-testid={`post-card-${post.id}`}>{post.caption}</div>;
  };
});

describe('Feed Component', () => {
  const mockFetchFeedPosts = jest.fn();
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
  });
  
  it('renders the Stories component', () => {
    (usePostStore as jest.Mock).mockReturnValue({
      feedPosts: [],
      fetchFeedPosts: mockFetchFeedPosts,
      isLoading: false,
    });
    
    render(<Feed />);
    
    expect(screen.getByTestId('stories-component')).toBeInTheDocument();
  });
  
  it('renders loading state when isLoading is true', () => {
    (usePostStore as jest.Mock).mockReturnValue({
      feedPosts: [],
      fetchFeedPosts: mockFetchFeedPosts,
      isLoading: true,
    });
    
    render(<Feed />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(mockFetchFeedPosts).toHaveBeenCalled();
  });
  
  it('renders empty state when there are no posts', () => {
    (usePostStore as jest.Mock).mockReturnValue({
      feedPosts: [],
      fetchFeedPosts: mockFetchFeedPosts,
      isLoading: false,
    });
    
    render(<Feed />);
    
    expect(screen.getByText('No posts yet')).toBeInTheDocument();
    expect(screen.getByText('Follow other users to see their posts in your feed.')).toBeInTheDocument();
    expect(mockFetchFeedPosts).toHaveBeenCalled();
  });
  
  it('renders posts when feedPosts contains items', async () => {
    (usePostStore as jest.Mock).mockReturnValue({
      feedPosts: mockPosts,
      fetchFeedPosts: mockFetchFeedPosts,
      isLoading: false,
    });
    
    render(<Feed />);
    
    await waitFor(() => {
      expect(screen.getByTestId('post-card-post1')).toBeInTheDocument();
      expect(screen.getByTestId('post-card-post2')).toBeInTheDocument();
      expect(screen.getByText('Test post 1')).toBeInTheDocument();
      expect(screen.getByText('Test post 2')).toBeInTheDocument();
    });
    
    expect(mockFetchFeedPosts).toHaveBeenCalled();
  });
  
  it('calls fetchFeedPosts on component mount', () => {
    (usePostStore as jest.Mock).mockReturnValue({
      feedPosts: [],
      fetchFeedPosts: mockFetchFeedPosts,
      isLoading: false,
    });
    
    render(<Feed />);
    
    expect(mockFetchFeedPosts).toHaveBeenCalledTimes(1);
  });
});
