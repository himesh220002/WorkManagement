import { describe, it, expect, vi } from "vitest";
import mongoose from "mongoose";
import { getTenantDbName, getTenantModels } from "@/lib/tenantDb";

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(true),
}));

describe("Database-per-Tenant Architecture", () => {
  it("generates correct isolated database names per company", () => {
    expect(getTenantDbName("ORGTTV")).toBe("projectManageDB_ORGTTV");
    expect(getTenantDbName("acme-01")).toBe("projectManageDB_ACME_01");
    expect(getTenantDbName("cyphertech")).toBe("projectManageDB_CYPHERTECH");
  });

  it("exposes all 20 isolated collection models for a tenant", async () => {
    const fakeModels: Record<string, any> = {};
    const fakeConnection = {
      name: "projectManageDB_TESTORG",
      models: fakeModels,
      model: vi.fn((name: string, schema: any) => {
        const m = { modelName: name, schema };
        fakeModels[name] = m;
        return m;
      }),
    };

    vi.spyOn(mongoose.connection, "useDb").mockReturnValue(fakeConnection as any);

    const models = await getTenantModels("TESTORG");

    expect(models.User).toBeDefined();
    expect(models.Team).toBeDefined();
    expect(models.Project).toBeDefined();
    expect(models.Pipeline).toBeDefined();
    expect(models.Task).toBeDefined();
    expect(models.TaskNode).toBeDefined();
    expect(models.Deal).toBeDefined();
    expect(models.Lead).toBeDefined();
    expect(models.Campaign).toBeDefined();
    expect(models.Cycle).toBeDefined();
    expect(models.Goal).toBeDefined();
    expect(models.DailyGoal).toBeDefined();
    expect(models.Target).toBeDefined();
    expect(models.Assignment).toBeDefined();
    expect(models.ActivityLog).toBeDefined();
    expect(models.StatusSnapshot).toBeDefined();
    expect(models.ResourceAllocation).toBeDefined();
    expect(models.CustomerFeedback).toBeDefined();
    expect(models.List).toBeDefined();
    expect(models.Item).toBeDefined();
  });
});
