export interface UserMeritData {
  _id?: string;
  name?: string;
  rank?: string;
  joinedDate?: string | Date | null;
  performanceScore?: number;
  completedProjectsCount?: number;
  currentProjectsCount?: number;
  relevancyScore?: number;
  supervisorRating?: number;
  teamLeadRating?: number;
  remarks?: string;
}

export interface MeritEvaluationResult {
  currentRank: number;
  nextRank: number | null;
  workingDays: number;
  minTenureRequired: number;
  tenureSatisfied: boolean;
  performanceScore: number;
  completedProjects: number;
  currentProjects: number;
  relevancyScore: number;
  supervisorRating: number;
  teamLeadRating: number;
  remarks: string;

  // Weighted Component Contributions (Sum to 100)
  performanceComponent: number; // Max 25
  ratingsComponent: number;     // Max 30 (15 supervisor + 15 lead)
  projectComponent: number;     // Max 25 (20 completed + 5 active)
  tenureComponent: number;      // Max 10
  relevancyComponent: number;   // Max 10

  overallMeritScore: number;    // 0 - 100
  promotionThreshold: number;   // Threshold to promote to next rank
  isPromotionReady: boolean;
  readinessStatus:
    | "Max Seniority (Principal)"
    | "Promotion Ready: Merit Eligible"
    | "Strong Contender"
    | "On Track"
    | "Growth Focus Required"
    | "Newly Onboarded: Pending Review";
  progressPercent: number;      // 0 - 100% towards the next rank
  actionableFeedback: string[];
}

export function calculateMeritEvaluation(user: UserMeritData): MeritEvaluationResult {
  const currentRank = Math.min(5, Math.max(1, parseInt(user.rank || "1", 10) || 1));
  const nextRank = currentRank < 5 ? currentRank + 1 : null;

  // 1. Calculate active working days / tenure
  const joinedTime = user.joinedDate ? new Date(user.joinedDate).getTime() : Date.now();
  const now = Date.now();
  const diffDays = Math.max(1, Math.floor((now - joinedTime) / (1000 * 60 * 60 * 24)));
  const workingDays = isNaN(diffDays) ? 1 : diffDays;

  // Thresholds based on target next rank
  const TENURE_REQUIREMENTS: Record<number, number> = {
    2: 45,  // Rank 1 -> 2 needs 45 days
    3: 90,  // Rank 2 -> 3 needs 90 days
    4: 180, // Rank 3 -> 4 needs 180 days
    5: 365, // Rank 4 -> 5 needs 365 days
  };

  const PROMOTION_THRESHOLDS: Record<number, number> = {
    2: 75,
    3: 82,
    4: 88,
    5: 94,
  };

  const minTenureRequired = nextRank ? TENURE_REQUIREMENTS[nextRank] || 45 : 365;
  const promotionThreshold = nextRank ? PROMOTION_THRESHOLDS[nextRank] || 80 : 100;
  const tenureSatisfied = workingDays >= minTenureRequired;

  // Normalized Base Attributes (Default to 0 for unreviewed new hires)
  const performanceScore = Math.min(100, Math.max(0, Number(user.performanceScore ?? 0)));
  const relevancyScore = Math.min(100, Math.max(0, Number(user.relevancyScore ?? 0)));
  const rawSupervisor = Number(user.supervisorRating ?? 0);
  const supervisorRating = rawSupervisor > 0 ? Math.min(5, Math.max(1, rawSupervisor)) : 0;
  const rawTeamLead = Number(user.teamLeadRating ?? 0);
  const teamLeadRating = rawTeamLead > 0 ? Math.min(5, Math.max(1, rawTeamLead)) : 0;
  const completedProjects = Math.max(0, Number(user.completedProjectsCount ?? 0));
  const currentProjects = Math.max(0, Number(user.currentProjectsCount ?? 0));
  const remarks = user.remarks || "";

  // 1. Performance component (Weight: 25%)
  const performanceComponent = Math.round((performanceScore / 100) * 25);

  // 2. Supervisor + Team Lead Ratings component (Weight: 30%)
  const supervisorPts = supervisorRating > 0 ? (supervisorRating / 5) * 15 : 0;
  const leadPts = teamLeadRating > 0 ? (teamLeadRating / 5) * 15 : 0;
  const ratingsComponent = Math.round(supervisorPts + leadPts);

  // 3. Project Delivery track record (Weight: 25%)
  const completedPts = Math.min(20, completedProjects * 5);
  const currentPts = Math.min(5, currentProjects >= 1 ? 5 : 0);
  const projectComponent = Math.round(completedPts + currentPts);

  // 4. Tenure Dedication factor (Weight: 10%)
  const tenureRatio = Math.min(1, workingDays / minTenureRequired);
  const tenureComponent = Math.round(tenureRatio * 10);

  // 5. Skill & Domain Relevancy (Weight: 10%)
  const relevancyComponent = Math.round((relevancyScore / 100) * 10);

  // Overall Weighted Merit Score (0 - 100)
  const overallMeritScore = Math.min(
    100,
    performanceComponent + ratingsComponent + projectComponent + tenureComponent + relevancyComponent
  );

  // Readiness classification
  const isPromotionReady = currentRank < 5 && overallMeritScore >= promotionThreshold && tenureSatisfied;

  let readinessStatus: MeritEvaluationResult["readinessStatus"] = "On Track";
  if (currentRank === 5) {
    readinessStatus = "Max Seniority (Principal)";
  } else if (supervisorRating === 0 && teamLeadRating === 0 && performanceScore === 0) {
    readinessStatus = "Newly Onboarded: Pending Review";
  } else if (isPromotionReady) {
    readinessStatus = "Promotion Ready: Merit Eligible";
  } else if (overallMeritScore >= promotionThreshold - 8) {
    readinessStatus = "Strong Contender";
  } else if (overallMeritScore >= 65) {
    readinessStatus = "On Track";
  } else {
    readinessStatus = "Growth Focus Required";
  }

  // Progress to next rank
  const progressPercent = currentRank === 5
    ? 100
    : Math.min(100, Math.round((overallMeritScore / promotionThreshold) * 100));

  // Actionable constructive improvement feedback
  const actionableFeedback: string[] = [];

  if (currentRank < 5) {
    if (!tenureSatisfied) {
      actionableFeedback.push(
        `Tenure milestone: ${workingDays} / ${minTenureRequired} days completed (${minTenureRequired - workingDays} days remaining for rank requirement).`
      );
    }
    if (completedProjects < (nextRank === 2 ? 1 : nextRank === 3 ? 2 : nextRank === 4 ? 4 : 6)) {
      actionableFeedback.push(
        "Project delivery: Complete assigned deliverables to build verified milestone track record."
      );
    }
    if (teamLeadRating < 4.0 || supervisorRating < 4.0) {
      actionableFeedback.push(
        "Sprint reviews: Enhance sprint task closure speed and cross-functional peer synchronization."
      );
    }
    if (performanceScore < 85) {
      actionableFeedback.push(
        "Execution index: Aim for consistent on-time deliverables in active sprints."
      );
    }
    if (actionableFeedback.length === 0) {
      actionableFeedback.push(
        "Exceptional consistency: All objective merit requirements satisfied for executive promotion review."
      );
    }
  } else {
    actionableFeedback.push(
      "Highest seniority attained. Primary expectation: Strategic mentorship and architectural governance."
    );
  }

  return {
    currentRank,
    nextRank,
    workingDays,
    minTenureRequired,
    tenureSatisfied,
    performanceScore,
    completedProjects,
    currentProjects,
    relevancyScore,
    supervisorRating,
    teamLeadRating,
    remarks,
    performanceComponent,
    ratingsComponent,
    projectComponent,
    tenureComponent,
    relevancyComponent,
    overallMeritScore,
    promotionThreshold,
    isPromotionReady,
    readinessStatus,
    progressPercent,
    actionableFeedback,
  };
}

