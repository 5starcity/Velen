import { adminDb } from "@/lib/firebase-admin";
import { verifyUnsubscribeToken } from "@/lib/unsubscribeToken";

function htmlPage({ title, message }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #f4f3ee;
            color: #1a1a18;
          }
          .card {
            text-align: center;
            padding: 40px;
            max-width: 400px;
          }
          h1 { color: #2d5a28; font-size: 20px; }
          p { color: #666; font-size: 14px; }
          a { color: #2d5a28; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${title}</h1>
          <p>${message}</p>
          <p><a href="https://rezidence.ng">Back to Rezidence</a></p>
        </div>
      </body>
    </html>
  `;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  const token = searchParams.get("token") || "";

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return new Response(
      htmlPage({
        title: "Invalid or expired link",
        message: "This unsubscribe link isn't valid. If you'd like to stop receiving emails, contact hello@rezidence.ng.",
      }),
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    const snap = await adminDb
      .collection("waitlist")
      .where("email", "==", email)
      .get();

    const batch = adminDb.batch();
    snap.forEach((doc) => {
      batch.update(doc.ref, { unsubscribed: true, unsubscribedAt: new Date().toISOString() });
    });
    await batch.commit();

    return new Response(
      htmlPage({
        title: "You're unsubscribed",
        message: `${email} won't receive any more listing alerts from Rezidence.`,
      }),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new Response(
      htmlPage({
        title: "Something went wrong",
        message: "We couldn't process that right now. Please try again shortly.",
      }),
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}