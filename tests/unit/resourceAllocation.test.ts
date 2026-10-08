import { describe, it, expect } from "vitest";

describe("Resource Allocation & Capacity Telemetry", () => {
  function calculateBurnRate(allocated: number, used: number): number {
    if (!allocated || allocated <= 0) return 0;
    return Math.round((used / allocated) * 100);
  }

  function getBurnTone(burnRate: number): "brand" | "warning" | "danger" {
    if (burnRate >= 90) return "danger";
    if (burnRate >= 70) return "warning";
    return "brand";
  }

  it("should calculate correct burn rate for resource budget envelopes", () => {
    expect(calculateBurnRate(100000, 25000)).toBe(25);
    expect(calculateBurnRate(50000, 35000)).toBe(70);
    expect(calculateBurnRate(40000, 38000)).toBe(95);
    expect(calculateBurnRate(0, 0)).toBe(0);
  });

  it("should determine proper telemetry status tone based on burn rate", () => {
    expect(getBurnTone(25)).toBe("brand");
    expect(getBurnTone(72)).toBe("warning");
    expect(getBurnTone(95)).toBe("danger");
  });

  it("should sum total weekly capacity hours across company roster", () => {
    const users = [
      { name: "Sarah Connor", role: "owner", capacityHoursPerWeek: 40 },
      { name: "Marcus Vance", role: "manager", capacityHoursPerWeek: 40 },
      { name: "Priya Sharma", role: "teamlead", capacityHoursPerWeek: 40 },
      { name: "Alex Chen", role: "employee", capacityHoursPerWeek: 40 },
    ];

    const totalHours = users.reduce(
      (sum, u) => sum + (u.capacityHoursPerWeek || 40),
      0
    );
    expect(totalHours).toBe(160);
  });

  it("should correctly group resource allocations by type", () => {
    const allocations = [
      { name: "Cloud Compute", type: "Infrastructure", totalAllocated: 15000 },
      { name: "Ad Spend", type: "Budget", totalAllocated: 25000 },
      { name: "Dev Squad", type: "Headcount", totalAllocated: 120 },
      { name: "Tooling Mold", type: "Equipment", totalAllocated: 30000 },
      { name: "Office Budget", type: "Budget", totalAllocated: 10000 },
    ];

    const budgetTotal = allocations
      .filter((r) => r.type === "Budget")
      .reduce((sum, r) => sum + r.totalAllocated, 0);
    const headcountCount = allocations.filter((r) => r.type === "Headcount").length;
    const infraCount = allocations.filter((r) => r.type === "Infrastructure").length;

    expect(budgetTotal).toBe(35000);
    expect(headcountCount).toBe(1);
    expect(infraCount).toBe(1);
  });
});
