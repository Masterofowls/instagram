'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const appearance = {
    baseTheme: theme === 'dark' ? dark : undefined,
    variables: {
      colorPrimary: '#0095f6',
    },
    elements: {
      formButtonPrimary:
        'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:bg-gradient-to-r hover:from-pink-600 hover:via-red-600 hover:to-yellow-600',
      footerActionLink: 'text-blue-600 hover:text-blue-800',
    },
  };

  return (
    <BaseClerkProvider
      appearance={appearance}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      {children}
    </BaseClerkProvider>
  );
}
