import connectToDatabase from "@/lib/mongodb";
import { Lead, Campaign, Pipeline } from "@/models";
import SalesDashboardClient from "@/app/sales/dashboard/SalesDashboardClient";

export default async function SalesDashboardPage() {
  await connectToDatabase();

  let leads: any[] = [];
  let campaigns: any[] = [];
  let pipelines: any[] = [];

  try {
    leads = await Lead.find({}).lean();
    campaigns = await Campaign.find({}).lean();
    pipelines = await Pipeline.find({ category: "Sales" }).sort({ progress: -1 }).lean();
  } catch (err) {
    console.error(err);
  }

  // Convert ObjectIds to strings
  const cleanLeads = leads.map((l: any) => ({
    _id: l._id.toString(),
    name: l.name,
    status: l.status,
    source: l.source,
  }));

  const cleanCampaigns = campaigns.map((c: any) => ({
    _id: c._id.toString(),
    name: c.name,
  }));

  const cleanPipelines = pipelines.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
    progress: p.progress,
    category: p.category,
    owner: p.owner,
    priority: p.priority,
    status: p.status,
    startDate: p.startDate ? new Date(p.startDate).toISOString() : null,
    endDate: p.endDate ? new Date(p.endDate).toISOString() : null,
    riskLevel: p.riskLevel,
    objectives: p.objectives,
    kpis: p.kpis,
    todos: Array.isArray(p.todos)
      ? p.todos.map((todo: any) => ({
          _id: todo._id ? todo._id.toString() : Math.random().toString(),
          text: todo.text || "",
          completed: Boolean(todo.completed),
          assigneeType: todo.assigneeType || "Individual",
          assigneeName: todo.assigneeName || "",
        }))
      : [],
  }));

  return <SalesDashboardClient leads={cleanLeads} campaigns={cleanCampaigns} pipelines={cleanPipelines} />;
}
