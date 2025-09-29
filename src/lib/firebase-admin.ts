import admin from 'firebase-admin';

// Verifica se o Firebase já foi inicializado para evitar erros.
if (!admin.apps.length) {
  try {
    // Em ambientes Google Cloud, as credenciais são detectadas automaticamente.
    // Para desenvolvimento local, o GOOGLE_APPLICATION_CREDENTIALS deve ser configurado.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
     console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
  }
}

// Exporta os serviços do Firebase já inicializados.
const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage();

export { auth, db, storage };

    