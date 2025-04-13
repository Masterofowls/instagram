import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import SideNavigation from "@/components/navigation/SideNavigation";
import AuthProvider from "@/components/auth/AuthProvider";
import { ClerkProvider } from "@/components/auth/ClerkProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Instagram Clone",
  description: "A modern Instagram clone built with Next.js and TypeScript",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={cn("h-full bg-gray-50", geistSans.variable)}>
        <ClerkProvider>
          <AuthProvider>
            <div className="flex h-full">
              {/* Main content area */}
              <SideNavigation />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
