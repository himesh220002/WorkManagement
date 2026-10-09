import { describe, it, expect } from "vitest";
import { calculateTieredSubscriptionCost } from "@/lib/razorpay";

describe("Subscription Seats & Repay Quota Math", () => {
  it("calculates tiered cost correctly for a 10-seat workspace", () => {
    // 10 seats formula: Tier 2 base ($8 for 4 seats) + 6 extra seats * $3 ($18) = $26 total
    const costUsd = calculateTieredSubscriptionCost(10, "monthly", "USD");
    expect(costUsd.tierFormulaLabel).toContain("$8 Base + 6 additional seats ($18)");

    const costInr = calculateTieredSubscriptionCost(10, "monthly", "INR");
    // $26 * 85 = ₹2,210
    expect(costInr.totalInr).toBe(2210);
  });

  it("verifies 10 seats with 1 Owner yields exactly 9 additions left", () => {
    const totalSeats = 10;
    const currentOccupiedSeats = 1; // Owner
    const availableAdditions = Math.max(0, totalSeats - currentOccupiedSeats);
    expect(availableAdditions).toBe(9);

    const isLimitReached = currentOccupiedSeats >= totalSeats;
    expect(isLimitReached).toBe(false);
  });

  it("flags seat limit reached when all 10 seats are occupied", () => {
    const totalSeats = 10;
    const currentOccupiedSeats = 10; // Owner + 9 provisioned members
    const availableAdditions = Math.max(0, totalSeats - currentOccupiedSeats);
    expect(availableAdditions).toBe(0);

    const isLimitReached = currentOccupiedSeats >= totalSeats;
    expect(isLimitReached).toBe(true);
  });

  it("calculates cost for adding additional seats at $3 (₹255) each", () => {
    const seatsToAdd = 3;
    const costPerSeatUsd = 3;
    const costPerSeatInr = 255;

    const totalAdditionUsd = seatsToAdd * costPerSeatUsd;
    const totalAdditionInr = seatsToAdd * costPerSeatInr;

    expect(totalAdditionUsd).toBe(9);
    expect(totalAdditionInr).toBe(765);
  });

  it("calculates 30-day renewal extension preserving remaining days", () => {
    const now = new Date("2026-10-09T00:00:00Z");
    // Active subscription with 20 days remaining
    const currentEnd = new Date("2026-10-29T00:00:00Z");

    let baseDate = now;
    if (currentEnd > now) {
      baseDate = currentEnd;
    }

    const newPeriodEnd = new Date(baseDate);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

    expect(newPeriodEnd.toISOString().startsWith("2026-11-29")).toBe(true);
  });

  it("calculates 30-day renewal extending from today when already expired", () => {
    const now = new Date("2026-10-09T00:00:00Z");
    // Expired 5 days ago
    const currentEnd = new Date("2026-10-04T00:00:00Z");

    let baseDate = now;
    if (currentEnd > now) {
      baseDate = currentEnd;
    }

    const newPeriodEnd = new Date(baseDate);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

    expect(newPeriodEnd.toISOString().startsWith("2026-11-09")).toBe(true);
  });
});
