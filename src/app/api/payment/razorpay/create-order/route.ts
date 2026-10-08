import { NextRequest, NextResponse } from "next/server";
import { PRICING_PLANS, getRazorpayCredentials } from "@/lib/razorpay";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const planId: "monthly" | "annual" = body.plan === "annual" ? "annual" : "monthly";
    const selectedPlan = PRICING_PLANS[planId];
    const currency = body.currency || "USD"; // USD or INR

    const { keyId, keySecret, isConfigured } = getRazorpayCredentials();

    // Determine amount in smallest unit (e.g. cents for USD, paise for INR)
    const amount =
      currency === "INR"
        ? selectedPlan.inrAmount * 100
        : selectedPlan.usdAmount * 100;

    const receipt = `rcpt_${planId}_${Date.now().toString(36)}`;

    if (isConfigured) {
      try {
        const instance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const order = await instance.orders.create({
          amount,
          currency,
          receipt,
          notes: {
            plan: planId,
            planName: selectedPlan.name,
            billingCycle: selectedPlan.billingCycle,
          },
        });

        return NextResponse.json({
          success: true,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId,
          plan: planId,
          planDetails: selectedPlan,
          isSandbox: false,
        });
      } catch (razorpayErr: any) {
        console.warn("Razorpay API order creation failed, falling back to sandbox mode:", razorpayErr.message);
      }
    }

    // Sandbox / Test fallback order simulation when real credentials are pending in .env
    const testOrderId = `order_test_${Date.now()}`;
    return NextResponse.json({
      success: true,
      orderId: testOrderId,
      amount,
      currency,
      keyId,
      plan: planId,
      planDetails: selectedPlan,
      isSandbox: true,
      notice: "Razorpay running in test mode. Set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in .env for production.",
    });
  } catch (error: any) {
    console.error("Payment order generation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
