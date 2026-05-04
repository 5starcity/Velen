// app/api/paystack/verify/route.js
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const reference        = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await res.json();

    if (!data.status || data.data.status !== "success") {
      return NextResponse.json({
        success:  false,
        status:   data.data?.status || "failed",
        message:  data.message,
      });
    }

    return NextResponse.json({
      success:  true,
      status:   data.data.status,
      amount:   data.data.amount / 100,
      reference: data.data.reference,
      metadata: data.data.metadata,
      paidAt:   data.data.paid_at,
    });
  } catch (e) {
    console.error("Verify payment error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}