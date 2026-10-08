import mongoose, { Connection, Model } from "mongoose";
import connectToDatabase from "./mongodb";
import {
  User,
  Team,
  Project,
  Pipeline,
  Task,
  TaskNode,
  Deal,
  Lead,
  Campaign,
  Cycle,
  Goal,
  DailyGoal,
  Target,
  Assignment,
  ActivityLog,
  StatusSnapshot,
  ResourceAllocation,
  CustomerFeedback,
  List,
  Item,
  Document,
  Company,
  ClientAccount,
  Meeting,
} from "@/models";

export interface TenantModels {
  User: Model<any>;
  Team: Model<any>;
  Project: Model<any>;
  Pipeline: Model<any>;
  Task: Model<any>;
  TaskNode: Model<any>;
  Deal: Model<any>;
  Lead: Model<any>;
  Campaign: Model<any>;
  Cycle: Model<any>;
  Goal: Model<any>;
  DailyGoal: Model<any>;
  Target: Model<any>;
  Assignment: Model<any>;
  ActivityLog: Model<any>;
  StatusSnapshot: Model<any>;
  ResourceAllocation: Model<any>;
  CustomerFeedback: Model<any>;
  List: Model<any>;
  Item: Model<any>;
  Document: Model<any>;
  ClientAccount: Model<any>;
  Meeting: Model<any>;
}

/**
 * Normalizes an organization code or slug to a clean, isolated database name
 * Example: 'ORGTTV' -> 'projectManageDB_ORGTTV'
 */
export function getTenantDbName(companyCode: string): string {
  const cleanCode = (companyCode || "DEFAULT")
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
  return `projectManageDB_${cleanCode}`;
}

/**
 * Retrieves or initializes an isolated tenant connection for a company
 */
export async function getTenantConnection(companyCode: string): Promise<Connection> {
  await connectToDatabase();
  const dbName = getTenantDbName(companyCode);
  return mongoose.connection.useDb(dbName, { useCache: true });
}

/**
 * Maps and caches isolated models bound to the company's dedicated database
 */
const tenantModelsCache = new Map<string, TenantModels>();

export async function getTenantModels(companyCode: string): Promise<TenantModels> {
  const dbName = getTenantDbName(companyCode);
  if (tenantModelsCache.has(dbName)) {
    return tenantModelsCache.get(dbName)!;
  }

  const tenantConn = await getTenantConnection(companyCode);

  const getOrCompile = (name: string, fallbackModel: Model<any>): Model<any> => {
    return tenantConn.models[name] || tenantConn.model(name, fallbackModel.schema);
  };

  const models: TenantModels = {
    User: getOrCompile("User", User),
    Team: getOrCompile("Team", Team),
    Project: getOrCompile("Project", Project),
    Pipeline: getOrCompile("Pipeline", Pipeline),
    Task: getOrCompile("Task", Task),
    TaskNode: getOrCompile("TaskNode", TaskNode),
    Deal: getOrCompile("Deal", Deal),
    Lead: getOrCompile("Lead", Lead),
    Campaign: getOrCompile("Campaign", Campaign),
    Cycle: getOrCompile("Cycle", Cycle),
    Goal: getOrCompile("Goal", Goal),
    DailyGoal: getOrCompile("DailyGoal", DailyGoal),
    Target: getOrCompile("Target", Target),
    Assignment: getOrCompile("Assignment", Assignment),
    ActivityLog: getOrCompile("ActivityLog", ActivityLog),
    StatusSnapshot: getOrCompile("StatusSnapshot", StatusSnapshot),
    ResourceAllocation: getOrCompile("ResourceAllocation", ResourceAllocation),
    CustomerFeedback: getOrCompile("CustomerFeedback", CustomerFeedback),
    List: getOrCompile("List", List),
    Item: getOrCompile("Item", Item),
    Document: getOrCompile("Document", Document),
    ClientAccount: getOrCompile("ClientAccount", ClientAccount),
    Meeting: getOrCompile("Meeting", Meeting),
  };

  tenantModelsCache.set(dbName, models);
  return models;
}

/**
 * Migrates data from the shared database into the company's dedicated isolated database
 */
