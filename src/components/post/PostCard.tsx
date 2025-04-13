'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiMessageCircle, FiSend, FiBookmark } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useAuthStore } from '@/store/useAuthStore';
import { usePostStore } from '@/store/usePostStore';
import { Tables } from '@/types/database.types';

type PostWithUser = Tables<'posts'> & {
  profiles: Tables<'profiles'>;
  likes: Tables<'likes'>[];
  comments: Tables<'comments'>[];
};

interface PostCardProps {
  post: PostWithUser;
}

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuthStore();
  const { likePost, unlikePost, addComment } = usePostStore();
  const [comment, setComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  
  const isLiked = post.likes.some(like => like.user_id === user?.id);
  const likeCount = post.likes.length;
  const commentCount = post.comments.length;
  
  const toggleLike = () => {
    if (isLiked) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  };
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      addComment(post.id, comment);
      setComment('');
    }
  };
  
  const displayComments = showAllComments ? post.comments : post.comments.slice(0, 2);
  
  return (
    <div className="bg-white border border-gray-200 rounded-md mb-6">
      {/* Post Header */}
      <div className="flex items-center p-3">
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
        <button className="ml-auto text-gray-500">•••</button>
      </div>
      
      {/* Post Image */}
      <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
        <Image
          src={post.image_url}
          alt="Post"
          fill={true}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={true}
        />
      </div>
      
      {/* Post Actions */}
      <div className="p-3">
        <div className="flex items-center mb-2">
          <button onClick={toggleLike} className="mr-4">
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
        {likeCount > 0 && (
          <p className="font-semibold text-sm mb-1">
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </p>
        )}
        
        {/* Caption */}
        {post.caption && (
          <p className="text-sm mb-1">
            <Link href={`/profile/${post.profiles.username}`} className="font-semibold mr-1">
              {post.profiles.username}
            </Link>
            {post.caption}
          </p>
        )}
        
        {/* Comments */}
        {commentCount > 2 && !showAllComments && (
          <button 
            onClick={() => setShowAllComments(true)}
            className="text-gray-500 text-sm mb-2"
          >
            View all {commentCount} comments
          </button>
        )}
        
        {displayComments.map((comment) => (
          <div key={comment.id} className="text-sm mb-1">
            <Link href={`/profile/${comment.user_id}`} className="font-semibold mr-1">
              {comment.user_id}
            </Link>
            {comment.content}
          </div>
        ))}
        
        {/* Timestamp */}
        <p className="text-gray-400 text-xs uppercase mt-2">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </p>
      </div>
      
      {/* Add Comment */}
      <form onSubmit={handleAddComment} className="border-t border-gray-200 p-3 flex">
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
  );
};

export default PostCard;
