export const CompanyStatus = {
  Active: "Active",
  Paused: "Paused",
  Archived: "Archived",
} as const;
export type CompanyStatusType = (typeof CompanyStatus)[keyof typeof CompanyStatus];

export const ProjectStatus = {
  Planning: "Planning",
  Active: "Active",
  OnHold: "On Hold",
  Completed: "Completed",
  Archived: "Archived",
} as const;
export type ProjectStatusType = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const HealthStatus = {
  OnTrack: "On Track",
  AtRisk: "At Risk",
  Behind: "Behind",
} as const;
export type HealthStatusType = (typeof HealthStatus)[keyof typeof HealthStatus];

export const ProjectCategory = {
  Internal: "Internal",
  Client: "Client",
  Product: "Product",
  Research: "Research",
  Other: "Other",
} as const;
export type ProjectCategoryType = (typeof ProjectCategory)[keyof typeof ProjectCategory];

export const UserRole = {
  Superuser: "superuser",
  Owner: "owner",
  Manager: "manager",
  TeamLead: "teamlead",
  Employee: "employee",
  Viewer: "viewer",
  // Legacy aliases
  Admin: "owner",
  Member: "employee",
} as const;
export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const ROLE_HIERARCHY: Record<string, number> = {
  superuser: 100,
  owner: 80,
  manager: 60,
  teamlead: 40,
  employee: 20,
  viewer: 10,
};

export const UserStatus = {
  Working: "Working",
  Quit: "Quit",
  Dropped: "Dropped",
  Archived: "Archived",
  Resigned: "Resigned",
} as const;
export type UserStatusType = (typeof UserStatus)[keyof typeof UserStatus];

export const TaskStatus = {
  Backlog: "Backlog",
  Todo: "Todo",
  InProgress: "In Progress",
  Blocked: "Blocked",
  Review: "Review",
  Done: "Done",
  Archived: "Archived",
} as const;
export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

export const Priority = {
  High: "High",
  Medium: "Medium",
  Low: "Low",
} as const;
export type PriorityType = (typeof Priority)[keyof typeof Priority];

export const RiskLevel = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
} as const;
export type RiskLevelType = (typeof RiskLevel)[keyof typeof RiskLevel];

export const GoalScope = {
  Company: "Company",
  Project: "Project",
  Team: "Team",
} as const;
export type GoalScopeType = (typeof GoalScope)[keyof typeof GoalScope];

export const GoalStatus = {
  OnTrack: "On Track",
  AtRisk: "At Risk",
  Behind: "Behind",
  Completed: "Completed",
} as const;
export type GoalStatusType = (typeof GoalStatus)[keyof typeof GoalStatus];

export const DailyGoalStatus = {
  Planned: "Planned",
  Done: "Done",
  Missed: "Missed",
  Carried: "Carried",
} as const;
export type DailyGoalStatusType = (typeof DailyGoalStatus)[keyof typeof DailyGoalStatus];

export const AssignmentEntityType = {
  Task: "Task",
  Pipeline: "Pipeline",
  Deal: "Deal",
  Lead: "Lead",
  Goal: "Goal",
} as const;
export type AssignmentEntityTypeType = (typeof AssignmentEntityType)[keyof typeof AssignmentEntityType];

export const AssignmentRole = {
  Owner: "Owner",
  Assignee: "Assignee",
  Reviewer: "Reviewer",
  Watcher: "Watcher",
} as const;
export type AssignmentRoleType = (typeof AssignmentRole)[keyof typeof AssignmentRole];

export const PipelineCategory = {
  Development: "Development",
  Sales: "Sales",
  Finance: "Finance",
  HR: "HR",
  Operations: "Operations",
  Marketing: "Marketing",
  General: "General",
} as const;
export type PipelineCategoryType = (typeof PipelineCategory)[keyof typeof PipelineCategory];

export const PipelineStatus = {
  Active: "Active",
  OnHold: "On Hold",
  Completed: "Completed",
  Draft: "Draft",
} as const;
export type PipelineStatusType = (typeof PipelineStatus)[keyof typeof PipelineStatus];

export const DealStage = {
  Prospect: "Prospect",
  InitialAnalysis: "Initial Analysis",
  DueDiligence: "Due Diligence",
  Closing: "Closing",
  Closed: "Closed",
  SigningAndClosing: "Signing & Closing",
  Integration: "Integration",
} as const;
export type DealStageType = (typeof DealStage)[keyof typeof DealStage];

export const DealStatus = {
  Active: "Active",
  Won: "Won",
  Lost: "Lost",
  OnHold: "On Hold",
} as const;
export type DealStatusType = (typeof DealStatus)[keyof typeof DealStatus];

export const LeadStatus = {
  New: "New",
  Working: "Working",
  Qualified: "Qualified",
  Unqualified: "Unqualified",
} as const;
export type LeadStatusType = (typeof LeadStatus)[keyof typeof LeadStatus];

export const TargetStatus = {
  Active: "Active",
  Rejected: "Rejected",
  Completed: "Completed",
} as const;
export type TargetStatusType = (typeof TargetStatus)[keyof typeof TargetStatus];

export const FeedbackType = {
  Bug: "Bug",
  FeatureRequest: "Feature Request",
  Complaint: "Complaint",
  Praise: "Praise",
} as const;
export type FeedbackTypeType = (typeof FeedbackType)[keyof typeof FeedbackType];

export const FeedbackStatus = {
  New: "New",
  Reviewed: "Reviewed",
  InProgress: "In Progress",
  Resolved: "Resolved",
} as const;
export type FeedbackStatusType = (typeof FeedbackStatus)[keyof typeof FeedbackStatus];

export const MetricType = {
  Percent: "Percent",
  Number: "Number",
  Currency: "Currency",
} as const;
export type MetricTypeType = (typeof MetricType)[keyof typeof MetricType];
