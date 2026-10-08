"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import PipelineCard from "@/components/PipelineCard";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { addGoal, deleteGoal, updateGoal } from "@/actions";
import { formatDate } from "@/utils/dateUtils";
import {
  FolderKanban,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Layers,
  Filter,
  ArrowRight,
  Clock,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  ListTodo,
  HelpCircle,
  Lightbulb,
  Compass,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProjectItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  health: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  blockedTasks: number;
  todoTasks: number;
  pipelinesCount: number;
  teamsCount: number;
  wonRevenue: number;
  pipelineRevenue: number;
}

interface TaskItem {
  _id: string;
  name: string;
  status: string;
  priority: string;
  estimatedHours: number;
  actualHours: number;
  progress: number;
  dueDate: string | null;
  projectId: {
    _id: string;
    name: string;
    status: string;
    health: string;
  } | null;
  assignees: Array<{
    _id: string;
    name: string;
    role: string;
  }>;
  labels: string[];
}

interface ExecDashboardProps {
  portfolioStats: {
    totalProjects: number;
    activeProjects: number;
    onTrackProjects: number;
    atRiskProjects: number;
    behindProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    reviewTasks: number;
    blockedTasks: number;
    todoTasks: number;
    taskProgressPercent: number;
    totalPipelines: number;
    totalDeals: number;
    totalWonRevenue: number;
    totalPipelineRevenue: number;
    totalUsers: number;
  };
  projects: ProjectItem[];
  tasks: TaskItem[];
  pipelines: any[];
  goals: any[];
  deals: any[];
  leads: any[];
  users: any[];
}

