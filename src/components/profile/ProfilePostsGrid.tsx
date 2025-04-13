'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Squares2X2Icon, 
  BookmarkIcon, 
  TagIcon,
  HeartIcon, 
  ChatBubbleOvalLeftIcon,
  PlayIcon
} from '@heroicons/react/24/solid';
import { Tab } from '@headlessui/react';

// Interface for Post data
interface Post {
  id: string;
  imageUrl: string;
  likeCount: number;
  commentCount: number;
  isVideo?: boolean;
  isSaved?: boolean;
}

interface ProfilePostsGridProps {
  posts: Post[];
  savedPosts?: Post[];
  taggedPosts?: Post[];
  username: string;
}

export default function ProfilePostsGrid({ 
  posts, 
  savedPosts = [], 
  taggedPosts = [],
  username 
}: ProfilePostsGridProps) {
  
  return (
    <div className="pb-20">
      <Tab.Group>
        <Tab.List className="flex justify-center border-t border-gray-200 dark:border-gray-800">
          <Tab className={({ selected }) => `
            flex items-center justify-center py-3 px-4 text-xs font-medium uppercase tracking-wide
            ${selected ? 'border-t border-black dark:border-white text-black dark:text-white' : 'text-gray-500'}
          `}>
            <Squares2X2Icon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Posts</span>
          </Tab>
          <Tab className={({ selected }) => `
            flex items-center justify-center py-3 px-4 text-xs font-medium uppercase tracking-wide
            ${selected ? 'border-t border-black dark:border-white text-black dark:text-white' : 'text-gray-500'}
          `}>
            <BookmarkIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Saved</span>
          </Tab>
          <Tab className={({ selected }) => `
            flex items-center justify-center py-3 px-4 text-xs font-medium uppercase tracking-wide
            ${selected ? 'border-t border-black dark:border-white text-black dark:text-white' : 'text-gray-500'}
          `}>
            <TagIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Tagged</span>
          </Tab>
        </Tab.List>
        
        <Tab.Panels className="mt-4">
          {/* Posts Tab */}
          <Tab.Panel>
            {posts.length > 0 ? (
              <PostGrid posts={posts} username={username} />
            ) : (
              <EmptyState 
                title="No Posts Yet" 
                description={`When ${username} posts, you'll see their photos and videos here.`} 
              />
            )}
          </Tab.Panel>
          
          {/* Saved Tab */}
          <Tab.Panel>
            {savedPosts.length > 0 ? (
              <PostGrid posts={savedPosts} username={username} />
            ) : (
              <EmptyState 
                title="No Saved Posts" 
                description="Save photos and videos that you want to see again." 
              />
            )}
          </Tab.Panel>
          
          {/* Tagged Tab */}
          <Tab.Panel>
            {taggedPosts.length > 0 ? (
              <PostGrid posts={taggedPosts} username={username} />
            ) : (
              <EmptyState 
                title="No Tagged Posts" 
                description={`Photos and videos ${username} is tagged in will appear here.`} 
              />
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

function PostGrid({ posts, username }: { posts: Post[], username: string }) {
  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-4">
      {posts.map((post) => (
        <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-square group">
          <div className="w-full h-full relative">
            <Image
              src={post.imageUrl}
              alt={`Post by ${username}`}
              fill
              className="object-cover"
            />
            {post.isVideo && (
              <div className="absolute top-2 right-2">
                <PlayIcon className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center space-x-4 text-white">
              <div className="flex items-center">
                <HeartIcon className="h-5 w-5 mr-1" />
                <span className="font-semibold">{post.likeCount}</span>
              </div>
              <div className="flex items-center">
                <ChatBubbleOvalLeftIcon className="h-5 w-5 mr-1" />
                <span className="font-semibold">{post.commentCount}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Squares2X2Icon className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold mb-1">{title}</h3>
      <p className="text-gray-500 max-w-md">{description}</p>
    </div>
  );
}
