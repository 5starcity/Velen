import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import { generateUnsubscribeToken } from "@/lib/unsubscribeToken";

const SYSTEM_DOC = "system/notifications";

function buildDigestHtml(listings, email) {
  const rows = listings
    .map(
      (l) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;">
            <a href="https://rezidence.ng/listings/${l.id}" style="color:#2d5a28;font-weight:600;text-decoration:none;">
              ${l.title || "New listing"}
            </a>
            <div style="color:#666;font-size:13px;margin-top:4px;">
              ${l.location || ""} ${l.price ? `&middot; ₦${Number(l.price).toLocaleString()}` : ""}
            </div>
          </td>
        </tr>`
    )
    .join("");

  const unsubToken = generateUnsubscribeToken(email);
  const unsubUrl = `https://rezidence.ng/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
      <h2 style="color:#2d5a28;">New rooms just went live on Rezidence</h2>
      <p style="color:#444;font-size:14px;">Here's what's new today:</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <p style="margin-top:24px;">
        <a href="https://rezidence.ng/listings" style="background:#2d5a28;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          Browse all listings
        </a>
      </p>
      <p style="color:#999;font-size:12px;margin-top:32px;">
        You're receiving this because you signed up for listing alerts on Rezidence.
        <a href="${unsubUrl}" style="color:#999;">Unsubscribe</a>
      </p>
    </div>
  `;
}

export async function GET(request) {
  // Protect against public triggering — Vercel Cron sends this automatically
  // when CRON_SECRET is set as an env var and referenced in vercel.json.
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const systemRef = adminDb.doc(SYSTEM_DOC);
    const systemSnap = await systemRef.get();
    const lastSentAt = systemSnap.exists
      ? systemSnap.data().lastDigestSentAt
      : new Date(0).toISOString();

    // 1. Find listings created since the last digest
    const listingsSnap = await adminDb
      .collection("listings")
      .where("status", "==", "active")
      .where("createdAt", ">", lastSentAt)
      .get();

    if (listingsSnap.empty) {
      return NextResponse.json({ success: true, message: "No new listings, nothing sent." });
    }

    const listings = listingsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // 2. Get waitlist emails (skip anyone who unsubscribed)
    const waitlistSnap = await adminDb
      .collection("waitlist")
      .where("unsubscribed", "!=", true)
      .get();

    const emails = waitlistSnap.docs
      .map((doc) => doc.data().email)
      .filter(Boolean);

    if (emails.length === 0) {
      return NextResponse.json({ success: true, message: "No subscribers to notify." });
    }

    // 3. Send sequentially with a small delay to stay within SMTP rate limits
    const results = { sent: 0, failed: 0 };

    for (const email of emails) {
      try {
        const html = buildDigestHtml(listings, email);
        await sendEmail({
          to: email,
          subject: `${listings.length} new room${listings.length > 1 ? "s" : ""} just listed on Rezidence`,
          html,
        });
        results.sent++;
      } catch (err) {
        console.error(`Failed to send digest to ${email}:`, err);
        results.failed++;
      }
      // small delay to avoid tripping Whogohost's SMTP rate limits
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // 4. Record that we sent this digest
    await systemRef.set(
      { lastDigestSentAt: new Date().toISOString() },
      { merge: true }
    );

    return NextResponse.json({ success: true, ...results, newListings: listings.length });
  } catch (error) {
    console.error("Digest cron error:", error);
    return NextResponse.json({ error: "Digest run failed." }, { status: 500 });
  }
}