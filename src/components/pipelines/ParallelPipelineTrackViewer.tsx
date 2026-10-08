"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  Calendar,
  CheckSquare,
  Shield,
  Workflow,
  Zap,
} from "lucide-react";
import { computePipelineProgress } from "@/utils/pipelineProgress";

export interface ParallelPipelineTrackViewerProps {
  pipelines: any[];
  projectName?: string;
  projectId?: string;
  compact?: boolean;
}

export default function ParallelPipelineTrackViewer({
  pipelines = [],
  projectName = "Active Project",
  projectId,
  compact = false,
}: ParallelPipelineTrackViewerProps) {
  const [expandedPipelineId, setExpandedPipelineId] = useState<string | null>(null);
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>("All");

  if (!pipelines || pipelines.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#252423] border border-dashed border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500">
        No parallel execution pipelines initialized for this project.
      </div>
    );
  }

  // Calculate live dynamic progress for each pipeline
  const enrichedPipelines = pipelines.map((pipe) => {
    const liveProgress = computePipelineProgress(pipe);
    const todos = Array.isArray(pipe.todos) ? pipe.todos : [];
    const completedTodos = todos.filter((t: any) => t.completed).length;

    return {
      ...pipe,
      liveProgress,
      totalTodos: todos.length,
      completedTodos,
    };
  });

  // Track categories
  const trackCategories = Array.from(
    new Set(enrichedPipelines.map((p) => p.category || "Execution Track"))
  );

  const filteredPipelines =
    selectedTrackFilter === "All"
      ? enrichedPipelines
      : enrichedPipelines.filter((p) => p.category === selectedTrackFilter);

  // Ecosystem parallel health calculations
  const totalTracks = enrichedPipelines.length;
  const avgProgress =
    totalTracks > 0
      ? Math.round(
          enrichedPipelines.reduce((acc, p) => acc + p.liveProgress, 0) / totalTracks
        )
      : 0;
  const completedTracks = enrichedPipelines.filter((p) => p.liveProgress >= 100).length;
  const activeTracks = enrichedPipelines.filter(
    (p) => p.liveProgress > 0 && p.liveProgress < 100
  ).length;

  return (
    <div className="space-y-3.5 select-none">
      {/* Parallel Execution Header & Telemetry Strip */}
      <div className="bg-gradient-to-r from-gray-50 via-blue-50/40 to-emerald-50/30 dark:from-[#252423] dark:via-[#1C2B3D]/30 dark:to-[#0F3818]/20 p-3 sm:p-3.5 rounded-lg border border-[#E1DFDD] dark:border-[#3B3A39] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0078D4] text-white flex items-center justify-center shadow-xs shrink-0">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-gray-900 dark:text-white tracking-tight">
                Parallel Execution Pipeline Mesh
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5]">
                {totalTracks} Concurrent Tracks
              </span>
            </div>
            <p className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4]">
              Simultaneous delivery lanes linked with live milestone interconnectivity.
            </p>
          </div>
        </div>

        {/* Global Progress Dial */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200 dark:border-gray-700">
          <div className="text-right">
            <div className="text-xs font-bold text-gray-900 dark:text-white">
              {avgProgress}% Synced
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              {completedTracks} Shipped · {activeTracks} Active
            </div>
          </div>
          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0078D4] to-[#107C10] rounded-full transition-all duration-500"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Track Filter Pills (if multiple categories exist) */}
      {trackCategories.length > 1 && !compact && (
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          <button
            type="button"
            onClick={() => setSelectedTrackFilter("All")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              selectedTrackFilter === "All"
                ? "bg-[#0078D4] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            All Tracks ({enrichedPipelines.length})
          </button>
          {trackCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedTrackFilter(cat)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                selectedTrackFilter === cat
                  ? "bg-[#0078D4] text-white font-semibold"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {cat} (
              {enrichedPipelines.filter((p) => (p.category || "Execution Track") === cat).length}
              )
            </button>
          ))}
        </div>
      )}

      {/* Parallel Tracks Grid Lanes */}
      <div
        className={`grid gap-3 ${
          compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {filteredPipelines.map((pipe, index) => {
          const isExpanded = expandedPipelineId === pipe._id;
          const isCompleted = pipe.liveProgress >= 100;
          const hasDependencies = Boolean(pipe.dependencies);

          // Color themes based on live progress
          const progressTone = isCompleted
            ? "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20"
            : pipe.liveProgress >= 50
            ? "border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/20"
            : "border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/20";

          return (
            <div
              key={pipe._id}
              className={`rounded-lg border transition-all duration-200 p-3.5 flex flex-col justify-between hover:shadow-sm ${progressTone} ${
                isExpanded ? "ring-2 ring-[#0078D4]/40" : ""
              }`}
            >
              <div>
                {/* Track Lane Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isCompleted
                          ? "bg-emerald-500"
                          : pipe.liveProgress > 0
                          ? "bg-blue-500 animate-pulse"
                          : "bg-amber-500"
                      }`}
                    />
                    <h4
                      className="font-bold text-xs text-gray-900 dark:text-white truncate"
                      title={pipe.name}
                    >
                      {pipe.name}
                    </h4>
                  </div>

                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                      isCompleted
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200"
                    }`}
                  >
                    {pipe.liveProgress}%
                  </span>
                </div>

                {/* Subtitle / Category & Squad */}
                <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mb-2.5">
                  <span className="bg-white/80 dark:bg-[#1E1E1E] px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                    {pipe.category || "General"}
                  </span>
                  {pipe.teamId?.name && (
                    <span className="flex items-center gap-1 truncate text-gray-600 dark:text-gray-300">
                      <Users className="w-3 h-3 text-[#0078D4]" />
                      <span className="truncate">{pipe.teamId.name}</span>
                    </span>
                  )}
                </div>

                {/* Live Progress Bar with Interconnectivity Glow */}
                <div className="w-full bg-gray-200/80 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isCompleted
                        ? "bg-emerald-600"
                        : pipe.liveProgress >= 50
                        ? "bg-[#0078D4]"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${pipe.liveProgress}%` }}
                  />
                </div>

                {/* Interconnectivity Dependency Ribbon */}
                {hasDependencies && (
                  <div className="p-2 rounded bg-white/70 dark:bg-[#1C1C1C] border border-gray-200/80 dark:border-gray-800 text-[10px] text-gray-600 dark:text-gray-300 mb-2.5 flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3 text-[#0078D4] shrink-0" />
                    <span className="truncate">
                      <strong className="text-gray-700 dark:text-gray-200">Parallel Sync:</strong>{" "}
                      {pipe.dependencies}
                    </span>
                  </div>
                )}

                {/* Checklist Summary */}
                {pipe.totalTodos > 0 && (
                  <div className="text-[11px] text-gray-600 dark:text-gray-300 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3 h-3 text-gray-400" />
                      <span>Milestones:</span>
                    </span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {pipe.completedTodos} / {pipe.totalTodos} tasks
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Expand Toggle & Quick Link */}
              <div className="pt-2 border-t border-gray-200/50 dark:border-gray-800 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setExpandedPipelineId(isExpanded ? null : pipe._id)}
                  className="text-[#0078D4] dark:text-[#479EF5] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>{isExpanded ? "Hide Milestones" : "View Milestones"}</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <Link
                  href={`/dev/timeline`}
                  className="text-gray-500 hover:text-[#0078D4] flex items-center gap-1"
                  title="Inspect in Interactive Frappe Gantt Timeline"
                >
                  <span>Gantt</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Expanded Todo / Checkpoint List */}
              {isExpanded && pipe.todos && pipe.todos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 space-y-1.5 text-xs animate-in fade-in">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Execution Milestones ({pipe.todos.length})
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {pipe.todos.map((todo: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-1.5 rounded text-[11px] flex items-center justify-between gap-2 ${
                          todo.completed
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200"
                            : "bg-white dark:bg-[#1E1E1E] text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CheckCircle2
                            className={`w-3 h-3 shrink-0 ${
                              todo.completed ? "text-emerald-600" : "text-gray-400"
                            }`}
                          />
                          <span className={`truncate ${todo.completed ? "line-through opacity-70" : ""}`}>
                            {todo.text}
                          </span>
                        </div>
                        {todo.assigneeName && (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {todo.assigneeName}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
