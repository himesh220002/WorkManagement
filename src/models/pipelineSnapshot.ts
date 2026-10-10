import mongoose, { Schema, Model } from "mongoose";

/**
 * Daily 5pm progress snapshot per pipeline.
 * Chain: branch bars -> task % -> pipeline % -> project % -> company %.
 * Project/company triples are derived on read from these rows, so weekend
 * gaps never distort the pairs (day-before -> yesterday -> today +deltas).
 */
export interface IPipelineProgressSnapshot {
  _id: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId | string;
  pipelineId: mongoose.Types.ObjectId | string;
  projectId?: mongoose.Types.ObjectId | string | null;
  date: string; // YYYY-MM-DD (UTC)
  progress: number;
  todoDone?: number;
  todoTotal?: number;
  taskUnits?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const pipelineProgressSnapshotSchema = new Schema<IPipelineProgressSnapshot>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: "Pipeline", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    date: { type: String, required: true, index: true },
    progress: { type: Number, default: 0 },
    todoDone: { type: Number, default: 0 },
    todoTotal: { type: Number, default: 0 },
    taskUnits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pipelineProgressSnapshotSchema.index({ pipelineId: 1, date: 1 }, { unique: true });

export const PipelineProgressSnapshot: Model<IPipelineProgressSnapshot> =
  mongoose.models.PipelineProgressSnapshot ||
  mongoose.model<IPipelineProgressSnapshot>("PipelineProgressSnapshot", pipelineProgressSnapshotSchema);

export default PipelineProgressSnapshot;
