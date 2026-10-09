import { Project, Task, Goal, DailyGoal, Team, User, Deal, Pipeline, Form, CustomerFeedback, Company } from "@/models";
import mongoose from "mongoose";

export interface WorkspaceContextData {
  company: {
    name: string;
    plan: string;
    userCount: number;
    currency: string;
  };
  projects: {
    total: number;
    activeCount: number;
    list: Array<{
      id: string;
      name: string;
      status: string;
      health: string;
      category: string;
      budgetUSD: number;
      deadline?: string;
      agendas: string[];
      changeRequestsPending: number;
      memberCount: number;
    }>;
  };
  tasks: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdueCount: number;
    overdueList: Array<{
      title: string;
      status: string;
      priority: string;
      dueDate?: string;
      projectName?: string;
      assigneeName?: string;
    }>;
    blockedCount: number;
    blockedList: Array<{
      title: string;
      projectName?: string;
      assigneeName?: string;
    }>;
    assigneeWorkload: Record<string, number>;
  };
  goals: {
    total: number;
    strategic: Array<{
      title: string;
      targetValue: number;
      currentValue: number;
      unit: string;
    }>;
    dailyGoalsSummary: {
      total: number;
      completed: number;
      pending: number;
    };
  };
  teams: {
    total: number;
    list: Array<{
      id?: string;
      name: string;
      memberCount: number;
      lead?: string;
    }>;
  };
  sales: {
    dealsCount: number;
    totalPipelineValue: number;
    byStage: Record<string, number>;
    wonCount: number;
    lostCount: number;
    recentDeals?: Array<{
      title: string;
      valueUSD: number;
      stage: string;
      probability?: number;
    }>;
  };
  forms: {
    totalForms: number;
    totalSubmissions: number;
    recentFeedback: string[];
    list?: Array<{
      title: string;
      isPublished?: boolean;
      submissionsCount?: number;
    }>;
  };
}

