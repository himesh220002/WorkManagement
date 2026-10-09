import { describe, it, expect } from "vitest";
import { SUPPORTED_GEMINI_MODELS, REPORT_CATEGORIES } from "@/lib/aiConfig";
import { generateAnalysis, testGeminiApiKey } from "@/server/ai/geminiClient";
import { generateExecutivePDF } from "@/server/ai/pdfExporter";
import { WorkspaceContextData } from "@/server/ai/contextAggregator";

describe("AI Report Hub & BYOK Gemini Intelligence", () => {
  it("provides all requested Google Gemini latest models", () => {
    const modelIds = SUPPORTED_GEMINI_MODELS.map((m) => m.id);
    expect(modelIds).toContain("gemini-3.7-flash");
    expect(modelIds).toContain("gemini-3.5-flash");
    expect(modelIds).toContain("gemini-3.6-flash");
    expect(modelIds).toContain("gemini-3.8-flash");
    expect(modelIds).toContain("gemini-2.5-flash");
    expect(modelIds).toContain("gemini-2.0-flash");
  });

  it("provides all 8 chooseable AI report & intelligence categories", () => {
    expect(REPORT_CATEGORIES).toHaveLength(8);
    const categoryTypes = REPORT_CATEGORIES.map((c) => c.type);
    expect(categoryTypes).toContain("project");
    expect(categoryTypes).toContain("team");
    expect(categoryTypes).toContain("company");
    expect(categoryTypes).toContain("sales");
    expect(categoryTypes).toContain("revenue");
    expect(categoryTypes).toContain("form");
    expect(categoryTypes).toContain("chart");
    expect(categoryTypes).toContain("estimation");
  });

  const mockContext: WorkspaceContextData = {
    company: {
      name: "Acme Corp",
      plan: "Enterprise",
      userCount: 25,
      currency: "USD",
    },
    projects: {
      total: 1,
      activeCount: 1,
      list: [
        {
          id: "p1",
          name: "Cloud Transformation",
          status: "Active",
          health: "Good",
          category: "Infrastructure",
          budgetUSD: 120000,
          deadline: "2026-11-15",
          agendas: ["Sprint 1"],
          changeRequestsPending: 0,
          memberCount: 6,
        },
      ],
    },
    tasks: {
      total: 14,
      byStatus: { "In Progress": 7, Done: 5, Blocked: 2 },
      byPriority: { Urgent: 2, High: 5, Normal: 7 },
      overdueCount: 3,
      overdueList: [
        { title: "Database Migration", status: "Blocked", priority: "Urgent", dueDate: "2026-10-01", assigneeName: "Dev 1" },
        { title: "Auth RBAC Refactor", status: "In Progress", priority: "High", dueDate: "2026-10-05", assigneeName: "Dev 2" },
      ],
      blockedCount: 2,
      blockedList: [
        { title: "Database Migration", assigneeName: "Dev 1" },
      ],
      assigneeWorkload: { "Sarah Connor": 5, "John Doe": 4 },
    },
    goals: {
      total: 2,
      strategic: [
        { title: "Achieve 99.99% Uptime", targetValue: 100, currentValue: 85, unit: "%" },
        { title: "Deliver Mobile App Beta", targetValue: 100, currentValue: 60, unit: "%" },
      ],
      dailyGoalsSummary: { total: 10, completed: 8, pending: 2 },
    },
    teams: {
      total: 2,
      list: [
        { id: "t1", name: "Platform Engineering", memberCount: 6, lead: "Sarah Connor" },
        { id: "t2", name: "Product Design", memberCount: 4, lead: "John Doe" },
      ],
    },
    sales: {
      dealsCount: 8,
      totalPipelineValue: 142000,
      byStage: { Negotiation: 1, Proposal: 1 },
      wonCount: 2,
      lostCount: 1,
      recentDeals: [
        { title: "FinTech Enterprise Deal", valueUSD: 65000, stage: "Negotiation", probability: 70 },
        { title: "SaaS Scaleup Tier", valueUSD: 24000, stage: "Proposal", probability: 50 },
      ],
    },
    forms: {
      totalForms: 2,
      totalSubmissions: 12,
      recentFeedback: ["Great progress", "Needs UI polish"],
      list: [
        { title: "Project Intake Form", isPublished: true, submissionsCount: 12 },
      ],
    },
  };

  it("generates a comprehensive Project Health Report with health score, deadlines, problems & solutions", async () => {
    const report = await generateAnalysis({
      type: "project",
      scope: "All Projects",
      model: "gemini-3.7-flash",
      tone: "executive",
    }, mockContext);

    expect(report.title).toContain("Project Health");
    expect(report.summary).toBeDefined();
    expect(report.content).toContain("# Executive Summary");
    expect(report.content).toContain("Project Health");
    expect(report.content).toContain("Deadlines & Schedule");
    expect(report.content).toContain("Team Effort & Workload");
    expect(report.content).toContain("Problems & Bottlenecks");
    expect(report.content).toContain("Solutions & Action Plan");

    // Metrics verification
    expect(report.metrics).toBeDefined();
    expect(report.metrics.healthScore).toBeGreaterThanOrEqual(0);
    expect(report.metrics.healthScore).toBeLessThanOrEqual(100);
    expect(["On Track", "At Risk", "Critical"]).toContain(report.metrics.healthStatus);
    expect(report.metrics.deadlinesTotal).toBe(14);
    expect(report.metrics.deadlinesOverdue).toBe(3);
    expect(report.metrics.problemsIdentified).toBeGreaterThanOrEqual(2);
    expect(report.metrics.solutionsProposed).toBeGreaterThanOrEqual(3);
  });

  it("generates a Team Report with velocity, capacity and burnout risk indicators", async () => {
    const report = await generateAnalysis({
      type: "team",
      scope: "All Teams",
      model: "gemini-3.5-flash",
      tone: "balanced",
    }, mockContext);

    expect(report.title).toContain("Team Velocity");
    expect(report.content).toContain("Workload Allocation");
    expect(report.content).toContain("Burnout & Bottlenecks");
    expect(report.metrics.velocityScore).toBeGreaterThanOrEqual(1);
  });

  it("generates a Company Strategic Overview with OKRs and department scaling", async () => {
    const report = await generateAnalysis({
      type: "company",
      scope: "Company-Wide",
      model: "gemini-3.6-flash",
      tone: "executive",
    }, mockContext);

    expect(report.title).toContain("Company Strategic");
    expect(report.content).toContain("Goal & OKR Progress");
    expect(report.content).toContain("Cross-Department Health");
  });

  it("generates a Sales Pipeline Velocity Report with deal pipeline metrics", async () => {
    const report = await generateAnalysis({
      type: "sales",
      scope: "Enterprise Deals",
      model: "gemini-3.7-flash",
      tone: "action-oriented",
    }, mockContext);

    expect(report.title).toContain("Sales Pipeline");
    expect(report.content).toContain("Pipeline Overview");
    expect(report.content).toContain("Win / Loss Velocity");
  });

  it("generates a Financial Revenue Report with cash burn and subscription metrics", async () => {
    const report = await generateAnalysis({
      type: "revenue",
      scope: "Fiscal Q4",
      model: "gemini-3.5-flash",
      tone: "executive",
    }, mockContext);

    expect(report.title).toContain("Revenue");
    expect(report.content).toContain("Subscription & MRR");
  });

  it("generates an AI Form with questions schema ready for 1-click import into Form Builder", async () => {
    const report = await generateAnalysis({
      type: "form",
      scope: "Client Intake Questionnaire",
      model: "gemini-3.8-flash",
      tone: "technical",
    }, mockContext);

    expect(report.title).toContain("Form Schema");
    expect(report.structuredData).toBeDefined();
    expect(Array.isArray(report.structuredData.questions)).toBe(true);
    expect(report.structuredData.questions.length).toBeGreaterThanOrEqual(3);

    // Verify first question structure conforms to IFormQuestion
    const firstQ = report.structuredData.questions[0];
    expect(firstQ.id).toBeDefined();
    expect(firstQ.title).toBeDefined();
    expect(firstQ.type).toBeDefined();
    expect(typeof firstQ.required).toBe("boolean");
  });

  it("generates an AI Chart visualizer dataset with labels, values, and distributions", async () => {
    const report = await generateAnalysis({
      type: "chart",
      scope: "Task Velocity Distribution",
      model: "gemini-3.7-flash",
      tone: "technical",
    }, mockContext);

    expect(report.title).toContain("Visual Analytics");
    expect(report.structuredData).toBeDefined();
    expect(Array.isArray(report.structuredData.chartData)).toBe(true);
    expect(report.structuredData.chartData.length).toBeGreaterThanOrEqual(2);

    const firstItem = report.structuredData.chartData[0];
    expect(firstItem.label).toBeDefined();
    expect(typeof firstItem.value).toBe("number");
  });

  it("generates an AI Project Estimation with story points, hours, headcount, and budget USD", async () => {
    const report = await generateAnalysis({
      type: "estimation",
      scope: "Cloud Infrastructure Sprint",
      model: "gemini-3.7-flash",
      tone: "action-oriented",
    }, mockContext);

    expect(report.title).toContain("Project Planning & Estimation");
    expect(report.metrics.budgetEstimatedUSD).toBeGreaterThan(0);
    expect(report.structuredData).toBeDefined();
    expect(report.structuredData.storyPointsTotal).toBeGreaterThan(0);
    expect(report.structuredData.estimatedHours).toBeGreaterThan(0);
    expect(report.structuredData.teamHeadcount).toBeGreaterThan(0);
    expect(report.structuredData.breakdown).toBeDefined();
  });

  it("exports an executive styled PDF binary starting with %PDF header", async () => {
    const report = await generateAnalysis({
      type: "project",
      scope: "All Projects",
      model: "gemini-3.7-flash",
    }, mockContext);

    const pdfBytes = await generateExecutivePDF({
      title: report.title,
      category: "project",
      model: "gemini-3.7-flash",
      content: report.content,
      metrics: report.metrics,
      createdAt: new Date(),
      companyName: "Acme Corp",
    });

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(500);

    // Verify PDF Magic Bytes: %PDF
    const pdfHeader = String.fromCharCode(...pdfBytes.slice(0, 4));
    expect(pdfHeader).toBe("%PDF");
  });

  it("validates API key format handling", async () => {
    const shortKeyResult = await testGeminiApiKey("short");
    expect(shortKeyResult.success).toBe(false);
    expect(shortKeyResult.message).toContain("too short");
  });
});
