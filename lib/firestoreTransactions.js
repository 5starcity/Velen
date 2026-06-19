// lib/firestoreTransactions.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getTransactionByReference(reference) {
  const q = query(
    collection(db, "transactions"),
    where("reference", "==", reference)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function updateTransaction(id, data) {
  await updateDoc(doc(db, "transactions", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function fetchTransactionsByStudent(studentId) {
  const q = query(
    collection(db, "transactions"),
    where("studentId", "==", studentId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchTransactionsByLandlord(landlordId) {
  const q = query(
    collection(db, "transactions"),
    where("landlordId", "==", landlordId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchTransactionById(id) {
  const snap = await getDoc(doc(db, "transactions", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Realtime listeners — returns unsubscribe function for useEffect cleanup

export function subscribeTransactionsByStudent(studentId, callback) {
  const q = query(
    collection(db, "transactions"),
    where("studentId", "==", studentId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function subscribeTransactionsByLandlord(landlordId, callback) {
  const q = query(
    collection(db, "transactions"),
    where("landlordId", "==", landlordId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}