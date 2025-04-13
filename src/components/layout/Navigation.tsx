'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import { Dialog, Transition } from '@headlessui/react';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  HeartIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid } from '@heroicons/react/24/solid';
import Image from 'next/image';

// Navigation items
const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon, activeIcon: HomeIconSolid },
  { name: 'Search', href: '/explore', icon: MagnifyingGlassIcon },
  { name: 'Create', href: '/create', icon: PlusCircleIcon },
  { name: 'Notifications', href: '/notifications', icon: HeartIcon },
  { name: 'Messages', href: '/messages', icon: ChatBubbleOvalLeftEllipsisIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
];

export default function Navigation() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show navigation on auth pages
  if (pathname?.startsWith('/auth') || pathname === '/auth-callback') {
    return null;
  }

  // If not signed in, redirect to login (or show a limited navigation)
  if (!isSignedIn) {
    return null;
  }

  return (
    <>
      {/* Desktop Navigation - Side Navigation */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:block md:w-20 md:overflow-y-auto md:bg-white md:pb-4 lg:w-64 border-r border-gray-200 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex h-16 shrink-0 items-center justify-center px-4 lg:justify-start">
          <div className="lg:hidden">
            <Image 
              src="/instagram-icon.png" 
              alt="Instagram Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
          </div>
          <div className="hidden lg:flex">
            <Image
              src="/instagram-logo.png"
              alt="Instagram Logo"
              width={103}
              height={30}
              className="h-8 w-auto"
            />
          </div>
        </div>
        <nav className="mt-8 flex flex-col justify-between h-[calc(100vh-5rem)]">
          <div className="space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex gap-x-3 rounded-md p-3 text-sm font-semibold leading-6 
                    ${isActive 
                      ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white' 
                      : 'text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white'}
                  `}
                >
                  <Icon 
                    className={`h-6 w-6 shrink-0 ${isActive ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white'}`} 
                    aria-hidden="true" 
                  />
                  <span className="hidden lg:block">{item.name}</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-auto px-2">
            <div className="flex items-center gap-x-4 px-3 py-3 text-sm font-semibold leading-6 text-gray-900 dark:text-white">
              <UserButton afterSignOutUrl="/auth/login" />
              <span className="hidden lg:block">Account</span>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Navigation - Bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <nav className="flex justify-around py-2">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center px-3 py-2 text-xs font-medium
                  ${isActive 
                    ? 'text-black dark:text-white' 
                    : 'text-gray-500 dark:text-gray-400'}
                `}
              >
                <Icon 
                  className="h-6 w-6" 
                  aria-hidden="true" 
                />
                <span className="mt-1">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile button on mobile */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <UserButton afterSignOutUrl="/auth/login" />
      </div>

      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 dark:text-gray-400"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Open main menu</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <Transition.Root show={mobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={setMobileMenuOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute right-0 top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <Image
                      src="/instagram-logo.png"
                      alt="Instagram Logo"
                      width={103}
                      height={30}
                      className="h-8 w-auto"
                    />
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul className="-mx-2 space-y-1">
                          {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;
                            
                            return (
                              <li key={item.name}>
                                <Link
                                  href={item.href}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className={`
                                    group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 
                                    ${isActive 
                                      ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white' 
                                      : 'text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white'}
                                  `}
                                >
                                  <Icon 
                                    className={`h-6 w-6 shrink-0 ${isActive ? 'text-black dark:text-white' : 'text-gray-400 group-hover:text-black dark:group-hover:text-white'}`} 
                                    aria-hidden="true" 
                                  />
                                  {item.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
