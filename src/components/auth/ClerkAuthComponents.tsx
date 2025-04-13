'use client';

import { SignIn, SignUp, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { syncClerkUserToSupabase } from '@/lib/clerk-supabase-sync';

// Custom Sign In component that syncs with Supabase
export function CustomSignIn() {
  const router = useRouter();
  
  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Instagram Clone</h1>
        <p className="text-gray-600">Sign in to your account</p>
      </div>
      
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: 
              'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:bg-gradient-to-r hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white',
            footerActionLink: 'text-blue-600 hover:text-blue-800',
          }
        }}
        signUpUrl="/auth/signup"
        afterSignInUrl="/auth-callback"
        routing="path"
        path="/auth/login"
      />
    </div>
  );
}

// Custom Sign Up component that syncs with Supabase
export function CustomSignUp() {
  const router = useRouter();
  
  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Instagram Clone</h1>
        <p className="text-gray-600">Create a new account</p>
      </div>
      
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: 
              'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:bg-gradient-to-r hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white',
            footerActionLink: 'text-blue-600 hover:text-blue-800',
          }
        }}
        signInUrl="/auth/login"
        afterSignUpUrl="/auth-callback"
        routing="path"
        path="/auth/signup"
      />
    </div>
  );
}

// Custom User Button with sync functionality
export function CustomUserButton() {
  return (
    <UserButton 
      afterSignOutUrl="/"
      appearance={{
        elements: {
          userButtonAvatarBox: 'w-9 h-9',
        }
      }}
    />
  );
}
