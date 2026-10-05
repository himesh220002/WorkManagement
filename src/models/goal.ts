import mongoose, { Schema, Model } from "mongoose";
import { IGoal } from "./types";
import { GoalScope, GoalStatus, MetricType } from "./enums";

const goalSchema = new Schema<IGoal>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    scope: {
      type: String,
      enum: Object.values(GoalScope),
      default: GoalScope.Company,
      index: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "Company" },
    status: {
      type: String,
      default: GoalStatus.OnTrack,
      index: true,
    },
    progress: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    metric: {
      type: {
        type: String,
        default: MetricType.Percent,
      },
      target: { type: Number, default: 100 },
      current: { type: Number, default: 0 },
      unit: { type: String, default: "%" },
    },
  },
  { timestamps: true }
);

export const Goal: Model<IGoal> =
  mongoose.models.Goal || mongoose.model<IGoal>("Goal", goalSchema);
