import connectToDatabase from "@/lib/mongodb";
import { Company, Project, User, Pipeline, Deal, Document } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { redirect } from "next/navigation";
import DocsClient from "./DocsClient";
import { fetchWithCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  await connectToDatabase();
  const session = await getCurrentSession();

  if (!session.userId) {
    redirect("/auth/login");
  }

  const tenantFilter = getTenantQueryFilter(session);
  const cId = session.companyId || "default";

  // Fetch tenant company context (cached 60s)
  let companyData: any = null;
  if (session.companyId) {
    companyData = await fetchWithCache(`company:${session.companyId}`, 60, () =>
      Company.findById(session.companyId).lean()
    );
  }

  // Fetch dropdown entity options scoped to tenant (cached 30s)
  const [projectsRaw, usersRaw, pipelinesRaw, dealsRaw, documentsRaw] = await Promise.all([
    fetchWithCache(`tenant_projects:${cId}`, 30, () =>
      Project.find(tenantFilter).select("_id name category").lean()
    ),
    fetchWithCache(`tenant_users:${cId}`, 30, () =>
      User.find(tenantFilter).select("_id name email role position").lean()
    ),
    fetchWithCache(`tenant_pipelines:${cId}`, 30, () =>
      Pipeline.find(tenantFilter).select("_id name category").lean()
    ),
    fetchWithCache(`tenant_deals:${cId}`, 30, () =>
      Deal.find(tenantFilter).select("_id title clientName").lean()
    ),
    fetchWithCache(`tenant_docs:${cId}`, 15, () =>
      Document.find(tenantFilter)
        .populate("uploadedBy", "name email role")
        .sort({ createdAt: -1 })
        .lean()
    ),
  ]);

  const projects = projectsRaw.map((p: any) => ({
    id: p._id.toString(),
    name: p.name,
    category: p.category || "General",
  }));

  const users = usersRaw.map((u: any) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role || "employee",
    position: u.position || "Staff",
  }));

  const pipelines = pipelinesRaw.map((p: any) => ({
    id: p._id.toString(),
    name: p.name,
  }));

  const deals = dealsRaw.map((d: any) => ({
    id: d._id.toString(),
    name: `${d.title}${d.clientName ? ` (${d.clientName})` : ""}`,
  }));

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const userMap = new Map(users.map((u) => [u.id, `${u.name} (${u.role})`]));
  const dealMap = new Map(deals.map((d) => [d.id, d.name]));

  function inferSubType(doc: any): string {
    if (doc.subType && typeof doc.subType === "string" && doc.subType.trim()) {
      return doc.subType.trim();
    }
    const combined = `${doc.title || ""} ${doc.originalName || ""}`.toLowerCase();
    if (doc.category === "PROJECT") {
      if (combined.includes("presentation") || combined.includes("deck") || combined.includes("toolip") || combined.includes("slide")) {
        return "Project Presentation & Pitch Deck";
      }
      if (combined.includes("architect") || combined.includes("blueprint") || combined.includes("system")) {
        return "Architecture & Technical Specification";
      }
      if (combined.includes("roadmap") || combined.includes("scope") || combined.includes("plan")) {
        return "Project Roadmap & Scope Plan";
      }
      if (combined.includes("deliverable") || combined.includes("sprint") || combined.includes("task")) {
        return "Sprint Deliverable / Task Asset Archive";
      }
      return "Project Presentation & Pitch Deck";
    }
    if (doc.category === "EMPLOYEE") {
      if (combined.includes("resume") || combined.includes("cv")) return "Resume / Curriculum Vitae";
      if (combined.includes("id") || combined.includes("passport") || combined.includes("proof")) return "Government Identity Proof (Passport / ID Card)";
      if (combined.includes("cert") || combined.includes("degree")) return "Certificates & Educational Credentials";
      if (combined.includes("offer") || combined.includes("onboard")) return "Onboarding Package & Offer Letter";
      return "Resume / Curriculum Vitae";
    }
    if (doc.category === "SALES") {
      if (combined.includes("pitch") || combined.includes("deck")) return "Sales Funnel & Pitch Deck";
      if (combined.includes("proposal") || combined.includes("quote")) return "Client Proposal & Quotation";
      if (combined.includes("contract") || combined.includes("agreement")) return "Client Service Agreement & Contract";
      if (combined.includes("report")) return "Quarterly Sales Performance Report";
      return "Client Proposal & Quotation";
    }
    if (doc.category === "SALARY_FINANCE") {
      if (combined.includes("slip") || combined.includes("payslip") || combined.includes("salary")) return "Monthly Salary Slip (Employee-Specific)";
      if (combined.includes("distrib") || combined.includes("payroll")) return "Organization Payroll Distribution Sheet";
      if (combined.includes("balance") || combined.includes("cashflow")) return "Cash Inflow / Outflow Balance Sheet";
      if (combined.includes("expense") || combined.includes("receipt")) return "Expense Reimbursement Claim & Receipt";
      return "Organization Payroll Distribution Sheet";
    }
    return "General Document";
  }

  const documents = documentsRaw.map((d: any) => {
    const entityId = d.entityId ? d.entityId.toString() : null;
    let entityName = "General / Unassigned";
    if (d.category === "PROJECT") {
      entityName = (entityId && projectMap.get(entityId)) || (entityId ? "Project Asset" : "General Project Asset");
    } else if (d.category === "EMPLOYEE") {
      entityName = (entityId && userMap.get(entityId)) || (entityId ? "Staff Member" : "General Staff Record");
    } else if (d.category === "SALES") {
      entityName = (entityId && dealMap.get(entityId)) || (entityId ? "Client Deal" : "General Sales Asset");
    } else if (d.category === "SALARY_FINANCE") {
      entityName = (entityId && userMap.get(entityId)) || "Organization General Treasury";
    }

    return {
      _id: d._id.toString(),
      title: d.title,
      originalName: d.originalName,
      category: d.category,
      subType: inferSubType(d),
      entityId,
      entityName,
      mimeType: d.mimeType,
      fileSize: d.fileSize || 0,
      s3Key: d.s3Key,
      uploadedByName: d.uploadedBy?.name || "System",
      uploadedByRole: d.uploadedBy?.role || "Member",
      uploadedById: d.uploadedBy?._id ? d.uploadedBy._id.toString() : "",
      isArchived: Boolean(d.isArchived),
      archivedAt: d.archivedAt ? new Date(d.archivedAt).toISOString() : null,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    };
  });

  return (
    <DocsClient
      companyCode={session.companyCode || companyData?.companyCode || "DEFAULT"}
      companyId={session.companyId || (companyData ? companyData._id.toString() : "")}
      companyName={companyData?.name || "TaskFlow Organization"}
      currentUser={{
        id: session.userId,
        name: session.name,
        role: session.role,
        email: session.email,
      }}
      projects={projects}
      users={users}
      pipelines={pipelines}
      deals={deals}
      initialDocuments={documents}
    />
  );
}
