import connectToDatabase from "@/lib/mongodb";
import { Project, TaskNode, Pipeline, Cycle } from "@/models";
import DevDashboardClient from "@/app/dev/dashboard/DevDashboardClient";

export default async function DevDashboardPage(
  props: { searchParams: Promise<{ projectId?: string }> }
) {
  const searchParams = await props.searchParams;
  await connectToDatabase();

  const selectedProjectId = searchParams?.projectId || "all";

  let projects: any[] = [];
  let tasks: any[] = [];
  let pipelines: any[] = [];
  let cycles: any[] = [];

  try {
    projects = await Project.find({}).lean();
    pipelines = await Pipeline.find({}).sort({ progress: -1 }).lean();
    if (selectedProjectId && selectedProjectId !== "all") {
      tasks = await TaskNode.find({ projectId: selectedProjectId }).lean();
      cycles = await Cycle.find({ project: selectedProjectId }).lean();
    } else {
      tasks = await TaskNode.find({}).lean();
      cycles = await Cycle.find({}).lean();
    }
  } catch (err) {
    console.error(err);
  }

  // Calculate dynamic metrics
  let totalPipelineProgress = 0;
  pipelines.forEach((p: any) => {
    totalPipelineProgress += (p.progress || 0);
  });
  const avgPipelineProgress = pipelines.length > 0
    ? (totalPipelineProgress / pipelines.length).toFixed(1)
    : 0;

  // Calculate average cycle time
  let totalCycleDays = 0;
  let validCycles = 0;
  cycles.forEach((c: any) => {
    if (c.startDate && c.endDate) {
      const start = new Date(c.startDate).getTime();
      const end = new Date(c.endDate).getTime();
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) {
        totalCycleDays += diffDays;
        validCycles++;
      }
    }
  });
  const avgCycleTime = validCycles > 0 ? Math.round(totalCycleDays / validCycles) : 0;

  // Calculate dynamic metrics
  let totalHours = 0;
  let severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  let statusCounts = { open: 0, in_progress: 0, review: 0, completed: 0 };
  let moduleHours: Record<string, { estimated: number, actual: number }> = {};

  tasks.forEach((t: any) => {
    totalHours += (t.actualHours || 0);

    const mod = t.module || "General";
    if (!moduleHours[mod]) moduleHours[mod] = { estimated: 0, actual: 0 };
    moduleHours[mod].estimated += (t.estimatedHours || 0);
    moduleHours[mod].actual += (t.actualHours || 0);

    if (t.severity) {
      // @ts-ignore
      severityCounts[t.severity] = (severityCounts[t.severity] || 0) + 1;
    } else {
      severityCounts.medium += 1;
    }

    if (t.status === 'completed') statusCounts.completed += 1;
    else if (t.status === 'review') statusCounts.review += 1;
    else if (t.status === 'in_progress') statusCounts.in_progress += 1;
    else statusCounts.open += 1;
  });

  const modules = Object.keys(moduleHours);
  const estimatedHoursData = modules.map(m => moduleHours[m].estimated);
  const actualHoursData = modules.map(m => moduleHours[m].actual);

  const chartData = {
    severity: [severityCounts.critical, severityCounts.high, severityCounts.medium, severityCounts.low],
    status: [statusCounts.open, statusCounts.in_progress, statusCounts.review, statusCounts.completed],
    totalHours,
    modules,
    estimatedHoursData,
    actualHoursData
  };

  // Convert ObjectIds to strings for passing to client components
  const cleanProjects = projects.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
  }));

  const cleanTasks = tasks.map((t: any) => ({
    _id: t._id.toString(),
    name: t.name,
  }));

  const cleanPipelines = pipelines
    .filter((p: any) => p.category === "Development")
    .map((p: any) => ({
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

  return (
    <DevDashboardClient
      projects={cleanProjects}
      tasks={cleanTasks}
      pipelines={cleanPipelines}
      avgPipelineProgress={avgPipelineProgress}
      avgCycleTime={avgCycleTime}
      selectedProjectId={selectedProjectId}
      chartData={chartData}
    />
  );
}
