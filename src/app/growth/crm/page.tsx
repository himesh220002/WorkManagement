import connectToDatabase from "@/lib/mongodb";
import { ClientAccount, Project } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { fetchWithCache } from "@/lib/cache";
import CrmClient from "./CrmClient";

export default async function CrmPage() {
  await connectToDatabase();
  const session = await getCurrentSession();
  const tenantFilter = getTenantQueryFilter(session);
  const cId = session.companyId || "default";

  let accounts: any[] = [];
  let projects: any[] = [];

  try {
    [accounts, projects] = await Promise.all([
      fetchWithCache(`crm_accounts:${cId}`, 25, () =>
        ClientAccount.find(tenantFilter).populate("projectId", "name").sort({ contractARR: -1 }).lean()
      ),
      fetchWithCache(`crm_projects:${cId}`, 30, () =>
        Project.find(tenantFilter, { name: 1 }).lean()
      ),
    ]);
  } catch (err) {
    console.error("CRM fetch error:", err);
  }

  const cleanAccounts = accounts.map((acc: any) => ({
    _id: acc._id.toString(),
    accountName: acc.accountName,
    tier: acc.tier || "Tier 1 Strategic",
    lifecycleStage: acc.lifecycleStage || "Active Enterprise",
    industry: acc.industry || "Technology",
    region: acc.region || "Global",
    contractARR: acc.contractARR || 0,
    healthScore: acc.healthScore || 90,
    primaryContact: {
      name: acc.primaryContact?.name || "Decision Maker",
      title: acc.primaryContact?.title || "Executive",
      email: acc.primaryContact?.email || "",
      phone: acc.primaryContact?.phone || "",
    },
    accountExecutive: acc.accountExecutive || "Sarah Connor (Owner)",
    projectId: acc.projectId
      ? { _id: acc.projectId._id?.toString(), name: acc.projectId.name }
      : null,
    nextAction: acc.nextAction
      ? {
          action: acc.nextAction.action,
          dueDate: acc.nextAction.dueDate
            ? new Date(acc.nextAction.dueDate).toISOString()
            : null,
        }
      : null,
    interactions: Array.isArray(acc.interactions)
      ? acc.interactions.map((it: any) => ({
          _id: it._id?.toString() || Math.random().toString(),
          type: it.type || "Meeting",
          summary: it.summary || "",
          date: it.date ? new Date(it.date).toISOString() : new Date().toISOString(),
          recordedBy: it.recordedBy || "Account Executive",
        }))
      : [],
    notes: acc.notes || "",
  }));

  const cleanProjects = projects.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
  }));

  return (
    <CrmClient
      accounts={cleanAccounts}
      projects={cleanProjects}
      currentRole={session.role}
      isGuest={Boolean(session.isGuest)}
    />
  );
}
