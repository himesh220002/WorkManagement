"use server";

import connectToDatabase from "@/lib/mongodb";
import { Pipeline, TaskNode, Lead, Campaign, Deal, Target, Goal, Team, User, Project, ResourceAllocation, Cycle } from "@/models";
import { revalidatePath } from "next/cache";

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
  const teamId = formData.get("teamId") as string || undefined;
  const taskId = formData.get("taskId") as string || undefined;
  const memberId = formData.get("memberId") as string || undefined;
  const createTaskName = formData.get("createTaskName") as string || undefined;

  if (name) {
    let finalTaskId = taskId;

    // If both project and team are linked, assign team to project
    if (projectId && teamId) {
      await Project.findByIdAndUpdate(projectId, { team: teamId });
    }

    // Auto-create initial task if requested
    if (createTaskName && projectId) {
      const assigneeArray = memberId ? [memberId] : undefined;
      const newTask = await TaskNode.create({
        name: createTaskName,
        description: `Auto-generated task from pipeline: ${name}`,
        projectId: projectId,
        assignee: memberId ? memberId : "Unassigned", // Legacy string
        assignees: assigneeArray, // Real ID reference
        status: "Todo",
        priority,
        dueDate: endDate
      });
      finalTaskId = newTask._id.toString();
    }

    await Pipeline.create({ 
      name, category, owner, status, priority, startDate, endDate, progress, objectives, budget, kpis, riskLevel, dependencies, outcome,
      projectId, teamId, taskId: finalTaskId, memberId
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

  if (name) {
    await Deal.create({ name, amount, stage });
    revalidatePath("/revenue/dashboard");
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
    await Project.create({ name, description, category });
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

  if (name) {
    const data: any = { name, type, totalAllocated, totalUsed, riskLevel };
    if (assignedToProjectId) data.assignedToProjectId = assignedToProjectId;
    
    await ResourceAllocation.create(data);
    revalidatePath("/exec/resources");
  }
}

export async function addTaskNode(formData: FormData) {
  await connectToDatabase();
  const name = formData.get("name") as string;
  const projectId = formData.get("projectId") as string;
  const status = formData.get("status") as string || "open";
  const severity = formData.get("severity") as string || "medium";
  const module = formData.get("module") as string || "General";
  const estimatedHours = Number(formData.get("estimatedHours")) || 0;
  const actualHours = Number(formData.get("actualHours")) || 0;
  
  if (name && projectId && projectId !== "all") {
    await TaskNode.create({
      name, projectId, status, severity, module, estimatedHours, actualHours
    });
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

  if (targetId) {
    await Target.findByIdAndUpdate(targetId, {
      name,
      expectedValue,
      actualValue,
      industry,
      region,
      status
    });
    revalidatePath("/revenue/targets");
    revalidatePath("/exec/dashboard");
  }
}

