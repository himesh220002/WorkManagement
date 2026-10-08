/**
 * Shared utility for dynamic pipeline progress calculation.
 * Computes live completion percentage based on:
 * 1. Todos completed inside the pipeline checklist
 * 2. Task nodes linked to the pipeline in 'Done' or 'Completed' status
 * 3. Fallback to stored progress percentage
 */
export function computePipelineProgress(
  pipeline: { progress?: number; todos?: Array<{ completed?: boolean }> } | null | undefined,
  linkedTasks: Array<{ status?: string }> = []
): number {
  if (!pipeline) return 0;

  const completedTodos = Array.isArray(pipeline.todos)
    ? pipeline.todos.filter((t) => Boolean(t.completed)).length
    : 0;
  const totalTodos = Array.isArray(pipeline.todos) ? pipeline.todos.length : 0;

  const completedLinkedTasks = Array.isArray(linkedTasks)
    ? linkedTasks.filter((t) =>
        ["done", "completed"].includes((t.status || "").toLowerCase())
      ).length
    : 0;
  const totalLinkedTasks = Array.isArray(linkedTasks) ? linkedTasks.length : 0;

  if (totalTodos > 0 && totalLinkedTasks > 0) {
    return Math.round(
      ((completedTodos + completedLinkedTasks) / (totalTodos + totalLinkedTasks)) * 100
    );
  }
  if (totalTodos > 0) {
    return Math.round((completedTodos / totalTodos) * 100);
  }
  if (totalLinkedTasks > 0) {
    return Math.round((completedLinkedTasks / totalLinkedTasks) * 100);
  }
  return Number(pipeline.progress || 0);
}
