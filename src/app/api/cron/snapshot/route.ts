import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Company, Project, Team, Task, Deal, StatusSnapshot } from "@/models";
import { computeTaskStats, computeCompanyRollup } from "@/utils/rollup";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET || "default_snapshot_secret";

  if (authHeader !== `Bearer ${expectedSecret}` && querySecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const today = new Date().toISOString().split("T")[0]!;

    const [companies, projects, teams, tasks, deals] = await Promise.all([
      Company.find({}).lean(),
      Project.find({}).lean(),
      Team.find({}).lean(),
      Task.find({}).lean(),
      Deal.find({}).lean(),
    ]);

    // 1. Snapshot for each company
    for (const company of companies) {
      const companyProjects = projects.filter(
        (p) => p.companyId?.toString() === company._id.toString()
      );
      const companyTasks = tasks.filter(
        (t) => t.companyId?.toString() === company._id.toString()
      );
      const taskStats = computeTaskStats(companyTasks as any);
      const rollup = computeCompanyRollup(companyProjects as any);

      await StatusSnapshot.findOneAndUpdate(
        { scope: "Company", scopeId: company._id, date: today },
        {
          $set: {
            metrics: {
              projectsCount: companyProjects.length,
              overallHealth: rollup.overallStatus,
              onTrack: rollup.onTrack,
              atRisk: rollup.atRisk,
              behind: rollup.behind,
              taskStats,
            },
          },
        },
        { upsert: true, new: true }
      );
    }

    // 2. Snapshot for each project
    for (const project of projects) {
      const projectTasks = tasks.filter(
        (t) => t.projectId?.toString() === project._id.toString()
      );
      const taskStats = computeTaskStats(projectTasks as any);

      await StatusSnapshot.findOneAndUpdate(
        { scope: "Project", scopeId: project._id, date: today },
        {
          $set: {
            metrics: {
              taskStats,
              health: project.health,
              status: project.status,
            },
          },
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      date: today,
      snapshotsCreated: companies.length + projects.length,
    });
  } catch (error: any) {
    console.error("Cron snapshot error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create status snapshots" },
      { status: 500 }
    );
  }
}
