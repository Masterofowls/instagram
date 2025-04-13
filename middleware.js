import { clerkMiddleware } from "@clerk/nextjs/server";
 
export default clerkMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    "/",
    "/auth/login(.*)",
    "/auth/signup(.*)", 
    "/api/webhook(.*)",
    "/api/supabase-sync"
  ],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: [
    "/api/webhook/clerk"
  ],
});
 
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
