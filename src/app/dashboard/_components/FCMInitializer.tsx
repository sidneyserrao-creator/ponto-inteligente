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
          // Constrói a URL do Service Worker com a configuração do Firebase
          const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          };

          const cleanedConfig: { [key: string]: string } = {};
          for (const key in firebaseConfig) {
            const value = (firebaseConfig as any)[key];
            if (value) {
              cleanedConfig[key] = value;
            }
          }
          
          const swUrl = `/firebase-messaging-sw.js?${new URLSearchParams(cleanedConfig).toString()}`;

          // 1. Registra o Service Worker e captura o objeto de registro
          const swRegistration = await navigator.serviceWorker.register(swUrl);

          // 2. Solicita o token de notificação, passando o registro explícito
          // Isso elimina a race condition e garante que o PushManager tenha um SW ativo.
          const token = await getMessagingToken(swRegistration);

          // 3. Se o token for obtido, associa ao usuário no backend
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
