'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiMessageCircle, FiSend, FiBookmark, FiMoreHorizontal } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { usePostStore } from '@/store/usePostStore';
import { Tables } from '@/types/database.types';
import { Button } from '@/components/ui/Button';

type PostWithUser = Tables<'posts'> & {
  profiles: Tables<'profiles'>;
  likes: Tables<'likes'>[];
  comments: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    post_id: string;
    profiles: Tables<'profiles'>;
  }[];
};

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { likePost, unlikePost, addComment } = usePostStore();
  
  const [post, setPost] = useState<PostWithUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');
  
  const postId = params.id as string;
  
  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(*),
          likes(*),
          comments(*, profiles(*))
        `)
        .eq('id', postId)
        .single();
      
      if (data && !error) {
        setPost(data as unknown as PostWithUser);
      }
      
      setIsLoading(false);
    };
    
    if (postId) {
      fetchPost();
    }
  }, [postId]);
  
  const handleLike = () => {
    if (!post || !user) return;
    
    const isLiked = post.likes.some(like => like.user_id === user.id);
    
    if (isLiked) {
      unlikePost(post.id);
      // Update local state
      setPost(prev => {
        if (!prev) return null;
        return {
          ...prev,
          likes: prev.likes.filter(like => like.user_id !== user.id)
        };
      });
    } else {
      likePost(post.id);
      // Update local state
      setPost(prev => {
        if (!prev) return null;
        return {
          ...prev,
          likes: [...prev.likes, { user_id: user.id, post_id: postId, id: 'temp', created_at: new Date().toISOString() }]
        };
      });
    }
  };
  
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !user || !comment.trim()) return;
    
    await addComment(post.id, comment);
    
    // Fetch the new comment with profile info
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data) {
      // Update local state
      setPost(prev => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [...prev.comments, data]
        };
      });
    }
    
    setComment('');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
        <p className="text-gray-500 mb-4">The post you're looking for doesn't exist or may have been removed.</p>
        <Button onClick={() => router.push('/')}>
          Return to Home
        </Button>
      </div>
    );
  }
  
  const isLiked = user ? post.likes.some(like => like.user_id === user.id) : false;
  
  return (
    <div className="max-w-4xl mx-auto md:py-8">
      <div className="bg-white md:rounded-md md:border border-gray-200 overflow-hidden">
        <div className="md:flex">
          {/* Post Image - Left side on desktop */}
          <div className="md:w-3/5 relative bg-black" style={{ aspectRatio: '1/1' }}>
            <Image
              src={post.image_url}
              alt={post.caption || 'Post'}
              fill
              className="object-contain"
              priority
            />
          </div>
          
          {/* Post Info - Right side on desktop */}
          <div className="md:w-2/5 flex flex-col">
            {/* Post Header */}
            <div className="flex items-center p-3 border-b border-gray-200">
              <Link href={`/profile/${post.profiles.username}`} className="flex items-center">
                {post.profiles.avatar_url ? (
                  <Image
                    src={post.profiles.avatar_url}
                    alt={post.profiles.username}
                    width={32}
                    height={32}
                    className="rounded-full object-cover mr-3"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-gray-600">
                      {post.profiles.username.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold">{post.profiles.username}</p>
                  {post.location && (
                    <p className="text-xs text-gray-500">{post.location}</p>
                  )}
                </div>
              </Link>
              <button className="ml-auto text-gray-500">
                <FiMoreHorizontal />
              </button>
            </div>
            
            {/* Comments Section */}
            <div className="flex-1 overflow-y-auto p-3">
              {/* Original Post Caption */}
              {post.caption && (
                <div className="flex mb-4">
                  <Link href={`/profile/${post.profiles.username}`} className="mr-3">
                    {post.profiles.avatar_url ? (
                      <Image
                        src={post.profiles.avatar_url}
                        alt={post.profiles.username}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {post.profiles.username.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div>
                    <p className="text-sm">
                      <Link href={`/profile/${post.profiles.username}`} className="font-semibold mr-1">
                        {post.profiles.username}
                      </Link>
                      {post.caption}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Comments */}
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex mb-4">
                  <Link href={`/profile/${comment.profiles.username}`} className="mr-3">
                    {comment.profiles.avatar_url ? (
                      <Image
                        src={comment.profiles.avatar_url}
                        alt={comment.profiles.username}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {comment.profiles.username.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div>
                    <p className="text-sm">
                      <Link href={`/profile/${comment.profiles.username}`} className="font-semibold mr-1">
                        {comment.profiles.username}
                      </Link>
                      {comment.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Post Actions */}
            <div className="p-3 border-t border-gray-200">
              <div className="flex items-center mb-2">
                <button onClick={handleLike} className="mr-4">
                  {isLiked ? (
                    <FaHeart className="h-6 w-6 text-red-500" />
                  ) : (
                    <FiHeart className="h-6 w-6" />
                  )}
                </button>
                <button className="mr-4">
                  <FiMessageCircle className="h-6 w-6" />
                </button>
                <button className="mr-4">
                  <FiSend className="h-6 w-6" />
                </button>
                <button className="ml-auto">
                  <FiBookmark className="h-6 w-6" />
                </button>
              </div>
              
              {/* Likes */}
              <p className="font-semibold text-sm mb-1">
                {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
              </p>
              
              {/* Post time */}
              <p className="text-xs text-gray-500 uppercase mb-3">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
              
              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="flex">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 outline-none text-sm"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                {comment.trim() && (
                  <button 
                    type="submit" 
                    className="text-blue-500 font-semibold text-sm"
                  >
                    Post
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
