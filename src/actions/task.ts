"use server";

import { z } from "zod";
import { withAction, ActionResult } from "@/lib/action";
import { Task, ActivityLog } from "@/models";
import { invalidateEntity, CACHE_TAGS } from "@/lib/cache";
import { revalidatePath } from "next/cache";

const createTaskSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  companyId: z.string().optional(),
  goalId: z.string().optional(),
  pipelineId: z.string().optional(),
  priority: z.enum(["High", "Medium", "Low", "high", "medium", "low"]).default("Medium"),
  status: z.string().default("Todo"),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.string()).default([]),
  estimatedHours: z.number().default(0),
});

export async function createTaskAction(input: unknown): Promise<ActionResult> {
  return withAction(createTaskSchema, input, async (data) => {
    const task = await Task.create({
      name: data.name,
      description: data.description || "",
      projectId: data.projectId,
      companyId: data.companyId,
      goalId: data.goalId,
      pipelineId: data.pipelineId,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      assigneeIds: data.assigneeIds,
      assignees: data.assigneeIds,
      estimatedHours: data.estimatedHours,
    });

    if (data.companyId) {
      await ActivityLog.create({
        companyId: data.companyId,
        projectId: data.projectId,
        entityType: "Task",
        entityId: task._id,
        action: "created",
        diff: { name: data.name },
      });
    }

    if (data.projectId) {
      invalidateEntity(CACHE_TAGS.tasks(data.projectId));
    }
    revalidatePath("/dev/dashboard");
    revalidatePath("/my-work");

    return { id: task._id.toString(), name: task.name };
  });
}

const updateTaskStatusSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  status: z.string().min(1, "Status is required"),
});

export async function updateTaskStatusAction(input: unknown): Promise<ActionResult> {
  return withAction(updateTaskStatusSchema, input, async (data) => {
    const task = await Task.findByIdAndUpdate(
      data.taskId,
      { $set: { status: data.status } },
      { new: true }
    );

    if (!task) throw new Error("Task not found");

    if (task.projectId) {
      invalidateEntity(CACHE_TAGS.tasks(task.projectId.toString()));
    }
    revalidatePath("/dev/dashboard");
    revalidatePath("/my-work");

    return { id: task._id.toString(), status: task.status };
  });
}

const deleteTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
});

export async function deleteTaskAction(input: unknown): Promise<ActionResult> {
  return withAction(deleteTaskSchema, input, async (data) => {
    const task = await Task.findByIdAndDelete(data.taskId);
    if (task?.projectId) {
      invalidateEntity(CACHE_TAGS.tasks(task.projectId.toString()));
    }
    revalidatePath("/dev/dashboard");
    revalidatePath("/my-work");
    return { success: true };
  });
}
