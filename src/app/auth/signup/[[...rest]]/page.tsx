import React from 'react';
import { CustomSignUp } from '@/components/auth/ClerkAuthComponents';

export const metadata = {
  title: 'Sign Up | Instagram Clone',
  description: 'Create a new Instagram Clone account',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <CustomSignUp />
    </div>
  );
}
