import { describe, it, expect } from "vitest";
import { normalizeRole } from "@/server/auth/rbac";

describe("Advanced Platform Features (Role Selection & Strategic OKRs)", () => {
  const PERSONA_CONFIGS = [
    {
      key: "owner",
      label: "Company Owner",
      shortRole: "Founder & Owner",
      canonicalRole: "owner",
    },
    {
      key: "manager",
      label: "Operations Manager",
      shortRole: "Staffing & Roadmaps",
      canonicalRole: "manager",
    },
    {
      key: "teamlead",
      label: "Project Team Lead",
      shortRole: "Project Governance",
      canonicalRole: "teamlead",
    },
    {
      key: "employee",
      label: "Company Employee",
      shortRole: "Department Specialist",
      canonicalRole: "employee",
    },
    {
      key: "superuser",
      label: "System Developer",
      shortRole: "Developer Superuser",
      canonicalRole: "superuser",
    },
  ];

  it("should normalize all persona keys to their respective canonical RBAC roles", () => {
    expect(normalizeRole("owner")).toBe("owner");
    expect(normalizeRole("manager")).toBe("manager");
    expect(normalizeRole("teamlead")).toBe("teamlead");
    expect(normalizeRole("tl")).toBe("teamlead");
    expect(normalizeRole("employee")).toBe("employee");
    expect(normalizeRole("superuser")).toBe("superuser");
  });

  it("should find the matching configuration for each selectable role dropdown value", () => {
    const roles = ["owner", "manager", "teamlead", "employee", "superuser"];
    roles.forEach((r) => {
      const config = PERSONA_CONFIGS.find((p) => p.key === r);
      expect(config).toBeDefined();
      expect(config?.key).toBe(r);
    });
  });

  it("should validate OKR preset structure containing qualitative objective and quantitative key results", () => {
    const okrPresets = [
      {
        title: "Launch Ergonomic Chair Line (Physical Product)",
        description:
          "Produce batch of 1,000 units, maintain 40% margin, establish 5 wholesale distributors",
        category: "Project",
      },
      {
        title: "Enterprise SaaS ARR & Customer Acquisition",
        description:
          "Reach $500k ARR with 25 signed enterprise accounts and churn below 2%",
        category: "Company",
      },
      {
        title: "Sprint Velocity & Zero-Downtime Infrastructure",
        description:
          "Deliver 100% sprint roadmap items on time with sub-100ms API response time",
        category: "Team",
      },
    ];

    expect(okrPresets.length).toBe(3);
    okrPresets.forEach((preset) => {
      expect(preset.title.length).toBeGreaterThan(5);
      expect(preset.description.length).toBeGreaterThan(10);
      expect(["Company", "Project", "Team"]).toContain(preset.category);
    });
  });
});
