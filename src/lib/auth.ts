import 'server-only';
import { cookies } from 'next/headers';
import { findUserById } from './data';
import type { User } from './types';
import { auth as adminAuth } from './firebase-admin';

export const SESSION_COOKIE_NAME = 'bit_seguranca_session';
export const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function createSession(idToken: string) {
    if (!adminAuth) throw new Error('Firebase Admin SDK not initialized');
    
    try {
        // Generate session cookie.
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
        cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: expiresIn,
            path: '/',
        });
    } catch (error) {
        console.error('Error creating session cookie:', error);
        // This is a critical error, re-throw it so the calling function can handle it.
        throw new Error('Failed to create session cookie.');
    }
}


export async function getSession(): Promise<{ uid: string } | null> {
    if (!adminAuth) return null;

    const sessionCookie = cookies().get(SESSION_COOKIE_NAME);
    if (sessionCookie) {
        try {
            const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie.value, true);
            return { uid: decodedClaims.uid };
        } catch (error) {
            // This is an expected error if the cookie is invalid.
            // We can clear the invalid cookie.
            console.warn('Invalid session cookie:', error);
            cookies().delete(SESSION_COOKIE_NAME);
            return null;
        }
    }
    return null;
}

export async function deleteSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }
  return findUserById(session.uid);
}
