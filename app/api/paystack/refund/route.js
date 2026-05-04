// app/api/paystack/refund/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { reference, amount, reason } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const payload = { transaction: reference };
    if (amount) payload.amount = amount * 100; // partial refund in kobo

    const res = await fetch("https://api.paystack.co/refund", {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, refund: data.data });
  } catch (e) {
    console.error("Refund error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}