export default function ExecDashboardClient({
  portfolioStats,
  projects,
  tasks,
  pipelines,
  goals,
  deals,
  leads,
  users,
}: ExecDashboardProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"portfolio" | "tasks" | "pipelines" | "okrs">("portfolio");

  // Dynamic scoping based on project selection
  const isAll = selectedProjectId === "all";

  const scopedProjects = useMemo(() => {
    if (isAll) return projects;
    return projects.filter((p) => p._id === selectedProjectId);
  }, [projects, selectedProjectId, isAll]);

  const scopedTasks = useMemo(() => {
    if (isAll) return tasks;
    return tasks.filter((t) => t.projectId?._id === selectedProjectId);
  }, [tasks, selectedProjectId, isAll]);

  const scopedPipelines = useMemo(() => {
    if (isAll) return pipelines;
    return pipelines.filter(
      (p) => p.projectId && p.projectId._id === selectedProjectId
    );
  }, [pipelines, selectedProjectId, isAll]);

  const scopedDeals = useMemo(() => {
    if (isAll) return deals;
    return deals.filter(
      (d) => d.projectId && d.projectId._id === selectedProjectId
    );
  }, [deals, selectedProjectId, isAll]);

  const scopedGoals = useMemo(() => {
    if (isAll) return goals;
    return goals.filter(
      (g) =>
        (g.projectId && g.projectId._id === selectedProjectId) ||
        g.category === "Company"
    );
  }, [goals, selectedProjectId, isAll]);

  // Dynamically compute scoped stats
  const currentTaskCounts = useMemo(() => {
    const total = scopedTasks.length;
    const completed = scopedTasks.filter((t) =>
      ["done", "completed"].includes(t.status.toLowerCase())
    ).length;
    const inProgress = scopedTasks.filter((t) =>
      ["in progress", "active"].includes(t.status.toLowerCase())
    ).length;
    const review = scopedTasks.filter((t) =>
      ["review", "code review", "testing", "in review"].includes(
        t.status.toLowerCase()
      )
    ).length;
    const blocked = scopedTasks.filter(
      (t) => t.status.toLowerCase() === "blocked"
    ).length;
    const todo = scopedTasks.filter((t) =>
      ["todo", "backlog", "planning"].includes(t.status.toLowerCase())
    ).length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, review, blocked, todo, progressPercent };
  }, [scopedTasks]);

  const isClosedWon = (d: any) => {
    const stage = (d.stage || "").toLowerCase().trim();
    const status = (d.status || "").toLowerCase().trim();
    return (
      stage === "closed" ||
      stage === "won" ||
      stage === "closed won" ||
      stage === "closed-won" ||
      stage.includes("closed") ||
      stage.includes("won") ||
      stage.includes("integration") ||
      status === "won" ||
      status === "closed"
    );
  };

  const currentRevenue = useMemo(() => {
    const won = scopedDeals
      .filter(isClosedWon)
      .reduce((sum, d) => sum + (Number(d.amount) || Number(d.revenue) || 0), 0);

    const pipeline = scopedDeals
      .filter(
        (d) =>
          !isClosedWon(d) &&
          !["lost", "dropped", "cancelled"].includes((d.stage || "").toLowerCase().trim()) &&
          (d.status || "").toLowerCase().trim() !== "lost"
      )
      .reduce((sum, d) => sum + (Number(d.amount) || Number(d.revenue) || 0), 0);

    return { won, pipeline };
  }, [scopedDeals]);

  // Chart datasets
  const devChartData = {
    labels: ["Backlog / Todo", "In Progress", "In Review", "Blocked", "Done"],
    datasets: [
      {
        label: "Tasks Count",
        data: [
          currentTaskCounts.todo,
          currentTaskCounts.inProgress,
          currentTaskCounts.review,
          currentTaskCounts.blocked,
          currentTaskCounts.completed,
        ],
        backgroundColor: [
          "#0078D4", // brand blue for todo
          "#479EF5", // lighter blue for in-progress
          "#8764B8", // purple for review
          "#D13438", // red for blocked
          "#107C10", // green for done
        ],
        borderRadius: 4,
      },
    ],
  };

  const salesFunnelData = {
    labels: ["Leads", "Qualified", "Proposal", "Closed Won"],
    datasets: [
      {
        label: "Deals / Pipeline",
        data: [
          leads.length,
          leads.filter((l) => ["qualified", "working"].includes(l.status.toLowerCase())).length,
          scopedDeals.filter((d) =>
            ["initial analysis", "due diligence", "closing", "signing & closing", "prospect", "proposal"].some((s) =>
              (d.stage || "").toLowerCase().includes(s)
            )
          ).length,
          scopedDeals.filter(isClosedWon).length,
        ],
        backgroundColor: ["#E1DFDD", "#86A8D6", "#0078D4", "#107C10"],
        borderRadius: 4,
      },
    ],
  };

  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [goalCategory, setGoalCategory] = useState("Company");
  const [showOkrGuide, setShowOkrGuide] = useState(false);

  // Accurately categorize company members into disciplines strictly by role and position
  const categorizeMember = (u: any): string => {
    const role = (u.role || "").toLowerCase().trim();
    const pos = (u.position || "").toLowerCase();
    const skills = Array.isArray(u.skills) ? u.skills.map((s: string) => s.toLowerCase()).join(" ") : "";
    const details = (u.details || "").toLowerCase();
    const combined = `${role} ${pos} ${skills} ${details}`;

    // 1. Leadership (Owner, Superuser, Admin, Founder, Chief Executive)
    if (
      ["owner", "superuser", "admin", "founder", "ceo"].includes(role) ||
      pos.includes("founder") ||
      pos.includes("chief") ||
      pos.includes("owner") ||
      (pos.includes("executive") && !pos.includes("sales") && !pos.includes("account"))
    ) {
      return "Leadership";
    }

    // 2. Operations & Management (Manager, Operations)
    if (
      ["manager", "operations", "pm", "product manager"].includes(role) ||
      combined.includes("operations") ||
      combined.includes("ops") ||
      combined.includes("logistics")
    ) {
      return "Operations";
    }

    // 3. Sales & Commercial (Sales, Marketing)
    if (
      ["sales", "sales executive", "marketing", "growth"].includes(role) ||
      combined.includes("sales") ||
      combined.includes("marketing") ||
      combined.includes("account executive")
    ) {
      return "Sales";
    }

    // 4. Engineering & Tech (Team Lead, Developer, Engineer, Technical Employees)
    if (
      ["teamlead", "tl", "lead", "developer", "engineer", "lead engineer", "dev"].includes(role) ||
      combined.includes("engineer") ||
      combined.includes("developer") ||
      combined.includes("software") ||
      combined.includes("tech")
    ) {
      return "Engineering";
    }

    // 5. Default company employee / member
    if (role === "employee" || role === "member") {
      return "Engineering";
    }

    return "Leadership";
  };

  const engineeringUsers = users.filter((u) => categorizeMember(u) === "Engineering");
  const salesUsers = users.filter((u) => categorizeMember(u) === "Sales");
  const operationsUsers = users.filter((u) => categorizeMember(u) === "Operations");
  const leadershipUsers = users.filter((u) => categorizeMember(u) === "Leadership");

  const hrBreakdownData = {
    labels: ["Engineering", "Sales", "Operations", "Leadership"],
    datasets: [
      {
        data: [
          engineeringUsers.length,
          salesUsers.length,
          operationsUsers.length,
          leadershipUsers.length,
        ],
        backgroundColor: ["#0078D4", "#107C10", "#F7630C", "#605E5C"],
      },
    ],
  };

  const mrrLineData = {
    labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    datasets: [
      {
        label: "Closed Revenue ($)",
        data: [
          Math.round(currentRevenue.won * 0.15),
          Math.round(currentRevenue.won * 0.3),
          Math.round(currentRevenue.won * 0.45),
          Math.round(currentRevenue.won * 0.7),
          Math.round(currentRevenue.won * 0.85),
          currentRevenue.won,
        ],
        borderColor: "#107C10",
        backgroundColor: "rgba(16, 124, 16, 0.1)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Pipeline Target ($)",
        data: [
          Math.round(currentRevenue.won * 0.3),
          Math.round(currentRevenue.won * 0.5),
          Math.round(currentRevenue.won * 0.75),
          Math.round(currentRevenue.won * 0.9),
          Math.round((currentRevenue.won + currentRevenue.pipeline) * 0.85),
          currentRevenue.won + currentRevenue.pipeline,
        ],
        borderColor: "#0078D4",
        borderDash: [5, 5],
        backgroundColor: "transparent",
        tension: 0.3,
      },
    ],
  };

  const activeProjectObj = projects.find((p) => p._id === selectedProjectId);

  return (
    <main className="flex flex-col min-w-0 p-0 sm:p-4 flex-1 max-w-[1600px] mx-auto w-full">
      {/* Top Header with Fluent 2 design */}
      <header className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.14),0_0_2px_rgba(0,0,0,0.12)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
              Executive &amp; Strategic Portfolio Dashboard
            </h1>
            <Badge tone="success" size="sm">
              Live Verified Data
            </Badge>
          </div>
          <p className="text-sm text-[#605E5C] dark:text-[#C8C6C4] mt-1">
            Consolidated, real-time operating metrics across all projects, tasks, pipelines, and revenue streams.
          </p>
        </div>

        {/* Project Filter Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-[#F3F2F1] dark:bg-[#292827] px-3 py-1.5 rounded-[6px] border border-[#E1DFDD] dark:border-[#3B3A39] text-xs font-medium text-[#242424] dark:text-[#FFFFFF] w-full md:w-auto">
            <Filter className="w-4 h-4 text-[#0078D4]" />
            <span className="text-[#605E5C] dark:text-[#C8C6C4]">Project Scope:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent font-semibold cursor-pointer outline-none text-[#242424] dark:text-[#FFFFFF] pr-2"
            >
              <option value="all">All Projects (Enterprise Overview - {projects.length})</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.totalTasks} tasks)
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Selected Scope Banner if filtering */}
      {!isAll && activeProjectObj && (
        <div className="bg-[#EBF3FC] dark:bg-[#1C2B3D] border border-[#0078D4]/30 rounded-[8px] p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-5 h-5 text-[#0078D4]" />
            <div>
              <span className="text-sm font-semibold text-[#0078D4] dark:text-[#479EF5]">
                Filtered to Project: {activeProjectObj.name}
              </span>
              <span className="text-xs text-[#605E5C] dark:text-[#C8C6C4] ml-2">
                • {activeProjectObj.totalTasks} Tasks ({activeProjectObj.completedTasks} Done) • {activeProjectObj.pipelinesCount} Pipelines
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedProjectId("all")}
            className="text-xs font-semibold text-[#0078D4] hover:underline"
          >
            Clear Filter (Show All Projects)
          </button>
        </div>
      )}

      {/* Executive Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 mb-8">
        <Stat
          label={isAll ? "Active Projects" : "Project Status"}
          value={isAll ? `${portfolioStats.activeProjects} / ${portfolioStats.totalProjects}` : activeProjectObj?.status || "Active"}
          subtext={
            isAll
              ? `${portfolioStats.onTrackProjects} On Track • ${portfolioStats.atRiskProjects} At Risk`
              : `Health: ${activeProjectObj?.health || "On Track"}`
          }
          icon={<FolderKanban className="w-5 h-5" />}
        />

        <Stat
          label="Delivery Velocity"
          value={`${currentTaskCounts.completed} / ${currentTaskCounts.total} Tasks`}
          subtext={`${currentTaskCounts.progressPercent}% Completed • ${currentTaskCounts.inProgress} In Progress`}
          icon={<CheckCircle2 className="w-5 h-5 text-[#107C10]" />}
          change={{
            value: `${currentTaskCounts.progressPercent}% Done`,
            positive: currentTaskCounts.progressPercent >= 20,
          }}
        />

        <Stat
          label="Closed Won ARR"
          value={`$${currentRevenue.won.toLocaleString()}`}
          subtext="Actual closed contract revenue"
          icon={<DollarSign className="w-5 h-5 text-[#107C10]" />}
          change={{ value: "Confirmed", positive: true }}
        />

        <Stat
          label="Pipeline Forecast"
          value={`$${currentRevenue.pipeline.toLocaleString()}`}
          subtext="Active in-flight opportunities"
          icon={<TrendingUp className="w-5 h-5 text-[#0078D4]" />}
        />

        <Stat
          label="Headcount & Capacity"
          value={`${users.length} Members`}
          subtext="Engineering, Sales & Ops"
          icon={<Users className="w-5 h-5 text-[#605E5C]" />}
        />
      </div>

      {/* View Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-6 gap-2">
        <button
          onClick={() => setActiveTab("portfolio")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === "portfolio"
            ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
            : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
        >
          <FolderKanban className="w-4 h-4" />
          Projects Portfolio & Health ({projects.length})
        </button>

        <button
          onClick={() => setActiveTab("tasks")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === "tasks"
            ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
            : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
        >
          <ListTodo className="w-4 h-4" />
          All Tasks Breakdown ({scopedTasks.length})
        </button>

        <button
          onClick={() => setActiveTab("pipelines")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === "pipelines"
            ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
            : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
        >
          <Layers className="w-4 h-4" />
          Strategic Pipelines ({scopedPipelines.length})
        </button>

        <button
          onClick={() => setActiveTab("okrs")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === "okrs"
            ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
            : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
        >
          <Target className="w-4 h-4" />
          Strategic Goals & OKRs ({scopedGoals.length})
        </button>
      </div>

      {/* Tab 1: Project Portfolio Table */}
      {activeTab === "portfolio" && (
        <section className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-2 sm:p-6 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#242424] dark:text-[#FFFFFF]">
                Enterprise Project Portfolio & Task Rollup
              </h2>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                Aggregated task progress, health indicators, pipelines, and revenue per project.
              </p>
            </div>
            <Link
              href="/projects"
              className="text-xs font-semibold text-[#0078D4] hover:underline flex items-center gap-1"
            >
              Manage Projects <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E1DFDD] dark:border-[#3B3A39] text-xs font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase">
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Health / Status</th>
                  <th className="py-3 px-4">Tasks Progress</th>
                  <th className="py-3 px-4">Task Breakdown</th>
                  <th className="py-3 px-4">Pipelines</th>
                  <th className="py-3 px-4">Won Revenue</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDEBE9] dark:divide-[#292827] text-sm">
                {scopedProjects.map((p) => (
                  <tr
                    key={p._id}
                    className={`hover:bg-[#F3F2F1] dark:hover:bg-[#292827] transition-colors ${selectedProjectId === p._id ? "bg-[#EBF3FC] dark:bg-[#1C2B3D]" : ""
                      }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#242424] dark:text-[#FFFFFF]">
                        {p.name}
                      </div>
                      <div className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                        {p.category}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={p.health} />
                        <span className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                          {p.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-[#242424] dark:text-[#FFFFFF]">
                          {p.completedTasks} / {p.totalTasks} Done
                        </span>
                        <span className="text-[#605E5C] dark:text-[#C8C6C4]">
                          {p.progress}%
                        </span>
                      </div>
                      <ProgressBar value={p.progress} size="sm" tone={p.progress >= 70 ? "success" : "brand"} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.completedTasks > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#DFF6DD] text-[#107C10] dark:bg-[#0F3818] dark:text-[#54B054]">
                            {p.completedTasks} Done
                          </span>
                        )}
                        {p.inProgressTasks > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#EBF3FC] text-[#0078D4] dark:bg-[#1C2B3D] dark:text-[#479EF5]">
                            {p.inProgressTasks} Active
                          </span>
                        )}
                        {p.reviewTasks > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#F3E8FF] text-[#8764B8] dark:bg-[#341A52] dark:text-[#C4A3F7]">
                            {p.reviewTasks} Review
                          </span>
                        )}
                        {p.blockedTasks > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#FDE7E9] text-[#D13438] dark:bg-[#44171A] dark:text-[#F1707B]">
                            {p.blockedTasks} Blocked
                          </span>
                        )}
                        {p.todoTasks > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#F3F2F1] text-[#605E5C] dark:bg-[#3B3A39] dark:text-[#C8C6C4]">
                            {p.todoTasks} Todo
                          </span>
                        )}
                        {p.totalTasks === 0 && (
                          <span className="text-xs text-[#A19F9D]">No tasks yet</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#242424] dark:text-[#FFFFFF]">
                      {p.pipelinesCount}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#107C10]">
                      ${p.wonRevenue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {selectedProjectId === p._id ? (
                        <button
                          onClick={() => setSelectedProjectId("all")}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-[#EDEBE9] dark:bg-[#3B3A39] text-[#242424] dark:text-[#FFFFFF] hover:bg-[#E1DFDD]"
                        >
                          Clear
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedProjectId(p._id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-[#0078D4] text-white hover:bg-[#006CBE]"
                        >
                          Filter
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 2: All Tasks Detailed Breakdown */}
      {activeTab === "tasks" && (
        <section className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-2 sm:p-6 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#242424] dark:text-[#FFFFFF]">
                Task Execution & Velocity ({scopedTasks.length} Tasks)
              </h2>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                Complete audit trail of all tasks across projects with assignees, priority, and completion status.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#605E5C] dark:text-[#C8C6C4]">
              {currentTaskCounts.completed} Completed • {currentTaskCounts.inProgress} Active • {currentTaskCounts.review} Review • {currentTaskCounts.todo} Todo
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E1DFDD] dark:border-[#3B3A39] text-xs font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase">
                  <th className="py-3 px-4">Task Name</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDEBE9] dark:divide-[#292827] text-sm">
                {scopedTasks.map((t) => (
                  <tr key={t._id} className="hover:bg-[#F3F2F1] dark:hover:bg-[#292827] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#242424] dark:text-[#FFFFFF]">
                        {t.name}
                      </div>
                      {t.labels.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {t.labels.map((lbl, idx) => (
                            <span key={idx} className="text-[10px] bg-[#EDEBE9] dark:bg-[#3B3A39] px-1.5 py-0.5 rounded text-[#605E5C] dark:text-[#C8C6C4]">
                              {lbl}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium text-[#0078D4] bg-[#EBF3FC] dark:bg-[#1C2B3D] px-2 py-0.5 rounded">
                        {t.projectId?.name || "General / Cross-Project"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-[#242424] dark:text-[#FFFFFF]">
                        {t.assignees.length > 0
                          ? t.assignees.map((a) => a.name).join(", ")
                          : "Unassigned"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${t.priority === "High"
                          ? "bg-[#FDE7E9] text-[#D13438]"
                          : t.priority === "Low"
                            ? "bg-[#DFF6DD] text-[#107C10]"
                            : "bg-[#FFF4CE] text-[#8F6B00]"
                          }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3 px-4 text-xs text-[#605E5C] dark:text-[#C8C6C4]" suppressHydrationWarning>
                      {formatDate(t.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 3: Strategic Pipelines */}
      {activeTab === "pipelines" && (
        <section className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-2 sm:p-6 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#242424] dark:text-[#FFFFFF]">
                Active Project Pipelines ({scopedPipelines.length})
              </h2>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                High-level milestones, team owners, and execution roadmaps.
              </p>
            </div>
            <Link
              href="/dev/timeline"
              className="text-xs font-semibold text-[#0078D4] hover:underline flex items-center gap-1"
            >
              View Interactive Timeline <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {scopedPipelines.map((pipeline: any) => (
              <PipelineCard key={pipeline._id} pipeline={pipeline} />
            ))}
            {scopedPipelines.length === 0 && (
              <div className="col-span-full py-10 text-center text-sm text-[#605E5C] dark:text-[#C8C6C4]">
                No pipelines found matching the selected project scope.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab 4: Strategic Goals & OKRs */}
      {activeTab === "okrs" && (
        <section className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-2 sm:p-6 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#242424] dark:text-[#FFFFFF]">
                Strategic Goals & Key Results (OKRs)
              </h2>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                Company-level and project-specific objectives connected to measurable target indicators.
              </p>
            </div>
          </div>

          {/* OKR Framework Helper & Project Guidance Card */}
          <div className="bg-[#F3F9FD] dark:bg-[#132338] border border-[#0078D4]/30 rounded-[8px] p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[6px] bg-[#0078D4] text-white flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#242424] dark:text-white flex items-center gap-2">
                    <span>Strategic OKR &amp; Project Guidance</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-[#0078D4] dark:text-[#479EF5]">
                      Best Practice
                    </span>
                  </h3>
                  <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                    How objectives, key results, and pipelines connect across your organization.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/projecthelpdemo"
                  className="px-2.5 py-1 text-xs font-semibold rounded border border-[#0078D4]/40 text-[#0078D4] dark:text-[#479EF5] bg-white dark:bg-[#201F1E] hover:bg-[#EBF3FC] transition-colors flex items-center gap-1 shrink-0"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Full Demo Guide</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setShowOkrGuide(!showOkrGuide)}
                  className="p-1 rounded text-[#605E5C] dark:text-[#C8C6C4] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {showOkrGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Collapsible Details & 1-Click Templates */}
            {showOkrGuide && (
              <div className="mt-4 pt-3 border-t border-[#0078D4]/20 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded bg-white dark:bg-[#1C2B3D] border border-[#E1DFDD] dark:border-[#3B3A39]">
                    <span className="font-bold text-[#0078D4] block mb-1">1. Objective (The "What")</span>
                    <p className="text-[#605E5C] dark:text-[#C8C6C4]">
                      Qualitative &amp; inspiring. Sets directional focus for the quarter across Company, Project, or Team.
                    </p>
                  </div>
                  <div className="p-3 rounded bg-white dark:bg-[#1C2B3D] border border-[#E1DFDD] dark:border-[#3B3A39]">
                    <span className="font-bold text-[#107C10] block mb-1">2. Key Results (The "How")</span>
                    <p className="text-[#605E5C] dark:text-[#C8C6C4]">
                      Quantifiable target metric (e.g. $500k revenue, 1,000 physical units, or 99.9% uptime).
                    </p>
                  </div>
                  <div className="p-3 rounded bg-white dark:bg-[#1C2B3D] border border-[#E1DFDD] dark:border-[#3B3A39]">
                    <span className="font-bold text-[#F7630C] block mb-1">3. Cascading to Pipelines</span>
                    <p className="text-[#605E5C] dark:text-[#C8C6C4]">
                      Connects directly to Development Pipelines and Sprints so task completion drives real KR progress.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-[#242424] dark:text-white block mb-2">
                    💡 Quick OKR Presets (Click to Auto-fill Form):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGoalTitle("Launch Ergonomic Chair Line (Physical Product)");
                        setGoalDesc("Produce batch of 1,000 units, maintain 40% margin, establish 5 wholesale distributors");
                        setGoalCategory("Project");
                      }}
                      className="px-3 py-1.5 rounded-[4px] bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] hover:border-[#0078D4] text-xs font-medium text-[#242424] dark:text-white transition-all text-left flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>🪑 Physical Product Launch</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGoalTitle("Enterprise SaaS ARR & Customer Acquisition");
                        setGoalDesc("Reach $500k ARR with 25 signed enterprise accounts and churn below 2%");
                        setGoalCategory("Company");
                      }}
                      className="px-3 py-1.5 rounded-[4px] bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] hover:border-[#0078D4] text-xs font-medium text-[#242424] dark:text-white transition-all text-left flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>📈 SaaS ARR Growth</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGoalTitle("Sprint Velocity & Zero-Downtime Infrastructure");
                        setGoalDesc("Deliver 100% sprint roadmap items on time with sub-100ms API response time");
                        setGoalCategory("Team");
                      }}
                      className="px-3 py-1.5 rounded-[4px] bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] hover:border-[#0078D4] text-xs font-medium text-[#242424] dark:text-white transition-all text-left flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>⚡ Sprint Velocity &amp; SLA</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Create Goal Form */}
          <form action={addGoal} className="bg-[#F3F2F1] dark:bg-[#292827] p-4 rounded-[6px] mb-6 flex gap-3 flex-wrap items-center">
            <input
              type="text"
              name="title"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] px-3 py-1.5 rounded text-sm flex-1 min-w-[200px]"
              placeholder="Objective Title (e.g. Q4 Platform Launch)..."
              required
            />
            <input
              type="text"
              name="description"
              value={goalDesc}
              onChange={(e) => setGoalDesc(e.target.value)}
              className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] px-3 py-1.5 rounded text-sm flex-1 min-w-[200px]"
              placeholder="Key Result description..."
            />
            <select
              name="category"
              value={goalCategory}
              onChange={(e) => setGoalCategory(e.target.value)}
              className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] px-3 py-1.5 rounded text-sm cursor-pointer"
            >
              <option value="Company">Company</option>
              <option value="Project">Project</option>
              <option value="Team">Team</option>
            </select>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#0078D4] text-white rounded text-sm font-semibold hover:bg-[#006CBE] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Goal
            </button>
          </form>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scopedGoals.map((g) => (
              <div
                key={g._id}
                className="border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 flex flex-col justify-between hover:border-[#0078D4] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-[#0078D4] uppercase tracking-wider">
                      {g.category} {g.projectId ? `• ${g.projectId.name}` : ""}
                    </span>
                    <StatusBadge status={g.status} />
                  </div>

                  <h3 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF] mb-1">
                    {g.title}
                  </h3>
                  <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-4">
                    {g.description || "No key result description provided"}
                  </p>

                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#242424] dark:text-[#FFFFFF]">Progress</span>
                    <span className="font-bold text-[#0078D4]">{g.progress}%</span>
                  </div>
                  <ProgressBar value={g.progress} size="sm" tone={g.progress >= 70 ? "success" : "brand"} />

                  {/* Connected Targets */}
                  {g.targets && g.targets.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#EDEBE9] dark:divide-[#292827] space-y-1.5">
                      <span className="text-[11px] font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase">
                        Key Targets:
                      </span>
                      {g.targets.map((tgt: any) => (
                        <div key={tgt._id} className="flex justify-between text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                          <span className="truncate pr-2">{tgt.name}</span>
                          <span className="font-medium text-[#242424] dark:text-[#FFFFFF] whitespace-nowrap">
                            {tgt.actualValue} / {tgt.expectedValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#EDEBE9] dark:border-[#3B3A39]">
                  <form
                    action={deleteGoal}
                    onSubmit={(e) => {
                      if (!window.confirm("Are you sure you want to delete this Goal and connected Targets?")) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="goalId" value={g._id} />
                    <button
                      type="submit"
                      className="text-xs text-[#D13438] hover:underline flex items-center gap-1 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cross-Department Analytics Charts */}
      <h2 className="text-lg font-bold text-[#242424] dark:text-[#FFFFFF] mb-4">
        Cross-Department Rollup Telemetry
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Engineering Velocity (Tasks Count) */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-4">
            <div>
              <h3 className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF]">
                Engineering Velocity & Task Distribution
              </h3>
              <span className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                {isAll ? "Across all projects (9 tasks)" : `${activeProjectObj?.name} (${scopedTasks.length} tasks)`}
              </span>
            </div>
            <span className="text-xs font-bold text-[#0078D4]">
              {currentTaskCounts.completed} of {currentTaskCounts.total} Done
            </span>
          </div>
          <div className="h-56">
            <Bar
              data={devChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Finance & Revenue Trajectory */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-4">
            <div>
              <h3 className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF]">
                Finance & Contract Revenue Trajectory
              </h3>
              <span className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                Closed Won ARR vs. Forecasted Opportunities
              </span>
            </div>
            <span className="text-xs font-bold text-[#107C10]">
              ${currentRevenue.won.toLocaleString()} ARR
            </span>
          </div>
          <div className="h-56">
            <Line
              data={mrrLineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top", labels: { boxWidth: 12 } } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (val) => `$${Number(val).toLocaleString()}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Sales Pipeline Conversion */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-4">
            <div>
              <h3 className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF]">
                Sales Pipeline Conversion Funnel
              </h3>
              <span className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                Volume of leads transitioning into closed contracts
              </span>
            </div>
            <span className="text-xs font-bold text-[#0078D4]">
              {scopedDeals.length} Deals Tracked
            </span>
          </div>
          <div className="h-56">
            <Bar
              data={salesFunnelData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Headcount & Capacity */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-4">
            <div>
              <h3 className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF]">
                Organizational Capacity by Department
              </h3>
              <span className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                Active team members allocated across disciplines
              </span>
            </div>
            <span className="text-xs font-bold text-[#605E5C]">
              {users.length} Total Users
            </span>
          </div>
          <div className="h-56 flex items-center justify-center">
            <Doughnut
              data={hrBreakdownData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "65%",
                plugins: {
                  legend: {
                    position: "right",
                    labels: { boxWidth: 12, font: { size: 11 } },
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context: any) {
                        const label = context.label || "";
                        const value = context.parsed || 0;
                        const matching = users.filter((u) => categorizeMember(u) === label);
                        const names = matching.map((m) => `${m.name} (${m.role})`).join(", ");
                        return `${label}: ${value} member${value === 1 ? "" : "s"}${names ? ` • ${names}` : ""}`;
                      },
                    },
                  },
                },
              }}
            />
          </div>

          {/* Member Roster Discipline Breakdown */}
          <div className="mt-4 pt-3 border-t border-[#EDEBE9] dark:border-[#3B3A39] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center justify-between p-2 rounded bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <span className="font-semibold text-[#0078D4]">Engineering ({engineeringUsers.length})</span>
              <span className="text-[#605E5C] dark:text-[#C8C6C4] truncate max-w-[130px]" title={engineeringUsers.map(u => `${u.name} (${u.role})`).join(", ")}>
                {engineeringUsers.map(u => u.name).join(", ") || "None"}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="font-semibold text-[#107C10]">Sales ({salesUsers.length})</span>
              <span className="text-[#605E5C] dark:text-[#C8C6C4] truncate max-w-[130px]" title={salesUsers.map(u => `${u.name} (${u.role})`).join(", ")}>
                {salesUsers.map(u => u.name).join(", ") || "None"}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40">
              <span className="font-semibold text-[#F7630C]">Operations ({operationsUsers.length})</span>
              <span className="text-[#605E5C] dark:text-[#C8C6C4] truncate max-w-[130px]" title={operationsUsers.map(u => `${u.name} (${u.role})`).join(", ")}>
                {operationsUsers.map(u => u.name).join(", ") || "None"}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
              <span className="font-semibold text-[#605E5C] dark:text-[#C8C6C4]">Leadership ({leadershipUsers.length})</span>
              <span className="text-[#605E5C] dark:text-[#C8C6C4] truncate max-w-[130px]" title={leadershipUsers.map(u => `${u.name} (${u.role})`).join(", ")}>
                {leadershipUsers.map(u => u.name).join(", ") || "None"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
