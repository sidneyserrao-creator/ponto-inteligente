
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBkyL6tVZ9lfep3mAyfnGAjLx407bjg8Rw",
  authDomain: "studio-2096480918-e97c7.firebaseapp.com",
  projectId: "studio-2096480918-e97c7",
  storageBucket: "studio-2096480918-e97c7.firebasestorage.app",
  messagingSenderId: "319012964573",
  appId: "1:319012964573:web:aa3c611d6fe930ba82f334"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// export const messaging = getMessaging(app); // Uncomment when FCM is fully set up


