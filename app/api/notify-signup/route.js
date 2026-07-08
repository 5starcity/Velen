import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const body = await request.json();
    const email = (body?.email || "").trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const waitlistRef = adminDb.collection("waitlist");

    // Avoid duplicate entries for the same email
    const existing = await waitlistRef.where("email", "==", email).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({ success: true, message: "Already subscribed." });
    }

    await waitlistRef.add({
      email,
      source: "featured_listings_empty_state",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("notify-signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}