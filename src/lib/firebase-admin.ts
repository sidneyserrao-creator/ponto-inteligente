
import admin from 'firebase-admin';

// Verifica se o Firebase jÃ¡ foi inicializado para evitar erros.
if (!admin.apps.length) {
  // Inicializa o Firebase Admin SDK.
  // Em ambientes Google Cloud (como este), ele usa automaticamente
  // as credenciais do ambiente, o que Ã© mais seguro e simples.
  admin.initializeApp();
}

// Exporta os serviÃ§os do Firebase jÃ¡ inicializados.
const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage();

export { auth, db, storage };
