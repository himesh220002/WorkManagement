import mongoose, { Schema, Model } from "mongoose";
import { ILead } from "./types";
import { LeadStatus } from "./enums";

const checklistItemSchema = new Schema(
  {
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const leadSchema = new Schema<ILead>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    name: { type: String, required: true },
    status: {
      type: String,
      default: LeadStatus.New,
      index: true,
    },
    owner: { type: String, default: "Unassigned" }, // legacy
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    contactName: { type: String, default: "" },
    priority: { type: String, default: "Medium" },
    source: { type: String },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", index: true },
    checklist: { type: [checklistItemSchema], default: [] },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development" && mongoose.models.Lead) {
  const paths = (mongoose.models.Lead.schema as any).paths || {};
  if (!paths.checklist || !paths.contactName || !paths.priority) {
    delete mongoose.models.Lead;
  }
}

export const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", leadSchema);
