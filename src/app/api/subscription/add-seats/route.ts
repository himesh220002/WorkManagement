import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Company } from "@/models";
import { verifyPaymentVerificationToken } from "@/lib/razorpay";
import { getCurrentSession } from "@/server/auth/session";
import { syncTenantWrite } from "@/lib/tenantDb";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    const {
      companyCode,
      additionalSeats = 1,
      paymentToken,
      paymentId,
      amountPaidUsd,
    } = await req.json();

    const seatsToAdd = Math.max(1, Number(additionalSeats) || 1);

    // Verify token if provided
    if (paymentToken) {
      const verification = verifyPaymentVerificationToken(paymentToken);
      if (!verification.valid) {
        return NextResponse.json(
          { success: false, error: verification.error || "Invalid payment token" },
          { status: 402 }
        );
      }
    }

    let query: any = {};
    if (companyCode) {
      const cleanCode = companyCode.trim().toUpperCase();
      query = { $or: [{ companyCode: cleanCode }, { slug: companyCode.trim().toLowerCase() }] };
    } else if (session.companyId) {
      query = { _id: session.companyId };
    } else {
      return NextResponse.json(
        { success: false, error: "Company identification required to add seats" },
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

    const currentSeats = company.subscription?.userCount || 2;
    const newTotalSeats = currentSeats + seatsToAdd;

    company.subscription = {
      planId: company.subscription?.planId || "monthly",
      planName: company.subscription?.planName || "Monthly Plan",
      startDate: company.subscription?.startDate || new Date(),
      currentPeriodEnd: company.subscription?.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: company.subscription?.status || "active",
      amountUsd: company.subscription?.amountUsd || 0,
      pricePerUserMonthly: 3,
      baseStorageGB: company.subscription?.baseStorageGB || 2,
      extraStorageGB: company.subscription?.extraStorageGB || 0,
      storageAddonCostUSD: company.subscription?.storageAddonCostUSD || 0,
      usedStorageBytes: company.subscription?.usedStorageBytes || 0,
      nextBillingAmountUSD: company.subscription?.nextBillingAmountUSD || 0,
      ...(company.subscription || {}),
      userCount: newTotalSeats,
      razorpayPaymentId: paymentId || company.subscription?.razorpayPaymentId || "pay_seat_addon",
    } as any;

    await company.save();

    return NextResponse.json({
      success: true,
      message: `Successfully added ${seatsToAdd} seat${seatsToAdd > 1 ? "s" : ""} to organization ${company.name}! Total capacity is now ${newTotalSeats} seats.`,
      company: {
        id: company._id,
        name: company.name,
        code: company.companyCode,
      },
      subscription: {
        userCount: newTotalSeats,
        addedSeats: seatsToAdd,
        currentSeats,
      },
    });
  } catch (error: any) {
    console.error("Add seats error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add seats" },
      { status: 500 }
    );
  }
}
