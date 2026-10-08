import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Company } from "@/models";
import { CompanyStatus } from "@/models/enums";
import { verifyPaymentVerificationToken, PRICING_PLANS, PlanId } from "@/lib/razorpay";
import { getCurrentSession } from "@/server/auth/session";

export async function POST(req: NextRequest) {
  await connectToDatabase();

  try {
    const body = await req.json();
    const { paymentToken, plan, companyCode, paymentId } = body;

    if (!paymentToken) {
      return NextResponse.json(
        { success: false, error: "Payment verification token is required to renew" },
        { status: 400 }
      );
    }

    const verification = verifyPaymentVerificationToken(paymentToken);
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.error || "Invalid or expired payment verification token" },
        { status: 402 }
      );
    }

    // Determine target company
    const session = await getCurrentSession();
    let query: Record<string, any> = {};

    if (companyCode) {
      const code = companyCode.trim().toUpperCase();
      query = { $or: [{ companyCode: code }, { slug: companyCode.trim().toLowerCase() }] };
    } else if (session.companyId) {
      query = { _id: session.companyId };
    } else {
      return NextResponse.json(
        { success: false, error: "Company identifier or active session required for renewal" },
        { status: 400 }
      );
    }

    const company = await Company.findOne(query);
    if (!company) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    const rawPlan = (plan || verification.payload?.plan || "monthly").toLowerCase();
    const planId: PlanId =
      rawPlan === "annual" ? "annual" : rawPlan === "quarterly" ? "quarterly" : "monthly";

    const planConfig = PRICING_PLANS[planId];
    const now = new Date();

    // Extend from current period end if still in future, or from now if already expired
    let baseDate = now;
    if (company.subscription?.currentPeriodEnd) {
      const existingEnd = new Date(company.subscription.currentPeriodEnd);
      if (existingEnd > now) {
        baseDate = existingEnd;
      }
    }

    const newPeriodEnd = new Date(baseDate);
    if (planId === "annual") {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    } else if (planId === "quarterly") {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 3);
    } else {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    }

    company.subscription = {
      planId,
      planName: planConfig.name,
      startDate: company.subscription?.startDate || now,
      currentPeriodEnd: newPeriodEnd,
      status: "active",
      razorpayPaymentId: paymentId || verification.payload?.paymentId || "renew_razorpay",
      amountUsd: planConfig.usdAmount,
    };

    if (company.status === CompanyStatus.Paused) {
      company.status = CompanyStatus.Active;
    }

    await company.save();

    return NextResponse.json({
      success: true,
      message: `Organization "${company.name}" subscription successfully renewed with ${planConfig.name}!`,
      company: {
        id: company._id,
        name: company.name,
        code: company.companyCode,
      },
      subscription: company.subscription,
    });
  } catch (error: any) {
    console.error("Renewal error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to renew subscription" },
      { status: 500 }
    );
  }
}
