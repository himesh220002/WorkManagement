import mongoose, { Schema, Model } from "mongoose";
import { IProject } from "./types";
import { ProjectCategory, ProjectStatus, HealthStatus } from "./enums";

const projectSchema = new Schema<IProject>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: Object.values(ProjectCategory),
      default: ProjectCategory.Internal,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    leadId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    memberIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    agendas: [{ type: String }],
    changeRequests: [
      {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        type: {
          type: String,
          enum: ["agenda", "timeline", "scope", "deadline"],
          default: "agenda",
        },
        requestedBy: { type: Schema.Types.ObjectId, ref: "User" },
        requesterName: { type: String, default: "" },
        status: {
          type: String,
          enum: ["Pending", "Approved", "Rejected"],
          default: "Pending",
        },
        reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
        reviewerName: { type: String },
        reviewNote: { type: String },
        createdAt: { type: Date, default: Date.now },
        reviewedAt: { type: Date },
      },
    ],
    teams: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    startDate: { type: Date, default: Date.now },
    deadline: { type: Date },
    status: {
      type: String,
      default: ProjectStatus.Active,
      index: true,
    },
    health: {
      type: String,
      default: HealthStatus.OnTrack,
      index: true,
    },
    budgetUSD: { type: Number, default: 0 },
    scaling: { type: Number, default: 1 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

projectSchema.index({ companyId: 1, status: 1 });

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", projectSchema);
