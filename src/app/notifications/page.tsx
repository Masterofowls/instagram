'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Tables } from '@/types/database.types';

interface Notification extends Tables<'notifications'> {
  sender: Tables<'profiles'>;
}

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:profiles!sender_id(*)
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data && !error) {
        setNotifications(data as unknown as Notification[]);
      }
      
      setIsLoading(false);
      
      // Mark notifications as read (in a real app)
      // This would update a 'read' boolean field
    };
    
    fetchNotifications();
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user?.id}`,
        },
        async (payload) => {
          // Fetch the complete notification with sender profile
          const { data } = await supabase
            .from('notifications')
            .select(`
              *,
              sender:profiles!sender_id(*)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            setNotifications(prev => [data as unknown as Notification, ...prev]);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const getNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return (
          <>
            <span className="font-semibold">{notification.sender.username}</span>
            {' liked your post. '}
            <span className="text-gray-500">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
          </>
        );
      case 'comment':
        return (
          <>
            <span className="font-semibold">{notification.sender.username}</span>
            {' commented: '}{notification.message}{' '}
            <span className="text-gray-500">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
          </>
        );
      case 'follow':
        return (
          <>
            <span className="font-semibold">{notification.sender.username}</span>
            {' started following you. '}
            <span className="text-gray-500">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
          </>
        );
      default:
        return (
          <>
            <span className="font-semibold">{notification.sender.username}</span>
            {' '}{notification.message}{' '}
            <span className="text-gray-500">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
          </>
        );
    }
  };
  
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-6">Notifications</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {notifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-md border border-gray-200">
              <h2 className="text-lg font-semibold mb-2">No Notifications Yet</h2>
              <p className="text-gray-500">
                When someone likes or comments on your posts, or follows you, you'll see it here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-md border border-gray-200">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className="flex items-start p-4 border-b border-gray-100 last:border-b-0"
                >
                  <Link href={`/profile/${notification.sender.username}`}>
                    {notification.sender.avatar_url ? (
                      <Image
                        src={notification.sender.avatar_url}
                        alt={notification.sender.username}
                        width={44}
                        height={44}
                        className="rounded-full object-cover mr-3"
                      />
                    ) : (
                      <div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-gray-600">
                          {notification.sender.username.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>
                  
                  <div className="flex-1">
                    <p className="text-sm">
                      {getNotificationContent(notification)}
                    </p>
                  </div>
                  
                  {notification.type === 'like' || notification.type === 'comment' ? (
                    <Link href={`/p/${notification.message.split(':')[1]}`} className="ml-2">
                      <div className="w-10 h-10 bg-gray-100 rounded-sm"></div>
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
