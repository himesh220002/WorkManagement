import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Company } from "@/models";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("⚠️ Razorpay webhook signature verification failed");
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`🔔 Received Razorpay Webhook Event: ${event}`);

    await connectToDatabase();

    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    const notes = paymentEntity?.notes || orderEntity?.notes || {};

    const companyCode = (notes.companyCode || notes.code || "").toUpperCase();
    const companyId = notes.companyId;
    const orderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;
    const plan = notes.plan;
    const billingCycle = notes.billingCycle;

    // Locate target organization in database
    let company = null;
    if (companyCode) {
      company = await Company.findOne({ companyCode });
    }
    if (!company && companyId) {
      company = await Company.findById(companyId);
    }
    if (!company && orderId) {
      company = await Company.findOne({ "subscription.razorpayOrderId": orderId });
    }

    if (company) {
      if (event === "payment.captured" || event === "order.paid") {
        const now = new Date();
        const currentEnd = company.subscription?.currentPeriodEnd
          ? new Date(company.subscription.currentPeriodEnd)
          : now;
        const newPeriodEnd = currentEnd > now ? new Date(currentEnd) : new Date(now);

        const subPlan = (plan === "annual" || plan === "quarterly" || plan === "monthly"
          ? plan
          : company.subscription?.planId || "monthly") as "monthly" | "quarterly" | "annual";

        if (billingCycle === "year" || subPlan === "annual") {
          newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
        } else if (billingCycle === "quarter" || subPlan === "quarterly") {
          newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 3);
        } else {
          newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
        }

        company.subscription = {
          planId: subPlan,
          planName: company.subscription?.planName || `${subPlan.toUpperCase()} Plan`,
          startDate: company.subscription?.startDate || now,
          currentPeriodEnd: newPeriodEnd,
          status: "active",
          razorpayPaymentId: paymentId || company.subscription?.razorpayPaymentId,
          razorpayOrderId: orderId || company.subscription?.razorpayOrderId,
          userCount: company.subscription?.userCount || Number(notes.userCount) || 1,
          pricePerUserMonthly: company.subscription?.pricePerUserMonthly || 5,
          baseStorageGB: company.subscription?.baseStorageGB || 2,
          extraStorageGB: company.subscription?.extraStorageGB || 0,
          storageAddonCostUSD: company.subscription?.storageAddonCostUSD || 0,
          usedStorageBytes: company.subscription?.usedStorageBytes || 0,
        };

        await company.save();
        console.log(`✅ Organization ${company.companyCode} subscription marked active via webhook.`);
      } else if (event === "payment.failed") {
        console.warn(`⚠️ Payment failed for organization ${company.companyCode}: ${paymentEntity?.error_description}`);
      }
    } else {
      console.log(`ℹ️ Razorpay webhook event ${event} processed (pre-registration or no company matched yet)`);
    }

    return NextResponse.json({
      success: true,
      received: true,
      event,
    });
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
