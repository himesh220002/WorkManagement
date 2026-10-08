"use client";

import { useMemo, useState } from "react";
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
  addLead,
  addCampaign,
  updateLeadStatus,
  updateLead,
  deleteLead,
  updateCampaign,
  deleteCampaign,
} from "@/actions";
import PipelineCard from "@/components/PipelineCard";
import { Badge } from "@/components/ui/Badge";
import {
  TrendingUp,
  Megaphone,
  Users,
  DollarSign,
  Plus,
  Edit3,
  Trash2,
  X,
  Layers,
  BarChart3,
  PieChart,
  CheckCircle2,
  FolderKanban,
  Workflow,
  Search,
  Columns3,
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
  Legend
);

const LEAD_STAGES = ["New", "Working", "Qualified", "Unqualified"] as const;

export default function SalesDashboardClient({
  leads = [],
  campaigns = [],
  pipelines = [],
  options = { projects: [], teams: [], tasks: [], users: [] },
  currentRole,
  currentUserId,
  currentUserName,
  isGuest = false,
}: {
  leads: any[];
  campaigns: any[];
  pipelines?: any[];
  options?: { projects: any[]; teams: any[]; tasks: any[]; users: any[] };
  currentRole?: string;
  currentUserId?: string;
  currentUserName?: string;
  isGuest?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"kanban" | "campaigns" | "pipelines" | "analytics">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddCampaignOpen, setIsAddCampaignOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);

  const role = (currentRole || "manager").toLowerCase();
  const canManageSales = ["owner", "manager", "superuser"].includes(role);

  // Who is considered the owner of this lead?
  const isLeadOwner = (lead: any) =>
    Boolean(currentUserName && lead?.owner && lead.owner.toLowerCase() === currentUserName.toLowerCase());
  const isLeadUnassigned = (lead: any) =>
    !lead?.owner || lead.owner === "Unassigned" || lead.owner === "TBD";

  // Can the user edit this lead?
  // Management can edit any lead.
  // Employees can edit leads assigned to their profile or unassigned inbound leads.
  const canEditLead = (lead: any) =>
    canManageSales || isLeadOwner(lead) || isLeadUnassigned(lead);

  const canDeleteLead = canManageSales;
  const canManageCampaigns = canManageSales;

  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Metrics
  const totalLeads = leads?.length || 0;
  const activeCampaigns = campaigns?.length || 0;
  const expectedRevenue = campaigns?.reduce((sum, c) => sum + (c.expectedRevenue || 0), 0) || 0;
  const qualifiedLeads = leads?.filter((l) => l.status === "Qualified").length || 0;
  const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.owner && l.owner.toLowerCase().includes(q))
    );
  }, [leads, searchQuery]);

  // Drag and drop
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    if (dragOverStage !== stage) setDragOverStage(stage);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
      await updateLeadStatus(leadId, newStatus);
    }
  };

  // Campaigns Data
  const sortedCampaigns = useMemo(() => {
    return [...(campaigns || [])]
      .sort((a, b) => (b.leadsGenerated || 0) - (a.leadsGenerated || 0))
      .slice(0, 5);
  }, [campaigns]);

  const campaignsData = {
    labels: sortedCampaigns.length > 0 ? sortedCampaigns.map((c) => c.name) : ["No Data"],
    datasets: [
      {
        label: "Leads Generated",
        data: sortedCampaigns.length > 0 ? sortedCampaigns.map((c) => c.leadsGenerated || 0) : [0],
        backgroundColor: "#0078D4",
        borderRadius: 4,
      },
    ],
  };

  const revenueData = {
    labels: sortedCampaigns.length > 0 ? sortedCampaigns.map((c) => c.name) : ["No Data"],
    datasets: [
      {
        data: sortedCampaigns.length > 0 ? sortedCampaigns.map((c) => c.expectedRevenue || 0) : [0],
        backgroundColor: ["#0078D4", "#00B7C3", "#107C10", "#F7630C", "#5C2D91"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  return (
    <main className="flex flex-col min-w-0 p-0 sm:p-4 flex-1 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <header className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 sm:p-6 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <h1 className="text-xl lg:text-lg lg:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
              Commercial Sales &amp; Growth Pipeline
            </h1>
            <div className="flex gap-2">
              <Badge tone="brand" size="sm">
                Inbound &amp; Outbound
              </Badge>
              <Badge tone="success" size="sm">
                Live Conversion
              </Badge>
            </div>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
            Top-of-funnel lead qualification, marketing campaigns telemetry, and commercial pipeline velocity.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {isGuest ? (
            <button
              disabled
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[6px] text-xs font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[6px] text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>
          )}

          {canManageCampaigns && (
            isGuest ? (
              <button
                disabled
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[6px] text-xs font-semibold shadow-sm"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>New Campaign</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAddCampaignOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] hover:bg-[#F3F2F1] text-[#242424] dark:text-[#FFFFFF] rounded-[6px] text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5 text-[#107C10]" />
                <span>New Campaign</span>
              </button>
            )
          )}
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#605E5C] dark:text-[#C8C6C4]">
              Total Inbound Leads
            </span>
            <span className="p-1.5 rounded-[4px] bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4]">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg lg:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">{totalLeads}</span>
            <span className="text-xs font-medium text-[#107C10]">{qualifiedLeads} Qualified</span>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-2">Active funnel prospects</p>
        </div>

        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#605E5C] dark:text-[#C8C6C4]">
              Active Campaigns
            </span>
            <span className="p-1.5 rounded-[4px] bg-[#DFF6DD] dark:bg-[#0F3818] text-[#107C10]">
              <Megaphone className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#107C10] dark:text-[#54B054]">{activeCampaigns}</span>
            <span className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">Initiatives</span>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-2">Targeting key industry segments</p>
        </div>

        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#605E5C] dark:text-[#C8C6C4]">
              Estimated Pipeline Revenue
            </span>
            <span className="p-1.5 rounded-[4px] bg-[#FFF4CE] dark:bg-[#4A3E09] text-[#8F6B00]">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg lg:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
              ${expectedRevenue.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-2">Sum of campaigns estimated value</p>
        </div>

        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#605E5C] dark:text-[#C8C6C4]">
              Funnel Conversion Rate
            </span>
            <span className="p-1.5 rounded-[4px] bg-[#FDE7D9] dark:bg-[#4A2209] text-[#F7630C]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg lg:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">{conversionRate}%</span>
          </div>
          <div className="w-full bg-[#EDEBE9] dark:bg-[#323130] h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#0078D4] h-full rounded-full transition-all"
              style={{ width: `${Math.min(conversionRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-6 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("kanban")}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === "kanban"
            ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
            : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
        >
          <Columns3 className="w-4 h-4" />
          <span>Leads Kanban Board ({filteredLeads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("campaigns")}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === "campaigns"
            ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
            : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Active Campaigns ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === "analytics"
            ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
            : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Funnel Performance Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab("pipelines")}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === "pipelines"
            ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
            : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
        >
          <Layers className="w-4 h-4" />
          <span>Sales Pipelines ({pipelines.length})</span>
        </button>
      </div>

      {/* ===================== TAB 1: LEADS KANBAN ===================== */}
      {activeTab === "kanban" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-[#8A8886] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads by name or owner..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
              />
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[500px]">
            {LEAD_STAGES.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.status === stage);
              const isOver = dragOverStage === stage;

              return (
                <div
                  key={stage}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={(e) => handleDrop(e, stage)}
                  className={`flex-1 min-w-[260px] max-w-[300px] bg-[#FAF9F8] dark:bg-[#1B1A19] rounded-[8px] border transition-all ${isOver
                    ? "border-[#0078D4] ring-2 ring-[#0078D4]/40 bg-[#EBF3FC]/60"
                    : "border-[#E1DFDD] dark:border-[#3B3A39]"
                    }`}
                >
                  <div className="p-3 border-b border-[#E1DFDD] dark:border-[#3B3A39] flex items-center justify-between bg-white dark:bg-[#201F1E] rounded-t-[8px]">
                    <span className="font-semibold text-xs text-[#242424] dark:text-[#FFFFFF]">
                      {stage}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F3F2F1] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4]">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="p-2.5 space-y-2.5 min-h-[300px]">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead._id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px] p-3 shadow-sm hover:border-[#0078D4] transition-all cursor-grab active:cursor-grabbing group ${draggedLeadId === lead._id ? "opacity-40" : ""
                          }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-xs text-[#242424] dark:text-[#FFFFFF]">
                            {lead.name}
                          </span>
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              type="button"
                              draggable={false}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setEditingLead(lead);
                              }}
                              className="p-1 text-[#605E5C] hover:text-[#0078D4] transition-colors cursor-pointer rounded"
                              title={canEditLead(lead) ? "Edit Lead" : "Inspect Lead Record (Colleague Lead)"}
                            >
                              <Edit3 className="w-3.5 h-3.5 pointer-events-none" />
                            </button>
                            {!isGuest && canDeleteLead && (
                              <form
                                action={deleteLead}
                                onSubmit={(e) => {
                                  if (!window.confirm(`Delete lead "${lead.name}"?`)) e.preventDefault();
                                }}
                              >
                                <input type="hidden" name="leadId" value={lead._id} />
                                <button
                                  type="submit"
                                  className="p-1 text-[#605E5C] hover:text-[#D13438] transition-colors cursor-pointer rounded"
                                  title="Delete Lead"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </form>
                            )}
                          </div>
                        </div>

                        <div className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4] flex items-center gap-1 mb-1.5">
                          <Users className="w-3 h-3 text-[#0078D4]" />
                          <span>Owner: {lead.owner}</span>
                        </div>

                        {lead.campaignId && (
                          <div className="pt-1.5 border-t border-[#F3F2F1] dark:border-[#292827] text-[10px] text-[#0078D4] dark:text-[#479EF5] flex items-center gap-1 truncate">
                            <Megaphone className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {campaigns.find((c) => c._id === lead.campaignId)?.name || "Campaign Linked"}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}

                    {stageLeads.length === 0 && (
                      <div className="border border-dashed border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px] p-4 text-center text-xs text-[#8A8886]">
                        No leads in {stage}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================== TAB 2: ACTIVE CAMPAIGNS ===================== */}
      {activeTab === "campaigns" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((c) => (
            <div
              key={c._id}
              className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-xs text-[#242424] dark:text-[#FFFFFF] truncate">
                    {c.name}
                  </h4>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      draggable={false}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setEditingCampaign(c);
                      }}
                      className="p-1 text-[#605E5C] hover:text-[#0078D4] transition-colors cursor-pointer rounded"
                      title={canManageCampaigns ? "Edit Campaign" : "Inspect Campaign (Management Protected)"}
                    >
                      <Edit3 className="w-3.5 h-3.5 pointer-events-none" />
                    </button>
                    {canManageCampaigns && (
                      <form
                        action={deleteCampaign}
                        onSubmit={(e) => {
                          if (!window.confirm(`Delete campaign "${c.name}"?`)) e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="campaignId" value={c._id} />
                        <button
                          type="submit"
                          className="p-1 text-[#605E5C] hover:text-[#D13438] transition-colors cursor-pointer rounded"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                  <div className="p-2 rounded bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
                    <span className="text-[10px] text-[#605E5C] uppercase block">Leads Generated</span>
                    <span className="font-bold text-sm text-[#0078D4]">{c.leadsGenerated || 0}</span>
                  </div>
                  <div className="p-2 rounded bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
                    <span className="text-[10px] text-[#605E5C] uppercase block">Est. Revenue</span>
                    <span className="font-bold text-sm text-[#107C10]">
                      ${(c.expectedRevenue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F3F2F1] dark:border-[#292827] space-y-1 text-[11px] text-[#605E5C] dark:text-[#C8C6C4]">
                {c.projectId && (
                  <div className="flex items-center gap-1.5 truncate text-[#0078D4]">
                    <FolderKanban className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {options.projects.find((p) => p.id === c.projectId)?.name || "Project Linked"}
                    </span>
                  </div>
                )}
                {c.pipelineId && (
                  <div className="flex items-center gap-1.5 truncate text-[#5C2D91]">
                    <Workflow className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {pipelines.find((p) => p._id === c.pipelineId)?.name || "Pipeline Linked"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {campaigns.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-[#8A8886] bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px]">
              No active marketing campaigns found. Click &quot;New Campaign&quot; to launch one.
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 3: ANALYTICS ===================== */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm">
            <h3 className="font-semibold text-xs text-[#242424] dark:text-[#FFFFFF] mb-3">
              Top Campaigns by Leads Generated
            </h3>

            <div className="block overflow-x-auto">
              <Bar data={campaignsData} options={{ indexAxis: "y", responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm">
            <h3 className="font-semibold text-xs text-[#242424] dark:text-[#FFFFFF] mb-3">
              Expected Revenue by Campaign
            </h3>
            <div className="h-64 flex items-center justify-center">
              <Doughnut data={revenueData} options={{ responsive: true, maintainAspectRatio: false, cutout: "60%" }} />
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 4: SALES PIPELINES ===================== */}
      {activeTab === "pipelines" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines.map((pipeline: any) => (
            <PipelineCard key={pipeline._id} pipeline={pipeline} currentRole={role} />
          ))}
          {pipelines.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-[#8A8886] bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px]">
              No sales pipelines configured yet.
            </div>
          )}
        </div>
      )}

      {/* ===================== MODAL: ADD LEAD ===================== */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] max-w-md w-full shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#E1DFDD] dark:border-[#3B3A39]">
              <h3 className="font-bold text-sm text-[#242424] dark:text-[#FFFFFF]">Add Inbound Lead</h3>
              <button onClick={() => setIsAddLeadOpen(false)}>
                <X className="w-4 h-4 text-[#8A8886]" />
              </button>
            </div>
            <form
              action={async (formData) => {
                await addLead(formData);
                setIsAddLeadOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium mb-1">Lead / Company Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Apex Dynamics Corp"
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Lead Owner *</label>
                <input
                  type="text"
                  name="owner"
                  required
                  placeholder="e.g. Alex Morgan"
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Status</label>
                <select
                  name="status"
                  defaultValue="New"
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none"
                >
                  <option value="New">New</option>
                  <option value="Working">Working</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Unqualified">Unqualified</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(false)}
                  className="px-3 py-1.5 border rounded-[4px]"
                >
                  Cancel
                </button>
                {isGuest ? (
                  <button
                    type="button"
                    disabled
                    className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[4px] font-semibold"
                  >
                    Add Lead
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#0078D4] text-white rounded-[4px] font-semibold cursor-pointer"
                  >
                    Add Lead
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD CAMPAIGN ===================== */}
      {isAddCampaignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] max-w-md w-full shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#E1DFDD] dark:border-[#3B3A39]">
              <h3 className="font-bold text-sm text-[#242424] dark:text-[#FFFFFF]">Launch New Campaign</h3>
              <button onClick={() => setIsAddCampaignOpen(false)}>
                <X className="w-4 h-4 text-[#8A8886]" />
              </button>
            </div>
            <form
              action={async (formData) => {
                await addCampaign(formData);
                setIsAddCampaignOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium mb-1">Campaign Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Q4 Fintech Cloud Summit"
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Target Leads</label>
                  <input
                    type="number"
                    name="leadsGenerated"
                    defaultValue={0}
                    className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Est. Revenue ($)</label>
                  <input
                    type="number"
                    name="expectedRevenue"
                    defaultValue={0}
                    className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddCampaignOpen(false)}
                  className="px-3 py-1.5 border rounded-[4px]"
                >
                  Cancel
                </button>
                {isGuest ? (
                  <button
                    type="button"
                    disabled
                    className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[4px] font-semibold"
                  >
                    Launch Campaign
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#107C10] text-white rounded-[4px] font-semibold cursor-pointer"
                  >
                    Launch Campaign
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT LEAD ===================== */}
      {editingLead && (() => {
        const isOwnerOrUnassigned = isLeadOwner(editingLead) || isLeadUnassigned(editingLead);
        const hasFullAccess = canManageSales;
        const isEmployeeEditor = !canManageSales && isOwnerOrUnassigned;
        const isReadOnlyColleague = !canManageSales && !isOwnerOrUnassigned;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] max-w-md w-full shadow-2xl p-6">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#E1DFDD] dark:border-[#3B3A39]">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#0078D4]" />
                  <h3 className="font-bold text-sm text-[#242424] dark:text-[#FFFFFF]">
                    {isReadOnlyColleague ? "Protected Lead Record" : "Edit Lead"}: {editingLead.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="text-[#8A8886] hover:text-[#242424] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Role Indicator */}
              {isReadOnlyColleague && !isGuest && (
                <div className="p-2.5 mb-3 bg-neutral-100 dark:bg-[#2A2928] border border-neutral-200 dark:border-neutral-700 rounded-[6px] text-xs text-neutral-700 dark:text-neutral-300">
                  <p className="text-[11px] leading-relaxed">
                    This lead is owned by <strong>{editingLead.owner}</strong>. Viewing in standard read-only format.
                  </p>
                </div>
              )}

              {isEmployeeEditor && (
                <div className="p-2.5 mb-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-[6px] text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Employee Execution Clearance:</strong> You can advance funnel status and acquisition details. Reassigning ownership to other personnel is restricted to Operations Managers.
                  </span>
                </div>
              )}

              {hasFullAccess && (
                <div className="p-2 mb-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-[6px] text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Operations Management:</strong> Full edit and ownership reassignment clearance active.</span>
                </div>
              )}

              <form
                action={async (formData) => {
                  if (isReadOnlyColleague) return;
                  await updateLead(formData);
                  setEditingLead(null);
                }}
                className="space-y-3 text-xs"
              >
                <input type="hidden" name="leadId" value={editingLead._id} />

                <div>
                  <label className="block font-medium mb-1 text-[#242424] dark:text-white">
                    Lead / Company Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingLead.name}
                    required
                    disabled={isReadOnlyColleague}
                    className={`w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none text-[#242424] dark:text-white focus:border-[#0078D4] ${
                      isReadOnlyColleague ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-medium text-[#242424] dark:text-white">
                      Lead Owner *
                    </label>
                    {isEmployeeEditor && (
                      <span className="text-[10px] text-[#605E5C] dark:text-[#A19F9D]">
                        <span>Manager Governed</span>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    name="owner"
                    defaultValue={editingLead.owner || currentUserName || "Unassigned"}
                    required
                    readOnly={!hasFullAccess}
                    disabled={isReadOnlyColleague}
                    className={`w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none text-[#242424] dark:text-white focus:border-[#0078D4] ${
                      !hasFullAccess ? "opacity-75 bg-[#F3F2F1] cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1 text-[#242424] dark:text-white">
                      Funnel Stage
                    </label>
                    <select
                      name="status"
                      defaultValue={editingLead.status || "New"}
                      disabled={isReadOnlyColleague}
                      className={`w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none text-[#242424] dark:text-white cursor-pointer ${
                        isReadOnlyColleague ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      {LEAD_STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-[#242424] dark:text-white">
                      Acquisition Source
                    </label>
                    <input
                      type="text"
                      name="source"
                      defaultValue={editingLead.source || "Manual Entry"}
                      disabled={isReadOnlyColleague}
                      className={`w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none text-[#242424] dark:text-white ${
                        isReadOnlyColleague ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-[#242424] dark:text-white">
                    Linked Marketing Campaign
                  </label>
                  <select
                    name="campaignId"
                    defaultValue={editingLead.campaignId || ""}
                    disabled={isReadOnlyColleague}
                    className={`w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none text-[#242424] dark:text-white cursor-pointer ${
                      isReadOnlyColleague ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="">None / Direct Inbound</option>
                    {campaigns.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingLead(null)}
                    className="px-3.5 py-1.5 border border-[#E1DFDD] dark:border-[#3B3A39] text-[#605E5C] dark:text-[#C8C6C4] rounded-[4px] font-medium cursor-pointer"
                  >
                    {isReadOnlyColleague ? "Close" : "Cancel"}
                  </button>
                  {!isReadOnlyColleague && (
                    isGuest ? (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[4px] font-semibold"
                      >
                        Save Changes
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[4px] font-semibold transition-colors cursor-pointer"
                      >
                        Save Changes
                      </button>
                    )
                  )}
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ===================== MODAL: EDIT CAMPAIGN ===================== */}
      {editingCampaign && (() => {
        const isManager = canManageCampaigns;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] max-w-md w-full shadow-2xl p-6">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#E1DFDD] dark:border-[#3B3A39]">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#107C10]" />
                  <h3 className="font-bold text-sm text-[#242424] dark:text-[#FFFFFF]">
                    {isManager ? "Edit Campaign" : "Campaign Overview"}: {editingCampaign.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="text-[#8A8886] hover:text-[#242424] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>



              <form
                action={async (formData) => {
                  if (!isManager) return;
                  await updateCampaign(formData);
                  setEditingCampaign(null);
                }}
                className="space-y-3 text-xs"
              >
                <input type="hidden" name="campaignId" value={editingCampaign._id} />

                <div>
                  <label className="block font-medium mb-1 text-[#242424] dark:text-white">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingCampaign.name}
                    required
                    disabled={!isManager}
                    className={`w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none text-[#242424] dark:text-white focus:border-[#0078D4] ${
                      !isManager ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1 text-[#242424] dark:text-white">
                      Target Leads
                    </label>
                    <input
                      type="number"
                      name="leadsGenerated"
                      defaultValue={editingCampaign.leadsGenerated || 0}
                      disabled={!isManager}
                      className={`w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none text-[#242424] dark:text-white ${
                        !isManager ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-[#242424] dark:text-white">
                      Est. Revenue ($)
                    </label>
                    <input
                      type="number"
                      name="expectedRevenue"
                      defaultValue={editingCampaign.expectedRevenue || 0}
                      disabled={!isManager}
                      className={`w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none text-[#242424] dark:text-white ${
                        !isManager ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingCampaign(null)}
                    className="px-3.5 py-1.5 border border-[#E1DFDD] dark:border-[#3B3A39] text-[#605E5C] dark:text-[#C8C6C4] rounded-[4px] font-medium cursor-pointer"
                  >
                    {isManager ? "Cancel" : "Close"}
                  </button>
                  {isManager && (
                    isGuest ? (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[4px] font-semibold"
                      >
                        Update Campaign
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#107C10] hover:bg-[#0E6A0E] text-white rounded-[4px] font-semibold transition-colors cursor-pointer"
                      >
                        Update Campaign
                      </button>
                    )
                  )}
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
