import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Project, TaskNode, Lead, Campaign, Deal, Target, Team, User, List, Item } from "@/models";

export async function GET() {
  try {
    await connectToDatabase();

    // Seed Teams
    const teamsCount = await Team.countDocuments();
    let teamId = null;
    if (teamsCount === 0) {
      const team = await Team.create({ name: "Core Engineering" });
      teamId = team._id;
      await Team.create({ name: "Sales Leaders" });
    }

    // Seed Projects
    const projectsCount = await Project.countDocuments();
    let projectId = null;
    if (projectsCount === 0) {
      const project = await Project.create({
        name: "Project Alpha",
        description: "Initial rollout of the primary platform.",
        team: teamId,
        status: "Active"
      });
      projectId = project._id;
      
      await Project.create({
        name: "Project Beta",
        description: "Mobile app development.",
        team: teamId,
        status: "Planning"
      });
    }

    // Seed TaskNodes
    const tasksCount = await TaskNode.countDocuments();
    if (tasksCount === 0) {
      await TaskNode.create([
        { name: "Design System setup", projectId: projectId, status: "completed", severity: "low", estimatedHours: 40, actualHours: 45, progress: 100 },
        { name: "Backend API Auth", projectId: projectId, status: "in_progress", severity: "high", estimatedHours: 80, actualHours: 60, progress: 75 },
        { name: "Dashboard UI", projectId: projectId, status: "open", severity: "medium", estimatedHours: 60, actualHours: 0, progress: 0 }
      ]);
    }

    // Seed Leads
    const leadsCount = await Lead.countDocuments();
    if (leadsCount === 0) {
      await Lead.create([
        { name: "Acme Corp", status: "New", owner: "Bill West", source: "Webinar" },
        { name: "Global Tech", status: "Working", owner: "Sarah Lee", source: "Referral" },
        { name: "Stark Ind.", status: "Qualified", owner: "John Doe", source: "Trade Show" }
      ]);
    }

    // Seed Campaigns
    const campaignsCount = await Campaign.countDocuments();
    if (campaignsCount === 0) {
      await Campaign.create([
        { name: "Q3 Webinar", leadsGenerated: 30, expectedRevenue: 150000 },
        { name: "Email Blast v2", leadsGenerated: 20, expectedRevenue: 85000 }
      ]);
    }

    // Seed Deals
    const dealsCount = await Deal.countDocuments();
    if (dealsCount === 0) {
      await Deal.create([
        { name: "Enterprise License", stage: "Prospect", amount: 250000 },
        { name: "Cloud Migration", stage: "Initial Analysis", amount: 120000 },
        { name: "Support Contract", stage: "Signing & Closing", amount: 45000 }
      ]);
    }

    // Seed Targets
    const targetsCount = await Target.countDocuments();
    if (targetsCount === 0) {
      await Target.create([
        { 
          name: "Q4 Revenue Goal", 
          industry: "SaaS", 
          region: "North America", 
          status: "Active",
          checklist: [
            { name: "Close 5 Enterprise Deals", isCompleted: false },
            { name: "Launch New Ad Campaign", isCompleted: true }
          ]
        },
        { 
          name: "European Expansion", 
          industry: "FinTech", 
          region: "Europe", 
          status: "Active",
          checklist: [
            { name: "Hire Regional VP", isCompleted: false }
          ]
        }
      ]);
    }

    return NextResponse.json({ message: "Database Seeded Successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
