'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/database.types';
import { useAuthStore } from '@/store/useAuthStore';
import { FiPlus } from 'react-icons/fi';
import Link from 'next/link';

interface Story extends Tables<'stories'> {
  profiles: Tables<'profiles'>;
}

const Stories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuthStore();

  useEffect(() => {
    const fetchStories = async () => {
      if (!user) return;

      setLoading(true);
      
      // Get IDs of users the current user follows
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = followingData?.map(f => f.following_id) || [];
      
      // Always include the current user's stories
      followingIds.push(user.id);

      // Fetch active stories (not expired)
      const { data } = await supabase
        .from('stories')
        .select(`
          *,
          profiles(*)
        `)
        .in('user_id', followingIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (data) {
        setStories(data as Story[]);
      }
      
      setLoading(false);
    };

    fetchStories();
  }, [user]);

  // Group stories by user
  const userStories = stories.reduce((acc, story) => {
    const userId = story.user_id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex space-x-4 p-2">
        {/* Add Story Button */}
        {profile && (
          <Link 
            href="/stories/create" 
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full border border-gray-300 flex items-center justify-center mb-1 relative">
              {profile.avatar_url ? (
                <div className="relative w-14 h-14 rounded-full overflow-hidden">
                  <Image
                    src={profile.avatar_url}
                    alt={profile.username}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                    <FiPlus className="text-white text-xl" />
                  </div>
                </div>
              ) : (
                <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center relative">
                  <span className="text-sm font-medium text-gray-600">
                    {profile.username.substring(0, 2).toUpperCase()}
                  </span>
                  <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
                    <FiPlus className="text-white text-xl" />
                  </div>
                </div>
              )}
            </div>
            <span className="text-xs">Your Story</span>
          </Link>
        )}
        
        {/* User Stories */}
        {Object.entries(userStories).map(([userId, userStoryList]) => {
          const { profiles } = userStoryList[0];
          return (
            <Link 
              key={userId} 
              href={`/stories/${userId}`}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-0.5 mb-1">
                {profiles.avatar_url ? (
                  <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                    <div className="relative w-full h-full">
                      <Image
                        src={profiles.avatar_url}
                        alt={profiles.username}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {profiles.username.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xs truncate max-w-16 text-center">
                {profiles.username}
              </span>
            </Link>
          );
        })}
        
        {loading && (
          <div className="flex space-x-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse mb-1"></div>
                <div className="w-12 h-2 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && Object.keys(userStories).length === 0 && (
          <div className="flex flex-col items-center py-2 px-4">
            <p className="text-sm text-gray-500">No stories available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stories;
