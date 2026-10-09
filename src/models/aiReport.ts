import mongoose, { Schema, Model } from "mongoose";

export type AIReportType =
  | "project"
  | "team"
  | "company"
  | "sales"
  | "revenue"
  | "form"
  | "chart"
  | "estimation";

export interface IAIReportMetrics {
  healthScore?: number; // 0-100
  healthStatus?: "On Track" | "At Risk" | "Critical";
  deadlinesTotal?: number;
  deadlinesOverdue?: number;
  teamEffortScore?: number;
  problemsIdentified?: number;
  solutionsProposed?: number;
  velocityScore?: number;
  budgetEstimatedUSD?: number;
  customMetrics?: Record<string, any>;
}

export interface IAIReport {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  title: string;
  type: AIReportType;
  scope: string; // e.g. "All Projects", "Project: Alpha"
  model: string; // e.g. "gemini-3.7-flash", "gemini-3.5-flash"
  summary: string;
  content: string; // Structured Markdown report
  metrics?: IAIReportMetrics;
  structuredData?: any; // Form questions, chart datasets, or estimation breakdown
  authorName?: string;
  authorId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const aiReportSchema = new Schema<IAIReport>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true, required: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "project",
        "team",
        "company",
        "sales",
        "revenue",
        "form",
        "chart",
        "estimation",
      ],
      required: true,
      index: true,
    },
    scope: { type: String, default: "All Projects" },
    model: { type: String, default: "gemini-3.7-flash" },
    summary: { type: String, default: "" },
    content: { type: String, required: true },
    metrics: {
      healthScore: { type: Number },
      healthStatus: { type: String, enum: ["On Track", "At Risk", "Critical"] },
      deadlinesTotal: { type: Number },
      deadlinesOverdue: { type: Number },
      teamEffortScore: { type: Number },
      problemsIdentified: { type: Number },
      solutionsProposed: { type: Number },
      velocityScore: { type: Number },
      budgetEstimatedUSD: { type: Number },
      customMetrics: { type: Schema.Types.Mixed },
    },
    structuredData: { type: Schema.Types.Mixed },
    authorName: { type: String, default: "AI Assistant" },
    authorId: { type: String, default: "" },
  },
  { timestamps: true }
);

aiReportSchema.index({ companyId: 1, createdAt: -1 });

export const AIReport: Model<IAIReport> =
  mongoose.models.AIReport || mongoose.model<IAIReport>("AIReport", aiReportSchema);
