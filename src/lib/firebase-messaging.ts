
import { getMessaging, getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Solicita permissão para notificações e obtém o token FCM.
 * @returns O token FCM ou null se a permissão for negada.
 */
export const getMessagingToken = async (): Promise<string | null> => {
  try {
    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Permissão para notificações não concedida.');
      return null;
    }
  } catch (error) {
    console.error('Erro ao obter o token FCM:', error);
    return null;
  }
};

/**
 * Salva o token FCM de um usuário no Firestore.
 * @param userId - O ID do usuário.
 * @param token - O token FCM a ser salvo.
 */
export const saveTokenToFirestore = async (
  userId: string,
  token: string
): Promise<void> => {
  if (!userId || !token) return;

  try {
    const tokenRef = doc(db, 'fcmTokens', userId);
    await setDoc(tokenRef, { token, updatedAt: new Date().toISOString() });
    console.log(`Token FCM salvo para o usuário ${userId}`);
  } catch (error) {
    console.error('Erro ao salvar o token no Firestore:', error);
  }
};
