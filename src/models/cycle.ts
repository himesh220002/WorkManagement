import mongoose, { Schema, Model } from "mongoose";
import { ICycle } from "./types";

const cycleSchema = new Schema<ICycle>(
  {
    name: { type: String, required: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
  },
  { timestamps: true }
);

export const Cycle: Model<ICycle> =
  mongoose.models.Cycle || mongoose.model<ICycle>("Cycle", cycleSchema);
