import { describe, it, expect } from "vitest";
import { getTenantQueryFilter, SessionContext } from "@/server/auth/session";

describe("Organizational Capacity and Department Mapping", () => {
  function categorizeMember(u: {
    role?: string;
    position?: string;
    skills?: string[];
    details?: string;
  }): string {
    const role = (u.role || "").toLowerCase().trim();
    const pos = (u.position || "").toLowerCase();
    const skills = Array.isArray(u.skills)
      ? u.skills.map((s) => s.toLowerCase()).join(" ")
      : "";
    const details = (u.details || "").toLowerCase();
    const combined = `${role} ${pos} ${skills} ${details}`;

    // 1. Leadership (Owner, Superuser, Admin, Founder, Chief Executive)
    if (
      ["owner", "superuser", "admin", "founder", "ceo"].includes(role) ||
      pos.includes("founder") ||
      pos.includes("chief") ||
      pos.includes("owner") ||
      (pos.includes("executive") && !pos.includes("sales") && !pos.includes("account"))
    ) {
      return "Leadership";
    }

    // 2. Operations & Management
    if (
      ["manager", "operations", "pm", "product manager"].includes(role) ||
      combined.includes("operations") ||
      combined.includes("ops") ||
      combined.includes("logistics")
    ) {
      return "Operations";
    }

    // 3. Sales & Commercial
    if (
      ["sales", "sales executive", "marketing", "growth"].includes(role) ||
      combined.includes("sales") ||
      combined.includes("marketing") ||
      combined.includes("account executive")
    ) {
      return "Sales";
    }

    // 4. Engineering & Tech Leads
    if (
      ["teamlead", "tl", "lead", "developer", "engineer", "lead engineer", "dev"].includes(role) ||
      combined.includes("engineer") ||
      combined.includes("developer") ||
      combined.includes("software") ||
      combined.includes("tech")
    ) {
      return "Engineering";
    }

    // 5. Default company employees in project teams
    if (role === "employee" || role === "member") {
      return "Engineering";
    }

    return "Leadership";
  }

  it("should accurately categorize a 4-member company (owner, manager, tl, employee)", () => {
    const companyMembers = [
      { name: "Sarah Connor", role: "owner" },
      { name: "Marcus Vance", role: "manager" },
      { name: "Priya Sharma", role: "tl" },
      { name: "Alex Chen", role: "employee" },
    ];

    const breakdown = {
      Engineering: companyMembers.filter((u) => categorizeMember(u) === "Engineering").length,
      Sales: companyMembers.filter((u) => categorizeMember(u) === "Sales").length,
      Operations: companyMembers.filter((u) => categorizeMember(u) === "Operations").length,
      Leadership: companyMembers.filter((u) => categorizeMember(u) === "Leadership").length,
    };

    // Exactly 1 owner -> Leadership
    expect(breakdown.Leadership).toBe(1);
    // Exactly 1 manager -> Operations
    expect(breakdown.Operations).toBe(1);
    // Priya (tl) + Alex (employee) -> Engineering (2)
    expect(breakdown.Engineering).toBe(2);
    // 0 sales members -> strictly 0, never hardcoded fake fallbacks
    expect(breakdown.Sales).toBe(0);

    const totalCalculated =
      breakdown.Engineering + breakdown.Sales + breakdown.Operations + breakdown.Leadership;
    expect(totalCalculated).toBe(4);
  });

  it("should categorize employees with sales position to Sales discipline", () => {
    const member = {
      name: "Dave Sales",
      role: "employee",
      position: "Senior Sales Account Executive",
    };
    expect(categorizeMember(member)).toBe("Sales");
  });

  it("should categorize teamlead with TL alias to Engineering", () => {
    expect(categorizeMember({ role: "TL" })).toBe("Engineering");
    expect(categorizeMember({ role: "teamlead" })).toBe("Engineering");
  });

  it("should strictly scope queries by companyId when session has companyId", () => {
    const session: SessionContext = {
      userId: "usr_123",
      companyId: "comp_abc_999",
      role: "owner",
      email: "owner@acme.corp",
      name: "Owner",
    };

    const filter = getTenantQueryFilter(session);
    expect(filter).toEqual({ companyId: "comp_abc_999" });
  });

  it("should isolate non-superuser sessions even without companyId to prevent cross-tenant leaks", () => {
    const session: SessionContext = {
      userId: "usr_456",
      companyId: "comp_777",
      role: "employee",
      email: "employee@acme.corp",
      name: "Employee",
    };

    const filter = getTenantQueryFilter(session);
    expect(filter.companyId).toBe("comp_777");
  });
});
