// app/transactions/[reference]/page.js
import { adminDb } from "@/lib/firebase-admin";
import ReceiptClient from "./ReceiptClient";
import { notFound } from "next/navigation";

export default async function TransactionReceiptPage({ params }) {
  const { reference } = await params;

  if (!reference || reference === "undefined") {
    return notFound();
  }

  const decodedReference = decodeURIComponent(reference);

  try {
    let txData = null;

    // 1. Try doc ID = reference (primary)
    const byId = await adminDb.collection("transactions").doc(decodedReference).get();
    if (byId.exists) {
      txData = byId.data();
    }

    // 2. Try reference field (fallback for old data)
    if (!txData) {
      const byField = await adminDb
        .collection("transactions")
        .where("reference", "==", decodedReference)
        .limit(1)
        .get();
      if (!byField.empty) txData = byField.docs[0].data();
    }

    // 3. Try idempotencyKey (last resort)
    if (!txData) {
      const byKey = await adminDb
        .collection("transactions")
        .where("idempotencyKey", "==", decodedReference)
        .limit(1)
        .get();
      if (!byKey.empty) txData = byKey.docs[0].data();
    }

    if (!txData) return notFound();

    return <ReceiptClient tx={sanitizeTx(decodedReference, txData)} />;

  } catch (e) {
    if (e?.digest?.includes("NEXT_HTTP_ERROR_FALLBACK")) throw e;
    console.error("Receipt fetch error:", e);
    throw e;
  }
}

function sanitizeTx(reference, tx) {
  function toISO(ts) {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate().toISOString();
    if (ts instanceof Date) return ts.toISOString();
    return ts;
  }

  return {
    reference:     tx.reference || tx.idempotencyKey || reference,
    studentName:   tx.studentName  || "—",
    landlordName:  tx.landlordName || "—",
    listingTitle:  tx.listingTitle || "—",
    listingId:     tx.listingId    || "",
    amount:        Number(tx.amount)       || 0,
    serviceFee:    Number(tx.serviceFee)   || 0,
    totalCharged:  Number(tx.totalCharged) || 0,
    landlordPayout: Number(tx.landlordPayout || tx.amount) || 0,
    status:        tx.status || "completed",
    createdAt:     toISO(tx.createdAt),
    completedAt:   toISO(tx.completedAt),
    refundedAt:    toISO(tx.refundedAt),
    type:          tx.type || "rent",
  };
}