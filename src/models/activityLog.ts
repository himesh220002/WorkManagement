import mongoose, { Schema, Model } from "mongoose";
import { IActivityLog } from "./types";

const activityLogSchema = new Schema<IActivityLog>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    diff: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ companyId: 1, createdAt: -1 });
activityLogSchema.index({ projectId: 1, createdAt: -1 });

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);
