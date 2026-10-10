import mongoose, { Schema, Model } from "mongoose";
import { IDeal } from "./types";
import { DealStage, DealStatus } from "./enums";

const dealChecklistItemSchema = new Schema(
  {
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const dealSchema = new Schema<IDeal>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: "Pipeline", index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", index: true },
    name: { type: String, required: true },
    stage: {
      type: String,
      default: DealStage.Prospect,
      index: true,
    },
    revenue: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    owner: { type: String, default: "Unassigned" }, // legacy
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    contactName: { type: String, default: "" },
    checklist: { type: [dealChecklistItemSchema], default: [] },
    client: {
      name: { type: String },
      industry: { type: String },
      region: { type: String },
    },
    expectedCloseDate: { type: Date },
    status: {
      type: String,
      default: DealStatus.Active,
      index: true,
    },
    currency: { type: String, default: "USD" },
    isRecurring: { type: Boolean, default: false },
    metadata: {
      priority: { type: String, default: "Medium" },
      riskLevel: { type: String, default: "Low" },
      notes: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

dealSchema.index({ companyId: 1, stage: 1 });
dealSchema.index({ projectId: 1, status: 1 });

if (process.env.NODE_ENV === "development" && mongoose.models.Deal) {
  const paths = (mongoose.models.Deal.schema as any).paths || {};
  if (!paths.ownerId || !paths.checklist || !paths.contactName) {
    delete mongoose.models.Deal;
  }
}

export const Deal: Model<IDeal> =
  mongoose.models.Deal || mongoose.model<IDeal>("Deal", dealSchema);
