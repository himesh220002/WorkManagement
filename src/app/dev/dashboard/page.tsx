import connectToDatabase from "@/lib/mongodb";
import { Project, TaskNode, Pipeline } from "@/models";
import DevDashboardClient from "@/app/dev/dashboard/DevDashboardClient";

export default async function DevDashboardPage({
  searchParams,
}: {
  searchParams: { projectId?: string };
}) {
  await connectToDatabase();

  const selectedProjectId = searchParams.projectId || "all";

  let projects: any[] = [];
  let tasks: any[] = [];
  let pipelines: any[] = [];

  try {
    projects = await Project.find({}).lean();
    pipelines = await Pipeline.find({}).sort({ progress: -1 }).lean();
    if (selectedProjectId && selectedProjectId !== "all") {
      tasks = await TaskNode.find({ projectId: selectedProjectId }).lean();
    } else {
      tasks = await TaskNode.find({}).lean();
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

  // Calculate dynamic metrics
  let totalHours = 0;
  let severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  let statusCounts = { open: 0, in_progress: 0, review: 0, completed: 0 };

  tasks.forEach((t: any) => {
    totalHours += (t.actualHours || 0);

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

  const chartData = {
    severity: [severityCounts.critical, severityCounts.high, severityCounts.medium, severityCounts.low],
    status: [statusCounts.open, statusCounts.in_progress, statusCounts.review, statusCounts.completed],
    totalHours
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

  const cleanPipelines = pipelines.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
    progress: p.progress,
    category: p.category,
    owner: p.owner,
    priority: p.priority,
    status: p.status
  }));

  return (
    <DevDashboardClient
      projects={cleanProjects}
      tasks={cleanTasks}
      pipelines={cleanPipelines}
      avgPipelineProgress={avgPipelineProgress}
      selectedProjectId={selectedProjectId}
      chartData={chartData}
    />
  );
}
