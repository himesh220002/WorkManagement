import { NextRequest, NextResponse } from "next/server";
import {
  PRICING_PLANS,
  verifyRazorpaySignature,
  createPaymentVerificationToken,
  calculateTieredSubscriptionCost,
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

    const userCount = Math.max(1, Number(body.userCount) || 1);
    const currency = ((body.currency || "INR").toUpperCase()) as "USD" | "INR";
    const tiered = calculateTieredSubscriptionCost(userCount, planId, currency);
    const amount = currency === "INR" ? tiered.totalInr : tiered.totalUsd;

    // Generate signed verification token valid for 24h to unlock organization registration
    const verificationToken = createPaymentVerificationToken({
      plan: planId,
      orderId,
      paymentId,
      amount,
      currency,
      userCount,
    });

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified.",
      verificationToken,
      paymentId,
      orderId,
      plan: planId,
      planName: selectedPlan.name,
      amountUsd: tiered.totalUsd,
      monthlyUsd: tiered.monthlyUsd,
      billingCycle: selectedPlan.billingCycle,
      tierFormula: tiered.tierFormulaLabel,
      userCount,
    });
  } catch (error: any) {
    console.error("Payment verification route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
