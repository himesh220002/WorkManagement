import crypto from "crypto";
import jwt from "jsonwebtoken";

export type PlanId = "monthly" | "quarterly" | "annual";

export interface PricingPlan {
  id: PlanId;
  name: string;
  usdPerUser: number;
  inrPerUser: number;
  usdAmount: number; // Base 1-user starting amount
  inrAmount: number;
  billingCycle: "month" | "quarter" | "year";
  durationMonths: number;
  description: string;
  discountBadge?: string;
  features: string[];
}

export const PRICING_PLANS: Record<PlanId, PricingPlan> = {
  monthly: {
    id: "monthly",
    name: "Enterprise Tiered Monthly",
    usdPerUser: 5,
    inrPerUser: 425,
    usdAmount: 5,
    inrAmount: 425,
    billingCycle: "month",
    durationMonths: 1,
    description: "Tiered team pricing ($5 for 2 seats, $8 for 4 seats, +$3/seat) with 2 GB cloud storage included.",
    features: [
      "Tiered pricing: $5 (2 seats), $8 (4 seats), +$3 per extra seat",
      "2 GB free included encrypted AWS S3 document vault",
      "Elastic auto-expanding storage (+5 GB for $3/mo upon hitting limits)",
      "Dedicated isolated MongoDB database (projectManageDB_{CODE})",
      "All Executive, Dev, Sales, Revenue & Resource dashboards",
      "Unlimited parallel execution pipelines & Gantt timelines",
      "Enterprise hierarchy (Owner, Managers, Team Leads, Employees)",
    ],
  },
  quarterly: {
    id: "quarterly",
    name: "Enterprise Tiered Quarterly (3 Months)",
    usdPerUser: 14,
    inrPerUser: 1190,
    usdAmount: 14,
    inrAmount: 1190,
    billingCycle: "quarter",
    durationMonths: 3,
    description: "3-month commitment with 7% discount and 2 GB cloud storage included.",
    discountBadge: "Save 7% ($14/user)",
    features: [
      "3 full months with 7% quarterly discount",
      "2 GB free included encrypted AWS S3 document vault",
      "Elastic auto-expanding storage (+5 GB for $3/mo upon hitting limits)",
      "Dedicated isolated MongoDB database (projectManageDB_{CODE})",
      "All Executive, Dev, Sales, Revenue & Resource dashboards",
      "Unlimited parallel execution pipelines & Gantt timelines",
      "Enterprise hierarchy (Owner, Managers, Team Leads, Employees)",
    ],
  },
  annual: {
    id: "annual",
    name: "Enterprise Tiered Annual (1 Year)",
    usdPerUser: 50,
    inrPerUser: 4250,
    usdAmount: 50,
    inrAmount: 4250,
    billingCycle: "year",
    durationMonths: 12,
    description: "12-month annual scaling plan with 2 months free!",
    discountBadge: "Save 17% (2 Mo Free)",
    features: [
      "Annual commitment with 2 Months FREE (Pay for 10 months, get 12!)",
      "2 GB free included encrypted AWS S3 document vault",
      "Elastic auto-expanding storage (+5 GB for $3/mo upon hitting limits)",
      "Dedicated isolated MongoDB database (projectManageDB_{CODE})",
      "All Executive, Dev, Sales, Revenue & Resource dashboards",
      "Unlimited parallel execution pipelines & Gantt timelines",
      "Enterprise hierarchy (Owner, Managers, Team Leads, Employees)",
      "Priority customer onboarding & dedicated technical support",
    ],
  },
};

export interface TieredCostCalculation {
  seats: number;
  monthlyUsd: number;
  monthlyInr: number;
  totalUsd: number;
  totalInr: number;
  effectivePerUserMonthlyUsd: number;
  effectivePerUserMonthlyInr: number;
  tierFormulaLabel: string;
  durationMonths: number;
  savingsLabel?: string;
}

/**
 * Calculates tiered subscription cost based on team seats:
 * - 1 to 2 Seats: Base Tier 1 ($5 flat / ₹425) -> $2.50/user
 * - 3 to 4 Seats: Base Tier 2 ($8 flat / ₹680) -> $2.00/user for 4
 * - 5+ Seats: $8 Base + $3 per additional seat (₹680 + ₹255/seat)
 *
 * Cadences:
 * - Monthly: 1 Month
 * - Quarterly: 3 Months (7% discount)
 * - Annual: 12 Months (2 Months Free - pay 10 months for 12 months!)
 */
