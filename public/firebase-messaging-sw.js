
// Importa os scripts do Firebase
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

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
    console.log(
      '[firebase-messaging-sw.js] Mensagem em segundo plano recebida: ',
      payload
    );
    
    // Personaliza a notificação aqui
    const notificationTitle = payload.notification?.title || 'Novo Alerta';
    const notificationOptions = {
      body: payload.notification?.body || 'Você tem uma nova mensagem.',
      icon: '/icon1.png', // Certifique-se de que este ícone exista na pasta public
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.error('Configuração do Firebase não encontrada nos parâmetros da URL do Service Worker.');
}
