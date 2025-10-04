import admin from 'firebase-admin';

// Array com as variáveis de ambiente obrigatórias para o Admin SDK
const REQUIRED_ADMIN_ENV_VARS = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
];

// Função para verificar se as variáveis de ambiente essenciais estão definidas
const checkAdminEnvVars = () => {
  const missingVars = REQUIRED_ADMIN_ENV_VARS.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    // Este erro será muito claro no console do servidor, apontando a causa raiz.
    throw new Error(`CRÍTICO: As seguintes variáveis de ambiente do Firebase Admin não estão definidas: ${missingVars.join(', ')}. Verifique seu arquivo .env.local e reinicie o servidor.`);
  }
};

if (!admin.apps.length) {
  try {
    // Primeiro, verifica se as variáveis existem.
    checkAdminEnvVars();

    // Se todas existirem, tenta inicializar o app.
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // A chave privada é processada para garantir o formato correto de quebra de linha.
        privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log("Firebase Admin SDK inicializado com sucesso.");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    // Este console.error aparecerá nos logs do servidor.
    console.error("Falha catastrófica ao inicializar o Firebase Admin SDK:", errorMessage);
    // Lançar o erro impede que a aplicação continue em um estado quebrado.
    throw new Error(`Falha na inicialização do Firebase Admin: ${errorMessage}`);
  }
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();
const messaging = admin.messaging();

export { db, auth, storage, admin, messaging };