
import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(401).json({ error: 'ID token not provided.' });
    }

    const expiresIn = 60 * 60 * 24 * 7 * 1000;

    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    res.setHeader('Set-Cookie', `session=${sessionCookie}; Max-Age=${expiresIn / 1000}; HttpOnly; Path=/; SameSite=Lax; Secure`);

    return res.status(200).json({ status: 'success' });

  } catch (error) {
    console.error('Error creating session:', error);
    return res.status(500).json({ error: 'Failed to create session. Unexpected server error.' });
  }
}
