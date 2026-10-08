import { NextRequest, NextResponse } from "next/server";
import {
  PRICING_PLANS,
  verifyRazorpaySignature,
  createPaymentVerificationToken,
} from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, paymentId, signature, plan } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { success: false, error: "Missing orderId or paymentId" },
        { status: 400 }
      );
    }

    const planId: "monthly" | "quarterly" | "annual" =
      plan === "annual" ? "annual" : plan === "quarterly" ? "quarterly" : "monthly";
    const selectedPlan = PRICING_PLANS[planId];

    const isValid = verifyRazorpaySignature(orderId, paymentId, signature || "");
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature verification failed" },
        { status: 400 }
      );
    }

    // Generate signed verification token valid for 24h to unlock organization registration
    const verificationToken = createPaymentVerificationToken({
      plan: planId,
      orderId,
      paymentId,
      amount: selectedPlan.usdAmount,
      currency: "USD",
    });

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified.",
      verificationToken,
      paymentId,
      orderId,
      plan: planId,
      planName: selectedPlan.name,
      amountUsd: selectedPlan.usdAmount,
      billingCycle: selectedPlan.billingCycle,
    });
  } catch (error: any) {
    console.error("Payment verification route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
