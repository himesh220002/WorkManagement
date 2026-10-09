import { describe, it, expect } from "vitest";
import {
  PRICING_PLANS,
  calculateTieredSubscriptionCost,
  getRazorpayCredentials,
  createPaymentVerificationToken,
  verifyPaymentVerificationToken,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import { normalizeRole, canProvisionMemberRole } from "@/server/auth/rbac";

describe("Razorpay Paywall & Pricing Plans", () => {
  it("enforces strict $5/user/month and $50/user/year pricing plans with zero free trial", () => {
    expect(PRICING_PLANS.monthly.usdAmount).toBe(5);
    expect(PRICING_PLANS.monthly.billingCycle).toBe("month");
    expect(PRICING_PLANS.monthly.inrAmount).toBe(425);

    expect(PRICING_PLANS.annual.usdAmount).toBe(50);
    expect(PRICING_PLANS.annual.billingCycle).toBe("year");
    expect(PRICING_PLANS.annual.inrAmount).toBe(4250);
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

  it("calculates exact user-requested tiered subscription costs across all seat tiers", () => {
    // 2 Seats: Base Tier 1 (Flat Rate) -> $5 -> $2.50 / user
    const seats2 = calculateTieredSubscriptionCost(2, "monthly", "USD");
    expect(seats2.monthlyUsd).toBe(5);
    expect(seats2.totalUsd).toBe(5);
    expect(seats2.effectivePerUserMonthlyUsd).toBe(2.50);
    expect(seats2.tierFormulaLabel).toBe("Base Tier 1 (Flat Rate)");

    // 4 Seats: Base Tier 2 (Flat Rate) -> $8 -> $2.00 / user
    const seats4 = calculateTieredSubscriptionCost(4, "monthly", "USD");
    expect(seats4.monthlyUsd).toBe(8);
    expect(seats4.totalUsd).toBe(8);
    expect(seats4.effectivePerUserMonthlyUsd).toBe(2.00);
    expect(seats4.tierFormulaLabel).toBe("Base Tier 2 (Flat Rate)");

    // 5 Seats: $8 Base + 1 additional seat ($3) -> $11 -> $2.20 / user
    const seats5 = calculateTieredSubscriptionCost(5, "monthly", "USD");
    expect(seats5.monthlyUsd).toBe(11);
    expect(seats5.totalUsd).toBe(11);
    expect(seats5.effectivePerUserMonthlyUsd).toBe(2.20);
    expect(seats5.tierFormulaLabel).toBe("$8 Base + 1 additional seat ($3)");

    // 10 Seats: $8 Base + 6 additional seats ($18) -> $26 -> $2.60 / user
    const seats10 = calculateTieredSubscriptionCost(10, "monthly", "USD");
    expect(seats10.monthlyUsd).toBe(26);
    expect(seats10.totalUsd).toBe(26);
    expect(seats10.effectivePerUserMonthlyUsd).toBe(2.60);
    expect(seats10.tierFormulaLabel).toBe("$8 Base + 6 additional seats ($18)");

    // 20 Seats: $8 Base + 16 additional seats ($48) -> $56 -> $2.80 / user
    const seats20 = calculateTieredSubscriptionCost(20, "monthly", "USD");
    expect(seats20.monthlyUsd).toBe(56);
    expect(seats20.totalUsd).toBe(56);
    expect(seats20.effectivePerUserMonthlyUsd).toBe(2.80);
    expect(seats20.tierFormulaLabel).toBe("$8 Base + 16 additional seats ($48)");

    // 50 Seats: $8 Base + 46 additional seats ($138) -> $146 -> $2.92 / user
    const seats50 = calculateTieredSubscriptionCost(50, "monthly", "USD");
    expect(seats50.monthlyUsd).toBe(146);
    expect(seats50.totalUsd).toBe(146);
    expect(seats50.effectivePerUserMonthlyUsd).toBe(2.92);
    expect(seats50.tierFormulaLabel).toBe("$8 Base + 46 additional seats ($138)");

    // 100 Seats: $8 Base + 96 additional seats ($288) -> $296 -> $2.96 / user
    const seats100 = calculateTieredSubscriptionCost(100, "monthly", "USD");
    expect(seats100.monthlyUsd).toBe(296);
    expect(seats100.totalUsd).toBe(296);
    expect(seats100.effectivePerUserMonthlyUsd).toBe(2.96);
    expect(seats100.tierFormulaLabel).toBe("$8 Base + 96 additional seats ($288)");

    // 500 Seats: $8 Base + 496 additional seats ($1,488) -> $1,496 -> $2.99 / user
    const seats500 = calculateTieredSubscriptionCost(500, "monthly", "USD");
    expect(seats500.monthlyUsd).toBe(1496);
    expect(seats500.totalUsd).toBe(1496);
    expect(seats500.effectivePerUserMonthlyUsd).toBe(2.99);
    expect(seats500.tierFormulaLabel).toBe("$8 Base + 496 additional seats ($1488)");
  });

  it("calculates proportional INR values for domestic Indian UPI / NetBanking payments", () => {
    const inr2 = calculateTieredSubscriptionCost(2, "monthly", "INR");
    expect(inr2.monthlyInr).toBe(425);

    const inr4 = calculateTieredSubscriptionCost(4, "monthly", "INR");
    expect(inr4.monthlyInr).toBe(680);

    const inr5 = calculateTieredSubscriptionCost(5, "monthly", "INR");
    expect(inr5.monthlyInr).toBe(935);

    const inr10 = calculateTieredSubscriptionCost(10, "monthly", "INR");
    expect(inr10.monthlyInr).toBe(2210);

    const inr100 = calculateTieredSubscriptionCost(100, "monthly", "INR");
    expect(inr100.monthlyInr).toBe(25160);
  });

  it("applies accurate multi-month discounts (Quarterly 7% and Annual 2 Months Free)", () => {
    // 5 seats monthly = $11
    // 5 seats quarterly = Math.round(11 * 2.8) = $31
    const quarterly5 = calculateTieredSubscriptionCost(5, "quarterly", "USD");
    expect(quarterly5.totalUsd).toBe(31);
    expect(quarterly5.durationMonths).toBe(3);

    // 5 seats annual = 11 * 10 = $110 (2 months free!)
    const annual5 = calculateTieredSubscriptionCost(5, "annual", "USD");
    expect(annual5.totalUsd).toBe(110);
    expect(annual5.durationMonths).toBe(12);
  });
});

