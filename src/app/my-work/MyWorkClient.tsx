"use client";

import React, { useState, useTransition } from "react";
import { CheckSquare, Clock, DollarSign, Filter, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Card, Button, Badge, StatusBadge, EmptyState } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { updateTaskStatusAction } from "@/actions/task";
import { formatDate } from "@/utils/dateUtils";

interface MyWorkClientProps {
  initialTasks: any[];
  initialPipelines: any[];
  initialDeals: any[];
  users: any[];
}

export default function MyWorkClient({
  initialTasks,
  initialPipelines,
  initialDeals,
  users,
}: MyWorkClientProps) {
  const { success, error } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [tasks, setTasks] = useState(initialTasks);
  const [isPending, startTransition] = useTransition();

  // Filter tasks based on assignee
  const filteredTasks = tasks.filter((t) => {
    if (selectedUserId === "all") return true;
    const hasAssigneeId = t.assigneeIds?.some(
      (u: any) => (u._id || u) === selectedUserId
    );
    const hasLegacyName = users.find((u) => u._id === selectedUserId)?.name === t.assignee;
    return hasAssigneeId || hasLegacyName;
  });

  const selectedUser = users.find((u) => u._id === selectedUserId);

  const filteredPipelines = initialPipelines.filter((p) => {
    if (selectedUserId === "all") return true;
    const ownerIdStr = (p.ownerId?._id || p.ownerId)?.toString();
    const isOwnerIdMatch = ownerIdStr === selectedUserId;
    const isOwnerNameMatch =
      selectedUser && p.owner && p.owner.toLowerCase() === selectedUser.name.toLowerCase();
    const isMemberMatch =
      Array.isArray(p.memberIds) &&
      p.memberIds.some((m: any) => (m._id || m)?.toString() === selectedUserId);
    return isOwnerIdMatch || isOwnerNameMatch || isMemberMatch;
  });

  // Calculate live dynamic progress based on current tasks and pipeline checklists
  const pipelinesWithLiveProgress = filteredPipelines.map((p) => {
    const pIdStr = p._id?.toString() || "";
    const completedTodos = Array.isArray(p.todos)
      ? p.todos.filter((t: any) => t.completed).length
      : 0;
    const totalTodos = Array.isArray(p.todos) ? p.todos.length : 0;

    // Check live tasks state
    const linkedTasks = tasks.filter(
      (t: any) => t.pipelineId && (t.pipelineId._id || t.pipelineId)?.toString() === pIdStr
    );
    const completedLinkedTasks = linkedTasks.filter((t: any) =>
      ["done", "completed"].includes((t.status || "").toLowerCase())
    ).length;
    const totalLinkedTasks = linkedTasks.length;

    let dynamicProgress = Number(p.progress || 0);
    if (totalTodos > 0 && totalLinkedTasks > 0) {
      dynamicProgress = Math.round(
        ((completedTodos + completedLinkedTasks) / (totalTodos + totalLinkedTasks)) * 100
      );
    } else if (totalTodos > 0) {
      dynamicProgress = Math.round((completedTodos / totalTodos) * 100);
    } else if (totalLinkedTasks > 0) {
      dynamicProgress = Math.round((completedLinkedTasks / totalLinkedTasks) * 100);
    }

    return {
      ...p,
      dynamicProgress,
      totalTodos,
      completedTodos,
      totalLinkedTasks,
      completedLinkedTasks,
    };
  });

  const filteredDeals = initialDeals.filter((d) => {
    if (selectedUserId === "all") return true;
    return (d.ownerId?._id || d.ownerId) === selectedUserId;
  });

  const handleToggleTaskStatus = (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Done" ? "Todo" : "Done";

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: nextStatus } : t))
    );

    startTransition(async () => {
      const res = await updateTaskStatusAction({ taskId, status: nextStatus });
      if (res.ok) {
        success(`Task marked as ${nextStatus}`);
      } else {
        // Rollback
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? { ...t, status: currentStatus } : t))
        );
        error("Failed to update status", res.error.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E1DFDD] dark:border-[#3B3A39]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#242424] dark:text-white">
            My Work
          </h1>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
            Aggregated tasks, owned pipelines, and active deals across all projects
          </p>
        </div>

        {/* User filter selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#605E5C]" />
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
          >
            <option value="all">All Members ({users.length})</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.role || "Member"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Tasks Column (2 cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title={`Assigned Tasks (${filteredTasks.length})`}
            subtitle="Click checkbox to mark completed"
          >
            {filteredTasks.length === 0 ? (
              <EmptyState
                title="No tasks assigned"
                description="There are no tasks matching the selected member filter."
              />
            ) : (
              <div className="divide-y divide-[#F3F2F1] dark:divide-[#292827]">
                {filteredTasks.map((task) => {
                  const isDone = task.status === "Done";
                  return (
                    <div
                      key={task._id}
                      className="py-3 flex items-start gap-3 hover:bg-[#FAF9F8] dark:hover:bg-[#292827] px-2 rounded-[4px] transition-colors"
                    >
                      <button
                        onClick={() => handleToggleTaskStatus(task._id, task.status)}
                        disabled={isPending}
                        className="mt-0.5 text-[#0078D4] hover:text-[#106EBE] disabled:opacity-50"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-[#107C10]" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#A19F9D]" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              isDone
                                ? "line-through text-[#A19F9D] dark:text-[#797775]"
                                : "text-[#242424] dark:text-white"
                            }`}
                          >
                            {task.name}
                          </span>
                          <StatusBadge status={task.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
                          {task.projectId?.name && (
                            <span className="font-semibold text-[#0078D4] dark:text-[#479EF5]">
                              {task.projectId.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span suppressHydrationWarning>Due {formatDate(task.dueDate)}</span>
                          )}
                          {task.estimatedHours > 0 && (
                            <span>{task.estimatedHours}h est</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* 2. Pipelines & Deals Column */}
        <div className="space-y-6">
          <Card
            title={`Owned Pipelines (${pipelinesWithLiveProgress.length})`}
            seeAllHref="/dev/timeline"
          >
            {pipelinesWithLiveProgress.length === 0 ? (
              <EmptyState
                title="No pipelines owned"
                description="No development pipelines owned by this member."
              />
            ) : (
              <div className="divide-y divide-[#F3F2F1] dark:divide-[#292827]">
                {pipelinesWithLiveProgress.map((p) => {
                  const ownerDisplayName =
                    p.ownerId?.name ||
                    (p.owner && p.owner !== "Unassigned" ? p.owner : null) ||
                    "Organization Member";

                  return (
                    <div key={p._id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#242424] dark:text-white truncate">
                          {p.name}
                        </span>
                        <StatusBadge status={p.status} />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#605E5C] dark:text-[#C8C6C4] mt-1.5">
                        <span className="capitalize">{p.category}</span>
                        <span className="font-semibold text-[#242424] dark:text-white">
                          {p.dynamicProgress}% progress
                        </span>
                      </div>

                      <div className="w-full bg-[#EDEBE9] dark:bg-[#3B3A39] h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full transition-all duration-300 ${
                            p.dynamicProgress >= 70
                              ? "bg-[#107C10]"
                              : p.dynamicProgress > 0
                              ? "bg-[#0078D4]"
                              : "bg-transparent"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(0, p.dynamicProgress))}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#8A8886] mt-1">
                        <span>Owner: {ownerDisplayName}</span>
                        {p.totalTodos > 0 ? (
                          <span>
                            {p.completedTodos}/{p.totalTodos} checklist
                          </span>
                        ) : p.totalLinkedTasks > 0 ? (
                          <span>
                            {p.completedLinkedTasks}/{p.totalLinkedTasks} tasks
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card
            title={`Owned Deals (${filteredDeals.length})`}
            seeAllHref="/sales/dashboard"
          >
            {filteredDeals.length === 0 ? (
              <EmptyState
                title="No deals owned"
                description="No active sales deals owned by this member."
              />
            ) : (
              <div className="divide-y divide-[#F3F2F1] dark:divide-[#292827]">
                {filteredDeals.map((d) => (
                  <div key={d._id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#242424] dark:text-white truncate">
                        {d.name}
                      </span>
                      <span className="text-xs font-bold text-[#107C10]" suppressHydrationWarning>
                        ${Number(d.amount || d.revenue || 0).toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#605E5C] dark:text-[#C8C6C4] mt-1">
                      <span>{d.stage}</span>
                      <Badge tone={d.status === "Won" ? "success" : "neutral"}>
                        {d.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
