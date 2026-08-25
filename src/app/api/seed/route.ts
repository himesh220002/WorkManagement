import connectToDatabase from "@/lib/mongodb";
import { 
  Project, Team, User, Goal, Target, 
  Deal, Campaign, ResourceAllocation, 
  Item, List, Pipeline, TaskNode, Cycle
} from "@/models";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDatabase();

    // Clear existing
    await Project.deleteMany({});
    await Team.deleteMany({});
    await User.deleteMany({});
    await Goal.deleteMany({});
    await Target.deleteMany({});
    await Deal.deleteMany({});
    await Campaign.deleteMany({});
    await ResourceAllocation.deleteMany({});
    await Item.deleteMany({});
    await List.deleteMany({});
    await Pipeline.deleteMany({});
    await TaskNode.deleteMany({});
    await Cycle.deleteMany({});

    // 1. Users & Teams
    const ceo = await User.create({ name: "David Kim", role: "CEO - Executive", rank: "Exec", status: "Working", details: "Company Founder" }) as any;
    const cto = await User.create({ name: "Alice Chen", role: "Lead Engineer", position: "Technical", rank: "Senior", status: "Working", details: "Joined early 2022" }) as any;
    const pm = await User.create({ name: "Carol Davis", role: "Product Manager", position: "Product", rank: "Senior", status: "Quit", leftDate: new Date(), details: "Left for another opportunity" }) as any;
    const sales = await User.create({ name: "Bob Smith", role: "Sales Executive", position: "Sales", rank: "Mid", status: "Dropped", leftDate: new Date(), details: "Contract terminated" }) as any;

    const execTeam = await Team.create({ name: "Executive Team", members: [ceo._id] }) as any;
    const engTeam = await Team.create({ name: "Engineering Core", members: [cto._id, pm._id] }) as any;
    const salesTeam = await Team.create({ name: "Enterprise Sales", members: [sales._id] }) as any;

    // 2. Project
    const project = await Project.create({
      name: "testproject001",
      description: "Next-Gen Enterprise Analytics Platform",
      status: "Active",
      category: "Client",
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 6))
    }) as any;

    // 3. Goals & Targets
    const goal1 = await Goal.create({
      title: "Q3 Market Expansion",
      description: "Launch testproject001 into the NA market",
      category: "Company",
      status: "On Track"
    }) as any;

    const target1 = await Target.create({
      name: "Acquire 5 Enterprise Clients",
      expectedValue: 500000,
      actualValue: 120000,
      industry: "SaaS",
      region: "North America",
      status: "Active",
      goalId: goal1._id,
      checklist: [
        { name: "Finalize Marketing Material", isCompleted: true },
        { name: "Launch Ad Campaign", isCompleted: false }
      ]
    }) as any;

    // 4. Pipelines
    const salesPipeline = await Pipeline.create({
      name: "Enterprise Sales Funnel",
      category: "Sales",
      status: "Active",
      progress: 35,
      cashFlowProjectionUSD: 1000000,
      expensesUSD: 50000,
      projectId: project._id,
    }) as any;

    const devPipeline = await Pipeline.create({
      name: "testproject001 Core Dev",
      category: "Development",
      status: "Active",
      progress: 60,
      cashFlowProjectionUSD: 0,
      expensesUSD: 120000,
      projectId: project._id,
    }) as any;

    // 5. Campaigns & Deals
    const campaign = await Campaign.create({
      name: "Q3 NA Outreach",
      leadsGenerated: 45,
      expectedRevenue: 800000,
      pipelineId: salesPipeline._id,
      projectId: project._id,
    }) as any;

    await Deal.create({
      name: "Acme Corp Partnership",
      amount: 150000,
      stage: "Initial Analysis",
      client: { name: "Acme Corp" },
      expectedCloseDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      campaignId: campaign._id,
      pipelineId: salesPipeline._id,
      metadata: { priority: "High" }
    });

    await Deal.create({
      name: "Globex Licensing",
      amount: 350000,
      stage: "Closed",
      client: { name: "Globex" },
      expectedCloseDate: new Date(),
      campaignId: campaign._id,
      pipelineId: salesPipeline._id,
      metadata: { priority: "High" }
    });

    // 6. Resources
    await ResourceAllocation.create({
      name: "Q3 Engineering Budget",
      type: "Budget",
      totalAllocated: 250000,
      totalUsed: 120000,
      riskLevel: "Low",
      assignedToProjectId: project._id,
    });

    await ResourceAllocation.create({
      name: "Cloud Infrastructure",
      type: "Infrastructure",
      totalAllocated: 50000,
      totalUsed: 45000,
      riskLevel: "Medium",
      assignedToProjectId: project._id,
    });

    await ResourceAllocation.create({
      name: "Core Development Team",
      type: "Headcount",
      totalAllocated: 12,
      totalUsed: 8,
      riskLevel: "Low",
      assignedToProjectId: project._id,
    });

    // 7. Tactical Todo Lists & Task Nodes
    const devList = await List.create({
      name: "Development",
      items: [
        { name: "Setup CI/CD Pipeline", completed: true, priority: "high" },
        { name: "Implement User Authentication", completed: true, priority: "high" },
        { name: "Design Dashboard UI", completed: false, priority: "medium" },
      ]
    }) as any;

    await Item.create({ name: "Review Q3 Sales Figures", completed: false, priority: "high" });
    await Item.create({ name: "Prepare Board Presentation", completed: true, priority: "medium" });

    // TaskNodes for Dev Dashboard
    const cycle1 = await Cycle.create({
      name: "Sprint 1",
      project: project._id,
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 14))
    });

    await TaskNode.create({
      name: "Database Schema Design",
      projectId: project._id,
      status: "Done",
      severity: "high",
      estimatedHours: 20,
      actualHours: 22,
      module: "Backend",
      cycleId: cycle1._id,
    });

    await TaskNode.create({
      name: "API Integration",
      projectId: project._id,
      status: "In Progress",
      severity: "medium",
      estimatedHours: 40,
      actualHours: 15,
      module: "Backend",
      cycleId: cycle1._id,
    });

    await TaskNode.create({
      name: "Frontend Components",
      projectId: project._id,
      status: "Code Review",
      severity: "high",
      estimatedHours: 35,
      actualHours: 35,
      module: "Frontend",
      cycleId: cycle1._id,
    });

    return NextResponse.json({ success: true, message: "Database seeded successfully!" });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
