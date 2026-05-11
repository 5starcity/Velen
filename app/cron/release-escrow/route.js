// app/api/cron/release-escrow/route.js
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req) {
  // Verify this is called by Vercel cron, not random requests
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now  = new Date();
  let released = 0;
  let skipped  = 0;

  try {
    const snap = await adminDb
      .collection("transactions")
      .where("escrowStatus", "==", "holding")
      .where("status", "==", "paid")
      .get();

    const batch = adminDb.batch();

    for (const doc of snap.docs) {
      const tx = doc.data();

      // Skip disputed transactions — NEVER auto-release
      if (tx.escrowStatus === "disputed" || tx.status === "on_hold") {
        skipped++;
        continue;
      }

      const releaseAt = new Date(tx.escrowReleaseAt);
      if (releaseAt <= now) {
        batch.update(doc.ref, {
          escrowStatus: "released",
          status:       "completed",
          releasedAt:   now,
          updatedAt:    now,
        });

        // Notify landlord
        batch.set(adminDb.collection("notifications").doc(), {
          userId:    tx.landlordId,
          type:      "escrow_released",
          title:     "Funds released",
          message:   `₦${Number(tx.amount).toLocaleString()} from "${tx.listingTitle}" has been released to your account.`,
          listingId: tx.listingId,
          reference: tx.reference || doc.id,
          createdAt: now,
        });

        // Notify student
        batch.set(adminDb.collection("notifications").doc(), {
          userId:    tx.studentId,
          type:      "escrow_released",
          title:     "Escrow released",
          message:   `Your rent payment for "${tx.listingTitle}" has been released to the landlord.`,
          listingId: tx.listingId,
          reference: tx.reference || doc.id,
          createdAt: now,
        });

        released++;
      }
    }

    await batch.commit();

    console.log(`Escrow release: ${released} released, ${skipped} skipped`);
    return NextResponse.json({ ok: true, released, skipped });
  } catch (e) {
    console.error("Cron release-escrow error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}