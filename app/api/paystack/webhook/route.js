// app/api/paystack/webhook/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const SERVICE_FEE_PERCENT = Number(process.env.PAYMENT_SERVICE_FEE_PERCENT || 5);

export async function POST(req) {
  const body      = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  // ── 1. Verify webhook signature ──
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    await logWebhookEvent({ event: "invalid_signature", body, error: "Signature mismatch" });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch (e) {
    await logWebhookEvent({ event: "parse_error", body, error: e.message });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (event.event === "charge.success") {
      await handleChargeSuccess(event.data);
    }
    if (event.event === "refund.processed") {
      await handleRefundProcessed(event.data);
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Webhook handler error:", e);
    await logWebhookEvent({ event: event.event, error: e.message, data: event.data });
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}

async function handleChargeSuccess(data) {
  const { reference, amount, metadata } = data;

  // ── 2. Idempotency — use reference as document ID ──
  const txRef    = adminDb.collection("transactions").doc(reference);
  const existing = await txRef.get();
  if (existing.exists) {
    console.log("Duplicate webhook ignored:", reference);
    return;
  }

  // ── 3. Server-side validation ──
  const { studentId, landlordId, listingId, listingTitle, studentName } = metadata;

  if (!studentId || !landlordId || !listingId) {
    throw new Error("Missing required metadata fields");
  }

  if (studentId === landlordId) {
    throw new Error("Student and landlord cannot be the same user");
  }

  // Verify listing exists and price matches
  const listingSnap = await adminDb.collection("listings").doc(listingId).get();
  if (!listingSnap.exists) {
    throw new Error("Listing not found: " + listingId);
  }

  const listing      = listingSnap.data();
  const listingPrice = Number(listing.price);
  const paidAmount   = amount / 100; // convert from kobo

  // Always recalculate server-side — never trust frontend amounts
  const expectedFee   = Math.round(listingPrice * (SERVICE_FEE_PERCENT / 100));
  const expectedTotal = listingPrice + expectedFee;

  if (paidAmount !== expectedTotal) {
    throw new Error(`Amount mismatch. Expected: ${expectedTotal}, Got: ${paidAmount}`);
  }

  // Verify landlord exists
  const landlordSnap = await adminDb.collection("users").doc(landlordId).get();
  if (!landlordSnap.exists) {
    throw new Error("Landlord not found: " + landlordId);
  }

  const landlordName = landlordSnap.data().name || landlordSnap.data().displayName || "";

  // ── 4. Create transaction record ──
  await txRef.set({
    // Parties
    studentId,
    studentName:    studentName || "",
    landlordId,
    landlordName,

    // Property
    listingId,
    listingTitle: listingTitle || listing.title || "",

    // Amounts — all server-calculated
    amount:         listingPrice,
    serviceFee:     expectedFee,
    totalCharged:   expectedTotal,
    landlordPayout: listingPrice,

    // Paystack
    reference,
    paystackSubaccount: listing.paystackSubaccount || "",

    // Status — payment is complete, Paystack splits automatically
    status:      "completed",
    completedAt: new Date(),

    type:      metadata.type || "rent",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // ── 5. Notify both parties ──
  const batch = adminDb.batch();

  batch.set(adminDb.collection("notifications").doc(), {
    userId:    studentId,
    type:      "payment_success",
    title:     "Payment successful",
    message:   `Your rent payment of ₦${listingPrice.toLocaleString()} for "${listing.title}" was received and sent to the landlord.`,
    listingId,
    reference,
    createdAt: new Date(),
  });

  batch.set(adminDb.collection("notifications").doc(), {
    userId:    landlordId,
    type:      "payment_received",
    title:     "Rent payment received",
    message:   `${studentName || "A student"} paid ₦${listingPrice.toLocaleString()} for "${listing.title}". Payment has been sent to your account.`,
    listingId,
    reference,
    createdAt: new Date(),
  });

  await batch.commit();

  console.log("Transaction completed:", reference);
}

async function handleRefundProcessed(data) {
  const { reference } = data;
  const txRef = adminDb.collection("transactions").doc(reference);
  const snap  = await txRef.get();

  if (!snap.exists) return;

  await txRef.update({
    status:     "refunded",
    refundedAt: new Date(),
    updatedAt:  new Date(),
  });
}

async function logWebhookEvent({ event, error, data, body }) {
  try {
    await adminDb.collection("webhook_logs").add({
      event:     event || "unknown",
      error:     error || null,
      data:      data  || null,
      rawBody:   body  || null,
      createdAt: new Date(),
    });
  } catch (e) {
    console.error("Failed to log webhook event:", e);
  }
}