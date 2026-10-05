import connectToDatabase from "@/lib/mongodb";
import { Project, Pipeline, Team, Task, Goal, Deal } from "@/models";
import DiagramsClient from "@/app/diagrams/DiagramsClient";

export default async function DiagramsPage() {
  await connectToDatabase();

  const [projectsRaw, pipelinesRaw, teamsRaw, tasksRaw, goalsRaw, dealsRaw] =
    await Promise.all([
      Project.find({}).lean(),
      Pipeline.find({}).populate("projectId teamId").lean(),
      Team.find({}).populate("members leadId").lean(),
      Task.find({}).populate("projectId", "name").lean(),
      Goal.find({}).lean(),
      Deal.find({}).lean(),
    ]);

  const cleanProjects = projectsRaw.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
    category: p.category || "General",
    status: p.status || "Active",
    health: p.health || "On Track",
  }));

  const cleanPipelines = pipelinesRaw.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
    category: p.category || "General",
    status: p.status || "Active",
    progress: Number(p.progress || 0),
    riskLevel: p.riskLevel || "Low",
    owner: p.owner || "Unassigned",
    projectId: p.projectId ? { _id: (p.projectId._id || p.projectId).toString(), name: p.projectId.name } : null,
    teamId: p.teamId ? { _id: (p.teamId._id || p.teamId).toString(), name: p.teamId.name } : null,
  }));

  const cleanTeams = teamsRaw.map((t: any) => ({
    _id: t._id.toString(),
    name: t.name,
    membersCount: Array.isArray(t.members) ? t.members.length : 0,
    leadName: t.leadId ? t.leadId.name : "Unassigned",
  }));

  const cleanTasks = tasksRaw.map((t: any) => ({
    _id: t._id.toString(),
    name: t.name,
    status: t.status || "Todo",
    priority: t.priority || "Medium",
    projectId: t.projectId ? { _id: (t.projectId._id || t.projectId).toString(), name: t.projectId.name } : null,
  }));

  const cleanGoals = goalsRaw.map((g: any) => ({
    _id: g._id.toString(),
    title: g.title,
    progress: Number(g.progress || 0),
    status: g.status || "On Track",
  }));

  const stats = {
    totalProjects: cleanProjects.length,
    totalPipelines: cleanPipelines.length,
    totalTeams: cleanTeams.length,
    totalTasks: cleanTasks.length,
    tasksDone: cleanTasks.filter((t) => ["done", "completed"].includes(t.status.toLowerCase())).length,
    totalGoals: cleanGoals.length,
    totalDeals: dealsRaw.length,
  };

  return (
    <DiagramsClient
      projects={cleanProjects}
      pipelines={cleanPipelines}
      teams={cleanTeams}
      tasks={cleanTasks}
      goals={cleanGoals}
      stats={stats}
    />
  );
}
