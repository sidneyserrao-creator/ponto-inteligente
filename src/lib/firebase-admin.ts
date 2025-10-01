
import admin from 'firebase-admin';

let serviceAccount;
try {
    if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
        serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
    }
} catch (error) {
    console.error("Error parsing FIREBASE_ADMIN_CREDENTIALS:", error);
}


if (!serviceAccount) {
  console.error(
    'As credenciais de serviço do Firebase Admin não estão configuradas corretamente na variável de ambiente FIREBASE_ADMIN_CREDENTIALS. O SDK Admin não será inicializado.'
  );
} else {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
        console.error("Failed to initialize Firebase Admin SDK:", error);
    }
  }
}

// Initialize exports, but they might not work if initialization fails.
let auth: admin.auth.Auth;
let db: admin.firestore.Firestore;
let storage: admin.storage.Storage;

if (admin.apps.length) {
  auth = admin.auth();
  db = admin.firestore();
  storage = admin.storage();
} else {
  // @ts-ignore - Provide a fallback to prevent the app from crashing completely
  auth = null;
  // @ts-ignore
  db = null;
  // @ts-ignore
  storage = null;
}

export { auth, db, storage };