export function calculateTieredSubscriptionCost(
  userCount: number = 1,
  planId: PlanId = "monthly",
  currency: "USD" | "INR" = "INR"
): TieredCostCalculation {
  const seats = Math.max(1, Number(userCount) || 1);

  let monthlyUsd = 5;
  let tierFormulaLabel = "Base Tier 1 (Flat Rate)";

  if (seats <= 2) {
    monthlyUsd = 5;
    tierFormulaLabel = "Base Tier 1 (Flat Rate)";
  } else if (seats <= 4) {
    monthlyUsd = 8;
    tierFormulaLabel = "Base Tier 2 (Flat Rate)";
  } else {
    const extraSeats = seats - 4;
    monthlyUsd = 8 + extraSeats * 3;
    tierFormulaLabel = `$8 Base + ${extraSeats} additional seat${extraSeats > 1 ? "s" : ""} ($${extraSeats * 3})`;
  }

  const monthlyInr =
    seats <= 2
      ? 425
      : seats <= 4
      ? 680
      : 680 + (seats - 4) * 255;

  const effectivePerUserMonthlyUsd = Number((monthlyUsd / seats).toFixed(2));
  const effectivePerUserMonthlyInr = Number((monthlyInr / seats).toFixed(0));

  let totalUsd = monthlyUsd;
  let totalInr = monthlyInr;
  let durationMonths = 1;
  let savingsLabel: string | undefined = undefined;

  if (planId === "quarterly") {
    durationMonths = 3;
    totalUsd = Math.round(monthlyUsd * 2.8);
    totalInr = Math.round(monthlyInr * 2.8);
    savingsLabel = "Save 7% vs Monthly";
  } else if (planId === "annual") {
    durationMonths = 12;
    totalUsd = monthlyUsd * 10;
    totalInr = monthlyInr * 10;
    savingsLabel = "Save 17% (2 Mo Free)";
  }

  return {
    seats,
    monthlyUsd,
    monthlyInr,
    totalUsd,
    totalInr,
    effectivePerUserMonthlyUsd,
    effectivePerUserMonthlyInr,
    tierFormulaLabel,
    durationMonths,
    savingsLabel,
  };
}

/**
 * Returns Razorpay API credentials from environment or defaults to sandbox test mode.
 */
export function getRazorpayCredentials() {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

  const isConfigured = Boolean(
    keyId &&
    keySecret &&
    !keyId.includes("placeholder") &&
    keyId !== "" &&
    keySecret !== ""
  );

  return {
    keyId: isConfigured ? keyId : "rzp_test_TaskFlowDemoKey",
    keySecret: isConfigured ? keySecret : "TaskFlowDemoSecret2026",
    isConfigured,
  };
}

/**
 * Verifies Razorpay checkout HMAC SHA256 signature
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const { keySecret, isConfigured } = getRazorpayCredentials();

  // If in sandbox mode without real credentials, allow test payments
  if (!isConfigured) {
    return Boolean(orderId && paymentId);
  }

  try {
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return generatedSignature === signature;
  } catch (err) {
    console.error("Razorpay signature verification error:", err);
    return false;
  }
}

/**
 * Verifies Razorpay Webhook HMAC SHA256 signature
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret?: string
): boolean {
  const secret = (webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || "cyphertechrazorsecret").trim();
  if (!secret) {
    console.warn("RAZORPAY_WEBHOOK_SECRET not configured in .env");
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature.length !== signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(signature, "utf-8")
    );
  } catch (err) {
    console.error("Razorpay webhook signature verification error:", err);
    return false;
  }
}

const PAYMENT_JWT_SECRET = process.env.JWT_SECRET || "taskflow-super-secure-jwt-secret-key-2026";

/**
 * Issues a cryptographically signed payment verification token after successful payment
 */
export function createPaymentVerificationToken(data: {
  plan: PlanId;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  userCount?: number;
}): string {
  return jwt.sign(
    {
      ...data,
      userCount: data.userCount || 1,
      paidAt: new Date().toISOString(),
      type: "organization_subscription",
    },
    PAYMENT_JWT_SECRET,
    { expiresIn: "24h" }
  );
}

/**
 * Verifies an organization registration payment verification token
 */
export function verifyPaymentVerificationToken(token: string): {
  valid: boolean;
  payload?: any;
  error?: string;
} {
  try {
    const decoded = jwt.verify(token, PAYMENT_JWT_SECRET) as any;
    if (decoded && decoded.type === "organization_subscription") {
      return { valid: true, payload: decoded };
    }
    return { valid: false, error: "Invalid payment token type" };
  } catch (err: any) {
    return { valid: false, error: err.message || "Invalid or expired payment token" };
  }
}
