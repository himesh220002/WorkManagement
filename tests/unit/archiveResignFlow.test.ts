import { describe, it, expect } from "vitest";
import { canArchiveMember, canResignMember } from "@/server/auth/rbac";
import { calculateMeritEvaluation, getPromotionBadgeInfo } from "@/utils/meritEvaluation";
import { UserRole, UserStatus } from "@/models/enums";

describe("User-Based RBAC Archive & Resign Permissions", () => {
  describe("Archive Authorization", () => {
    it("allows Owner to archive Manager, Team Lead, and Employee", () => {
      expect(canArchiveMember("owner", "manager")).toEqual({ allowed: true });
      expect(canArchiveMember("owner", "teamlead")).toEqual({ allowed: true });
      expect(canArchiveMember("owner", "employee")).toEqual({ allowed: true });
    });

    it("prevents Owner from archiving another Owner", () => {
      const res = canArchiveMember("owner", "owner");
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Cannot archive organization owners");
    });

    it("allows Manager to archive Team Lead and Employee", () => {
      expect(canArchiveMember("manager", "teamlead")).toEqual({ allowed: true });
      expect(canArchiveMember("manager", "employee")).toEqual({ allowed: true });
    });

    it("STRICTLY prevents Manager from archiving Owner or fellow Manager", () => {
      const resOwner = canArchiveMember("manager", "owner");
      expect(resOwner.allowed).toBe(false);
      expect(resOwner.reason).toContain("Managers cannot archive organization owners");

      const resManager = canArchiveMember("manager", "manager");
      expect(resManager.allowed).toBe(false);
      expect(resManager.reason).toContain("Managers cannot archive other managers");
    });

    it("prevents Team Lead and Employee from archiving anyone", () => {
      expect(canArchiveMember("teamlead", "employee").allowed).toBe(false);
      expect(canArchiveMember("employee", "employee").allowed).toBe(false);
      expect(canArchiveMember("employee", "manager").allowed).toBe(false);
    });

    it("allows Superuser full authority", () => {
      expect(canArchiveMember("superuser", "owner").allowed).toBe(true);
      expect(canArchiveMember("superuser", "manager").allowed).toBe(true);
      expect(canArchiveMember("superuser", "employee").allowed).toBe(true);
    });
  });

  describe("Resign Authorization", () => {
    it("allows Employee to resign own account", () => {
      const res = canResignMember("user123", "user123", "employee");
      expect(res.allowed).toBe(true);
    });

    it("prevents Employee from resigning other members", () => {
      const res = canResignMember("user123", "user456", "employee");
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Resignation can only be submitted by the member themselves");
    });

    it("allows Owner or Superuser administrative resignation processing", () => {
      expect(canResignMember("ownerId", "user456", "owner").allowed).toBe(true);
      expect(canResignMember("superId", "user456", "superuser").allowed).toBe(true);
    });
  });

  describe("New Hire Unrated / Zero-Rating Merit Evaluation", () => {
    it("does not inflate ratings or merit for freshly onboarded employee", () => {
      const evaluation = calculateMeritEvaluation({
        rank: "1",
        joinedDate: new Date().toISOString(),
        performanceScore: 0,
        relevancyScore: 0,
        supervisorRating: 0,
        teamLeadRating: 0,
        completedProjectsCount: 0,
        currentProjectsCount: 1,
      });

      expect(evaluation.performanceScore).toBe(0);
      expect(evaluation.performanceComponent).toBe(0);
      expect(evaluation.supervisorRating).toBe(0);
      expect(evaluation.teamLeadRating).toBe(0);
      expect(evaluation.ratingsComponent).toBe(0);
      expect(evaluation.readinessStatus).toBe("Newly Onboarded: Pending Review");
      expect(evaluation.isPromotionReady).toBe(false);

      const badge = getPromotionBadgeInfo(evaluation);
      expect(badge.statusType).toBe("pending");
      expect(badge.shortLabel).toBe("Pending Review");
      expect(badge.label).toContain("Newly Onboarded");
    });
  });
});
