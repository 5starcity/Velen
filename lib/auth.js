// lib/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// ── Email Signup ──────────────────────────────────────────
export async function signUp(email, password, name, role) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await updateProfile(user, { displayName: name });
  await setDoc(doc(db, "users", user.uid), {
    uid:       user.uid,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
    verified:  false,
  });
  return user;
}

// ── Email Login ───────────────────────────────────────────
export async function logIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// ── Google Sign-In (popup) ────────────────────────────────
// Returns { user, isNewUser }
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const snap = await getDoc(doc(db, "users", user.uid));
  const isNewUser = !snap.exists() || !snap.data()?.role;
  return { user, isNewUser };
}

// ── Apple Sign-In (popup) ─────────────────────────────────
// Returns { user, isNewUser }
export async function signInWithApple() {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const snap = await getDoc(doc(db, "users", user.uid));
  const isNewUser = !snap.exists() || !snap.data()?.role;
  return { user, isNewUser };
}

// ── Save Social User Profile ──────────────────────────────
export async function saveSocialUserProfile(user, role) {
  await setDoc(doc(db, "users", user.uid), {
    uid:       user.uid,
    name:      user.displayName || "",
    email:     user.email       || "",
    role,
    createdAt: new Date().toISOString(),
    verified:  false,
  });
}

// ── Logout ────────────────────────────────────────────────
export async function logOut() {
  await signOut(auth);
}