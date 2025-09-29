import admin from 'firebase-admin';

// Verifica se o Firebase já foi inicializado para evitar erros.
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
     console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    if (process.env.NODE_ENV !== 'production' && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.error('GOOGLE_APPLICATION_CREDENTIALS env var not set.');
    }
  }
}

// Exporta os serviços do Firebase já inicializados.
const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage();

export { auth, db, storage };
