// Caminho do arquivo: src/lib/firebase-admin.ts

import admin from 'firebase-admin';

// Verifica se o app já foi inicializado para evitar erros no hot-reload
if (!admin.apps.length) {
  // Validação para garantir que as variáveis de ambiente existem
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    throw new Error('As variáveis de ambiente do Firebase Admin não estão definidas corretamente.');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // A linha mais importante, que corrige o formato da chave
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log("Firebase Admin SDK inicializado com sucesso (método de variáveis separadas).");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    console.error("Falha ao inicializar o Firebase Admin SDK:", errorMessage);
    throw new Error(`Falha na inicialização do Firebase Admin: ${errorMessage}`);
  }
}

// Exporta as instâncias dos serviços de admin já inicializados.
const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage();
const messaging = admin.messaging(); // Adiciona a exportação do messaging

export { auth, db, storage, messaging };
