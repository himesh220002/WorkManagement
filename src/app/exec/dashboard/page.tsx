import connectToDatabase from "@/lib/mongodb";
import { Pipeline, Goal, Target } from "@/models";
import ExecDashboardClient from "./ExecDashboardClient";

export default async function ExecDashboard() {
  await connectToDatabase();
  
  let pipelines: any[] = [];
  let goals: any[] = [];
  let targets: any[] = [];
  
  try {
    pipelines = await Pipeline.find({}).sort({ progress: -1 }).lean();
    goals = await Goal.find({}).lean();
    targets = await Target.find({}).lean();
  } catch (e) {
    console.error(e);
  }

  // Calculate dynamic progress for Goals based on connected Targets
  const computedGoals = goals.map((g: any) => {
    const relatedTargets = targets.filter((t: any) => t.goalId?.toString() === g._id.toString());
    let totalProgress = 0;
    
    if (relatedTargets.length > 0) {
      let totalExpected = 0;
      let totalActual = 0;
      
      relatedTargets.forEach((t: any) => {
        totalExpected += (t.expectedValue || 1);
        totalActual += (t.actualValue || 0);
      });
      
      totalProgress = totalExpected > 0 ? Math.min(100, Math.round((totalActual / totalExpected) * 100)) : 0;
    } else {
      totalProgress = g.progress || 0; // fallback to manual progress if no targets
    }
    
    return {
      _id: g._id.toString(),
      title: g.title,
      description: g.description,
      category: g.category,
      status: g.status,
      progress: totalProgress
    };
  });

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

  return <ExecDashboardClient cleanPipelines={cleanPipelines} goals={computedGoals} />;
}
