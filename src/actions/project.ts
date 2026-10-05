"use server";

import { z } from "zod";
import { withAction, ActionResult } from "@/lib/action";
import { Project, ActivityLog } from "@/models";
import { invalidateEntity, CACHE_TAGS } from "@/lib/cache";
import { revalidatePath } from "next/cache";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  category: z.string().default("Internal"),
  companyId: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  budgetUSD: z.number().default(0),
});

export async function createProjectAction(input: unknown): Promise<ActionResult> {
  return withAction(createProjectSchema, input, async (data) => {
    const project = await Project.create({
      name: data.name,
      description: data.description || "",
      category: data.category as any,
      companyId: data.companyId,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      budgetUSD: data.budgetUSD,
      health: "On Track",
      status: "Active",
      teams: [],
      tags: [],
    });

    if (data.companyId) {
      await ActivityLog.create({
        companyId: data.companyId,
        projectId: project._id,
        entityType: "Project",
        entityId: project._id,
        action: "created",
        diff: { name: data.name },
      });
      invalidateEntity(CACHE_TAGS.projects(data.companyId));
    }

    revalidatePath("/projects");
    return { id: project._id.toString(), name: project.name };
  });
}

const updateProjectStatusSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  status: z.string().min(1, "Status is required"),
});

export async function updateProjectStatusAction(input: unknown): Promise<ActionResult> {
  return withAction(updateProjectStatusSchema, input, async (data) => {
    const project = await Project.findByIdAndUpdate(
      data.projectId,
      { $set: { status: data.status } },
      { new: true }
    );
    if (!project) throw new Error("Project not found");

    if (project.companyId) {
      invalidateEntity(CACHE_TAGS.projects(project.companyId.toString()));
    }
    revalidatePath("/projects");
    return { id: project._id.toString(), status: project.status };
  });
}
