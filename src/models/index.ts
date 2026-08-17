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
  assignee: { type: String, default: "Unassigned" },
  pipelineId: { type: mongoose.Schema.Types.ObjectId, ref: "Pipeline" },
  cycleId: { type: mongoose.Schema.Types.ObjectId, ref: "Cycle" }
});
export const TaskNode = mongoose.models.TaskNode || mongoose.model("TaskNode", taskNodeSchema);

// --- Lead Schema ---
const leadSchema = new mongoose.Schema({
  name: String,
  status: { type: String, enum: ["New", "Working", "Qualified", "Unqualified"], default: "New" },
  owner: String,
  source: String,
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" }
});
export const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);

// --- Campaign Schema ---
const campaignSchema = new mongoose.Schema({
  name: String,
  type: String,
  leadsGenerated: Number,
  expectedRevenue: Number,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  pipelineId: { type: mongoose.Schema.Types.ObjectId, ref: "Pipeline" }
});
export const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);

// --- Deal Schema ---
const dealSchema = new mongoose.Schema({
  name: String,
  stage: { type: String, enum: ["Prospect", "Initial Analysis", "Due Diligence", "Closing", "Closed", "Signing & Closing", "Integration"], default: "Prospect" },
  revenue: Number,
  amount: Number,
  owner: String,
  client: {
    name: String,
    industry: String,
    region: String
  },
  expectedCloseDate: Date,
  status: { type: String, enum: ["Active", "Won", "Lost", "On Hold"], default: "Active" },
  metadata: {
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    riskLevel: { type: String, enum: ["High", "Medium", "Low"], default: "Low" },
    notes: String
  },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  pipelineId: { type: mongoose.Schema.Types.ObjectId, ref: "Pipeline" }
});
export const Deal = mongoose.models.Deal || mongoose.model("Deal", dealSchema);

// --- Goal Schema ---
const goalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ["Company", "Department", "Team"], default: "Company" },
  status: { type: String, enum: ["On Track", "At Risk", "Behind", "Completed"], default: "On Track" },
  progress: { type: Number, default: 0 },
});
export const Goal = mongoose.models.Goal || mongoose.model("Goal", goalSchema);

// --- Target Schema ---
const targetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: "Goal" },
  industry: String,
  region: String,
  expectedValue: { type: Number, default: 100 },
  actualValue: { type: Number, default: 0 },
  achievedRevenueUSD: { type: Number, default: 0 },
  targetByRegion: { type: Map, of: Number },
  conversionRate: { type: String, default: "0%" },
  status: { type: String, enum: ["Active", "Rejected", "Completed"], default: "Active" },
  rejectionReason: String,
  checklist: [{ name: String, isCompleted: { type: Boolean, default: false } }]
});
if (mongoose.models.Target) {
  delete mongoose.models.Target;
}
export const Target = mongoose.model("Target", targetSchema);

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
  role: { type: String, default: "Member" },
  position: String,
  rank: String
});
if (mongoose.models.User) {
  delete mongoose.models.User;
}
export const User = mongoose.model("User", userSchema);

const teamSchema = new mongoose.Schema({
  name: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
export const Team = mongoose.models.Team || mongoose.model("Team", teamSchema);

const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: { type: String, enum: ["Internal", "Client", "Product", "Research", "Other"], default: "Internal" },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  deadline: Date,
  scaling: { type: Number, default: 1 },
  status: { type: String, default: "Active" }
});
if (mongoose.models.Project) {
  delete mongoose.models.Project;
}
export const Project = mongoose.model("Project", projectSchema);

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
  outcome: { type: String, default: "" },
  budget: { type: String, default: "" },
  kpis: { type: String, default: "" },
  tags: { type: String, default: "" },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskNode' },
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  riskLevel: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
  notes: { type: String, default: "" },
  cashFlowProjectionUSD: { type: Number, default: 0 },
  expensesUSD: { type: Number, default: 0 },
  roiPercent: { type: Number, default: 0 },
  todos: [{
    text: String,
    completed: { type: Boolean, default: false },
    assigneeType: { type: String, enum: ["Individual", "Group"], default: "Individual" },
    assigneeName: { type: String, default: "" }
  }]
});
if (mongoose.models.Pipeline) {
  delete mongoose.models.Pipeline;
}
export const Pipeline = mongoose.model("Pipeline", pipelineSchema);

// --- Resource Allocation Schema ---
const resourceAllocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["Budget", "Headcount", "Infrastructure", "Human"], default: "Budget" },
  totalAllocated: { type: Number, default: 0 },
  totalUsed: { type: Number, default: 0 },
  assignedToProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  linkedDealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  riskLevel: { type: String, enum: ["Low", "Medium", "High"], default: "Low" }
});
if (mongoose.models.ResourceAllocation) {
  delete mongoose.models.ResourceAllocation;
}
export const ResourceAllocation = mongoose.model("ResourceAllocation", resourceAllocationSchema);

// --- Customer Feedback Schema ---
const customerFeedbackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["Bug", "Feature Request", "Complaint", "Praise"], default: "Feature Request" },
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  status: { type: String, enum: ["New", "Reviewed", "In Progress", "Resolved"], default: "New" },
  description: String,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }
});
if (mongoose.models.CustomerFeedback) {
  delete mongoose.models.CustomerFeedback;
}
export const CustomerFeedback = mongoose.model("CustomerFeedback", customerFeedbackSchema);

