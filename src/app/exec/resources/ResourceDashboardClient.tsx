"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Cpu,
  DollarSign,
  Users,
  Server,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Building2,
  Sparkles,
  Pencil,
  Trash2,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  PieChart,
  Layers,
  X,
  ExternalLink,
} from "lucide-react";
import {
  addResourceAllocation,
  updateResourceAllocation,
  deleteResourceAllocation,
} from "@/actions";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ResourceItem {
  _id: string;
  name: string;
  type: string;
  totalAllocated: number;
  totalUsed: number;
  riskLevel: string;
  assignedToProjectId: string | null;
  assignedToProjectName: string;
  linkedDealId: string | null;
  linkedDealName: string | null;
  teamId: string | null;
  teamName: string | null;
  createdAt: string | null;
}

interface ProjectItem {
  _id: string;
  name: string;
}

interface TeamItem {
  _id: string;
  name: string;
  membersCount: number;
}

interface UserItem {
  _id: string;
  name: string;
  role: string;
  position: string;
  capacityHoursPerWeek: number;
  status: string;
  skills: string[];
}

interface DealItem {
  _id: string;
  name: string;
  amount: number;
  stage: string;
}

interface ResourceDashboardClientProps {
  resources: ResourceItem[];
  projects: ProjectItem[];
  teams: TeamItem[];
  users: UserItem[];
  deals: DealItem[];
  companyCode: string;
  userRole: string;
}

