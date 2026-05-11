// app/transactions/[reference]/page.js

import { adminDb } from "@/lib/firebase-admin"; 
import ReceiptClient from "./ReceiptClient";
import { notFound } from "next/navigation";

export default async function TransactionReceiptPage({ params }) {
  const { reference } = await params;

  // Guard against invalid routes
  if (!reference || reference === "undefined") {
    return notFound();
  }

  const decodedReference = decodeURIComponent(reference);

  try {
    let txData = null;

    // =========================
    // 1️⃣ Try: doc ID = reference (NEW SYSTEM ✅)
    // =========================
    const byId = await adminDb
      .collection("transactions")
      .doc(decodedReference)
      .get();

    if (byId.exists) {
      txData = byId.data();
    }

    // =========================
    // 2️⃣ Try: reference field (OLD DATA SUPPORT)
    // =========================
    if (!txData) {
      const byField = await adminDb
        .collection("transactions")
        .where("reference", "==", decodedReference)
        .limit(1)
        .get();

      if (!byField.empty) {
        txData = byField.docs[0].data();
      }
    }

    // =========================
    // 3️⃣ Try: idempotencyKey fallback
    // =========================
    if (!txData) {
      const byKey = await adminDb
        .collection("transactions")
        .where("idempotencyKey", "==", decodedReference)
        .limit(1)
        .get();

      if (!byKey.empty) {
        txData = byKey.docs[0].data();
      }
    }

    // ❌ Not found → clean Next.js 404
    if (!txData) {
      return notFound();
    }

    // ✅ Success
    return (
      <ReceiptClient tx={sanitizeTx(decodedReference, txData)} />
    );

  } catch (e) {
    // 🚫 Don't log Next.js internal 404 as an error
    if (e?.digest?.includes("NEXT_HTTP_ERROR_FALLBACK")) {
      throw e;
    }

    // ✅ Only real errors reach here
    console.error("Real receipt fetch error:", e);
    throw e;
  }
}


// =========================
// 🧼 SANITIZE DATA (SAFE FOR UI)
// =========================
function sanitizeTx(reference, tx) {
  return {
    reference: tx.reference || tx.idempotencyKey || reference,

    studentName:  tx.studentName  || "—",
    landlordName: tx.landlordName || "—",

    listingTitle: tx.listingTitle || "—",
    listingId:    tx.listingId    || "",

    amount:        Number(tx.amount)        || 0,
    serviceFee:    Number(tx.serviceFee)    || 0,
    totalCharged:  Number(tx.totalCharged)  || 0,

    status:        tx.status        || "paid",
    escrowStatus:  tx.escrowStatus  || "holding",

    escrowReleaseAt: tx.escrowReleaseAt || null,
    releasedAt:      tx.releasedAt      || null,
    refundedAt:      tx.refundedAt      || null,

    createdAt:
      tx.createdAt?.toDate
        ? tx.createdAt.toDate().toISOString()
        : tx.createdAt instanceof Date
        ? tx.createdAt.toISOString()
        : tx.createdAt || null,

    type: tx.type || "rent",
  };
}