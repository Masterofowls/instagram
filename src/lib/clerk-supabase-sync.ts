'use server';

import { createClient } from '@supabase/supabase-js';
import { currentUser } from '@clerk/nextjs/server';

// Initialize Supabase with service role for admin operations
// This should be kept server-side only
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function syncClerkUserToSupabase() {
  try {
    const user = await currentUser();
    console.log('Current user from Clerk:', user ? 'User found' : 'No user found');
    
    if (!user) {
      console.error('No authenticated user found');
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
  
  const userId = user.id;
  
    // Check if user already exists in Supabase
    console.log('Checking if user exists in Supabase with clerk_id:', userId);
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      throw new Error('Failed to fetch user from Supabase');
    }
    
    // User doesn't exist, create them
    if (!existingUser) {
      // Get the user data from Clerk
      let userData;
      try {
        const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Clerk API response error:', errorText);
          throw new Error(`Clerk API error: ${response.status} ${response.statusText}`);
        }
        
        userData = await response.json();
        console.log('Fetched user data from Clerk:', userData);
      } catch (apiError) {
        console.error('Error fetching from Clerk API:', apiError);
        throw new Error('Failed to fetch user data from Clerk API');
      }
      
      if (!userData) {
        console.error('No user data received from Clerk');
        throw new Error('Failed to fetch user data from Clerk');
      }
      
      // Create user in Supabase
      console.log('Creating user profile in Supabase with data:', {
        id: userId,
        clerk_id: userId,
        username: userData.username || `user_${userId.substring(0, 8)}`,
        email: userData.email_addresses?.[0]?.email_address
      });
      
      // Create a properly typed profile data object
      interface ProfileData {
        id: string;
        clerk_id: string;
        username: string;
        full_name?: string;
        email?: string;
        avatar_url?: string;
        bio: string;
        website: string;
        created_at: string;
        updated_at: string;
        [key: string]: any; // Add index signature for dynamic access
      }
      
      const profileData: ProfileData = {
        id: userId, // Use Clerk's userId as Supabase id
        clerk_id: userId,
        username: userData.username || `user_${userId.substring(0, 8)}`,
        full_name: userData.first_name && userData.last_name ? 
          `${userData.first_name} ${userData.last_name}`.trim() : 
          undefined,
        email: userData.email_addresses?.[0]?.email_address,
        avatar_url: userData.image_url || undefined,
        bio: '',
        website: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(profileData).forEach(key => {
        if (profileData[key] === undefined) {
          delete profileData[key];
        }
      });
      
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert(profileData);
      
      if (insertError) {
        console.error('Error creating user in Supabase:', insertError);
        throw new Error('Failed to create user in Supabase');
      }
      
      console.log('User successfully created in Supabase');
    } else {
      console.log('User already exists in Supabase');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error syncing user to Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
