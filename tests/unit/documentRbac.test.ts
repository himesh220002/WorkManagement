import { describe, it, expect } from "vitest";
import { canViewDocument, canUploadDocument } from "@/server/auth/documentRbac";
import { buildS3Key } from "@/lib/s3";

describe("Document Management RBAC & S3 Storage Isolation", () => {
  const employeeSession = { userId: "emp_101", role: "employee" as const, companyId: "comp_1" };
  const managerSession = { userId: "mgr_202", role: "manager" as const, companyId: "comp_1" };
  const ownerSession = { userId: "owner_303", role: "owner" as const, companyId: "comp_1" };
  const superuserSession = { userId: "super_404", role: "superuser" as const };

  describe("1. EMPLOYEE Category Access", () => {
    it("allows employee to view and upload their own onboarding documents", () => {
      const viewCheck = canViewDocument(employeeSession, {
        category: "EMPLOYEE",
        entityId: "emp_101",
      });
      expect(viewCheck.allowed).toBe(true);

      const uploadCheck = canUploadDocument(employeeSession, "EMPLOYEE", "emp_101");
      expect(uploadCheck.allowed).toBe(true);
    });

    it("prevents employee from viewing another colleague's documents", () => {
      const viewCheck = canViewDocument(employeeSession, {
        category: "EMPLOYEE",
        entityId: "emp_999",
      });
      expect(viewCheck.allowed).toBe(false);
      expect(viewCheck.reason).toContain("Employees can only access their own personnel documents");
    });

    it("allows Manager, Owner, and Superuser to read employee records", () => {
      expect(canViewDocument(managerSession, { category: "EMPLOYEE", entityId: "emp_101" }).allowed).toBe(true);
      expect(canViewDocument(ownerSession, { category: "EMPLOYEE", entityId: "emp_101" }).allowed).toBe(true);
      expect(canViewDocument(superuserSession, { category: "EMPLOYEE", entityId: "emp_101" }).allowed).toBe(true);
    });
  });

  describe("2. PROJECT Category Access", () => {
    it("allows employee to view deliverables for assigned projects", () => {
      const check = canViewDocument(employeeSession, {
        category: "PROJECT",
        entityId: "proj_alpha",
        assignedProjectMemberIds: ["emp_101", "emp_102"],
      });
      expect(check.allowed).toBe(true);
    });

    it("prevents employee from viewing deliverables of unassigned projects", () => {
      const check = canViewDocument(employeeSession, {
        category: "PROJECT",
        entityId: "proj_secret",
        assignedProjectMemberIds: ["emp_999"],
      });
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain("Employees can only view documents for assigned projects");
    });

    it("grants Manager, Owner, and Superuser full project document access", () => {
      expect(canViewDocument(managerSession, { category: "PROJECT", entityId: "proj_secret" }).allowed).toBe(true);
      expect(canViewDocument(ownerSession, { category: "PROJECT", entityId: "proj_secret" }).allowed).toBe(true);
      expect(canViewDocument(superuserSession, { category: "PROJECT", entityId: "proj_secret" }).allowed).toBe(true);
    });
  });

  describe("3. SALES Category Access", () => {
    it("strictly blocks regular employees from accessing sales pipelines and client quotes", () => {
      const check = canViewDocument(employeeSession, { category: "SALES", entityId: "deal_001" });
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain("Confidential sales decks and contracts are restricted");
    });

    it("allows Manager, Owner, and Superuser to manage sales documents", () => {
      expect(canViewDocument(managerSession, { category: "SALES", entityId: "deal_001" }).allowed).toBe(true);
      expect(canViewDocument(ownerSession, { category: "SALES", entityId: "deal_001" }).allowed).toBe(true);
      expect(canUploadDocument(managerSession, "SALES", "deal_001").allowed).toBe(true);
    });
  });

  describe("4. SALARY_FINANCE Category Privacy & Access", () => {
    it("strictly blocks Managers from viewing financial cashflow sheets or peer salary data", () => {
      const viewCheck = canViewDocument(managerSession, {
        category: "SALARY_FINANCE",
        entityId: "emp_101",
      });
      expect(viewCheck.allowed).toBe(false);
      expect(viewCheck.reason).toContain("Salary and financial records are restricted from management roles");

      const uploadCheck = canUploadDocument(managerSession, "SALARY_FINANCE");
      expect(uploadCheck.allowed).toBe(false);
    });

    it("allows employee to view only their own personal salary slips", () => {
      const ownCheck = canViewDocument(employeeSession, {
        category: "SALARY_FINANCE",
        entityId: "emp_101",
      });
      expect(ownCheck.allowed).toBe(true);

      const otherCheck = canViewDocument(employeeSession, {
        category: "SALARY_FINANCE",
        entityId: "emp_999",
      });
      expect(otherCheck.allowed).toBe(false);
    });

    it("allows Owner and Superuser full authority over salary and balance sheets", () => {
      expect(canViewDocument(ownerSession, { category: "SALARY_FINANCE" }).allowed).toBe(true);
      expect(canUploadDocument(ownerSession, "SALARY_FINANCE").allowed).toBe(true);
      expect(canViewDocument(superuserSession, { category: "SALARY_FINANCE" }).allowed).toBe(true);
      expect(canUploadDocument(superuserSession, "SALARY_FINANCE").allowed).toBe(true);
    });
  });

  describe("5. S3 Bucket Folder Path Generation", () => {
    it("generates structured path layout matching enterprise S3 specification", () => {
      const empKey = buildS3Key("comp_123", "EMPLOYEE", "user_456", "resume.pdf");
      expect(empKey).toMatch(/^comp_123\/employees\/user_456\/\d+_resume\.pdf$/);

      const projKey = buildS3Key("comp_123", "PROJECT", "proj_789", "spec.pdf");
      expect(projKey).toMatch(/^comp_123\/projects\/proj_789\/\d+_spec\.pdf$/);

      const salesKey = buildS3Key("comp_123", "SALES", "client_999", "proposal.docx");
      expect(salesKey).toMatch(/^comp_123\/sales\/client_999\/\d+_proposal\.docx$/);

      const finKey = buildS3Key("comp_123", "SALARY_FINANCE", null, "march_payroll.xlsx");
      const currentYear = new Date().getFullYear();
      expect(finKey).toMatch(new RegExp(`^comp_123\\/finance\\/${currentYear}\\/\\d+_march_payroll\\.xlsx$`));
    });
  });
});
