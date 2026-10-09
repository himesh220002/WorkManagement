import { NextRequest, NextResponse } from "next/server";
import {
  PRICING_PLANS,
  getRazorpayCredentials,
  calculateTieredSubscriptionCost,
} from "@/lib/razorpay";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const purpose = body.purpose || "subscription";
    const currency = (body.currency || "INR").toUpperCase() as "USD" | "INR";
    const { keyId, keySecret, isConfigured } = getRazorpayCredentials();

    let amount = 0;
    let receipt = "";
    let notes: Record<string, string> = {};
    let selectedPlan: any = null;
    let planId: "monthly" | "quarterly" | "annual" = "monthly";

    if (purpose === "add_seats") {
      const additionalSeats = Math.max(1, Number(body.additionalSeats) || 1);
      const unitPrice = currency === "INR" ? 255 : 3;
      amount = Math.round(additionalSeats * unitPrice * 100);
      receipt = `rcpt_seats_u${additionalSeats}_${Date.now().toString(36)}`;
      notes = {
        purpose: "add_seats",
        additionalSeats: String(additionalSeats),
        companyCode: body.companyCode || "",
        companyId: body.companyId || "",
        unitPrice: String(unitPrice),
      };
    } else {
      planId = body.plan === "annual" ? "annual" : body.plan === "quarterly" ? "quarterly" : "monthly";
      selectedPlan = PRICING_PLANS[planId];
      const userCount = Math.max(1, Number(body.userCount) || 1);
      const tiered = calculateTieredSubscriptionCost(userCount, planId, currency);
      const totalCurrencyAmount = currency === "INR" ? tiered.totalInr : tiered.totalUsd;
      amount = Math.round(totalCurrencyAmount * 100);
      receipt = `rcpt_${planId}_u${userCount}_${Date.now().toString(36)}`;
      notes = {
        purpose: "subscription",
        plan: planId,
        planName: selectedPlan.name,
        billingCycle: selectedPlan.billingCycle,
        userCount: String(userCount),
        tierFormula: tiered.tierFormulaLabel,
        companyCode: body.companyCode || "",
        companyId: body.companyId || "",
      };
    }

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
          notes,
        });

        return NextResponse.json({
          success: true,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId,
          plan: planId,
          planDetails: selectedPlan,
          purpose,
          additionalSeats: body.additionalSeats,
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
      purpose,
      additionalSeats: body.additionalSeats,
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
