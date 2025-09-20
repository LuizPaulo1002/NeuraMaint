import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/equipment',
  '/sensors',
  '/alerts',
  '/users',
  '/settings'
];

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/api/health'
];

// Admin-only routes
const adminRoutes = [
  '/users',
  '/settings'
];

// Routes that authenticated users shouldn't access
const authRoutes = [
  '/login'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user has authentication cookie
  const accessToken = request.cookies.get('accessToken');
  const isAuthenticated = !!accessToken;
  
  console.log(`🔍 Middleware: ${pathname} - Authenticated: ${isAuthenticated}`);

  // Allow all API routes to pass through (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  // Handle root path redirect
  if (pathname === '/') {
    if (isAuthenticated) {
      console.log('🏠 Redirecting authenticated user to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      console.log('🏠 Redirecting unauthenticated user to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authRoutes.some(route => pathname.startsWith(route))) {
    console.log('🔄 Redirecting authenticated user away from auth page');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect routes that require authentication
  if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
    console.log('🔒 Redirecting unauthenticated user to login');
    const loginUrl = new URL('/login', request.url);
    // Store the attempted URL for redirect after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For now, we'll handle admin route protection on the client side
  // since we need to decode the JWT to get user role information
  // This can be enhanced later with server-side JWT verification

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};