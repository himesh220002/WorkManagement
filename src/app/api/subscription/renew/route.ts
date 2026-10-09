import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Company, User } from "@/models";
import { CompanyStatus } from "@/models/enums";
import {
  verifyPaymentVerificationToken,
  PRICING_PLANS,
  PlanId,
  calculateTieredSubscriptionCost,
} from "@/lib/razorpay";
import { getCurrentSession } from "@/server/auth/session";

export async function POST(req: NextRequest) {
  await connectToDatabase();

  try {
    const body = await req.json();
    const { paymentToken, plan, companyCode, paymentId } = body;
    // Explicit seat override from the repay portal stepper / checkout modal.
    // Falls back to the verified payment token, then to the stored quota.
    const requestedSeatsRaw =
      body.newSeatCount ?? body.userCount ?? body.desiredSeats ?? body.seats;

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

    const tokenSeats = Number(verification.payload?.userCount) || 0;
    const storedSeats = Number(company.subscription?.userCount) || 0;
    const explicitSeats = Number(requestedSeatsRaw) || 0;
    const userCount = Math.max(1, Math.floor(explicitSeats || tokenSeats || storedSeats || 1));

    // Guard: cannot shrink the quota below already-occupied seats.
    const filledSeats = await User.countDocuments({ companyId: company._id });
    if (userCount < filledSeats) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot renew with ${userCount} seats — ${filledSeats} seats are already occupied. Increase seats to at least ${filledSeats} before paying.`,
          filledSeats,
          requestedSeats: userCount,
        },
        { status: 400 }
      );
    }

    if (userCount > 500) {
      return NextResponse.json(
        { success: false, error: "Seat count cannot exceed 500 per renewal. Contact support for larger quotas." },
        { status: 400 }
      );
    }

    const tiered = calculateTieredSubscriptionCost(userCount, planId, "USD");
    const amountUsd = tiered.totalUsd;

    company.subscription = {
      planId,
      planName: `${planConfig.name} (${tiered.tierFormulaLabel})`,
      startDate: company.subscription?.startDate || now,
      currentPeriodEnd: newPeriodEnd,
      status: "active",
      razorpayPaymentId: paymentId || verification.payload?.paymentId || "renew_razorpay",
      amountUsd,
      userCount,
      pricePerUserMonthly: 5,
      baseStorageGB: company.subscription?.baseStorageGB || 2,
      extraStorageGB: company.subscription?.extraStorageGB || 0,
      storageAddonCostUSD: company.subscription?.storageAddonCostUSD || 0,
      usedStorageBytes: company.subscription?.usedStorageBytes || 0,
      nextBillingAmountUSD: amountUsd + (company.subscription?.storageAddonCostUSD || 0),
    };

    if (company.status === CompanyStatus.Paused) {
      company.status = CompanyStatus.Active;
    }

    await company.save();

    return NextResponse.json({
      success: true,
      message: `Organization "${company.name}" subscription successfully renewed with ${planConfig.name} for ${userCount} seats!`,
      company: {
        id: company._id,
        name: company.name,
        code: company.companyCode,
      },
      subscription: company.subscription,
      seats: { total: userCount, filled: filledSeats },
    });
  } catch (error: any) {
    console.error("Renewal error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to renew subscription" },
      { status: 500 }
    );
  }
}
