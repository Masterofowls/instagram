import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      // Avatar and placeholder image domains
      'i.pravatar.cc',
      'picsum.photos',
      'via.placeholder.com',
      
      // Supabase storage domain for user uploaded images
      'cljxpcwjkaapzsgalbrk.supabase.co',
      
      // Allow Clerk auth avatar images
      'img.clerk.com',
      'images.clerk.dev',
      
      // Additional common image hosting services
      'res.cloudinary.com',
      'images.unsplash.com'
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
  }
};

export default nextConfig;
