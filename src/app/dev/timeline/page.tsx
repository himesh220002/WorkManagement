import connectToDatabase from "@/lib/mongodb";
import { Pipeline, Project, Team, TaskNode, User } from "@/models";
import TimelineClient from "@/app/dev/timeline/TimelineClient";

export default async function TimelinePage() {
  await connectToDatabase();

  let tasks: any[] = [];
  let projects: any[] = [];
  let teams: any[] = [];
  let taskNodes: any[] = [];
  let users: any[] = [];

  try {
    tasks = await Pipeline.find({}).populate("projectId teamId taskId").lean();
    projects = await Project.find({}, { name: 1 }).lean();
    teams = await Team.find({}, { name: 1 }).lean();
    taskNodes = await TaskNode.find({}, { name: 1 }).lean();
    users = await User.find({}, { name: 1, role: 1, position: 1, rank: 1 }).lean();
  } catch (err) {
    console.error(err);
  }

  // Map backend tasks to clean strings
  const cleanTasks = tasks.map((t: any) => ({
    _id: t._id.toString(),
    name: t.name,
    category: t.category || "General",
    owner: t.owner || "Unassigned",
    status: t.status || "Active",
    startDate: t.startDate ? new Date(t.startDate).toISOString() : null,
    endDate: t.endDate ? new Date(t.endDate).toISOString() : null,
    progress: t.progress || 0,
    priority: t.priority || "Medium",
    objectives: t.objectives || "",
    dependencies: t.dependencies || "",
    budget: t.budget || "",
    kpis: t.kpis || "",
    tags: t.tags || "",
    riskLevel: t.riskLevel || "Low",
    notes: t.notes || "",
    projectId: t.projectId ? { _id: t.projectId._id?.toString(), name: t.projectId.name } : null,
    teamId: t.teamId ? { _id: t.teamId._id?.toString(), name: t.teamId.name } : null,
    taskId: t.taskId ? { _id: t.taskId._id?.toString(), name: t.taskId.name } : null,
    memberIds: Array.isArray(t.memberIds) ? t.memberIds.map((m: any) => m.toString()) : [],
    todos: Array.isArray(t.todos)
      ? t.todos.map((todo: any) => ({
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
    users: users.map(u => ({ 
      id: u._id.toString(), 
      name: `${u.name} - ${u.role} ${u.position ? `(${u.position})` : ''} - Rank ${u.rank || 1}` 
    })),
  };

  const projectMetrics = projects.map((p: any) => {
    const pIdStr = p._id.toString();
    const pPipelines = cleanTasks.filter(t => t.projectId && t.projectId._id === pIdStr);
    
    if (pPipelines.length === 0) {
      return {
        _id: pIdStr,
        name: p.name,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        progress: 0,
      };
    }

    let minStart = new Date(pPipelines[0].startDate || Date.now());
    let maxEnd = new Date(pPipelines[0].endDate || Date.now());
    let totalProgress = 0;

    pPipelines.forEach(pipe => {
      const pStart = new Date(pipe.startDate || Date.now());
      const pEnd = new Date(pipe.endDate || Date.now());
      if (pStart < minStart) minStart = pStart;
      if (pEnd > maxEnd) maxEnd = pEnd;
      totalProgress += (pipe.progress || 0);
    });

    const avgProgress = Math.round(totalProgress / pPipelines.length);

    return {
      _id: pIdStr,
      name: p.name,
      startDate: minStart.toISOString(),
      endDate: maxEnd.toISOString(),
      progress: avgProgress,
    };
  });

  return <TimelineClient tasks={cleanTasks} options={options} projectMetrics={projectMetrics} />;
}
