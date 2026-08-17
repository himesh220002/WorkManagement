"use server";

import connectToDatabase from "@/lib/mongodb";
import { Pipeline, TaskNode, Lead, Campaign, Deal, Target, Goal, Team, User, Project, ResourceAllocation, Cycle } from "@/models";
import { revalidatePath } from "next/cache";

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
      const newTeam = await Team.create({ name: newTeamName, members: memberIds });
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
        assignee: memberIds.length > 0 ? memberIds[0] : "Unassigned", // Legacy string
        assignees: assigneeArray, // Real ID reference
        status: "Todo",
        priority: priority ? priority.toLowerCase() : "medium",
        dueDate: endDate
      });
      finalTaskId = newTask._id.toString();
    }

    await Pipeline.create({ 
      name, category, owner, status, priority, startDate, endDate, progress, objectives, budget, kpis, riskLevel, dependencies, outcome,
      projectId, teamId, taskId: finalTaskId, memberIds,
      cashFlowProjectionUSD, expensesUSD, roiPercent
    } as any);
    
    revalidatePath("/dev/timeline");
    revalidatePath("/sales/dashboard");
    revalidatePath("/revenue/dashboard");
    revalidatePath("/projects");
  }
}

export async function addLead(formData: FormData) {
  await connectToDatabase();
  const name = formData.get("name") as string;
  const owner = formData.get("owner") as string;
  const status = formData.get("status") as string;

  if (name) {
    await Lead.create({ name, owner, status, source: "Manual Entry" });
    revalidatePath("/sales/dashboard");
  }
}

export async function addCampaign(formData: FormData) {
  await connectToDatabase();
  const name = formData.get("name") as string;
  const leadsGenerated = Number(formData.get("leadsGenerated")) || 0;
  const expectedRevenue = Number(formData.get("expectedRevenue")) || 0;

  if (name) {
    await Campaign.create({ name, leadsGenerated, expectedRevenue });
    revalidatePath("/sales/dashboard");
  }
}

export async function addDeal(formData: FormData) {
  await connectToDatabase();
  const name = formData.get("name") as string;
  const amount = Number(formData.get("amount")) || 0;
  const stage = formData.get("stage") as string;
  const clientName = formData.get("clientName") as string;
  const clientIndustry = formData.get("clientIndustry") as string;
  const clientRegion = formData.get("clientRegion") as string;
  const expectedCloseDate = formData.get("expectedCloseDate") as string;
  const priority = formData.get("priority") as string || "Medium";
  const riskLevel = formData.get("riskLevel") as string || "Low";

  if (name) {
    const data: any = { 
      name, 
      amount, 
      stage,
      client: {
        name: clientName,
        industry: clientIndustry,
        region: clientRegion
      },
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
      metadata: {
        priority,
        riskLevel
      }
    };
    if (formData.get("projectId")) data.projectId = formData.get("projectId");
    if (formData.get("pipelineId")) data.pipelineId = formData.get("pipelineId");
    await Deal.create(data);
    revalidatePath("/revenue/dashboard");
  }
}

export async function updateDealStage(dealId: string, stage: string) {
  await connectToDatabase();
  await Deal.findByIdAndUpdate(dealId, { stage });
  revalidatePath("/revenue/dashboard");
}

export async function updateDeal(formData: FormData) {
  await connectToDatabase();
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

  if (dealId) {
    const data: any = { name, amount, stage };
    if (projectId !== undefined) data.projectId = projectId || null;
    if (pipelineId !== undefined) data.pipelineId = pipelineId || null;
    if (clientName !== undefined) data["client.name"] = clientName;
    if (clientIndustry !== undefined) data["client.industry"] = clientIndustry;
    if (clientRegion !== undefined) data["client.region"] = clientRegion;
    if (expectedCloseDate) data.expectedCloseDate = new Date(expectedCloseDate);
    if (priority) data["metadata.priority"] = priority;
    if (riskLevel) data["metadata.riskLevel"] = riskLevel;
    
    await Deal.findByIdAndUpdate(dealId, data);
    revalidatePath("/revenue/dashboard");
  }
}

export async function deleteDeal(formData: FormData) {
  await connectToDatabase();
  const dealId = formData.get("dealId") as string;
  if (dealId) {
    await Deal.findByIdAndDelete(dealId);
    revalidatePath("/revenue/dashboard");
  }
}

export async function updateLeadStatus(leadId: string, status: string) {
  await connectToDatabase();
  await Lead.findByIdAndUpdate(leadId, { status });
  revalidatePath("/sales/dashboard");
}

