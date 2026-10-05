import connectToDatabase from "@/lib/mongodb";
import { Company, Project, Task, Deal, User, ICompany } from "@/models";
import { serializeDoc, serializeDocs } from "@/lib/serialize";
import { computeCompanyRollup } from "@/utils/rollup";

export async function getDefaultCompany(): Promise<ICompany | null> {
  await connectToDatabase();
  const company = await Company.findOne({ slug: "default-org" }).lean();
  if (company) return serializeDoc<ICompany>(company);
  const anyCompany = await Company.findOne({}).lean();
  return serializeDoc<ICompany>(anyCompany);
}

export async function getCompanyBySlug(slug: string): Promise<ICompany | null> {
  await connectToDatabase();
  const company = await Company.findOne({ slug }).lean();
  return serializeDoc<ICompany>(company);
}

export async function getCompanyOverviewStats(companyId: string) {
  await connectToDatabase();

  const [projects, tasks, deals, users] = await Promise.all([
    Project.find({ companyId }).lean(),
    Task.find({ companyId }).lean(),
    Deal.find({ companyId }).lean(),
    User.find({ companyId, status: "Working" }).lean(),
  ]);

  const rollup = computeCompanyRollup(projects as any);

  let openTasks = 0;
  for (const t of tasks) {
    const s = (t.status || "").toLowerCase();
    if (s !== "done" && s !== "archived") {
      openTasks++;
    }
  }

  // Calculate closed/won deals or quarterly revenue
  let totalRevenue = 0;
  for (const d of deals) {
    if (d.stage === "Closed" || d.status === "Won") {
      totalRevenue += Number(d.amount || d.revenue || 0);
    }
  }

  return {
    projectsCount: projects.length,
    projectsOnTrack: rollup.onTrack,
    projectsAtRisk: rollup.atRisk,
    projectsBehind: rollup.behind,
    overallHealth: rollup.overallStatus,
    openTasks,
    totalTasks: tasks.length,
    revenueThisQuarter: totalRevenue,
    headcount: users.length,
    recentProjects: serializeDocs(projects.slice(0, 6)),
  };
}
