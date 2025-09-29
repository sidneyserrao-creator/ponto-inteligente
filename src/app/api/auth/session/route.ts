import { type NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME, expiresIn } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    
    try {
      // Generate session cookie
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      
      const response = NextResponse.json({ status: 'success' });
      // Set cookie on response
      response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: expiresIn,
        path: '/',
      });
      
      return response;

    } catch (error) {
      console.error('Error creating session cookie:', error);
      return NextResponse.json({ error: 'Failed to create session.' }, { status: 401 });
    }
  }

  return NextResponse.json({ error: 'No token provided.' }, { status: 400 });
}