export async function updateLead(formData: FormData) {
  await connectToDatabase();
  const leadId = formData.get("leadId") as string;
  const name = formData.get("name") as string;
  const owner = formData.get("owner") as string;
  const status = formData.get("status") as string;
  const source = formData.get("source") as string;
  const campaignId = formData.get("campaignId") as string;

  if (leadId) {
    const data: any = { name, owner, status, source };
    if (campaignId !== undefined) data.campaignId = campaignId || null;
    await Lead.findByIdAndUpdate(leadId, data);
    revalidatePath("/sales/dashboard");
  }
}

export async function deleteLead(formData: FormData) {
  await connectToDatabase();
  const leadId = formData.get("leadId") as string;
  if (leadId) {
    await Lead.findByIdAndDelete(leadId);
    revalidatePath("/sales/dashboard");
  }
}

export async function updateCampaign(formData: FormData) {
  await connectToDatabase();
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
    revalidatePath("/sales/dashboard");
  }
}

export async function deleteCampaign(formData: FormData) {
  await connectToDatabase();
  const campaignId = formData.get("campaignId") as string;
  if (campaignId) {
    await Campaign.findByIdAndDelete(campaignId);
    revalidatePath("/sales/dashboard");
  }
}

export async function addGoal(formData: FormData) {
  await connectToDatabase();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string || "Company";

  if (title) {
    await Goal.create({ title, description, category });
    revalidatePath("/exec/dashboard");
  }
}

export async function addTeam(formData: FormData) {
  await connectToDatabase();
  const name = formData.get("name") as string;
  if (name) {
    await Team.create({ name });
    revalidatePath("/projects");
  }
}

export async function addUser(formData: FormData) {
  await connectToDatabase();
  const name = formData.get("name") as string;
  const role = formData.get("role") as string || "Member";
  if (name) {
    await User.create({ name, role });
    revalidatePath("/projects");
  }
}

export async function addProject(formData: FormData) {
  await connectToDatabase();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string || "Internal";

  if (name) {
    await Project.create({ name, description, category } as any);
    revalidatePath("/projects");
  }
}

export async function addTarget(formData: FormData) {
  await connectToDatabase();
  const name = formData.get("name") as string;
  const industry = formData.get("industry") as string;
  const region = formData.get("region") as string;
  const goalId = formData.get("goalId") as string;
  const expectedValue = Number(formData.get("expectedValue")) || 100;
  const actualValue = Number(formData.get("actualValue")) || 0;

  if (name) {
    const data: any = { name, industry, region, expectedValue, actualValue };
    if (goalId) data.goalId = goalId;
    await Target.create(data);
    revalidatePath("/revenue/dashboard");
    revalidatePath("/revenue/targets");
  }
}

export async function toggleTargetChecklist(formData: FormData) {
  await connectToDatabase();
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
  const targetId = formData.get("targetId") as string;
  const taskName = formData.get("taskName") as string;

  if (targetId && taskName) {
    const target = await Target.findById(targetId);
    if (target) {
      target.checklist.push({ name: taskName, isCompleted: false });
      await target.save();
    }
    revalidatePath("/revenue/targets");
  }
}

export async function updatePipelineProgress(taskId: string, progress: number) {
  await connectToDatabase();
  if (taskId && taskId !== "demo1") {
    await Pipeline.findByIdAndUpdate(taskId, { progress });
    revalidatePath("/dev/timeline");
  }
}

export async function updatePipelineDates(taskId: string, startDate: string, endDate: string) {
  await connectToDatabase();
  if (taskId && taskId !== "demo1") {
    await Pipeline.findByIdAndUpdate(taskId, { startDate, endDate });
    revalidatePath("/dev/timeline");
  }
}

export async function addPipelineTodo(pipelineId: string, formData: FormData) {
  const text = formData.get("text") as string;
  const assigneeType = formData.get("assigneeType") as string || "Individual";
  const assigneeName = formData.get("assigneeName") as string || "";
  
  if (!text) return;
  await connectToDatabase();
  await Pipeline.findByIdAndUpdate(pipelineId, {
    $push: { todos: { text, completed: false, assigneeType, assigneeName } }
  });
  revalidatePath("/dev/timeline");
}

export async function togglePipelineTodo(pipelineId: string, todoId: string, completed: boolean) {
  await connectToDatabase();
  await Pipeline.updateOne(
    { _id: pipelineId, "todos._id": todoId },
    { $set: { "todos.$.completed": completed } }
  );
  revalidatePath("/dev/timeline");
}

export async function deletePipelineTodo(pipelineId: string, todoId: string) {
  await connectToDatabase();
  await Pipeline.findByIdAndUpdate(pipelineId, {
    $pull: { todos: { _id: todoId } }
  });
  revalidatePath("/dev/timeline");
}

export async function reorderPipelineTodos(pipelineId: string, todos: any[]) {
  await connectToDatabase();
  const cleanTodos = todos.map(todo => {
    // If _id is a temporary optimistic UI ID (not 24 char hex), strip it so Mongoose generates a valid ObjectId
    if (todo._id && todo._id.length !== 24) {
      const { _id, ...rest } = todo;
      return rest;
    }
    return todo;
  });
  await Pipeline.findByIdAndUpdate(pipelineId, { todos: cleanTodos });
  revalidatePath("/dev/timeline");
}

