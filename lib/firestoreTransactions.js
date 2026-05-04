// lib/firestoreTransactions.js
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    updateDoc,
    serverTimestamp,
  } from "firebase/firestore";
  import { db } from "@/lib/firebase";
  
  export async function createTransaction(data) {
    const ref = await addDoc(collection(db, "transactions"), {
      // Parties
      studentId:      data.studentId,
      studentName:    data.studentName    || "",
      landlordId:     data.landlordId,
      landlordName:   data.landlordName   || "",
  
      // Property
      listingId:      data.listingId,
      listingTitle:   data.listingTitle   || "",
  
      // Amounts
      amount:         Number(data.amount),
      serviceFee:     Number(data.serviceFee     || 0),
      totalCharged:   Number(data.totalCharged   || data.amount),
      landlordPayout: Number(data.landlordPayout || data.amount),
  
      // Paystack
      reference:      data.reference      || "",
      idempotencyKey: data.idempotencyKey || "",
      paystackSubaccount: data.paystackSubaccount || "",
  
      // Status
      status:         "pending", // pending | success | failed | refunded
      escrowStatus:   "holding", // holding | released | refunded | disputed
      escrowReleaseAt: data.escrowReleaseAt || null,
  
      // Metadata
      type:           data.type || "rent", // rent | reservation_fee
      createdAt:      serverTimestamp(),
      updatedAt:      serverTimestamp(),
    });
    return ref.id;
  }
  
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