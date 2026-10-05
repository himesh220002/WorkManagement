import mongoose, { Schema, Model } from "mongoose";
import { IResourceAllocation } from "./types";
import { RiskLevel } from "./enums";

const resourceAllocationSchema = new Schema<IResourceAllocation>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      default: "Budget",
    },
    totalAllocated: { type: Number, default: 0 },
    totalUsed: { type: Number, default: 0 },
    assignedToProjectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    linkedDealId: { type: Schema.Types.ObjectId, ref: "Deal", index: true },
    riskLevel: {
      type: String,
      default: RiskLevel.Low,
    },
    period: {
      start: { type: Date },
      end: { type: Date },
    },
  },
  { timestamps: true }
);

export const ResourceAllocation: Model<IResourceAllocation> =
  mongoose.models.ResourceAllocation || mongoose.model<IResourceAllocation>("ResourceAllocation", resourceAllocationSchema);
