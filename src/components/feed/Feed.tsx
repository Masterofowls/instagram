'use client';

import React, { useEffect } from 'react';
import Stories from '@/components/home/Stories';
import PostFeed from '@/components/home/PostFeed';
import { usePostStore } from '@/store/usePostStore';

const Feed = () => {
  const { feedPosts, fetchFeedPosts, isLoading } = usePostStore();
  
  useEffect(() => {
    fetchFeedPosts();
  }, [fetchFeedPosts]);
  
  return (
    <div className="max-w-xl mx-auto p-4">
      <Stories />
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : feedPosts.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-gray-500">
            Follow other users to see their posts in your feed.
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
            Discover People
          </button>
        </div>
      ) : (
        <PostFeed />
      )}
    </div>
  );
};

export default Feed;
