"use server";

import { z } from "zod";
import { withAction, ActionResult } from "@/lib/action";
import { Deal, Lead } from "@/models";
import { invalidateEntity, CACHE_TAGS } from "@/lib/cache";
import { revalidatePath } from "next/cache";

const checklistItemSchema = z.object({
  text: z.string().min(1).max(120),
  completed: z.boolean().default(false),
});

const createDealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  amount: z.number().min(0, "Amount must be >= 0"),
  stage: z.string().default("Prospect"),
  status: z.string().default("Active"),
  clientName: z.string().optional(),
  companyId: z.string().optional(),
  projectId: z.string().optional(),
  ownerId: z.string().optional(),
  owner: z.string().optional(),
  contactName: z.string().optional(),
  campaignId: z.string().optional(),
  checklist: z.array(checklistItemSchema).max(20).default([]),
});

export async function createDealAction(input: unknown): Promise<ActionResult> {
  return withAction(createDealSchema, input, async (data) => {
    const deal = await Deal.create({
      name: data.name,
      amount: data.amount,
      revenue: data.amount,
      stage: data.stage as any,
      status: data.status as any,
      companyId: data.companyId,
      projectId: data.projectId,
      ownerId: data.ownerId,
      owner: data.owner,
      contactName: data.contactName,
      campaignId: data.campaignId || undefined,
      checklist: data.checklist,
      client: {
        name: data.clientName || "",
      },
    });

    invalidateEntity(CACHE_TAGS.deals());
    revalidatePath("/sales/dashboard");
    revalidatePath("/revenue/dashboard");
    return { id: deal._id.toString(), name: deal.name };
  });
}

const updateDealStageSchema = z.object({
  dealId: z.string().min(1),
  stage: z.string().min(1),
});

export async function updateDealStageAction(input: unknown): Promise<ActionResult> {
  return withAction(updateDealStageSchema, input, async (data) => {
    const deal = await Deal.findByIdAndUpdate(
      data.dealId,
      { $set: { stage: data.stage } },
      { new: true }
    );
    if (!deal) throw new Error("Deal not found");

    invalidateEntity(CACHE_TAGS.deals());
    revalidatePath("/sales/dashboard");
    revalidatePath("/revenue/dashboard");
    return { id: deal._id.toString(), stage: deal.stage };
  });
}

const createLeadSchema = z.object({
  name: z.string().min(1, "Lead name is required"),
  owner: z.string().optional(),
  status: z.string().default("New"),
  source: z.string().default("Website"),
  companyId: z.string().optional(),
  contactName: z.string().optional(),
  priority: z.string().default("Medium"),
  campaignId: z.string().optional(),
  checklist: z.array(checklistItemSchema).max(20).default([]),
});

export async function createLeadAction(input: unknown): Promise<ActionResult> {
  return withAction(createLeadSchema, input, async (data) => {
    const lead = await Lead.create({
      name: data.name,
      owner: data.owner,
      status: data.status as any,
      source: data.source,
      companyId: data.companyId,
      contactName: data.contactName,
      priority: data.priority,
      campaignId: data.campaignId || undefined,
      checklist: data.checklist,
    });

    invalidateEntity(CACHE_TAGS.leads());
    revalidatePath("/sales/dashboard");
    return { id: lead._id.toString(), name: lead.name };
  });
}
