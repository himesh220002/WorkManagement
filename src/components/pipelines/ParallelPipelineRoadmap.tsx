"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  Sparkles,
  GitBranch,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Maximize2,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface PipelineItem {
  _id: string;
  name: string;
  category?: string;
  owner?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  progress?: number;
  priority?: string;
  objectives?: string;
  dependencies?: string;
  budget?: string;
  kpis?: string;
  riskLevel?: string;
  notes?: string;
  projectId?: { _id?: string; name?: string } | null;
  teamId?: { _id?: string; name?: string } | null;
  todos?: Array<{ text: string; completed: boolean; assigneeName?: string }>;
}

interface ParallelPipelineRoadmapProps {
  pipelines: PipelineItem[];
  currentRole?: string;
  isGuest?: boolean;
  onSelectPipeline?: (pipeline: PipelineItem) => void;
}

export default function ParallelPipelineRoadmap({
  pipelines = [],
  currentRole = "manager",
  isGuest = false,
  onSelectPipeline,
}: ParallelPipelineRoadmapProps) {
  const [scaleMode, setScaleMode] = useState<"months" | "weeks" | "quarters">("months");
  const [projectFilter, setProjectFilter] = useState<string>("All");
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineItem | null>(null);

  // Group pipelines by project
  const projectGroups = useMemo(() => {
    const groups: Record<string, { projectName: string; items: PipelineItem[] }> = {};

    pipelines.forEach((p) => {
      const projName = p.projectId?.name || "General Cross-Functional Tracks";
      if (!groups[projName]) {
        groups[projName] = { projectName: projName, items: [] };
      }
      groups[projName].items.push(p);
    });

    return groups;
  }, [pipelines]);

  const projectNames = useMemo(() => {
    return ["All", ...Object.keys(projectGroups)];
  }, [projectGroups]);

  // Compute global date envelope across all pipelines
  const { minDate, maxDate, totalDurationDays } = useMemo(() => {
    let minMs = Infinity;
    let maxMs = -Infinity;

    pipelines.forEach((p) => {
      const s = p.startDate ? new Date(p.startDate).getTime() : Date.now() - 30 * 86400000;
      const e = p.endDate ? new Date(p.endDate).getTime() : s + 45 * 86400000;
      if (s < minMs) minMs = s;
      if (e > maxMs) maxMs = e;
    });

    // Provide safe defaults if no pipelines exist
    if (minMs === Infinity || maxMs === -Infinity) {
      const now = Date.now();
      minMs = now - 60 * 86400000;
      maxMs = now + 90 * 86400000;
    }

    // Add padding to margins
    const paddedMin = new Date(minMs);
    paddedMin.setDate(1); // align to 1st of that month
    paddedMin.setHours(0, 0, 0, 0);

    const paddedMax = new Date(maxMs);
    paddedMax.setMonth(paddedMax.getMonth() + 1); // push to next month end
    paddedMax.setDate(0);
    paddedMax.setHours(23, 59, 59, 999);

    const totalDays = Math.max(
      1,
      Math.round((paddedMax.getTime() - paddedMin.getTime()) / 86400000)
    );

    return {
      minDate: paddedMin,
      maxDate: paddedMax,
      totalDurationDays: totalDays,
    };
  }, [pipelines]);

  // Generate Month Columns
  const monthColumns = useMemo(() => {
    const cols: Array<{ label: string; year: number; startDays: number; spanDays: number }> = [];
    const cur = new Date(minDate.getTime());

    while (cur <= maxDate) {
      const y = cur.getFullYear();
      const m = cur.getMonth();
      const monthStart = new Date(y, m, 1);
      const monthEnd = new Date(y, m + 1, 0, 23, 59, 59);

      const effectiveStart = Math.max(monthStart.getTime(), minDate.getTime());
      const effectiveEnd = Math.min(monthEnd.getTime(), maxDate.getTime());

      const startDays = Math.max(0, Math.round((effectiveStart - minDate.getTime()) / 86400000));
      const spanDays = Math.max(1, Math.round((effectiveEnd - effectiveStart) / 86400000));

      cols.push({
        label: cur.toLocaleString("en-US", { month: "short" }),
        year: y,
        startDays,
        spanDays,
      });

      cur.setMonth(cur.getMonth() + 1);
      cur.setDate(1);
    }
    return cols;
  }, [minDate, maxDate]);

  // Generate Week / Sprint intervals
  const weekColumns = useMemo(() => {
    const cols: Array<{ label: string; startDays: number; spanDays: number }> = [];
    let cur = new Date(minDate.getTime());
    let weekIndex = 1;

    while (cur < maxDate) {
      const startDays = Math.max(0, Math.round((cur.getTime() - minDate.getTime()) / 86400000));
      const spanDays = 7;
      cols.push({
        label: `W${weekIndex}`,
        startDays,
        spanDays,
      });
      weekIndex++;
      cur = new Date(cur.getTime() + 7 * 86400000);
    }
    return cols;
  }, [minDate, maxDate]);

  // Today indicator position
  const todayPositionPercent = useMemo(() => {
    const now = Date.now();
    if (now < minDate.getTime()) return null;
    if (now > maxDate.getTime()) return null;
    const elapsedDays = (now - minDate.getTime()) / 86400000;
    return (elapsedDays / totalDurationDays) * 100;
  }, [minDate, maxDate, totalDurationDays]);

  // Filtered project groups
  const displayGroups = useMemo(() => {
    if (projectFilter === "All") {
      return Object.values(projectGroups);
    }
    return projectGroups[projectFilter] ? [projectGroups[projectFilter]] : [];
  }, [projectGroups, projectFilter]);

  // Category Theme Mapper
  const getCategoryStyles = (category?: string) => {
    switch ((category || "").toLowerCase()) {
      case "development":
        return {
          barBg: "from-blue-600 to-indigo-600 text-white shadow-blue-500/20",
          progressBg: "bg-blue-300/40",
          pill: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border-blue-200 dark:border-blue-700",
          border: "border-blue-400 dark:border-blue-600",
        };
      case "operations":
      case "service operations & channels":
        return {
          barBg: "from-emerald-600 to-teal-600 text-white shadow-emerald-500/20",
          progressBg: "bg-emerald-300/40",
          pill: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700",
          border: "border-emerald-400 dark:border-emerald-600",
        };
      case "hardware & r&d":
      case "hardware manufacturing & mass production":
        return {
          barBg: "from-purple-600 to-violet-600 text-white shadow-purple-500/20",
          progressBg: "bg-purple-300/40",
          pill: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-200 dark:border-purple-700",
          border: "border-purple-400 dark:border-purple-600",
        };
      case "sales":
      case "finance":
        return {
          barBg: "from-amber-600 to-orange-600 text-white shadow-amber-500/20",
          progressBg: "bg-amber-300/40",
          pill: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-200 dark:border-amber-700",
          border: "border-amber-400 dark:border-amber-600",
        };
      case "marketing":
        return {
          barBg: "from-pink-600 to-rose-600 text-white shadow-pink-500/20",
          progressBg: "bg-pink-300/40",
          pill: "bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-200 border-pink-200 dark:border-pink-700",
          border: "border-pink-400 dark:border-pink-600",
        };
      default:
        return {
          barBg: "from-slate-600 to-gray-700 text-white shadow-slate-500/20",
          progressBg: "bg-slate-300/40",
          pill: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
          border: "border-slate-400 dark:border-slate-600",
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#0078D4] to-[#107C10] flex items-center justify-center text-white shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Enterprise Parallel Pipeline Matrix
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DFF6DD] text-[#107C10] dark:bg-[#0F3818] dark:text-[#54B054]">
                Multi-Track Live Synchronization
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Synchronized parallel workflows spanning development, manufacturing, and commercialization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-between md:justify-end">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <Filter className="w-3.5 h-3.5 text-gray-500 ml-1.5" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-transparent font-semibold text-gray-800 dark:text-gray-200 outline-none pr-2 py-1 cursor-pointer"
            >
              {projectNames.map((p) => (
                <option key={p} value={p}>
                  {p === "All" ? "All Project Tracks" : p}
                </option>
              ))}
            </select>
          </div>

          {/* Time Horizon Switcher */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setScaleMode("months")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                scaleMode === "months"
                  ? "bg-white dark:bg-gray-700 text-[#0078D4] dark:text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              Monthly Horizon
            </button>
            <button
              type="button"
              onClick={() => setScaleMode("weeks")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                scaleMode === "weeks"
                  ? "bg-white dark:bg-gray-700 text-[#0078D4] dark:text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              Sprint Weeks
            </button>
          </div>
        </div>
      </div>

      {/* Main Roadmap Timeline Container */}
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-xl shadow-sm overflow-hidden">
        {/* Timeline Header & Scale Bar */}
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header Timeline Columns */}
            <div className="grid grid-cols-[260px_1fr] border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#181818]">
              {/* Left Track Column Label */}
              <div className="p-3.5 border-r border-gray-200 dark:border-gray-800 font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-between">
                <span>Parallel Project Stream</span>
                <span className="text-[10px] font-normal text-gray-400">Tracks</span>
              </div>

              {/* Right Calendar Columns */}
              <div className="relative h-12 flex items-stretch">
                {scaleMode === "months"
                  ? monthColumns.map((col, idx) => {
                      const widthPercent = (col.spanDays / totalDurationDays) * 100;
                      return (
                        <div
                          key={idx}
                          className="border-r border-gray-200 dark:border-gray-800 flex flex-col justify-center px-3 text-xs"
                          style={{ width: `${widthPercent}%` }}
                        >
                          <span className="font-bold text-gray-900 dark:text-white">
                            {col.label}
                          </span>
                          <span className="text-[10px] text-gray-400">{col.year}</span>
                        </div>
                      );
                    })
                  : weekColumns.map((col, idx) => {
                      const widthPercent = (col.spanDays / totalDurationDays) * 100;
                      return (
                        <div
                          key={idx}
                          className="border-r border-gray-200 dark:border-gray-800 flex items-center justify-center text-[11px] font-medium text-gray-600 dark:text-gray-400"
                          style={{ width: `${widthPercent}%` }}
                        >
                          {col.label}
                        </div>
                      );
                    })}

                {/* Today Line Indicator in Header */}
                {todayPositionPercent !== null && (
                  <div
                    className="absolute top-0 bottom-0 z-30 flex flex-col items-center pointer-events-none"
                    style={{ left: `${todayPositionPercent}%` }}
                  >
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white shadow-xs -mt-1 tracking-wider uppercase">
                      Today
                    </span>
                    <div className="w-0.5 flex-1 bg-rose-500/80" />
                  </div>
                )}
              </div>
            </div>

            {/* Swimlanes Body */}
            <div className="divide-y divide-gray-200 dark:divide-gray-800 relative">
              {/* Continuous Today Line across all swimlanes */}
              {todayPositionPercent !== null && (
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-none border-l-2 border-dashed border-rose-500/60"
                  style={{ left: `calc(260px + (100% - 260px) * ${todayPositionPercent / 100})` }}
                />
              )}

              {displayGroups.map((group, gIdx) => (
                <div key={gIdx} className="group/lane">
                  {/* Project Swimlane Banner */}
                  <div className="bg-gradient-to-r from-gray-100/80 via-blue-50/20 to-transparent dark:from-gray-800/60 dark:via-gray-800/20 px-4 py-2 flex items-center justify-between border-y border-gray-200/60 dark:border-gray-800/60">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#0078D4]" />
                      <span className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider">
                        {group.projectName}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        ({group.items.length} concurrent tracks)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                      <span>
                        Avg Progress:{" "}
                        <strong className="text-gray-800 dark:text-gray-200">
                          {Math.round(
                            group.items.reduce((s, i) => s + (i.progress || 0), 0) /
                              Math.max(1, group.items.length)
                          )}
                          %
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Individual Pipeline Lanes in Project */}
                  <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                    {group.items.map((pipe) => {
                      // Calculate bar positioning percentages
                      const startMs = pipe.startDate
                        ? new Date(pipe.startDate).getTime()
                        : minDate.getTime();
                      const endMs = pipe.endDate
                        ? new Date(pipe.endDate).getTime()
                        : startMs + 30 * 86400000;

                      const startOffsetDays = Math.max(
                        0,
                        (startMs - minDate.getTime()) / 86400000
                      );
                      const durationDays = Math.max(1, (endMs - startMs) / 86400000);

                      const leftPercent = Math.max(
                        0,
                        Math.min(100, (startOffsetDays / totalDurationDays) * 100)
                      );
                      const widthPercent = Math.max(
                        2,
                        Math.min(100 - leftPercent, (durationDays / totalDurationDays) * 100)
                      );

                      const theme = getCategoryStyles(pipe.category);
                      const isCompleted = (pipe.progress || 0) >= 100;
                      const todos = pipe.todos || [];
                      const completedTodos = todos.filter((t) => t.completed).length;

                      const startStr = pipe.startDate
                        ? new Date(pipe.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "TBD";
                      const endStr = pipe.endDate
                        ? new Date(pipe.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "TBD";

                      return (
                        <div
                          key={pipe._id}
                          className="grid grid-cols-[260px_1fr] hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors py-2.5 items-center"
                        >
                          {/* Left Column: Track Info */}
                          <div className="px-4 pr-3 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-center">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span
                                className="font-bold text-xs text-gray-900 dark:text-white truncate cursor-pointer hover:text-[#0078D4]"
                                title={pipe.name}
                                onClick={() => setSelectedPipeline(pipe)}
                              >
                                {pipe.name}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                  isCompleted
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : (pipe.progress || 0) > 0
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                }`}
                              >
                                {pipe.progress || 0}%
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                              <span className="truncate">{pipe.category || "General"}</span>
                              <span>•</span>
                              <span className="truncate">{pipe.owner || "Unassigned"}</span>
                            </div>
                          </div>

                          {/* Right Column: Visual Timeline Bar */}
                          <div className="relative h-12 flex items-center px-2">
                            {/* Background Grid Lines */}
                            <div className="absolute inset-0 flex pointer-events-none">
                              {monthColumns.map((col, idx) => (
                                <div
                                  key={idx}
                                  className="border-r border-gray-100 dark:border-gray-800/40 h-full"
                                  style={{
                                    width: `${(col.spanDays / totalDurationDays) * 100}%`,
                                  }}
                                />
                              ))}
                            </div>

                            {/* The Interactive Visual Pipeline Bar */}
                            <div
                              onClick={() => setSelectedPipeline(pipe)}
                              className={`absolute h-8 rounded-lg bg-gradient-to-r ${theme.barBg} shadow-sm border ${theme.border} flex items-center px-3 text-xs font-semibold cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all overflow-hidden group select-none`}
                              style={{
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                minWidth: "120px",
                              }}
                            >
                              {/* Internal Progress Fill Layer */}
                              <div
                                className={`absolute left-0 top-0 bottom-0 ${theme.progressBg} transition-all duration-500`}
                                style={{ width: `${pipe.progress || 0}%` }}
                              />

                              {/* Bar Content: Name & Dates */}
                              <div className="relative z-10 flex items-center justify-between w-full min-w-0 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-white" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5 shrink-0 text-white/90" />
                                  )}
                                  <span className="truncate text-white font-medium text-[11px]">
                                    {pipe.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 text-[10px] text-white/90 font-normal">
                                  {todos.length > 0 && (
                                    <span className="hidden sm:inline bg-black/20 px-1.5 py-0.5 rounded">
                                      {completedTodos}/{todos.length} Done
                                    </span>
                                  )}
                                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                    {startStr} – {endStr}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {displayGroups.length === 0 && (
                <div className="py-16 text-center text-gray-500 dark:text-gray-400 text-xs">
                  No active pipelines found for the selected filter.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-out / Popover Detail Modal for Inspected Pipeline */}
      {selectedPipeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-xl max-w-xl w-full shadow-2xl p-6 overflow-hidden flex flex-col space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0078D4]">
                  {selectedPipeline.category || "Execution Track"}
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                  {selectedPipeline.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Project: {selectedPipeline.projectId?.name || "General"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPipeline(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Progress & Timing Metric Cards */}
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Progress</span>
                <div className="text-sm font-bold text-[#0078D4] mt-0.5">
                  {selectedPipeline.progress || 0}%
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Start Date</span>
                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {selectedPipeline.startDate
                    ? new Date(selectedPipeline.startDate).toLocaleDateString()
                    : "Not Set"}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Target Completion</span>
                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {selectedPipeline.endDate
                    ? new Date(selectedPipeline.endDate).toLocaleDateString()
                    : "Not Set"}
                </div>
              </div>
            </div>

            {/* Objectives & Interconnectivity */}
            {selectedPipeline.objectives && (
              <div className="text-xs bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800/60">
                <span className="font-bold text-blue-900 dark:text-blue-300 block mb-1">
                  Core Objectives
                </span>
                <p className="text-blue-800 dark:text-blue-200 leading-relaxed text-[11px]">
                  {selectedPipeline.objectives}
                </p>
              </div>
            )}

            {selectedPipeline.dependencies && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
                <GitBranch className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Prerequisite Link:</strong> {selectedPipeline.dependencies}
                </span>
              </div>
            )}

            {/* Checklists / Milestones */}
            {selectedPipeline.todos && selectedPipeline.todos.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Execution Checkpoints ({selectedPipeline.todos.length})
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                  {selectedPipeline.todos.map((todo, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60"
                    >
                      <div className="flex items-center gap-2">
                        {todo.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-400" />
                        )}
                        <span
                          className={`${
                            todo.completed
                              ? "line-through text-gray-400"
                              : "text-gray-800 dark:text-gray-200"
                          } text-[11px]`}
                        >
                          {todo.text}
                        </span>
                      </div>
                      {todo.assigneeName && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          {todo.assigneeName}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPipeline(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
