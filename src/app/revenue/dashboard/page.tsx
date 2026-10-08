import connectToDatabase from "@/lib/mongodb";
import { Deal, Target, Pipeline, Project, Team, TaskNode, User, ResourceAllocation } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import RevenueDashboardClient from "@/app/revenue/dashboard/RevenueDashboardClient";
import { fetchWithCache } from "@/lib/cache";

export default async function RevenueDashboardPage() {
  await connectToDatabase();
  const session = await getCurrentSession();
  const tenantFilter = getTenantQueryFilter(session);
  const cId = session.companyId || "default";

  let deals: any[] = [];
  let targets: any[] = [];
  let pipelines: any[] = [];
  let projects: any[] = [];
  let teams: any[] = [];
  let taskNodes: any[] = [];
  let users: any[] = [];
  let resources: any[] = [];

  try {
    [deals, targets, pipelines, projects, teams, taskNodes, users, resources] = await Promise.all([
      fetchWithCache(`rev_deals:${cId}`, 30, () => Deal.find(tenantFilter).lean()),
      fetchWithCache(`rev_targets:${cId}`, 30, () => Target.find(tenantFilter).lean()),
      fetchWithCache(`rev_pipelines:${cId}`, 30, () =>
        Pipeline.find({ ...tenantFilter, category: { $in: ["Finance", "Sales"] } })
          .populate("projectId teamId taskId")
          .sort({ progress: -1 })
          .lean()
      ),
      fetchWithCache(`rev_projects:${cId}`, 30, () => Project.find(tenantFilter, { name: 1 }).lean()),
      fetchWithCache(`rev_teams:${cId}`, 30, () => Team.find(tenantFilter, { name: 1 }).lean()),
      fetchWithCache(`rev_tasknodes:${cId}`, 30, () => TaskNode.find(tenantFilter, { name: 1 }).lean()),
      fetchWithCache(`rev_users:${cId}`, 30, () => User.find(tenantFilter, { name: 1 }).lean()),
      fetchWithCache(`rev_resources:${cId}`, 30, () =>
        ResourceAllocation.find(tenantFilter).populate("assignedToProjectId").lean()
      ),
    ]);
  } catch (err) {
    console.error(err);
  }

  // Convert ObjectIds to strings
  const cleanDeals = deals.map((d: any) => ({
    _id: d._id.toString(),
    name: d.name,
    amount: d.amount,
    stage: d.stage,
    client: d.client ? { ...d.client } : null,
    expectedCloseDate: d.expectedCloseDate ? new Date(d.expectedCloseDate).toISOString() : null,
    status: d.status,
    metadata: d.metadata ? { ...d.metadata } : null,
    projectId: d.projectId ? d.projectId.toString() : null,
    pipelineId: d.pipelineId ? d.pipelineId.toString() : null,
  }));

  const cleanTargets = targets.map((t: any) => ({
    _id: t._id.toString(),
    name: t.name,
    achievedRevenueUSD: t.achievedRevenueUSD || 0,
    conversionRate: t.conversionRate || "0%",
    targetByRegion: t.targetByRegion || {},
    industry: t.industry || null,
    region: t.region || null,
    expectedValue: t.expectedValue || 0,
    actualValue: t.actualValue || 0,
    goalId: t.goalId ? t.goalId.toString() : null,
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
    cashFlowProjectionUSD: p.cashFlowProjectionUSD || 0,
    expensesUSD: p.expensesUSD || 0,
    roiPercent: p.roiPercent || 0,
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

  const cleanResources = resources.map((r: any) => ({
    _id: r._id.toString(),
    name: r.name,
    type: r.type,
    totalAllocated: r.totalAllocated,
    totalUsed: r.totalUsed,
    riskLevel: r.riskLevel,
    linkedDealId: r.linkedDealId ? r.linkedDealId.toString() : null,
    assignedToProjectId: r.assignedToProjectId ? { _id: r.assignedToProjectId._id.toString(), name: r.assignedToProjectId.name } : null
  }));

  return (
    <RevenueDashboardClient
      deals={cleanDeals}
      targets={cleanTargets}
      pipelines={cleanPipelines}
      resources={cleanResources}
      options={options}
      currentRole={session.role}
      currentUserId={session.userId}
      currentUserName={session.name}
    />
  );
}
