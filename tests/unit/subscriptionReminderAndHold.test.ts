import { describe, it, expect } from "vitest";
import {
  evaluateSubscriptionStatus,
  getSubscriptionThresholdDays,
} from "@/lib/subscriptionReminder";
import { PRICING_PLANS } from "@/lib/razorpay";

describe("Subscription Reminder Thresholds & Account Hold Logic", () => {
  it("enforces plan-specific reminder thresholds (Monthly 3d, Quarterly 7d, Annual 15d)", () => {
    expect(getSubscriptionThresholdDays("monthly")).toBe(3);
    expect(getSubscriptionThresholdDays("quarterly")).toBe(7);
    expect(getSubscriptionThresholdDays("annual")).toBe(15);
  });

  it("triggers warning for monthly subscription only in the last 3 days", () => {
    const now = new Date();

    // 2 days remaining -> Expiring soon warning triggered
    const twoDaysEnd = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const resultWarn = evaluateSubscriptionStatus({
      planId: "monthly",
      currentPeriodEnd: twoDaysEnd,
    });
    expect(resultWarn).not.toBeNull();
    expect(resultWarn?.isExpiringSoon).toBe(true);
    expect(resultWarn?.isExpired).toBe(false);
    expect(resultWarn?.thresholdDays).toBe(3);

    // 5 days remaining -> No warning yet
    const fiveDaysEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const resultOk = evaluateSubscriptionStatus({
      planId: "monthly",
      currentPeriodEnd: fiveDaysEnd,
    });
    expect(resultOk?.isExpiringSoon).toBe(false);
    expect(resultOk?.isExpired).toBe(false);
  });

  it("triggers warning for 3-month quarterly subscription in the last 7 days", () => {
    const now = new Date();

    // 6 days remaining -> Warning triggered
    const sixDaysEnd = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
    const resWarn = evaluateSubscriptionStatus({
      planId: "quarterly",
      currentPeriodEnd: sixDaysEnd,
    });
    expect(resWarn?.isExpiringSoon).toBe(true);
    expect(resWarn?.thresholdDays).toBe(7);

    // 10 days remaining -> No warning
    const tenDaysEnd = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const resOk = evaluateSubscriptionStatus({
      planId: "quarterly",
      currentPeriodEnd: tenDaysEnd,
    });
    expect(resOk?.isExpiringSoon).toBe(false);
  });

  it("triggers warning for annual subscription in the last 15 days", () => {
    const now = new Date();

    // 12 days remaining -> Warning triggered
    const twelveDaysEnd = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);
    const resWarn = evaluateSubscriptionStatus({
      planId: "annual",
      currentPeriodEnd: twelveDaysEnd,
    });
    expect(resWarn?.isExpiringSoon).toBe(true);
    expect(resWarn?.thresholdDays).toBe(15);

    // 20 days remaining -> No warning
    const twentyDaysEnd = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
    const resOk = evaluateSubscriptionStatus({
      planId: "annual",
      currentPeriodEnd: twentyDaysEnd,
    });
    expect(resOk?.isExpiringSoon).toBe(false);
  });

  it("detects expired subscriptions and sets status to expired for account hold", () => {
    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const res = evaluateSubscriptionStatus({
      planId: "monthly",
      currentPeriodEnd: pastDate,
    });

    expect(res).not.toBeNull();
    expect(res?.isExpired).toBe(true);
    expect(res?.status).toBe("expired");
    expect(res?.daysRemaining).toBeLessThanOrEqual(0);
    expect(res?.warningMessage).toContain("expired");
  });

  it("correctly includes the 3-Month Plan at $55 USD in PRICING_PLANS", () => {
    const quarterly = PRICING_PLANS.quarterly;
    expect(quarterly).toBeDefined();
    expect(quarterly.usdAmount).toBe(55);
    expect(quarterly.durationMonths).toBe(3);
    expect(quarterly.discountBadge).toBe("Save $5 (3 Months)");
  });
});
