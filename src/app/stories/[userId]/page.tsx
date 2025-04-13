'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Tables } from '@/types/database.types';
import { formatDistanceToNow } from 'date-fns';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface Story extends Tables<'stories'> {
  profiles: Tables<'profiles'>;
}

export default function ViewStoryPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const userId = params.userId as string;
  
  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true);
      
      const { data } = await supabase
        .from('stories')
        .select(`
          *,
          profiles(*)
        `)
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        setStories(data as Story[]);
      } else {
        // No stories found or they've expired, redirect home
        router.push('/');
      }
      
      setIsLoading(false);
    };
    
    if (userId) {
      fetchStories();
    }
  }, [userId, router]);
  
  useEffect(() => {
    if (stories.length === 0) return;
    
    // Progress bar animation
    const storyDuration = 5000; // 5 seconds per story
    const interval = 10; // Update progress every 10ms
    const steps = storyDuration / interval;
    
    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += (100 / steps);
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        // Move to next story
        if (currentIndex < stories.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setProgress(0);
          currentProgress = 0;
        } else {
          // No more stories, go back to feed
          router.push('/');
        }
      }
    }, interval);
    
    return () => {
      clearInterval(timer);
    };
  }, [currentIndex, stories, router]);
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // No more stories, go back to feed
      router.push('/');
    }
  };
  
  if (isLoading || stories.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }
  
  const currentStory = stories[currentIndex];
  
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-white z-10"
        onClick={() => router.push('/')}
      >
        <FiX className="h-8 w-8" />
      </button>
      
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 p-2 flex space-x-1">
        {stories.map((_, index) => (
          <div key={index} className="h-1 flex-1 bg-gray-600 rounded-full overflow-hidden">
            <div
              className={`h-full bg-white ${index === currentIndex ? 'transition-all duration-10' : ''}`}
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Story header */}
      <div className="absolute top-4 left-4 right-4 flex items-center">
        {currentStory.profiles.avatar_url ? (
          <Image
            src={currentStory.profiles.avatar_url}
            alt={currentStory.profiles.username}
            width={32}
            height={32}
            className="rounded-full object-cover mr-3"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-white">
              {currentStory.profiles.username.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <p className="text-white font-medium">{currentStory.profiles.username}</p>
        <p className="text-gray-300 text-sm ml-2">
          {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
        </p>
      </div>
      
      {/* Main story image */}
      <div className="relative h-full max-w-md mx-auto">
        <Image
          src={currentStory.image_url}
          alt="Story"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 400px"
          priority
        />
      </div>
      
      {/* Navigation buttons */}
      <button
        className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-2 ${
          currentIndex === 0 ? 'opacity-50' : 'opacity-80'
        }`}
        onClick={handlePrevious}
        disabled={currentIndex === 0}
      >
        <FiChevronLeft className="h-8 w-8" />
      </button>
      
      <button
        className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-2 ${
          currentIndex === stories.length - 1 ? 'opacity-50' : 'opacity-80'
        }`}
        onClick={handleNext}
        disabled={currentIndex === stories.length - 1}
      >
        <FiChevronRight className="h-8 w-8" />
      </button>
    </div>
  );
}
