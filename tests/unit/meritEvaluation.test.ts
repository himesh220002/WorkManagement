import { describe, it, expect } from "vitest";
import {
  calculateMeritEvaluation,
  getPromotionBadgeInfo,
} from "@/utils/meritEvaluation";

describe("Merit-Based Automatic Progression System", () => {
  it("calculates accurate merit score for high-performing staff member", () => {
    // 60 days ago
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const evaluation = calculateMeritEvaluation({
      rank: "1",
      joinedDate: sixtyDaysAgo,
      performanceScore: 92,
      completedProjectsCount: 3,
      currentProjectsCount: 2,
      relevancyScore: 95,
      supervisorRating: 4.8,
      teamLeadRating: 4.9,
      remarks: "Exceeds expectations across deliverables.",
    });

    expect(evaluation.currentRank).toBe(1);
    expect(evaluation.nextRank).toBe(2);
    expect(evaluation.workingDays).toBeGreaterThanOrEqual(59);
    expect(evaluation.tenureSatisfied).toBe(true);
    expect(evaluation.overallMeritScore).toBeGreaterThanOrEqual(75);
    expect(evaluation.isPromotionReady).toBe(true);
    expect(evaluation.readinessStatus).toBe("Promotion Ready: Merit Eligible");

    const badge = getPromotionBadgeInfo(evaluation);
    expect(badge.statusType).toBe("ready");
    expect(badge.shortLabel).toContain("Ready for Rank 2");
  });

  it("identifies unfulfilled tenure for newly joined high performer", () => {
    // 10 days ago (requires 45 days for Rank 1 -> 2)
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const evaluation = calculateMeritEvaluation({
      rank: "1",
      joinedDate: tenDaysAgo,
      performanceScore: 95,
      completedProjectsCount: 1,
      currentProjectsCount: 1,
      relevancyScore: 90,
      supervisorRating: 4.5,
      teamLeadRating: 4.5,
    });

    expect(evaluation.tenureSatisfied).toBe(false);
    expect(evaluation.isPromotionReady).toBe(false);
    expect(evaluation.actionableFeedback.some((f) => f.includes("Tenure milestone"))).toBe(true);
  });

  it("handles Rank 5 Principal ceiling correctly", () => {
    const evaluation = calculateMeritEvaluation({
      rank: "5",
      joinedDate: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(),
      performanceScore: 98,
      completedProjectsCount: 10,
      currentProjectsCount: 2,
      relevancyScore: 100,
      supervisorRating: 5.0,
      teamLeadRating: 5.0,
    });

    expect(evaluation.currentRank).toBe(5);
    expect(evaluation.nextRank).toBeNull();
    expect(evaluation.readinessStatus).toBe("Max Seniority (Principal)");
    expect(evaluation.isPromotionReady).toBe(false);

    const badge = getPromotionBadgeInfo(evaluation);
    expect(badge.statusType).toBe("principal");
    expect(badge.shortLabel).toBe("Principal Tier");
  });

  it("provides objective improvement recommendations without political subjectivity", () => {
    const evaluation = calculateMeritEvaluation({
      rank: "2",
      joinedDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
      performanceScore: 70, // low execution
      completedProjectsCount: 0, // missing projects
      currentProjectsCount: 1,
      relevancyScore: 75,
      supervisorRating: 3.5,
      teamLeadRating: 3.6,
    });

    expect(evaluation.isPromotionReady).toBe(false);
    expect(evaluation.actionableFeedback.length).toBeGreaterThan(0);
    // Objective guidance given
    expect(
      evaluation.actionableFeedback.some(
        (f) => f.includes("Project delivery") || f.includes("Execution index") || f.includes("Sprint reviews")
      )
    ).toBe(true);
  });
});
