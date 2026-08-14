import connectToDatabase from "@/lib/mongodb";
import { Pipeline } from "@/models";
import TimelineClient from "@/app/dev/timeline/TimelineClient";

export default async function TimelinePage() {
  await connectToDatabase();

  let tasks: any[] = [];
  try {
    tasks = await Pipeline.find({}).lean();
  } catch (err) {
    console.error(err);
  }

  // Map backend tasks to clean strings
  const cleanTasks = tasks.map((t: any) => ({
    _id: t._id.toString(),
    name: t.name,
    category: t.category || "General",
    owner: t.owner || "Unassigned",
    status: t.status || "Active",
    startDate: t.startDate ? new Date(t.startDate).toISOString() : null,
    endDate: t.endDate ? new Date(t.endDate).toISOString() : null,
    progress: t.progress || 0,
    priority: t.priority || "Medium",
    objectives: t.objectives || "",
    dependencies: t.dependencies || "",
    budget: t.budget || "",
    kpis: t.kpis || "",
    tags: t.tags || "",
    riskLevel: t.riskLevel || "Low",
    notes: t.notes || "",
  }));

  return <TimelineClient tasks={cleanTasks} />;
}