export async function migrateCompanyToDedicatedDb(companyCode: string, companyId: string) {
  await connectToDatabase();
  const tenantConn = await getTenantConnection(companyCode);
  const tenantModels = await getTenantModels(companyCode);

  // Pre-initialize and physically create all 21 collection folders in the dedicated tenant DB
  // Ensures MongoDB Atlas and Compass immediately display every collection folder for the registered company
  const allCollectionNames = [
    "users",
    "teams",
    "projects",
    "pipelines",
    "tasks",
    "tasknodes",
    "deals",
    "leads",
    "campaigns",
    "cycles",
    "goals",
    "dailygoals",
    "targets",
    "assignments",
    "activitylogs",
    "statussnapshots",
    "resourceallocations",
    "customerfeedbacks",
    "lists",
    "items",
    "documents",
    "clientaccounts",
    "meetings",
  ];

  for (const col of allCollectionNames) {
    try {
      if (tenantConn.db) {
        await tenantConn.db.createCollection(col);
      }
    } catch {
      // Ignore if collection already exists
    }
  }

  const collectionsToMigrate: Array<{ name: string; source: Model<any>; target: Model<any> }> = [
    { name: "User", source: User, target: tenantModels.User },
    { name: "Team", source: Team, target: tenantModels.Team },
    { name: "Project", source: Project, target: tenantModels.Project },
    { name: "Pipeline", source: Pipeline, target: tenantModels.Pipeline },
    { name: "TaskNode", source: TaskNode, target: tenantModels.TaskNode },
    { name: "Deal", source: Deal, target: tenantModels.Deal },
    { name: "Lead", source: Lead, target: tenantModels.Lead },
    { name: "Campaign", source: Campaign, target: tenantModels.Campaign },
    { name: "Cycle", source: Cycle, target: tenantModels.Cycle },
    { name: "Goal", source: Goal, target: tenantModels.Goal },
    { name: "DailyGoal", source: DailyGoal, target: tenantModels.DailyGoal },
    { name: "Target", source: Target, target: tenantModels.Target },
    { name: "Assignment", source: Assignment, target: tenantModels.Assignment },
    { name: "ActivityLog", source: ActivityLog, target: tenantModels.ActivityLog },
    { name: "StatusSnapshot", source: StatusSnapshot, target: tenantModels.StatusSnapshot },
    { name: "ResourceAllocation", source: ResourceAllocation, target: tenantModels.ResourceAllocation },
    { name: "CustomerFeedback", source: CustomerFeedback, target: tenantModels.CustomerFeedback },
    { name: "List", source: List, target: tenantModels.List },
    { name: "Item", source: Item, target: tenantModels.Item },
    { name: "Document", source: Document, target: tenantModels.Document },
    { name: "ClientAccount", source: ClientAccount, target: tenantModels.ClientAccount },
    { name: "Meeting", source: Meeting, target: tenantModels.Meeting },
  ];

  const results: Record<string, number> = {};

  for (const { name, source, target } of collectionsToMigrate) {
    try {
      let docs: any[] = [];
      if (name === "Cycle") {
        // Cycles might have companyId, or link to projects belonging to this company
        const projects = await Project.find({ companyId }).select("_id").lean();
        const projectIds = projects.map((p: any) => p._id);
        docs = await source
          .find({
            $or: [{ companyId }, { project: { $in: projectIds } }],
          })
          .lean();
        // Also ensure companyId is set on source if missing
        if (docs.length > 0) {
          await source.updateMany(
            { _id: { $in: docs.map((d: any) => d._id) } },
            { $set: { companyId } }
          );
        }
        docs = docs.map((d: any) => ({ ...d, companyId }));
      } else {
        docs = await source.find({ companyId }).lean();
      }

      if (docs && docs.length > 0) {
        for (const doc of docs) {
          await target.updateOne({ _id: (doc as any)._id }, { $set: doc }, { upsert: true });
        }
      }
      results[name] = docs.length;
    } catch {
      results[name] = 0;
    }
  }

  return {
    success: true,
    tenantDb: getTenantDbName(companyCode),
    migrated: results,
  };
}

/**
 * Automatically synchronizes model writes to the tenant's isolated database (projectManageDB_{CODE})
 * ensuring all collections (cycles, tasknodes, teams, pipelines, goals, etc.) stay in sync.
 */
export async function syncTenantWrite(
  modelName: keyof TenantModels,
  operation: "create" | "update" | "delete",
  docOrFilter: any,
  updatePayload?: any,
  companyCode?: string
) {
  let targetCode = companyCode;
  if (!targetCode && docOrFilter?.companyId) {
    try {
      const comp = await Company.findById(docOrFilter.companyId).select("companyCode").lean();
      if (comp) targetCode = (comp as any).companyCode;
    } catch {}
  }
  if (!targetCode) return;
  try {
    const tenantModels = await getTenantModels(targetCode);
    const targetModel = tenantModels[modelName];
    if (!targetModel) return;

    if (operation === "create") {
      const cleanDoc = docOrFilter && typeof docOrFilter.toObject === "function" 
        ? docOrFilter.toObject() 
        : docOrFilter;
      if (cleanDoc && cleanDoc._id) {
        await targetModel.updateOne(
          { _id: cleanDoc._id },
          { $set: cleanDoc },
          { upsert: true }
        );
      }
    } else if (operation === "update") {
      const filter = typeof docOrFilter === "string" ? { _id: docOrFilter } : docOrFilter;
      await targetModel.updateOne(filter, updatePayload);
    } else if (operation === "delete") {
      const filter = typeof docOrFilter === "string" ? { _id: docOrFilter } : docOrFilter;
      await targetModel.deleteOne(filter);
    }
  } catch (err) {
    console.warn(`[syncTenantWrite] Warning syncing ${modelName} to tenant ${targetCode}:`, err);
  }
}

