import connectToDatabase from "@/lib/mongodb";
import { ResourceAllocation, Project } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import ResourceDashboardClient from "./ResourceDashboardClient";
import { fetchWithCache } from "@/lib/cache";

export default async function ResourceDashboardPage() {
  await connectToDatabase();
  const session = await getCurrentSession();
  const tenantFilter = getTenantQueryFilter(session);
  const cId = session.companyId || "default";

  let resources: any[] = [];
  let projects: any[] = [];

  try {
    [resources, projects] = await Promise.all([
      fetchWithCache(`resource_allocations:${cId}`, 30, () =>
        ResourceAllocation.find(tenantFilter).populate("assignedToProjectId").lean()
      ),
      fetchWithCache(`resource_projects:${cId}`, 30, () =>
        Project.find(tenantFilter).lean()
      ),
    ]);
  } catch (err) {
    console.error(err);
  }

  // Convert ObjectIds to strings
  const cleanResources = resources.map((r: any) => ({
    _id: r._id.toString(),
    name: r.name,
    type: r.type,
    totalAllocated: r.totalAllocated,
    totalUsed: r.totalUsed,
    riskLevel: r.riskLevel,
    assignedToProjectName: r.assignedToProjectId?.name || "Unassigned",
  }));

  const cleanProjects = projects.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
  }));

  return <ResourceDashboardClient resources={cleanResources} projects={cleanProjects} />;
}
