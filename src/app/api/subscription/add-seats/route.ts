import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Company } from "@/models";
import { verifyPaymentVerificationToken, verifyRazorpaySignature } from "@/lib/razorpay";
import { getCurrentSession } from "@/server/auth/session";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    const {
      companyCode,
      additionalSeats = 1,
      paymentToken,
      paymentId,
      orderId,
      signature,
      amountPaidUsd,
    } = await req.json();

    const requestedSeats = Math.max(1, Number(additionalSeats) || 1);

    // Mandatory payment verification: Require either a signed paymentToken or verified Razorpay signature
    if (!paymentToken && !(orderId && paymentId && signature)) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification required before adding seats. Please complete payment via Razorpay.",
        },
        { status: 402 }
      );
    }

    let verifiedSeatsToAdd = requestedSeats;
    let verifiedPaymentId = paymentId;

    if (paymentToken) {
      const verification = verifyPaymentVerificationToken(paymentToken);
      if (!verification.valid) {
        return NextResponse.json(
          { success: false, error: verification.error || "Invalid or expired payment token" },
          { status: 402 }
        );
      }
      if (verification.payload?.purpose === "add_seats") {
        if (verification.payload.additionalSeats) {
          verifiedSeatsToAdd = Number(verification.payload.additionalSeats);
        }
        if (verification.payload.paymentId) {
          verifiedPaymentId = verification.payload.paymentId;
        }
      }
    } else if (orderId && paymentId && signature) {
      const isValid = verifyRazorpaySignature(orderId, paymentId, signature);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Razorpay payment signature verification failed" },
          { status: 402 }
        );
      }
      verifiedPaymentId = paymentId;
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
    const newTotalSeats = currentSeats + verifiedSeatsToAdd;

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
      razorpayPaymentId: verifiedPaymentId || company.subscription?.razorpayPaymentId || "pay_seat_addon",
    } as any;

    await company.save();

    return NextResponse.json({
      success: true,
      message: `Successfully added ${verifiedSeatsToAdd} seat${verifiedSeatsToAdd > 1 ? "s" : ""} to organization ${company.name}! Total capacity is now ${newTotalSeats} seats.`,
      company: {
        id: company._id,
        name: company.name,
        code: company.companyCode,
      },
      subscription: {
        userCount: newTotalSeats,
        addedSeats: verifiedSeatsToAdd,
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
