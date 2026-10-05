import mongoose, { Schema, Model } from "mongoose";
import { IAssignment } from "./types";
import { AssignmentEntityType, AssignmentRole } from "./enums";

const assignmentSchema = new Schema<IAssignment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    entityType: {
      type: String,
      enum: Object.values(AssignmentEntityType),
      required: true,
      index: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    role: {
      type: String,
      enum: Object.values(AssignmentRole),
      default: AssignmentRole.Assignee,
    },
    allocationPercent: { type: Number, default: 100 },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    assignedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

assignmentSchema.index({ userId: 1, entityType: 1 });
assignmentSchema.index({ entityType: 1, entityId: 1 });

export const Assignment: Model<IAssignment> =
  mongoose.models.Assignment || mongoose.model<IAssignment>("Assignment", assignmentSchema);
