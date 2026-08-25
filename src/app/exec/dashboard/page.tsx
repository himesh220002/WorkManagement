import connectToDatabase from "@/lib/mongodb";
import { Pipeline, Goal, Target, Lead, Deal, TaskNode, User, Project } from "@/models";
import ExecDashboardClient from "./ExecDashboardClient";

export default async function ExecDashboard() {
  await connectToDatabase();
  
  let pipelines: any[] = [];
  let goals: any[] = [];
  let targets: any[] = [];
  let leads: any[] = [];
  let deals: any[] = [];
  let tasks: any[] = [];
  let users: any[] = [];
  
  try {
    const projects = await Project.find({}).lean();
    if (projects.length > 0) {
      const projectIds = projects.map(p => p._id);
      pipelines = await Pipeline.find({ projectId: { $in: projectIds } }).populate("projectId teamId taskId").sort({ progress: -1 }).lean();
      tasks = await TaskNode.find({ projectId: { $in: projectIds } }).lean();
    } else {
      pipelines = await Pipeline.find({}).populate("projectId teamId taskId").sort({ progress: -1 }).lean();
      tasks = await TaskNode.find({}).lean();
    }
    goals = await Goal.find({}).lean();
    targets = await Target.find({}).lean();
    leads = await Lead.find({}).lean();
    // @ts-ignore
    deals = await Deal.find({}).lean();
    users = await User.find({}).lean();
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
    projectId: p.projectId ? { _id: p.projectId._id?.toString(), name: p.projectId.name } : null,
    teamId: p.teamId ? { _id: p.teamId._id?.toString(), name: p.teamId.name } : null,
    taskId: p.taskId ? { _id: p.taskId._id?.toString(), name: p.taskId.name } : null,
    memberIds: Array.isArray(p.memberIds) ? p.memberIds.map((m: any) => m.toString()) : [],
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

  // Chart Data Calculations
  const projectCount = await Project.countDocuments();
  const hasProjects = projectCount > 0;

  let chartData;

  if (!hasProjects) {
    // Show dummy data if not a single project is created
    chartData = {
      salesMetrics: { leads: 500, qualified: 250, proposal: 100, closedWon: 45 },
      devMetrics: { todo: 45, inProgress: 52, blocked: 38, done: 60 },
      hrMetrics: { engineering: 45, sales: 20, operations: 15, other: 10 },
      mrrMetrics: [120000, 135000, 125000, 150000, 180000, 210000]
    };
  } else {
    // 1. Sales Pipeline
    const salesMetrics = {
      leads: leads.length,
      qualified: leads.filter((l: any) => l.status === "Qualified" || l.status === "Working").length,
      proposal: deals.filter((d: any) => ["Initial Analysis", "Due Diligence", "Closing", "Signing & Closing"].includes(d.stage)).length,
      closedWon: deals.filter((d: any) => d.stage === "Closed" || d.stage === "Integration").length,
    };

    // 2. Engineering Tasks
    const devMetrics = {
      todo: tasks.filter((t: any) => t.status === "Todo").length,
      inProgress: tasks.filter((t: any) => t.status === "In Progress").length,
      blocked: tasks.filter((t: any) => t.status === "Blocked").length,
      done: tasks.filter((t: any) => t.status === "Done" || t.status === "Archived").length,
    };

    // 3. Headcount
    const hrMetrics = {
      engineering: users.filter((u: any) => ["Developer", "Engineer", "Lead Engineer"].includes(u.role)).length,
      sales: users.filter((u: any) => ["Sales", "Sales Executive"].includes(u.role)).length,
      operations: users.filter((u: any) => ["Manager", "Operations", "Product Manager"].includes(u.role)).length,
      other: users.filter((u: any) => !["Developer", "Engineer", "Lead Engineer", "Sales", "Sales Executive", "Manager", "Operations", "Product Manager"].includes(u.role)).length,
    };

    // 4. Finance MRR Projection
    const closedWonRevenue = deals.filter((d: any) => d.stage === "Closed" || d.stage === "Integration").reduce((sum, d) => sum + (d.amount || 0), 0);
    const mrrMetrics = [
      closedWonRevenue * 0.4,
      closedWonRevenue * 0.55,
      closedWonRevenue * 0.7,
      closedWonRevenue * 0.8,
      closedWonRevenue * 0.9,
      closedWonRevenue
    ];

    chartData = {
      salesMetrics,
      devMetrics,
      hrMetrics,
      mrrMetrics
    };
  }

  return <ExecDashboardClient cleanPipelines={cleanPipelines} goals={computedGoals} chartData={chartData} />;
}
