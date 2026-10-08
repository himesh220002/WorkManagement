import { PlanId } from "./razorpay";

export interface SubscriptionStatusInfo {
  planId: PlanId;
  planName: string;
  status: "active" | "expiring_soon" | "expired" | "past_due" | "canceled";
  startDate: string;
  currentPeriodEnd: string;
  daysRemaining: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  thresholdDays: number;
  warningMessage?: string;
}

/**
 * Calculates reminder thresholds based on billing frequency:
 * - Monthly subscription: Warn in last 3 days
 * - 3-Month (Quarterly) subscription: Warn in last 7 days
 * - Annual subscription: Warn in last 15 days
 */
export function getSubscriptionThresholdDays(planId: string = "monthly"): number {
  const norm = planId.toLowerCase();
  if (norm === "annual") return 15;
  if (norm === "quarterly") return 7;
  return 3; // monthly default
}

/**
 * Evaluates whether a company subscription is active, expiring soon, or expired.
 */
export function evaluateSubscriptionStatus(sub?: {
  planId?: string;
  planName?: string;
  startDate?: Date | string;
  currentPeriodEnd?: Date | string;
  status?: string;
}): SubscriptionStatusInfo | null {
  if (!sub || !sub.currentPeriodEnd) {
    return null;
  }

  const rawPlan = (sub.planId || "monthly").toLowerCase();
  const planId: PlanId =
    rawPlan === "annual" ? "annual" : rawPlan === "quarterly" ? "quarterly" : "monthly";

  const endDate = new Date(sub.currentPeriodEnd);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const thresholdDays = getSubscriptionThresholdDays(planId);
  const isExpired = daysRemaining <= 0;
  const isExpiringSoon = !isExpired && daysRemaining <= thresholdDays;

  let status: SubscriptionStatusInfo["status"] = (sub.status as any) || "active";
  if (isExpired) {
    status = "expired";
  } else if (isExpiringSoon) {
    status = "expiring_soon";
  }

  const planName =
    sub.planName ||
    (planId === "annual"
      ? "Enterprise Annual"
      : planId === "quarterly"
      ? "Enterprise Quarterly (3 Months)"
      : "Enterprise Monthly");

  let warningMessage: string | undefined;
  if (isExpired) {
    warningMessage = `Your organization's subscription has expired. Workspace access is currently placed on hold. Please renew your subscription to reactivate access.`;
  } else if (isExpiringSoon) {
    warningMessage = `Continuous Subscription Reminder: Your ${planName} will expire in ${daysRemaining} day${
      daysRemaining === 1 ? "" : "s"
    } (${endDate.toLocaleDateString()}). Please renew to ensure uninterrupted workspace access.`;
  }

  return {
    planId,
    planName,
    status,
    startDate: sub.startDate ? new Date(sub.startDate).toISOString() : new Date().toISOString(),
    currentPeriodEnd: endDate.toISOString(),
    daysRemaining,
    isExpiringSoon,
    isExpired,
    thresholdDays,
    warningMessage,
  };
}
