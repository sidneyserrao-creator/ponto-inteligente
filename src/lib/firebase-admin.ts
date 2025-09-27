import admin from 'firebase-admin';

const firebaseConfig = {
  apiKey: "AIzaSyBkyL6tVZ9lfep3mAyfnGAjLx407bjg8Rw",
  authDomain: "studio-2096480918-e97c7.firebaseapp.com",
  projectId: "studio-2096480918-e97c7",
  storageBucket: "studio-2096480918-e97c7.firebasestorage.app",
  messagingSenderId: "319012964573",
  appId: "1:319012964573:web:aa3c611d6fe930ba82f334"
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: firebaseConfig.projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
