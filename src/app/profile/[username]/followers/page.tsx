'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@clerk/nextjs';
import { useClerkProfile } from '@/hooks/useClerkProfile';
import { Button } from '@/components/ui/Button';
import { FiArrowLeft, FiLoader, FiSearch, FiX } from 'react-icons/fi';
import { Tables } from '@/types/database.types';

interface FollowerWithProfile {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  profiles: Tables<'profiles'>;
}

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  const username = params.username as string;
  
  // Use our custom Clerk profile hook
  const { profile, isLoading: profileLoading } = useClerkProfile(username);
  
  const [followers, setFollowers] = useState<FollowerWithProfile[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const fetchFollowers = async () => {
      if (!profile) return;
      
      setIsLoading(true);
      
      try {
        // Fetch followers with their profiles
        const { data: followersData, error } = await supabase
          .from('follows')
          .select(`
            id,
            follower_id,
            following_id,
            created_at,
            profiles:follower_id(*)
          `)
          .eq('following_id', profile.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (followersData) {
          setFollowers(followersData as unknown as FollowerWithProfile[]);
          
          // If user is logged in, fetch their following status for each follower
          if (userId) {
            const { data: followingData } = await supabase
              .from('follows')
              .select('following_id')
              .eq('follower_id', userId);
              
            if (followingData) {
              const followingObj: Record<string, boolean> = {};
              followingData.forEach(item => {
                followingObj[item.following_id] = true;
              });
              setFollowingMap(followingObj);
            }
          }
        }
      } catch (error) {
        console.error('Error loading followers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFollowers();
  }, [profile, userId]);
  
  const handleFollow = async (targetUserId: string) => {
    if (!userId) {
      router.push('/auth/login');
      return;
    }
    
    setFollowLoading(prev => ({ ...prev, [targetUserId]: true }));
    
    try {
      if (followingMap[targetUserId]) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .match({
            follower_id: userId,
            following_id: targetUserId,
          });
          
        setFollowingMap(prev => ({ ...prev, [targetUserId]: false }));
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: userId,
            following_id: targetUserId,
          });
          
        setFollowingMap(prev => ({ ...prev, [targetUserId]: true }));
        
        // Create notification
        await supabase
          .from('notifications')
          .insert({
            sender_id: userId,
            recipient_id: targetUserId,
            type: 'follow',
            message: 'started following you',
          });
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setFollowLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };
  
  // Filter followers by search query
  const filteredFollowers = searchQuery.trim()
    ? followers.filter(follower => 
        follower.profiles.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (follower.profiles.full_name && follower.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : followers;
    
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.back()} 
          className="p-2 mr-4 rounded-full hover:bg-gray-100"
        >
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Followers</h1>
      </div>
      
      {/* Search */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search followers"
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-3 flex items-center"
          >
            <FiX className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>
      
      {/* Follower count */}
      <div className="mb-6 text-sm text-gray-500">
        {followers.length} {followers.length === 1 ? 'follower' : 'followers'}
      </div>
      
      {/* Followers list */}
      {filteredFollowers.length > 0 ? (
        <div className="space-y-4">
          {filteredFollowers.map(follower => (
            <div key={follower.id} className="flex items-center justify-between">
              <Link href={`/profile/${follower.profiles.username}`} className="flex items-center">
                <div className="w-12 h-12 relative mr-3">
                  {follower.profiles.avatar_url ? (
                    <Image
                      src={follower.profiles.avatar_url}
                      alt={follower.profiles.username}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-500">
                        {follower.profiles.username.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{follower.profiles.username}</p>
                  {follower.profiles.full_name && (
                    <p className="text-sm text-gray-500">{follower.profiles.full_name}</p>
                  )}
                </div>
              </Link>
              
              {userId && userId !== follower.profiles.id && (
                <Button
                  onClick={() => handleFollow(follower.profiles.id)}
                  variant={followingMap[follower.profiles.id] ? 'outline' : 'default'}
                  size="sm"
                  disabled={followLoading[follower.profiles.id]}
                >
                  {followLoading[follower.profiles.id] ? (
                    <FiLoader className="h-4 w-4 animate-spin" />
                  ) : followingMap[follower.profiles.id] ? (
                    'Following'
                  ) : (
                    'Follow'
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          {searchQuery ? (
            <p className="text-gray-500">No followers match your search</p>
          ) : (
            <div>
              <h2 className="font-semibold text-xl mb-2">No Followers Yet</h2>
              <p className="text-gray-500">
                When someone follows {profile?.username}, they'll show up here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
