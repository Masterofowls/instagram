import React from 'react';
import { CustomSignIn } from '@/components/auth/ClerkAuthComponents';

export const metadata = {
  title: 'Login | Instagram Clone',
  description: 'Login to your Instagram Clone account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <CustomSignIn />
    </div>
  );
}
