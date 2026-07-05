// lib/firestoreListings.server.js
import { adminDb } from "@/lib/firebase-admin"; // adjust path to match your actual admin file

export async function fetchListingByIdServer(id) {
  const docRef = adminDb.collection("listings").doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    // Firestore Admin Timestamps aren't plain serializable objects —
    // convert before passing to a client component or Next.js will throw
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
    updatedAt: data.updatedAt || null,
    renewedAt: data.renewedAt?.toDate?.().toISOString() || null,
  };
}