export default function ResourceDashboardClient({
  resources,
  projects,
  teams,
  users,
  deals,
  companyCode,
  userRole,
}: ResourceDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"matrix" | "analytics" | "headcount">("matrix");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedRisk, setSelectedRisk] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("Budget");
  const [formAllocated, setFormAllocated] = useState<number | string>("");
  const [formUsed, setFormUsed] = useState<number | string>("");
  const [formRisk, setFormRisk] = useState("Low");
  const [formProject, setFormProject] = useState("");
  const [formDeal, setFormDeal] = useState("");

  const isManagerOrOwner = ["owner", "manager", "superuser", "admin"].includes(
    (userRole || "").toLowerCase()
  );

  const openCreateModal = () => {
    setEditingResource(null);
    setFormName("");
    setFormType("Budget");
    setFormAllocated("");
    setFormUsed("");
    setFormRisk("Low");
    setFormProject(selectedProjectId !== "all" ? selectedProjectId : "");
    setFormDeal("");
    setIsModalOpen(true);
  };

  const openEditModal = (r: ResourceItem) => {
    setEditingResource(r);
    setFormName(r.name);
    setFormType(r.type);
    setFormAllocated(r.totalAllocated);
    setFormUsed(r.totalUsed);
    setFormRisk(r.riskLevel);
    setFormProject(r.assignedToProjectId || "");
    setFormDeal(r.linkedDealId || "");
    setIsModalOpen(true);
  };

  const applyPreset = (
    name: string,
    type: string,
    allocated: number,
    used: number,
    risk: string
  ) => {
    setFormName(name);
    setFormType(type);
    setFormAllocated(allocated);
    setFormUsed(used);
    setFormRisk(risk);
  };

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (selectedProjectId !== "all" && r.assignedToProjectId !== selectedProjectId) {
        return false;
      }
      if (selectedType !== "all" && r.type.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }
      if (selectedRisk !== "all" && r.riskLevel.toLowerCase() !== selectedRisk.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesProj = r.assignedToProjectName.toLowerCase().includes(q);
        const matchesType = r.type.toLowerCase().includes(q);
        if (!matchesName && !matchesProj && !matchesType) return false;
      }
      return true;
    });
  }, [resources, selectedProjectId, selectedType, selectedRisk, searchQuery]);

  // Aggregate KPI metrics
  const budgetResources = resources.filter((r) => r.type === "Budget");
  const totalBudgetAllocated = budgetResources.reduce((sum, r) => sum + r.totalAllocated, 0);
  const totalBudgetUsed = budgetResources.reduce((sum, r) => sum + r.totalUsed, 0);
  const budgetBurnRate =
    totalBudgetAllocated > 0
      ? Math.round((totalBudgetUsed / totalBudgetAllocated) * 100)
      : 0;

  const headcountResources = resources.filter((r) => r.type === "Headcount");
  const totalHeadcountAllocated = headcountResources.reduce((sum, r) => sum + r.totalAllocated, 0);
  const totalHeadcountUsed = headcountResources.reduce((sum, r) => sum + r.totalUsed, 0);

  const infraResources = resources.filter((r) =>
    ["infrastructure", "equipment"].includes(r.type.toLowerCase())
  );
  const highRiskCount = resources.filter((r) => r.riskLevel === "High").length;

  const totalWeeklyCapacityHours = users.reduce(
    (sum, u) => sum + (u.capacityHoursPerWeek || 40),
    0
  );

  // Charts
  const chartBudgetResources = filteredResources.filter((r) => r.type === "Budget");
  const budgetChartData = useMemo(() => {
    const items = chartBudgetResources.slice(0, 8);
    return {
      labels: items.map((r) => (r.name.length > 15 ? r.name.slice(0, 15) + "..." : r.name)),
      datasets: [
        {
          label: "Allocated ($)",
          data: items.map((r) => r.totalAllocated),
          backgroundColor: "#0078D4",
          borderRadius: 4,
        },
        {
          label: "Used ($)",
          data: items.map((r) => r.totalUsed),
          backgroundColor: "#F7630C",
          borderRadius: 4,
        },
      ],
    };
  }, [chartBudgetResources]);

  const typeBreakdownData = useMemo(() => {
    const counts = {
      Budget: resources.filter((r) => r.type === "Budget").length,
      Headcount: resources.filter((r) => r.type === "Headcount").length,
      Infrastructure: resources.filter((r) => r.type === "Infrastructure").length,
      Equipment: resources.filter((r) => r.type === "Equipment").length,
    };
    return {
      labels: ["Budget Envelopes", "Headcount", "Cloud Infrastructure", "Equipment & Tooling"],
      datasets: [
        {
          data: [counts.Budget, counts.Headcount, counts.Infrastructure, counts.Equipment],
          backgroundColor: ["#0078D4", "#107C10", "#8764B8", "#008272"],
        },
      ],
    };
  }, [resources]);

  return (
    <main className="flex flex-col min-w-0 p-3 sm:p-6 flex-1 max-w-[1400px] mx-auto w-full">
      {/* ================= HEADER ================= */}
      <header className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 sm:p-6 mb-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[6px] bg-[#0078D4] text-white flex items-center justify-center shadow-sm shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
                  Resource Allocation &amp; Capacity Governance
                </h1>
                {companyCode && (
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-[#0078D4] dark:text-[#479EF5]">
                    [{companyCode.toUpperCase()}]
                  </span>
                )}
              </div>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-0.5">
                Capital budget envelopes, squad headcount, infrastructure provisioning, and burn telemetry across active projects.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Link
            href="/exec/dashboard"
            className="px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] text-[#242424] dark:text-white hover:bg-[#FAF9F8] transition-colors"
          >
            &larr; Executive Overview
          </Link>
          {isManagerOrOwner && (
            <button
              type="button"
              onClick={openCreateModal}
              className="px-3.5 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[4px] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Allocate Resource</span>
            </button>
          )}
        </div>
      </header>

      {/* ================= TOP KPI SUMMARY CARDS ================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Budget */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Capital Budget Envelopes
              </span>
              <DollarSign className="w-4 h-4 text-[#0078D4]" />
            </div>
            <div className="text-lg lg:text-xl font-bold text-[#242424] dark:text-white">
              ${totalBudgetAllocated.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
              <span>Used: ${totalBudgetUsed.toLocaleString()}</span>
              <span className="font-semibold">{budgetBurnRate}% burn</span>
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar
              value={budgetBurnRate}
              size="sm"
              tone={budgetBurnRate >= 90 ? "danger" : budgetBurnRate >= 70 ? "warning" : "brand"}
            />
          </div>
        </div>

        {/* Card 2: Headcount Capacity */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Headcount &amp; Weekly Capacity
              </span>
              <Users className="w-4 h-4 text-[#107C10]" />
            </div>
            <div className="text-lg lg:text-xl font-bold text-[#242424] dark:text-white">
              {users.length} Active Members
            </div>
            <div className="flex items-center justify-between text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
              <span>Total Hours: {totalWeeklyCapacityHours}h / week</span>
              <span className="font-semibold text-[#107C10]">{teams.length} Squads</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#605E5C] dark:text-[#C8C6C4]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#107C10]" />
            <span>Allocated: {totalHeadcountAllocated} | Active: {totalHeadcountUsed}</span>
          </div>
        </div>

        {/* Card 3: Infrastructure & Assets */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Infrastructure &amp; Assets
              </span>
              <Server className="w-4 h-4 text-[#8764B8]" />
            </div>
            <div className="text-lg lg:text-xl font-bold text-[#242424] dark:text-white">
              {infraResources.length} Envelopes
            </div>
            <div className="flex items-center justify-between text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
              <span>Cloud &amp; Tooling</span>
              <span className="font-semibold">{projects.length} Projects Connected</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#605E5C] dark:text-[#C8C6C4]">
            <Layers className="w-3.5 h-3.5 text-[#8764B8]" />
            <span>Zero-downtime provisioning ready</span>
          </div>
        </div>

        {/* Card 4: Risk Exposure */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Risk Exposure
              </span>
              <AlertTriangle className="w-4 h-4 text-[#D13438]" />
            </div>
            <div className="text-lg lg:text-xl font-bold text-[#242424] dark:text-white flex items-center gap-2">
              <span>{highRiskCount}</span>
              <span className="text-xs font-normal text-[#605E5C] dark:text-[#C8C6C4]">
                High Risk Items
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
              <span>{resources.filter((r) => r.riskLevel === "Medium").length} Medium Risk</span>
              <span className="text-[#107C10] font-semibold">
                {resources.filter((r) => r.riskLevel === "Low").length} Low Risk
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#D13438]">
            <span className="w-2 h-2 rounded-full bg-[#D13438] animate-pulse" />
            <span>Continuous audit &amp; guardrails active</span>
          </div>
        </div>
      </section>

      {/* ================= NAVIGATION TABS & FILTERS ================= */}
      <section className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 mb-6 shadow-sm">
        <div className="flex flex-col items-stretch  justify-between gap-4">
          {/* Tabs */}
          <div className="flex border-b border-[#E1DFDD] dark:border-[#3B3A39] lg:border-b-0 space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab("matrix")}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === "matrix"
                ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
                : "border-transparent text-[#605E5C] dark:text-[#C8C6C4]"
                }`}
            >
              <Layers className="w-4 h-4" />
              <span>Allocation Matrix ({filteredResources.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === "analytics"
                ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
                : "border-transparent text-[#605E5C] dark:text-[#C8C6C4]"
                }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Utilization &amp; Burn Analytics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("headcount")}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === "headcount"
                ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
                : "border-transparent text-[#605E5C] dark:text-[#C8C6C4]"
                }`}
            >
              <Users className="w-4 h-4" />
              <span>Squad &amp; Member Capacity ({users.length})</span>
            </button>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Search */}
            <div className="relative min-w-[160px] flex-1">
              <Search className="w-3.5 h-3.5 text-[#8A8886] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search allocations..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#1B1A19] text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
              />
            </div>

            {/* Project Filter */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-2.5 py-1.5 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] text-[#242424] dark:text-white outline-none focus:border-[#0078D4] font-medium cursor-pointer"
            >
              <option value="all">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] text-[#242424] dark:text-white outline-none focus:border-[#0078D4] font-medium cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Budget">Budget</option>
              <option value="Headcount">Headcount</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Equipment">Equipment</option>
            </select>

            {/* Risk Filter */}
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="px-2.5 py-1.5 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] text-[#242424] dark:text-white outline-none focus:border-[#0078D4] font-medium cursor-pointer"
            >
              <option value="all">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>
        </div>
      </section>

      {/* ================= TAB 1: ALLOCATION ENVELOPES MATRIX ================= */}
      {activeTab === "matrix" && (
        <section className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#242424] dark:text-white">
                Resource Allocation Envelopes
              </h2>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                Detailed ledger of all capital, headcount, and infrastructure commitments.
              </p>
            </div>
            {isManagerOrOwner && (
              <button
                type="button"
                onClick={openCreateModal}
                className="text-xs text-[#0078D4] dark:text-[#479EF5] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Allocation</span>
              </button>
            )}
          </div>

          {filteredResources.length === 0 ? (
            <EmptyState
              title="No resource allocations found"
              description="No allocations match your selected project, type, or risk filters."
              actionText={isManagerOrOwner ? "Create Resource Allocation" : undefined}
              onAction={isManagerOrOwner ? openCreateModal : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E1DFDD] dark:border-[#3B3A39] text-[#605E5C] dark:text-[#C8C6C4]">
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px]">
                      Envelope Name
                    </th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px]">
                      Type
                    </th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px]">
                      Project / Deal Link
                    </th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px] text-right">
                      Allocated
                    </th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px] text-right">
                      Used
                    </th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px] min-w-[140px]">
                      Burn / Utilization
                    </th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px]">
                      Risk
                    </th>
                    {isManagerOrOwner && (
                      <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px] text-right">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F2F1] dark:divide-[#292827]">
                  {filteredResources.map((r) => {
                    const isCurrency = r.type === "Budget";
                    const burnRate =
                      r.totalAllocated > 0
                        ? Math.round((r.totalUsed / r.totalAllocated) * 100)
                        : 0;

                    return (
                      <tr
                        key={r._id}
                        className="hover:bg-[#FAF9F8] dark:hover:bg-[#292827] transition-colors"
                      >
                        <td className="py-3 px-3 font-semibold text-[#242424] dark:text-white">
                          <div className="flex items-center gap-2">
                            <span>{r.name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.type === "Budget"
                              ? "bg-blue-100 text-[#0078D4] dark:bg-blue-900/40 dark:text-[#479EF5]"
                              : r.type === "Headcount"
                                ? "bg-emerald-100 text-[#107C10] dark:bg-emerald-900/40 dark:text-[#54B054]"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                              }`}
                          >
                            {r.type}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-[#605E5C] dark:text-[#C8C6C4]">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#242424] dark:text-white">
                              {r.assignedToProjectName}
                            </span>
                            {r.linkedDealName && (
                              <span className="text-[10px] text-[#0078D4] dark:text-[#479EF5]">
                                Linked Deal: {r.linkedDealName}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-medium text-[#242424] dark:text-white">
                          {isCurrency
                            ? `$${r.totalAllocated.toLocaleString()}`
                            : r.totalAllocated.toLocaleString()}
                        </td>

                        <td className="py-3 px-3 text-right font-semibold text-[#605E5C] dark:text-[#C8C6C4]">
                          {isCurrency
                            ? `$${r.totalUsed.toLocaleString()}`
                            : r.totalUsed.toLocaleString()}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <ProgressBar
                                value={burnRate}
                                size="sm"
                                tone={
                                  burnRate >= 90
                                    ? "danger"
                                    : burnRate >= 70
                                      ? "warning"
                                      : "brand"
                                }
                              />
                            </div>
                            <span className="text-[11px] font-bold text-[#242424] dark:text-white min-w-[32px] text-right">
                              {burnRate}%
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.riskLevel === "High"
                              ? "bg-rose-100 text-[#D13438] dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                              : r.riskLevel === "Medium"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                              }`}
                          >
                            {r.riskLevel}
                          </span>
                        </td>

                        {isManagerOrOwner && (
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(r)}
                                className="p-1 rounded text-[#605E5C] hover:text-[#0078D4] hover:bg-[#FAF9F8] dark:hover:bg-[#292827] transition-colors cursor-pointer"
                                title="Edit Allocation"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <form
                                action={deleteResourceAllocation}
                                onSubmit={(e) => {
                                  if (
                                    !window.confirm(
                                      `Are you sure you want to delete allocation "${r.name}"?`
                                    )
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                <input type="hidden" name="id" value={r._id} />
                                <button
                                  type="submit"
                                  className="p-1 rounded text-[#605E5C] hover:text-[#D13438] hover:bg-[#FAF9F8] dark:hover:bg-[#292827] transition-colors cursor-pointer"
                                  title="Delete Allocation"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </form>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ================= TAB 2: UTILIZATION & BURN ANALYTICS ================= */}
      {activeTab === "analytics" && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Budget Utilization */}
            <div className="lg:col-span-2 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-4">
                <div>
                  <h3 className="font-bold text-sm text-[#242424] dark:text-white">
                    Budget Utilization by Envelope ($)
                  </h3>
                  <span className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                    Allocated vs Used capital comparison
                  </span>
                </div>
                <span className="text-xs font-bold text-[#0078D4]">
                  Total: ${totalBudgetAllocated.toLocaleString()}
                </span>
              </div>
              <div className="h-64 flex items-center justify-center">
                {chartBudgetResources.length === 0 ? (
                  <p className="text-xs text-[#605E5C]">No budget envelopes available.</p>
                ) : (
                  <Bar
                    data={budgetChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { precision: 0 },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            {/* Chart 2: Type Distribution */}
            <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-4">
                <div>
                  <h3 className="font-bold text-sm text-[#242424] dark:text-white">
                    Resource Envelopes by Type
                  </h3>
                  <span className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                    Category allocation balance
                  </span>
                </div>
                <span className="text-xs font-bold text-[#605E5C]">
                  {resources.length} Total
                </span>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={typeBreakdownData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "65%",
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { boxWidth: 12, font: { size: 10 } },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Budget Health Matrix */}
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm">
            <h3 className="font-bold text-sm text-[#242424] dark:text-white mb-2">
              Financial Burn Telemetry &amp; Headroom
            </h3>
            <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-4">
              Real-time capital headroom remaining across allocated departmental envelopes.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-[6px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
                <span className="text-[#605E5C] dark:text-[#C8C6C4] block mb-1">
                  Total Capital Allocated
                </span>
                <span className="text-lg font-bold text-[#0078D4]">
                  ${totalBudgetAllocated.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-[6px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
                <span className="text-[#605E5C] dark:text-[#C8C6C4] block mb-1">
                  Total Capital Consumed
                </span>
                <span className="text-lg font-bold text-[#F7630C]">
                  ${totalBudgetUsed.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-[6px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
                <span className="text-[#605E5C] dark:text-[#C8C6C4] block mb-1">
                  Remaining Capital Headroom
                </span>
                <span className="text-lg font-bold text-[#107C10]">
                  ${Math.max(0, totalBudgetAllocated - totalBudgetUsed).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= TAB 3: SQUAD & MEMBER CAPACITY ================= */}
      {activeTab === "headcount" && (
        <section className="space-y-6">
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-4">
              <div>
                <h3 className="font-bold text-sm text-[#242424] dark:text-white">
                  Active Organization Squads ({teams.length})
                </h3>
                <span className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                  Cross-functional teams provisioned under this organization boundary
                </span>
              </div>
              <Link
                href="/teams"
                className="text-xs font-semibold text-[#0078D4] dark:text-[#479EF5] hover:underline"
              >
                Manage Teams Directory &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {teams.length === 0 ? (
                <p className="text-xs text-[#605E5C] col-span-full">No squads created yet.</p>
              ) : (
                teams.map((team) => (
                  <div
                    key={team._id}
                    className="p-3.5 rounded-[6px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#1B1A19]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#242424] dark:text-white">
                        {team.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-[#0078D4] dark:text-[#479EF5]">
                        {team.membersCount} Members
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-4">
              <div>
                <h3 className="font-bold text-sm text-[#242424] dark:text-white">
                  Company Member Roster &amp; Capacity Ledger
                </h3>
                <span className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                  Strictly scoped to active company team members
                </span>
              </div>
              <span className="text-xs font-bold text-[#107C10]">
                {totalWeeklyCapacityHours} Total Hours / Week
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E1DFDD] dark:border-[#3B3A39] text-[#605E5C] dark:text-[#C8C6C4]">
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px]">
                      Member Name
                    </th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px]">
                      Role
                    </th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px]">
                      Position
                    </th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px] text-right">
                      Weekly Capacity
                    </th>
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F2F1] dark:divide-[#292827]">
                  {users.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-[#FAF9F8] dark:hover:bg-[#292827] transition-colors"
                    >
                      <td className="py-3 px-3 font-semibold text-[#242424] dark:text-white">
                        {u.name}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-[#0078D4] dark:bg-blue-900/40 dark:text-[#479EF5]">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#605E5C] dark:text-[#C8C6C4]">
                        {u.position || "Staff"}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#242424] dark:text-white">
                        {u.capacityHoursPerWeek || 40}h / week
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-[#107C10] dark:bg-emerald-900/40 dark:text-[#54B054]">
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ================= MODAL: CREATE / EDIT RESOURCE ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 max-w-lg w-full shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F3F2F1] dark:border-[#292827]">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#0078D4]" />
                <h3 className="font-bold text-sm text-[#242424] dark:text-white">
                  {editingResource ? "Edit Resource Allocation" : "Allocate New Resource"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-[#8A8886] hover:text-[#242424] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Click Presets for fast entry */}
            {!editingResource && (
              <div className="mb-4 p-3 rounded bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#605E5C] dark:text-[#C8C6C4] block mb-2">
                  ⚡ Quick Presets (Click to Auto-fill):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      applyPreset("Cloud Infrastructure Scaling", "Infrastructure", 25000, 8500, "Low")
                    }
                    className="px-2 py-1 rounded bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] hover:border-[#0078D4] text-[11px] font-medium text-[#242424] dark:text-white cursor-pointer"
                  >
                    ☁️ Cloud Scaling
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyPreset("Ergonomic Chair Tooling & Mold", "Equipment", 45000, 15000, "Medium")
                    }
                    className="px-2 py-1 rounded bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] hover:border-[#0078D4] text-[11px] font-medium text-[#242424] dark:text-white cursor-pointer"
                  >
                    🪑 Tooling Mold
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyPreset("Core Dev Sprint Headcount", "Headcount", 160, 40, "Low")
                    }
                    className="px-2 py-1 rounded bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] hover:border-[#0078D4] text-[11px] font-medium text-[#242424] dark:text-white cursor-pointer"
                  >
                    👥 Dev Squad
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyPreset("Q4 Ads & Campaign Envelope", "Budget", 30000, 12000, "Low")
                    }
                    className="px-2 py-1 rounded bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] hover:border-[#0078D4] text-[11px] font-medium text-[#242424] dark:text-white cursor-pointer"
                  >
                    📢 Ads Campaign
                  </button>
                </div>
              </div>
            )}

            <form
              action={async (formData) => {
                if (editingResource) {
                  await updateResourceAllocation(formData);
                } else {
                  await addResourceAllocation(formData);
                }
                setIsModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              {editingResource && (
                <input type="hidden" name="id" value={editingResource._id} />
              )}

              <div>
                <label className="block font-medium text-[#242424] dark:text-white mb-1">
                  Resource / Envelope Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Q4 Cloud Hosting & GPU Compute"
                  required
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#242424] dark:text-white mb-1">
                    Resource Type *
                  </label>
                  <select
                    name="type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4] cursor-pointer"
                  >
                    <option value="Budget">Budget ($)</option>
                    <option value="Headcount">Headcount (Hours)</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Equipment">Equipment / Hardware</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#242424] dark:text-white mb-1">
                    Risk Assessment *
                  </label>
                  <select
                    name="riskLevel"
                    value={formRisk}
                    onChange={(e) => setFormRisk(e.target.value)}
                    className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4] cursor-pointer"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#242424] dark:text-white mb-1">
                    Allocated Amount / Hours *
                  </label>
                  <input
                    type="number"
                    name="totalAllocated"
                    value={formAllocated}
                    onChange={(e) => setFormAllocated(e.target.value)}
                    placeholder="e.g. 50000"
                    required
                    min={0}
                    className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#242424] dark:text-white mb-1">
                    Used Amount / Hours
                  </label>
                  <input
                    type="number"
                    name="totalUsed"
                    value={formUsed}
                    onChange={(e) => setFormUsed(e.target.value)}
                    placeholder="e.g. 15000"
                    min={0}
                    className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#242424] dark:text-white mb-1">
                    Assign to Project
                  </label>
                  <select
                    name="assignedToProjectId"
                    value={formProject}
                    onChange={(e) => setFormProject(e.target.value)}
                    className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4] cursor-pointer"
                  >
                    <option value="">Unassigned (Company Global)</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#242424] dark:text-white mb-1">
                    Link to Deal
                  </label>
                  <select
                    name="linkedDealId"
                    value={formDeal}
                    onChange={(e) => setFormDeal(e.target.value)}
                    className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4] cursor-pointer"
                  >
                    <option value="">None (General)</option>
                    {deals.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} (${d.amount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F3F2F1] dark:border-[#292827]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-[#E1DFDD] dark:border-[#3B3A39] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#FAF9F8] transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded font-semibold transition-colors shadow-sm"
                >
                  {editingResource ? "Save Changes" : "Create Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
