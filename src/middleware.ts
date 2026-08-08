import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define strictly public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login(.*)',
  '/signup(.*)'
]);

// Define protected workspace/dashboard routes
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/workspace(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // If the route is protected, enforce authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|webmanifest|ttf|woff2?|png|jpg|jpeg|gif|svg|ico|webp)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
