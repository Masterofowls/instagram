'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { syncClerkUserToSupabase } from '@/lib/clerk-supabase-sync';
import { useAuth } from '@clerk/nextjs';

export default function AuthCallback() {
  const router = useRouter();
  const { isLoaded, userId, isSignedIn } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    async function syncUserData() {
      try {
        console.log('Auth state:', { isLoaded, isSignedIn, userId });
        
        if (isSignedIn && userId) {
          console.log('User is signed in, attempting to sync with Supabase...');
          
          try {
            // Sync user data to Supabase
            const result = await syncClerkUserToSupabase();
            console.log('Sync result:', result);
            
            if (!result.success) {
              console.error('Error syncing user data:', result.error);
              setError('There was an error syncing your account. Please try again.');
              setIsProcessing(false);
              return;
            }
            
            console.log('Successfully synced user data, redirecting to home...');
            // Redirect to home page after successful sync
            router.push('/');
          } catch (syncError) {
            console.error('Error during Supabase sync:', syncError);
            setError(`Sync error: ${syncError instanceof Error ? syncError.message : 'Unknown error'}`);
            setIsProcessing(false);
          }
        } else {
          console.log('User not signed in, redirecting to login...');
          // If not signed in, redirect to login page
          router.push('/auth/login');
        }
      } catch (err) {
        console.error('Error during auth callback:', err);
        setError('There was an error authenticating your account. Please try again.');
        setIsProcessing(false);
      }
    }

    syncUserData();
  }, [isLoaded, isSignedIn, userId, router]);

  // Loading state while processing
  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Setting up your account...</h2>
          <p className="text-gray-600">Please wait while we prepare your Instagram experience.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Default render (should not be visible for long)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse">Authenticating...</div>
    </div>
  );
}
