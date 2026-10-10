"use server";

import connectToDatabase from "@/lib/mongodb";
import { Pipeline, TaskNode, Lead, Campaign, Deal, Target, Goal, Team, User, Project, ResourceAllocation, Cycle } from "@/models";
import { revalidatePath as nextRevalidatePath } from "next/cache";
import { getCurrentSession } from "@/server/auth/session";
import { invalidateAllAppCaches } from "@/lib/cache";
import { syncTenantWrite } from "@/lib/tenantDb";
import { computePipelineProgress } from "@/utils/pipelineProgress";

function revalidatePath(path: string) {
  invalidateAllAppCaches();
  nextRevalidatePath(path);
}

function assertNotGuest(session: { isGuest?: boolean; userId?: string | null }) {
  if (session.isGuest || !session.userId) {
    throw new Error("Authentication required. Please log in or subscribe to modify workspace data.");
  }
}

export async function getAssigneeOptions() {
  await connectToDatabase();
  const users = await User.find({}).select('name').lean();
  const teams = await Team.find({}).select('name').lean();
  
  return {
    users: users.map(u => ({ id: (u as any)._id.toString(), name: (u as any).name })),
    teams: teams.map(t => ({ id: (t as any)._id.toString(), name: (t as any).name }))
  };
}

export async function addPipeline(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const owner = formData.get("owner") as string;
  const status = formData.get("status") as string;
  const priority = formData.get("priority") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const progress = Number(formData.get("progress")) || 0;
  const objectives = formData.get("objectives") as string;
  const budget = formData.get("budget") as string;
  const kpis = formData.get("kpis") as string;
  const riskLevel = formData.get("riskLevel") as string;
  const dependencies = formData.get("dependencies") as string;
  const outcome = formData.get("outcome") as string;
  
  const projectId = formData.get("projectId") as string || undefined;
  let teamId = formData.get("teamId") as string || undefined;
  const taskId = formData.get("taskId") as string || undefined;
  const memberIds = formData.getAll("memberIds") as string[];
  const predefinedCreateTaskName = formData.get("createTaskName") as string || undefined;
  const customTaskName = formData.get("customTaskName") as string || undefined;
  const createTaskName = customTaskName || predefinedCreateTaskName;
  const newTeamName = formData.get("newTeamName") as string || undefined;
  
  const cashFlowProjectionUSD = Number(formData.get("cashFlowProjectionUSD")) || 0;
  const expensesUSD = Number(formData.get("expensesUSD")) || 0;
  const roiPercent = Number(formData.get("roiPercent")) || 0;

  if (name) {
    let finalTaskId = taskId;

    // Generate Team on the fly if provided
    if (newTeamName) {
      const newTeam = await Team.create({ name: newTeamName, members: memberIds, companyId: session.companyId });
      teamId = newTeam._id.toString();
    }

    // If both project and team are linked, assign team to project
    if (projectId && teamId) {
      await Project.findByIdAndUpdate(projectId, { $addToSet: { teams: teamId } });
    }

    // Auto-create initial task if requested
    if (createTaskName && projectId) {
      const assigneeArray = memberIds.length > 0 ? memberIds : undefined;
      const newTask = await TaskNode.create({
        name: createTaskName,
        description: `Auto-generated task from pipeline: ${name}`,
        projectId: projectId,
        companyId: session.companyId,
        assignee: memberIds.length > 0 ? memberIds[0] : "Unassigned", // Legacy string
        assignees: assigneeArray, // Real ID reference
        status: "Todo",
        priority: priority ? priority.toLowerCase() : "medium",
        dueDate: endDate
      });
      finalTaskId = newTask._id.toString();
    }

    const newPipe = await Pipeline.create({ 
      name, category, owner, status, priority, startDate, endDate, progress, objectives, budget, kpis, riskLevel, dependencies, outcome,
      projectId, teamId, taskId: finalTaskId, memberIds,
      cashFlowProjectionUSD, expensesUSD, roiPercent,
      companyId: session.companyId,
    } as any);
    await syncTenantWrite("Pipeline", "create", newPipe, undefined, session.companyCode);
    
    revalidatePath("/dev/timeline");
    revalidatePath("/sales/dashboard");
    revalidatePath("/revenue/dashboard");
    revalidatePath("/projects");
  }
}

function parseChecklistField(formData: FormData): { text: string; completed: boolean }[] {
  const raw = formData.get("checklist");
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: any) => {
        if (typeof item === "string") return { text: item.trim(), completed: false };
        return {
          text: String(item?.text || "").trim(),
          completed: Boolean(item?.completed),
        };
      })
      .filter((item) => item.text.length > 0)
      .slice(0, 20);
  } catch {
    return [];
  }
}

function defaultLeadChecklist(lead: any, campaignName?: string): { text: string; completed: boolean }[] {
  return [
    { text: `Contact ${lead?.contactName || lead?.owner || "lead"}`, completed: false },
    { text: `Source: ${lead?.source || "Inbound"}`, completed: false },
    { text: campaignName || "Direct inbound", completed: false },
  ];
}

