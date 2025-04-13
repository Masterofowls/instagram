'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  FiHome, 
  FiSearch, 
  FiCompass, 
  FiFilm, 
  FiMessageCircle, 
  FiHeart, 
  FiPlusSquare, 
  FiMenu
} from 'react-icons/fi';
import Image from 'next/image';

const navItems = [
  { name: 'Home', path: '/', icon: FiHome },
  { name: 'Search', path: '/search', icon: FiSearch },
  { name: 'Explore', path: '/explore', icon: FiCompass },
  { name: 'Reels', path: '/reels', icon: FiFilm },
  { name: 'Messages', path: '/messages', icon: FiMessageCircle },
  { name: 'Notifications', path: '/notifications', icon: FiHeart },
  { name: 'Create', path: '/create', icon: FiPlusSquare },
];

const SideNavigation = () => {
  const pathname = usePathname();
  const { user, profile, logout } = useAuthStore();
  
  // If user is not authenticated and not on auth pages, don't show sidebar
  if (!user && !pathname.startsWith('/auth')) {
    return null;
  }
  
  // Don't show sidebar on auth pages
  if (pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <aside className="w-64 h-full border-r border-gray-200 bg-white flex flex-col">
      <div className="p-6">
        <Link href="/">
          <h1 className="text-xl font-bold">Instagram</h1>
        </Link>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2 px-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.path}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-md text-sm',
                  pathname === item.path
                    ? 'font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <item.icon size={24} />
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {profile && (
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="flex items-center justify-between">
            <Link href={`/profile/${profile.username}`} className="flex items-center gap-3">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {profile.username.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{profile.username}</p>
              </div>
            </Link>
            <button onClick={logout} className="text-sm text-blue-500">
              <FiMenu size={20} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default SideNavigation;
