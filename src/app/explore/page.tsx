'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/database.types';
import { FiSearch } from 'react-icons/fi';

type PostWithUser = Tables<'posts'> & {
  profiles: Tables<'profiles'>;
  likes: Tables<'likes'>[];
  comments: Tables<'comments'>[];
};

export default function ExplorePage() {
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const fetchExplorePosts = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(*),
          likes(*),
          comments(*)
        `)
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (data && !error) {
        setPosts(data as unknown as PostWithUser[]);
      }
      
      setIsLoading(false);
    };
    
    fetchExplorePosts();
  }, []);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }
    
    setIsLoading(true);
    
    // Search in captions
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles(*),
        likes(*),
        comments(*)
      `)
      .ilike('caption', `%${searchQuery}%`)
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (data && !error) {
      setPosts(data as unknown as PostWithUser[]);
    }
    
    setIsLoading(false);
  };
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <form onSubmit={handleSearch} className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-gray-100 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">No Posts Found</h2>
              <p className="text-gray-500">
                {searchQuery
                  ? `No posts matching "${searchQuery}"`
                  : "There are no posts to explore yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
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
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
