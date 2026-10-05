import mongoose, { Schema, Model } from "mongoose";
import { ITarget } from "./types";
import { TargetStatus } from "./enums";

const targetSchema = new Schema<ITarget>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", index: true },
    name: { type: String, required: true },
    industry: { type: String },
    region: { type: String },
    expectedValue: { type: Number, default: 100 },
    actualValue: { type: Number, default: 0 },
    achievedRevenueUSD: { type: Number, default: 0 },
    targetByRegion: { type: Map, of: Number },
    conversionRate: { type: Schema.Types.Mixed, default: 0 },
    status: {
      type: String,
      default: TargetStatus.Active,
      index: true,
    },
    rejectionReason: { type: String },
    checklist: [{ name: { type: String }, isCompleted: { type: Boolean, default: false } }],
  },
  { timestamps: true }
);

export const Target: Model<ITarget> =
  mongoose.models.Target || mongoose.model<ITarget>("Target", targetSchema);