export async function addLead(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const name = formData.get("name") as string;
  const owner = formData.get("owner") as string;
  const status = (formData.get("status") as string) || "New";
  const contactName = (formData.get("contactName") as string) || "";
  const source = (formData.get("source") as string) || "Manual Entry";
  const campaignIdRaw = (formData.get("campaignId") as string) || "";
  const priority = (formData.get("priority") as string) || "Medium";
  let checklist = parseChecklistField(formData);

  if (name) {
    const newLead = await Lead.create({
      name,
      owner,
      status,
      contactName,
      priority,
      source,
      campaignId: campaignIdRaw || undefined,
      checklist,
      companyId: session.companyId,
    });
    await syncTenantWrite("Lead", "create", newLead, undefined, session.companyCode);
    revalidatePath("/sales/dashboard");
  }
}

export async function addCampaign(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const name = formData.get("name") as string;
  const leadsGenerated = Number(formData.get("leadsGenerated")) || 0;
  const expectedRevenue = Number(formData.get("expectedRevenue")) || 0;

  if (name) {
    const newCamp = await Campaign.create({ name, leadsGenerated, expectedRevenue, companyId: session.companyId });
    await syncTenantWrite("Campaign", "create", newCamp, undefined, session.companyCode);
    revalidatePath("/sales/dashboard");
  }
}

function defaultDealChecklist(deal: any): { text: string; completed: boolean }[] {
  return [
    { text: `Contact ${deal?.contactName || deal?.owner || deal?.client?.name || "client"}`, completed: false },
    { text: `Value: $${Number(deal?.amount || 0).toLocaleString()}`, completed: false },
    { text: deal?.client?.name ? `Account: ${deal.client.name}` : "Confirm scope", completed: false },
  ];
}

export async function addDeal(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const name = formData.get("name") as string;
  const amount = Number(formData.get("amount")) || 0;
  const stage = formData.get("stage") as string;
  const clientName = formData.get("clientName") as string;
  const clientIndustry = formData.get("clientIndustry") as string;
  const clientRegion = formData.get("clientRegion") as string;
  const expectedCloseDate = formData.get("expectedCloseDate") as string;
  const priority = formData.get("priority") as string || "Medium";
  const riskLevel = formData.get("riskLevel") as string || "Low";
  const owner = (formData.get("owner") as string) || "";
  const contactName = (formData.get("contactName") as string) || "";
  const campaignIdRaw = (formData.get("campaignId") as string) || "";
  let checklist = parseChecklistField(formData);

  if (name) {
    const data: any = { 
      name, 
      amount, 
      stage,
      owner,
      contactName,
      checklist,
      client: {
        name: clientName,
        industry: clientIndustry,
        region: clientRegion
      },
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
      metadata: {
        priority,
        riskLevel
      },
      companyId: session.companyId,
    };
    if (formData.get("projectId")) data.projectId = formData.get("projectId");
    if (formData.get("pipelineId")) data.pipelineId = formData.get("pipelineId");
    if (campaignIdRaw) data.campaignId = campaignIdRaw;
    const newDeal = await Deal.create(data);
    await syncTenantWrite("Deal", "create", newDeal, undefined, session.companyCode);
    revalidatePath("/revenue/dashboard");
  }
}

export async function updateDealStage(dealId: string, stage: string) {
  await connectToDatabase();
  await Deal.findByIdAndUpdate(dealId, { stage });
  const session = await getCurrentSession();
  assertNotGuest(session);
  await syncTenantWrite("Deal", "update", dealId, { stage }, session.companyCode);
  revalidatePath("/revenue/dashboard");
}

export async function updateDeal(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const dealId = formData.get("dealId") as string;
  const name = formData.get("name") as string;
  const amount = Number(formData.get("amount")) || 0;
  const stage = formData.get("stage") as string;
  const projectId = formData.get("projectId") as string;
  const pipelineId = formData.get("pipelineId") as string;
  const clientName = formData.get("clientName") as string;
  const clientIndustry = formData.get("clientIndustry") as string;
  const clientRegion = formData.get("clientRegion") as string;
  const expectedCloseDate = formData.get("expectedCloseDate") as string;
  const priority = formData.get("priority") as string;
  const riskLevel = formData.get("riskLevel") as string;
  const owner = formData.get("owner") as string;
  const contactName = formData.get("contactName") as string;
  const campaignId = formData.get("campaignId") as string;
  const checklist = parseChecklistField(formData);
  const hasChecklistField = formData.has("checklist");

  if (!dealId) throw new Error("Missing dealId — deal update aborted, nothing was saved.");
  {
    const data: any = { name, amount, stage };
    if (projectId !== undefined) data.projectId = projectId || null;
    if (pipelineId !== undefined) data.pipelineId = pipelineId || null;
    if (campaignId !== undefined) data.campaignId = campaignId || null;
    if (owner !== undefined && owner !== null) data.owner = owner;
    if (contactName !== undefined && contactName !== null) data.contactName = contactName;
    if (clientName !== undefined) data["client.name"] = clientName;
    if (clientIndustry !== undefined) data["client.industry"] = clientIndustry;
    if (clientRegion !== undefined) data["client.region"] = clientRegion;
    if (expectedCloseDate) data.expectedCloseDate = new Date(expectedCloseDate);
    if (priority) data["metadata.priority"] = priority;
    if (riskLevel) data["metadata.riskLevel"] = riskLevel;
    if (hasChecklistField) data.checklist = checklist;
    
    await Deal.findByIdAndUpdate(dealId, data);
    const session = await getCurrentSession();
    await syncTenantWrite("Deal", "update", dealId, data, session.companyCode);
    revalidatePath("/revenue/dashboard");
  }
}

