// app/api/paystack/webhook/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase-admin"; // we need admin SDK here
import { PAYMENT_CONFIG } from "@/lib/paymentConfig";

export async function POST(req) {
  try {
    const body      = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const { reference, metadata, amount } = event.data;

      // Calculate escrow release time
      const releaseAt = new Date();
      releaseAt.setHours(releaseAt.getHours() + PAYMENT_CONFIG.escrowReleaseHours);

      // Save transaction to Firestore via Admin SDK
      await db.collection("transactions").add({
        studentId:      metadata.studentId,
        studentName:    metadata.studentName    || "",
        landlordId:     metadata.landlordId,
        listingId:      metadata.listingId,
        listingTitle:   metadata.listingTitle   || "",
        amount:         metadata.rentAmount,
        serviceFee:     metadata.serviceFee,
        totalCharged:   metadata.totalCharged,
        landlordPayout: metadata.landlordPayout,
        reference,
        idempotencyKey: metadata.idempotencyKey,
        status:         "success",
        escrowStatus:   "holding",
        escrowReleaseAt: releaseAt.toISOString(),
        type:           metadata.type || "rent",
        createdAt:      new Date(),
        updatedAt:      new Date(),
      });

      // Notify both parties
      const batch = db.batch();

      // Notify student
      batch.set(db.collection("notifications").doc(), {
        userId:   metadata.studentId,
        type:     "payment_success",
        title:    "Payment successful",
        message:  `Your rent payment of ₦${Number(metadata.rentAmount).toLocaleString()} for "${metadata.listingTitle}" was received. Funds will be released to the landlord in 48 hours.`,
        listingId: metadata.listingId,
        createdAt: new Date(),
      });

      // Notify landlord
      batch.set(db.collection("notifications").doc(), {
        userId:   metadata.landlordId,
        type:     "payment_received",
        title:    "Rent payment received",
        message:  `${metadata.studentName} has paid ₦${Number(metadata.rentAmount).toLocaleString()} for "${metadata.listingTitle}". Funds will be released to you in 48 hours if no dispute is raised.`,
        listingId: metadata.listingId,
        createdAt: new Date(),
      });

      await batch.commit();
    }

    if (event.event === "refund.processed") {
      const { reference } = event.data;
      // Update transaction status
      const snap = await db.collection("transactions")
        .where("reference", "==", reference)
        .get();
      if (!snap.empty) {
        await snap.docs[0].ref.update({
          status:      "refunded",
          escrowStatus: "refunded",
          updatedAt:   new Date(),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}