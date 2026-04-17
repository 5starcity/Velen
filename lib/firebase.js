// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCVamSHLObqLIr9C55zp9ZMo_fZ4JuTe08",
  authDomain: "housing-1e516.firebaseapp.com",
  projectId: "housing-1e516",
  storageBucket: "housing-1e516.firebasestorage.app",
  messagingSenderId: "669068676800",
  appId: "1:669068676800:web:2ab815e8419459733b6725"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);