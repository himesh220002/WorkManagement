import { HealthStatus, HealthStatusType } from "../models/enums";

export interface DateRange {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}

/**
 * Computes expected progress percentage based on elapsed time between startDate and endDate.
 */
export function computeExpectedProgress(
  range: DateRange,
  currentDate: Date = new Date()
): number {
  if (!range.startDate || !range.endDate) return 50;

  const start = new Date(range.startDate).getTime();
  const end = new Date(range.endDate).getTime();
  const now = currentDate.getTime();

  if (isNaN(start) || isNaN(end) || end <= start) return 50;
  if (now <= start) return 0;
  if (now >= end) return 100;

  return Math.round(((now - start) / (end - start)) * 100);
}

/**
 * Health rule per specification:
 * - Blocked tasks > 20% forces At Risk
 * - Behind if progress < expectedProgress - 15
 * - At Risk if progress < expectedProgress - 5
 * - Otherwise On Track
 */
export function computeHealth(
  actualProgress: number,
  expectedProgress: number,
  blockedRatio: number = 0
): HealthStatusType {
  if (blockedRatio > 0.2) {
    return HealthStatus.AtRisk;
  }

  const diff = actualProgress - expectedProgress;

  if (diff < -15) {
    return HealthStatus.Behind;
  }
  if (diff < -5) {
    return HealthStatus.AtRisk;
  }
  return HealthStatus.OnTrack;
}

export interface TaskSummaryStats {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  todo: number;
  blockedRatio: number;
  progressPercent: number;
  totalEstimatedHours: number;
  totalActualHours: number;
}

export function computeTaskStats(
  tasks: Array<{
    status?: string | null;
    estimatedHours?: number;
    actualHours?: number;
    progress?: number;
  }>
): TaskSummaryStats {
  const total = tasks.length;
  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      blocked: 0,
      todo: 0,
      blockedRatio: 0,
      progressPercent: 0,
      totalEstimatedHours: 0,
      totalActualHours: 0,
    };
  }

  let completed = 0;
  let inProgress = 0;
  let blocked = 0;
  let todo = 0;
  let totalEstimatedHours = 0;
  let totalActualHours = 0;

  for (const t of tasks) {
    const s = (t.status || "").toLowerCase();
    if (s === "done" || s === "completed") {
      completed++;
    } else if (s === "blocked") {
      blocked++;
    } else if (s === "in progress" || s === "active" || s === "review") {
      inProgress++;
    } else {
      todo++;
    }

    totalEstimatedHours += Number(t.estimatedHours || 0);
    totalActualHours += Number(t.actualHours || 0);
  }

  const blockedRatio = total > 0 ? blocked / total : 0;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    blocked,
    todo,
    blockedRatio,
    progressPercent,
    totalEstimatedHours,
    totalActualHours,
  };
}

export function computeCompanyRollup(
  projects: Array<{
    health?: string | null;
    status?: string | null;
  }>
) {
  const activeProjects = projects.filter((p) => (p.status || "").toLowerCase() !== "archived");
  const total = activeProjects.length;

  let onTrack = 0;
  let atRisk = 0;
  let behind = 0;

  for (const p of activeProjects) {
    const h = p.health || HealthStatus.OnTrack;
    if (h === HealthStatus.Behind) behind++;
    else if (h === HealthStatus.AtRisk) atRisk++;
    else onTrack++;
  }

  let overallStatus: HealthStatusType = HealthStatus.OnTrack;
  if (behind > 0 || (total > 0 && behind / total >= 0.2)) {
    overallStatus = HealthStatus.Behind;
  } else if (atRisk > 0 || (total > 0 && (atRisk + behind) / total >= 0.25)) {
    overallStatus = HealthStatus.AtRisk;
  }

  return {
    totalProjects: total,
    onTrack,
    atRisk,
    behind,
    overallStatus,
  };
}
