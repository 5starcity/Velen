// app/api/paystack/webhook/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { sendSMS } from "@/lib/termii";

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

  const listingRef  = adminDb.collection("listings").doc(listingId);
  const listingSnap = await listingRef.get();
  if (!listingSnap.exists) {
    throw new Error("Listing not found: " + listingId);
  }

  const listing      = listingSnap.data();
  const listingPrice = Number(listing.price);
  const paidAmount   = amount / 100;

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

  const landlordData = landlordSnap.data();
  const landlordName = landlordData.name || landlordData.displayName || "";

  // Fetch student for phone number
  const studentSnap = await adminDb.collection("users").doc(studentId).get();
  const studentData = studentSnap.exists ? studentSnap.data() : {};

  // ── 4. Mark listing as taken + create transaction record, atomically ──
  // Re-reads the listing inside the transaction so that if two payments
  // land close together, only the first one wins and the second is flagged
  // for refund instead of double-booking the same house.
  let alreadyTaken = false;

  await adminDb.runTransaction(async (t) => {
    const freshListingSnap = await t.get(listingRef);
    const freshListing = freshListingSnap.data();

    if (freshListing.status === "taken") {
      alreadyTaken = true;
      t.set(txRef, {
        studentId,
        studentName: studentName || "",
        landlordId,
        listingId,
        listingTitle: listingTitle || listing.title || "",
        amount: listingPrice,
        serviceFee: expectedFee,
        totalCharged: expectedTotal,
        reference,
        status: "conflict_needs_refund",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return;
    }

    t.update(listingRef, {
      status:           "taken",
      takenBy:          studentId,
      takenByName:      studentName || "",
      takenAt:          new Date(),
      paymentReference: reference,
    });

    t.set(txRef, {
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

      // Status
      status:      "completed",
      completedAt: new Date(),

      type:      metadata.type || "rent",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  // ── 5. Handle conflict case — listing was already taken by someone else ──
  if (alreadyTaken) {
    console.warn("Listing already taken, flagged for refund:", reference, listingId);

    await adminDb.collection("notifications").add({
      userId:    studentId,
      type:      "payment_conflict",
      title:     "Listing no longer available",
      message:   `"${listing.title}" was just taken by another student. Your payment will be refunded shortly.`,
      listingId,
      reference,
      read:      false,
      createdAt: new Date(),
    });

    if (studentData.phone) {
      await sendSMS(
        studentData.phone,
        `Rezidence: "${listing.title}" was just taken by another student. Your payment of N${listingPrice.toLocaleString()} will be refunded. Ref: ${reference}`
      );
    }

    return; // stop here — don't send success notifications below
  }

  // ── 6. In-app notifications (success path) ──
  const batch = adminDb.batch();

  batch.set(adminDb.collection("notifications").doc(), {
    userId:    studentId,
    type:      "payment_success",
    title:     "Payment successful",
    message:   `Your rent payment of ₦${listingPrice.toLocaleString()} for "${listing.title}" was received and sent to the landlord.`,
    listingId,
    reference,
    read:      false,
    createdAt: new Date(),
  });

  batch.set(adminDb.collection("notifications").doc(), {
    userId:    landlordId,
    type:      "payment_received",
    title:     "Rent payment received",
    message:   `${studentName || "A student"} paid ₦${listingPrice.toLocaleString()} for "${listing.title}". Payment has been sent to your account.`,
    listingId,
    reference,
    read:      false,
    createdAt: new Date(),
  });

  await batch.commit();

  // ── 7. SMS notifications (success path) ──
  await Promise.allSettled([
    studentData.phone && sendSMS(
      studentData.phone,
      `Rezidence: Your rent payment of N${listingPrice.toLocaleString()} for "${listing.title}" was successful. Ref: ${reference}`
    ),
    landlordData.phone && sendSMS(
      landlordData.phone,
      `Rezidence: ${studentName || "A student"} paid N${listingPrice.toLocaleString()} for "${listing.title}". Payment sent to your account. Ref: ${reference}`
    ),
  ]);

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

  const tx = snap.data();

  // If the refund was for a listing we'd marked "taken" (e.g. a conflict
  // case that got manually refunded), release the listing back to available.
  if (tx.listingId) {
    const listingRef  = adminDb.collection("listings").doc(tx.listingId);
    const listingSnap = await listingRef.get();

    if (listingSnap.exists) {
      const listing = listingSnap.data();
      if (listing.paymentReference === reference && listing.status === "taken") {
        await listingRef.update({
          status:           "available",
          takenBy:          null,
          takenByName:      null,
          takenAt:          null,
          paymentReference: null,
        });
      }
    }
  }

  const batch = adminDb.batch();

  batch.set(adminDb.collection("notifications").doc(), {
    userId:    tx.studentId,
    type:      "refund_processed",
    title:     "Refund processed",
    message:   `Your refund of ₦${tx.amount.toLocaleString()} for "${tx.listingTitle}" has been processed.`,
    listingId: tx.listingId,
    reference,
    read:      false,
    createdAt: new Date(),
  });

  await batch.commit();

  // SMS for refund
  const studentSnap  = await adminDb.collection("users").doc(tx.studentId).get();
  const studentPhone = studentSnap.exists ? studentSnap.data().phone : null;

  if (studentPhone) {
    await sendSMS(
      studentPhone,
      `Rezidence: Your refund of N${tx.amount.toLocaleString()} for "${tx.listingTitle}" has been processed. Ref: ${reference}`
    );
  }
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