'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiImage, FiX } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePostStore } from '@/store/usePostStore';
import Image from 'next/image';

export default function CreatePostPage() {
  const router = useRouter();
  const { createPost, isLoading } = usePostStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Only accept image files
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image) {
      setError('Please select an image');
      return;
    }
    
    const result = await createPost(caption, image, location || undefined);
    
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error?.message || 'Failed to create post');
    }
  };
  
  const clearImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h1 className="text-xl font-semibold mb-4">Create New Post</h1>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!preview ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer hover:bg-gray-50 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              <FiImage className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 mb-2">Click to upload an image</p>
              <p className="text-xs text-gray-400">JPEG, PNG, GIF</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
            </div>
          ) : (
            <div className="relative">
              <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <button 
                type="button"
                className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-1 rounded-full"
                onClick={clearImage}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location (optional)
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Share
          </Button>
        </form>
      </div>
    </div>
  );
}
