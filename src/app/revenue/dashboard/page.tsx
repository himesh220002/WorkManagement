import connectToDatabase from "@/lib/mongodb";
import { Deal, Target, Pipeline } from "@/models";
// Force TS server to re-index Client component
import RevenueDashboardClient from "@/app/revenue/dashboard/RevenueDashboardClient";

export default async function RevenueDashboardPage() {
  await connectToDatabase();

  let deals: any[] = [];
  let targets: any[] = [];
  let pipelines: any[] = [];

  try {
    // @ts-ignore - Deal schema wasn't listed but we fetch it
    deals = await Deal.find({}).lean();
    targets = await Target.find({}).lean();
    pipelines = await Pipeline.find({ category: "Finance" }).sort({ progress: -1 }).lean();
  } catch (err) {
    console.error(err);
  }

  // Convert ObjectIds to strings
  const cleanDeals = deals.map((d: any) => ({
    _id: d._id.toString(),
    name: d.name,
    amount: d.amount,
    stage: d.stage,
  }));

  const cleanTargets = targets.map((t: any) => ({
    _id: t._id.toString(),
    name: t.name,
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

  return <RevenueDashboardClient deals={cleanDeals} targets={cleanTargets} pipelines={cleanPipelines} />;
}
