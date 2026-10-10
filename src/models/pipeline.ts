import mongoose, { Schema, Model } from "mongoose";
import { IPipeline } from "./types";
import { PipelineCategory, PipelineStatus, Priority, RiskLevel } from "./enums";

const pipelineSchema = new Schema<IPipeline>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", index: true },
    taskId: { type: Schema.Types.ObjectId, ref: "TaskNode" },
    name: { type: String, required: true },
    category: {
      type: String,
      default: PipelineCategory.Development,
    },
    owner: { type: String, default: "Unassigned" }, // legacy string
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    status: {
      type: String,
      default: PipelineStatus.Active,
      index: true,
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    progress: { type: Number, default: 0 },
    priority: {
      type: String,
      default: Priority.Medium,
    },
    objectives: { type: String, default: "" },
    dependencies: { type: String, default: "" },
    outcome: { type: String, default: "" },
    budget: { type: String, default: "" },
    kpis: { type: String, default: "" },
    tags: { type: String, default: "" },
    memberIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    riskLevel: {
      type: String,
      default: RiskLevel.Low,
    },
    notes: { type: String, default: "" },
    cashFlowProjectionUSD: { type: Number, default: 0 },
    expensesUSD: { type: Number, default: 0 },
    roiPercent: { type: Number, default: 0 },
    dealStage: { type: String, default: "" },
    dealValue: { type: Number, default: 0 },
    winProbability: { type: Number, default: 0 },
    todos: [
      {
        text: { type: String, required: true },
        completed: { type: Boolean, default: false },
        assigneeType: { type: String, default: "Individual" },
        assigneeName: { type: String, default: "" },
        assigneeId: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development" && mongoose.models.Pipeline) {
  if (!mongoose.models.Pipeline.schema.paths["ownerId"]) {
    delete mongoose.models.Pipeline;
  }
}

export const Pipeline: Model<IPipeline> =
  mongoose.models.Pipeline || mongoose.model<IPipeline>("Pipeline", pipelineSchema);
