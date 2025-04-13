'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9._]+$/, 'Username can only contain letters, numbers, periods, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

const SignupForm = () => {
  const router = useRouter();
  const { signup, isLoading } = useAuthStore();
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      fullName: '',
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setError(null);
    const { error: signupError } = await signup(
      data.email, 
      data.password, 
      data.username, 
      data.fullName
    );
    
    if (signupError) {
      setError(signupError.message || 'Error creating account. Please try again.');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Instagram</h1>
        <p className="text-gray-500">Sign up to see photos and videos from your friends.</p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Input
            placeholder="Email"
            {...register('email')}
            error={errors.email?.message}
          />
        </div>
        
        <div>
          <Input
            placeholder="Full Name"
            {...register('fullName')}
            error={errors.fullName?.message}
          />
        </div>
        
        <div>
          <Input
            placeholder="Username"
            {...register('username')}
            error={errors.username?.message}
          />
        </div>
        
        <div>
          <Input
            type="password"
            placeholder="Password"
            {...register('password')}
            error={errors.password?.message}
          />
        </div>
        
        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
        >
          Sign Up
        </Button>
      </form>
      
      <div className="text-center text-sm">
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="px-4 text-gray-500">OR</div>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
        
        <p className="mt-4">
          Have an account?{' '}
          <Link href="/auth/login" className="text-blue-500 font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;
