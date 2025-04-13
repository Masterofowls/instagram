'use client';

import React, { useEffect } from 'react';
import DirectMessages from '@/components/messages/DirectMessages';
import { useAuth } from '@clerk/nextjs';

export default function MessagesPage() {
  const { isLoaded } = useAuth();
  
  // Simple loading state if needed
  const [loading, setLoading] = React.useState(!isLoaded);
  
  useEffect(() => {
    if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded]);
  
  if (loading) {
    return (
      <div className="min-h-screen md:ml-20 lg:ml-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <div>
      <DirectMessages />
    </div>
  );
}
