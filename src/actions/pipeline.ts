"use server";

import { z } from "zod";
import { withAction, ActionResult } from "@/lib/action";
import { Pipeline } from "@/models";
import { invalidateEntity, CACHE_TAGS } from "@/lib/cache";
import { revalidatePath } from "next/cache";
import { recomputePipelineProgress } from "./index";

const createPipelineSchema = z.object({
  name: z.string().min(1, "Pipeline name is required"),
  category: z.string().default("Development"),
  projectId: z.string().optional(),
  teamId: z.string().optional(),
  companyId: z.string().optional(),
  priority: z.enum(["High", "Medium", "Low", "high", "medium", "low"]).default("Medium"),
  status: z.string().default("Active"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  objectives: z.string().optional(),
  budget: z.string().optional(),
  kpis: z.string().optional(),
  riskLevel: z.string().default("Low"),
  cashFlowProjectionUSD: z.number().default(0),
  expensesUSD: z.number().default(0),
  roiPercent: z.number().default(0),
  memberIds: z.array(z.string()).default([]),
});

export async function createPipelineAction(input: unknown): Promise<ActionResult> {
  return withAction(createPipelineSchema, input, async (data) => {
    const pipeline = await Pipeline.create({
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      category: data.category as any,
      priority: data.priority as any,
      riskLevel: data.riskLevel as any,
      todos: [],
    } as any);

    if (data.projectId) {
      invalidateEntity(CACHE_TAGS.pipelines(data.projectId));
    }
    revalidatePath("/dev/timeline");
    return { id: pipeline._id.toString(), name: pipeline.name };
  });
}

const toggleTodoSchema = z.object({
  pipelineId: z.string().min(1),
  todoIndex: z.number().min(0),
  completed: z.boolean(),
});

export async function togglePipelineTodoAction(input: unknown): Promise<ActionResult> {
  return withAction(toggleTodoSchema, input, async (data) => {
    const pipeline = await Pipeline.findById(data.pipelineId);
    if (!pipeline) throw new Error("Pipeline not found");

    if (pipeline.todos && pipeline.todos[data.todoIndex]) {
      pipeline.todos[data.todoIndex]!.completed = data.completed;
      await pipeline.save();
    }

    await recomputePipelineProgress(data.pipelineId);

    if (pipeline.projectId) {
      invalidateEntity(CACHE_TAGS.pipelines(pipeline.projectId.toString()));
    }
    revalidatePath("/dev/timeline");
    return { success: true };
  });
}
