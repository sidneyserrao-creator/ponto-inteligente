// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBkyL6tVZ9lfep3mAyfnGAjLx407bjg8Rw",
  authDomain: "studio-2096480918-e97c7.firebaseapp.com",
  projectId: "studio-2096480918-e97c7",
  storageBucket: "studio-2096480918-e97c7.firebasestorage.app",
  messagingSenderId: "319012964573",
  appId: "1:319012964573:web:aa3c611d6fe930ba82f334"
};

// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