export async function toggleDealChecklistItem(dealId: string, index: number) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const deal = await Deal.findById(dealId);
  if (!deal) throw new Error("Deal not found");
  let checklist: { text: string; completed: boolean }[] = Array.isArray((deal as any).checklist)
    ? (deal as any).checklist.map((c: any) => ({ text: String(c.text), completed: Boolean(c.completed) }))
    : [];
  if (checklist.length === 0) {
    checklist = defaultDealChecklist(deal);
  }
  if (index < 0 || index >= checklist.length) throw new Error("Checklist item not found");
  checklist[index].completed = !checklist[index].completed;
  await Deal.findByIdAndUpdate(dealId, { checklist });
  await syncTenantWrite("Deal", "update", dealId, { checklist }, session.companyCode);
  revalidatePath("/revenue/dashboard");
}

export async function deleteDeal(formData: FormData) {
  await connectToDatabase();
  const dealId = formData.get("dealId") as string;
  if (dealId) {
    await Deal.findByIdAndDelete(dealId);
    const session = await getCurrentSession();
  assertNotGuest(session);
    await syncTenantWrite("Deal", "delete", dealId, undefined, session.companyCode);
    revalidatePath("/revenue/dashboard");
  }
}

export async function updateLeadStatus(leadId: string, status: string) {
  await connectToDatabase();
  await Lead.findByIdAndUpdate(leadId, { status });
  const session = await getCurrentSession();
  assertNotGuest(session);
  await syncTenantWrite("Lead", "update", leadId, { status }, session.companyCode);
  revalidatePath("/sales/dashboard");
}

export async function updateLead(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const leadId = formData.get("leadId") as string;
  const name = formData.get("name") as string;
  const owner = formData.get("owner") as string;
  const status = formData.get("status") as string;
  const source = formData.get("source") as string;
  const campaignId = formData.get("campaignId") as string;
  const contactName = formData.get("contactName") as string;
  const priority = formData.get("priority") as string;
  const checklist = parseChecklistField(formData);
  const hasChecklistField = formData.has("checklist");

  if (!leadId) throw new Error("Missing leadId — lead update aborted, nothing was saved.");
  {
    const data: any = { name, owner, status, source };
    if (contactName !== undefined) data.contactName = contactName;
    if (priority) data.priority = priority;
    if (campaignId !== undefined) data.campaignId = campaignId || null;
    if (hasChecklistField) data.checklist = checklist;
    await Lead.findByIdAndUpdate(leadId, data);
    const session = await getCurrentSession();
    await syncTenantWrite("Lead", "update", leadId, data, session.companyCode);
    revalidatePath("/sales/dashboard");
  }
}

export async function toggleLeadChecklistItem(leadId: string, index: number) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const lead = await Lead.findById(leadId);
  if (!lead) throw new Error("Lead not found");
  let checklist: { text: string; completed: boolean }[] = Array.isArray((lead as any).checklist)
    ? (lead as any).checklist.map((c: any) => ({ text: String(c.text), completed: Boolean(c.completed) }))
    : [];
  if (checklist.length === 0) {
    let campaignName = "Direct inbound";
    if ((lead as any).campaignId) {
      try {
        const c = await Campaign.findById((lead as any).campaignId).lean() as any;
        if (c?.name) campaignName = c.name;
      } catch { /* keep default */ }
    }
    checklist = defaultLeadChecklist(lead, campaignName);
  }
  if (index < 0 || index >= checklist.length) throw new Error("Checklist item not found");
  checklist[index].completed = !checklist[index].completed;
  await Lead.findByIdAndUpdate(leadId, { checklist });
  await syncTenantWrite("Lead", "update", leadId, { checklist }, session.companyCode);
  revalidatePath("/sales/dashboard");
}

export async function deleteLead(formData: FormData) {
  await connectToDatabase();
  const leadId = formData.get("leadId") as string;
  if (leadId) {
    await Lead.findByIdAndDelete(leadId);
    const session = await getCurrentSession();
  assertNotGuest(session);
    await syncTenantWrite("Lead", "delete", leadId, undefined, session.companyCode);
    revalidatePath("/sales/dashboard");
  }
}

export async function updateCampaign(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const campaignId = formData.get("campaignId") as string;
  const name = formData.get("name") as string;
  const leadsGenerated = Number(formData.get("leadsGenerated")) || 0;
  const expectedRevenue = Number(formData.get("expectedRevenue")) || 0;
  const projectId = formData.get("projectId") as string;
  const pipelineId = formData.get("pipelineId") as string;

  if (campaignId) {
    const data: any = { name, leadsGenerated, expectedRevenue };
    if (projectId !== undefined) data.projectId = projectId || null;
    if (pipelineId !== undefined) data.pipelineId = pipelineId || null;
    await Campaign.findByIdAndUpdate(campaignId, data);
    const session = await getCurrentSession();
    await syncTenantWrite("Campaign", "update", campaignId, data, session.companyCode);
    revalidatePath("/sales/dashboard");
  }
}

