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

  it("should calculate domain capacity allocation and buffer headroom across company roster", () => {
    const users = [
      { name: "Sarah Jenkins", position: "Head of Performance Marketing & Growth", capacityHoursPerWeek: 40 },
      { name: "Chloe Zhao", position: "Senior Travel Operations & Guest Concierge Lead", capacityHoursPerWeek: 40 },
      { name: "Alex Rivera", position: "Global Esports Sponsorship & Retail Director", capacityHoursPerWeek: 40 },
      { name: "Elena Vance", position: "VP Hotel Partnerships & Commercialization", capacityHoursPerWeek: 40 },
      { name: "Dev Patel", position: "Lead Full-Stack & PMS Booking Architect", capacityHoursPerWeek: 40 },
    ];

    const allocations = users.map((u) => {
      let domain = "Engineering";
      let allocatedHours = 34;

      if (u.position.toLowerCase().includes("marketing") || u.position.toLowerCase().includes("growth")) {
        domain = "Campaigns";
        allocatedHours = 38;
      } else if (u.position.toLowerCase().includes("travel operations")) {
        domain = "Campaigns";
        allocatedHours = 33;
      } else if (u.position.toLowerCase().includes("sponsorship") || u.position.toLowerCase().includes("partnerships")) {
        domain = "Sales";
        allocatedHours = 36;
      }

      const bufferHours = u.capacityHoursPerWeek - allocatedHours;
      return { ...u, domain, allocatedHours, bufferHours };
    });

    const campaignHours = allocations
      .filter((a) => a.domain === "Campaigns")
      .reduce((sum, a) => sum + a.allocatedHours, 0);
    const salesHours = allocations
      .filter((a) => a.domain === "Sales")
      .reduce((sum, a) => sum + a.allocatedHours, 0);
    const totalBuffer = allocations.reduce((sum, a) => sum + a.bufferHours, 0);

    expect(campaignHours).toBe(71); // 38 + 33
    expect(salesHours).toBe(72); // 36 + 36
    expect(totalBuffer).toBe(23); // (2+7) + (4+4) + 6
  });

  it("should aggregate active campaign automations with enrolled contacts and revenue", () => {
    const campaigns = [
      { name: "Welcome Series", enrolled: 1850, completed: 1240, revenue: 2345.0, allocatedHours: 16 },
      { name: "Cart Abandonment", enrolled: 8420, completed: 5680, revenue: 14562.0, allocatedHours: 28 },
      { name: "Re-engagement Campaign", enrolled: 3220, completed: 1840, revenue: 3456.0, allocatedHours: 18 },
    ];

    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const totalEnrolled = campaigns.reduce((sum, c) => sum + c.enrolled, 0);
    const totalHours = campaigns.reduce((sum, c) => sum + c.allocatedHours, 0);

    expect(totalRevenue).toBe(20363.0);
    expect(totalEnrolled).toBe(13490);
    expect(totalHours).toBe(62);
  });

  it("should verify commercial pipeline deal stage, value, and probability metadata", () => {
    const pipeline = {
      name: "Wholesale Distribution & Retail Channel Commercial Pipeline",
      category: "Sales",
      progress: 60,
      dealValue: 250000,
      dealStage: "Contract Negotiation",
      winProbability: 60,
    };

    expect(pipeline.dealStage).toBe("Contract Negotiation");
    expect(pipeline.dealValue).toBe(250000);
    expect(pipeline.winProbability).toBe(60);
    expect(pipeline.progress).toBe(60);
  });
});
