import mongoose, { Schema, Model } from "mongoose";
import { ICampaign } from "./types";

const campaignSchema = new Schema<ICampaign>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    name: { type: String, required: true },
    type: { type: String, default: "Marketing" },
    leadsGenerated: { type: Number, default: 0 },
    expectedRevenue: { type: Number, default: 0 },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: "Pipeline", index: true },
  },
  { timestamps: true }
);

export const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", campaignSchema);
