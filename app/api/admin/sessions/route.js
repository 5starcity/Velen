import { NextResponse } from 'next/server';

/**
 * POST /api/admin/session
 * 
 * Called after Firebase client-side sign-in.
 * Verifies the ID token server-side, checks admin role,
 * then sets an httpOnly session cookie.
 * 
 * In production, use firebase-admin to verify the token.
 */

export async function POST(request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    // -----------------------------------------------
    // PRODUCTION: Verify with Firebase Admin SDK
    // -----------------------------------------------
    // import { adminAuth, adminDb } from '@/lib/firebase-admin';
    // const decoded = await adminAuth.verifyIdToken(idToken);
    // const adminDoc = await adminDb.collection('admins').doc(decoded.uid).get();
    // if (!adminDoc.exists) {
    //   return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
    // }
    // -----------------------------------------------

    // DEV: Simplified — just set the cookie from the token
    // Replace this with the admin verification above before going live
    const response = NextResponse.json({ success: true });
    response.cookies.set('rezidence_admin_session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin session error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('rezidence_admin_session');
  return response;
}