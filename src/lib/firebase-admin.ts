import admin from 'firebase-admin';

// Verifica se o app já foi inicializado para evitar erros
if (!admin.apps.length) {
  // Em um ambiente do Google Cloud (como o Firebase App Hosting),
  // o SDK descobre as credenciais da conta de serviço automaticamente.
  // Só precisamos fornecer credenciais manuais para o desenvolvimento local.
  if (process.env.NODE_ENV === 'production') {
    console.log("Inicializando o Firebase Admin SDK com credenciais padrão para produção...");
    // No ambiente de produção, o storageBucket também pode precisar ser configurado
    // se não for o padrão. Certifique-se de que NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    // está definido nas configurações do seu ambiente do App Hosting.
    admin.initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log("Firebase Admin SDK inicializado com sucesso no ambiente de produção.");
  } else {
    // Ambiente de desenvolvimento local: usar credenciais do .env.local
    console.log("Inicializando o Firebase Admin SDK para desenvolvimento local...");
    const REQUIRED_ADMIN_ENV_VARS = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    ];

    const missingVars = REQUIRED_ADMIN_ENV_VARS.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`CRÍTICO: As seguintes variáveis de ambiente do Firebase Admin não estão definidas: ${missingVars.join(', ')}. Verifique seu arquivo .env.local e reinicie o servidor.`);
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log("Firebase Admin SDK inicializado com sucesso para desenvolvimento local.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      console.error("Falha catastrófica ao inicializar o Firebase Admin SDK:", errorMessage);
      throw new Error(`Falha na inicialização do Firebase Admin: ${errorMessage}`);
    }
  }
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();
const messaging = admin.messaging();

export { db, auth, storage, admin, messaging };
