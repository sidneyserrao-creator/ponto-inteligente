
import admin from 'firebase-admin';

// Adicione uma verificação robusta para garantir que as variáveis de ambiente existam.
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  console.error(
    'As variáveis de ambiente do Firebase Admin não estão configuradas. O SDK Admin não será inicializado.'
  );
} else {
  // Verifica se o Firebase já foi inicializado para evitar erros.
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(
          /\\n/g,
          '\n'
        ),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
}

// Inicializa as exportações, mas elas podem não funcionar se a inicialização falhar.
let auth: admin.auth.Auth;
let db: admin.firestore.Firestore;
let storage: admin.storage.Storage;

if (admin.apps.length) {
  auth = admin.auth();
  db = admin.firestore();
  storage = admin.storage();
} else {
  // @ts-ignore - Fornece um fallback para evitar que a aplicação quebre totalmente
  auth = null;
  // @ts-ignore
  db = null;
  // @ts-ignore
  storage = null;
}

export { auth, db, storage };