export async function deleteCampaign(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const campaignId = formData.get("campaignId") as string;
  if (campaignId) {
    await Campaign.findByIdAndDelete(campaignId);
    const session = await getCurrentSession();
    await syncTenantWrite("Campaign", "delete", campaignId, undefined, session.companyCode);
    revalidatePath("/sales/dashboard");
  }
}

export async function addGoal(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = (formData.get("category") as string) || "Company";

  if (title) {
    const newGoal = await Goal.create({ title, description, category, companyId: session.companyId });
    await syncTenantWrite("Goal", "create", newGoal, undefined, session.companyCode);
    revalidatePath("/exec/dashboard");
  }
}

export async function addTeam(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const name = formData.get("name") as string;
  if (name) {
    const newTeam = await Team.create({ name, companyId: session.companyId });
    await syncTenantWrite("Team", "create", newTeam, undefined, session.companyCode);
    revalidatePath("/projects");
    revalidatePath("/teams");
    revalidatePath("/diagrams");
  }
}

export async function deleteTeam(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const id = formData.get("teamId") as string;
  if (id) {
    await Team.findByIdAndDelete(id);
    const session = await getCurrentSession();
    await syncTenantWrite("Team", "delete", id, undefined, session.companyCode);
    revalidatePath("/teams");
    revalidatePath("/projects");
    revalidatePath("/diagrams");
  }
}

export async function addUser(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const name = formData.get("name") as string;
  const role = formData.get("role") as string || "Member";
  if (name) {
    await User.create({ name, role });
    revalidatePath("/projects");
  }
}

export async function addProject(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = (formData.get("category") as string) || "Internal";

  if (name) {
    const newProj = await Project.create({
      name,
      description,
      category,
      companyId: session.companyId,
      ownerId: session.userId,
    } as any);
    await syncTenantWrite("Project", "create", newProj, undefined, session.companyCode);
    revalidatePath("/projects");
  }
}

export async function addTarget(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const name = formData.get("name") as string;
  const industry = formData.get("industry") as string;
  const region = formData.get("region") as string;
  const goalId = formData.get("goalId") as string;
  const expectedValue = Number(formData.get("expectedValue")) || 100;
  const actualValue = Number(formData.get("actualValue")) || 0;

  if (name) {
    const data: any = { name, industry, region, expectedValue, actualValue, companyId: session.companyId };
    if (goalId) data.goalId = goalId;
    const newTarget = await Target.create(data);
    await syncTenantWrite("Target", "create", newTarget, undefined, session.companyCode);
    revalidatePath("/revenue/dashboard");
    revalidatePath("/revenue/targets");
  }
}

export async function toggleTargetChecklist(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const targetId = formData.get("targetId") as string;
  const taskIndex = Number(formData.get("taskIndex"));

  if (targetId) {
    const target = await Target.findById(targetId);
    if (target && target.checklist && target.checklist[taskIndex]) {
      target.checklist[taskIndex].isCompleted = !target.checklist[taskIndex].isCompleted;
      await target.save();
    }
    revalidatePath("/revenue/targets");
  }
}

export async function updateTargetChecklist(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const targetId = formData.get("targetId") as string;
  const taskName = formData.get("taskName") as string;

  if (targetId && taskName) {
    const target = await Target.findById(targetId);
    if (target) {
      if (!target.checklist) target.checklist = [];
      target.checklist.push({ name: taskName, isCompleted: false });
      await target.save();
    }
    revalidatePath("/revenue/targets");
  }
}

export async function updatePipeline(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const pipelineId = formData.get("pipelineId") as string;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const priority = formData.get("priority") as string;
  const status = formData.get("status") as string;
  const riskLevel = formData.get("riskLevel") as string;
  const budget = Number(formData.get("budget")) || 0;
  const objectives = formData.get("objectives") as string;

  if (pipelineId) {
    const updateObj = {
      name,
      category,
      priority,
      status,
      riskLevel,
      budget,
      objectives,
    };
    await Pipeline.findByIdAndUpdate(pipelineId, updateObj);
    const session = await getCurrentSession();
    await syncTenantWrite("Pipeline", "update", pipelineId, updateObj, session.companyCode);
    revalidatePath("/sales/dashboard");
    revalidatePath("/revenue/dashboard");
    revalidatePath("/dev/timeline");
    revalidatePath("/projects");
  }
}

export async function updatePipelineProgress(taskId: string, progress: number) {
  await connectToDatabase();
  if (taskId && taskId !== "demo1") {
    await Pipeline.findByIdAndUpdate(taskId, { progress });
    const session = await getCurrentSession();
  assertNotGuest(session);
    await syncTenantWrite("Pipeline", "update", taskId, { progress }, session.companyCode);
    revalidatePath("/dev/timeline");
  }
}

