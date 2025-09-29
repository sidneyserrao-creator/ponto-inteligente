import admin from 'firebase-admin';

let auth: admin.auth.Auth;
let db: admin.firestore.Firestore;
let storage: admin.storage.Storage;

// Verifica se o Firebase já foi inicializado para evitar erros.
if (!admin.apps.length) {
  try {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsJson) {
      throw new Error('A variável de ambiente GOOGLE_APPLICATION_CREDENTIALS não está definida.');
    }
    const serviceAccount = JSON.parse(credentialsJson);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

    console.log('Firebase Admin SDK inicializado com sucesso.');
    auth = admin.auth();
    db = admin.firestore();
    storage = admin.storage();

  } catch (error: any) {
    console.error('Falha na inicialização do Firebase Admin SDK:', error.message);
    // Em um ambiente de desenvolvimento sem credenciais, não queremos que o app quebre.
    // As exportações permanecerão indefinidas, e as chamadas subsequentes falharão com mensagens claras.
  }
} else {
  // Se já estiver inicializado, pegue as instâncias existentes.
  auth = admin.auth();
  db = admin.firestore();
  storage = admin.storage();
}

// Exporta os serviços que podem estar indefinidos se a inicialização falhar.
export { auth, db, storage };
