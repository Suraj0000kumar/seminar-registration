import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { FEE_STRUCTURE } from "@/types/registration";

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function POST(request: NextRequest) {
  try {
    const razorpay = getRazorpay();
    const body = await request.json();
    const { designation, paperSubmission } = body;

    const fees = FEE_STRUCTURE[designation as keyof typeof FEE_STRUCTURE];
    if (!fees) {
      return NextResponse.json(
        { error: "Invalid designation" },
        { status: 400 }
      );
    }

    let amount = fees.base * 100; // Convert to paise
    if (paperSubmission) {
      amount += fees.paper * 100;
    }

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `seminar_${Date.now()}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: amount / 100,
      currency: "INR",
    });
  } catch (error: unknown) {
    console.error("Order creation error:", error);
    const err = error as { statusCode?: number; error?: { description?: string } };
    const message =
      err?.error?.description ||
      (err?.statusCode === 401
        ? "Razorpay authentication failed. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local"
        : "Failed to create order");
    return NextResponse.json(
      { error: message },
      { status: err?.statusCode === 401 ? 401 : 500 }
    );
  }
}
