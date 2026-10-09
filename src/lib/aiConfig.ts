import { AIReportType } from "@/models/aiReport";

export interface GeminiModelOption {
  id: string;
  name: string;
  description: string;
  badge?: string;
}

export const SUPPORTED_GEMINI_MODELS: GeminiModelOption[] = [
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    description: "Hybrid Reasoning & deep problem diagnosis with actionable solutions (Latest)",
    badge: "Recommended",
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    description: "Balanced next-gen intelligence for health scores, team effort & deadline tracking",
    badge: "Fast",
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    description: "High-throughput model optimized for cross-department & company-wide reports",
    badge: "High Throughput",
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    description: "Ultra-low latency generation for instant estimation and form generation",
    badge: "Ultra Fast",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Stable and reliable general-purpose workspace intelligence",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "Standard fast Gemini baseline model",
  },
];

export interface ReportCategoryOption {
  type: AIReportType;
  title: string;
  shortDesc: string;
  longDesc: string;
  iconName: string;
  colorClass: string;
  gradientClass: string;
  badgeText: string;
}

export const REPORT_CATEGORIES: ReportCategoryOption[] = [
  {
    type: "project",
    title: "Project Health & Solutions",
    shortDesc: "Health score, deadlines, team effort, blockers & actionable solutions",
    longDesc:
      "Synthesizes project trajectory, overdue deadlines, team workload distribution, risks, and concrete mitigation steps.",
    iconName: "FolderKanban",
    colorClass: "text-blue-500",
    gradientClass: "from-blue-600 to-indigo-600",
    badgeText: "Core Project Intel",
  },
  {
    type: "team",
    title: "Team Velocity & Effort",
    shortDesc: "Workload balancing, capacity limits, velocity & burnout risks",
    longDesc:
      "Analyzes team task distribution, member commitments, velocity, and recommends workload adjustments.",
    iconName: "Users",
    colorClass: "text-purple-500",
    gradientClass: "from-purple-600 to-pink-600",
    badgeText: "Workforce Analytics",
  },
  {
    type: "company",
    title: "Company Strategic Overview",
    shortDesc: "Company-wide milestones, cross-team alignment & OKR health",
    longDesc:
      "High-level executive briefing across all active initiatives, strategic targets, and cross-department blockers.",
    iconName: "Building2",
    colorClass: "text-emerald-500",
    gradientClass: "from-emerald-600 to-teal-600",
    badgeText: "Executive Suite",
  },
  {
    type: "sales",
    title: "Sales Pipeline Velocity",
    shortDesc: "Deal stages, win-loss probabilities & pipeline acceleration",
    longDesc:
      "Examines sales opportunities, deal volume, forecast velocity, and actionable sales tactics to close faster.",
    iconName: "BadgeDollarSign",
    colorClass: "text-amber-500",
    gradientClass: "from-amber-600 to-orange-600",
    badgeText: "Revenue Engine",
  },
  {
    type: "revenue",
    title: "Revenue & Target Tracking",
    shortDesc: "MRR, target achievements, cash run-rate & financial health",
    longDesc:
      "Tracks target margins, growth milestones, plan subscriptions, and financial health metrics across the workspace.",
    iconName: "TrendingUp",
    colorClass: "text-green-500",
    gradientClass: "from-green-600 to-emerald-600",
    badgeText: "Financial Health",
  },
  {
    type: "form",
    title: "AI Form & Survey Generator",
    shortDesc: "Generates custom questions & 1-click imports to TaskPMS Forms",
    longDesc:
      "Creates intake forms, customer feedback, sprint retros, or bug questionnaires directly ready to publish in the Forms Builder.",
    iconName: "FormInput",
    colorClass: "text-indigo-500",
    gradientClass: "from-indigo-600 to-violet-600",
    badgeText: "Interactive Forms",
  },
  {
    type: "chart",
    title: "AI Chart & Data Analytics",
    shortDesc: "Interactive charts, status distributions & metric visualizers",
    longDesc:
      "Visualizes task completion, priority distributions, and health timelines with interactive data charts.",
    iconName: "BarChart3",
    colorClass: "text-cyan-500",
    gradientClass: "from-cyan-600 to-blue-600",
    badgeText: "Visual Analytics",
  },
  {
    type: "estimation",
    title: "Project & Effort Estimator",
    shortDesc: "Story points, hours, headcount & budget USD estimates",
    longDesc:
      "Calculates realistic timelines, story points, team hours, and financial budget requirements with complexity analysis.",
    iconName: "Calculator",
    colorClass: "text-rose-500",
    gradientClass: "from-rose-600 to-red-600",
    badgeText: "Estimations & Sizing",
  },
];
