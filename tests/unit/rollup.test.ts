import { describe, it, expect } from "vitest";
import {
  computeHealth,
  computeExpectedProgress,
  computeTaskStats,
  computeCompanyRollup,
} from "@/utils/rollup";
import { HealthStatus } from "@/models/enums";

describe("Rollup & Health Math Engine", () => {
  it("calculates expected progress linearly over a date range", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-01-11T00:00:00Z"); // 10 days
    const mid = new Date("2026-01-06T00:00:00Z"); // 5 days in (50%)

    expect(computeExpectedProgress({ startDate: start, endDate: end }, mid)).toBe(50);
    expect(computeExpectedProgress({ startDate: start, endDate: end }, start)).toBe(0);
    expect(computeExpectedProgress({ startDate: start, endDate: end }, end)).toBe(100);
  });

  it("evaluates health based on progress delta rules", () => {
    // Expected 50, Actual 50 -> On Track
    expect(computeHealth(50, 50, 0)).toBe(HealthStatus.OnTrack);

    // Expected 50, Actual 44 (diff -6) -> At Risk
    expect(computeHealth(44, 50, 0)).toBe(HealthStatus.AtRisk);

    // Expected 50, Actual 34 (diff -16) -> Behind
    expect(computeHealth(34, 50, 0)).toBe(HealthStatus.Behind);

    // Blocked tasks > 20% forces At Risk even when progress is 100%
    expect(computeHealth(100, 50, 0.25)).toBe(HealthStatus.AtRisk);
  });

  it("computes task stats and progress ratio correctly", () => {
    const tasks = [
      { status: "Done", estimatedHours: 4, actualHours: 4 },
      { status: "Done", estimatedHours: 6, actualHours: 5 },
      { status: "In Progress", estimatedHours: 8, actualHours: 2 },
      { status: "Blocked", estimatedHours: 2, actualHours: 1 },
    ];

    const stats = computeTaskStats(tasks);
    expect(stats.total).toBe(4);
    expect(stats.completed).toBe(2);
    expect(stats.inProgress).toBe(1);
    expect(stats.blocked).toBe(1);
    expect(stats.progressPercent).toBe(50);
    expect(stats.blockedRatio).toBe(0.25);
    expect(stats.totalEstimatedHours).toBe(20);
    expect(stats.totalActualHours).toBe(12);
  });

  it("rolls up company health from projects", () => {
    const projects = [
      { health: HealthStatus.OnTrack, status: "Active" },
      { health: HealthStatus.OnTrack, status: "Active" },
      { health: HealthStatus.Behind, status: "Active" },
    ];

    const rollup = computeCompanyRollup(projects);
    expect(rollup.totalProjects).toBe(3);
    expect(rollup.onTrack).toBe(2);
    expect(rollup.behind).toBe(1);
    expect(rollup.overallStatus).toBe(HealthStatus.Behind);
  });
});
