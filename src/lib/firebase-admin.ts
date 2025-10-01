import admin from 'firebase-admin';

// Verifica se o Firebase já foi inicializado para evitar erros.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage();

// Exporta os serviços para serem usados em outras partes da aplicação.
export { auth, db, storage };
