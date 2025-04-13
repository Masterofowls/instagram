'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiImage, FiX } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { v4 as uuidv4 } from 'uuid';

export default function CreateStoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    if (!image) {
      setError('Please select an image');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Upload image to storage
      const fileExt = image.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `stories/${fileName}`;
      
      const { error: uploadError } = await supabase
        .storage
        .from('instagram')
        .upload(filePath, image);
      
      if (uploadError) {
        setError(uploadError.message);
        setIsLoading(false);
        return;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('instagram')
        .getPublicUrl(filePath);
      
      // Calculate expiry time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Create story in database
      const { error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          expires_at: expiresAt.toISOString(),
        });
      
      if (storyError) {
        setError(storyError.message);
        setIsLoading(false);
        return;
      }
      
      // Navigate back to home
      router.push('/');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    }
    
    setIsLoading(false);
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
        <h1 className="text-xl font-semibold mb-4">Create a Story</h1>
        
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
              <p className="text-xs text-gray-400">Your story will be visible for 24 hours</p>
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
              <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
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
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              className="flex-1"
              isLoading={isLoading}
            >
              Share
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
