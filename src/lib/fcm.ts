'use server';
import { auth, db, messaging } from './firebase-admin';

/**
 * Associa um token de dispositivo a um usuário no Firestore.
 * @param userId - O ID do usuário.
 * @param deviceToken - O token do dispositivo FCM.
 */
export async function associateDeviceToken(userId: string, deviceToken: string) {
  if (!userId || !deviceToken) return;

  try {
    // Armazena ou atualiza o token do dispositivo para o usuário
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.update({ fcmToken: deviceToken });
    console.log(`Token ${deviceToken} associado ao usuário ${userId}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Erro ao associar token do dispositivo:', error.message);
    } else {
      console.error('Erro ao associar token do dispositivo:', error);
    }
  }
}

/**
 * Envia uma notificação para um usuário específico.
 * @param userId - O ID do usuário para quem enviar a notificação.
 * @param notification - O objeto de notificação (título e corpo).
 */
export async function sendNotification(userId: string, notification: { title: string; body: string; }) {
  try {
    // Buscar o documento do usuário para obter o token FCM
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || !userData.fcmToken) {
      console.log(`Usuário ${userId} não tem um token FCM registrado.`);
      return;
    }

    const message = {
      token: userData.fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      webpush: {
        fcmOptions: {
          link: '/dashboard' // Link para abrir ao clicar na notificação
        }
      }
    };

    // Enviar a mensagem
    const response = await messaging.send(message);
    console.log('Notificação enviada com sucesso:', response);

  } catch (error) {
    if (error instanceof Error) {
        console.error('Erro ao enviar notificação:', error.message);
    } else {
        console.error('Erro ao enviar notificação:', error);
    }
  }
}
