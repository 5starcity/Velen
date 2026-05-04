// lib/firestoreDisputes.js
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
  
  export async function createDispute(data) {
    const ref = await addDoc(collection(db, "disputes"), {
      transactionId:  data.transactionId,
      listingId:      data.listingId,
      listingTitle:   data.listingTitle   || "",
      raisedBy:       data.raisedBy,       // uid
      raisedByName:   data.raisedByName   || "",
      raisedByRole:   data.raisedByRole,   // "student" | "landlord"
      againstId:      data.againstId,      // other party uid
      reason:         data.reason         || "",
      description:    data.description    || "",
      evidence:       data.evidence       || [], // urls
      status:         "open",              // open | reviewing | resolved_student | resolved_landlord | closed
      resolution:     "",
      createdAt:      serverTimestamp(),
      updatedAt:      serverTimestamp(),
    });
  
    // Freeze the escrow
    await updateDoc(doc(db, "transactions", data.transactionId), {
      escrowStatus: "disputed",
      updatedAt:    serverTimestamp(),
    });
  
    return ref.id;
  }
  
  export async function fetchDisputesByUser(userId) {
    const q = query(
      collection(db, "disputes"),
      where("raisedBy", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  
  export async function updateDisputeStatus(id, status, resolution = "") {
    await updateDoc(doc(db, "disputes", id), {
      status,
      resolution,
      updatedAt: serverTimestamp(),
    });
  }