'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { PlusIcon } from '@heroicons/react/24/solid';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

// Interface for Story data
interface Story {
  id: string;
  username: string;
  avatarUrl: string;
  hasUnseenStory: boolean;
  userId: string;
}

export default function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch stories from API
    // This is mock data for demonstration
    const mockStories = Array.from({ length: 15 }, (_, i) => ({
      id: `story-${i}`,
      username: `user${i}`,
      avatarUrl: `https://i.pravatar.cc/150?img=${i + 10}`,
      hasUnseenStory: Math.random() > 0.5,
      userId: `user-${i}`,
    }));

    setStories(mockStories);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-24 bg-white dark:bg-gray-900 rounded-lg mb-4 p-4 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-full bg-gray-200 dark:bg-gray-700 h-14 w-14"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg mb-4 p-4 border border-gray-200 dark:border-gray-800">
      <Swiper
        modules={[Navigation]}
        spaceBetween={12}
        slidesPerView="auto"
        navigation
        className="stories-swiper"
      >
        {/* Add Story Button */}
        <SwiperSlide className="w-auto">
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <div className="absolute w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <PlusIcon className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <span className="text-xs mt-1 text-center">Add Story</span>
          </div>
        </SwiperSlide>

        {/* User Stories */}
        {stories.map((story) => (
          <SwiperSlide key={story.id} className="w-auto">
            <Link href={`/stories/${story.id}`}>
              <div className="flex flex-col items-center">
                <div className={`relative w-16 h-16 rounded-full ${story.hasUnseenStory ? 'bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[2px]' : 'border-2 border-gray-200 dark:border-gray-700'}`}>
                  <div className="w-full h-full rounded-full border-2 border-white dark:border-gray-900 overflow-hidden">
                    <Image
                      src={story.avatarUrl}
                      alt={story.username}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-xs mt-1 text-center overflow-hidden text-ellipsis w-16">
                  {story.username}
                </span>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

// Add Swiper custom styles to your global CSS or import them here
