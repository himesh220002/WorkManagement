import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { getTenantQueryFilter, SessionContext } from "@/server/auth/session";

describe("Disposal of Showcase Mode & Enforcement of Default Login Redirect", () => {
  const baseUrl = "https://taskpms.cyphertech.online";

  describe("1. Unauthenticated Dashboard Access Redirects to Login", () => {
    it("redirects unauthenticated /exec/dashboard to /auth/login", () => {
      const req = new NextRequest(new URL(`${baseUrl}/exec/dashboard`));
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(`${baseUrl}/auth/login`);
    });

    it("redirects unauthenticated /projects to /auth/login", () => {
      const req = new NextRequest(new URL(`${baseUrl}/projects`));
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(`${baseUrl}/auth/login`);
    });

    it("redirects unauthenticated /growth/crm to /auth/login", () => {
      const req = new NextRequest(new URL(`${baseUrl}/growth/crm`));
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(`${baseUrl}/auth/login`);
    });

    it("redirects unauthenticated /revenue to /auth/login", () => {
      const req = new NextRequest(new URL(`${baseUrl}/revenue`));
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(`${baseUrl}/auth/login`);
    });

    it("redirects unauthenticated /teams to /auth/login", () => {
      const req = new NextRequest(new URL(`${baseUrl}/teams`));
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(`${baseUrl}/auth/login`);
    });

    it("redirects unauthenticated tenant route /ORGTTV/exec/dashboard to /ORGTTV/auth/login", () => {
      const req = new NextRequest(new URL(`${baseUrl}/ORGTTV/exec/dashboard`));
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(`${baseUrl}/ORGTTV/auth/login`);
    });

    it("redirects unauthenticated tenant root /CYPHERTECH to /CYPHERTECH/auth/login", () => {
      const req = new NextRequest(new URL(`${baseUrl}/CYPHERTECH`));
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(`${baseUrl}/CYPHERTECH/auth/login`);
    });
  });

  describe("2. Public Marketing and Auth Routes Remain Open", () => {
    it("allows public root landing page / to pass through", () => {
      const req = new NextRequest(new URL(`${baseUrl}/`));
      const res = middleware(req);

      // Pass-through NextResponse.next() has no redirect location
      expect(res.headers.get("location")).toBeNull();
      expect(res.status).toBe(200);
    });

    it("allows public /about to pass through", () => {
      const req = new NextRequest(new URL(`${baseUrl}/about`));
      const res = middleware(req);

      expect(res.headers.get("location")).toBeNull();
      expect(res.status).toBe(200);
    });

    it("allows public /terms to pass through", () => {
      const req = new NextRequest(new URL(`${baseUrl}/terms`));
      const res = middleware(req);

      expect(res.headers.get("location")).toBeNull();
      expect(res.status).toBe(200);
    });

    it("allows public /privacy to pass through", () => {
      const req = new NextRequest(new URL(`${baseUrl}/privacy`));
      const res = middleware(req);

      expect(res.headers.get("location")).toBeNull();
      expect(res.status).toBe(200);
    });

    it("allows public /contact to pass through", () => {
      const req = new NextRequest(new URL(`${baseUrl}/contact`));
      const res = middleware(req);

      expect(res.headers.get("location")).toBeNull();
      expect(res.status).toBe(200);
    });

    it("allows /auth/login to pass through without redirect loops", () => {
      const req = new NextRequest(new URL(`${baseUrl}/auth/login`));
      const res = middleware(req);

      expect(res.headers.get("location")).toBeNull();
      expect(res.status).toBe(200);
    });

    it("allows /auth/signup to pass through", () => {
      const req = new NextRequest(new URL(`${baseUrl}/auth/signup`));
      const res = middleware(req);

      expect(res.headers.get("location")).toBeNull();
      expect(res.status).toBe(200);
    });

    it("allows dedicated tenant login /:orgId/auth/login to pass through", () => {
      const req = new NextRequest(new URL(`${baseUrl}/ORGTTV/auth/login`));
      const res = middleware(req);

      expect(res.headers.get("location")).toBeNull();
      expect(res.status).toBe(200);
    });
  });

  describe("3. Unauthenticated Session & Database Isolation Lock", () => {
    it("locks unauthenticated queries with impossible boundary filter", () => {
      const unauthSession: SessionContext = {
        userId: undefined,
        companyId: undefined,
        companyCode: undefined,
        role: "viewer",
        email: "",
        name: "Guest",
        isGuest: true,
      };

      const filter = getTenantQueryFilter(unauthSession);
      expect(filter).toEqual({ companyId: "unauthenticated_boundary_lock" });
    });

    it("isolates tenant queries strictly to the active companyId when authenticated", () => {
      const authSession: SessionContext = {
        userId: "user_789",
        companyId: "comp_123",
        companyCode: "ORGTTV",
        role: "employee",
        email: "emp@acme.corp",
        name: "Dev",
        isGuest: false,
      };

      const filter = getTenantQueryFilter(authSession);
      expect(filter).toEqual({ companyId: "comp_123" });
    });
  });
});
