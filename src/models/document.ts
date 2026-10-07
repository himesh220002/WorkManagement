import mongoose, { Schema, Model } from "mongoose";
import { IDocument } from "./types";

const documentSchema = new Schema<IDocument>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["EMPLOYEE", "PROJECT", "SALES", "SALARY_FINANCE"],
      required: true,
    },
    subType: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    s3Key: { type: String, required: true },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Compound indexes for fast tenant and category queries
documentSchema.index({ companyId: 1, category: 1 });
documentSchema.index({ companyId: 1, entityId: 1 });
documentSchema.index({ companyId: 1, isArchived: 1 });

export const Document: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>("Document", documentSchema);
