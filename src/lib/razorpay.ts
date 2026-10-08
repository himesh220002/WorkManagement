import crypto from "crypto";
import jwt from "jsonwebtoken";

export interface PricingPlan {
  id: "monthly" | "annual";
  name: string;
  usdAmount: number;
  inrAmount: number; // For Razorpay INR default currency
  billingCycle: "month" | "year";
  description: string;
  discountBadge?: string;
  features: string[];
}

export const PRICING_PLANS: Record<"monthly" | "annual", PricingPlan> = {
  monthly: {
    id: "monthly",
    name: "Enterprise Monthly",
    usdAmount: 20,
    inrAmount: 1699,
    billingCycle: "month",
    description: "Full enterprise access with month-to-month flexibility.",
    features: [
      "Dedicated isolated MongoDB database (projectManageDB_{CODE})",
      "All Executive, Dev, Sales, Revenue & Resource dashboards",
      "Unlimited parallel execution pipelines & Gantt timelines",
      "AWS S3 presigned document vault & 4 security tiers",
      "5 RBAC roles (Owner, Superuser, Manager, Team Lead, Employee)",
    ],
  },
  annual: {
    id: "annual",
    name: "Enterprise Annual",
    usdAmount: 200,
    inrAmount: 16999,
    billingCycle: "year",
    description: "Best value for growing companies. Save $40 / 17% every year.",
    discountBadge: "Save 17% ($40/yr)",
    features: [
      "Dedicated isolated MongoDB database (projectManageDB_{CODE})",
      "All Executive, Dev, Sales, Revenue & Resource dashboards",
      "Unlimited parallel execution pipelines & Gantt timelines",
      "AWS S3 presigned document vault & 4 security tiers",
      "5 RBAC roles (Owner, Superuser, Manager, Team Lead, Employee)",
      "Priority customer onboarding & dedicated technical support",
    ],
  },
};

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

const PAYMENT_JWT_SECRET = process.env.JWT_SECRET || "taskflow-super-secure-jwt-secret-key-2026";

/**
 * Issues a cryptographically signed payment verification token after successful payment
 */
export function createPaymentVerificationToken(data: {
  plan: "monthly" | "annual";
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
}): string {
  return jwt.sign(
    {
      ...data,
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