export async function updatePipelineDates(taskId: string, startDate: string, endDate: string) {
  await connectToDatabase();
  if (taskId && taskId !== "demo1") {
    await Pipeline.findByIdAndUpdate(taskId, { startDate, endDate });
    const session = await getCurrentSession();
  assertNotGuest(session);
    await syncTenantWrite("Pipeline", "update", taskId, { startDate, endDate }, session.companyCode);
    revalidatePath("/dev/timeline");
  }
}

function revalidatePipelineSurfaces() {
  revalidatePath("/dev/timeline");
  revalidatePath("/dev/dashboard");
  revalidatePath("/dev");
  revalidatePath("/exec/dashboard");
  revalidatePath("/exec");
  revalidatePath("/revenue/dashboard");
  revalidatePath("/sales/dashboard");
  revalidatePath("/projects");
  revalidatePath("/diagrams");
  revalidatePath("/my-work");
}

/**
 * Single source of truth for pipeline progress.
 * Major workstreams = pipeline checklist todos; granular deliverables =
 * TaskNodes linked via pipelineId. Progress blends both (same formula as
 * computePipelineProgress in @/utils/pipelineProgress), so completing
 * dev-dashboard tasks moves every pipeline bar (timeline, cards, mesh,
 * gantt, sales, revenue, projects) together with checklist ticks.
 */
export async function recomputePipelineProgress(pipelineId: string): Promise<number | null> {
  if (!pipelineId) return null;
  await connectToDatabase();
  const session = await getCurrentSession();
  const pipeline = await Pipeline.findById(pipelineId);
  if (!pipeline) return null;
  const todos = Array.isArray((pipeline as any).todos) ? (pipeline as any).todos : [];
  const linked = await TaskNode.find({ pipelineId: (pipeline as any)._id }).select("status").lean();
  const progress = computePipelineProgress(
    { progress: Number((pipeline as any).progress || 0), todos },
    Array.isArray(linked) ? linked : []
  );
  await Pipeline.findByIdAndUpdate(pipelineId, { progress });
  await syncTenantWrite("Pipeline", "update", pipelineId, { progress }, session.companyCode);
  revalidatePipelineSurfaces();
  return progress;
}

export async function addPipelineTodo(pipelineId: string, formData: FormData) {
  const session = await getCurrentSession();
  assertNotGuest(session);
  const text = formData.get("text") as string;
  const assigneeType = (formData.get("assigneeType") as string) || "Individual";
  const assigneeName = (formData.get("assigneeName") as string) || "";

  if (!text) return;
  await connectToDatabase();
  const pipeline = await Pipeline.findById(pipelineId);
  if (pipeline) {
    if (!Array.isArray(pipeline.todos)) pipeline.todos = [];
    pipeline.todos.push({ text, completed: false, assigneeType, assigneeName } as any);
    await pipeline.save();
    await syncTenantWrite("Pipeline", "update", pipelineId, { todos: pipeline.todos }, session.companyCode);
    await recomputePipelineProgress(pipelineId);
    revalidatePath("/dev/timeline");
    revalidatePath("/dev/dashboard");
    revalidatePath("/dev");
    revalidatePath("/exec/dashboard");
    revalidatePath("/exec");
    revalidatePath("/revenue/dashboard");
  }
}

export async function togglePipelineTodo(pipelineId: string, todoId: string, completed: boolean) {
  const session = await getCurrentSession();
  assertNotGuest(session);
  await connectToDatabase();
  const pipeline = await Pipeline.findById(pipelineId);
  if (pipeline) {
    const todo = pipeline.todos?.find(
      (t: any) => t._id?.toString() === todoId?.toString()
    );
    if (todo) {
      todo.completed = completed;
    } else if (typeof (pipeline.todos as any)?.id === "function") {
      const sub = (pipeline.todos as any).id(todoId);
      if (sub) sub.completed = completed;
    }
    await pipeline.save();
    await syncTenantWrite("Pipeline", "update", pipelineId, { todos: pipeline.todos }, session.companyCode);
    await recomputePipelineProgress(pipelineId);
    revalidatePath("/dev/timeline");
    revalidatePath("/dev/dashboard");
    revalidatePath("/dev");
    revalidatePath("/exec/dashboard");
    revalidatePath("/exec");
    revalidatePath("/revenue/dashboard");
  }
}

export async function deletePipelineTodo(pipelineId: string, todoId: string) {
  const session = await getCurrentSession();
  assertNotGuest(session);
  await connectToDatabase();
  const pipeline = await Pipeline.findById(pipelineId);
  if (pipeline) {
    pipeline.todos = (pipeline.todos || []).filter(
      (t: any) => t._id?.toString() !== todoId?.toString()
    ) as any;
    await pipeline.save();
    await syncTenantWrite("Pipeline", "update", pipelineId, { todos: pipeline.todos }, session.companyCode);
    await recomputePipelineProgress(pipelineId);
    revalidatePath("/dev/timeline");
    revalidatePath("/dev/dashboard");
    revalidatePath("/dev");
    revalidatePath("/exec/dashboard");
    revalidatePath("/exec");
    revalidatePath("/revenue/dashboard");
  }
}

