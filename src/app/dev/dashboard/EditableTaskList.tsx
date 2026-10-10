"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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

function statusTone(status?: string) {
  const s = (status || "Todo").toLowerCase();
  if (s === "done") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  if (s.includes("progress")) return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  if (s.includes("review")) return "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800";
  if (s.includes("block")) return "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800";
  if (s.includes("archiv")) return "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-700";
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
}

function severityTone(severity?: string) {
  const s = (severity || "medium").toLowerCase();
  if (s === "critical") return "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800";
  if (s === "high") return "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800";
  if (s === "low") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  return "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800";
}

function subtaskTone(status?: string) {
  const s = (status || "Open").toLowerCase();
  if (s === "completed") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300";
  if (s.includes("progress")) return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300";
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
}

/** Pipeline + structural stage picker with sticky local state.
 *  Shows the picked value instantly, persists in the background, and rolls
 *  back with an error if the save fails — never silently "auto-removes". */
function TaskPipelineCell({
  task,
  pipelines,
  isGuest = false,
}: {
  task: any;
  pipelines: any[];
  isGuest?: boolean;
}) {
  const initialPid = task.pipelineId || "none";
  const [pipelineId, setPipelineId] = useState<string>(initialPid);
  const [stageRef, setStageRef] = useState<string>(task.stageRef || "");
  const [saving, setSaving] = useState(false);

  // Re-sync when fresh server data arrives for this task.
  useEffect(() => {
    setPipelineId(task.pipelineId || "none");
    setStageRef(task.stageRef || "");
  }, [task._id, task.pipelineId, task.stageRef]);

  const pipe = pipelines.find((p) => p._id === pipelineId);
  const stageOpts: string[] = pipe && Array.isArray((pipe as any).todos)
    ? [...new Set<string>((pipe as any).todos.map((t: any) => String(t.text || "").trim()).filter(Boolean))]
    : [];

  const persist = async (pid: string, sref: string) => {
    if (isGuest) return;
    setSaving(true);
    const fd = new FormData();
    fd.set("taskId", task._id);
    fd.set("pipelineId", pid);
    fd.set("stageRef", sref);
    try {
      await updateTaskNode(fd);
    } catch (err: any) {
      // Roll back to the last server-known values so the UI never lies.
      setPipelineId(task.pipelineId || "none");
      setStageRef(task.stageRef || "");
      alert(err?.message || "Could not link pipeline. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1">
      <select
        value={pipelineId}
        disabled={isGuest || saving}
        className={`w-full p-2 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 bg-transparent text-sm text-gray-900 dark:text-gray-100 ${isGuest ? "cursor-default" : "cursor-pointer"}`}
        onChange={(e) => {
          const v = e.target.value;
          setPipelineId(v);
          // The old stage belongs to the old pipeline — reset it.
          const nextStage = v === "none" ? "" : stageRef;
          if (v === "none") setStageRef("");
          persist(v, v === "none" ? "" : nextStage);
        }}
      >
        <option value="none">No Pipeline</option>
        {pipelines.map((p) => (
          <option key={p._id} value={p._id}>{p.name}</option>
        ))}
      </select>
      {pipelineId !== "none" && stageOpts.length > 0 && (
        <select
          value={stageRef}
          disabled={isGuest || saving}
          title="Structural stage inside the pipeline"
          className={`w-full p-1.5 rounded border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 hover:border-indigo-400 focus:border-blue-500 text-xs text-gray-900 dark:text-gray-100 ${isGuest ? "cursor-default" : "cursor-pointer"}`}
          onChange={(e) => {
            setStageRef(e.target.value);
            persist(pipelineId, e.target.value);
          }}
        >
          <option value="">General (whole pipeline)</option>
          {stageOpts.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
    </div>
  );
}
function TaskBranchManager({
  task,
  members,
  teams,
  stages = [],
  isGuest = false,
}: {
  task: any;
  members: DirectoryMember[];
  teams: DirectoryTeam[];
  stages?: string[];
  isGuest?: boolean;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<string>("Open");
  const [newAssignees, setNewAssignees] = useState<string[]>([]);
  const [newStage, setNewStage] = useState<string>("");
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropLane, setDropLane] = useState<string | null>(null);
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);

  // Local branch list: paints instantly on every action, then reconciles
  // with server truth (and refreshes the page data) in the background.
  const [localSubs, setLocalSubs] = useState<any[]>(
    Array.isArray(task.subtasks) ? task.subtasks : []
  );
  const pendingRef = useRef(0);
  // Last persisted bar positions — deltas (+40%) are measured against these.
  const committedRef = useRef<Record<number, number>>({});
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverKey = JSON.stringify(Array.isArray(task.subtasks) ? task.subtasks : []);
  useEffect(() => {
    if (pendingRef.current === 0) {
      try {
        const parsed = JSON.parse(serverKey);
        setLocalSubs(parsed);
        const committed: Record<number, number> = {};
        parsed.forEach((s: any, i: number) => {
          committed[i] = Math.max(0, Math.min(100, Number(s?.progress || 0)));
        });
        committedRef.current = committed;
      } catch {
        setLocalSubs([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  const subtasks = localSubs;
  const doneCount = subtasks.filter((s) => String(s.status).toLowerCase() === "completed").length;

  const toggleNewAssignee = (id: string) =>
    setNewAssignees((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const membersByTeam: { team: string; members: DirectoryMember[] }[] = [];
  {
    const seen = new Set<string>();
    for (const t of teams) {
      const list = members.filter((m) => t.memberIds.includes(m.id));
      if (list.length > 0) {
        membersByTeam.push({ team: t.name, members: list });
        list.forEach((m) => seen.add(m.id));
      }
    }
    const unteamed = members.filter((m) => !seen.has(m.id));
    if (unteamed.length > 0) membersByTeam.push({ team: "Unassigned", members: unteamed });
  }

  const teamOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teams) {
      for (const mid of t.memberIds) {
        if (!map.has(mid)) map.set(mid, t.name);
      }
    }
    return map;
  }, [teams]);

  const resolveAssignees = (ids: string[]) =>
    ids
      .map((id) => {
        const m = members.find((x) => x.id === id);
        return m ? { userId: m.id, name: m.name, teamName: teamOf.get(m.id) || m.teamNames[0] || "" } : null;
      })
      .filter(Boolean);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isGuest) return;
    const optimistic = {
      title: newTitle.trim(),
      status: newStatus,
      progress: newStatus === "Completed" ? 100 : 0,
      stage: newStage,
      assignees: resolveAssignees(newAssignees),
    };
    // 1. show it immediately
    pendingRef.current += 1;
    setLocalSubs((prev) => [...prev, optimistic]);
    setNewTitle("");
    setNewAssignees([]);
    setNewStatus("Open");
    // 2. persist + pull server truth quietly
    const fd = new FormData();
    fd.set("taskId", task._id);
    fd.set("title", optimistic.title);
    fd.set("status", optimistic.status);
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

  /** Explicit Save button per branch: commits the current bar right now. */
  const saveBranch = async (idx: number) => {
    if (isGuest || busyIdx !== null) return;
    if (commitTimer.current) clearTimeout(commitTimer.current);
    const v = Math.max(0, Math.min(100, Number(localSubs[idx]?.progress || 0)));
    await commitBar(idx, v);
  };

  /** Move a branch card into another stage lane (drag-drop). */
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

  const autoStatus = (p: number) => (p >= 100 ? "Completed" : p <= 0 ? "Open" : "In Progress");
  const taskPercent = localSubs.length > 0
    ? Math.round(localSubs.reduce((a, s) => a + Number(s?.progress || 0), 0) / localSubs.length)
    : null;

  const commitBar = async (idx: number, value: number) => {
    if (isGuest) return;
    pendingRef.current += 1;
    setBusyIdx(idx);
    try {
      await updateTaskSubtaskProgress(task._id, idx, value);
      committedRef.current[idx] = value;
      router.refresh();
    } catch (err: any) {
      const back = committedRef.current[idx] ?? 0;
      setLocalSubs((list) => list.map((s, i) => (i === idx ? { ...s, progress: back, status: autoStatus(back) } : s)));
      alert(err?.message || "Could not save the branch bar. Please try again.");
    } finally {
      pendingRef.current = Math.max(0, pendingRef.current - 1);
      setBusyIdx(null);
    }
  };

  const scheduleCommit = (idx: number, value: number) => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => commitBar(idx, value), 700);
  };

  /** Worker drags the bar: instant paint + glow; persists debounced. */
  const slideBar = (idx: number, value: number) => {
    if (isGuest || busyIdx !== null) return;
    const v = Math.max(0, Math.min(100, Math.round(value)));
    setLocalSubs((list) => list.map((s, i) => (i === idx ? { ...s, progress: v, status: autoStatus(v) } : s)));
    scheduleCommit(idx, v);
  };

  /** Manual Open -> In Progress -> Completed override (bar follows, saves now). */
  const setStatusManual = async (idx: number, status: string) => {
    if (isGuest || busyIdx !== null) return;
    const cur = Number(localSubs[idx]?.progress || 0);
    const target = status === "Completed" ? 100 : status === "Open" ? 0 : cur === 0 ? 50 : cur;
    if (commitTimer.current) clearTimeout(commitTimer.current);
    setLocalSubs((list) => list.map((s, i) => (i === idx ? { ...s, progress: target, status } : s)));
    await commitBar(idx, target);
  };

  const focusCreatorForStage = (stage: string) => {
    setNewStage(stage);
    setTimeout(() => titleRef.current?.focus(), 50);
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-indigo-100 dark:border-indigo-900/60 shadow-sm p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px]">⎇</span>
          Branch Sub-divisions ({doneCount}/{subtasks.length})
        </span>
        <span className="flex items-center gap-1.5">
          {taskPercent !== null && (
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white tabular-nums" title="Task completion = average of branch bars">
              {taskPercent}%
            </span>
          )}
          <span className="text-[10px] text-gray-400 hidden sm:inline">e.g. homepage → hero section</span>
        </span>
      </div>
      {subtasks.length > 0 && (
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
            style={{ width: `${Math.round((doneCount / subtasks.length) * 100)}%` }}
          />
        </div>
      )}

      {subtasks.length === 0 && (
        <p className="text-[11px] text-gray-400 italic py-1">
          No branches yet — subdivide this task into atomic sections below.
        </p>
      )}

      {subtasks.map((s: any, idx: number) => {
        const barVal = Math.max(0, Math.min(100, Number(s?.progress || 0)));
        const committed = committedRef.current[idx] ?? barVal;
        const delta = barVal - committed;
        const moved = delta !== 0;
        return (
        <div
          key={idx}
          className={`p-2 rounded-md bg-white dark:bg-gray-800 border transition-shadow ${moved ? "border-indigo-400 dark:border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.35)]" : "border-gray-200 dark:border-gray-700"}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex-1 min-w-0 truncate" title={s.title}>
              {s.title}
            </span>
            <span className={`text-xs font-extrabold tabular-nums ${barVal >= 100 ? "text-emerald-600" : barVal > 0 ? "text-indigo-600 dark:text-indigo-300" : "text-gray-400"}`}>
              {barVal}%
            </span>
            {moved && (
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse ${delta > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"}`}>
                {delta > 0 ? `+${delta}%` : `${delta}%`}
              </span>
            )}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${subtaskTone(autoStatus(barVal))}`}>
              {autoStatus(barVal)}
            </span>
            {!isGuest && (
              <button
                type="button"
                onClick={() => handleDelete(idx)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                title="Delete branch"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={barVal}
              disabled={isGuest || busyIdx === idx}
              onChange={(e) => slideBar(idx, Number(e.target.value))}
              title="Drag to set completion"
              className="flex-1 h-2 accent-indigo-600 cursor-pointer disabled:cursor-not-allowed"
              style={moved ? { filter: "drop-shadow(0 0 5px rgba(99,102,241,0.9))" } : undefined}
            />
          </div>
          {(s.assignees || []).length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              {(s.assignees || []).map((a: any, ai: number) => (
                <span
                  key={ai}
                  title={`${a.name}${a.teamName ? ` — ${a.teamName}` : ""}`}
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 whitespace-nowrap"
                >
                  {a.name}{a.teamName ? ` · ${a.teamName}` : ""}
                </span>
              ))}
            </div>
          )}
        </div>
        );
      })}

      {!isGuest && (
        <form onSubmit={handleAdd} className="pt-1 border-t border-dashed border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New branch, e.g. Pt2 → homepage → hero section"
              className="flex-1 p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
            />
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs cursor-pointer"
            >
              {SUBTASK_STATUSES.map((st) => (
                <option key={st} value={st}>{st}</option>
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
  const [openBranches, setOpenBranches] = useState<Record<string, boolean>>({});
  if (!tasks || tasks.length === 0) return null;

  const memberNameOf = (id: string) => members.find((m) => m.id === id)?.name || id.slice(0, 6);
  const totalBranches = tasks.reduce(
    (n, t) => n + (Array.isArray(t.subtasks) ? t.subtasks.length : 0),
    0
  );
  const linkedCount = tasks.filter((t) => t.pipelineId && t.pipelineId !== "none").length;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm mb-6 overflow-hidden">
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
        </div>
      </div>
      <div className="overflow-x-auto max-h-[640px] overflow-y-auto border-t border-gray-100 dark:border-gray-700/60">
        <table className="w-full text-left border-collapse min-w-[880px]">
          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
            <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <th className="py-2.5 px-4">Task / Deliverable</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Severity</th>
              <th className="py-2.5 px-3 text-right">Est.</th>
              <th className="py-2.5 px-3 text-right">Actual</th>
              <th className="py-2.5 px-3">Pipeline · Stage</th>
              <th className="py-2.5 px-3">Sprint / Batch</th>
              <th className="py-2.5 px-4 text-right">Branches</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm">
            {tasks.map((task) => {
              const branchOpen = !!openBranches[task._id];
              const subs: any[] = Array.isArray(task.subtasks) ? task.subtasks : [];
              const subsDone = subs.filter((s) => String(s.status).toLowerCase() === "completed").length;
              return (
              <Fragment key={task._id}>
              <tr className={`transition-colors ${branchOpen ? "bg-indigo-50/60 dark:bg-indigo-950/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}>
                <td className="py-2.5 px-4 min-w-[220px]">
                  <form action={updateTaskNode} className="m-0">
                    <input type="hidden" name="taskId" value={task._id} />
                    <input
                      type="text"
                      name="name"
                      disabled={isGuest}
                      defaultValue={task.name}
                      title={task.name}
                      className={`w-full px-2 py-1 rounded-md border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-transparent text-[13px] font-semibold text-gray-900 dark:text-gray-100 transition-colors ${isGuest ? 'cursor-default' : ''}`}
                      onBlur={(e) => {
                        if (!isGuest && e.target.value !== task.name) e.target.form?.requestSubmit();
                      }}
                    />
                  </form>
                  {/* Stage + cross-team assigneesline */}
                  <div className="flex flex-wrap items-center gap-1 mt-0.5 px-2">
                    {task.stageRef ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300" title={`Structural stage: ${task.stageRef}`}>
                        ◈ {task.stageRef}
                      </span>
                    ) : null}
                    {(task.assigneeIds || []).slice(0, 3).map((id: string) => (
                      <span key={id} className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300" title={memberNameOf(id)}>
                        {memberNameOf(id)}
                      </span>
                    ))}
                    {(task.assigneeIds || []).length > 3 && (
                      <span className="text-[10px] text-gray-400 font-semibold">+{(task.assigneeIds || []).length - 3} more</span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <form action={updateTaskNode} className="m-0">
                    <input type="hidden" name="taskId" value={task._id} />
                    <select
                      name="status"
                      disabled={isGuest}
                      defaultValue={task.status || "Todo"}
                      className={`px-2 py-1 rounded-full border text-xs font-bold cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 ${statusTone(task.status)} ${isGuest ? 'cursor-default' : ''}`}
                      onChange={(e) => !isGuest && e.target.form?.requestSubmit()}
                    >
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Code Review">Code Review</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Done">Done</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </form>
                </td>
                <td className="py-2.5 px-3">
                  <form action={updateTaskNode} className="m-0">
                    <input type="hidden" name="taskId" value={task._id} />
                    <select
                      name="severity"
                      disabled={isGuest}
                      defaultValue={task.severity?.toLowerCase() || "medium"}
                      className={`px-2 py-1 rounded-full border text-xs font-bold cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 capitalize ${severityTone(task.severity)} ${isGuest ? 'cursor-default' : ''}`}
                      onChange={(e) => !isGuest && e.target.form?.requestSubmit()}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </form>
                </td>
                <td className="py-2.5 px-3">
                  <form action={updateTaskNode} className="m-0">
                    <input type="hidden" name="taskId" value={task._id} />
                    <input
                      type="number"
                      name="estimatedHours"
                      disabled={isGuest}
                      defaultValue={task.estimatedHours || ""}
                      placeholder="0"
                      className={`w-16 px-2 py-1 rounded-md border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-transparent text-[13px] tabular-nums text-right text-gray-900 dark:text-gray-100 transition-colors ${isGuest ? 'cursor-default' : ''}`}
                      onBlur={(e) => {
                        if (!isGuest && Number(e.target.value) !== (task.estimatedHours || 0)) e.target.form?.requestSubmit();
                      }}
                    />
                  </form>
                </td>
                <td className="py-2.5 px-3">
                  <form action={updateTaskNode} className="m-0">
                    <input type="hidden" name="taskId" value={task._id} />
                    <input
                      type="number"
                      name="actualHours"
                      disabled={isGuest}
                      defaultValue={task.actualHours || ""}
                      placeholder="0"
                      className={`w-16 px-2 py-1 rounded-md border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-transparent text-[13px] tabular-nums text-right text-gray-900 dark:text-gray-100 transition-colors ${isGuest ? 'cursor-default' : ''}`}
                      onBlur={(e) => {
                        if (!isGuest && Number(e.target.value) !== (task.actualHours || 0)) e.target.form?.requestSubmit();
                      }}
                    />
                  </form>
                </td>
                <td className="py-2.5 px-3 min-w-[210px]">
                  <TaskPipelineCell task={task} pipelines={pipelines} isGuest={isGuest} />
                </td>
                <td className="py-2.5 px-3 min-w-[170px] max-w-[220px]">
                  <form action={updateTaskNode} className="m-0">
                    <input type="hidden" name="taskId" value={task._id} />
                    <select
                      name="cycleId"
                      disabled={isGuest}
                      defaultValue={task.cycleId || "none"}
                      title={cycles.find((c) => c._id === task.cycleId)?.name || "No sprint"}
                      className={`w-full px-2 py-1.5 rounded-md border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 bg-transparent text-xs text-gray-700 dark:text-gray-300 truncate ${isGuest ? 'cursor-default' : 'cursor-pointer'}`}
                      onChange={(e) => !isGuest && e.target.form?.requestSubmit()}
                    >
                      <option value="none">No Sprint / Batch</option>
                      {cycles.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </form>
                </td>
                <td className="py-2.5 px-4 whitespace-nowrap text-right">
                  <button
                    type="button"
                    onClick={() => setOpenBranches((prev) => ({ ...prev, [task._id]: !prev[task._id] }))}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border shadow-sm transition-all cursor-pointer ${
                      branchOpen
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : subs.length > 0
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 hover:shadow"
                        : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:text-blue-600"
                    }`}
                    title={subs.length > 0 ? "View / manage branch sub-divisions" : "Create a branch sub-division"}
                  >
                    ⎇ {subs.length > 0 ? `${subsDone}/${subs.length}` : "Branch"}
                  </button>
                </td>
              </tr>
              {branchOpen && (
                <tr className="bg-indigo-50/50 dark:bg-indigo-950/20">
                  <td colSpan={8} className="px-4 pb-4 pt-1">
                    <TaskBranchManager task={task} members={members} teams={teams} isGuest={isGuest} />
                  </td>
                </tr>
              )}
              </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
