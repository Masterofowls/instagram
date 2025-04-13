'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Cog6ToothIcon, CheckIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface ProfileHeaderProps {
  userId?: string;
  username: string;
  fullName: string;
  bio: string;
  website?: string;
  avatarUrl: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isCurrentUser?: boolean;
  isFollowing?: boolean;
}

export default function ProfileHeader({
  userId,
  username,
  fullName,
  bio,
  website,
  avatarUrl,
  postsCount,
  followersCount,
  followingCount,
  isCurrentUser = false,
  isFollowing = false,
}: ProfileHeaderProps) {
  const { userId: currentUserId } = useAuth();
  const [following, setFollowing] = useState(isFollowing);
  const [followersState, setFollowersState] = useState(followersCount);

  const toggleFollow = () => {
    // In a real app, call API endpoint to follow/unfollow
    setFollowing(!following);
    setFollowersState(following ? followersState - 1 : followersState + 1);
  };

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex flex-col sm:flex-row items-center">
        {/* Avatar */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-4 sm:mb-0 sm:mr-10">
          <Image
            src={avatarUrl}
            alt={username}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center mb-4">
            <h1 className="text-xl font-semibold mb-4 sm:mb-0 sm:mr-4">{username}</h1>
            
            {isCurrentUser ? (
              <div className="flex space-x-2">
                <Link
                  href="/accounts/edit"
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-sm font-semibold rounded-md"
                >
                  Edit Profile
                </Link>
                <Link
                  href="/accounts/settings"
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                </Link>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={toggleFollow}
                  className={`px-6 py-1.5 text-sm font-semibold rounded-md ${
                    following
                      ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {following ? (
                    <span className="flex items-center">
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Following
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <UserPlusIcon className="h-4 w-4 mr-1" />
                      Follow
                    </span>
                  )}
                </button>
                <button className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-sm font-semibold rounded-md">
                  Message
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center sm:justify-start space-x-6 mb-4">
            <div>
              <span className="font-semibold">{postsCount}</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">posts</span>
            </div>
            <Link href={`/profile/${userId}/followers`} className="hover:underline">
              <span className="font-semibold">{followersState}</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">followers</span>
            </Link>
            <Link href={`/profile/${userId}/following`} className="hover:underline">
              <span className="font-semibold">{followingCount}</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">following</span>
            </Link>
          </div>

          {/* Bio */}
          <div className="space-y-1 text-sm">
            <div className="font-semibold">{fullName}</div>
            <div className="whitespace-pre-line">{bio}</div>
            {website && (
              <div>
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-900 dark:text-blue-400 font-medium"
                >
                  {website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
