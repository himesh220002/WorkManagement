import mongoose, { Schema, Model } from "mongoose";
import { ITask } from "./types";
import { TaskStatus } from "./enums";

const taskSubAssigneeSchema = new Schema(
  {
    userId: { type: String, default: "" },
    name: { type: String, required: true },
    teamName: { type: String, default: "" },
  },
  { _id: false }
);

const taskSubtaskSchema = new Schema(
  {
    title: { type: String, required: true },
    status: { type: String, default: "Open" },
    // Worker-dragged completion (0-100). Drives task % = avg of branches.
    progress: { type: Number, default: 0 },
    // Pipeline checklist stage lane this branch lives in ("" = General).
    stage: { type: String, default: "" },
    assignees: { type: [taskSubAssigneeSchema], default: [] },
  },
  { _id: false }
);

const taskSchema = new Schema<ITask>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", index: true },
    pipelineId: { type: Schema.Types.ObjectId, ref: "Pipeline", index: true },
    cycleId: { type: Schema.Types.ObjectId, ref: "Cycle", index: true },
    // Structural pipeline stage this task belongs to (e.g. "UI Design" = Pt2).
    stageRef: { type: String, default: "" },
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
    // Deep sub-division branches (e.g. homepage → hero section) with
    // cross-team assignees. Parent task status stays the pipeline-counted unit.
    subtasks: { type: [taskSubtaskSchema], default: [] },
    labels: [{ type: String }],
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "tasknodes" }
);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ companyId: 1, status: 1 });

if (process.env.NODE_ENV === "development" && mongoose.models.TaskNode) {
  const paths = (mongoose.models.TaskNode.schema as any).paths || {};
  const subPaths =
    (paths.subtasks as any)?.schema?.paths ||
    (paths.subtasks as any)?.caster?.schema?.paths ||
    {};
  const stale =
    !paths.assigneeIds ||
    !paths.stageRef ||
    !paths.subtasks ||
    !subPaths.progress ||
    !subPaths.stage;
  if (stale) {
    delete mongoose.models.TaskNode;
    delete (mongoose.models as any).Task;
  }
}

export const Task: Model<ITask> =
  mongoose.models.TaskNode || mongoose.model<ITask>("TaskNode", taskSchema);
export const TaskNode = Task;