export async function deletePipeline(formData: FormData) {
  const pipelineId = formData.get("pipelineId") as string;
  if (!pipelineId) return;
  await connectToDatabase();
  await Pipeline.findByIdAndDelete(pipelineId);
  revalidatePath("/dev/timeline");
}

export async function addResourceAllocation(formData: FormData) {
  await connectToDatabase();
  const name = formData.get("name") as string;
  const type = formData.get("type") as string || "Budget";
  const totalAllocated = Number(formData.get("totalAllocated")) || 0;
  const totalUsed = Number(formData.get("totalUsed")) || 0;
  const riskLevel = formData.get("riskLevel") as string || "Low";
  const assignedToProjectId = formData.get("assignedToProjectId") as string;
  const linkedDealId = formData.get("linkedDealId") as string;

  if (name) {
    const data: any = { name, type, totalAllocated, totalUsed, riskLevel };
    if (assignedToProjectId) data.assignedToProjectId = assignedToProjectId;
    if (linkedDealId) data.linkedDealId = linkedDealId;
    
    await ResourceAllocation.create(data);
    revalidatePath("/exec/resources");
    revalidatePath("/revenue/dashboard");
  }
}

export async function addTaskNode(formData: FormData) {
  await connectToDatabase();
  const rawName = formData.get("name") as string;
  const predefinedTask = formData.get("predefinedTask") as string;
  const name = predefinedTask ? (rawName ? `${predefinedTask} - ${rawName}` : predefinedTask) : rawName;
  const projectId = formData.get("projectId") as string;
  const status = formData.get("status") as string || "open";
  const severity = formData.get("severity") as string || "medium";
  const module = formData.get("module") as string || "General";
  const estimatedHours = Number(formData.get("estimatedHours")) || 0;
  const actualHours = Number(formData.get("actualHours")) || 0;
  const pipelineId = formData.get("pipelineId") as string;
  const cycleId = formData.get("cycleId") as string;
  
  if (name && projectId && projectId !== "all") {
    const data: any = { name, projectId, status, severity, module, estimatedHours, actualHours };
    if (pipelineId && pipelineId !== "none") data.pipelineId = pipelineId;
    if (cycleId && cycleId !== "none") data.cycleId = cycleId;
    
    await TaskNode.create(data);
    revalidatePath("/dev/dashboard");
  }
}

export async function updateTaskNode(formData: FormData) {
  await connectToDatabase();
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

    await TaskNode.findByIdAndUpdate(taskId, updateData);
    revalidatePath("/dev/dashboard");
  }
}

export async function addCycle(formData: FormData) {
  await connectToDatabase();
  const name = formData.get("name") as string;
  const project = formData.get("projectId") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  if (name && project && project !== "all") {
    await Cycle.create({
      name, project, startDate, endDate
    });
    revalidatePath("/dev/dashboard");
  }
}

export async function deleteGoal(formData: FormData) {
  await connectToDatabase();
  const goalId = formData.get("goalId") as string;
  if (goalId) {
    await Goal.findByIdAndDelete(goalId);
    await Target.deleteMany({ goalId: goalId });
    revalidatePath("/exec/dashboard");
    revalidatePath("/revenue/targets");
  }
}

export async function updateGoal(formData: FormData) {
  await connectToDatabase();
  const goalId = formData.get("goalId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;

  if (goalId) {
    await Goal.findByIdAndUpdate(goalId, { title, description, category });
    revalidatePath("/exec/dashboard");
    revalidatePath("/revenue/targets");
  }
}

export async function deleteTarget(formData: FormData) {
  await connectToDatabase();
  const targetId = formData.get("targetId") as string;
  if (targetId) {
    await Target.findByIdAndDelete(targetId);
    revalidatePath("/revenue/targets");
    revalidatePath("/exec/dashboard");
  }
}

export async function updateTarget(formData: FormData) {
  await connectToDatabase();
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
    revalidatePath("/revenue/targets");
    revalidatePath("/exec/dashboard");
  }
}

// --- New Global Member Actions ---
export async function registerUser(formData: FormData) {
  await connectToDatabase();
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;
  const position = formData.get("position") as string;
  const rank = formData.get("rank") as string;

  if (name && role) {
    await User.create({ name, role, position, rank });
    revalidatePath("/teams");
  }
}

export async function linkUserToTeam(formData: FormData) {
  await connectToDatabase();
  const teamId = formData.get("teamId") as string;
  const userId = formData.get("userId") as string;

  if (teamId && userId) {
    await Team.findByIdAndUpdate(teamId, { $addToSet: { members: userId } });
    revalidatePath("/teams");
  }
}
