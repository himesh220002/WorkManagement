import connectToDatabase from "@/lib/mongodb";
import { Project, Task, Team, Pipeline, IProject } from "@/models";
import { serializeDoc, serializeDocs } from "@/lib/serialize";
import { computeTaskStats, computeHealth, computeExpectedProgress } from "@/utils/rollup";

export async function getProjects(companyId?: string) {
  await connectToDatabase();
  const query = companyId ? { companyId } : {};
  const projects = await Project.find(query).populate("teams").lean();
  return serializeDocs<IProject>(projects);
}

export async function getProjectById(projectId: string) {
  await connectToDatabase();
  const project = await Project.findById(projectId).populate("teams").lean();
  return serializeDoc<IProject>(project);
}

export async function getProjectHubDetails(projectId: string) {
  await connectToDatabase();

  const [project, tasks, teams, pipelines] = await Promise.all([
    Project.findById(projectId).populate("teams").lean(),
    Task.find({ projectId }).populate("assigneeIds").lean(),
    Team.find({ projectIds: projectId }).populate("members").populate("leadId").lean(),
    Pipeline.find({ projectId }).populate("ownerId").lean(),
  ]);

  if (!project) return null;

  const taskStats = computeTaskStats(tasks as any);
  const expectedProgress = computeExpectedProgress({
    startDate: project.startDate,
    endDate: project.deadline,
  });

  const calculatedHealth = computeHealth(
    taskStats.progressPercent,
    expectedProgress,
    taskStats.blockedRatio
  );

  return {
    project: serializeDoc(project),
    taskStats,
    calculatedHealth,
    expectedProgress,
    tasks: serializeDocs(tasks),
    teams: serializeDocs(teams),
    pipelines: serializeDocs(pipelines),
  };
}
