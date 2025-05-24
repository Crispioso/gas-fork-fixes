// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Define routes that should be protected
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)', // Protects /admin and all its sub-routes
  // Add other routes you want to protect here
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // The auth object can be used to check authentication status:
  // const { userId, sessionClaims } = auth; // Access properties directly if auth is an object
  // console.log("User ID from auth object:", auth.userId);

  if (isProtectedRoute(req)) {
    // For protected routes, ensure the user is authenticated.
    // auth.protect() will redirect unauthenticated users to the sign-in page.
    // If it returns a promise, you should await it.
    await auth.protect(); // Corrected: auth is an object, not a function to be called
  }

  // Allow all other requests to proceed by default if not explicitly protected
  // or if auth.protect() doesn't throw/redirect.
  return NextResponse.next();
});

export const config = {
  // This matcher ensures the middleware runs on all routes except for static files (_next/static)
  // and Next.js internal paths (_next/image, favicon.ico, etc.)
  // It's a common default matcher.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
