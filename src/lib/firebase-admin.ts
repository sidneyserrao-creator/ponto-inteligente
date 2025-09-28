
import admin from 'firebase-admin';

// Verifica se o Firebase jÃ¡ foi inicializado para evitar erros.
if (!admin.apps.length) {
  // Em ambientes Google Cloud, as credenciais são detectadas automaticamente.
  // Para desenvolvimento local e outros ambientes, precisamos ser explícitos,
  // especialmente para o Storage Bucket.
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

// Exporta os serviÃ§os do Firebase jÃ¡ inicializados.
const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage();

export { auth, db, storage };