export async function aggregateWorkspaceContext(
  companyId?: string | mongoose.Types.ObjectId,
  targetProjectId?: string
): Promise<WorkspaceContextData> {
  const filter: any = {};
  if (companyId) {
    try {
      filter.companyId = new mongoose.Types.ObjectId(companyId.toString());
    } catch {
      filter.companyId = companyId;
    }
  }

  // 1. Company
  let companyData = {
    name: "TaskPMS Organization",
    plan: "Pro",
    userCount: 1,
    currency: "USD",
  };
  if (companyId) {
    const comp = await Company.findById(companyId).lean();
    if (comp) {
      companyData = {
        name: comp.name || "TaskPMS Organization",
        plan: comp.plan || "Pro",
        userCount: comp.subscription?.userCount || 1,
        currency: comp.settings?.currency || "USD",
      };
    }
  }

  // 2. Projects
  let projectQuery: any = { ...filter };
  if (targetProjectId) {
    try {
      projectQuery._id = new mongoose.Types.ObjectId(targetProjectId);
    } catch {
      projectQuery._id = targetProjectId;
    }
  }
  const projects = await Project.find(projectQuery).lean();

  const projectList = projects.map((p: any) => ({
    id: p._id.toString(),
    name: p.name,
    status: p.status || "Active",
    health: p.health || "On Track",
    category: p.category || "Internal",
    budgetUSD: p.budgetUSD || 0,
    deadline: p.deadline ? new Date(p.deadline).toISOString().split("T")[0] : undefined,
    agendas: p.agendas || [],
    changeRequestsPending: (p.changeRequests || []).filter((cr: any) => cr.status === "Pending").length,
    memberCount: (p.memberIds || []).length,
  }));

  // 3. Tasks
  let taskQuery: any = { ...filter };
  if (targetProjectId) {
    try {
      taskQuery.projectId = new mongoose.Types.ObjectId(targetProjectId);
    } catch {
      taskQuery.projectId = targetProjectId;
    }
  }
  const tasks = await Task.find(taskQuery).populate("assigneeId", "name email").lean();

  const byStatus: Record<string, number> = {
    "To Do": 0,
    "In Progress": 0,
    "Review": 0,
    "Done": 0,
    "Blocked": 0,
  };
  const byPriority: Record<string, number> = {
    "Urgent": 0,
    "High": 0,
    "Medium": 0,
    "Low": 0,
  };

  const now = new Date();
  const overdueList: any[] = [];
  const blockedList: any[] = [];
  const assigneeWorkload: Record<string, number> = {};

  tasks.forEach((t: any) => {
    const st = t.status || "To Do";
    byStatus[st] = (byStatus[st] || 0) + 1;

    const pr = t.priority || "Medium";
    byPriority[pr] = (byPriority[pr] || 0) + 1;

    const assigneeName = t.assigneeId?.name || t.assigneeName || "Unassigned";
    assigneeWorkload[assigneeName] = (assigneeWorkload[assigneeName] || 0) + 1;

    if (t.dueDate && new Date(t.dueDate) < now && t.status !== "Done") {
      overdueList.push({
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: new Date(t.dueDate).toISOString().split("T")[0],
        assigneeName,
      });
    }

    if (t.status === "Blocked") {
      blockedList.push({
        title: t.title,
        assigneeName,
      });
    }
  });

  // 4. Goals & Daily Goals
  const strategicGoals = await Goal.find(filter).lean();
  const dailyGoals = await DailyGoal.find(filter).lean();

  const dailyCompleted = dailyGoals.filter((dg: any) => dg.isCompleted).length;

  // 5. Teams
  const teams = await Team.find(filter).lean();

  // 6. Sales & Pipeline
  const deals = await Deal.find(filter).lean();
  let totalPipelineValue = 0;
  const byStage: Record<string, number> = {};
  let wonCount = 0;
  let lostCount = 0;

  deals.forEach((d: any) => {
    totalPipelineValue += d.value || 0;
    const stage = d.stage || "Lead";
    byStage[stage] = (byStage[stage] || 0) + 1;
    if (stage.toLowerCase().includes("won")) wonCount++;
    if (stage.toLowerCase().includes("lost")) lostCount++;
  });

  // 7. Forms & Surveys
  const forms = await Form.find(filter).lean();
  let totalSubmissions = 0;
  forms.forEach((f: any) => {
    totalSubmissions += (f.submissions || []).length;
  });

  const feedback = await CustomerFeedback.find(filter).sort({ createdAt: -1 }).limit(5).lean();
  const recentFeedback = feedback.map((fb: any) => fb.comment || fb.message || "").filter(Boolean);

  return {
    company: companyData,
    projects: {
      total: projects.length,
      activeCount: projects.filter((p: any) => p.status === "Active").length,
      list: projectList,
    },
    tasks: {
      total: tasks.length,
      byStatus,
      byPriority,
      overdueCount: overdueList.length,
      overdueList: overdueList.slice(0, 10),
      blockedCount: blockedList.length,
      blockedList: blockedList.slice(0, 10),
      assigneeWorkload,
    },
    goals: {
      total: strategicGoals.length,
      strategic: strategicGoals.map((g: any) => ({
        title: g.title,
        targetValue: g.targetValue || 100,
        currentValue: g.currentValue || 0,
        unit: g.unit || "%",
      })),
      dailyGoalsSummary: {
        total: dailyGoals.length,
        completed: dailyCompleted,
        pending: dailyGoals.length - dailyCompleted,
      },
    },
    teams: {
      total: teams.length,
      list: teams.map((tm: any) => ({
        id: tm._id?.toString(),
        name: tm.name,
        memberCount: (tm.memberIds || []).length,
        lead: tm.leadName || tm.lead || undefined,
      })),
    },
    sales: {
      dealsCount: deals.length,
      totalPipelineValue,
      byStage,
      wonCount,
      lostCount,
      recentDeals: deals.slice(0, 5).map((d: any) => ({
        title: d.name || d.title || "Enterprise Deal",
        valueUSD: d.value || 0,
        stage: d.stage || "Lead",
        probability: d.probability || 50,
      })),
    },
    forms: {
      totalForms: forms.length,
      totalSubmissions,
      recentFeedback,
      list: forms.slice(0, 5).map((f: any) => ({
        title: f.title,
        isPublished: f.isPublished,
        submissionsCount: (f.submissions || []).length,
      })),
    },
  };
}
