import mongoose, { Schema, Model } from "mongoose";
import { IStatusSnapshot } from "./types";

const statusSnapshotSchema = new Schema<IStatusSnapshot>(
  {
    scope: { type: String, enum: ["Company", "Project", "Team"], required: true, index: true },
    scopeId: { type: Schema.Types.ObjectId, required: true, index: true },
    date: { type: String, required: true, index: true },
    metrics: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

statusSnapshotSchema.index({ scope: 1, scopeId: 1, date: 1 }, { unique: true });

export const StatusSnapshot: Model<IStatusSnapshot> =
  mongoose.models.StatusSnapshot || mongoose.model<IStatusSnapshot>("StatusSnapshot", statusSnapshotSchema);
