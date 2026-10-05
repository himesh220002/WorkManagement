import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI is not set in environment or .env");
  process.exit(1);
}

// Global strictPopulate setting
mongoose.set("strictPopulate", false);

import {
  Company,
  Project,
  Team,
  User,
  Task,
  Goal,
  Target,
  DailyGoal,
  Pipeline,
  Deal,
  Lead,
  Campaign,
  ResourceAllocation,
  CustomerFeedback,
  ActivityLog,
  StatusSnapshot,
} from "../src/models";

async function seedOpportunity01() {
  console.log("🌱 Seeding project 'oportunity01' with complete end-to-end management data...");

  await mongoose.connect(uri!);

  // 1. Ensure Default Company exists
  let company = await Company.findOne({ slug: "default-org" });
  if (!company) {
    company = await Company.create({
      name: "TaskFlow Organization",
      slug: "default-org",
      industry: "Technology & Software",
      fiscalYearStart: "01-01",
      settings: {
        currency: "USD",
        timezone: "UTC",
        workingDays: [1, 2, 3, 4, 5],
      },
      status: "Active",
    });
  }
  const companyId = company._id;
  console.log(`🏢 Company: ${company.name} (${companyId})`);

  // 2. Setup Team Members (Users)
  const usersData = [
    {
      name: "Sarah Connor",
      email: "sarah.connor@taskflow.local",
      role: "Manager",
      position: "Lead Project Architect",
      rank: "Principal",
      status: "Working",
      capacityHoursPerWeek: 40,
      skills: ["Architecture", "System Design", "Agile", "TypeScript"],
      companyId,
    },
    {
      name: "Alex Mercer",
      email: "alex.mercer@taskflow.local",
      role: "Member",
      position: "Senior Fullstack Engineer",
      rank: "Senior",
      status: "Working",
      capacityHoursPerWeek: 40,
      skills: ["Next.js", "React 19", "MongoDB", "Tailwind"],
      companyId,
    },
    {
      name: "Elena Rostova",
      email: "elena.rostova@taskflow.local",
      role: "Member",
      position: "QA & Reliability Engineer",
      rank: "Senior",
      status: "Working",
      capacityHoursPerWeek: 40,
      skills: ["Automation", "Playwright", "Vitest", "Performance"],
      companyId,
    },
    {
      name: "Marcus Vance",
      email: "marcus.vance@taskflow.local",
      role: "Member",
      position: "Enterprise Sales Director",
      rank: "Director",
      status: "Working",
      capacityHoursPerWeek: 40,
      skills: ["Enterprise Sales", "B2B SaaS", "Contract Negotiation"],
      companyId,
    },
  ];

  const members: any[] = [];
  for (const u of usersData) {
    let existingUser = await User.findOne({ name: u.name });
    if (!existingUser) {
      existingUser = await User.create(u);
    } else {
      existingUser.companyId = companyId;
      await existingUser.save();
    }
    members.push(existingUser);
  }
  console.log(`👥 Created/verified ${members.length} team members`);

  const [leadArchitect, seniorEngineer, qaEngineer, salesDirector] = members;

  // 3. Clean up any existing 'oportunity01' to allow re-runs cleanly
  const existingProject = await Project.findOne({ name: "oportunity01" });
  if (existingProject) {
    const pId = existingProject._id;
    await Promise.all([
      Task.deleteMany({ projectId: pId }),
      Pipeline.deleteMany({ projectId: pId }),
      Goal.deleteMany({ projectId: pId }),
      Deal.deleteMany({ projectId: pId }),
      Campaign.deleteMany({ projectId: pId }),
      ResourceAllocation.deleteMany({ assignedToProjectId: pId }),
      CustomerFeedback.deleteMany({ projectId: pId }),
      ActivityLog.deleteMany({ projectId: pId }),
      StatusSnapshot.deleteMany({ scopeId: pId }),
      Project.deleteOne({ _id: pId }),
    ]);
    console.log("🧹 Cleaned previous 'oportunity01' test data for fresh execution");
  }

  // 4. Create Project 'oportunity01'
  const startDate = new Date();
  const deadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days out

  const project = await Project.create({
    name: "oportunity01",
    description:
      "Strategic Enterprise Platform opportunity for next-gen work management, real-time collaboration, and revenue tracking.",
    category: "Product",
    companyId,
    ownerId: leadArchitect._id,
    startDate,
    deadline,
    status: "Active",
    health: "On Track",
    budgetUSD: 165000,
    scaling: 1.2,
    tags: ["oportunity01", "enterprise", "mvp", "high-priority"],
    teams: [],
  });
  const projectId = project._id;
  console.log(`🚀 Project 'oportunity01' created: ${projectId}`);

  // 5. Create Dedicated Teams for 'oportunity01'
  const devTeam = await Team.create({
    name: "oportunity01 Core Dev Team",
    description: "Fullstack engineering & infrastructure team responsible for building and shipping oportunity01.",
    companyId,
    leadId: leadArchitect._id,
    projectIds: [projectId],
    members: [leadArchitect._id, seniorEngineer._id, qaEngineer._id],
    capacityHoursPerWeek: 120,
  });

  const growthTeam = await Team.create({
    name: "oportunity01 Growth & Sales",
    description: "Go-to-market, pilot acquisition, and enterprise client onboarding team.",
    companyId,
    leadId: salesDirector._id,
    projectIds: [projectId],
    members: [salesDirector._id, leadArchitect._id],
    capacityHoursPerWeek: 60,
  });

  // Link teams back to project
  project.teams = [devTeam._id as any, growthTeam._id as any];
  await project.save();
  console.log("🤝 Created and linked Dev & Growth teams");

  // 6. Create Goals & Targets
  const mvpGoal = await Goal.create({
    title: "Launch oportunity01 Production MVP",
    description: "Deliver high-performance core work management modules, pipelines, and audit logs by Q4.",
    category: "Product",
    scope: "Project",
    projectId,
    companyId,
    teamId: devTeam._id,
    ownerId: leadArchitect._id,
    status: "On Track",
    progress: 70,
    startDate,
    dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    metric: {
      type: "Percent",
      target: 100,
      current: 70,
      unit: "%",
    },
  });

  const revenueGoal = await Goal.create({
    title: "Secure $100K ARR in Beta Contracts",
    description: "Close 3 initial enterprise design partners under oportunity01 commercial agreements.",
    category: "Sales",
    scope: "Project",
    projectId,
    companyId,
    teamId: growthTeam._id,
    ownerId: salesDirector._id,
    status: "On Track",
    progress: 65,
    startDate,
    dueDate: deadline,
    metric: {
      type: "Currency",
      target: 100000,
      current: 65000,
      unit: "USD",
    },
  });

  // Measurable Targets
  await Target.create({
    name: "Complete Core API & Database Normalization",
    goalId: mvpGoal._id,
    companyId,
    expectedValue: 100,
    actualValue: 85,
    achievedRevenueUSD: 0,
    status: "Active",
    checklist: [
      { name: "Schema migration and strict typing", isCompleted: true },
      { name: "Pure rollup engine and unit tests", isCompleted: true },
      { name: "Performance query budget audit", isCompleted: false },
    ],
  });

  await Target.create({
    name: "Onboard 5 Enterprise Pilots",
    goalId: revenueGoal._id,
    companyId,
    expectedValue: 5,
    actualValue: 3,
    achievedRevenueUSD: 65000,
    status: "Active",
    checklist: [
      { name: "Outbound campaign launch", isCompleted: true },
      { name: "Pilot security review", isCompleted: true },
      { name: "Sign SLA agreements", isCompleted: false },
    ],
  });
  console.log("🎯 Created Goals and Targets");

  // 7. Create Pipelines
  const devPipeline = await Pipeline.create({
    name: "oportunity01 Core Architecture Pipeline",
    category: "Development",
    companyId,
    projectId,
    teamId: devTeam._id,
    ownerId: leadArchitect._id,
    owner: leadArchitect.name,
    status: "Active",
    progress: 75,
    priority: "High",
    riskLevel: "Low",
    startDate,
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    objectives: "Deliver bulletproof database schemas, robust server actions, and Fluent 2 layout.",
    dependencies: "Database Atlas Cluster setup",
    outcome: "Scalable enterprise web application operating system",
    budget: "$60,000",
    kpis: "P99 response time < 150ms, 100% type safety",
    memberIds: [leadArchitect._id, seniorEngineer._id, qaEngineer._id],
    cashFlowProjectionUSD: 85000,
    expensesUSD: 24000,
    roiPercent: 254,
    todos: [
      {
        text: "Database Schema Optimization",
        completed: true,
        assigneeType: "Individual",
        assigneeName: leadArchitect.name,
        assigneeId: leadArchitect._id,
      },
      {
        text: "Fluent 2 UI Shell & Primitives Implementation",
        completed: true,
        assigneeType: "Individual",
        assigneeName: seniorEngineer.name,
        assigneeId: seniorEngineer._id,
      },
      {
        text: "End-to-end integration and smoke testing",
        completed: false,
        assigneeType: "Individual",
        assigneeName: qaEngineer.name,
        assigneeId: qaEngineer._id,
      },
      {
        text: "Production Deployment Verification",
        completed: false,
        assigneeType: "Individual",
        assigneeName: leadArchitect.name,
        assigneeId: leadArchitect._id,
      },
    ],
  });

  const salesPipeline = await Pipeline.create({
    name: "oportunity01 Commercialization Pipeline",
    category: "Sales",
    companyId,
    projectId,
    teamId: growthTeam._id,
    ownerId: salesDirector._id,
    owner: salesDirector.name,
    status: "Active",
    progress: 50,
    priority: "High",
    riskLevel: "Low",
    startDate,
    endDate: deadline,
    objectives: "Engage enterprise leads and close recurring pilot contracts.",
    budget: "$30,000",
    kpis: "Lead to closed-won conversion >= 25%",
    memberIds: [salesDirector._id],
    cashFlowProjectionUSD: 120000,
    expensesUSD: 15000,
    roiPercent: 700,
    todos: [
      {
        text: "ABM Campaign Outreach",
        completed: true,
        assigneeType: "Individual",
        assigneeName: salesDirector.name,
        assigneeId: salesDirector._id,
      },
      {
        text: "Technical Demo to Fortune 500 Prospect",
        completed: true,
        assigneeType: "Individual",
        assigneeName: salesDirector.name,
        assigneeId: salesDirector._id,
      },
      {
        text: "Contract finalization with Apex Global",
        completed: false,
        assigneeType: "Individual",
        assigneeName: salesDirector.name,
        assigneeId: salesDirector._id,
      },
    ],
  });
  console.log("⚡ Created Development & Commercial Pipelines");

  // 8. Create Tasks with real Assignees, estimates, and statuses
  const tasksData = [
    {
      name: "Configure Multi-tenant Schema & Indexes",
      description: "Define CompanyId compound indexes for high-throughput queries.",
      projectId,
      companyId,
      goalId: mvpGoal._id,
      pipelineId: devPipeline._id,
      status: "Done",
      priority: "High",
      type: "task",
      estimatedHours: 12,
      actualHours: 10,
      progress: 100,
      assignee: leadArchitect.name,
      assigneeIds: [leadArchitect._id],
      assignees: [leadArchitect._id],
      startDate,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      labels: ["oportunity01", "backend", "database"],
      order: 1,
    },
    {
      name: "Build Fluent 2 App Shell & Navigation Rail",
      description: "Integrate TopBar, Breadcrumbs, SideNav with keyboard accessibility.",
      projectId,
      companyId,
      goalId: mvpGoal._id,
      pipelineId: devPipeline._id,
      status: "Done",
      priority: "Medium",
      type: "task",
      estimatedHours: 16,
      actualHours: 14,
      progress: 100,
      assignee: seniorEngineer.name,
      assigneeIds: [seniorEngineer._id],
      assignees: [seniorEngineer._id],
      startDate,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      labels: ["oportunity01", "frontend", "fluent2"],
      order: 2,
    },
    {
      name: "Implement My Work Personal Dashboard",
      description: "Provide personal task toggles and owned pipelines/deals overview.",
      projectId,
      companyId,
      goalId: mvpGoal._id,
      pipelineId: devPipeline._id,
      status: "In Progress",
      priority: "High",
      type: "task",
      estimatedHours: 14,
      actualHours: 8,
      progress: 60,
      assignee: seniorEngineer.name,
      assigneeIds: [seniorEngineer._id],
      assignees: [seniorEngineer._id],
      startDate,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      labels: ["oportunity01", "frontend", "my-work"],
      order: 3,
    },
    {
      name: "Automated Reliability & Rollup Unit Test Suite",
      description: "Cover mathematical rollup rules, health transitions, and progress deltas.",
      projectId,
      companyId,
      goalId: mvpGoal._id,
      pipelineId: devPipeline._id,
      status: "Done",
      priority: "Medium",
      type: "task",
      estimatedHours: 10,
      actualHours: 8,
      progress: 100,
      assignee: qaEngineer.name,
      assigneeIds: [qaEngineer._id],
      assignees: [qaEngineer._id],
      startDate,
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      labels: ["oportunity01", "testing", "vitest"],
      order: 4,
    },
    {
      name: "Finalize Enterprise Pilot Agreement - Apex Global",
      description: "Review procurement terms and SLA contract with legal team.",
      projectId,
      companyId,
      goalId: revenueGoal._id,
      pipelineId: salesPipeline._id,
      status: "In Progress",
      priority: "High",
      type: "task",
      estimatedHours: 8,
      actualHours: 4,
      progress: 50,
      assignee: salesDirector.name,
      assigneeIds: [salesDirector._id],
      assignees: [salesDirector._id],
      startDate,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      labels: ["oportunity01", "sales", "contracts"],
      order: 5,
    },
    {
      name: "Real-time Telemetry & Health Monitoring Setup",
      description: "Implement daily status snapshot jobs and cron health checks.",
      projectId,
      companyId,
      goalId: mvpGoal._id,
      pipelineId: devPipeline._id,
      status: "Todo",
      priority: "Medium",
      type: "task",
      estimatedHours: 12,
      actualHours: 0,
      progress: 0,
      assignee: leadArchitect.name,
      assigneeIds: [leadArchitect._id],
      assignees: [leadArchitect._id],
      startDate,
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      labels: ["oportunity01", "devops", "monitoring"],
      order: 6,
    },
  ];

  const createdTasks: any[] = [];
  for (const t of tasksData) {
    const task = await Task.create(t);
    createdTasks.push(task);
  }
  console.log(`📋 Created ${createdTasks.length} active tasks`);

  // 9. Create Daily Goals (Rolling into Team Goals)
  const today = new Date();
  await DailyGoal.create({
    teamId: devTeam._id,
    goalId: mvpGoal._id,
    date: today,
    title: "Verify opportunity01 end-to-end integration & build health",
    ownerId: leadArchitect._id,
    status: "Done",
    taskIds: [createdTasks[0]._id, createdTasks[1]._id],
    note: "All schemas validated and Turbopack production build verified cleanly.",
  });

  await DailyGoal.create({
    teamId: devTeam._id,
    goalId: mvpGoal._id,
    date: today,
    title: "Test live interactive tasks in My Work view",
    ownerId: seniorEngineer._id,
    status: "Planned",
    taskIds: [createdTasks[2]._id],
    note: "Validating optimistic UI updates and server action feedback.",
  });

  await DailyGoal.create({
    teamId: growthTeam._id,
    goalId: revenueGoal._id,
    date: today,
    title: "Conduct Opportunity01 Pilot Demo with Apex Global",
    ownerId: salesDirector._id,
    status: "Done",
    taskIds: [createdTasks[4]._id],
    note: "Client responded positively; proceeding to closing stage.",
  });
  console.log("📅 Created Daily Goals for live standup view");

  // 10. Create Deals, Campaign, and Leads
  const campaign = await Campaign.create({
    name: "oportunity01 Enterprise Inbound ABM",
    companyId,
    projectId,
    pipelineId: salesPipeline._id,
    type: "Enterprise ABM",
    leadsGenerated: 14,
    expectedRevenue: 120000,
  });

  const wonDeal = await Deal.create({
    name: "oportunity01 - Apex Global Enterprise Contract",
    companyId,
    projectId,
    pipelineId: salesPipeline._id,
    campaignId: campaign._id,
    stage: "Closing",
    amount: 45000,
    revenue: 45000,
    owner: salesDirector.name,
    ownerId: salesDirector._id,
    client: {
      name: "Apex Global Financial",
      industry: "Financial Services",
      region: "North America",
    },
    expectedCloseDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: "Active",
    currency: "USD",
    isRecurring: true,
    metadata: {
      priority: "High",
      riskLevel: "Low",
      notes: "Annual recurring license for 250 enterprise seats.",
    },
  });

  const wonDeal2 = await Deal.create({
    name: "oportunity01 - BlueSky Logistics Pilot",
    companyId,
    projectId,
    pipelineId: salesPipeline._id,
    campaignId: campaign._id,
    stage: "Closed",
    amount: 20000,
    revenue: 20000,
    owner: salesDirector.name,
    ownerId: salesDirector._id,
    client: {
      name: "BlueSky Logistics",
      industry: "Supply Chain",
      region: "Europe",
    },
    expectedCloseDate: new Date(),
    status: "Won",
    currency: "USD",
    isRecurring: true,
    metadata: {
      priority: "Medium",
      riskLevel: "Low",
      notes: "Pilot successfully converted into paid enterprise tier.",
    },
  });

  await Lead.create({
    name: "David Sterling (OmniCorp VP Tech)",
    companyId,
    status: "Qualified",
    owner: salesDirector.name,
    ownerId: salesDirector._id,
    source: "Enterprise ABM",
    campaignId: campaign._id,
  });

  await Lead.create({
    name: "Elena Zhang (FinCorp CTO)",
    companyId,
    status: "Working",
    owner: salesDirector.name,
    ownerId: salesDirector._id,
    source: "Referral",
    campaignId: campaign._id,
  });
  console.log("💰 Created Commercial Deals ($65K ARR) and Qualified Leads");

  // 11. Resource Allocations
  await ResourceAllocation.create({
    name: "oportunity01 Dedicated Cloud Compute (AWS)",
    companyId,
    teamId: devTeam._id,
    assignedToProjectId: projectId,
    type: "Infrastructure",
    totalAllocated: 20000,
    totalUsed: 6500,
    riskLevel: "Low",
  });

  await ResourceAllocation.create({
    name: "oportunity01 Engineering Capacity Pool",
    companyId,
    teamId: devTeam._id,
    assignedToProjectId: projectId,
    type: "Headcount",
    totalAllocated: 120, // hours/wk
    totalUsed: 80,
    riskLevel: "Low",
  });

  // 12. Customer Feedback
  await CustomerFeedback.create({
    title: "Need real-time audit log exports in oportunity01",
    type: "Feature Request",
    priority: "Medium",
    status: "In Progress",
    description: "Enterprise compliance team requires CSV/JSON download of activity diffs.",
    projectId,
  });

  // 13. Activity Log (Audit Trail)
  await ActivityLog.create({
    companyId,
    projectId,
    entityType: "Project",
    entityId: projectId,
    action: "Project 'oportunity01' fully initialized with live teams, pipelines, goals, and tasks.",
    actorId: leadArchitect._id,
    diff: {
      name: "oportunity01",
      status: "Active",
      health: "On Track",
      budgetUSD: 165000,
      activePipelines: 2,
      activeDealsCount: 2,
    },
    createdAt: new Date(),
  });

  // 14. Status Snapshot for Trend Analysis
  const todayStr = new Date().toISOString().split("T")[0]!;
  await StatusSnapshot.findOneAndUpdate(
    { scope: "Project", scopeId: projectId, date: todayStr },
    {
      $set: {
        metrics: {
          name: "oportunity01",
          health: "On Track",
          status: "Active",
          progress: 68,
          totalTasks: createdTasks.length,
          completedTasks: createdTasks.filter((t) => t.status === "Done").length,
          budgetUSD: 165000,
          revenueAchievedUSD: 65000,
        },
      },
    },
    { upsert: true, new: true }
  );

  console.log("📊 Status snapshot saved for historical trends");
  console.log("\n✨ SUCCESS! Project 'oportunity01' is live and ready for testing.");
  console.log("🔗 Key Views to inspect:");
  console.log("   • /projects         -> Projects Blueprint with oportunity01 card");
  console.log("   • /my-work          -> Tasks, owned pipelines & deals for Sarah, Alex, Elena, Marcus");
  console.log("   • /dev/dashboard    -> Engineering tasks & workflow status");
  console.log("   • /dev/timeline     -> oportunity01 Core Architecture & Commercial Pipelines");
  console.log("   • /teams            -> oportunity01 Core Dev & Growth Teams and capacity");
  console.log("   • /sales/dashboard  -> $65K ARR in oportunity01 deals & qualified leads");
  console.log("   • /exec/dashboard   -> Rolled up company metrics reflecting oportunity01");

  await mongoose.disconnect();
}

seedOpportunity01().catch((err) => {
  console.error("❌ Seeding error:", err);
  process.exit(1);
});
