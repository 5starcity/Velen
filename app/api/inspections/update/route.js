import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendSMS } from "@/lib/termii";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { inspectionId, status } = await req.json();

    if (!inspectionId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["confirmed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // ── 1. Fetch inspection ──
    const inspSnap = await adminDb.collection("inspections").doc(inspectionId).get();
    if (!inspSnap.exists) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
    }

    const insp = inspSnap.data();

    // ── 2. Update status ──
    await adminDb.collection("inspections").doc(inspectionId).update({
      status,
      updatedAt: new Date(),
    });

    // ── 3. In-app notification to tenant ──
    const isConfirmed = status === "confirmed";

    await adminDb.collection("notifications").add({
      userId:    insp.tenantId,
      type:      isConfirmed ? "inspection_confirmed" : "inspection_cancelled",
      title:     isConfirmed ? "Inspection confirmed!" : "Inspection cancelled",
      message:   isConfirmed
        ? `Your inspection for "${insp.listingTitle}" on ${insp.date} at ${insp.time} has been confirmed by the landlord.`
        : `Your inspection for "${insp.listingTitle}" on ${insp.date} at ${insp.time} was cancelled.`,
      listingId: insp.listingId,
      read:      false,
      createdAt: new Date(),
    });

    // ── 4. SMS to tenant ──
    if (insp.tenantPhone) {
      const smsMessage = isConfirmed
        ? `Rezidence: Your inspection for "${insp.listingTitle}" on ${insp.date} at ${insp.time} is confirmed! Please be on time.`
        : `Rezidence: Your inspection for "${insp.listingTitle}" on ${insp.date} at ${insp.time} was cancelled by the landlord.`;

      await sendSMS(insp.tenantPhone, smsMessage);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Inspection update error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}