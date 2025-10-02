import 'server-only';
import { cookies } from 'next/headers';
import { findUserById } from './data';
import type { User } from './types';
import { auth as adminAuth } from './firebase-admin';

export const SESSION_COOKIE_NAME = 'bit_seguranca_session';
export const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

/**
 * Cria o valor do cookie de sessão, mas não o define.
 * Retorna o valor do cookie para ser definido pela Server Action.
 */
export async function createSession(idToken: string): Promise<string> {
    if (!adminAuth) throw new Error('Firebase Admin SDK not initialized');
    
    try {
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
        return sessionCookie;
    } catch (error) {
        console.error('Error creating session cookie value:', error);
        throw error; // Re-lança o erro para ser tratado pela função que a chamou
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
