import { NextResponse } from 'next/server';

/**
 * Middleware: Protect all /admin routes.
 * Replace this logic with your actual Firebase token verification.
 * 
 * Options for auth check:
 * 1. Read a session cookie set after Firebase Auth sign-in
 * 2. Verify a JWT from the cookie against Firebase Admin SDK
 * 3. Keep it simple: check for a hardcoded admin session cookie in dev
 */

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Read your admin session cookie
  // Set this cookie after verifying the user is an admin in your Firebase auth flow
  const adminSession = request.cookies.get('rezidence_admin_session');

  if (!adminSession) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Optional: Verify the cookie value is a valid signed token
  // In production, use Firebase Admin SDK to verify the ID token
  // const isValid = await verifyAdminToken(adminSession.value);
  // if (!isValid) return NextResponse.redirect(loginUrl);

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};