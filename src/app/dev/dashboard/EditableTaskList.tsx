"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateTaskNode,
  addTaskSubtask,
  updateTaskSubtaskProgress,
  updateTaskSubtaskStage,
  deleteTaskSubtask,
} from "@/actions";

interface DirectoryMember {
  id: string;
  name: string;
  role: string;
  email: string;
  teamNames: string[];
}

interface DirectoryTeam {
  _id: string;
  name: string;
  memberIds: string[];
}

const SUBTASK_STATUSES = ["Open", "In Progress", "Completed"] as const;
const TASK_STATUSES = ["Todo", "In Progress", "Code Review", "Blocked", "Done", "Archived"] as const;

function clampPct(v: any): number {
  const n = Math.round(Number(v) || 0);
  return Math.max(0, Math.min(100, n));
}

function autoStatus(p: number) {
  if (p >= 100) return "Completed";
  if (p <= 0) return "Open";
  return "In Progress";
}

function statusTone(status?: string) {
  const s = (status || "Todo").toLowerCase();
  if (s === "done" || s === "completed") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  if (s.includes("progress")) return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  if (s.includes("review")) return "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800";
  if (s.includes("block")) return "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800";
  if (s.includes("archiv")) return "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-700";
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
}

function subtaskTone(status?: string) {
  const s = (status || "Open").toLowerCase();
  if (s === "completed") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300";
  if (s.includes("progress") || s.includes("review")) return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300";
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
}

/** Small ascii-style bar: [====---- 59%] rendered as a div bar + pct label. */
function MiniBar({ value, tone = "from-indigo-500 to-blue-500" }: { value: number; tone?: string }) {
  const v = clampPct(value);
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className="inline-block h-2 w-20 sm:w-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden align-middle">
        <span
          className={`block h-full rounded-full bg-gradient-to-r ${tone} transition-all`}
          style={{ width: `${v}%` }}
        />
      </span>
      <span className="text-[11px] font-extrabold tabular-nums text-gray-700 dark:text-gray-200">{v}%</span>
    </span>
  );
}

