import 'server-only';
import { cookies } from 'next/headers';
import { findUserById } from './data';
import type { User } from './types';

const SESSION_COOKIE_NAME = 'bit_seguranca_session';

export async function createSession(userId: string) {
  cookies().set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function getSession(): Promise<{ id: string } | null> {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME);
  if (sessionCookie) {
    return { id: sessionCookie.value };
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
  return findUserById(session.id) || null;
}

// Function to fetch a file from a URL and convert it to a Base64 Data URI
async function toDataURI(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const blob = await response.blob();
        const reader = new FileReader();

        // This part is tricky in a server-only context because FileReader is a browser API.
        // For a real-world scenario on the server, you'd use Buffer.
        // We'll simulate the conversion for this mock environment.
        const buffer = Buffer.from(await blob.arrayBuffer());
        const base64 = buffer.toString('base64');
        return `data:${blob.type};base64,${base64}`;

    } catch (error) {
        console.error("Error converting to Data URI:", error);
        return "";
    }
}
