
// Importa os scripts do Firebase
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Obtém a configuração do Firebase a partir dos parâmetros da URL
const urlParams = new URL(location).searchParams;
const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId'),
};

// Inicializa o Firebase apenas se a configuração estiver presente
if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);

  // Obtém uma instância do Firebase Messaging para lidar com mensagens em segundo plano
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    // O console.log foi removido para evitar a mensagem [object Object] no log do servidor.
    
    // Personaliza a notificação aqui
    const notificationTitle = payload.notification?.title || 'Novo Alerta';
    const notificationOptions = {
      body: payload.notification?.body || 'Você tem uma nova mensagem.',
      icon: '/web-app-manifest-192x192.png', // Caminho do ícone corrigido
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.error('Configuração do Firebase não encontrada nos parâmetros da URL do Service Worker.');
}
