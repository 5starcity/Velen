// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
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

// ─────────────────────────────────────────────────────────────
// Every write test so far has shown the same pattern: the
// Firestore SDK's real-time streaming channel ("Write/channel")
// consistently fails to open (Fetch failed loading), regardless
// of network, VPN, or Incognito — but the exact same write via
// Firebase Console (which doesn't use this channel) succeeds
// instantly. When this streaming channel can't establish, the
// SDK can surface a generic "permission-denied" instead of a
// clear network error, which is why the rules, payload, role,
// and auth token all check out correct while the write still
// fails.
//
// `experimentalAutoDetectLongPolling` makes the SDK detect when
// the streaming/WebChannel transport isn't working and fall back
// automatically to long-polling instead, which is far more
// tolerant of restrictive networks, VPNs, and proxies that don't
// handle long-lived streaming connections well. This is the
// standard fix for this exact symptom.
// ─────────────────────────────────────────────────────────────
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
});

export const storage = getStorage(app);
export const auth = getAuth(app);