export async function reorderPipelineTodos(pipelineId: string, todos: any[]) {
  const session = await getCurrentSession();
  assertNotGuest(session);
  await connectToDatabase();
  const cleanTodos = todos.map((todo) => {
    // If _id is a temporary optimistic UI ID (not 24 char hex), strip it so Mongoose generates a valid ObjectId
    if (todo._id && todo._id.length !== 24) {
      const { _id, ...rest } = todo;
      return rest;
    }
    return todo;
  });
  await Pipeline.findByIdAndUpdate(pipelineId, { todos: cleanTodos });
  await syncTenantWrite("Pipeline", "update", pipelineId, { todos: cleanTodos }, session.companyCode);
  await recomputePipelineProgress(pipelineId);
  revalidatePath("/dev/timeline");
  revalidatePath("/dev/dashboard");
  revalidatePath("/dev");
  revalidatePath("/exec/dashboard");
  revalidatePath("/exec");
  revalidatePath("/revenue/dashboard");
}

export async function deletePipeline(formData: FormData) {
  const session = await getCurrentSession();
  assertNotGuest(session);
  const pipelineId = formData.get("pipelineId") as string;
  if (!pipelineId) return;
  await connectToDatabase();
  await Pipeline.findByIdAndDelete(pipelineId);
  await syncTenantWrite("Pipeline", "delete", pipelineId, undefined, session.companyCode);
  revalidatePath("/dev/timeline");
}

export async function addResourceAllocation(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const name = formData.get("name") as string;
  const type = (formData.get("type") as string) || "Budget";
  const totalAllocated = Number(formData.get("totalAllocated")) || 0;
  const totalUsed = Number(formData.get("totalUsed")) || 0;
  const riskLevel = (formData.get("riskLevel") as string) || "Low";
  const assignedToProjectId = formData.get("assignedToProjectId") as string;
  const linkedDealId = formData.get("linkedDealId") as string;

  if (name) {
    const data: any = { name, type, totalAllocated, totalUsed, riskLevel, companyId: session.companyId };
    if (assignedToProjectId) data.assignedToProjectId = assignedToProjectId;
    if (linkedDealId) data.linkedDealId = linkedDealId;
    
    const newRes = await ResourceAllocation.create(data);
    await syncTenantWrite("ResourceAllocation", "create", newRes, undefined, session.companyCode);
    revalidatePath("/exec/resources");
    revalidatePath("/revenue/dashboard");
  }
}

export async function updateResourceAllocation(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const type = (formData.get("type") as string) || "Budget";
  const totalAllocated = Number(formData.get("totalAllocated")) || 0;
  const totalUsed = Number(formData.get("totalUsed")) || 0;
  const riskLevel = (formData.get("riskLevel") as string) || "Low";
  const assignedToProjectId = formData.get("assignedToProjectId") as string;
  const linkedDealId = formData.get("linkedDealId") as string;

  if (id && name) {
    const filter: any = { _id: id };
    if (session.companyId) filter.companyId = session.companyId;

    const updateData: any = {
      name,
      type,
      totalAllocated,
      totalUsed,
      riskLevel,
    };
    if (assignedToProjectId) updateData.assignedToProjectId = assignedToProjectId;
    else updateData.$unset = { assignedToProjectId: 1 };
    if (linkedDealId) updateData.linkedDealId = linkedDealId;

    await ResourceAllocation.updateOne(filter, updateData);
    await syncTenantWrite("ResourceAllocation", "update", id, updateData, session.companyCode);
    revalidatePath("/exec/resources");
    revalidatePath("/revenue/dashboard");
  }
}

export async function deleteResourceAllocation(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const id = formData.get("id") as string;
  if (id) {
    const filter: any = { _id: id };
    if (session.companyId) filter.companyId = session.companyId;
    await ResourceAllocation.deleteOne(filter);
    await syncTenantWrite("ResourceAllocation", "delete", id, undefined, session.companyCode);
    revalidatePath("/exec/resources");
    revalidatePath("/revenue/dashboard");
  }
}

export async function addTaskNode(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const rawName = formData.get("name") as string;
  const predefinedTask = formData.get("predefinedTask") as string;
  const name = predefinedTask ? (rawName ? `${predefinedTask} - ${rawName}` : predefinedTask) : rawName;
  const projectId = formData.get("projectId") as string;
  const status = (formData.get("status") as string) || "Todo";
  const severity = (formData.get("severity") as string) || "medium";
  const module = (formData.get("module") as string) || "General";
  const estimatedHours = Number(formData.get("estimatedHours")) || 0;
  const actualHours = Number(formData.get("actualHours")) || 0;
  const pipelineId = formData.get("pipelineId") as string;
  const cycleId = formData.get("cycleId") as string;
  
  let targetProjectId = projectId;
  if (!targetProjectId || targetProjectId === "all") {
    const firstProj = await Project.findOne(
      session.companyId ? { companyId: session.companyId } : {}
    ).lean();
    if (firstProj) targetProjectId = (firstProj as any)._id.toString();
  }

  if (name && targetProjectId && targetProjectId !== "all") {
    const data: any = {
      name,
      projectId: targetProjectId,
      status,
      severity,
      module,
      estimatedHours,
      actualHours,
      companyId: session.companyId,
    };
    if (pipelineId && pipelineId !== "none") data.pipelineId = pipelineId;
    if (cycleId && cycleId !== "none") data.cycleId = cycleId;
    
    const newTask = await TaskNode.create(data);
    await syncTenantWrite("TaskNode", "create", newTask, undefined, session.companyCode);
    if (data.pipelineId) await recomputePipelineProgress(String(data.pipelineId));
    revalidatePath("/dev/dashboard");
    revalidatePath("/dev/timeline");
    revalidatePath("/exec/dashboard");
  }
}

