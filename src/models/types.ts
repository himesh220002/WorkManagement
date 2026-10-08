import { Types } from "mongoose";
import {
  CompanyStatusType,
  ProjectStatusType,
  HealthStatusType,
  ProjectCategoryType,
  UserRoleType,
  UserStatusType,
  TaskStatusType,
  PriorityType,
  RiskLevelType,
  GoalScopeType,
  GoalStatusType,
  DailyGoalStatusType,
  AssignmentEntityTypeType,
  AssignmentRoleType,
  PipelineCategoryType,
  PipelineStatusType,
  DealStageType,
  DealStatusType,
  LeadStatusType,
  TargetStatusType,
  FeedbackTypeType,
  FeedbackStatusType,
  MetricTypeType,
} from "./enums";

export interface ICompanySubscription {
  planId: "monthly" | "quarterly" | "annual";
  planName?: string;
  startDate: Date | string;
  currentPeriodEnd: Date | string;
  status: "active" | "past_due" | "expired" | "canceled";
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  amountUsd?: number;
}

export interface ICompany {
  _id: string | Types.ObjectId;
  name: string;
  slug: string;
  subdomain?: string;
  companyCode?: string;
  plan?: string;
  subscription?: ICompanySubscription;
  logoUrl?: string;
  industry?: string;
  fiscalYearStart?: string;
  settings: {
    currency: string;
    timezone: string;
    workingDays: number[];
  };
  status: CompanyStatusType;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProjectChangeRequest {
  _id?: string | Types.ObjectId;
  title: string;
  description?: string;
  type?: "agenda" | "timeline" | "scope" | "deadline";
  requestedBy?: Types.ObjectId | string;
  requesterName?: string;
  status: "Pending" | "Approved" | "Rejected";
  reviewedBy?: Types.ObjectId | string;
  reviewerName?: string;
  reviewNote?: string;
  createdAt?: Date;
  reviewedAt?: Date;
}

export interface IProject {
  _id: string | Types.ObjectId;
  companyId?: Types.ObjectId | string;
  name: string;
  description?: string;
  category: ProjectCategoryType;
  ownerId?: Types.ObjectId | string;
  leadId?: Types.ObjectId | string;
  memberIds?: (Types.ObjectId | string)[];
  agendas?: string[];
  changeRequests?: IProjectChangeRequest[];
  teams: (Types.ObjectId | string)[];
  startDate?: Date;
  deadline?: Date;
  status: ProjectStatusType;
  health: HealthStatusType;
  budgetUSD?: number;
  scaling: number;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITeam {
  _id: string | Types.ObjectId;
  companyId?: Types.ObjectId | string;
  name: string;
  description?: string;
  leadId?: Types.ObjectId | string;
  projectIds?: (Types.ObjectId | string)[];
  members: (Types.ObjectId | string)[];
  capacityHoursPerWeek: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser {
  _id: string | Types.ObjectId;
  companyId?: Types.ObjectId | string;
  name: string;
  email?: string;
  passwordHash?: string;
  isActive?: boolean;
  avatarUrl?: string;
  role?: UserRoleType | string;
  teamIds?: (Types.ObjectId | string)[];
  position?: string;
  rank?: string;
  status?: UserStatusType | string;
  capacityHoursPerWeek?: number;
  skills?: string[];
  joinedDate?: Date;
  leftDate?: Date;
  details?: string;
  performanceScore?: number;
  completedProjectsCount?: number;
  currentProjectsCount?: number;
  relevancyScore?: number;
  supervisorRating?: number;
  teamLeadRating?: number;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword?(candidatePassword: string): Promise<boolean>;
}

export interface JWTPayload {
  userId: string;
  companyId?: string | null;
  companyCode?: string | null;
  role: "superuser" | "owner" | "manager" | "teamlead" | "employee" | string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}


export interface ITask {
  _id: string | Types.ObjectId;
  companyId?: Types.ObjectId | string;
  projectId?: Types.ObjectId | string;
  goalId?: Types.ObjectId | string;
  pipelineId?: Types.ObjectId | string;
  cycleId?: Types.ObjectId | string;
  name: string;
  description?: string;
  status: TaskStatusType | string;
  priority: PriorityType | string;
  type: string;
  fraction?: number;
  ratio?: number;
  estimatedHours: number;
  actualHours: number;
  severity: string;
  module: string;
  startDate?: Date;
  endDate?: Date;
  dueDate?: Date;
  progress: number;
  dependencies: string[];
  assignee?: string;
  assignees?: (Types.ObjectId | string)[];
  assigneeIds?: (Types.ObjectId | string)[];
  labels?: string[];
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDailyGoal {
  _id: string | Types.ObjectId;
  teamId: Types.ObjectId | string;
  goalId?: Types.ObjectId | string;
  date: Date | string;
  title: string;
  ownerId: Types.ObjectId | string;
  status: DailyGoalStatusType;
  taskIds: (Types.ObjectId | string)[];
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGoal {
  _id: string | Types.ObjectId;
  companyId?: Types.ObjectId | string;
  scope: GoalScopeType;
  projectId?: Types.ObjectId | string;
  teamId?: Types.ObjectId | string;
  ownerId?: Types.ObjectId | string;
  title: string;
  description?: string;
  category?: string;
  status: GoalStatusType;
  progress: number;
  startDate?: Date;
  dueDate?: Date;
  metric?: {
    type: MetricTypeType;
    target: number;
    current: number;
    unit?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITarget {
  _id: string | Types.ObjectId;
  companyId?: Types.ObjectId | string;
  goalId?: Types.ObjectId | string;
  name: string;
  industry?: string;
  region?: string;
  expectedValue: number;
  actualValue: number;
  achievedRevenueUSD: number;
  targetByRegion?: Map<string, number> | Record<string, number>;
  conversionRate: number | string;
  status: TargetStatusType;
  rejectionReason?: string;
  checklist?: { name: string; isCompleted: boolean }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAssignment {
  _id: string | Types.ObjectId;
  userId: Types.ObjectId | string;
  entityType: AssignmentEntityTypeType;
  entityId: Types.ObjectId | string;
  role: AssignmentRoleType;
  allocationPercent: number;
  assignedBy?: Types.ObjectId | string;
  assignedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IActivityLog {
  _id: string | Types.ObjectId;
  companyId?: Types.ObjectId | string;
  projectId?: Types.ObjectId | string;
  entityType: string;
  entityId: Types.ObjectId | string;
  action: string;
  actorId?: Types.ObjectId | string;
  diff?: Record<string, unknown>;
  createdAt?: Date;
}

export interface IStatusSnapshot {
  _id: string | Types.ObjectId;
  scope: "Company" | "Project" | "Team";
  scopeId: Types.ObjectId | string;
  date: string;
  metrics: Record<string, unknown>;
  createdAt?: Date;
}

export interface IPipeline {
  _id: string | Types.ObjectId;
  companyId?: Types.ObjectId | string;
  projectId?: Types.ObjectId | string;
  teamId?: Types.ObjectId | string;
  taskId?: Types.ObjectId | string;
  name: string;
  category: PipelineCategoryType;
  owner?: string;
  ownerId?: Types.ObjectId | string;
  status: PipelineStatusType;
  startDate?: Date;
  endDate?: Date;
  progress: number;
  priority: PriorityType;
  objectives?: string;
  dependencies?: string;
  outcome?: string;
  budget?: string;
  kpis?: string;
  tags?: string;
  memberIds?: (Types.ObjectId | string)[];
  riskLevel: RiskLevelType;
  notes?: string;
  cashFlowProjectionUSD: number;
  expensesUSD: number;
  roiPercent: number;
  todos: {
    text: string;
    completed: boolean;
    assigneeType: string;
    assigneeName?: string;
    assigneeId?: Types.ObjectId | string;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDeal {
  _id: string | Types.ObjectId;
  companyId?: Types.ObjectId | string;
  projectId?: Types.ObjectId | string;
  pipelineId?: Types.ObjectId | string;
  campaignId?: Types.ObjectId | string;
  name: string;
  stage: DealStageType;
  revenue?: number;
  amount: number;
  owner?: string;
  ownerId?: Types.ObjectId | string;
  client?: {
    name: string;
    industry?: string;
    region?: string;
  };
  expectedCloseDate?: Date;
  status: DealStatusType;
  currency?: string;
  isRecurring?: boolean;
  metadata?: {
    priority: string;
    riskLevel: string;
    notes?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILead {
  _id: string | Types.ObjectId;
  companyId?: Types.ObjectId | string;
  name: string;
  status?: LeadStatusType | string;
  owner?: string;
  ownerId?: Types.ObjectId | string;
  source?: string;
  campaignId?: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICampaign {
  _id: string | Types.ObjectId;
  companyId?: Types.ObjectId | string;
  projectId?: Types.ObjectId | string;
  pipelineId?: Types.ObjectId | string;
  name: string;
  type?: string;
  leadsGenerated?: number;
  expectedRevenue?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICycle {
  _id: string | Types.ObjectId;
  name: string;
  companyId?: Types.ObjectId | string;
  project?: Types.ObjectId | string;
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IResourceAllocation {
  _id: string | Types.ObjectId;
  companyId?: Types.ObjectId | string;
  teamId?: Types.ObjectId | string;
  name: string;
  type: string;
  totalAllocated: number;
  totalUsed: number;
  assignedToProjectId?: Types.ObjectId | string;
  linkedDealId?: Types.ObjectId | string;
  riskLevel: RiskLevelType;
  period?: {
    start: Date;
    end: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICustomerFeedback {
  _id: string | Types.ObjectId;
  projectId?: Types.ObjectId | string;
  title: string;
  type: FeedbackTypeType;
  priority: PriorityType;
  status: FeedbackStatusType;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DocumentCategory = "EMPLOYEE" | "PROJECT" | "SALES" | "SALARY_FINANCE";

export interface IDocument {
  _id: string | Types.ObjectId;
  companyId: Types.ObjectId | string;
  category: DocumentCategory;
  subType?: string;
  entityId?: Types.ObjectId | string | null;
  title: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  s3Key: string;
  uploadedBy: Types.ObjectId | string;
  isArchived?: boolean;
  archivedAt?: Date | null;
  archivedBy?: Types.ObjectId | string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
