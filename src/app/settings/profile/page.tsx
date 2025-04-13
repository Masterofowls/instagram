'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@clerk/nextjs';
import { uploadImage } from '@/lib/supabase-storage';
import { Button } from '@/components/ui/Button';
import { Tables } from '@/types/database.types';
import { 
  FiCamera, 
  FiLoader, 
  FiUser, 
  FiLink, 
  FiInfo, 
  FiEdit2,
  FiArrowLeft
} from 'react-icons/fi';

export default function ProfileEditPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Username validation
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        router.push('/auth/login');
        return;
      }
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setProfile(data);
          setUsername(data.username);
          setFullName(data.full_name || '');
          setWebsite(data.website || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar_url || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId, router]);
  
  // Check username availability
  useEffect(() => {
    if (!username || username === profile?.username) {
      setIsUsernameAvailable(true);
      return;
    }
    
    const checkUsername = async () => {
      setIsCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .not('id', 'eq', userId || '')
          .maybeSingle();
          
        if (error) throw error;
        
        setIsUsernameAvailable(!data);
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setIsCheckingUsername(false);
      }
    };
    
    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [username, profile, userId]);
  
  const handleSave = async () => {
    if (!userId) return;
    
    // Validate fields
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (!isUsernameAvailable) {
      setError('This username is already taken');
      return;
    }
    
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');
      
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          full_name: fullName,
          website,
          bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
        
      if (error) throw error;
      
      setSuccess('Profile updated successfully');
      
      // Allow the success message to be visible for a short time
      setTimeout(() => {
        router.push(`/profile/${username}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    try {
      setIsAvatarUploading(true);
      setError('');
      
      const { url, error } = await uploadImage(file, 'avatars', userId);
      
      if (error) throw error;
      
      setAvatarUrl(url);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Failed to upload avatar');
    } finally {
      setIsAvatarUploading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 mr-4 rounded-full hover:bg-gray-100"
        >
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>
      
      {/* Error and Success messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-500 rounded-md">
          {success}
        </div>
      )}
      
      {/* Profile Picture */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-24 h-24 md:w-32 md:h-32 mb-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={username}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-500">
                {username ? username.substring(0, 2).toUpperCase() : 'U'}
              </span>
            </div>
          )}
          
          {isAvatarUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full">
              <FiLoader className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-md hover:bg-blue-600 transition"
            disabled={isAvatarUploading}
          >
            <FiCamera className="h-4 w-4" />
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        
        <p className="text-sm text-gray-500">
          Click on the camera icon to change your profile photo
        </p>
      </div>
      
      {/* Form */}
      <div className="space-y-6">
        {/* Username */}
        <div>
          <div className="flex items-center mb-2">
            <FiUser className="mr-2 text-gray-500" />
            <label htmlFor="username" className="font-medium">
              Username
            </label>
          </div>
          <div className="relative">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
              className={`w-full p-2 border rounded-md ${
                !isUsernameAvailable ? 'border-red-500' : ''
              }`}
              placeholder="username"
            />
            {isCheckingUsername && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FiLoader className="animate-spin h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
          {!isUsernameAvailable && (
            <p className="text-sm text-red-500 mt-1">
              This username is already taken
            </p>
          )}
        </div>
        
        {/* Full Name */}
        <div>
          <div className="flex items-center mb-2">
            <FiEdit2 className="mr-2 text-gray-500" />
            <label htmlFor="fullName" className="font-medium">
              Name
            </label>
          </div>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Your full name"
          />
        </div>
        
        {/* Website */}
        <div>
          <div className="flex items-center mb-2">
            <FiLink className="mr-2 text-gray-500" />
            <label htmlFor="website" className="font-medium">
              Website
            </label>
          </div>
          <input
            id="website"
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="https://yourwebsite.com"
          />
        </div>
        
        {/* Bio */}
        <div>
          <div className="flex items-center mb-2">
            <FiInfo className="mr-2 text-gray-500" />
            <label htmlFor="bio" className="font-medium">
              Bio
            </label>
          </div>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={4}
            placeholder="Tell us about yourself..."
            maxLength={150}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {bio.length}/150
          </p>
        </div>
        
        {/* Save button */}
        <div className="flex justify-end mt-8">
          <Button
            onClick={handleSave}
            disabled={isSaving || isAvatarUploading || !isUsernameAvailable}
          >
            {isSaving ? 
              <FiLoader className="animate-spin h-4 w-4 mr-2" /> : 
              null
            }
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
