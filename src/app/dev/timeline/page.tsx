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
    tasks = await Pipeline.find({}).lean();
    projects = await Project.find({}, { name: 1 }).lean();
    teams = await Team.find({}, { name: 1 }).lean();
    taskNodes = await TaskNode.find({}, { name: 1 }).lean();
    users = await User.find({}, { name: 1 }).lean();
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
    projectId: t.projectId ? t.projectId.toString() : "",
    teamId: t.teamId ? t.teamId.toString() : "",
    taskId: t.taskId ? t.taskId.toString() : "",
    memberId: t.memberId ? t.memberId.toString() : "",
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
    users: users.map(u => ({ id: u._id.toString(), name: u.name })),
  };

  return <TimelineClient tasks={cleanTasks} options={options} />;
}
