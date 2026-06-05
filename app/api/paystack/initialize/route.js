// app/api/paystack/initialize/route.js
import { NextResponse } from "next/server";
import { calculateTotal } from "@/lib/paymentConfig";

export async function POST(req) {
  try {
    const {
      email,
      amount,
      listingId,
      listingTitle,
      studentId,
      studentName,
      landlordId,
      paystackSubaccount,
      idempotencyKey,
      type,
    } = await req.json();

    if (!email || !amount || !listingId || !idempotencyKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { fee, total } = calculateTotal(Number(amount));

    // Build Paystack payload
    const payload = {
      email,
      amount: total * 100, // Paystack uses kobo
      reference: idempotencyKey,
      callback_url: `https://rsu-housing.vercel.app/pay/verify?ref=${idempotencyKey}`,
      metadata: {
        listingId,
        listingTitle,
        studentId,
        studentName,
        landlordId,
        rentAmount: amount,
        serviceFee: fee,
        totalCharged: total,
        landlordPayout: amount, // full amount to landlord, fee taken from student
        type: type || "rent",
        idempotencyKey,
        cancel_action: `https://rsu-housing.vercel.app/listings/${listingId}`,
      },
    };

    // Add subaccount split if landlord has one
    if (paystackSubaccount) {
      payload.subaccount = paystackSubaccount;
      payload.transaction_charge = fee * 100; // fee stays with rezidence
      payload.bearer = "subaccount"; // landlord bears their own charge
    }

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message }, { status: 400 });
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      access_code: data.data.access_code,
    });
  } catch (e) {
    console.error("Initialize payment error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}