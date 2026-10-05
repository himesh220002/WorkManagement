import connectToDatabase from "@/lib/mongodb";
import { Project, Task, Deal, Lead, Team } from "@/models";
import { computeTaskStats, computeCompanyRollup } from "@/utils/rollup";

export async function getExecutiveMetrics(companyId?: string) {
  await connectToDatabase();

  const query = companyId ? { companyId } : {};

  const [projects, tasks, deals, leads, teams] = await Promise.all([
    Project.find(query).lean(),
    Task.find(query).lean(),
    Deal.find(query).lean(),
    Lead.find(query).lean(),
    Team.find(query).lean(),
  ]);

  const taskStats = computeTaskStats(tasks as any);
  const companyRollup = computeCompanyRollup(projects as any);

  let totalClosedWonUSD = 0;
  let pipelineForecastUSD = 0;

  for (const d of deals) {
    const amt = Number(d.amount || d.revenue || 0);
    if (d.stage === "Closed" || d.status === "Won") {
      totalClosedWonUSD += amt;
    } else if (d.status === "Active") {
      pipelineForecastUSD += amt;
    }
  }

  return {
    projectsCount: projects.length,
    companyHealth: companyRollup.overallStatus,
    onTrackCount: companyRollup.onTrack,
    atRiskCount: companyRollup.atRisk,
    behindCount: companyRollup.behind,
    taskStats,
    dealsCount: deals.length,
    leadsCount: leads.length,
    teamsCount: teams.length,
    totalClosedWonUSD,
    pipelineForecastUSD,
  };
}
