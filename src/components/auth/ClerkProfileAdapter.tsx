'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Tables } from '@/types/database.types';

/**
 * This component synchronizes Clerk user data with Supabase profiles
 * It should be added to layout files where profile data is needed
 */
export default function ClerkProfileAdapter() {
  const { userId } = useAuth();
  const { user, isLoaded } = useUser();
  const { setProfile } = useAuthStore();
  const [syncedProfile, setSyncedProfile] = useState<Tables<'profiles'> | null>(null);

  useEffect(() => {
    // Only proceed if user is loaded and exists
    if (!isLoaded || !user || !userId) return;

    const syncUserToSupabase = async () => {
      try {
        // Check if user exists in Supabase
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // Error other than "not found"
          console.error('Error checking for existing profile:', fetchError);
          return;
        }

        // Get primary email
        const primaryEmail = user.emailAddresses.find(
          email => email.id === user.primaryEmailAddressId
        )?.emailAddress;

        // Format name
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

        if (!existingProfile) {
          console.log('No existing profile found, creating new profile');
          // User doesn't exist in Supabase, create a new profile
          const newUsername = user.username || `user_${userId.substring(0, 8)}`;
          
          // Prepare profile data
          const profileData = {
            id: userId,
            clerk_id: userId,
            username: newUsername,
            full_name: fullName || null,
            email: primaryEmail || null,
            avatar_url: user.imageUrl || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          console.log('Attempting to insert new profile with data:', { 
            username: profileData.username,
            full_name: profileData.full_name 
          });
          
          const { data: newProfile, error: insertError, status: insertStatus } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();
          
          console.log('Profile insert response status:', insertStatus);

          if (insertError) {
            console.error('Error creating profile in Supabase:', insertError);
          } else if (newProfile) {
            // Set the profile in the global auth store
            setProfile(newProfile);
            setSyncedProfile(newProfile);
            console.log('Created new Instagram profile:', newProfile.username);
          } else {
            console.error('Failed to create profile: No error but no profile returned');
          }
        } else {
          // User exists, check if we need to update anything
          const needsUpdate = 
            existingProfile.username !== user.username ||
            existingProfile.full_name !== fullName ||
            existingProfile.email !== primaryEmail ||
            existingProfile.avatar_url !== user.imageUrl;

          if (needsUpdate) {
            // Update the profile
            const { data: updatedProfile, error: updateError } = await supabase
              .from('profiles')
              .update({
                username: user.username || existingProfile.username,
                full_name: fullName || existingProfile.full_name,
                email: primaryEmail || existingProfile.email,
                avatar_url: user.imageUrl || existingProfile.avatar_url,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId)
              .select()
              .single();

            if (updateError) {
              console.error('Error updating profile in Supabase:', updateError);
            } else if (updatedProfile) {
              // Set the updated profile in the global auth store
              setProfile(updatedProfile);
              setSyncedProfile(updatedProfile);
              console.log('Updated Instagram profile:', updatedProfile.username);
            }
          } else {
            // No updates needed, just set the existing profile
            setProfile(existingProfile);
            setSyncedProfile(existingProfile);
          }
        }
      } catch (error) {
        console.error('Error in profile synchronization:', error);
      }
    };

    syncUserToSupabase();
  }, [userId, user, isLoaded]);

  // This component doesn't render anything visually, but it logs the synced profile status
  return (
    <div style={{ display: 'none' }} aria-hidden="true">
      {syncedProfile && (
        <div id="clerk-profile-sync-status" data-synced="true" data-username={syncedProfile.username}></div>
      )}
    </div>
  );
}
