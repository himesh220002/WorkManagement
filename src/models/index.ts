import mongoose from "mongoose";

// --- TaskNode Schema ---
const taskNodeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  status: { type: String, default: "active" },
  priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
  type: { type: String, enum: ["task", "extender", "shrinker", "connector", "replacer", "merger"], default: "task" },
  fraction: { type: Number, default: 1 },
  ratio: { type: Number, default: 1 },
  estimatedHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },
  severity: { type: String, enum: ["critical", "high", "medium", "low"], default: "medium" },
  module: { type: String, default: "General" },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  progress: { type: Number, default: 0 },
  dependencies: [{ type: String }],
  assignee: { type: String, default: "Unassigned" }
});
export const TaskNode = mongoose.models.TaskNode || mongoose.model("TaskNode", taskNodeSchema);

// --- Lead Schema ---
const leadSchema = new mongoose.Schema({
  name: String,
  status: { type: String, enum: ["New", "Working", "Qualified", "Unqualified"], default: "New" },
  owner: String,
  source: String
});
export const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);

// --- Campaign Schema ---
const campaignSchema = new mongoose.Schema({
  name: String,
  type: String,
  leadsGenerated: Number,
  expectedRevenue: Number
});
export const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);

// --- Deal Schema ---
const dealSchema = new mongoose.Schema({
  name: String,
  stage: { type: String, enum: ["Prospect", "Initial Analysis", "Due Diligence", "Closing", "Closed", "Signing & Closing", "Integration"], default: "Prospect" },
  revenue: Number,
  amount: Number,
  owner: String
});
export const Deal = mongoose.models.Deal || mongoose.model("Deal", dealSchema);

// --- Target Schema ---
const targetSchema = new mongoose.Schema({
  name: String,
  industry: String,
  region: String,
  status: { type: String, enum: ["Active", "Rejected", "Completed"], default: "Active" },
  rejectionReason: String,
  checklist: [{ name: String, isCompleted: { type: Boolean, default: false } }]
});
export const Target = mongoose.models.Target || mongoose.model("Target", targetSchema);

// --- Missing Legacy Schemas ---
const itemsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
  createdAt: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
});
export const Item = mongoose.models.Item || mongoose.model("Item", itemsSchema);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});
export const List = mongoose.models.List || mongoose.model("List", listSchema);

const userSchema = new mongoose.Schema({
  name: String,
  role: { type: String, default: "Member" }
});
export const User = mongoose.models.User || mongoose.model("User", userSchema);

const teamSchema = new mongoose.Schema({
  name: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
export const Team = mongoose.models.Team || mongoose.model("Team", teamSchema);

const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  deadline: Date,
  scaling: { type: Number, default: 1 },
  status: { type: String, default: "Active" }
});
export const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);

const cycleSchema = new mongoose.Schema({
  name: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  startDate: { type: Date, default: Date.now },
  endDate: Date
});
export const Cycle = mongoose.models.Cycle || mongoose.model("Cycle", cycleSchema);

// --- Pipeline Schema (For Timeline / Cards) ---
const pipelineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ["Development", "Sales", "Finance", "HR", "Operations", "Marketing", "General"], default: "Development" },
  owner: { type: String, default: "Unassigned" },
  status: { type: String, enum: ["Active", "On Hold", "Completed", "Draft"], default: "Active" },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  progress: { type: Number, default: 0 },
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  objectives: { type: String, default: "" },
  dependencies: { type: String, default: "" },
  budget: { type: String, default: "" },
  kpis: { type: String, default: "" },
  tags: { type: String, default: "" },
  riskLevel: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
  notes: { type: String, default: "" },
  todos: [{
    text: String,
    completed: { type: Boolean, default: false }
  }]
});
export const Pipeline = mongoose.models.Pipeline || mongoose.model("Pipeline", pipelineSchema);