function BranchCard({
  sub,
  globalIdx,
  busy,
  isGuest,
  dragActive,
  onSlide,
  onStatus,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  sub: any;
  globalIdx: number;
  busy: boolean;
  isGuest: boolean;
  dragActive: boolean;
  onSlide: (idx: number, v: number) => void;
  onStatus: (idx: number, s: string) => void;
  onDelete: (idx: number) => void;
  onDragStart: (idx: number) => void;
  onDragEnd: () => void;
}) {
  const barVal = clampPct(sub?.progress);
  const st = autoStatus(barVal);
  const assignees: any[] = Array.isArray(sub?.assignees) ? sub.assignees : [];
  const assigneeLabel = assignees.length > 0 ? assignees.map((a) => a.name).join(" ") : "Unassigned";

  return (
    <div
      draggable={!isGuest && !busy}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(globalIdx));
        e.dataTransfer.effectAllowed = "move";
        onDragStart(globalIdx);
      }}
      onDragEnd={onDragEnd}
      className={`rounded-lg border bg-white dark:bg-gray-800 p-2.5 shadow-sm transition-all ${
        dragActive
          ? "border-indigo-500 ring-2 ring-indigo-300 opacity-70"
          : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:shadow"
      } ${busy ? "opacity-70" : ""}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="text-gray-400 cursor-grab active:cursor-grabbing select-none shrink-0 px-0.5"
          title="Drag to move into another stage lane"
        >
          [::]
        </span>
        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex-1 min-w-0 truncate" title={sub?.title}>
          {sub?.title || "Untitled branch"}
        </span>
        {!isGuest && (
          <button
            type="button"
            onClick={() => onDelete(globalIdx)}
            disabled={busy}
            className="px-1 text-gray-400 hover:text-red-500 text-xs font-bold cursor-pointer shrink-0 disabled:opacity-40"
            title="Delete branch"
          >
            [x]
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-gray-600 dark:text-gray-300">
        <span className="font-semibold shrink-0">Prog:</span>
        <span className="flex-1 min-w-0">
          <MiniBar value={barVal} />
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={barVal}
        disabled={isGuest || busy}
        onChange={(e) => onSlide(globalIdx, Number(e.target.value))}
        title="Drag slider to set branch completion — saves automatically"
        className="w-full h-2 mt-1 accent-indigo-600 cursor-pointer disabled:cursor-not-allowed"
      />

      <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300 truncate" title={assigneeLabel}>
        <span className="font-semibold">Assignee:</span> {assigneeLabel}
      </div>

      <div className="mt-1 flex items-center gap-1.5 text-[11px]">
        <span className="font-semibold text-gray-600 dark:text-gray-300 shrink-0">Status:</span>
        {isGuest ? (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${subtaskTone(st)}`}>{st}</span>
        ) : (
          <select
            value={st}
            disabled={busy}
            onChange={(e) => onStatus(globalIdx, e.target.value)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer outline-none ${subtaskTone(st)}`}
          >
            {SUBTASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

/**
 * One collapsible tree node:
 *   Project/Task header -> Pipeline line -> Stage lanes -> Branch grid (3 cols)
 * Hierarchy: Project -> Pipeline (P) -> Task T (projects_pipelines_task)
 *   -> Branch (projects_pipelines_task_subtasks, grouped by `stage`).
 */
function TaskTreeNode({
  task,
  pipelines,
  allTasks,
  teams,
  members,
  isGuest,
  expanded,
  onToggle,
}: {
  task: any;
  pipelines: any[];
  allTasks: any[];
  teams: DirectoryTeam[];
  members: DirectoryMember[];
  isGuest: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [localSubs, setLocalSubs] = useState<any[]>(Array.isArray(task.subtasks) ? task.subtasks : []);
  const pendingRef = useRef(0);
  const committedRef = useRef<Record<number, number>>({});
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<string>("Open");
  const [newAssignees, setNewAssignees] = useState<string[]>([]);
  const [newStage, setNewStage] = useState<string>("");
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropLane, setDropLane] = useState<string | null>(null);
  const [pipeSaving, setPipeSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const serverKey = JSON.stringify(Array.isArray(task.subtasks) ? task.subtasks : []);
  useEffect(() => {
    if (pendingRef.current === 0) {
      try {
        const parsed = JSON.parse(serverKey);
        setLocalSubs(parsed);
        const committed: Record<number, number> = {};
        parsed.forEach((s: any, i: number) => {
          committed[i] = clampPct(s?.progress);
        });
        committedRef.current = committed;
      } catch {
        setLocalSubs([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  useEffect(() => {
    return () => {
      if (commitTimer.current) clearTimeout(commitTimer.current);
    };
  }, []);

  const pipeline = pipelines.find((p) => p._id === (task.pipelineId || "none")) || null;
  const pipelineName = pipeline ? pipeline.name : "No Pipeline";

  // Stages = pipeline checklist lanes + any extra branch stages, in order.
  const stageDefs: string[] = useMemo(() => {
    const pipeStages: string[] =
      pipeline && Array.isArray((pipeline as any).todos)
        ? [...new Set<string>((pipeline as any).todos.map((t: any) => String(t.text || "").trim()).filter(Boolean))]
        : [];
    const extra = [...new Set(localSubs.map((s) => String(s?.stage || "")))].filter((s) => !pipeStages.includes(s));
    const all = [...pipeStages, ...extra];
    if (all.length === 0) return [""];
    return all;
  }, [pipeline, localSubs]);

  // Group branches by stage, keeping the GLOBAL subtask index for server actions.
  const grouped = useMemo(() => {
    return stageDefs.map((stage) => {
      const items: Array<{ sub: any; globalIdx: number }> = [];
      localSubs.forEach((s, gi) => {
        if (String(s?.stage || "") === stage) items.push({ sub: s, globalIdx: gi });
      });
      const prog = items.length > 0 ? Math.round(items.reduce((a, x) => a + clampPct(x.sub?.progress), 0) / items.length) : 0;
      return { stage, items, prog };
    });
  }, [stageDefs, localSubs]);

  const taskTotal = localSubs.length > 0
    ? Math.round(localSubs.reduce((a, s) => a + clampPct(s?.progress), 0) / localSubs.length)
    : clampPct(task.progress);

  // Pipeline-wide rollup across every task linked to the same pipeline.
  const pipelineStats = useMemo(() => {
    if (!task.pipelineId || task.pipelineId === "none") return { progress: taskTotal, branches: localSubs.length };
    const linked = allTasks.filter((t) => String(t.pipelineId || "") === String(task.pipelineId));
    let sum = 0;
    let n = 0;
    linked.forEach((t) => {
      const subs = t._id === task._id ? localSubs : Array.isArray(t.subtasks) ? t.subtasks : [];
      subs.forEach((s: any) => {
        sum += clampPct(s?.progress);
        n += 1;
      });
    });
    if (n === 0) {
      const fallback = pipeline && typeof (pipeline as any).progress === "number" ? Number((pipeline as any).progress) : 0;
      return { progress: clampPct(fallback), branches: 0 };
    }
    return { progress: Math.round(sum / n), branches: n };
  }, [allTasks, task._id, task.pipelineId, localSubs, pipeline, taskTotal]);

  const membersByTeam: { team: string; members: DirectoryMember[] }[] = useMemo(() => {
    const groups: { team: string; members: DirectoryMember[] }[] = [];
    const seen = new Set<string>();
    for (const t of teams) {
      const list = members.filter((m) => t.memberIds.includes(m.id));
      if (list.length > 0) {
        groups.push({ team: t.name, members: list });
        list.forEach((m) => seen.add(m.id));
      }
    }
    const unteamed = members.filter((m) => !seen.has(m.id));
    if (unteamed.length > 0) groups.push({ team: "Unassigned", members: unteamed });
    return groups;
  }, [teams, members]);

  const teamOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teams) for (const mid of t.memberIds) if (!map.has(mid)) map.set(mid, t.name);
    return map;
  }, [teams]);

  const toggleNewAssignee = (id: string) =>
    setNewAssignees((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const focusCreator = (stage: string) => {
    if (!expanded) onToggle();
    setNewStage(stage);
    setTimeout(() => titleRef.current?.focus(), 60);
  };

  const commitBar = async (idx: number, value: number) => {
    if (isGuest) return;
    const v = clampPct(value);
    pendingRef.current += 1;
    setBusyIdx(idx);
    try {
      await updateTaskSubtaskProgress(task._id, idx, v);
      committedRef.current[idx] = v;
      router.refresh();
    } catch (err: any) {
      const back = committedRef.current[idx] ?? 0;
      setLocalSubs((list) => list.map((s, i) => (i === idx ? { ...s, progress: back, status: autoStatus(back) } : s)));
      alert(err?.message || "Could not save the branch slider. Please try again.");
    } finally {
      pendingRef.current = Math.max(0, pendingRef.current - 1);
      setBusyIdx(null);
    }
  };

  const scheduleCommit = (idx: number, value: number) => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => commitBar(idx, value), 700);
  };

  const slideBar = (idx: number, value: number) => {
    if (isGuest || busyIdx !== null) return;
    const v = clampPct(value);
    setLocalSubs((list) => list.map((s, i) => (i === idx ? { ...s, progress: v, status: autoStatus(v) } : s)));
    scheduleCommit(idx, v);
  };

  const setStatusManual = async (idx: number, status: string) => {
    if (isGuest || busyIdx !== null) return;
    const cur = clampPct(localSubs[idx]?.progress);
    const target = status === "Completed" ? 100 : status === "Open" ? 0 : cur === 0 ? 50 : cur;
    if (commitTimer.current) clearTimeout(commitTimer.current);
    setLocalSubs((list) => list.map((s, i) => (i === idx ? { ...s, progress: target, status } : s)));
    await commitBar(idx, target);
  };

  const moveBranch = async (idx: number, stage: string) => {
    if (isGuest || busyIdx !== null) return;
    const prevStage = String(localSubs[idx]?.stage || "");
    if (prevStage === stage) return;
    pendingRef.current += 1;
    setBusyIdx(idx);
    setLocalSubs((list) => list.map((s, i) => (i === idx ? { ...s, stage } : s)));
    try {
      await updateTaskSubtaskStage(task._id, idx, stage);
      router.refresh();
    } catch (err: any) {
      setLocalSubs((list) => list.map((s, i) => (i === idx ? { ...s, stage: prevStage } : s)));
      alert(err?.message || "Could not move the branch. Please try again.");
    } finally {
      pendingRef.current = Math.max(0, pendingRef.current - 1);
      setBusyIdx(null);
    }
  };

  const handleDelete = async (idx: number) => {
    if (isGuest || busyIdx !== null) return;
    if (!window.confirm("Delete this branch subsection?")) return;
    const removed = localSubs[idx];
    pendingRef.current += 1;
    setLocalSubs((list) => list.filter((_, i) => i !== idx));
    try {
      await deleteTaskSubtask(task._id, idx);
      router.refresh();
    } catch (err: any) {
      setLocalSubs((list) => {
        const copy = [...list];
        copy.splice(idx, 0, removed);
        return copy;
      });
      alert(err?.message || "Could not delete the branch. Please try again.");
    } finally {
      pendingRef.current = Math.max(0, pendingRef.current - 1);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isGuest) return;
    const startProgress = newStatus === "Completed" ? 100 : 0;
    const optimistic = {
      title: newTitle.trim(),
      status: autoStatus(startProgress),
      progress: startProgress,
      stage: newStage,
      assignees: newAssignees
        .map((id) => {
          const m = members.find((x) => x.id === id);
          return m ? { userId: m.id, name: m.name, teamName: teamOf.get(m.id) || m.teamNames[0] || "" } : null;
        })
        .filter(Boolean),
    };
    pendingRef.current += 1;
    setLocalSubs((prev) => [...prev, optimistic]);
    setNewTitle("");
    setNewAssignees([]);
    setNewStatus("Open");
    const fd = new FormData();
    fd.set("taskId", task._id);
    fd.set("title", optimistic.title);
    fd.set("status", optimistic.status);
    fd.set("progress", String(startProgress));
    fd.set("stage", newStage);
    fd.set("assigneeIds", JSON.stringify(newAssignees));
    try {
      await addTaskSubtask(fd);
      router.refresh();
    } catch (err: any) {
      setLocalSubs((prev) => prev.filter((s) => s !== optimistic));
      alert(err?.message || "Could not save the branch. Please try again.");
    } finally {
      pendingRef.current = Math.max(0, pendingRef.current - 1);
    }
  };

  const persistPipeline = async (pid: string, sref: string) => {
    if (isGuest) return;
    setPipeSaving(true);
    const fd = new FormData();
    fd.set("taskId", task._id);
    fd.set("pipelineId", pid);
    fd.set("stageRef", sref);
    try {
      await updateTaskNode(fd);
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "Could not link pipeline. Please try again.");
    } finally {
      setPipeSaving(false);
    }
  };

  const stageOpts: string[] =
    pipeline && Array.isArray((pipeline as any).todos)
      ? [...new Set<string>((pipeline as any).todos.map((t: any) => String(t.text || "").trim()).filter(Boolean))]
      : [];

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      {/* ── Task header row ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/80 text-[12px]">
        <button
          type="button"
          onClick={onToggle}
          title={expanded ? "Collapse branches" : "Expand branches"}
          className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-bold cursor-pointer shrink-0"
        >
          {expanded ? "v" : ">"}
        </button>

        <span className="font-extrabold tracking-tight text-gray-900 dark:text-gray-100 whitespace-nowrap">
          TASK/PROJECT:
        </span>
        <form action={updateTaskNode} className="m-0 min-w-[160px] flex-1 basis-40">
          <input type="hidden" name="taskId" value={task._id} />
          <input
            type="text"
            name="name"
            disabled={isGuest}
            defaultValue={task.name}
            title={task.name}
            onBlur={(e) => {
              if (!isGuest && e.target.value !== task.name) e.target.form?.requestSubmit();
            }}
            className="w-full px-2 py-1 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 bg-transparent text-[13px] font-bold text-gray-900 dark:text-gray-100"
          />
        </form>

        <span className="font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">STATUS:</span>
        <form action={updateTaskNode} className="m-0">
          <input type="hidden" name="taskId" value={task._id} />
          <select
            name="status"
            disabled={isGuest}
            defaultValue={task.status || "Todo"}
            onChange={(e) => !isGuest && e.target.form?.requestSubmit()}
            className={`px-2 py-1 rounded border text-[11px] font-bold cursor-pointer outline-none ${statusTone(task.status)}`}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </form>

        <span className="font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">EST:</span>
        <form action={updateTaskNode} className="m-0">
          <input type="hidden" name="taskId" value={task._id} />
          <input
            type="number"
            name="estimatedHours"
            disabled={isGuest}
            defaultValue={task.estimatedHours || ""}
            placeholder="0"
            onBlur={(e) => {
              if (!isGuest && Number(e.target.value) !== (task.estimatedHours || 0)) e.target.form?.requestSubmit();
            }}
            className="w-14 px-1.5 py-1 rounded border border-transparent hover:border-gray-300 focus:border-blue-500 bg-transparent text-[12px] tabular-nums text-right text-gray-900 dark:text-gray-100"
          />
        </form>

        <span className="font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">ACTUAL:</span>
        <form action={updateTaskNode} className="m-0">
          <input type="hidden" name="taskId" value={task._id} />
          <input
            type="number"
            name="actualHours"
            disabled={isGuest}
            defaultValue={task.actualHours || ""}
            placeholder="0"
            onBlur={(e) => {
              if (!isGuest && Number(e.target.value) !== (task.actualHours || 0)) e.target.form?.requestSubmit();
            }}
            className="w-14 px-1.5 py-1 rounded border border-transparent hover:border-gray-300 focus:border-blue-500 bg-transparent text-[12px] tabular-nums text-right text-gray-900 dark:text-gray-100"
          />
        </form>

        <span className="font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">PIPELINE:</span>
        <select
          value={task.pipelineId || "none"}
          disabled={isGuest || pipeSaving}
          onChange={(e) => persistPipeline(e.target.value, e.target.value === "none" ? "" : task.stageRef || "")}
          className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-[11px] font-semibold cursor-pointer max-w-[160px]"
          title="Link this task to a pipeline"
        >
          <option value="none">No Pipeline</option>
          {pipelines.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        <span className="font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">TOTAL:</span>
        <MiniBar value={taskTotal} />
        <span className="text-[10px] text-gray-400 tabular-nums hidden xl:inline">
          {localSubs.length > 0 ? `avg of ${localSubs.length}` : "no branches"}
        </span>

        {!isGuest && (
          <button
            type="button"
            onClick={() => focusCreator(newStage || stageDefs[0] || "")}
            className="ml-auto px-2.5 py-1 rounded border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold hover:border-indigo-500 cursor-pointer whitespace-nowrap"
            title="Add a branch sub-division to this task"
          >
            [+ Branch]
          </button>
        )}
      </div>

      {/* ── Expanded tree ───────────────────────────────────────────── */}
      {expanded && (
        <div className="px-3 py-2 text-[12px]">
          <div className="flex items-start gap-2">
            <span className="text-gray-400 font-mono select-none">|</span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1">
                <span className="text-gray-400 font-mono select-none">+--&gt;</span>
                <span className="font-extrabold text-gray-900 dark:text-gray-100">
                  PIPELINE: <span className="font-semibold">{pipelineName}</span>
                </span>
                <span className="ml-auto flex items-center gap-2 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                  PIPELINE PROGRESS: <MiniBar value={pipelineStats.progress} /> ({pipelineStats.branches} Branches)
                </span>
              </div>

              {/* Task-level structural stage (kept compact so no data is lost) */}
              {stageOpts.length > 0 && (
                <div className="flex items-center gap-2 ml-6 mb-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="font-mono text-gray-400">|</span>
                  <label className="font-semibold">Task stage:</label>
                  <select
                    value={task.stageRef || ""}
                    disabled={isGuest || pipeSaving}
                    onChange={(e) => persistPipeline(task.pipelineId || "none", e.target.value)}
                    className="px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 text-[11px] cursor-pointer"
                  >
                    <option value="">General (whole pipeline)</option>
                    {stageOpts.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {grouped.map((lane, li) => (
                <div key={`${lane.stage}::${li}`} className="flex items-start gap-2 mt-1">
                  <span className="text-gray-400 font-mono select-none">|</span>
                  <div className="flex-1 min-w-0 rounded border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 p-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-gray-400 font-mono select-none">+--</span>
                      <span className="font-extrabold text-gray-900 dark:text-gray-100">
                        STAGE {li + 1}: {lane.stage || "General"} ({lane.items.length})
                      </span>
                      <span className="hidden sm:inline flex-1 border-t border-dashed border-gray-300 dark:border-gray-600 min-w-[40px]" />
                      <span className="flex items-center gap-2 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                        STAGE PROGRESS: <MiniBar value={lane.prog} />
                      </span>
                    </div>

                    <div className="ml-4 mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Grid of 3:
                    </div>
                    <div
                      className={`ml-4 mt-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 rounded-md p-1 transition-colors ${
                        dropLane === lane.stage ? "bg-indigo-50 dark:bg-indigo-950/30 outline outline-2 outline-indigo-400" : ""
                      }`}
                      onDragOver={(e) => {
                        if (dragIdx === null) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setDropLane(lane.stage);
                      }}
                      onDragLeave={() => setDropLane((d) => (d === lane.stage ? null : d))}
                      onDrop={(e) => {
                        e.preventDefault();
                        const raw = e.dataTransfer.getData("text/plain");
                        const idx = raw !== "" ? Number(raw) : dragIdx;
                        setDropLane(null);
                        setDragIdx(null);
                        if (idx !== null && !Number.isNaN(idx)) moveBranch(idx, lane.stage);
                      }}
                    >
                      {lane.items.map(({ sub, globalIdx }) => (
                        <BranchCard
                          key={`${task._id}:${globalIdx}`}
                          sub={sub}
                          globalIdx={globalIdx}
                          busy={busyIdx === globalIdx}
                          isGuest={isGuest}
                          dragActive={dragIdx === globalIdx}
                          onSlide={slideBar}
                          onStatus={setStatusManual}
                          onDelete={handleDelete}
                          onDragStart={setDragIdx}
                          onDragEnd={() => {
                            setDragIdx(null);
                            setDropLane(null);
                          }}
                        />
                      ))}

                      {/* Drop / Add card — matches the wireframe placeholder */}
                      {!isGuest && (
                        <button
                          type="button"
                          onClick={() => focusCreator(lane.stage)}
                          onDragOver={(e) => {
                            if (dragIdx === null) return;
                            e.preventDefault();
                            setDropLane(lane.stage);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const raw = e.dataTransfer.getData("text/plain");
                            const idx = raw !== "" ? Number(raw) : dragIdx;
                            setDropLane(null);
                            setDragIdx(null);
                            if (idx !== null && !Number.isNaN(idx)) moveBranch(idx, lane.stage);
                            else focusCreator(lane.stage);
                          }}
                          className={`rounded-lg border border-dashed p-2.5 min-h-[118px] flex items-center justify-center text-center text-[11px] font-bold cursor-pointer transition-colors ${
                            dropLane === lane.stage
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                              : "border-gray-300 dark:border-gray-600 text-gray-400 hover:border-indigo-400 hover:text-indigo-600"
                          }`}
                          title={`Drop a branch here to move it into "${lane.stage || "General"}" — or click to add one`}
                        >
                          [+ Drop / Add Sub-branch]
                        </button>
                      )}
                    </div>

                    {lane.items.length === 0 && (
                      <div
                        className="ml-4 mt-2 rounded border border-dashed border-gray-300 dark:border-gray-600 px-3 py-2 text-[11px] italic text-gray-400"
                        onDragOver={(e) => {
                          if (dragIdx === null) return;
                          e.preventDefault();
                          setDropLane(lane.stage);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const raw = e.dataTransfer.getData("text/plain");
                          const idx = raw !== "" ? Number(raw) : dragIdx;
                          setDropLane(null);
                          setDragIdx(null);
                          if (idx !== null && !Number.isNaN(idx)) moveBranch(idx, lane.stage);
                        }}
                      >
                        [ Drop sub-branches here to update stage &amp; pipeline progress... ]
                      </div>
                    )}

                    {!isGuest && (
                      <div className="ml-4 mt-2">
                        <button
                          type="button"
                          onClick={() => focusCreator(lane.stage)}
                          className="px-2.5 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 cursor-pointer"
                        >
                          [+ New Sub-Branch]
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Creator */}
              {!isGuest && (
                <form
                  onSubmit={handleAdd}
                  className="mt-2 ml-6 rounded border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      ref={titleRef}
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="New branch, e.g. wireframe-01 → hero section"
                      className="flex-1 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
                    />
                    <select
                      value={newStage}
                      onChange={(e) => setNewStage(e.target.value)}
                      className="px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs cursor-pointer max-w-[220px]"
                      title="Stage lane this branch belongs to"
                    >
                      {stageDefs.map((s) => (
                        <option key={s || "__general__"} value={s}>
                          {s || "General"}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs cursor-pointer"
                    >
                      {SUBTASK_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={!newTitle.trim()}
                      className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                    >
                      + Branch
                    </button>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                    {membersByTeam.map((g) => (
                      <div key={g.team}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{g.team}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {g.members.map((m) => {
                            const on = newAssignees.includes(m.id);
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => toggleNewAssignee(m.id)}
                                title={`${m.name} (${m.role})`}
                                className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                                  on
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500"
                                }`}
                              >
                                {m.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditableTaskList({
  tasks,
  pipelines = [],
  cycles = [],
  teams = [],
  members = [],
  isGuest = false,
}: {
  tasks: any[];
  pipelines?: any[];
  cycles?: any[];
  teams?: DirectoryTeam[];
  members?: DirectoryMember[];
  isGuest?: boolean;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // `cycles` is kept in the signature for callers, but the tree design
  // surfaces pipeline/stage instead of a separate sprint column.
  void cycles;

  if (!tasks || tasks.length === 0) return null;

  const totalBranches = tasks.reduce((n, t) => n + (Array.isArray(t.subtasks) ? t.subtasks.length : 0), 0);
  const linkedCount = tasks.filter((t) => t.pipelineId && t.pipelineId !== "none").length;

  const expandAll = tasks.every((t) => open[t._id]);

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 px-5 pt-4 pb-3">
        <h3 className="text-base font-extrabold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            ✓
          </span>
          Active Production Tasks &amp; Deliverables
        </h3>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] font-bold">
          <span className="px-2 py-0.5 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900">
            {tasks.length} tasks
          </span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            ⎇ {totalBranches} branches
          </span>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            {linkedCount} linked
          </span>
          <button
            type="button"
            onClick={() => {
              if (expandAll) setOpen({});
              else setOpen(Object.fromEntries(tasks.map((t) => [t._id, true])));
            }}
            className="px-2 py-0.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 cursor-pointer"
          >
            {expandAll ? "Collapse all" : "Expand all"}
          </button>
        </div>
      </div>

      <div className="space-y-2.5 px-4 pb-4 max-h-[720px] overflow-y-auto">
        {tasks.map((task) => (
          <TaskTreeNode
            key={task._id}
            task={task}
            pipelines={pipelines}
            allTasks={tasks}
            teams={teams}
            members={members}
            isGuest={isGuest}
            expanded={!!open[task._id]}
            onToggle={() => setOpen((prev) => ({ ...prev, [task._id]: !prev[task._id] }))}
          />
        ))}
      </div>
    </div>
  );
}
