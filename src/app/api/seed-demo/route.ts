import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Project, TaskNode, Lead, Campaign, Deal, Target, Team, User, Pipeline, ResourceAllocation, Goal } from "@/models";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Wipe database clean
    await Project.deleteMany({});
    await Team.deleteMany({});
    await User.deleteMany({});
    await Pipeline.deleteMany({});
    await TaskNode.deleteMany({});
    await Lead.deleteMany({});
    await Campaign.deleteMany({});
    await Deal.deleteMany({});
    await ResourceAllocation.deleteMany({});
    await Goal.deleteMany({});
    await Target.deleteMany({});

    // 2. Create Teams
    const engineeringTeam = await Team.create({ name: "Engineering Core" });
    const salesTeam = await Team.create({ name: "Enterprise Sales" });
    const execTeam = await Team.create({ name: "Executive Team" });

    // 3. Create Users
    const users = await User.insertMany([
      { name: "Alice Chen", role: "Lead Engineer", position: "Technical", rank: "Senior" },
      { name: "Bob Smith", role: "Sales Executive", position: "Sales", rank: "Mid" },
      { name: "Carol Davis", role: "Product Manager", position: "Product", rank: "Senior" },
      { name: "David Kim", role: "CEO", position: "Executive", rank: "Exec" }
    ]);

    await Team.findByIdAndUpdate(engineeringTeam._id, { $push: { members: users[0]._id } });
    await Team.findByIdAndUpdate(salesTeam._id, { $push: { members: users[1]._id } });
    await Team.findByIdAndUpdate(engineeringTeam._id, { $push: { members: users[2]._id } });
    await Team.findByIdAndUpdate(execTeam._id, { $push: { members: users[3]._id } });

    // 4. Create Project
    const project = await Project.create({
      name: "testproject001",
      description: "Initial rollout and market penetration strategy for testproject001.",
      category: "Product",
      teams: [engineeringTeam._id, salesTeam._id, execTeam._id],
      status: "Active"
    });

    // 5. Create Operations & Dev Pipelines and Tasks
    const devPipeline = await Pipeline.create({
      name: "V1 Platform Launch",
      category: "Development",
      owner: "Alice Chen",
      status: "Active",
      progress: 40,
      priority: "High",
      objectives: "Launch the MVP platform with core features.",
      projectId: project._id,
      teamId: engineeringTeam._id,
      memberIds: [users[0]._id, users[2]._id],
      riskLevel: "Low"
    });

    await TaskNode.insertMany([
      { name: "Database Architecture", projectId: project._id, pipelineId: devPipeline._id, status: "Done", severity: "high", estimatedHours: 40, actualHours: 42, progress: 100 },
      { name: "Authentication System", projectId: project._id, pipelineId: devPipeline._id, status: "Done", severity: "high", estimatedHours: 25, actualHours: 20, progress: 100 },
      { name: "Core API Development", projectId: project._id, pipelineId: devPipeline._id, status: "Done", severity: "high", estimatedHours: 50, actualHours: 55, progress: 100 },
      { name: "Dashboard UI Integration", projectId: project._id, pipelineId: devPipeline._id, status: "In Progress", severity: "medium", estimatedHours: 60, actualHours: 35, progress: 60 },
      { name: "User Settings Page", projectId: project._id, pipelineId: devPipeline._id, status: "In Progress", severity: "low", estimatedHours: 20, actualHours: 10, progress: 50 },
      { name: "Payment Gateway", projectId: project._id, pipelineId: devPipeline._id, status: "Todo", severity: "high", estimatedHours: 40, actualHours: 0, progress: 0 },
      { name: "Push Notifications", projectId: project._id, pipelineId: devPipeline._id, status: "Todo", severity: "medium", estimatedHours: 30, actualHours: 0, progress: 0 },
      { name: "Email Templates", projectId: project._id, pipelineId: devPipeline._id, status: "Todo", severity: "low", estimatedHours: 15, actualHours: 0, progress: 0 }
    ]);

    // 6. Create Sales Pipeline & Campaigns
    const salesPipeline = await Pipeline.create({
      name: "Q3 Acquisition Strategy",
      category: "Sales",
      owner: "Bob Smith",
      status: "Active",
      progress: 25,
      priority: "High",
      objectives: "Acquire early adopters and secure first enterprise clients.",
      projectId: project._id,
      teamId: salesTeam._id,
      memberIds: [users[1]._id],
      riskLevel: "Medium",
      cashFlowProjectionUSD: 165000,
      expensesUSD: 15000,
      roiPercent: 1100
    });

    const campaign = await Campaign.create({
      name: "Q3 Inbound SaaS Strategy",
      type: "Digital",
      leadsGenerated: 12,
      expectedRevenue: 120000,
      projectId: project._id,
      pipelineId: salesPipeline._id
    });

    // 7. Create Leads
    await Lead.insertMany([
      { name: "Acme Logistics", status: "New", owner: "Bob Smith", source: "Inbound Marketing", campaignId: campaign._id },
      { name: "Skyline Media", status: "New", owner: "Bob Smith", source: "Direct Email", campaignId: campaign._id },
      { name: "FinTech Solutions", status: "Working", owner: "Bob Smith", source: "Inbound Marketing", campaignId: campaign._id },
      { name: "HealthPlus Corp", status: "Working", owner: "Alice Chen", source: "Referral", campaignId: campaign._id },
      { name: "Global Retail Inc.", status: "Qualified", owner: "Bob Smith", source: "Inbound Marketing", campaignId: campaign._id },
      { name: "TechNova Systems", status: "Qualified", owner: "David Kim", source: "Networking", campaignId: campaign._id }
    ]);

    // 8. Create Deals
    const deal1 = await Deal.create({
      name: "Acme Pilot Program", stage: "Prospect", amount: 15000, owner: "Bob Smith", status: "Active", projectId: project._id, pipelineId: salesPipeline._id,
      client: { name: "Acme Logistics", industry: "Logistics", region: "North America" }
    });
    const deal2 = await Deal.create({
      name: "Skyline MVP Access", stage: "Prospect", amount: 15000, owner: "Bob Smith", status: "Active", projectId: project._id, pipelineId: salesPipeline._id,
      client: { name: "Skyline Media", industry: "Media", region: "Europe" }
    });
    const deal3 = await Deal.create({
      name: "FinTech Rollout", stage: "Due Diligence", amount: 45000, owner: "Bob Smith", status: "Active", projectId: project._id, pipelineId: salesPipeline._id,
      client: { name: "FinTech Solutions", industry: "Finance", region: "North America" }
    });
    const deal4 = await Deal.create({
      name: "Global Retail Enterprise License", stage: "Closing", amount: 80000, owner: "David Kim", status: "Active", projectId: project._id, pipelineId: salesPipeline._id,
      client: { name: "Global Retail Inc.", industry: "Retail", region: "Asia Pacific" },
      metadata: { priority: "High", riskLevel: "Low", notes: "Contract is out for signature." }
    });
    const deal5 = await Deal.create({
      name: "TechNova Early Adopter", stage: "Closed", amount: 25000, owner: "David Kim", status: "Won", projectId: project._id, pipelineId: salesPipeline._id,
      client: { name: "TechNova Systems", industry: "Technology", region: "North America" }
    });

    // 9. Create Resource Allocations
    await ResourceAllocation.insertMany([
      { name: "Q3 Engineering Budget", type: "Budget", totalAllocated: 50000, totalUsed: 15000, assignedToProjectId: project._id, riskLevel: "Low" },
      { name: "Sales Travel & Tools", type: "Tools", totalAllocated: 10000, totalUsed: 2500, assignedToProjectId: project._id, riskLevel: "Low" },
      { name: "Enterprise Server Infra", type: "Infrastructure", totalAllocated: 15000, totalUsed: 12000, assignedToProjectId: project._id, linkedDealId: deal5._id, riskLevel: "Medium" }
    ]);

    // 10. Create Goals and Targets
    const execGoal = await Goal.create({
      title: "Achieve Q3 Market Entry",
      description: "Successfully launch V1 and secure first wave of enterprise clients.",
      category: "Company",
      status: "On Track"
    });

    await Target.insertMany([
      {
        name: "Acquire 5 Early Adopters",
        goalId: execGoal._id,
        industry: "Technology",
        region: "North America",
        expectedValue: 5,
        actualValue: 1,
        achievedRevenueUSD: 25000,
        status: "Active",
        checklist: [
          { name: "Secure First Alpha Client", isCompleted: true },
          { name: "Sign 4 More Beta Clients", isCompleted: false }
        ]
      },
      {
        name: "Generate $100k Pipeline",
        goalId: execGoal._id,
        industry: "Retail",
        region: "Global",
        expectedValue: 100000,
        actualValue: 25000,
        status: "Active",
        checklist: [
          { name: "Close $25k Early Deal", isCompleted: true },
          { name: "Close $80k Global Retail Deal", isCompleted: false }
        ]
      }
    ]);

    return NextResponse.json({ message: "Seed successful for testproject001!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
