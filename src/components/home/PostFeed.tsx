'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { HeartIcon as HeartOutline, ChatBubbleOvalLeftIcon, PaperAirplaneIcon, BookmarkIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import TimeAgo from '@/components/ui/TimeAgo';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Interface for Post data
interface Post {
  id: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  images: string[];
  caption: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  saved: boolean;
  comments: {
    id: string;
    user: {
      username: string;
    };
    text: string;
  }[];
  createdAt: string;
}

export default function PostFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch posts from API
    // This is mock data for demonstration
    const mockPosts = Array.from({ length: 5 }, (_, i) => ({
      id: `post-${i}`,
      user: {
        id: `user-${i}`,
        username: `user${i}`,
        avatarUrl: `https://i.pravatar.cc/150?img=${i + 20}`,
      },
      images: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 },
        (_, j) => `https://picsum.photos/600/600?random=${i * 10 + j}`
      ),
      caption: `This is a sample caption for post ${i}. #instagram #clone #nextjs`,
      likeCount: Math.floor(Math.random() * 1000),
      commentCount: Math.floor(Math.random() * 100),
      liked: Math.random() > 0.5,
      saved: Math.random() > 0.7,
      comments: Array.from({ length: 2 }, (_, j) => ({
        id: `comment-${i}-${j}`,
        user: {
          username: `commenter${j}`,
        },
        text: `This is a sample comment ${j} on post ${i}.`,
      })),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    }));

    setPosts(mockPosts);
    setLoading(false);
  }, []);

  const handleLike = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? { ...post, liked: !post.liked, likeCount: post.liked ? post.likeCount - 1 : post.likeCount + 1 }
          : post
      )
    );
  };

  const handleSave = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, saved: !post.saved } : post
      )
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="w-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 animate-pulse">
            <div className="p-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700"></div>
            <div className="p-4 space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="w-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
          {/* Post Header */}
          <div className="p-4 flex items-center justify-between">
            <Link href={`/profile/${post.user.id}`} className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src={post.user.avatarUrl}
                  alt={post.user.username}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-medium text-sm">{post.user.username}</span>
            </Link>
            <button className="text-gray-500">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Post Images */}
          <div className="relative w-full">
            {post.images.length === 1 ? (
              <div className="aspect-square relative">
                <Image
                  src={post.images[0]}
                  alt={`Post by ${post.user.username}`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <Swiper
                modules={[Pagination, Navigation]}
                pagination={{ clickable: true }}
                navigation
                className="aspect-square"
              >
                {post.images.map((image, index) => (
                  <SwiperSlide key={index}>
                    <div className="aspect-square relative">
                      <Image
                        src={image}
                        alt={`Post by ${post.user.username}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>

          {/* Post Actions */}
          <div className="p-4">
            <div className="flex justify-between mb-2">
              <div className="flex space-x-4">
                <button onClick={() => handleLike(post.id)}>
                  {post.liked ? (
                    <HeartSolid className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartOutline className="h-6 w-6" />
                  )}
                </button>
                <button>
                  <ChatBubbleOvalLeftIcon className="h-6 w-6" />
                </button>
                <button>
                  <PaperAirplaneIcon className="h-6 w-6 rotate-45" />
                </button>
              </div>
              <button onClick={() => handleSave(post.id)}>
                <BookmarkIcon className={`h-6 w-6 ${post.saved ? 'text-black dark:text-white fill-current' : ''}`} />
              </button>
            </div>

            {/* Likes */}
            <div className="font-semibold text-sm mb-2">
              {post.likeCount.toLocaleString()} likes
            </div>

            {/* Caption */}
            <div className="mb-2">
              <span className="font-semibold text-sm mr-2">{post.user.username}</span>
              <span className="text-sm">{post.caption}</span>
            </div>

            {/* Comments */}
            {post.commentCount > 0 && (
              <Link href={`/post/${post.id}`} className="text-gray-500 text-sm mb-2 block">
                View all {post.commentCount} comments
              </Link>
            )}
            
            {post.comments.map((comment) => (
              <div key={comment.id} className="mb-2">
                <span className="font-semibold text-sm mr-2">{comment.user.username}</span>
                <span className="text-sm">{comment.text}</span>
              </div>
            ))}

            {/* Timestamp */}
            <div className="text-gray-500 text-xs uppercase">
              <TimeAgo date={post.createdAt} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
