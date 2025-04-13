'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuth, useUser } from '@clerk/nextjs';
import { syncClerkUserToSupabase } from '@/lib/clerk-supabase-sync';

const publicPaths = ['/auth/login', '/auth/signup'];

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, fetchProfile } = useAuthStore();

  // Get Clerk auth state
  const { isLoaded: isClerkLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  useEffect(() => {
    if (!isClerkLoaded) return;

    const handleAuthChange = async () => {
      if (isSignedIn && clerkUser) {
        // Clerk is authenticated, update user state
        useAuthStore.setState({ 
          user: { 
            id: clerkUser.id, 
            email: clerkUser.primaryEmailAddress?.emailAddress || '' 
          } 
        });
        
        // Fetch profile from Supabase using Clerk user ID
        await fetchProfile();
        
        // If on a public path, redirect to home
        if (publicPaths.includes(pathname)) {
          router.push('/');
        }
      } else {
        // Reset user state when not signed in
        useAuthStore.setState({ user: null, profile: null });
        
        // If not on a public path or auth-callback, redirect to login
        if (!publicPaths.includes(pathname) && pathname !== '/auth-callback') {
          router.push('/auth/login');
        }
      }
    };

    handleAuthChange();
  }, [isClerkLoaded, isSignedIn, clerkUser, fetchProfile, pathname, router]);

  // Initialize profile sync from Clerk to Supabase
  useEffect(() => {
    if (isClerkLoaded && isSignedIn && clerkUser && !user) {
      // This will help ensure the Supabase profile exists
      syncClerkUserToSupabase().catch(err => {
        console.error('Error syncing user data:', err);
      });
    }
  }, [isClerkLoaded, isSignedIn, clerkUser, user]);

  return <>{children}</>;
};

export default AuthProvider;
