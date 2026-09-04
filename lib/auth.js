// lib/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function signUp(email, password, name, role) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await updateProfile(user, { displayName: name });
  await setDoc(doc(db, "users", user.uid), {
    uid:       user.uid,
    name,
    email,
    role,
    phone:     "",
    createdAt: new Date().toISOString(),
    verified:  false,
  });
  return user;
}

export async function logIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const snap = await getDoc(doc(db, "users", user.uid));
  const isNewUser = !snap.exists() || !snap.data()?.role;
  return { user, isNewUser };
}

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

export async function saveSocialUserProfile(user, role) {
  await setDoc(doc(db, "users", user.uid), {
    uid:       user.uid,
    name:      user.displayName || "",
    email:     user.email       || "",
    role,
    phone:     "",
    createdAt: new Date().toISOString(),
    verified:  false,
  });
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function logOut() {
  await signOut(auth);
}