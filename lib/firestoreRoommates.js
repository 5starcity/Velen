// lib/firestoreRoommates.js
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    updateDoc,
    increment,
  } from "firebase/firestore";
  import { db } from "@/lib/firebase";
  
  const roommatePostsCollection = collection(db, "roommatePosts");
  
  // ── Create a roommate post ──────────────────────────────
  export async function createRoommatePost(data) {
    const docRef = await addDoc(roommatePostsCollection, {
      listingId:       data.listingId,
      listingTitle:    data.listingTitle,
      listingLocation: data.listingLocation,
      listingPrice:    Number(data.listingPrice),
      listingType:     data.listingType || "",
      splitCost:       Math.ceil(Number(data.listingPrice) / 2),
      postedBy:        data.postedBy,
      posterName:      data.posterName,
      posterContact:   data.posterContact || "",
      message:         data.message || "",
      preferences: {
        gender:      data.preferences?.gender      || "No preference",
        occupation:  data.preferences?.occupation  || "Any",
        lifestyle:   data.preferences?.lifestyle   || "No preference",
        moveInDate:  data.preferences?.moveInDate  || "",
      },
      status:    "open",
      interests: 0,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
  
  // ── Fetch all open roommate posts ───────────────────────
  export async function fetchRoommatePosts() {
    const q = query(
      roommatePostsCollection,
      where("status", "==", "open"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  
  // ── Fetch roommate posts for a specific listing ─────────
  export async function fetchRoommatePostsByListing(listingId) {
    const q = query(
      roommatePostsCollection,
      where("listingId", "==", listingId),
      where("status", "==", "open")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  
  // ── Fetch roommate posts by a specific user ─────────────
  export async function fetchRoommatePostsByUser(userId) {
    const q = query(
      roommatePostsCollection,
      where("postedBy", "==", userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  
  // ── Fetch a single post ─────────────────────────────────
  export async function fetchRoommatePostById(id) {
    const ref = doc(db, "roommatePosts", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }
  
  // ── Mark a post as filled ───────────────────────────────
  export async function markRoommatePostFilled(id) {
    const ref = doc(db, "roommatePosts", id);
    await updateDoc(ref, { status: "filled", updatedAt: new Date().toISOString() });
  }
  
  // ── Delete a post ───────────────────────────────────────
  export async function deleteRoommatePost(id) {
    const ref = doc(db, "roommatePosts", id);
    await deleteDoc(ref);
  }
  
  // ── Express interest in a roommate post ─────────────────
  // Stores in roommateInterests sub-style collection + increments count
  export async function expressRoommateInterest(postId, userId, userName) {
    await addDoc(collection(db, "roommateInterests"), {
      postId,
      userId,
      userName,
      createdAt: serverTimestamp(),
    });
    const ref = doc(db, "roommatePosts", postId);
    await updateDoc(ref, { interests: increment(1) });
  }