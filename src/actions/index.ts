"use server";

import connectToDatabase from "@/lib/mongodb";
import { Pipeline, TaskNode, Lead, Campaign, Deal, Target } from "@/models";
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

  if (name) {
    await Pipeline.create({ 
      name, category, owner, status, priority, startDate, endDate, progress, objectives, budget, kpis, riskLevel 
    });
    revalidatePath("/dev/timeline");
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

export async function addTarget(formData: FormData) {
  await connectToDatabase();
  const name = formData.get("name") as string;
  const industry = formData.get("industry") as string;
  const region = formData.get("region") as string;

  if (name) {
    await Target.create({ name, industry, region });
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
