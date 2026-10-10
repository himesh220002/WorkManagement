/**
 * Shared utility for dynamic pipeline progress calculation — the single
 * formula used by server actions, cards, mesh, gantt, pages and snapshots.
 *
 * Hierarchy: branch bars (0-100, worker-dragged) -> task % (avg of its
 * branches, or status-based when it has none) -> pipeline % (avg of
 * checklist-todo units at 0/100 plus linked-task units) -> project %
 * (avg of its pipelines) -> company % (avg of projects).
 */

export interface BranchLike {
  progress?: number;
  status?: string;
}

export interface LinkedTaskLike {
  status?: string;
  progress?: number;
  subtasks?: Array<BranchLike>;
}

/** Status fallback when a task has no branch bars yet. */
export function statusToPercent(status?: string): number {
  const s = String(status || "").toLowerCase();
  if (s === "done" || s === "completed") return 100;
  if (s.includes("review")) return 75;
  if (s.includes("progress")) return 50;
  return 0;
}

/** A linked deliverable's completion: avg of its branch bars, else status-based. */
export function taskCompletion(task?: {
  status?: string;
  progress?: number;
  subtasks?: Array<BranchLike>;
} | null): number {
  if (!task) return 0;
  const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
  if (subs.length > 0) {
    const sum = subs.reduce((acc, s) => acc + Number(s?.progress || 0), 0);
    return Math.round(sum / subs.length);
  }
  if (typeof task.progress === "number" && task.progress > 0) return Math.round(task.progress);
  return statusToPercent(task.status);
}

/**
 * Pipeline % = average of checklist-todo units (0/100) and linked-task
 * units (continuous %). Falls back to stored progress when both are empty.
 */
export function computePipelineProgress(
  pipeline: { progress?: number; todos?: Array<{ completed?: boolean }> } | null | undefined,
  linkedTasks: Array<LinkedTaskLike> = []
): number {
  if (!pipeline) return 0;

  const completedTodos = Array.isArray(pipeline.todos)
    ? pipeline.todos.filter((t) => Boolean(t.completed)).length
    : 0;
  const totalTodos = Array.isArray(pipeline.todos) ? pipeline.todos.length : 0;

  const linked = Array.isArray(linkedTasks) ? linkedTasks : [];
  const linkedSum = linked.reduce((acc, t) => acc + taskCompletion(t), 0);

  if (totalTodos > 0 && linked.length > 0) {
    return Math.round(((completedTodos * 100 + linkedSum) / (totalTodos + linked.length)));
  }
  if (totalTodos > 0) {
    return Math.round((completedTodos / totalTodos) * 100);
  }
  if (linked.length > 0) {
    return Math.round(linkedSum / linked.length);
  }
  return Number(pipeline.progress || 0);
}

/** Project % = average of its pipelines' %. Company % = average of projects'. */
export function averagePercent(values: Array<number>): number {
  const clean = values.map((v) => Number(v) || 0);
  if (clean.length === 0) return 0;
  return Math.round(clean.reduce((a, b) => a + b, 0) / clean.length);
}
