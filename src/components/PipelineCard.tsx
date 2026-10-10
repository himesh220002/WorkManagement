"use client";

import { useState, useEffect } from "react";
import {
  addPipelineTodo,
  togglePipelineTodo,
  deletePipelineTodo,
  reorderPipelineTodos,
  deletePipeline,
  updatePipelineDates,
  getAssigneeOptions,
} from "@/actions";
import { PREDEFINED_PIPELINE_TASKS } from "@/utils/taskConstants";
import { computePipelineProgress, taskCompletion } from "@/utils/pipelineProgress";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  Maximize2,
  X,
  CheckSquare,
  Clock,
  User,
  FolderKanban,
  Users,
  Target,
  DollarSign,
  TrendingUp,
  Link as LinkIcon,
  Trash2,
  Plus,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { triggerGuestRestriction } from "@/components/showcase/ShowcaseGuestCard";

export default function PipelineCard({
  pipeline,
  currentRole,
  linkedTasks = [],
}: {
  pipeline: any;
  currentRole?: string;
  /** Granular TaskNodes linked via pipelineId — blended into progress with the checklist. */
  linkedTasks?: Array<{ status?: string; progress?: number; name?: string; subtasks?: Array<{ progress?: number; status?: string; title?: string }> }>;
}) {
  const role = (currentRole || "manager").toLowerCase();
  const canManagePipeline = ["owner", "manager", "superuser"].includes(role);
  const [todos, setTodos] = useState(pipeline.todos || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [selectedAssigneeType, setSelectedAssigneeType] = useState("Individual");

  // Editable timeline dates (initialized whenever the popup opens)
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [isSavingDates, setIsSavingDates] = useState(false);
  const [datesFeedback, setDatesFeedback] = useState<string | null>(null);

  // Daily-delta triple: day-before -> yesterday -> today (lazy-loaded on open)
  const [history, setHistory] = useState<{ points: { date: string; value: number }[]; deltas: number[] } | null>(null);
  useEffect(() => {
    if (!isModalOpen) return;
    setHistory(null);
    const pid = pipeline?._id ? String(pipeline._id) : "";
    if (!pid) return;
    fetch(`/api/progress-history?scope=pipeline&id=${encodeURIComponent(pid)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) setHistory({ points: d.points || [], deltas: d.deltas || [] });
      })
      .catch(() => {});
  }, [isModalOpen, pipeline?._id]);

  const toDateInput = (v: any) => {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  useEffect(() => {
    if (isModalOpen) {
      setEditStart(toDateInput(pipeline.startDate));
      setEditEnd(toDateInput(pipeline.endDate));
      setDatesFeedback(null);
    }
  }, [isModalOpen, pipeline.startDate, pipeline.endDate]);

  const handleSaveDates = async () => {
    if (role === "viewer" || isSavingDates) return;
    if (!editStart || !editEnd) {
      setDatesFeedback("Pick both a start and an end date.");
      return;
    }
    if (new Date(editEnd).getTime() < new Date(editStart).getTime()) {
      setDatesFeedback("End date must be on or after the start date.");
      return;
    }
    setIsSavingDates(true);
    setDatesFeedback(null);
    try {
      await updatePipelineDates(pipeline._id, editStart, editEnd);
      setDatesFeedback("Timeline saved — Gantt bars update instantly.");
    } catch (err: any) {
      setDatesFeedback(err?.message || "Could not save timeline dates.");
    } finally {
      setIsSavingDates(false);
    }
  };

  useEffect(() => {
    setTodos(pipeline.todos || []);
  }, [pipeline.todos]);

  useEffect(() => {
    getAssigneeOptions()
      .then((res) => {
        setUsers(res.users || []);
        setTeams(res.teams || []);
      })
      .catch(console.error);
  }, []);

  // Keyboard shortcut to close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newTodos = [...todos];
    const draggedItem = newTodos[draggedIndex];
    newTodos.splice(draggedIndex, 1);
    newTodos.splice(index, 0, draggedItem);
    setTodos(newTodos);
    setDraggedIndex(index);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedIndex(null);
    if (role === "viewer") {
      return;
    }
    await reorderPipelineTodos(pipeline._id, todos);
  };

  const completedTodos = todos.filter((t: any) => t.completed).length;
  const totalTodos = todos.length;
  // One formula everywhere: major checklist workstreams blended with granular
  // linked deliverables (Done/Completed). Falls back to todos-only when no
  // linked tasks are provided, and stored progress when both are empty.
  const dynamicProgress = computePipelineProgress(
    { progress: Number(pipeline.progress || 0), todos },
    linkedTasks
  );

  // Commercial Sales Pipeline metadata (Deal Value, Stage, Win Probability)
  const isSalesCategory =
    (pipeline.category || "").toLowerCase().includes("sales") ||
    (pipeline.category || "").toLowerCase().includes("commercial") ||
    Boolean(pipeline.dealValue || pipeline.dealStage);

  const dealValue: number =
    Number(pipeline.dealValue) ||
    Number(pipeline.cashFlowProjectionUSD) ||
    (pipeline.budget && !isNaN(Number(pipeline.budget)) ? Number(pipeline.budget) : 0) ||
    (isSalesCategory ? 250000 : 0);

  const dealStage: string =
    pipeline.dealStage ||
    (isSalesCategory
      ? dynamicProgress >= 100
        ? "Closed Won"
        : dynamicProgress >= 60
        ? "Contract Negotiation"
        : dynamicProgress >= 40
        ? "Proposal Sent"
        : dynamicProgress >= 20
        ? "Qualified"
        : "Discovery"
      : pipeline.status === "Completed"
      ? "Completed"
      : "In Progress");

  const winProbability: number =
    pipeline.winProbability !== undefined && pipeline.winProbability !== null && Number(pipeline.winProbability) > 0
      ? Number(pipeline.winProbability)
      : Math.max(10, Math.min(100, dynamicProgress || 60));

  return (
    <>
      {/* Compact Pipeline Card */}
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)] hover:shadow-md hover:border-[#0078D4] transition-all flex flex-col justify-between group relative">
        <div>
          {/* Header row */}
          <div className="flex justify-between items-start gap-2 mb-2">
            <h4
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-bold text-[#242424] dark:text-[#FFFFFF] leading-snug cursor-pointer group-hover:text-[#0078D4] transition-colors truncate"
              title={pipeline.name}
            >
              {pipeline.name}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`px-2 py-0.5 text-[11px] rounded font-semibold ${pipeline.priority === "High"
                    ? "bg-[#FDE7E9] text-[#D13438]"
                    : pipeline.priority === "Low"
                      ? "bg-[#DFF6DD] text-[#107C10]"
                      : "bg-[#FFF4CE] text-[#8F6B00]"
                  }`}
              >
                {pipeline.priority || "Medium"}
              </span>
            </div>
          </div>

          {/* Project & Team badges */}
          {(pipeline.projectId || pipeline.teamId) && (
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              {pipeline.projectId && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0078D4] bg-[#EBF3FC] dark:bg-[#1C2B3D] px-2 py-0.5 rounded truncate max-w-[140px]">
                  <FolderKanban className="w-3 h-3 shrink-0" />
                  <span className="truncate">{pipeline.projectId.name}</span>
                </span>
              )}
              {pipeline.teamId && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#605E5C] dark:text-[#C8C6C4] bg-[#F3F2F1] dark:bg-[#292827] px-2 py-0.5 rounded truncate max-w-[130px]">
                  <Users className="w-3 h-3 shrink-0" />
                  <span className="truncate">{pipeline.teamId.name}</span>
                </span>
              )}
            </div>
          )}

          {/* Meta summary: Category, Owner, Dates */}
          <div className="text-xs text-[#605E5C] dark:text-[#C8C6C4] space-y-1 mb-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-[#A19F9D]" />
                <span className="truncate max-w-[120px]">{pipeline.owner || "Unassigned"}</span>
              </span>
              <span className="text-[11px] text-[#A19F9D] uppercase tracking-wider font-medium">
                {pipeline.category || "General"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#605E5C] dark:text-[#A19F9D]">
              <Clock className="w-3 h-3 shrink-0" />
              <span>
                {pipeline.startDate ? pipeline.startDate.split("T")[0] : "TBD"} →{" "}
                {pipeline.endDate ? pipeline.endDate.split("T")[0] : "TBD"}
              </span>
            </div>
          </div>

          {/* Commercial Deal Strip */}
          {(dealValue > 0 || isSalesCategory) && (
            <div className="flex items-center justify-between text-[11px] mb-2.5 bg-[#FAF9F8] dark:bg-[#292827] px-2.5 py-1 rounded-[4px] border border-[#EDEBE9] dark:border-[#3B3A39]">
              <div className="flex items-center gap-1 text-[#107C10] dark:text-[#54B054] font-bold">
                <DollarSign className="w-3 h-3" />
                <span>${dealValue.toLocaleString()} USD</span>
              </div>
              <span className="text-purple-700 dark:text-purple-300 font-semibold text-[10px] bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-200/60 dark:border-purple-800/60">
                {dealStage}
              </span>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-[#605E5C] dark:text-[#C8C6C4] font-medium">Progress</span>
              <span className="font-bold text-[#242424] dark:text-[#FFFFFF]">{dynamicProgress}%</span>
            </div>
            <ProgressBar value={dynamicProgress} size="sm" tone={dynamicProgress >= 70 ? "success" : "brand"} />
          </div>

          {/* Checklist preview & Risk */}
          <div className="flex justify-between items-center text-xs pt-2.5 border-t border-[#EDEBE9] dark:border-[#292827]">
            <span className="inline-flex items-center gap-1 text-[11px] text-[#605E5C] dark:text-[#C8C6C4]">
              <CheckSquare className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>
                {totalTodos > 0 ? `${completedTodos}/${totalTodos} tasks` : "No tasks"}
              </span>
            </span>

            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${pipeline.riskLevel === "High"
                  ? "bg-[#FDE7E9] text-[#D13438]"
                  : pipeline.riskLevel === "Medium"
                    ? "bg-[#FFF4CE] text-[#8F6B00]"
                    : "bg-[#DFF6DD] text-[#107C10]"
                }`}
            >
              Risk: {pipeline.riskLevel || "Low"}
            </span>
          </div>
        </div>

        {/* Footer: Expand button */}
        <div className="mt-3 pt-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full py-1.5 px-3 rounded-[4px] bg-[#F3F2F1] dark:bg-[#292827] hover:bg-[#EBF3FC] dark:hover:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Open Details</span>
          </button>
        </div>
      </div>

      {/* BIG LOOK MODAL POPUP */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[12px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col p-6 md:p-8 relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start gap-4 pb-4 border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs font-bold text-[#0078D4] uppercase tracking-wider bg-[#EBF3FC] dark:bg-[#1C2B3D] px-2.5 py-0.5 rounded">
                    {pipeline.category || "General Pipeline"}
                  </span>
                  {dealStage && (
                    <span className="px-2.5 py-0.5 text-xs rounded font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                      <span>Stage: {dealStage}</span>
                    </span>
                  )}
                  <StatusBadge status={pipeline.status || "Active"} />
                  <span
                    className={`px-2 py-0.5 text-xs rounded font-semibold ${pipeline.priority === "High"
                        ? "bg-[#FDE7E9] text-[#D13438]"
                        : pipeline.priority === "Low"
                          ? "bg-[#DFF6DD] text-[#107C10]"
                          : "bg-[#FFF4CE] text-[#8F6B00]"
                      }`}
                  >
                    Priority: {pipeline.priority || "Medium"}
                  </span>
                </div>
                <h2 className="text-lg lg:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
                  {pipeline.name}
                </h2>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-[#F3F2F1] dark:hover:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column (Metadata & Details) */}
              <div className="lg:col-span-1 space-y-5 text-sm">
                {/* Project & Team */}
                <div className="bg-[#FAF9F8] dark:bg-[#292827] p-4 rounded-[8px] border border-[#E1DFDD] dark:border-[#3B3A39] space-y-2">
                  <span className="text-xs font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider block mb-1">
                    Organizational Hierarchy
                  </span>
                  {pipeline.projectId && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#0078D4]">
                      <FolderKanban className="w-4 h-4" />
                      <span>{pipeline.projectId.name}</span>
                    </div>
                  )}
                  {pipeline.teamId && (
                    <div className="flex items-center gap-2 text-xs font-medium text-[#242424] dark:text-[#FFFFFF]">
                      <Users className="w-4 h-4 text-[#605E5C]" />
                      <span>{pipeline.teamId.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-[#605E5C] dark:text-[#C8C6C4] pt-1">
                    <User className="w-4 h-4 text-[#A19F9D]" />
                    <span>Owner: <strong>{pipeline.owner || "Unassigned"}</strong></span>
                  </div>
                </div>

                {/* Timeline & Progress */}
                <div className="bg-[#FAF9F8] dark:bg-[#292827] p-4 rounded-[8px] border border-[#E1DFDD] dark:border-[#3B3A39]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase">Progress</span>
                    <span className="font-bold text-[#0078D4] text-base">{dynamicProgress}%</span>
                  </div>
                  <ProgressBar value={dynamicProgress} size="md" tone={dynamicProgress >= 70 ? "success" : "brand"} />
                  <p className="text-[10px] text-[#A19F9D] mt-1">Blends execution checklist ({completedTodos}/{totalTodos}) with linked deliverables — never set by hand.</p>

                  <div className="mt-3 pt-3 border-t border-[#E1DFDD] dark:border-[#3B3A39] text-xs space-y-1.5 text-[#605E5C] dark:text-[#C8C6C4]">
                    {dealStage && (
                      <div className="flex justify-between items-center">
                        <span>Stage:</span>
                        <strong className="text-purple-700 dark:text-purple-300 font-semibold">
                          {dealStage}
                        </strong>
                      </div>
                    )}
                    {dealValue > 0 && (
                      <div className="flex justify-between items-center">
                        <span>Deal Value:</span>
                        <strong className="text-[#107C10] dark:text-[#54B054] font-bold">
                          ${dealValue.toLocaleString()} USD
                        </strong>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span>Probability:</span>
                      <strong className="text-[#0078D4] font-semibold">
                        {winProbability}%
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Start Date:</span>
                      <strong className="text-[#242424] dark:text-[#FFFFFF]">
                        {pipeline.startDate ? pipeline.startDate.split("T")[0] : "TBD"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>End Date:</span>
                      <strong className="text-[#242424] dark:text-[#FFFFFF]">
                        {pipeline.endDate ? pipeline.endDate.split("T")[0] : "TBD"}
                      </strong>
                    </div>
                    {/* Editable timeline — same dates the Classic Gantt drags */}
                    {role !== "viewer" ? (
                      <div className="pt-2 mt-1 border-t border-[#E1DFDD] dark:border-[#3B3A39] space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Start</span>
                            <input
                              type="date"
                              value={editStart}
                              onChange={(e) => setEditStart(e.target.value)}
                              className="mt-0.5 w-full px-2 py-1 text-xs rounded bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-semibold uppercase tracking-wider">End</span>
                            <input
                              type="date"
                              value={editEnd}
                              onChange={(e) => setEditEnd(e.target.value)}
                              className="mt-0.5 w-full px-2 py-1 text-xs rounded bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveDates}
                          disabled={isSavingDates}
                          className="w-full py-1.5 rounded text-xs font-semibold bg-[#0078D4] hover:bg-[#106EBE] disabled:opacity-50 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{isSavingDates ? "Saving Timeline..." : "Save Timeline Dates"}</span>
                        </button>
                        {datesFeedback && (
                          <p className={`text-[11px] font-medium ${datesFeedback.startsWith("Timeline saved") ? "text-[#107C10]" : "text-[#D13438]"}`}>
                            {datesFeedback}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#A19F9D] pt-1">Date editing is disabled in viewer mode.</p>
                    )}
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <strong
                        className={
                          pipeline.riskLevel === "High"
                            ? "text-[#D13438]"
                            : pipeline.riskLevel === "Medium"
                              ? "text-[#8F6B00]"
                              : "text-[#107C10]"
                        }
                      >
                        {pipeline.riskLevel || "Low"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Daily rhythm: day-before -> yesterday -> today +deltas */}
                <div className="bg-[#FAF9F8] dark:bg-[#292827] p-4 rounded-[8px] border border-[#E1DFDD] dark:border-[#3B3A39]">
                  <span className="text-xs font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider block mb-2">
                    Daily Rhythm (5pm snapshots)
                  </span>
                  {!history ? (
                    <p className="text-[11px] text-[#A19F9D]">Loading daily pairs…</p>
                  ) : history.points.length === 0 ? (
                    <p className="text-[11px] text-[#A19F9D]">
                      No snapshots yet — the daily 5pm job starts the series tonight.
                    </p>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {history.points.map((p, i) => (
                        <span key={p.date} className="flex items-center gap-1.5">
                          <span className="text-center">
                            <span className="block text-sm font-extrabold text-[#242424] dark:text-[#FFFFFF] tabular-nums">
                              {p.value}%
                            </span>
                            <span className="block text-[9px] text-[#A19F9D] font-medium">
                              {p.date.slice(5).replace("-", "/")}
                            </span>
                          </span>
                          {i < history.points.length - 1 && (
                            <span className="flex flex-col items-center mx-0.5">
                              <span className="text-gray-300 dark:text-gray-600">→</span>
                              <span className={`text-[10px] font-extrabold tabular-nums ${history.deltas[i] > 0 ? "text-[#107C10]" : history.deltas[i] < 0 ? "text-[#D13438]" : "text-[#A19F9D]"}`}>
                                {history.deltas[i] > 0 ? `+${history.deltas[i]}%` : `${history.deltas[i]}%`}
                              </span>
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Linked granular deliverables (dev-dashboard tasks) */}
                {linkedTasks.length > 0 && (
                  <div className="bg-[#FAF9F8] dark:bg-[#292827] p-4 rounded-[8px] border border-[#E1DFDD] dark:border-[#3B3A39]">
                    <span className="text-xs font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider block mb-2">
                      Linked Deliverables ({linkedTasks.length})
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                      {linkedTasks.map((t: any, i: number) => {
                        const pct = taskCompletion(t);
                        return (
                          <div key={i} className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px] px-2.5 py-2">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-semibold text-[#242424] dark:text-[#FFFFFF] truncate" title={t.name}>
                                {t.name || "Linked task"}
                              </span>
                              <span className="text-[11px] font-extrabold text-[#0078D4] tabular-nums shrink-0">{pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[#EDEBE9] dark:bg-[#3B3A39] overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct >= 100 ? "bg-[#107C10]" : pct >= 50 ? "bg-[#0078D4]" : "bg-[#F7630C]"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                {(pipeline.cashFlowProjectionUSD > 0 || pipeline.expensesUSD > 0 || pipeline.budget) && (
                  <div className="bg-[#FAF9F8] dark:bg-[#292827] p-4 rounded-[8px] border border-[#E1DFDD] dark:border-[#3B3A39] space-y-2">
                    <span className="text-xs font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider block mb-1">
                      Financial Overview
                    </span>
                    {pipeline.budget && (
                      <div className="flex justify-between text-xs">
                        <span>Budget Allocated:</span>
                        <strong className="text-[#107C10]">${Number(pipeline.budget).toLocaleString()}</strong>
                      </div>
                    )}
                    {pipeline.cashFlowProjectionUSD > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>Projected Revenue:</span>
                        <strong className="text-[#107C10]">${pipeline.cashFlowProjectionUSD.toLocaleString()}</strong>
                      </div>
                    )}
                    {pipeline.expensesUSD > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>Expenses:</span>
                        <strong className="text-[#D13438]">${pipeline.expensesUSD.toLocaleString()}</strong>
                      </div>
                    )}
                    {pipeline.roiPercent > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>Target ROI:</span>
                        <strong className="text-[#0078D4]">{pipeline.roiPercent}%</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Objectives & Deliverable */}
                {pipeline.objectives && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase mb-1">Objectives</h4>
                    <p className="text-xs text-[#242424] dark:text-[#C8C6C4] leading-relaxed bg-[#FAF9F8] dark:bg-[#292827] p-3 rounded border border-[#E1DFDD] dark:border-[#3B3A39]">
                      {pipeline.objectives}
                    </p>
                  </div>
                )}

                {pipeline.outcome && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#0078D4] uppercase mb-1">Deliverable Outcome</h4>
                    <p className="text-xs text-[#0078D4] bg-[#EBF3FC] dark:bg-[#1C2B3D] p-3 rounded border border-[#0078D4]/20 leading-relaxed font-medium">
                      {pipeline.outcome}
                    </p>
                  </div>
                )}

                {pipeline.dependencies && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase mb-1">Dependencies</h4>
                    <p className="text-xs text-[#F7630C] bg-[#FDE7D9]/40 dark:bg-[#4A2209]/40 p-2.5 rounded border border-[#F7630C]/20 flex items-center gap-1.5 font-medium">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{pipeline.dependencies}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Interactive Checklist & Todos */}
              <div className="lg:col-span-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF] flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-[#0078D4]" />
                      <span>Execution Checklist ({completedTodos}/{totalTodos})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsReorderMode(!isReorderMode)}
                      className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1 ${isReorderMode
                          ? "bg-[#0078D4] text-white"
                          : "bg-[#F3F2F1] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#EDEBE9]"
                        }`}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>{isReorderMode ? "Done Reordering" : "Reorder"}</span>
                    </button>
                  </div>

                  {/* Todo List Items */}
                  <div className="space-y-2 mb-4 max-h-[360px] overflow-y-auto pr-1">
                    {todos.map((todo: any, index: number) => (
                      <div
                        key={todo._id}
                        draggable={isReorderMode}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={handleDrop}
                        className={`flex items-center gap-2.5 p-3 rounded-[6px] border transition-all text-xs ${isReorderMode
                            ? "cursor-grab border-dashed border-[#0078D4] bg-[#EBF3FC]/40 dark:bg-[#1C2B3D]/40"
                            : "border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] hover:border-[#0078D4]"
                          }`}
                      >
                        {!isReorderMode && (
                          <input
                            type="checkbox"
                            disabled={role === "viewer"}
                            className={`rounded accent-[#0078D4] w-4 h-4 shrink-0 ${
                              role === "viewer" ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                            }`}
                            checked={Boolean(todo.completed)}
                            onChange={(e) => {
                              if (role === "viewer") return;
                              const newCompleted = e.target.checked;
                              const newTodos = [...todos];
                              newTodos[index].completed = newCompleted;
                              setTodos(newTodos);
                              togglePipelineTodo(pipeline._id, todo._id, newCompleted);
                            }}
                          />
                        )}
                        <span
                          className={`flex-1 break-words ${todo.completed
                              ? "line-through text-[#A19F9D]"
                              : "text-[#242424] dark:text-[#FFFFFF] font-medium"
                            }`}
                        >
                          {todo.text}
                        </span>

                        {todo.assigneeName && !isReorderMode && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-[#F3F2F1] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] font-medium shrink-0 flex items-center gap-1">
                            {todo.assigneeType === "Group" ? (
                              <Users className="w-3 h-3 text-[#0078D4]" />
                            ) : (
                              <User className="w-3 h-3 text-[#0078D4]" />
                            )}
                            <span>{todo.assigneeName}</span>
                          </span>
                        )}

                        {!isReorderMode && role !== "viewer" && (
                          <button
                            type="button"
                            onClick={() => {
                              const newTodos = [...todos];
                              newTodos.splice(index, 1);
                              setTodos(newTodos);
                              deletePipelineTodo(pipeline._id, todo._id);
                            }}
                            className="text-[#A19F9D] hover:text-[#D13438] p-1 transition-colors cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    {todos.length === 0 && (
                      <div className="py-6 text-center text-xs text-[#A19F9D] border border-dashed border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px]">
                        No checklist items yet. Add one below!
                      </div>
                    )}
                  </div>

                  {/* Add Todo Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (role === "viewer") {
                        return;
                      }
                      const form = e.currentTarget;
                      const formData = new FormData(form);
                      const text = formData.get("text") as string;
                      const assigneeType = (formData.get("assigneeType") as string) || "Individual";
                      const assigneeName = (formData.get("assigneeName") as string) || "";
                      if (!text || !text.trim()) return;

                      const newTodo = {
                        _id: Date.now().toString(),
                        text: text.trim(),
                        completed: false,
                        assigneeType,
                        assigneeName,
                      };
                      setTodos((prev: any) => [...prev, newTodo]);
                      form.reset();
                      addPipelineTodo(pipeline._id, formData);
                    }}
                    className="flex gap-2 flex-wrap items-center bg-[#FAF9F8] dark:bg-[#292827] p-3 rounded-[6px] border border-[#E1DFDD] dark:border-[#3B3A39]"
                  >
                    <input
                      type="text"
                      name="text"
                      list={`predefined-tasks-${pipeline._id}`}
                      placeholder="Add new checklist task..."
                      className="flex-1 min-w-[140px] px-3 py-1.5 text-xs rounded bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                      required
                    />
                    <datalist id={`predefined-tasks-${pipeline._id}`}>
                      {PREDEFINED_PIPELINE_TASKS[pipeline.category || ""]?.map((task) => (
                        <option key={task} value={task} />
                      ))}
                    </datalist>

                    <select
                      name="assigneeType"
                      value={selectedAssigneeType}
                      onChange={(e) => setSelectedAssigneeType(e.target.value)}
                      className="px-2 py-1.5 text-xs rounded bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-[#FFFFFF] cursor-pointer"
                    >
                      <option value="Individual">Person</option>
                      <option value="Group">Team</option>
                    </select>

                    <input
                      type="text"
                      name="assigneeName"
                      list={`assignees-${pipeline._id}`}
                      placeholder="Assignee..."
                      className="w-28 px-3 py-1.5 text-xs rounded bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-[#FFFFFF] outline-none"
                    />
                    <datalist id={`assignees-${pipeline._id}`}>
                      {selectedAssigneeType === "Individual"
                        ? users.map((u) => <option key={u.id} value={u.name} />)
                        : teams.map((t) => <option key={t.id} value={t.name} />)}
                    </datalist>

                    <button
                      type="submit"
                      disabled={role === "viewer"}
                      className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                        role === "viewer"
                          ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600"
                          : "bg-[#0078D4] hover:bg-[#006CBE] text-white cursor-pointer"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{role === "viewer" ? "Add (Disabled)" : "Add"}</span>
                    </button>
                  </form>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#E1DFDD] dark:border-[#3B3A39]">
                  {canManagePipeline ? (
                    <form
                      action={deletePipeline}
                      onSubmit={(e) => {
                        if (!window.confirm(`Are you sure you want to delete pipeline "${pipeline.name}"?`)) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="pipelineId" value={pipeline._id.toString()} />
                      <button
                        type="submit"
                        className="text-xs text-[#D13438] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Pipeline</span>
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="px-3 py-1.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600"
                    >
                      Delete Disabled
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-[#F3F2F1] dark:bg-[#292827] hover:bg-[#EDEBE9] text-[#242424] dark:text-[#FFFFFF] text-xs font-semibold rounded transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
