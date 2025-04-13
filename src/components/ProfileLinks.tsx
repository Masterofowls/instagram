'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/database.types';
import { useAuth } from '@clerk/nextjs';

export default function ProfileLinks() {
  const [users, setUsers] = useState<Tables<'profiles'>[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(10);
          
        if (error) throw error;
        
        if (data) {
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // If no users found, create a demo user for testing
  const createDemoUser = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Check if a user with username 'demouser' already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', 'demouser')
        .single();
        
      if (existingUser) {
        // If demo user exists, just fetch users again
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .limit(10);
          
        if (data) {
          setUsers(data);
        }
        return;
      }
      
      // Create demo user if it doesn't exist
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: 'demouser',
          full_name: 'Demo User',
          bio: 'This is a demo user for testing profiles',
          avatar_url: 'https://i.pravatar.cc/150?img=1',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Fetch users after creating demo user
      const { data: updatedUsers } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);
        
      if (updatedUsers) {
        setUsers(updatedUsers);
      }
    } catch (error) {
      console.error('Error creating demo user:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-500">Loading users...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Available Profiles</h2>
      
      {users.length > 0 ? (
        <div className="space-y-3">
          {users.map(user => (
            <Link 
              key={user.id} 
              href={`/profile/${user.username}`}
              className="flex items-center p-2 hover:bg-gray-50 rounded-md transition"
            >
              <div className="w-10 h-10 relative mr-3">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.username}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-500">
                      {user.username.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium">{user.username}</p>
                {user.full_name && (
                  <p className="text-sm text-gray-500">{user.full_name}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-4">No users found. Create a demo user to get started:</p>
          <button
            onClick={createDemoUser}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Create Demo User
          </button>
        </div>
      )}
    </div>
  );
}