export async function updateTaskNode(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const taskId = formData.get("taskId") as string;
  const name = formData.get("name") as string;
  const status = formData.get("status") as string;
  const severity = formData.get("severity") as string;
  const estimatedHours = Number(formData.get("estimatedHours")) || 0;
  const actualHours = Number(formData.get("actualHours")) || 0;
  const pipelineId = formData.get("pipelineId") as string;
  const cycleId = formData.get("cycleId") as string;

  if (taskId) {
    const updateData: any = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (severity) updateData.severity = severity;
    if (formData.has("estimatedHours")) updateData.estimatedHours = estimatedHours;
    if (formData.has("actualHours")) updateData.actualHours = actualHours;
    if (pipelineId) updateData.pipelineId = pipelineId === "none" ? null : pipelineId;
    if (cycleId) updateData.cycleId = cycleId === "none" ? null : cycleId;

    const before = await TaskNode.findById(taskId).select("pipelineId").lean() as any;
    const oldPipelineId = before?.pipelineId ? String(before.pipelineId) : null;
    await TaskNode.findByIdAndUpdate(taskId, updateData);
    await syncTenantWrite("TaskNode", "update", taskId, updateData, session.companyCode);
    // Keep linked pipelines in sync: granular deliverable status moves pipeline bars.
    const newPipelineId = updateData.pipelineId
      ? String(updateData.pipelineId)
      : oldPipelineId;
    if (newPipelineId) await recomputePipelineProgress(newPipelineId);
    if (oldPipelineId && oldPipelineId !== newPipelineId) {
      await recomputePipelineProgress(oldPipelineId);
    }
    revalidatePath("/dev/dashboard");
    revalidatePath("/dev/timeline");
    revalidatePath("/exec/dashboard");
  }
}

export async function addCycle(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const name = formData.get("name") as string;
  const project = formData.get("projectId") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  let targetProject = project;
  if (!targetProject || targetProject === "all") {
    const firstProj = await Project.findOne(
      session.companyId ? { companyId: session.companyId } : {}
    ).lean();
    if (firstProj) targetProject = (firstProj as any)._id.toString();
  }

  if (name && targetProject && targetProject !== "all") {
    const cycleData = {
      name,
      project: targetProject,
      companyId: session.companyId,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
    };
    const newCycle = await Cycle.create(cycleData);
    await syncTenantWrite("Cycle", "create", newCycle, undefined, session.companyCode);
    revalidatePath("/dev/dashboard");
    revalidatePath("/dev/timeline");
    revalidatePath("/exec/dashboard");
  }
}

export async function deleteGoal(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const goalId = formData.get("goalId") as string;
  if (goalId) {
    await Goal.findByIdAndDelete(goalId);
    await Target.deleteMany({ goalId: goalId });
    const session = await getCurrentSession();
    await syncTenantWrite("Goal", "delete", goalId, undefined, session.companyCode);
    await syncTenantWrite("Target", "delete", { goalId }, undefined, session.companyCode);
    revalidatePath("/exec/dashboard");
    revalidatePath("/revenue/targets");
  }
}

