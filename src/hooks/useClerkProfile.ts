'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/database.types';

export interface UseClerkProfileResult {
  profile: Tables<'profiles'> | null;
  isOwnProfile: boolean;
  isLoading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
}

/**
 * Custom hook for integrating Clerk with user profiles
 * @param username The username to look up
 * @returns Profile data, loading state, and whether it's the current user's profile
 */
export function useClerkProfile(username: string): UseClerkProfileResult {
  const { userId } = useAuth();
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const fetchProfile = async () => {
    if (!username) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch profile by username
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setProfile(data);

      // Check if this is the current user's profile
      if (userId && data) {
        setIsOwnProfile(data.id === userId);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch profile data when the component mounts or username changes
  useEffect(() => {
    // Wait for Clerk to be loaded before fetching profile
    if (isClerkLoaded) {
      fetchProfile();
    }
  }, [username, isClerkLoaded, userId]);

  return {
    profile,
    isOwnProfile,
    isLoading,
    error,
    refreshProfile: fetchProfile,
  };
}
