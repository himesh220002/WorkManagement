import mongoose, { Schema, Model } from "mongoose";
import { ILead } from "./types";
import { LeadStatus } from "./enums";

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
    source: { type: String },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", index: true },
  },
  { timestamps: true }
);

export const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", leadSchema);
