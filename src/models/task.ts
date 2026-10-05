import mongoose, { Schema, Model } from "mongoose";
import { ITask } from "./types";
import { TaskStatus } from "./enums";

const taskSchema = new Schema<ITask>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", index: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: "Pipeline", index: true },
    cycleId: { type: Schema.Types.ObjectId, ref: "Cycle", index: true },
    status: {
      type: String,
      default: "Todo",
      index: true,
    },
    priority: { type: String, default: "Medium" },
    type: { type: String, default: "task" },
    fraction: { type: Number, default: 1 },
    ratio: { type: Number, default: 1 },
    estimatedHours: { type: Number, default: 0 },
    actualHours: { type: Number, default: 0 },
    severity: { type: String, default: "medium" },
    module: { type: String, default: "General" },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    dueDate: { type: Date },
    progress: { type: Number, default: 0 },
    dependencies: [{ type: String }],
    assignee: { type: String, default: "Unassigned" }, // legacy string
    assignees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    assigneeIds: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    labels: [{ type: String }],
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "tasknodes" }
);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ companyId: 1, status: 1 });

if (process.env.NODE_ENV === "development" && mongoose.models.TaskNode) {
  if (!mongoose.models.TaskNode.schema.paths["assigneeIds"]) {
    delete mongoose.models.TaskNode;
  }
}

export const Task: Model<ITask> =
  mongoose.models.TaskNode || mongoose.model<ITask>("TaskNode", taskSchema);
export const TaskNode = Task;
