import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { authRateLimit } from "@/lib/rate-limit";
import { getFirestore } from "firebase-admin/firestore";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://rezidence.ng";

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

async function logAttempt(email, ip, success, reason) {
  try {
    const db = getFirestore();
    await db.collection("admin_login_audit").add({
      email: email || "unknown",
      ip,
      success,
      reason: reason || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}

export async function POST(request) {
  const ip = getClientIp(request);

  // 1. Origin check — reject requests not coming from your own site
  const origin = request.headers.get("origin");
  if (origin && origin !== ALLOWED_ORIGIN) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  // 2. Rate limit by IP
  const { success: withinLimit, remaining } = await authRateLimit.limit(ip);
  if (!withinLimit) {
    await logAttempt(undefined, ip, false, "rate_limited");
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase();

    // 3. Require verified email (blocks unverified accounts entirely)
    if (!decoded.email_verified) {
      await logAttempt(email, ip, false, "email_not_verified");
      return NextResponse.json({ error: "Email not verified" }, { status: 403 });
    }

    // 4. Allowlist check
    if (!email || !ADMIN_EMAILS.includes(email)) {
      await logAttempt(email, ip, false, "not_in_allowlist");
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    await logAttempt(email, ip, true);

    const response = NextResponse.json({ success: true });
    response.cookies.set("rezidence_admin_session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Session creation failed:", err);
    await logAttempt(undefined, ip, false, "invalid_token");
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export async function DELETE(request) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("rezidence_admin_session");
  return response;
}