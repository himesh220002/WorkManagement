import mongoose, { Schema, Model } from "mongoose";
import { IDailyGoal } from "./types";
import { DailyGoalStatus } from "./enums";

const dailyGoalSchema = new Schema<IDailyGoal>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", index: true },
    date: { type: Date, required: true, index: true },
    title: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: Object.values(DailyGoalStatus),
      default: DailyGoalStatus.Planned,
      index: true,
    },
    taskIds: [{ type: Schema.Types.ObjectId, ref: "TaskNode" }],
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

dailyGoalSchema.index({ teamId: 1, date: 1 });
dailyGoalSchema.index({ ownerId: 1, date: 1 });

export const DailyGoal: Model<IDailyGoal> =
  mongoose.models.DailyGoal || mongoose.model<IDailyGoal>("DailyGoal", dailyGoalSchema);