export interface PromotionBadgeInfo {
  label: string;
  shortLabel: string;
  badgeStyle: string;
  dotColor: string;
  statusType: "ready" | "contender" | "on-track" | "growth" | "principal" | "pending";
}

export function getPromotionBadgeInfo(merit: MeritEvaluationResult): PromotionBadgeInfo {
  if (merit.readinessStatus === "Newly Onboarded: Pending Review") {
    return {
      label: "🌱 Newly Onboarded (Pending Review)",
      shortLabel: "Pending Review",
      badgeStyle: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
      dotColor: "bg-blue-500",
      statusType: "pending",
    };
  }
  if (merit.currentRank >= 5) {
    return {
      label: "👑 Principal Seniority (Rank 5)",
      shortLabel: "Principal Tier",
      badgeStyle: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
      dotColor: "bg-purple-500",
      statusType: "principal",
    };
  }
  if (merit.isPromotionReady) {
    return {
      label: `✨ Eligible for Promotion: Rank ${merit.nextRank}`,
      shortLabel: `Ready for Rank ${merit.nextRank}`,
      badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700 shadow-sm",
      dotColor: "bg-emerald-500",
      statusType: "ready",
    };
  }
  if (merit.readinessStatus === "Strong Contender") {
    return {
      label: `⭐ Strong Contender (${merit.overallMeritScore}% / ${merit.promotionThreshold}%)`,
      shortLabel: `Contender (${merit.overallMeritScore}%)`,
      badgeStyle: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
      dotColor: "bg-amber-500",
      statusType: "contender",
    };
  }
  if (merit.readinessStatus === "On Track") {
    return {
      label: `🎯 On Track (${merit.overallMeritScore}%)`,
      shortLabel: `On Track (${merit.overallMeritScore}%)`,
      badgeStyle: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
      dotColor: "bg-sky-500",
      statusType: "on-track",
    };
  }
  return {
    label: `📈 Growth Focus (${merit.overallMeritScore}%)`,
    shortLabel: `Growth Focus`,
    badgeStyle: "bg-stone-50 text-stone-600 border-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-700",
    dotColor: "bg-stone-400",
    statusType: "growth",
  };
}

