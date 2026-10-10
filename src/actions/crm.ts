"use server";

import connectToDatabase from "@/lib/mongodb";
import { ClientAccount, Project } from "@/models";
import { getCurrentSession } from "@/server/auth/session";
import { revalidatePath } from "next/cache";
import { syncTenantWrite } from "@/lib/tenantDb";

function assertNotGuest(session: { isGuest?: boolean; userId?: string | null }) {
  if (session.isGuest || !session.userId) {
    throw new Error("Authentication required. Please sign in or subscribe to modify CRM data.");
  }
}

export async function addClientAccount(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);

  const accountName = (formData.get("accountName") as string)?.trim();
  const tier = (formData.get("tier") as any) || "Tier 1 Strategic";
  const lifecycleStage = (formData.get("lifecycleStage") as any) || "Active Enterprise";
  const industry = (formData.get("industry") as string)?.trim() || "Technology";
  const region = (formData.get("region") as string)?.trim() || "North America";
  const contractARR = Number(formData.get("contractARR")) || 0;
  const healthScore = Math.min(100, Math.max(0, Number(formData.get("healthScore")) || 90));
  const contactName = (formData.get("contactName") as string)?.trim();
  const contactTitle = (formData.get("contactTitle") as string)?.trim() || "Decision Maker";
  const contactEmail = (formData.get("contactEmail") as string)?.trim();
  const contactPhone = (formData.get("contactPhone") as string)?.trim() || "";
  const projectId = (formData.get("projectId") as string)?.trim() || undefined;
  const accountExecutive = (formData.get("accountExecutive") as string)?.trim() || session.name || "Owner";
  const notes = (formData.get("notes") as string)?.trim() || "";

  if (!accountName || !contactName || !contactEmail) {
    throw new Error("Account name, primary contact name, and contact email are required.");
  }

  const account = await ClientAccount.create({
    companyId: session.companyId,
    projectId: projectId || undefined,
    accountName,
    tier,
    lifecycleStage,
    industry,
    region,
    contractARR,
    healthScore,
    primaryContact: {
      name: contactName,
      title: contactTitle,
      email: contactEmail,
      phone: contactPhone,
    },
    accountExecutive,
    nextAction: {
      action: "Initial Account Onboarding Sync",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    interactions: [
      {
        type: "Contract",
        summary: `Account established with $${contractARR.toLocaleString()} ARR commitment.`,
        date: new Date(),
        recordedBy: session.name || "Owner",
      },
    ],
    notes,
  });

  await syncTenantWrite("ClientAccount", "create", account, undefined, session.companyCode);

  revalidatePath("/growth/crm");
  revalidatePath("/sales/dashboard");
  revalidatePath("/revenue/dashboard");
}

export async function updateClientStage(accountId: string, stage: string, healthScore?: number) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);

  const updateData: any = { lifecycleStage: stage };
  if (healthScore !== undefined) {
    updateData.healthScore = Math.min(100, Math.max(0, healthScore));
  }

  await ClientAccount.findByIdAndUpdate(accountId, updateData);
  await syncTenantWrite("ClientAccount", "update", accountId, updateData, session.companyCode);

  revalidatePath("/growth/crm");
}

export async function addClientInteraction(accountId: string, type: string, summary: string) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);

  const interaction = {
    type: (type as any) || "Meeting",
    summary,
    date: new Date(),
    recordedBy: session.name || "Account Executive",
  };

  await ClientAccount.findByIdAndUpdate(accountId, {
    $push: { interactions: interaction },
  });

  await syncTenantWrite("ClientAccount", "update", accountId, { $push: { interactions: interaction } }, session.companyCode);

  revalidatePath("/growth/crm");
}

export async function updateClientAccount(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);

  const accountId = (formData.get("accountId") as string)?.trim();
  if (!accountId) {
    throw new Error("Client Account ID is required.");
  }

  const accountName = (formData.get("accountName") as string)?.trim();
  const tier = (formData.get("tier") as any) || "Tier 1 Strategic";
  const lifecycleStage = (formData.get("lifecycleStage") as any) || "Active Enterprise";
  const industry = (formData.get("industry") as string)?.trim() || "Technology";
  const region = (formData.get("region") as string)?.trim() || "North America";
  const contractARR = Number(formData.get("contractARR")) || 0;
  const healthScore = Math.min(100, Math.max(0, Number(formData.get("healthScore")) || 90));
  const contactName = (formData.get("contactName") as string)?.trim();
  const contactTitle = (formData.get("contactTitle") as string)?.trim() || "Decision Maker";
  const contactEmail = (formData.get("contactEmail") as string)?.trim();
  const contactPhone = (formData.get("contactPhone") as string)?.trim() || "";
  const projectId = (formData.get("projectId") as string)?.trim() || undefined;
  const accountExecutive = (formData.get("accountExecutive") as string)?.trim() || session.name || "Owner";
  const notes = (formData.get("notes") as string)?.trim() || "";

  if (!accountName || !contactName || !contactEmail) {
    throw new Error("Account name, primary contact name, and contact email are required.");
  }

  const updateData: any = {
    accountName,
    tier,
    lifecycleStage,
    industry,
    region,
    contractARR,
    healthScore,
    primaryContact: {
      name: contactName,
      title: contactTitle,
      email: contactEmail,
      phone: contactPhone,
    },
    accountExecutive,
    projectId: projectId || null,
    notes,
  };

  const updatedAccount = await ClientAccount.findByIdAndUpdate(accountId, updateData, { new: true }).lean();

  if (session.companyCode) {
    await syncTenantWrite("ClientAccount", "update", accountId, updateData, session.companyCode);
  }

  revalidatePath("/growth/crm");
  revalidatePath("/sales/dashboard");
  revalidatePath("/revenue/dashboard");

  return { success: true, accountId };
}

export async function deleteClientAccount(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);

  const accountId = formData.get("accountId") as string;
  if (!accountId) return;

  await ClientAccount.findByIdAndDelete(accountId);
  await syncTenantWrite("ClientAccount", "delete", accountId, undefined, session.companyCode);

  revalidatePath("/growth/crm");
}
