// lib/firestoreNotifications.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const notificationsCollection = collection(db, "notifications");

// ── Create a notification ─────────────────────────────────
export async function createNotification({
  userId,
  type,
  title,
  message,
  postId,
  listingId,
  senderId,
  senderName,
}) {
  await addDoc(notificationsCollection, {
    userId,
    type,
    title,
    message,
    postId:     postId    || null,
    listingId:  listingId || null,
    senderId:   senderId  || null,
    senderName: senderName || null,
    read:       false,
    createdAt:  serverTimestamp(),
  });
}

// ── Real-time listener for a user's notifications ─────────
export function subscribeToNotifications(userId, callback) {
  const q = query(
    notificationsCollection,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
}

// ── Mark a single notification as read ───────────────────
export async function markNotificationRead(id) {
  await updateDoc(doc(db, "notifications", id), { read: true });
}

// ── Mark ALL notifications as read ───────────────────────
export async function markAllNotificationsRead(userId) {
  const q = query(
    notificationsCollection,
    where("userId", "==", userId),
    where("read", "==", false)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

// ── Delete a single notification ─────────────────────────
export async function deleteNotification(id) {
  await deleteDoc(doc(db, "notifications", id));
}

// ── Delete ALL notifications for a user ──────────────────
export async function deleteAllNotifications(userId) {
  const q = query(
    notificationsCollection,
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}