import { describe, it, expect, vi } from "vitest";
import { signToken, verifyToken } from "@/server/auth/jwt";
import {
  restrictTo,
  enforceTenantBoundary,
  buildTenantFilter,
  AuthenticatedRequest,
} from "@/server/middleware/auth";
import { ROLE_HIERARCHY } from "@/models/enums";

describe("Multi-Tenant SaaS Architecture & RBAC Security Suite", () => {
  describe("1. JWT Token Engine with Tenant Claims", () => {
    it("signs and verifies JWT with userId, companyId, and role", () => {
      const payload = {
        userId: "user_12345",
        companyId: "company_67890",
        role: "owner",
        email: "founder@acme.corp",
        name: "Sarah Connor",
      };

      const token = signToken(payload);
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);

      const decoded = verifyToken(token);
      expect(decoded.userId).toBe("user_12345");
      expect(decoded.companyId).toBe("company_67890");
      expect(decoded.role).toBe("owner");
      expect(decoded.email).toBe("founder@acme.corp");
    });

    it("supports superuser global payload with null companyId", () => {
      const token = signToken({
        userId: "dev_root_1",
        companyId: null,
        role: "superuser",
        email: "himesh.dev@taskflow.internal",
        name: "Lead Developer Superuser",
      });

      const decoded = verifyToken(token);
      expect(decoded.role).toBe("superuser");
      expect(decoded.companyId).toBeNull();
    });
  });

  describe("2. Hierarchical RBAC Authorization (restrictTo)", () => {
    it("allows superuser to bypass all role restrictions globally", () => {
      const req: AuthenticatedRequest = {
        user: {
          userId: "dev_1",
          companyId: null,
          role: "superuser",
          email: "dev@internal",
          name: "Dev",
        },
      } as any;

      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = restrictTo("owner");
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("allows owner on owner-restricted routes", () => {
      const req: AuthenticatedRequest = {
        user: {
          userId: "owner_1",
          companyId: "comp_1",
          role: "owner",
          email: "owner@acme.corp",
          name: "Owner",
        },
      } as any;

      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      restrictTo("owner", "manager")(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("rejects employee from manager-only routes with 403 Forbidden", () => {
      const req: AuthenticatedRequest = {
        user: {
          userId: "emp_1",
          companyId: "comp_1",
          role: "employee",
          email: "emp@acme.corp",
          name: "Employee",
        },
      } as any;

      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      restrictTo("owner", "manager")(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Forbidden",
        })
      );
    });

    it("validates role hierarchy ordering correctly", () => {
      expect(ROLE_HIERARCHY["superuser"]).toBeGreaterThan(ROLE_HIERARCHY["owner"]);
      expect(ROLE_HIERARCHY["owner"]).toBeGreaterThan(ROLE_HIERARCHY["manager"]);
      expect(ROLE_HIERARCHY["manager"]).toBeGreaterThan(ROLE_HIERARCHY["teamlead"]);
      expect(ROLE_HIERARCHY["teamlead"]).toBeGreaterThan(ROLE_HIERARCHY["employee"]);
    });
  });

  describe("3. Multi-Tenant Data Isolation (enforceTenantBoundary)", () => {
    it("blocks cross-tenant tampering when user tries to access another companyId", () => {
      const req: AuthenticatedRequest = {
        user: {
          userId: "user_a",
          companyId: "company_alpha",
          role: "manager",
          email: "manager@alpha.com",
          name: "Alpha Manager",
        },
        params: { companyId: "company_beta" }, // Malicious attempt to query Beta's data
        query: {},
        body: {},
      } as any;

      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      enforceTenantBoundary(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Tenant Boundary Violation",
        })
      );
    });

    it("enforces tenant boundary on query and body for authorized requests", () => {
      const req: AuthenticatedRequest = {
        user: {
          userId: "user_a",
          companyId: "company_alpha",
          role: "employee",
          email: "dev@alpha.com",
          name: "Alpha Dev",
        },
        params: {},
        query: { status: "Active" },
        body: { title: "New Task" },
      } as any;

      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      enforceTenantBoundary(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.companyId).toBe("company_alpha");
      expect(req.body.companyId).toBe("company_alpha");
      expect(req.tenantCompanyId).toBe("company_alpha");
    });

    it("allows superuser to bypass tenant boundary and target any company", () => {
      const req: AuthenticatedRequest = {
        user: {
          userId: "dev_root",
          companyId: null,
          role: "superuser",
          email: "superuser@dev.com",
          name: "Superuser Developer",
        },
        params: { companyId: "company_gamma" },
        query: {},
        body: {},
      } as any;

      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      enforceTenantBoundary(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.tenantCompanyId).toBe("company_gamma");
    });

    it("buildTenantFilter injects companyId for tenant users and leaves clean for superuser", () => {
      const tenantUser = {
        userId: "1",
        companyId: "comp_99",
        role: "owner",
        email: "a@b.com",
        name: "Owner",
      };

      const superUser = {
        userId: "2",
        companyId: null,
        role: "superuser",
        email: "super@dev.com",
        name: "Super",
      };

      const tenantQuery = buildTenantFilter(tenantUser, { category: "Internal" });
      expect(tenantQuery).toEqual({ category: "Internal", companyId: "comp_99" });

      const superQuery = buildTenantFilter(superUser, { category: "Internal" });
      expect(superQuery).toEqual({ category: "Internal" });
    });
  });
});
