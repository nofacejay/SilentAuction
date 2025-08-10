// Firebase client setup (React + Vite)

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration (copy from Firebase Console → Project settings → Web app config)
const firebaseConfig = {
  apiKey: "AIzaSyCVdf5k3tbCrlh6C0WBRwklTpsC70cWVpo",
  authDomain: "silentauction-d318b.firebaseapp.com",
  projectId: "silentauction-d318b",
  storageBucket: "silentauction-d318b.appspot.com",
  messagingSenderId: "913747180762",
  appId: "1:913747180762:web:48f7389eb8c0c26d7bb9e3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
