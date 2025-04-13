'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import {
  FiUser,
  FiSettings,
  FiLock,
  FiHelpCircle,
  FiLogOut,
  FiArrowLeft,
  FiChevronRight,
  FiBell,
  FiMoon,
  FiGrid,
  FiLayout,
  FiShield
} from 'react-icons/fi';

export default function SettingsPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const { signOut } = useClerk();
  
  if (!userId) {
    router.push('/auth/login');
    return null;
  }
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };
  
  const settingsCategories = [
    {
      title: 'Account',
      items: [
        {
          icon: <FiUser />,
          label: 'Edit Profile',
          href: '/settings/profile',
        },
        {
          icon: <FiLock />,
          label: 'Password and Security',
          href: '/settings/security',
        },
        {
          icon: <FiBell />,
          label: 'Notifications',
          href: '/settings/notifications',
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: <FiMoon />,
          label: 'Appearance',
          href: '/settings/appearance',
        },
        {
          icon: <FiGrid />,
          label: 'Feed Preferences',
          href: '/settings/feed',
        },
      ],
    },
    {
      title: 'Privacy',
      items: [
        {
          icon: <FiShield />,
          label: 'Privacy and Safety',
          href: '/settings/privacy',
        },
        {
          icon: <FiLayout />,
          label: 'Account Privacy',
          href: '/settings/account-privacy',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <FiHelpCircle />,
          label: 'Help Center',
          href: '/help',
        },
      ],
    },
  ];
  
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
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      {/* Settings Categories */}
      <div className="space-y-8">
        {settingsCategories.map((category) => (
          <div key={category.title}>
            <h2 className="text-lg font-medium mb-3">{category.title}</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {category.items.map((item, index) => (
                <Link 
                  key={item.label} 
                  href={item.href}
                  className={`flex items-center justify-between p-4 hover:bg-gray-50 ${
                    index < category.items.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-gray-500">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <FiChevronRight className="text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Logout Button */}
      <div className="mt-12 mb-4">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
        >
          <FiLogOut className="mr-2" />
          Log Out
        </Button>
      </div>
      
      {/* Account Deletion */}
      <div className="text-center mb-8">
        <button
          onClick={() => router.push('/settings/delete-account')}
          className="text-sm text-red-500 hover:underline"
        >
          Delete Account
        </button>
      </div>
      
      {/* Version Info */}
      <div className="text-center text-xs text-gray-400">
        <p>Instagram Clone v1.0.0</p>
      </div>
    </div>
  );
}
