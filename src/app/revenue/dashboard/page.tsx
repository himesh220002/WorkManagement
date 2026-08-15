import connectToDatabase from "@/lib/mongodb";
import { Deal, Target, Pipeline, Project, Team, TaskNode, User } from "@/models";
import RevenueDashboardClient from "@/app/revenue/dashboard/RevenueDashboardClient";

export default async function RevenueDashboardPage() {
  await connectToDatabase();

  let deals: any[] = [];
  let targets: any[] = [];
  let pipelines: any[] = [];
  let projects: any[] = [];
  let teams: any[] = [];
  let taskNodes: any[] = [];
  let users: any[] = [];

  try {
    // @ts-ignore
    deals = await Deal.find({}).lean();
    targets = await Target.find({}).lean();
    pipelines = await Pipeline.find({ category: "Finance" }).populate("projectId teamId taskId").sort({ progress: -1 }).lean();
    projects = await Project.find({}, { name: 1 }).lean();
    teams = await Team.find({}, { name: 1 }).lean();
    taskNodes = await TaskNode.find({}, { name: 1 }).lean();
    users = await User.find({}, { name: 1 }).lean();
  } catch (err) {
    console.error(err);
  }

  // Convert ObjectIds to strings
  const cleanDeals = deals.map((d: any) => ({
    _id: d._id.toString(),
    name: d.name,
    amount: d.amount,
    stage: d.stage,
  }));

  const cleanTargets = targets.map((t: any) => ({
    _id: t._id.toString(),
    name: t.name,
  }));

  const cleanPipelines = pipelines.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
    progress: p.progress,
    category: p.category,
    owner: p.owner,
    priority: p.priority,
    status: p.status,
    startDate: p.startDate ? new Date(p.startDate).toISOString() : null,
    endDate: p.endDate ? new Date(p.endDate).toISOString() : null,
    riskLevel: p.riskLevel,
    objectives: p.objectives,
    kpis: p.kpis,
    projectId: p.projectId ? { _id: p.projectId._id?.toString(), name: p.projectId.name } : null,
    teamId: p.teamId ? { _id: p.teamId._id?.toString(), name: p.teamId.name } : null,
    taskId: p.taskId ? { _id: p.taskId._id?.toString(), name: p.taskId.name } : null,
    memberIds: Array.isArray(p.memberIds) ? p.memberIds.map((m: any) => m.toString()) : [],
    todos: Array.isArray(p.todos)
      ? p.todos.map((todo: any) => ({
          _id: todo._id ? todo._id.toString() : Math.random().toString(),
          text: todo.text || "",
          completed: Boolean(todo.completed),
          assigneeType: todo.assigneeType || "Individual",
          assigneeName: todo.assigneeName || "",
        }))
      : [],
  }));

  const options = {
    projects: projects.map(p => ({ id: p._id.toString(), name: p.name })),
    teams: teams.map(t => ({ id: t._id.toString(), name: t.name })),
    tasks: taskNodes.map(t => ({ id: t._id.toString(), name: t.name })),
    users: users.map(u => ({ id: u._id.toString(), name: u.name })),
  };

  return <RevenueDashboardClient deals={cleanDeals} targets={cleanTargets} pipelines={cleanPipelines} options={options} />;
}
