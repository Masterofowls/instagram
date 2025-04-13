'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { usePostStore } from '@/store/usePostStore';
import { useClerkProfile } from '@/hooks/useClerkProfile';
import { Button } from '@/components/ui/Button';
import { Tables } from '@/types/database.types';
import { FiGrid, FiBookmark, FiTag, FiSettings } from 'react-icons/fi';
import Link from 'next/link';

type PostWithUser = Tables<'posts'> & {
  profiles: Tables<'profiles'>;
  likes: Tables<'likes'>[];
  comments: Tables<'comments'>[];
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchUserPosts } = usePostStore();
  const { userId } = useAuth();
  
  const username = params.username as string;
  
  // Use our custom Clerk profile hook
  const { profile, isOwnProfile, isLoading: profileLoading, refreshProfile } = useClerkProfile(username);
  
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState('posts');
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profile) return;
      
      setIsLoading(true);
      
      try {
        // Fetch posts
        const userPosts = await fetchUserPosts(profile.id);
        setPosts(userPosts);
        
        // Fetch follower count
        const { count: followers } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id);
        
        setFollowersCount(followers || 0);
        
        // Fetch following count
        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profile.id);
        
        setFollowingCount(following || 0);
        
        // Check if current user is following this profile
        if (userId && !isOwnProfile) {
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', userId)
            .eq('following_id', profile.id)
            .maybeSingle();
          
          setIsFollowing(!!followData);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [profile, fetchUserPosts, userId, isOwnProfile]);
  
  const handleFollow = async () => {
    if (!userId || !profile) return;
    
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .match({
            follower_id: userId,
            following_id: profile.id,
          });
        
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: userId,
            following_id: profile.id,
          });
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        
        // Create notification
        await supabase
          .from('notifications')
          .insert({
            sender_id: userId,
            recipient_id: profile.id,
            type: 'follow',
            message: 'started following you',
          });
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
        <p className="text-gray-500 mb-4">The user you're looking for doesn't exist or may have been removed.</p>
        <Button onClick={() => router.push('/')}>
          Return to Home
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
        {/* Profile Picture */}
        <div className="w-24 h-24 md:w-32 md:h-32 relative">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-500">
                {profile.username.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h1 className="text-xl font-semibold">{profile.username}</h1>
            
            {isOwnProfile ? (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/settings/profile')}
                >
                  Edit Profile
                </Button>
                <Button variant="ghost" onClick={() => router.push('/settings')}>
                  <FiSettings className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleFollow}
                variant={isFollowing ? 'outline' : 'default'}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
          
          <div className="flex justify-center md:justify-start gap-6 my-4">
            <div>
              <span className="font-semibold">{posts.length}</span>{' '}
              <span className="text-gray-500">posts</span>
            </div>
            <Link href={`/profile/${username}/followers`}>
              <div className="cursor-pointer hover:opacity-80">
                <span className="font-semibold">{followersCount}</span>{' '}
                <span className="text-gray-500">followers</span>
              </div>
            </Link>
            <Link href={`/profile/${username}/following`}>
              <div className="cursor-pointer hover:opacity-80">
                <span className="font-semibold">{followingCount}</span>{' '}
                <span className="text-gray-500">following</span>
              </div>
            </Link>
          </div>
          
          <div>
            {profile.full_name && (
              <p className="font-semibold">{profile.full_name}</p>
            )}
            {profile.bio && (
              <p className="mt-1">{profile.bio}</p>
            )}
            {profile.website && (
              <a 
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-900 font-medium mt-1 block"
              >
                {profile.website}
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-t border-gray-200">
        <div className="flex justify-center">
          <button
            className={`p-4 flex items-center ${activeTab === 'posts' ? 'border-t border-black' : 'text-gray-500'}`}
            onClick={() => setActiveTab('posts')}
          >
            <FiGrid className="mr-1" />
            <span className="text-xs uppercase font-semibold">Posts</span>
          </button>
          <button
            className={`p-4 flex items-center ${activeTab === 'saved' ? 'border-t border-black' : 'text-gray-500'}`}
            onClick={() => setActiveTab('saved')}
          >
            <FiBookmark className="mr-1" />
            <span className="text-xs uppercase font-semibold">Saved</span>
          </button>
          <button
            className={`p-4 flex items-center ${activeTab === 'tagged' ? 'border-t border-black' : 'text-gray-500'}`}
            onClick={() => setActiveTab('tagged')}
          >
            <FiTag className="mr-1" />
            <span className="text-xs uppercase font-semibold">Tagged</span>
          </button>
        </div>
      </div>
      
      {/* Posts Grid */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-3 gap-1 mt-4">
          {posts.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <h2 className="font-semibold text-xl mb-2">No Posts Yet</h2>
              {isOwnProfile && (
                <div className="mt-4">
                  <Link href="/create">
                    <Button>Create your first post</Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <Link key={post.id} href={`/p/${post.id}`}>
                <div className="relative aspect-square group cursor-pointer">
                  <Image
                    src={post.image_url}
                    alt={post.caption || 'Post'}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity flex items-center justify-center">
                    <div className="text-white flex items-center gap-4">
                      <span className="flex items-center">
                        ❤️ {post.likes.length}
                      </span>
                      <span className="flex items-center">
                        💬 {post.comments.length}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
      
      {/* Other Tabs (Saved, Tagged) */}
      {activeTab === 'saved' && (
        <div className="text-center py-12">
          <h2 className="font-semibold text-xl mb-2">No Saved Posts</h2>
          <p className="text-gray-500">
            Save posts to revisit them later.
          </p>
        </div>
      )}
      
      {activeTab === 'tagged' && (
        <div className="text-center py-12">
          <h2 className="font-semibold text-xl mb-2">No Tagged Posts</h2>
          <p className="text-gray-500">
            People who tag you in their posts will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
