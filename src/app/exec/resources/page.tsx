import connectToDatabase from "@/lib/mongodb";
import { ResourceAllocation, Project } from "@/models";
import ResourceDashboardClient from "./ResourceDashboardClient";

export default async function ResourceDashboardPage() {
  await connectToDatabase();

  let resources: any[] = [];
  let projects: any[] = [];

  try {
    resources = await ResourceAllocation.find({}).populate("assignedToProjectId").lean();
    projects = await Project.find({}).lean();
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
