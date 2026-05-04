// lib/firestoreReservations.js
import {
    addDoc,
    collection,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    updateDoc,
    serverTimestamp,
  } from "firebase/firestore";
  import { db } from "@/lib/firebase";
  
  export async function createReservation(data) {
    const ref = await addDoc(collection(db, "reservations"), {
      listingId:     data.listingId,
      listingTitle:  data.listingTitle,
      listingPrice:  Number(data.listingPrice),
      landlordId:    data.landlordId,
      landlordName:  data.landlordName  || "",
      studentId:     data.studentId,
      studentName:   data.studentName   || "",
      studentPhone:  data.studentPhone  || "",
      moveInDate:    data.moveInDate    || "",
      note:          data.note          || "",
      status:        "pending",
      reservationFee: 0, // free for now, flip later
      createdAt:     serverTimestamp(),
    });
    return ref.id;
  }
  
  export async function fetchReservationsByStudent(studentId) {
    const q = query(
      collection(db, "reservations"),
      where("studentId", "==", studentId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  
  export async function fetchReservationsByLandlord(landlordId) {
    const q = query(
      collection(db, "reservations"),
      where("landlordId", "==", landlordId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  
  export async function updateReservationStatus(id, status) {
    await updateDoc(doc(db, "reservations", id), {
      status,
      updatedAt: serverTimestamp(),
    });
  }
  // Add this to firestoreReservations.js

// Check if a listing already has a confirmed reservation
export async function fetchActiveReservationForListing(listingId) {
    const q = query(
      collection(db, "reservations"),
      where("listingId", "==", listingId),
      where("status", "==", "confirmed")
    );
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
  
  // Check if student already has a pending/confirmed reservation for this listing
  export async function fetchStudentReservationForListing(listingId, studentId) {
    const q = query(
      collection(db, "reservations"),
      where("listingId", "==", listingId),
      where("studentId", "==", studentId),
      where("status", "in", ["pending", "confirmed"])
    );
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  }