import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendSMS } from "@/lib/termii";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const {
      listingId,
      listingTitle,
      landlordId,
      tenantId,
      tenantName,
      tenantPhone,
      date,
      time,
      note,
    } = await req.json();

    if (!listingId || !landlordId || !tenantId || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── 1. Create inspection doc ──
    const inspRef = await adminDb.collection("inspections").add({
      listingId,
      listingTitle:  listingTitle || "",
      landlordId,
      tenantId,
      tenantName:    tenantName || "",
      tenantPhone:   tenantPhone || "",
      date,
      time,
      note:          note || "",
      status:        "pending",
      createdAt:     new Date(),
      updatedAt:     new Date(),
    });

    // ── 2. In-app notification to landlord ──
    await adminDb.collection("notifications").add({
      userId:     landlordId,
      type:       "inspection_booked",
      title:      "Inspection booked",
      message:    `${tenantName || "Someone"} has booked an inspection for "${listingTitle}" on ${date} at ${time}`,
      listingId,
      senderId:   tenantId,
      senderName: tenantName || "",
      read:       false,
      createdAt:  new Date(),
    });

    // ── 3. SMS to landlord ──
    const landlordSnap = await adminDb.collection("users").doc(landlordId).get();
    const landlordPhone = landlordSnap.exists ? landlordSnap.data().phone : null;

    if (landlordPhone) {
      await sendSMS(
        landlordPhone,
        `Rezidence: ${tenantName || "A tenant"} booked an inspection for "${listingTitle}" on ${date} at ${time}. Open the app to confirm.`
      );
    }

    // ── 4. SMS confirmation to tenant ──
    if (tenantPhone) {
      await sendSMS(
        tenantPhone,
        `Rezidence: Your inspection for "${listingTitle}" on ${date} at ${time} has been submitted. You'll be notified once the landlord confirms.`
      );
    }

    return NextResponse.json({ id: inspRef.id });
  } catch (e) {
    console.error("Inspection booking error:", e);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}