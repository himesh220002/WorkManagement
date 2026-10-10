import connectToDatabase from "@/lib/mongodb";
import { ResourceAllocation, Project, Team, User, Deal, Campaign, Pipeline } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import ResourceDashboardClient from "./ResourceDashboardClient";
import { fetchWithCache } from "@/lib/cache";

export const metadata = {
  title: "Resource Allocation & Capacity | TaskPMS",
  description:
    "Enterprise resource allocation envelopes, capital budgets, headcount capacity, and burn rate tracking",
};

export default async function ResourceDashboardPage() {
  await connectToDatabase();
  const session = await getCurrentSession();
  const tenantFilter = getTenantQueryFilter(session);
  const cId = session.companyId || "default";

  let resources: any[] = [];
  let projects: any[] = [];
  let teams: any[] = [];
  let users: any[] = [];
  let deals: any[] = [];
  let campaigns: any[] = [];
  let pipelines: any[] = [];

  try {
    [resources, projects, teams, users, deals, campaigns, pipelines] = await Promise.all([
      fetchWithCache(`resource_allocations:${cId}`, 30, () =>
        ResourceAllocation.find(tenantFilter)
          .populate("assignedToProjectId", "name status")
          .populate("linkedDealId", "name amount stage")
          .populate("teamId", "name")
          .lean()
      ),
      fetchWithCache(`resource_projects:${cId}`, 30, () =>
        Project.find(tenantFilter).lean()
      ),
      fetchWithCache(`resource_teams:${cId}`, 30, () =>
        Team.find(tenantFilter).lean()
      ),
      fetchWithCache(`resource_users:${cId}`, 30, () =>
        User.find(tenantFilter).lean()
      ),
      fetchWithCache(`resource_deals:${cId}`, 30, () =>
        Deal.find(tenantFilter).lean()
      ),
      fetchWithCache(`resource_campaigns:${cId}`, 30, () =>
        Campaign.find(tenantFilter).lean()
      ),
      fetchWithCache(`resource_pipelines:${cId}`, 30, () =>
        Pipeline.find(tenantFilter).lean()
      ),
    ]);
  } catch (err) {
    console.error("Error loading resource dashboard data:", err);
  }

  // Convert ObjectIds to strings & clean
  const cleanResources = resources.map((r: any) => ({
    _id: r._id.toString(),
    name: r.name,
    type: r.type || "Budget",
    totalAllocated: Number(r.totalAllocated || 0),
    totalUsed: Number(r.totalUsed || 0),
    riskLevel: r.riskLevel || "Low",
    assignedToProjectId: r.assignedToProjectId?._id
      ? r.assignedToProjectId._id.toString()
      : r.assignedToProjectId
      ? r.assignedToProjectId.toString()
      : null,
    assignedToProjectName: r.assignedToProjectId?.name || "Unassigned",
    linkedDealId: r.linkedDealId?._id
      ? r.linkedDealId._id.toString()
      : r.linkedDealId
      ? r.linkedDealId.toString()
      : null,
    linkedDealName: r.linkedDealId?.name || null,
    teamId: r.teamId?._id
      ? r.teamId._id.toString()
      : r.teamId
      ? r.teamId.toString()
      : null,
    teamName: r.teamId?.name || null,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
  }));

  const cleanProjects = projects.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
  }));

  const cleanTeams = teams.map((t: any) => ({
    _id: t._id.toString(),
    name: t.name,
    membersCount: Array.isArray(t.members) ? t.members.length : 0,
  }));

  const cleanUsers = users.map((u: any) => ({
    _id: u._id.toString(),
    name: u.name,
    role: u.role || "Member",
    position: u.position || "Staff",
    capacityHoursPerWeek: Number(u.capacityHoursPerWeek || 40),
    status: u.status || "Working",
    skills: Array.isArray(u.skills) ? u.skills : [],
  }));

  const cleanDeals = deals.map((d: any) => ({
    _id: d._id.toString(),
    name: d.name,
    amount: Number(d.amount || d.revenue || 0),
    stage: d.stage || "Prospect",
  }));

  const cleanCampaigns = campaigns.map((c: any) => ({
    _id: c._id.toString(),
    name: c.name,
    type: c.type || "Marketing",
    leadsGenerated: Number(c.leadsGenerated || 0),
    expectedRevenue: Number(c.expectedRevenue || 0),
  }));

  const cleanPipelines = pipelines.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
    category: p.category || "General",
    status: p.status || "Active",
    progress: Number(p.progress || 0),
    dealValue: Number(p.dealValue || 0),
    dealStage: p.dealStage || "",
    winProbability: Number(p.winProbability || 0),
  }));

  return (
    <ResourceDashboardClient
      resources={cleanResources}
      projects={cleanProjects}
      teams={cleanTeams}
      users={cleanUsers}
      deals={cleanDeals}
      campaigns={cleanCampaigns}
      pipelines={cleanPipelines}
      companyCode={session.companyCode || ""}
      userRole={session.role}
    />
  );
}
