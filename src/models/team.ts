import mongoose, { Schema, Model } from "mongoose";
import { ITeam } from "./types";

const teamSchema = new Schema<ITeam>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    leadId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    projectIds: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    capacityHoursPerWeek: { type: Number, default: 40 },
  },
  { timestamps: true }
);

export const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>("Team", teamSchema);
