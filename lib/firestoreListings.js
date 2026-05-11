// lib/firestoreListings.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const listingsCollection = collection(db, "listings");

// ── Fetch all listings (browse page) ──
export async function fetchListings() {
  const querySnapshot = await getDocs(listingsCollection);
  return querySnapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

// ── Fetch listings belonging to a specific landlord (dashboard) ──
export async function fetchListingsByLandlord(landlordId) {
  const q = query(listingsCollection, where("landlordId", "==", landlordId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

// ── Fetch a single listing by ID ──
export async function fetchListingById(id) {
  const docRef = doc(db, "listings", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return {
    id: docSnap.id,
    ...docSnap.data(),
  };
}

// ── Create a new listing ──
export async function createListing(listingData) {
  const docRef = await addDoc(listingsCollection, {
    ...listingData,
    price:     Number(listingData.price),
    beds:      Number(listingData.beds  || 1),
    baths:     Number(listingData.baths || 1),
    verified:  Boolean(listingData.verified ?? false),
    featured:  Boolean(listingData.featured ?? false),
    views:     0,
    interests: 0,
    renewedAt: null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ── Update a listing's full details ──
export async function updateListing(id, data) {
  const docRef = doc(db, "listings", id);
  await updateDoc(docRef, {
    ...data,
    price:     Number(data.price),
    beds:      Number(data.beds  || 1),
    baths:     Number(data.baths || 1),
    updatedAt: new Date().toISOString(),
  });
}

// ── Update only availability status (dashboard inline select) ──
export async function updateListingAvailability(id, availability) {
  const docRef = doc(db, "listings", id);
  await updateDoc(docRef, {
    availability,
    updatedAt: new Date().toISOString(),
  });
}

// ── Renew a listing — resets the 90-day expiry clock ──
export async function renewListing(id) {
  const renewedAt = serverTimestamp();
  const docRef = doc(db, "listings", id);
  await updateDoc(docRef, {
    renewedAt,
    updatedAt: new Date().toISOString(),
  });
  return new Date();
}

// ── Delete a listing ──
export async function deleteListing(id) {
  const docRef = doc(db, "listings", id);
  await deleteDoc(docRef);
}

// ── Increment view count when a listing is opened ──
export async function incrementViewCount(id) {
  const docRef = doc(db, "listings", id);
  await updateDoc(docRef, {
    views: increment(1),
  });
}

// ── Submit a report against a listing (upgraded) ──
export async function reportListing(listingId, reporterId, category, detail) {
  // Duplicate check — one report per user per listing
  if (reporterId && reporterId !== "anonymous") {
    const q = query(
      collection(db, "reports"),
      where("listingId", "==", listingId),
      where("reporterId", "==", reporterId)
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
      throw new Error("already_reported");
    }
  }

  await addDoc(collection(db, "reports"), {
    listingId,
    reporterId: reporterId || "anonymous",
    category,
    detail:     detail    || "",
    createdAt:  serverTimestamp(),
    reviewed:   false,
    status:     "pending",
  });
}

// ── Express interest in a listing ──
export async function expressInterest(listingId, userId, userName) {
  await addDoc(collection(db, "interests"), {
    listingId,
    userId,
    userName,
    createdAt: serverTimestamp(),
  });
  const docRef = doc(db, "listings", listingId);
  await updateDoc(docRef, {
    interests: increment(1),
  });
}

// ── Submit a customer support ticket ──
export async function submitSupportTicket({ userId, name, email, category, message }) {
  await addDoc(collection(db, "support_tickets"), {
    userId:    userId || "anonymous",
    name,
    email,
    category,
    message,
    status:    "open",
    createdAt: serverTimestamp(),
  });
}