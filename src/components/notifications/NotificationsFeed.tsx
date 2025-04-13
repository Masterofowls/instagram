'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { HeartIcon, UserPlusIcon, ChatBubbleLeftIcon, PhotoIcon } from '@heroicons/react/24/solid';
import TimeAgo from '@/components/ui/TimeAgo';

// Notification types
type NotificationType = 'like' | 'follow' | 'comment' | 'tag' | 'mention';

// Notification interface
interface Notification {
  id: string;
  type: NotificationType;
  user: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  post?: {
    id: string;
    imageUrl: string;
  };
  text: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsFeed() {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    // In a real app, fetch notifications from API
    // This is mock data for demonstration
    const mockNotifications = Array.from({ length: 15 }, (_, i) => {
      const types: NotificationType[] = ['like', 'follow', 'comment', 'tag', 'mention'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const notification: Notification = {
        id: `notification-${i}`,
        type,
        user: {
          id: `user-${i}`,
          username: `user${i}`,
          avatarUrl: `https://i.pravatar.cc/150?img=${i + 40}`,
        },
        read: Math.random() > 0.3,
        text: '',
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      };

      // Add post data for like, comment, tag notifications
      if (type === 'like' || type === 'comment' || type === 'tag') {
        notification.post = {
          id: `post-${i}`,
          imageUrl: `https://picsum.photos/150/150?random=${i}`,
        };
      }

      // Set notification text based on type
      switch (type) {
        case 'like':
          notification.text = 'liked your post.';
          break;
        case 'follow':
          notification.text = 'started following you.';
          break;
        case 'comment':
          notification.text = 'commented on your post: "Great photo!"';
          break;
        case 'tag':
          notification.text = 'tagged you in a post.';
          break;
        case 'mention':
          notification.text = 'mentioned you in a comment: "@username check this out!"';
          break;
      }

      return notification;
    });

    setNotifications(mockNotifications);
    setLoading(false);
  }, [userId]);

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return <HeartIcon className="h-5 w-5 text-red-500" />;
      case 'follow':
        return <UserPlusIcon className="h-5 w-5 text-blue-500" />;
      case 'comment':
      case 'mention':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-green-500" />;
      case 'tag':
        return <PhotoIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <HeartIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto md:ml-20 lg:ml-64 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Notifications</h1>
          <div className="flex items-center space-x-4">
            <div className="flex rounded-md overflow-hidden">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm ${
                  filter === 'unread'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Unread
              </button>
            </div>
            <button 
              onClick={markAllAsRead}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {filteredNotifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No notifications to display.</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex-shrink-0 mr-4">
                  <Link href={`/profile/${notification.user.id}`}>
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src={notification.user.avatarUrl}
                        alt={notification.user.username}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Link>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-0.5">
                    <Link 
                      href={`/profile/${notification.user.id}`}
                      className="font-semibold text-sm hover:underline mr-1"
                    >
                      {notification.user.username}
                    </Link>
                    <span className="text-sm text-gray-700 dark:text-gray-300 break-words">
                      {notification.text}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <TimeAgo date={notification.createdAt} />
                  </div>
                </div>

                <div className="flex-shrink-0 ml-4 flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  {notification.post && (
                    <Link href={`/post/${notification.post.id}`}>
                      <div className="relative h-10 w-10 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <Image
                          src={notification.post.imageUrl}
                          alt="Post thumbnail"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
