// app/api/paystack/create-subaccount/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { business_name, bank_code, account_number, uid } = await req.json();

    const res = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name,
        bank_code,
        account_number,
        percentage_charge: 10,
        description: `rezidence landlord - ${uid}`,
      }),
    });

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message }, { status: 400 });
    }

    return NextResponse.json({
      subaccount_code: data.data.subaccount_code,
      subaccount_id: data.data.id,
    });
  } catch (e) {
    console.error("Subaccount creation error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}