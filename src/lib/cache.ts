import { updateTag, revalidateTag, revalidatePath } from "next/cache";

export const CACHE_TAGS = {
  company: (companyId: string) => `company:${companyId}`,
  companies: () => "companies",
  project: (projectId: string) => `project:${projectId}`,
  projects: (companyId?: string) => (companyId ? `projects:${companyId}` : "projects"),
  team: (teamId: string) => `team:${teamId}`,
  teams: (projectId?: string) => (projectId ? `teams:${projectId}` : "teams"),
  task: (taskId: string) => `task:${taskId}`,
  tasks: (projectId?: string) => (projectId ? `tasks:${projectId}` : "tasks"),
  goal: (goalId: string) => `goal:${goalId}`,
  goals: (scopeId?: string) => (scopeId ? `goals:${scopeId}` : "goals"),
  pipeline: (pipelineId: string) => `pipeline:${pipelineId}`,
  pipelines: (projectId?: string) => (projectId ? `pipelines:${projectId}` : "pipelines"),
  deal: (dealId: string) => `deal:${dealId}`,
  deals: () => "deals",
  leads: () => "leads",
  resources: (projectId?: string) => (projectId ? `resources:${projectId}` : "resources"),
  metrics: (scopeId?: string) => (scopeId ? `metrics:${scopeId}` : "metrics"),
};

export function invalidateEntity(tag: string) {
  try {
    if (typeof updateTag === "function") {
      updateTag(tag);
    } else {
      revalidateTag(tag, "default");
    }
  } catch (err) {
    // In dev or non-request context updateTag might be a no-op
  }
}

export function refreshPath(path: string) {
  try {
    revalidatePath(path);
  } catch (err) {}
}
