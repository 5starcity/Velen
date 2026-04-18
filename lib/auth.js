// lib/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult,
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

// ── Google Sign-In (redirect) ─────────────────────────────
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithRedirect(auth, provider);
}

// ── Apple Sign-In (redirect) ──────────────────────────────
export async function signInWithApple() {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  await signInWithRedirect(auth, provider);
}

// ── Handle redirect result on page load ───────────────────
// Returns { user, isNewUser } | { error } | null
// isNewUser = true if no Firestore doc OR doc has no role field
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;

    const user = result.user;
    const snap = await getDoc(doc(db, "users", user.uid));

    // Treat as new user if: no doc at all, OR doc exists but has no role
    const isNewUser = !snap.exists() || !snap.data()?.role;

    return { user, isNewUser };
  } catch (e) {
    console.error("Redirect result error:", e);
    return { error: e.message };
  }
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