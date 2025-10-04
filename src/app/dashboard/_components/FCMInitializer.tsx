'use client';

import { useEffect } from 'react';
import { getMessagingToken } from '@/lib/firebase-messaging';
import { associateDeviceToken } from '@/lib/fcm';
import type { User } from '@/lib/types';

export default function FCMInitializer({ user }: { user: User }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const setupFCM = async () => {
        try {
          // 1. Constrói a URL do Service Worker com a configuração do Firebase como parâmetros de busca
          const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          };

          // Remove quaisquer chaves que não tenham um valor
          const cleanedConfig: { [key: string]: string } = {};
          for (const key in firebaseConfig) {
            const value = (firebaseConfig as any)[key];
            if (value) {
              cleanedConfig[key] = value;
            }
          }

          const swUrl = `/firebase-messaging-sw.js?${new URLSearchParams(cleanedConfig).toString()}`;

          // 2. Registra o Service Worker do Firebase Messaging
          await navigator.serviceWorker.register(swUrl);

          // 3. Espera o Service Worker estar pronto e ativo
          await navigator.serviceWorker.ready;
          
          // 4. Agora sim, solicita o token de notificação
          const token = await getMessagingToken();

          // 5. Se o token for obtido, salva no Firestore
          if (token) {
            await associateDeviceToken(user.id, token);
          }
        } catch (error) {
          console.error('Erro ao configurar o FCM:', error);
        }
      };

      setupFCM();
    }
  }, [user.id]);

  return null; // Este componente não renderiza nada na UI
}
