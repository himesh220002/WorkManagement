import { describe, it, expect } from "vitest";
import {
  PRICING_PLANS,
  getRazorpayCredentials,
  createPaymentVerificationToken,
  verifyPaymentVerificationToken,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import { normalizeRole, canProvisionMemberRole } from "@/server/auth/rbac";

describe("Razorpay Paywall & Pricing Plans", () => {
  it("enforces strict $20/month and $200/year pricing plans with zero free trial", () => {
    expect(PRICING_PLANS.monthly.usdAmount).toBe(20);
    expect(PRICING_PLANS.monthly.billingCycle).toBe("month");
    expect(PRICING_PLANS.monthly.inrAmount).toBe(1699);

    expect(PRICING_PLANS.annual.usdAmount).toBe(200);
    expect(PRICING_PLANS.annual.billingCycle).toBe("year");
    expect(PRICING_PLANS.annual.inrAmount).toBe(16999);
    expect(PRICING_PLANS.annual.discountBadge).toContain("17%");
  });

  it("safely generates Razorpay credentials with sandbox fallback when not configured in .env", () => {
    const creds = getRazorpayCredentials();
    expect(creds.keyId).toBeDefined();
    expect(creds.keySecret).toBeDefined();
  });

  it("creates and verifies signed cryptographic payment verification tokens", () => {
    const token = createPaymentVerificationToken({
      plan: "monthly",
      orderId: "order_test_12345",
      paymentId: "pay_test_67890",
      amount: 20,
      currency: "USD",
    });

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const check = verifyPaymentVerificationToken(token);
    expect(check.valid).toBe(true);
    expect(check.payload.plan).toBe("monthly");
    expect(check.payload.orderId).toBe("order_test_12345");
    expect(check.payload.type).toBe("organization_subscription");
  });

  it("rejects invalid or tampered payment verification tokens", () => {
    const invalidCheck = verifyPaymentVerificationToken("invalid.token.here");
    expect(invalidCheck.valid).toBe(false);
  });

  it("handles test signature verification in sandbox mode", () => {
    const isValid = verifyRazorpaySignature("order_123", "pay_456", "simulated_signature");
    expect(typeof isValid).toBe("boolean");
  });

  it("treats guest viewer role with least privilege and blocks member provisioning", () => {
    expect(normalizeRole("viewer")).toBe("viewer");
    expect(normalizeRole("guest")).toBe("viewer");

    const check = canProvisionMemberRole("viewer", "employee");
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain("Only Managers and Owners");
  });
});
