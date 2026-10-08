"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  addDeal,
  addResourceAllocation,
  updateDealStage,
  updateDeal,
  deleteDeal,
} from "@/actions";
import PipelineCard from "@/components/PipelineCard";
import RevenueExampleModal from "@/components/RevenueExampleModal";
import { Badge } from "@/components/ui/Badge";
import {
  DollarSign,
  TrendingUp,
  Target,
  BarChart3,
  Columns3,
  Scale,
  Layers,
  Plus,
  Search,
  Building2,
  Calendar,
  AlertTriangle,
  FolderKanban,
  Workflow,
  Edit3,
  Trash2,
  X,
  BookOpen,
  PieChart,
  CheckCircle2,
  ArrowUpRight,
  GripVertical,
  SlidersHorizontal,
  Shield,
  ShieldCheck,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DEAL_STAGES = [
  "Prospect",
  "Initial Analysis",
  "Due Diligence",
  "Closing",
  "Signing & Closing",
  "Closed",
  "Integration",
] as const;

type DealStage = (typeof DEAL_STAGES)[number];

const STAGE_CONFIG: Record<
  DealStage,
  { label: string; tone: "brand" | "caution" | "warning" | "success" | "neutral"; accentColor: string }
> = {
  Prospect: { label: "Prospect", tone: "brand", accentColor: "#0078D4" },
  "Initial Analysis": { label: "Initial Analysis", tone: "brand", accentColor: "#00B7C3" },
  "Due Diligence": { label: "Due Diligence", tone: "caution", accentColor: "#8F6B00" },
  Closing: { label: "Closing", tone: "warning", accentColor: "#F7630C" },
  "Signing & Closing": { label: "Signing & Closing", tone: "brand", accentColor: "#5C2D91" },
  Closed: { label: "Closed", tone: "success", accentColor: "#107C10" },
  Integration: { label: "Integration", tone: "success", accentColor: "#008272" },
};

interface DealItem {
  _id: string;
  name: string;
  amount: number;
  stage: string;
  client?: {
    name?: string;
    industry?: string;
    region?: string;
  } | null;
  expectedCloseDate?: string | null;
  status?: string;
  metadata?: {
    priority?: string;
    riskLevel?: string;
  } | null;
  projectId?: string | null;
  pipelineId?: string | null;
}

interface TargetItem {
  _id: string;
  name: string;
  achievedRevenueUSD?: number;
  conversionRate?: string;
  targetByRegion?: Record<string, number>;
  industry?: string | null;
  region?: string | null;
  expectedValue?: number;
  actualValue?: number;
  goalId?: string | null;
}

interface PipelineItem {
  _id: string;
  name: string;
  progress: number;
  category: string;
  owner?: string;
  priority?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  riskLevel?: string;
  objectives?: string;
  kpis?: string;
  projectId?: { _id?: string; name?: string } | null;
  teamId?: { _id?: string; name?: string } | null;
  taskId?: { _id?: string; name?: string } | null;
  cashFlowProjectionUSD: number;
  expensesUSD: number;
  roiPercent: number;
  memberIds?: string[];
  todos?: Array<{
    _id: string;
    text: string;
    completed: boolean;
    assigneeType?: string;
    assigneeName?: string;
  }>;
}

interface ResourceItem {
  _id: string;
  name: string;
  type: string;
  totalAllocated: number;
  totalUsed: number;
  riskLevel: string;
  linkedDealId?: string | null;
  assignedToProjectId?: { _id: string; name: string } | null;
}

interface RevenueDashboardClientProps {
  deals: DealItem[];
  targets: TargetItem[];
  pipelines?: PipelineItem[];
  resources?: ResourceItem[];
  options?: {
    projects: { id: string; name: string }[];
    teams: { id: string; name: string }[];
    tasks: { id: string; name: string }[];
    users: { id: string; name: string }[];
  };
  currentRole?: string;
  currentUserId?: string;
  currentUserName?: string;
  isGuest?: boolean;
}

export default function RevenueDashboardClient({
  deals = [],
  targets = [],
  pipelines = [],
  resources = [],
  options = { projects: [], teams: [], tasks: [], users: [] },
  currentRole,
  currentUserId,
  currentUserName,
  isGuest = false,
}: RevenueDashboardClientProps) {
  const role = (currentRole || "manager").toLowerCase();
  const canManageRevenue = ["owner", "manager", "superuser"].includes(role);

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<"kanban" | "analytics" | "resources" | "pipelines">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("all");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState("all");
  const [showExampleModal, setShowExampleModal] = useState(false);

  // Modals State
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [targetAddStage, setTargetAddStage] = useState<string>("Prospect");
  const [editingDeal, setEditingDeal] = useState<DealItem | null>(null);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);

  // Drag and Drop optimistic state
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        deal.name.toLowerCase().includes(q) ||
        (deal.client?.name && deal.client.name.toLowerCase().includes(q)) ||
        (deal.client?.industry && deal.client.industry.toLowerCase().includes(q)) ||
        (deal.client?.region && deal.client.region.toLowerCase().includes(q));

      const matchesProject =
        selectedProjectFilter === "all" || deal.projectId === selectedProjectFilter;

      const priority = deal.metadata?.priority || "Medium";
      const matchesPriority =
        selectedPriorityFilter === "all" || priority.toLowerCase() === selectedPriorityFilter.toLowerCase();

      return matchesSearch && matchesProject && matchesPriority;
    });
  }, [deals, searchQuery, selectedProjectFilter, selectedPriorityFilter]);

  // Executive KPI Calculations
  const totalPipelineRevenue = useMemo(() => {
    return deals.reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [deals]);

  const closedDeals = useMemo(() => {
    return deals.filter((d) => d.stage === "Closed" || d.stage === "Integration");
  }, [deals]);

  const closedRevenue = useMemo(() => {
    return closedDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [closedDeals]);

  const averageDealSize = useMemo(() => {
    return deals.length ? Math.round(totalPipelineRevenue / deals.length) : 0;
  }, [deals, totalPipelineRevenue]);

  const targetRevenueUSD = useMemo(() => {
    return targets.reduce((sum, t) => sum + (t.expectedValue || 0), 0);
  }, [targets]);

  const achievedRevenueUSD = useMemo(() => {
    return targets.reduce((sum, t) => sum + (t.achievedRevenueUSD || 0), 0);
  }, [targets]);

  const targetAttainment = useMemo(() => {
    if (!targetRevenueUSD) return 0;
    return Math.round((achievedRevenueUSD / targetRevenueUSD) * 100);
  }, [achievedRevenueUSD, targetRevenueUSD]);

  const winRate = useMemo(() => {
    if (!deals.length) return 0;
    return Math.round((closedDeals.length / deals.length) * 100);
  }, [deals.length, closedDeals.length]);

  // Alerts
  const unallocatedDeals = useMemo(() => {
    return deals.filter(
      (d) =>
        d.stage === "Integration" &&
        !resources.some((r) => r.linkedDealId === d._id)
    );
  }, [deals, resources]);

  const highExpensePipelines = useMemo(() => {
    return pipelines.filter(
      (p) => p.cashFlowProjectionUSD > 0 && p.expensesUSD > p.cashFlowProjectionUSD * 0.8
    );
  }, [pipelines]);

  const alerts = useMemo(() => {
    const list: { type: "deal" | "pipeline"; title: string; message: string }[] = [];
    unallocatedDeals.forEach((d) => {
      list.push({
        type: "deal",
        title: "Unallocated Integration Deal",
        message: `Deal "${d.name}" ($${(d.amount || 0).toLocaleString()}) has reached Integration stage but lacks assigned resource allocation.`,
      });
    });
    highExpensePipelines.forEach((p) => {
      list.push({
        type: "pipeline",
        title: "High Operational Expense Ratio",
        message: `Financial pipeline "${p.name}" expenses ($${p.expensesUSD.toLocaleString()}) exceed 80% of cash flow projections ($${p.cashFlowProjectionUSD.toLocaleString()}).`,
      });
    });
    return list;
  }, [unallocatedDeals, highExpensePipelines]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("dealId", dealId);
    setDraggedDealId(dealId);
  };

  const handleDragEnd = () => {
    setDraggedDealId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData("dealId");
    if (dealId) {
      startTransition(async () => {
        await updateDealStage(dealId, newStage);
      });
    }
  };

  // Chart Data: Deal Revenue by Stage
  const pipelineChartData = useMemo(() => {
    const stageValues = DEAL_STAGES.map((stage) => {
      return deals
        .filter((d) => d.stage === stage)
        .reduce((sum, d) => sum + (d.amount || 0), 0);
    });

    return {
      labels: DEAL_STAGES.map((s) => s),
      datasets: [
        {
          label: "Stage Revenue ($)",
          data: stageValues,
          backgroundColor: [
            "#0078D4",
            "#00B7C3",
            "#8F6B00",
            "#F7630C",
            "#5C2D91",
            "#107C10",
            "#008272",
          ],
          borderRadius: 4,
        },
      ],
    };
  }, [deals]);

  // Chart Data: Regional Distribution
  const regionChartData = useMemo(() => {
    const regionCounts = targets.reduce<Record<string, number>>((acc, t) => {
      const r = t.region || "Unassigned";
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});

    const regions = Object.keys(regionCounts);
    return {
      labels: regions.length ? regions : ["Unassigned"],
      datasets: [
        {
          data: regions.length ? regions.map((r) => regionCounts[r]) : [1],
          backgroundColor: [
            "#0078D4",
            "#107C10",
            "#F7630C",
            "#5C2D91",
            "#00B7C3",
            "#8F6B00",
          ],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    };
  }, [targets]);

  // Chart Data: Industry Breakdown
  const industryChartData = useMemo(() => {
    const counts = targets.reduce<Record<string, number>>((acc, t) => {
      const ind = t.industry || "General";
      acc[ind] = (acc[ind] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(counts);
    return {
      labels: labels.length ? labels : ["General"],
      datasets: [
        {
          label: "Targets Count",
          data: labels.length ? labels.map((l) => counts[l]) : [0],
          backgroundColor: "#0078D4",
          borderRadius: 4,
        },
      ],
    };
  }, [targets]);

  // Stage Revenue Totals for Kanban Headers
  const stageTotals = useMemo(() => {
    const map: Record<string, { count: number; sum: number }> = {};
    DEAL_STAGES.forEach((s) => {
      const matching = filteredDeals.filter((d) => d.stage === s);
      map[s] = {
        count: matching.length,
        sum: matching.reduce((acc, curr) => acc + (curr.amount || 0), 0),
      };
    });
    return map;
  }, [filteredDeals]);

  const openAddDealModal = (stage = "Prospect") => {
    setTargetAddStage(stage);
    setIsAddDealOpen(true);
  };

  return (
    <main className="flex flex-col min-w-0 p-0 sm:p-4 flex-1 max-w-[1600px] mx-auto w-full">
      {/* Fluent 2 Header */}
      <header className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <h1 className="text-lg lg:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
              Revenue Management &amp; Financial Architecture
            </h1>
            <div className="flex gap-2">
              <Badge tone="brand" size="sm">
                Enterprise Finance
              </Badge>
              <Badge tone="success" size="sm">
                Live Verified Ledger
              </Badge>
            </div>
          </div>
          <p className="text-sm text-[#605E5C] dark:text-[#C8C6C4] mt-1">
            Complete strategic revenue tracking, deals pipeline Kanban, resource envelopes, and operational financial telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
          <button
            onClick={() => setShowExampleModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px] text-xs font-semibold text-[#242424] dark:text-[#FFFFFF] hover:bg-[#F3F2F1] dark:hover:bg-[#323130] transition-colors shadow-sm cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#0078D4]" />
            <span>Interactive Blueprint</span>
          </button>

          {isGuest ? (
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[6px] text-xs font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Deal</span>
            </button>
          ) : (
            <button
              onClick={() => openAddDealModal("Prospect")}
              className="flex items-center gap-2 px-4 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[6px] text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Deal</span>
            </button>
          )}
        </div>
      </header>

      {/* Executive KPI Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#605E5C] dark:text-[#C8C6C4]">
              Total Pipeline Value
            </span>
            <span className="p-1.5 rounded-[4px] bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4]">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg lg:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
              ${totalPipelineRevenue.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-[#107C10] inline-flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {deals.length} Active Deals
            </span>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-2">
            Weighted across all 7 operational Kanban stages
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#605E5C] dark:text-[#C8C6C4]">
              Closed &amp; Recognized Revenue
            </span>
            <span className="p-1.5 rounded-[4px] bg-[#DFF6DD] dark:bg-[#0F3818] text-[#107C10]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#107C10] dark:text-[#54B054]">
              ${closedRevenue.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-[#605E5C] dark:text-[#C8C6C4]">
              ({winRate}% Win Rate)
            </span>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-2">
            {closedDeals.length} won contracts in Closed &amp; Integration
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#605E5C] dark:text-[#C8C6C4]">
              Annual Target Attainment
            </span>
            <span className="p-1.5 rounded-[4px] bg-[#FFF4CE] dark:bg-[#4A3E09] text-[#8F6B00] dark:text-[#FFD335]">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg lg:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
              {targetAttainment}%
            </span>
            <span className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
              of ${targetRevenueUSD.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-[#EDEBE9] dark:bg-[#323130] h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[#0078D4] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(targetAttainment, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#605E5C] dark:text-[#C8C6C4]">
              Average Deal Value
            </span>
            <span className="p-1.5 rounded-[4px] bg-[#FDE7D9] dark:bg-[#4A2209] text-[#F7630C]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg lg:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
              ${averageDealSize.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-2">
            Enterprise portfolio mean across {deals.length} deals
          </p>
        </div>
      </div>

      {/* Dynamic Executive Alerts Banner (if any) */}
      {alerts.length > 0 && (
        <div className="mb-6 bg-[#FFF4CE] dark:bg-[#4A3E09]/40 border border-[#8F6B00]/40 rounded-[8px] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#8F6B00] text-white shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#8F6B00] dark:text-[#FFD335] uppercase tracking-wider">
                {alerts.length} Operational Anomalies Flagged
              </h4>
              <p className="text-xs text-[#242424] dark:text-[#FFFFFF] mt-0.5">
                {alerts[0].message}
                {alerts.length > 1 && ` (+${alerts.length - 1} more warnings)`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("resources")}
            className="text-xs font-semibold text-[#8F6B00] dark:text-[#FFD335] underline hover:no-underline shrink-0"
          >
            Review Resource Allocations &rarr;
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-6 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("kanban")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === "kanban"
            ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
            : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
        >
          <Columns3 className="w-4 h-4" />
          <span>Deals Pipeline (Kanban)</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F3F2F1] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4]">
            {filteredDeals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === "analytics"
            ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
            : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Financial Analytics &amp; Intelligence</span>
        </button>

        <button
          onClick={() => setActiveTab("resources")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === "resources"
            ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
            : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
        >
          <Scale className="w-4 h-4" />
          <span>Resource Allocations &amp; Budgets</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F3F2F1] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4]">
            {resources.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("pipelines")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === "pipelines"
            ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
            : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
        >
          <Layers className="w-4 h-4" />
          <span>Financial Pipelines</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F3F2F1] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4]">
            {pipelines.length}
          </span>
        </button>
      </div>

      {/* Global Filter Bar for Kanban and Lists */}
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-3.5 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#605E5C] dark:text-[#C8C6C4] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals, clients, industry, region..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] placeholder-[#8A8886] outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424] underline"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-end">
          <div className="flex items-center gap-1.5 text-xs text-[#605E5C] dark:text-[#C8C6C4]">
            <FolderKanban className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>Project:</span>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] px-2 py-1 text-xs text-[#242424] dark:text-[#FFFFFF] outline-none cursor-pointer"
            >
              <option value="all">All Projects</option>
              {options.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#605E5C] dark:text-[#C8C6C4]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>Priority:</span>
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] px-2 py-1 text-xs text-[#242424] dark:text-[#FFFFFF] outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===================== TAB 1: KANBAN BOARD ===================== */}
      {activeTab === "kanban" && (
        <section className="flex flex-col min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider">
                Deals Pipeline Flow (Drag cards across stages)
              </span>
              {isPending && (
                <span className="text-xs text-[#0078D4] animate-pulse font-medium">
                  Saving updates...
                </span>
              )}
            </div>
            <span className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
              Showing {filteredDeals.length} of {deals.length} deals
            </span>
          </div>

          {/* Kanban Columns Horizontal Container */}
          <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[580px]">
            {DEAL_STAGES.map((stage) => {
              const stageDeals = filteredDeals.filter((d) => d.stage === stage);
              const info = STAGE_CONFIG[stage];
              const total = stageTotals[stage]?.sum || 0;
              const isOver = dragOverStage === stage;

              return (
                <div
                  key={stage}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage)}
                  className={`flex-1 min-w-[280px] max-w-[320px] bg-[#FAF9F8] dark:bg-[#1B1A19] rounded-[8px] border transition-all duration-150 flex flex-col ${isOver
                    ? "border-[#0078D4] ring-2 ring-[#0078D4]/40 bg-[#EBF3FC]/60 dark:bg-[#1C2B3D]/60"
                    : "border-[#E1DFDD] dark:border-[#3B3A39]"
                    }`}
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-[#E1DFDD] dark:border-[#3B3A39] flex items-center justify-between bg-white dark:bg-[#201F1E] rounded-t-[8px]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: info.accentColor }}
                        />
                        <h3 className="font-semibold text-xs text-[#242424] dark:text-[#FFFFFF] truncate">
                          {stage}
                        </h3>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#F3F2F1] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4]">
                          {stageDeals.length}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-[#107C10] dark:text-[#54B054] mt-1">
                        ${total.toLocaleString()}
                      </div>
                    </div>

                    {isGuest ? (
                      <span className="p-1 text-gray-300 dark:text-gray-600 cursor-not-allowed">
                        <Plus className="w-4 h-4" />
                      </span>
                    ) : (
                      <button
                        onClick={() => openAddDealModal(stage)}
                        className="p-1 text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#0078D4] dark:hover:text-[#479EF5] hover:bg-[#F3F2F1] dark:hover:bg-[#292827] rounded-[4px] transition-colors cursor-pointer"
                        title={`Add deal to ${stage}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Cards Drop Area */}
                  <div className="p-2.5 space-y-2.5 flex-1 min-h-[300px] overflow-y-auto max-h-[70vh]">
                    {stageDeals.map((deal) => {
                      const priority = deal.metadata?.priority || "Medium";
                      const isDragging = draggedDealId === deal._id;

                      return (
                        <div
                          key={deal._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal._id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px] p-3 shadow-sm hover:shadow-md hover:border-[#0078D4] transition-all cursor-grab active:cursor-grabbing group ${isDragging ? "opacity-40 scale-95" : ""
                            }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="font-semibold text-xs text-[#242424] dark:text-[#FFFFFF] leading-snug line-clamp-2">
                              {deal.name}
                            </span>
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                              <button
                                type="button"
                                draggable={false}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setEditingDeal(deal);
                                }}
                                className="p-1 text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#0078D4] transition-colors rounded cursor-pointer"
                                title={canManageRevenue ? "Edit Deal" : "Inspect / Advance Deal Stage"}
                              >
                                <Edit3 className="w-3.5 h-3.5 pointer-events-none" />
                              </button>
                              {!isGuest && canManageRevenue && (
                                <form
                                  action={deleteDeal}
                                  onSubmit={(e) => {
                                    if (!window.confirm(`Delete deal "${deal.name}"?`)) {
                                      e.preventDefault();
                                    }
                                  }}
                                >
                                  <input type="hidden" name="dealId" value={deal._id} />
                                  <button
                                    type="submit"
                                    className="p-1 text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#D13438] transition-colors rounded cursor-pointer"
                                    title="Delete Deal"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </form>
                              )}
                            </div>
                          </div>

                          {/* Deal Value & Priority Badge */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-sm font-bold text-[#107C10] dark:text-[#54B054]">
                              ${(deal.amount || 0).toLocaleString()}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-[3px] ${priority === "High"
                                ? "bg-[#FDE7E9] text-[#D13438] dark:bg-[#44171A] dark:text-[#F1707B]"
                                : priority === "Low"
                                  ? "bg-[#DFF6DD] text-[#107C10] dark:bg-[#0F3818] dark:text-[#54B054]"
                                  : "bg-[#FFF4CE] text-[#8F6B00] dark:bg-[#4A3E09] dark:text-[#FFD335]"
                                }`}
                            >
                              {priority}
                            </span>
                          </div>

                          {/* Client & Metadata Details */}
                          <div className="space-y-1 text-[11px] text-[#605E5C] dark:text-[#C8C6C4] pt-2 border-t border-[#F3F2F1] dark:border-[#292827]">
                            {deal.client?.name && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Building2 className="w-3 h-3 text-[#0078D4] shrink-0" />
                                <span className="truncate">{deal.client.name}</span>
                              </div>
                            )}

                            {deal.expectedCloseDate && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-[#605E5C] shrink-0" />
                                <span>
                                  Close: {new Date(deal.expectedCloseDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            )}

                            {deal.projectId && (
                              <div className="flex items-center gap-1.5 truncate text-[#0078D4] dark:text-[#479EF5]">
                                <FolderKanban className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {options.projects.find((p) => p.id === deal.projectId)?.name || "Project"}
                                </span>
                              </div>
                            )}

                            {deal.pipelineId && (
                              <div className="flex items-center gap-1.5 truncate text-[#5C2D91] dark:text-[#B4A0FF]">
                                <Workflow className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {pipelines.find((p) => p._id === deal.pipelineId)?.name || "Pipeline"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {stageDeals.length === 0 && (
                      <div className="border border-dashed border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px] p-4 text-center text-xs text-[#8A8886] flex flex-col items-center justify-center min-h-[140px]">
                        <GripVertical className="w-4 h-4 text-[#C8C6C4] mb-1" />
                        <span>No deals in this stage</span>
                        <span className="text-[10px] text-[#A19F9D]">Drag cards here</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================== TAB 2: ANALYTICS & INTELLIGENCE ===================== */}
      {activeTab === "analytics" && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pipeline by Stage Chart */}
            <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F3F2F1] dark:border-[#292827]">
                <div>
                  <h3 className="text-sm font-semibold text-[#242424] dark:text-[#FFFFFF]">
                    Pipeline Revenue by Kanban Stage ($ USD)
                  </h3>
                  <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                    Volume distribution across operational progress checkpoints
                  </p>
                </div>
                <Badge tone="brand" size="sm">
                  ${totalPipelineRevenue.toLocaleString()} Total
                </Badge>
              </div>
              <div className="h-72">
                <Bar
                  data={pipelineChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `Revenue: $${Number(context.raw).toLocaleString()}`,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Regional Target Breakdown */}
            <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F3F2F1] dark:border-[#292827]">
                <div>
                  <h3 className="text-sm font-semibold text-[#242424] dark:text-[#FFFFFF]">
                    Targets by Geographic Region
                  </h3>
                  <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                    Territory segmentation
                  </p>
                </div>
                <PieChart className="w-4 h-4 text-[#0078D4]" />
              </div>
              <div className="h-72 flex items-center justify-center">
                <Doughnut
                  data={regionChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "60%",
                    plugins: {
                      legend: { position: "bottom" },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Industry Segmentation Chart */}
            <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F3F2F1] dark:border-[#292827]">
                <div>
                  <h3 className="text-sm font-semibold text-[#242424] dark:text-[#FFFFFF]">
                    Target Distribution by Industry Sector
                  </h3>
                  <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                    Market sector coverage
                  </p>
                </div>
                <Building2 className="w-4 h-4 text-[#0078D4]" />
              </div>
              <div className="h-64">
                <Bar
                  data={industryChartData}
                  options={{
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            </div>

            {/* Executive Alerts & Risk Telemetry */}
            <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F3F2F1] dark:border-[#292827]">
                  <div>
                    <h3 className="text-sm font-semibold text-[#242424] dark:text-[#FFFFFF] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#8F6B00]" />
                      <span>Executive Risk &amp; Governance Alerts</span>
                    </h3>
                    <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                      Automated operational rule engine checking financial integrity
                    </p>
                  </div>
                  <Badge tone={alerts.length > 0 ? "warning" : "success"} size="sm">
                    {alerts.length > 0 ? `${alerts.length} Issues` : "Nominal"}
                  </Badge>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto">
                  {alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-[6px] bg-[#FFF4CE]/40 dark:bg-[#4A3E09]/30 border border-[#8F6B00]/30 text-xs"
                    >
                      <span className="font-semibold text-[#8F6B00] dark:text-[#FFD335] block mb-0.5">
                        {alert.title}
                      </span>
                      <p className="text-[#605E5C] dark:text-[#C8C6C4]">{alert.message}</p>
                    </div>
                  ))}

                  {alerts.length === 0 && (
                    <div className="text-center py-8 text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                      <CheckCircle2 className="w-8 h-8 text-[#107C10] mx-auto mb-2" />
                      <span>All systems nominal. No unallocated deals or budget overruns detected.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#F3F2F1] dark:border-[#292827] mt-4 flex justify-end">
                <button
                  onClick={() => setIsAddResourceOpen(true)}
                  className="text-xs font-semibold text-[#0078D4] dark:text-[#479EF5] hover:underline"
                >
                  Allocate Resource Envelopes &rarr;
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================== TAB 3: RESOURCE ALLOCATIONS ===================== */}
      {activeTab === "resources" && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-[#242424] dark:text-[#FFFFFF] flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#0078D4]" />
                <span>Resource Allocation Envelopes &amp; Budgets</span>
              </h3>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-0.5">
                Financial envelopes connecting deals and projects to operational budgets, manpower, and toolsets.
              </p>
            </div>
            {isGuest ? (
              <button
                disabled
                className="flex items-center gap-2 px-3.5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[6px] text-xs font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Allocate Resource</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAddResourceOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[6px] text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Allocate Resource</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {resources.map((resource) => {
              const utilPercent = resource.totalAllocated
                ? Math.round((resource.totalUsed / resource.totalAllocated) * 100)
                : 0;

              const progressColor =
                utilPercent > 90
                  ? "bg-[#D13438]"
                  : utilPercent > 75
                    ? "bg-[#F7630C]"
                    : "bg-[#107C10]";

              return (
                <div
                  key={resource._id}
                  className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-semibold text-xs text-[#242424] dark:text-[#FFFFFF] truncate">
                        {resource.name}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-[3px] font-semibold ${resource.riskLevel === "High"
                          ? "bg-[#FDE7E9] text-[#D13438]"
                          : resource.riskLevel === "Medium"
                            ? "bg-[#FFF4CE] text-[#8F6B00]"
                            : "bg-[#DFF6DD] text-[#107C10]"
                          }`}
                      >
                        {resource.riskLevel} Risk
                      </span>
                    </div>

                    <div className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4] mb-3 flex items-center gap-1.5">
                      <Badge tone="neutral" size="sm">
                        {resource.type}
                      </Badge>
                      <span>• {utilPercent}% Utilized</span>
                    </div>

                    <div className="w-full bg-[#EDEBE9] dark:bg-[#323130] h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all ${progressColor}`}
                        style={{ width: `${Math.min(utilPercent, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] font-semibold text-[#605E5C] dark:text-[#C8C6C4] mb-3">
                      <span>Used: {resource.totalUsed.toLocaleString()}</span>
                      <span>Alloc: {resource.totalAllocated.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#F3F2F1] dark:border-[#292827] space-y-1 text-[11px] text-[#605E5C] dark:text-[#C8C6C4]">
                    {resource.assignedToProjectId && (
                      <div className="flex items-center gap-1.5 truncate text-[#0078D4] dark:text-[#479EF5]">
                        <FolderKanban className="w-3 h-3 shrink-0" />
                        <span className="truncate">{resource.assignedToProjectId.name}</span>
                      </div>
                    )}
                    {resource.linkedDealId && (
                      <div className="flex items-center gap-1.5 truncate text-[#107C10] dark:text-[#54B054]">
                        <DollarSign className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {deals.find((d) => d._id === resource.linkedDealId)?.name || "Linked Deal"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {resources.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-[#605E5C] dark:text-[#C8C6C4] bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px]">
                No resource allocations recorded yet. Click &quot;Allocate Resource&quot; to define budget and manpower limits.
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===================== TAB 4: OPERATIONAL PIPELINES ===================== */}
      {activeTab === "pipelines" && (
        <section className="space-y-6">
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-[#242424] dark:text-[#FFFFFF] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0078D4]" />
                <span>Active Financial Operational Pipelines</span>
              </h3>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-0.5">
                Pipelines in the Finance category executing capital deployments, projections, and ROI tracking.
              </p>
            </div>
            <Badge tone="brand" size="sm">
              {pipelines.length} Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipelines.map((pipeline) => (
              <PipelineCard key={pipeline._id} pipeline={pipeline} />
            ))}
            {pipelines.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-[#605E5C] dark:text-[#C8C6C4] bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px]">
                No active financial pipelines configured.
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===================== MODAL: CREATE DEAL ===================== */}
      {isAddDealOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="mt-10 sm:mt-0 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#1B1A19]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#0078D4]" />
                <h3 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF]">
                  Create New Commercial Deal
                </h3>
              </div>
              <button
                onClick={() => setIsAddDealOpen(false)}
                className="text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424] p-1.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              action={async (formData) => {
                await addDeal(formData);
                setIsAddDealOpen(false);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Deal Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    list="commonDealNames"
                    required
                    placeholder="e.g. Enterprise Cloud Migration"
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  />
                  <datalist id="commonDealNames">
                    <option value="Enterprise Cloud Migration" />
                    <option value="Global Security Infrastructure" />
                    <option value="Annual Retainer Support" />
                    <option value="ERP Core Modernization" />
                    <option value="Strategic Joint Venture" />
                    <option value="AI Pilot Deployment" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Value Amount ($ USD) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    required
                    placeholder="e.g. 250000"
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Initial Stage
                  </label>
                  <select
                    name="stage"
                    defaultValue={targetAddStage}
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  >
                    {DEAL_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue="Medium"
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    name="expectedCloseDate"
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    placeholder="e.g. Contoso Corp"
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Client Industry
                  </label>
                  <input
                    type="text"
                    name="clientIndustry"
                    placeholder="e.g. Fintech, Healthcare"
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Client Region
                  </label>
                  <input
                    type="text"
                    name="clientRegion"
                    placeholder="e.g. North America, EMEA"
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Associated Project
                  </label>
                  <select
                    name="projectId"
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  >
                    <option value="">No Project Association</option>
                    {options.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Associated Pipeline
                  </label>
                  <select
                    name="pipelineId"
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  >
                    <option value="">No Pipeline Association</option>
                    {pipelines.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E1DFDD] dark:border-[#3B3A39]">
                <button
                  type="button"
                  onClick={() => setIsAddDealOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] font-semibold text-[#242424] dark:text-[#FFFFFF] hover:bg-[#F3F2F1]"
                >
                  Cancel
                </button>
                {isGuest ? (
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[4px] font-semibold"
                  >
                    Create Deal
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[4px] font-semibold cursor-pointer"
                  >
                    Create Deal
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT DEAL ===================== */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#1B1A19]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#0078D4]" />
                <h3 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF]">
                  Edit Deal: {editingDeal.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingDeal(null)}
                className="text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424] p-1.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              action={async (formData) => {
                await updateDeal(formData);
                setEditingDeal(null);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <input type="hidden" name="dealId" value={editingDeal._id} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Deal Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingDeal.name}
                    required
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Value Amount ($ USD) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    defaultValue={editingDeal.amount}
                    required
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    name="stage"
                    defaultValue={editingDeal.stage}
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  >
                    {DEAL_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue={editingDeal.metadata?.priority || "Medium"}
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    name="expectedCloseDate"
                    defaultValue={
                      editingDeal.expectedCloseDate
                        ? editingDeal.expectedCloseDate.split("T")[0]
                        : ""
                    }
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    defaultValue={editingDeal.client?.name || ""}
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Client Industry
                  </label>
                  <input
                    type="text"
                    name="clientIndustry"
                    defaultValue={editingDeal.client?.industry || ""}
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Client Region
                  </label>
                  <input
                    type="text"
                    name="clientRegion"
                    defaultValue={editingDeal.client?.region || ""}
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Associated Project
                  </label>
                  <select
                    name="projectId"
                    defaultValue={editingDeal.projectId || ""}
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  >
                    <option value="">No Project Association</option>
                    {options.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Associated Pipeline
                  </label>
                  <select
                    name="pipelineId"
                    defaultValue={editingDeal.pipelineId || ""}
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  >
                    <option value="">No Pipeline Association</option>
                    {pipelines.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E1DFDD] dark:border-[#3B3A39]">
                <button
                  type="button"
                  onClick={() => setEditingDeal(null)}
                  className="px-4 py-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] font-semibold text-[#242424] dark:text-[#FFFFFF] hover:bg-[#F3F2F1]"
                >
                  Cancel
                </button>
                {isGuest ? (
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[4px] font-semibold"
                  >
                    Save Changes
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[4px] font-semibold cursor-pointer"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ALLOCATE RESOURCE ===================== */}
      {isAddResourceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#1B1A19]">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#0078D4]" />
                <h3 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF]">
                  Allocate Resource Envelope
                </h3>
              </div>
              <button
                onClick={() => setIsAddResourceOpen(false)}
                className="text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424] p-1.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              action={async (formData) => {
                await addResourceAllocation(formData);
                setIsAddResourceOpen(false);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                  Resource Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Q3 Integration Cloud Infrastructure"
                  className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Resource Type
                  </label>
                  <select
                    name="type"
                    defaultValue="Budget"
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  >
                    <option value="Budget">Budget</option>
                    <option value="Manpower">Manpower</option>
                    <option value="Tools">Tools</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Risk Assessment Level
                  </label>
                  <select
                    name="riskLevel"
                    defaultValue="Low"
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Total Allocated Amount *
                  </label>
                  <input
                    type="number"
                    name="totalAllocated"
                    required
                    placeholder="e.g. 50000"
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Total Used / Expended *
                  </label>
                  <input
                    type="number"
                    name="totalUsed"
                    required
                    placeholder="e.g. 15000"
                    defaultValue={0}
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Link to Project
                  </label>
                  <select
                    name="assignedToProjectId"
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  >
                    <option value="">No Project Association</option>
                    {options.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Link to Integration Deal
                  </label>
                  <select
                    name="linkedDealId"
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                  >
                    <option value="">No Linked Deal</option>
                    {deals
                      .filter((d) => d.stage === "Integration")
                      .map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} (${(d.amount || 0).toLocaleString()})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E1DFDD] dark:border-[#3B3A39]">
                <button
                  type="button"
                  onClick={() => setIsAddResourceOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] font-semibold text-[#242424] dark:text-[#FFFFFF] hover:bg-[#F3F2F1]"
                >
                  Cancel
                </button>
                {isGuest ? (
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[4px] font-semibold"
                  >
                    Confirm Allocation
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[4px] font-semibold cursor-pointer"
                  >
                    Confirm Allocation
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: REVENUE LIFECYCLE BLUEPRINT ===================== */}
      {showExampleModal && (
        <RevenueExampleModal onClose={() => setShowExampleModal(false)} />
      )}
    </main>
  );
}
