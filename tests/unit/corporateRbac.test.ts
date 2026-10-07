import { describe, it, expect } from "vitest";
import {
  canProvisionMemberRole,
  canUpdateMemberRole,
  canAssignProjectStaff,
  canEditProjectAgendasAndTimelines,
  canReviewProjectChangeRequest,
  canArchiveMember,
  canResignMember,
  normalizeRole,
  hasMinimumRole,
} from "@/server/auth/rbac";

describe("Corporate RBAC Permission System", () => {
  describe("Role Normalization & Hierarchy", () => {
    it("correctly maps role aliases to canonical tiers", () => {
      expect(normalizeRole("Developer")).toBe("superuser");
      expect(normalizeRole("Dev")).toBe("superuser");
      expect(normalizeRole("Admin")).toBe("owner");
      expect(normalizeRole("Owner")).toBe("owner");
      expect(normalizeRole("Manager")).toBe("manager");
      expect(normalizeRole("TeamLead")).toBe("teamlead");
      expect(normalizeRole("Lead")).toBe("teamlead");
      expect(normalizeRole("Member")).toBe("employee");
      expect(normalizeRole("Employee")).toBe("employee");
    });

    it("evaluates hierarchy ranks properly", () => {
      expect(hasMinimumRole("owner", "manager")).toBe(true);
      expect(hasMinimumRole("manager", "teamlead")).toBe(true);
      expect(hasMinimumRole("employee", "teamlead")).toBe(false);
      expect(hasMinimumRole("teamlead", "manager")).toBe(false);
    });
  });

  describe("Member Account Provisioning (Logins & Initial Passwords)", () => {
    it("allows Owner to provision managers, team leads, and employees", () => {
      expect(canProvisionMemberRole("owner", "manager").allowed).toBe(true);
      expect(canProvisionMemberRole("owner", "teamlead").allowed).toBe(true);
      expect(canProvisionMemberRole("owner", "employee").allowed).toBe(true);
      expect(canProvisionMemberRole("owner", "superuser").allowed).toBe(false);
    });

    it("allows Manager to provision team leads and employees with login credentials", () => {
      expect(canProvisionMemberRole("manager", "teamlead").allowed).toBe(true);
      expect(canProvisionMemberRole("manager", "employee").allowed).toBe(true);
    });

    it("prevents Manager from provisioning owners, managers, or superusers", () => {
      expect(canProvisionMemberRole("manager", "owner").allowed).toBe(false);
      expect(canProvisionMemberRole("manager", "manager").allowed).toBe(false);
      expect(canProvisionMemberRole("manager", "superuser").allowed).toBe(false);
    });

    it("prohibits Team Leads and Employees from provisioning accounts", () => {
      expect(canProvisionMemberRole("teamlead", "employee").allowed).toBe(false);
      expect(canProvisionMemberRole("employee", "employee").allowed).toBe(false);
    });
  });

  describe("Role & Tag Mutation Guard", () => {
    it("allows Manager to update tags between Team Lead and Employee", () => {
      expect(canUpdateMemberRole("manager", "employee", "teamlead").allowed).toBe(true);
      expect(canUpdateMemberRole("manager", "teamlead", "employee").allowed).toBe(true);
    });

    it("PREVENTS Manager from altering Owner or Superuser tags", () => {
      const ownerCheck = canUpdateMemberRole("manager", "owner", "employee");
      expect(ownerCheck.allowed).toBe(false);
      expect(ownerCheck.reason).toContain("cannot alter the role or tags of the Company Owner");

      const superuserCheck = canUpdateMemberRole("manager", "superuser", "manager");
      expect(superuserCheck.allowed).toBe(false);
    });

    it("PREVENTS Manager from promoting members to Owner or Superuser", () => {
      expect(canUpdateMemberRole("manager", "employee", "owner").allowed).toBe(false);
      expect(canUpdateMemberRole("manager", "teamlead", "superuser").allowed).toBe(false);
    });

    it("prevents Team Leads and Employees from altering anyone's tags", () => {
      expect(canUpdateMemberRole("teamlead", "employee", "teamlead").allowed).toBe(false);
      expect(canUpdateMemberRole("employee", "employee", "teamlead").allowed).toBe(false);
    });

    it("allows Owner to update tags of Managers, Team Leads, and Employees", () => {
      expect(canUpdateMemberRole("owner", "manager", "teamlead").allowed).toBe(true);
      expect(canUpdateMemberRole("owner", "employee", "manager").allowed).toBe(true);
    });
  });

  describe("Project Assignments & Team Lead Designations", () => {
    it("allows Manager, Owner, and Superuser to assign project staff and TL", () => {
      expect(canAssignProjectStaff("manager")).toBe(true);
      expect(canAssignProjectStaff("owner")).toBe(true);
      expect(canAssignProjectStaff("superuser")).toBe(true);
      expect(canAssignProjectStaff("teamlead")).toBe(false);
      expect(canAssignProjectStaff("employee")).toBe(false);
    });
  });

  describe("Project Agendas & Timelines Authority", () => {
    const mockProject = {
      leadId: "tl-user-123",
      ownerId: "mgr-user-456",
      memberIds: ["emp-user-789"],
    };

    it("allows Manager and Owner to edit any project agendas", () => {
      expect(canEditProjectAgendasAndTimelines("manager", "any-id", mockProject).allowed).toBe(true);
      expect(canEditProjectAgendasAndTimelines("owner", "any-id", mockProject).allowed).toBe(true);
    });

    it("allows Team Lead to edit their assigned project agendas", () => {
      const tlCheck = canEditProjectAgendasAndTimelines("teamlead", "tl-user-123", mockProject);
      expect(tlCheck.allowed).toBe(true);
    });

    it("prevents Team Lead from editing UNASSIGNED project agendas", () => {
      const unassignedTl = canEditProjectAgendasAndTimelines("teamlead", "other-tl-999", mockProject);
      expect(unassignedTl.allowed).toBe(false);
    });

    it("prevents Employees from directly altering project agendas", () => {
      const empCheck = canEditProjectAgendasAndTimelines("employee", "emp-user-789", mockProject);
      expect(empCheck.allowed).toBe(false);
      expect(empCheck.reason).toContain("require Team Lead approval");
    });
  });

  describe("Project Change Request Review Authority", () => {
    const mockProject = {
      leadId: "tl-user-123",
      ownerId: "mgr-user-456",
    };

    it("allows assigned Team Lead, Manager, and Owner to review/approve change requests", () => {
      expect(canReviewProjectChangeRequest("teamlead", "tl-user-123", mockProject)).toBe(true);
      expect(canReviewProjectChangeRequest("manager", "any-mgr", mockProject)).toBe(true);
      expect(canReviewProjectChangeRequest("owner", "any-owner", mockProject)).toBe(true);
    });

    it("denies unassigned Team Leads and Employees from approving change requests", () => {
      expect(canReviewProjectChangeRequest("teamlead", "other-tl-999", mockProject)).toBe(false);
      expect(canReviewProjectChangeRequest("employee", "emp-user-789", mockProject)).toBe(false);
    });
  });

  describe("Member Archiving & Resignation Authority", () => {
    it("allows Owner to archive manager, team lead, and employee", () => {
      expect(canArchiveMember("owner", "manager").allowed).toBe(true);
      expect(canArchiveMember("owner", "teamlead").allowed).toBe(true);
      expect(canArchiveMember("owner", "employee").allowed).toBe(true);
      expect(canArchiveMember("owner", "superuser").allowed).toBe(false);
    });

    it("allows Manager to archive team lead and employee, but prevents archiving owner or fellow manager", () => {
      expect(canArchiveMember("manager", "teamlead").allowed).toBe(true);
      expect(canArchiveMember("manager", "employee").allowed).toBe(true);
      expect(canArchiveMember("manager", "owner").allowed).toBe(false);
      expect(canArchiveMember("manager", "manager").allowed).toBe(false);
    });

    it("prevents Team Leads and Employees from archiving members", () => {
      expect(canArchiveMember("teamlead", "employee").allowed).toBe(false);
      expect(canArchiveMember("employee", "employee").allowed).toBe(false);
    });

    it("allows user to submit their own resignation", () => {
      expect(canResignMember("user-123", "user-123").allowed).toBe(true);
      expect(canResignMember("user-123", "other-456").allowed).toBe(false);
    });
  });
});