export async function updateGoal(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const goalId = formData.get("goalId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;

  if (goalId) {
    await Goal.findByIdAndUpdate(goalId, { title, description, category });
    const session = await getCurrentSession();
    await syncTenantWrite("Goal", "update", goalId, { title, description, category }, session.companyCode);
    revalidatePath("/exec/dashboard");
    revalidatePath("/revenue/targets");
  }
}

export async function deleteTarget(formData: FormData) {
  await connectToDatabase();
  const targetId = formData.get("targetId") as string;
  if (targetId) {
    await Target.findByIdAndDelete(targetId);
    const session = await getCurrentSession();
  assertNotGuest(session);
    await syncTenantWrite("Target", "delete", targetId, undefined, session.companyCode);
    revalidatePath("/revenue/targets");
    revalidatePath("/exec/dashboard");
  }
}

export async function updateTarget(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const targetId = formData.get("targetId") as string;
  const name = formData.get("name") as string;
  const expectedValue = Number(formData.get("expectedValue")) || 0;
  const actualValue = Number(formData.get("actualValue")) || 0;
  const industry = formData.get("industry") as string;
  const region = formData.get("region") as string;
  const status = formData.get("status") as string;
  const goalId = formData.get("goalId") as string;

  if (targetId) {
    const updateData: any = {
      name,
      expectedValue,
      actualValue,
      industry,
      region,
      status
    };
    if (goalId !== undefined) {
      updateData.goalId = goalId || null;
    }
    await Target.findByIdAndUpdate(targetId, updateData);
    const session = await getCurrentSession();
    await syncTenantWrite("Target", "update", targetId, updateData, session.companyCode);
    revalidatePath("/revenue/targets");
    revalidatePath("/exec/dashboard");
  }
}

// --- New Global Member Actions ---
export async function registerUser(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;
  const position = formData.get("position") as string;
  const rank = formData.get("rank") as string;

  if (name && role) {
    await User.create({ name, role, position, rank });
    revalidatePath("/teams");
  }
}

export async function updateUserProfile(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const userId = formData.get("userId") as string;
  const status = formData.get("status") as string;
  const joinedDateStr = formData.get("joinedDate") as string;
  const leftDateStr = formData.get("leftDate") as string;
  const details = formData.get("details") as string;

  if (userId) {
    const updateData: any = { status, details };
    if (joinedDateStr) updateData.joinedDate = new Date(joinedDateStr);
    if (leftDateStr) updateData.leftDate = new Date(leftDateStr);
    else updateData.leftDate = null;

    await User.findByIdAndUpdate(userId, updateData);
    revalidatePath("/teams");
  }
}

export async function linkUserToTeam(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const teamId = formData.get("teamId") as string;
  const userId = formData.get("userId") as string;

  if (teamId && userId) {
    await Team.findByIdAndUpdate(teamId, { $addToSet: { members: userId } });
    revalidatePath("/teams");
    revalidatePath("/diagrams");
  }
}

export async function unlinkUserFromTeam(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const teamId = formData.get("teamId") as string;
  const userId = formData.get("userId") as string;

  if (teamId && userId) {
    await Team.findByIdAndUpdate(teamId, { $pull: { members: userId } });
    revalidatePath("/teams");
    revalidatePath("/diagrams");
  }
}

export async function updateMemberMeritStats(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const userId = formData.get("userId") as string;
  const performanceScore = Number(formData.get("performanceScore"));
  const completedProjectsCount = Number(formData.get("completedProjectsCount"));
  const currentProjectsCount = Number(formData.get("currentProjectsCount"));
  const relevancyScore = Number(formData.get("relevancyScore"));
  const supervisorRating = Number(formData.get("supervisorRating"));
  const teamLeadRating = Number(formData.get("teamLeadRating"));
  const remarks = formData.get("remarks") as string;

  if (userId) {
    const updateData: any = {};
    if (!isNaN(performanceScore)) updateData.performanceScore = performanceScore;
    if (!isNaN(completedProjectsCount)) updateData.completedProjectsCount = completedProjectsCount;
    if (!isNaN(currentProjectsCount)) updateData.currentProjectsCount = currentProjectsCount;
    if (!isNaN(relevancyScore)) updateData.relevancyScore = relevancyScore;
    if (!isNaN(supervisorRating)) updateData.supervisorRating = supervisorRating;
    if (!isNaN(teamLeadRating)) updateData.teamLeadRating = teamLeadRating;
    if (remarks !== undefined) updateData.remarks = remarks;

    await User.findByIdAndUpdate(userId, updateData);
    revalidatePath("/teams");
    revalidatePath("/diagrams");
  }
}

export async function promoteMemberByMerit(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);
  const userId = formData.get("userId") as string;
  const newRank = formData.get("newRank") as string;

  if (userId && newRank) {
    await User.findByIdAndUpdate(userId, { rank: newRank });
    revalidatePath("/teams");
    revalidatePath("/diagrams");
    revalidatePath("/about");
  }
}

import {
  provisionMemberAction as _provisionMemberAction,
  updateMemberRoleTagAction as _updateMemberRoleTagAction,
  assignProjectStaffAction as _assignProjectStaffAction,
  updateProjectAgendasAction as _updateProjectAgendasAction,
  submitProjectChangeRequestAction as _submitProjectChangeRequestAction,
  reviewProjectChangeRequestAction as _reviewProjectChangeRequestAction,
  archiveMemberAction as _archiveMemberAction,
  restoreMemberAction as _restoreMemberAction,
  resignMemberAction as _resignMemberAction,
} from "./member";

export async function provisionMemberAction(formData: FormData) {
  return _provisionMemberAction(formData);
}

export async function updateMemberRoleTagAction(formData: FormData) {
  return _updateMemberRoleTagAction(formData);
}

export async function assignProjectStaffAction(formData: FormData) {
  return _assignProjectStaffAction(formData);
}

export async function updateProjectAgendasAction(formData: FormData) {
  return _updateProjectAgendasAction(formData);
}

export async function submitProjectChangeRequestAction(formData: FormData) {
  return _submitProjectChangeRequestAction(formData);
}

export async function reviewProjectChangeRequestAction(formData: FormData) {
  return _reviewProjectChangeRequestAction(formData);
}

export async function archiveMemberAction(formData: FormData) {
  return _archiveMemberAction(formData);
}

export async function restoreMemberAction(formData: FormData) {
  return _restoreMemberAction(formData);
}

export async function resignMemberAction(formData: FormData) {
  return _resignMemberAction(formData);
}
