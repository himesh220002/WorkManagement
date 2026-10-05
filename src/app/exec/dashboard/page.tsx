import connectToDatabase from "@/lib/mongodb";
import { Pipeline, Goal, Target, Lead, Deal, Task, User, Project, Team } from "@/models";
import ExecDashboardClient from "./ExecDashboardClient";

export default async function ExecDashboard() {
  await connectToDatabase();

  // Fetch all core entities to guarantee 100% comprehensive data coverage across all projects
  const [
    projectsRaw,
    tasksRaw,
    pipelinesRaw,
    goalsRaw,
    targetsRaw,
    leadsRaw,
    dealsRaw,
    usersRaw,
    teamsRaw,
  ] = await Promise.all([
    Project.find({}).lean(),
    Task.find({})
      .populate("projectId", "name status health")
      .populate("assigneeIds", "name role email")
      .lean(),
    Pipeline.find({})
      .populate("projectId teamId taskId")
      .sort({ progress: -1 })
      .lean(),
    Goal.find({}).populate("projectId", "name").lean(),
    Target.find({}).lean(),
    Lead.find({}).populate("projectId", "name").lean(),
    Deal.find({}).populate("projectId", "name").lean(),
    User.find({}).lean(),
    Team.find({}).populate("projectId", "name").lean(),
  ]);

  // Clean and normalize tasks across all projects
  const cleanTasks = tasksRaw.map((t: any) => {
    const p = t.projectId as any;
    const projectObj = p
      ? {
          _id: (p._id || p).toString(),
          name: p.name || "Unnamed Project",
          status: p.status || "Active",
          health: p.health || "On Track",
        }
      : null;

    return {
      _id: t._id.toString(),
      name: t.name || "Untitled Task",
      status: t.status || "Todo",
      priority: t.priority || "Medium",
      estimatedHours: Number(t.estimatedHours || 0),
      actualHours: Number(t.actualHours || 0),
      progress: Number(t.progress || 0),
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
      projectId: projectObj,
      assignees: Array.isArray(t.assigneeIds)
        ? t.assigneeIds.map((u: any) => ({
            _id: (u._id || u).toString(),
            name: u.name || "Unassigned",
            role: u.role || "Member",
          }))
        : [],
      labels: Array.isArray(t.labels) ? t.labels : [],
    };
  });

  // Clean and normalize projects with live task rollups
  const cleanProjects = projectsRaw.map((p: any) => {
    const pIdStr = p._id.toString();
    const pTasks = cleanTasks.filter(
      (t) => t.projectId && t.projectId._id === pIdStr
    );
    const pPipelines = pipelinesRaw.filter(
      (pipe: any) =>
        pipe.projectId &&
        (pipe.projectId._id?.toString() || pipe.projectId.toString()) === pIdStr
    );
    const pTeams = teamsRaw.filter(
      (team: any) =>
        team.projectId &&
        (team.projectId._id?.toString() || team.projectId.toString()) === pIdStr
    );
    const pDeals = dealsRaw.filter(
      (deal: any) =>
        deal.projectId &&
        (deal.projectId._id?.toString() || deal.projectId.toString()) === pIdStr
    );

    const totalTasks = pTasks.length;
    const completedTasks = pTasks.filter((t) =>
      ["done", "completed"].includes(t.status.toLowerCase())
    ).length;
    const inProgressTasks = pTasks.filter((t) =>
      ["in progress", "active"].includes(t.status.toLowerCase())
    ).length;
    const reviewTasks = pTasks.filter((t) =>
      ["review", "code review", "testing", "in review"].includes(
        t.status.toLowerCase()
      )
    ).length;
    const blockedTasks = pTasks.filter(
      (t) => t.status.toLowerCase() === "blocked"
    ).length;
    const todoTasks = pTasks.filter((t) =>
      ["todo", "backlog", "planning"].includes(t.status.toLowerCase())
    ).length;

    const taskProgress =
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : Number(p.progress || 0);

    const wonRevenue = pDeals
      .filter(
        (d: any) =>
          ["closed", "won", "integration"].includes(
            (d.stage || "").toLowerCase()
          ) || (d.status || "").toLowerCase() === "won"
      )
      .reduce(
        (sum: number, d: any) => sum + Number(d.amount || d.revenue || 0),
        0
      );

    const pipelineRevenue = pDeals
      .filter(
        (d: any) =>
          ![
            "closed",
            "won",
            "integration",
            "lost",
            "dropped",
          ].includes((d.stage || "").toLowerCase()) &&
          (d.status || "").toLowerCase() === "active"
      )
      .reduce(
        (sum: number, d: any) => sum + Number(d.amount || d.revenue || 0),
        0
      );

    return {
      _id: pIdStr,
      name: p.name,
      description: p.description || "",
      category: p.category || "General",
      status: p.status || "Active",
      health: p.health || "On Track",
      progress: taskProgress,
      totalTasks,
      completedTasks,
      inProgressTasks,
      reviewTasks,
      blockedTasks,
      todoTasks,
      pipelinesCount: pPipelines.length,
      teamsCount: pTeams.length,
      wonRevenue,
      pipelineRevenue,
    };
  });

  // Calculate dynamic progress for Goals based on connected Targets
  const cleanGoals = goalsRaw.map((g: any) => {
    const relatedTargets = targetsRaw.filter(
      (t: any) => t.goalId?.toString() === g._id.toString()
    );
    let totalProgress = 0;

    if (relatedTargets.length > 0) {
      let totalExpected = 0;
      let totalActual = 0;

      relatedTargets.forEach((t: any) => {
        totalExpected += Number(t.expectedValue) || 1;
        totalActual += Number(t.actualValue) || 0;
      });

      totalProgress =
        totalExpected > 0
          ? Math.min(100, Math.round((totalActual / totalExpected) * 100))
          : 0;
    } else {
      totalProgress = Number(g.progress) || 0;
    }

    const gProject = g.projectId as any;

    return {
      _id: g._id.toString(),
      title: g.title,
      description: g.description || "",
      category: g.category || "Company",
      status: g.status || "On Track",
      progress: totalProgress,
      projectId: gProject
        ? {
            _id: (gProject._id || gProject).toString(),
            name: gProject.name || "Project",
          }
        : null,
      targets: relatedTargets.map((t: any) => ({
        _id: t._id.toString(),
        name: t.name || t.title || "Target",
        actualValue: Number(t.actualValue || 0),
        expectedValue: Number(t.expectedValue || 1),
      })),
    };
  });

  // Normalize pipelines
  const cleanPipelines = pipelinesRaw.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
    progress: Number(p.progress || 0),
    category: p.category || "General",
    owner: p.owner || "Unassigned",
    priority: p.priority || "Medium",
    status: p.status || "Active",
    startDate: p.startDate ? new Date(p.startDate).toISOString() : null,
    endDate: p.endDate ? new Date(p.endDate).toISOString() : null,
    riskLevel: p.riskLevel || "Low",
    objectives: p.objectives || "",
    kpis: p.kpis || "",
    projectId: p.projectId
      ? {
          _id: (p.projectId._id || p.projectId).toString(),
          name: p.projectId.name,
        }
      : null,
    teamId: p.teamId
      ? { _id: (p.teamId._id || p.teamId).toString(), name: p.teamId.name }
      : null,
    taskId: p.taskId
      ? { _id: (p.taskId._id || p.taskId).toString(), name: p.taskId.name }
      : null,
    memberIds: Array.isArray(p.memberIds)
      ? p.memberIds.map((m: any) => m.toString())
      : [],
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

  // Clean deals and leads
  const cleanDeals = dealsRaw.map((d: any) => ({
    _id: d._id.toString(),
    name: d.name,
    amount: Number(d.amount || d.revenue || 0),
    stage: d.stage || "Prospect",
    status: d.status || "Active",
    expectedCloseDate: d.expectedCloseDate
      ? new Date(d.expectedCloseDate).toISOString()
      : null,
    projectId: d.projectId
      ? {
          _id: (d.projectId._id || d.projectId).toString(),
          name: d.projectId.name,
        }
      : null,
  }));

  const cleanLeads = leadsRaw.map((l: any) => ({
    _id: l._id.toString(),
    name: l.name,
    status: l.status || "New",
    projectId: l.projectId
      ? {
          _id: (l.projectId._id || l.projectId).toString(),
          name: l.projectId.name,
        }
      : null,
  }));

  const cleanUsers = usersRaw.map((u: any) => ({
    _id: u._id.toString(),
    name: u.name,
    role: u.role || "Member",
    position: u.position || "",
    rank: u.rank || 1,
  }));

  // Enterprise Portfolio Summary Stats
  const totalTasksCount = cleanTasks.length;
  const completedTasksCount = cleanTasks.filter((t) =>
    ["done", "completed"].includes(t.status.toLowerCase())
  ).length;
  const inProgressTasksCount = cleanTasks.filter((t) =>
    ["in progress", "active"].includes(t.status.toLowerCase())
  ).length;
  const reviewTasksCount = cleanTasks.filter((t) =>
    ["review", "code review", "testing", "in review"].includes(
      t.status.toLowerCase()
    )
  ).length;
  const blockedTasksCount = cleanTasks.filter(
    (t) => t.status.toLowerCase() === "blocked"
  ).length;
  const todoTasksCount = cleanTasks.filter((t) =>
    ["todo", "backlog", "planning"].includes(t.status.toLowerCase())
  ).length;

  const totalWonRevenue = cleanDeals
    .filter(
      (d) =>
        ["closed", "won", "integration"].includes(d.stage.toLowerCase()) ||
        d.status.toLowerCase() === "won"
    )
    .reduce((sum, d) => sum + d.amount, 0);

  const totalPipelineRevenue = cleanDeals
    .filter(
      (d) =>
        ![
          "closed",
          "won",
          "integration",
          "lost",
          "dropped",
        ].includes(d.stage.toLowerCase()) && d.status.toLowerCase() === "active"
    )
    .reduce((sum, d) => sum + d.amount, 0);

  const portfolioStats = {
    totalProjects: cleanProjects.length,
    activeProjects: cleanProjects.filter((p) => p.status === "Active").length,
    onTrackProjects: cleanProjects.filter((p) => p.health === "On Track").length,
    atRiskProjects: cleanProjects.filter((p) => p.health === "At Risk").length,
    behindProjects: cleanProjects.filter((p) => p.health === "Behind").length,
    totalTasks: totalTasksCount,
    completedTasks: completedTasksCount,
    inProgressTasks: inProgressTasksCount,
    reviewTasks: reviewTasksCount,
    blockedTasks: blockedTasksCount,
    todoTasks: todoTasksCount,
    taskProgressPercent:
      totalTasksCount > 0
        ? Math.round((completedTasksCount / totalTasksCount) * 100)
        : 0,
    totalPipelines: cleanPipelines.length,
    totalDeals: cleanDeals.length,
    totalWonRevenue,
    totalPipelineRevenue,
    totalUsers: cleanUsers.length,
  };

  return (
    <ExecDashboardClient
      portfolioStats={portfolioStats}
      projects={cleanProjects}
      tasks={cleanTasks}
      pipelines={cleanPipelines}
      goals={cleanGoals}
      deals={cleanDeals}
      leads={cleanLeads}
      users={cleanUsers}
    />
  );
}
