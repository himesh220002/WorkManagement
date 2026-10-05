import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

const isDryRun = process.argv.includes("--dry-run");

interface MigrationReport {
  timestamp: string;
  isDryRun: boolean;
  companyCreated: boolean;
  companyId: string;
  projectsUpdated: number;
  teamsUpdated: number;
  usersUpdated: number;
  tasksUpdated: number;
  pipelinesUpdated: number;
  dealsUpdated: number;
  leadsUpdated: number;
  goalsUpdated: number;
  targetsUpdated: number;
  createdUnverifiedUsers: string[];
  normalizedTaskStatuses: number;
  errors: string[];
}

async function runMigration() {
  console.log(`🚀 Starting v2 migration (${isDryRun ? "DRY-RUN mode" : "LIVE mode"})...`);

  await mongoose.connect(uri!);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Could not access database instance");
  }

  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    isDryRun,
    companyCreated: false,
    companyId: "",
    projectsUpdated: 0,
    teamsUpdated: 0,
    usersUpdated: 0,
    tasksUpdated: 0,
    pipelinesUpdated: 0,
    dealsUpdated: 0,
    leadsUpdated: 0,
    goalsUpdated: 0,
    targetsUpdated: 0,
    createdUnverifiedUsers: [],
    normalizedTaskStatuses: 0,
    errors: [],
  };

  try {
    // 1. Ensure default company
    const companiesColl = db.collection("companies");
    let defaultCompany = await companiesColl.findOne({ slug: "default-org" });

    if (!defaultCompany) {
      if (!isDryRun) {
        const insertRes = await companiesColl.insertOne({
          name: "TaskFlow Organization",
          slug: "default-org",
          industry: "Technology",
          fiscalYearStart: "01-01",
          settings: {
            currency: "USD",
            timezone: "UTC",
            workingDays: [1, 2, 3, 4, 5],
          },
          status: "Active",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        defaultCompany = { _id: insertRes.insertedId };
      } else {
        defaultCompany = { _id: new mongoose.Types.ObjectId() };
      }
      report.companyCreated = true;
    }
    const defaultCompanyId = defaultCompany._id;
    report.companyId = defaultCompanyId.toString();
    console.log(`🏢 Default Company ID: ${report.companyId}`);

    // Helper for finding or creating user by name
    const usersColl = db.collection("users");
    const userCache = new Map<string, mongoose.Types.ObjectId>();

    const allUsers = await usersColl.find({}).toArray();
    for (const u of allUsers) {
      if (u.name) {
        userCache.set(u.name.trim().toLowerCase(), u._id as mongoose.Types.ObjectId);
      }
    }

    async function getOrCreateUserId(nameStr?: string): Promise<mongoose.Types.ObjectId | null> {
      if (!nameStr || nameStr.trim() === "" || nameStr.toLowerCase() === "unassigned") {
        return null;
      }
      const trimmed = nameStr.trim();
      const key = trimmed.toLowerCase();
      if (userCache.has(key)) {
        return userCache.get(key)!;
      }

      if (!isDryRun) {
        const newU = await usersColl.insertOne({
          name: trimmed,
          companyId: defaultCompanyId,
          role: "Member",
          status: "Working",
          details: "Auto-created during v2 migration (unverified)",
          capacityHoursPerWeek: 40,
          joinedDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        userCache.set(key, newU.insertedId as mongoose.Types.ObjectId);
        report.createdUnverifiedUsers.push(trimmed);
        return newU.insertedId as mongoose.Types.ObjectId;
      } else {
        report.createdUnverifiedUsers.push(trimmed);
        const dummyId = new mongoose.Types.ObjectId();
        userCache.set(key, dummyId);
        return dummyId;
      }
    }

    // 2. Backfill companyId on Users
    const usersRes = await usersColl.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: defaultCompanyId } }
    );
    report.usersUpdated = usersRes.modifiedCount;

    // 3. Projects
    const projectsColl = db.collection("projects");
    const projRes = await projectsColl.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: defaultCompanyId, health: "On Track" } }
    );
    report.projectsUpdated = projRes.modifiedCount;

    // 4. Teams
    const teamsColl = db.collection("teams");
    const teamsRes = await teamsColl.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: defaultCompanyId, capacityHoursPerWeek: 40 } }
    );
    report.teamsUpdated = teamsRes.modifiedCount;

    // 5. Goals
    const goalsColl = db.collection("goals");
    const goalsRes = await goalsColl.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: defaultCompanyId, scope: "Company" } }
    );
    report.goalsUpdated = goalsRes.modifiedCount;

    // 6. Targets
    const targetsColl = db.collection("targets");
    const targetsRes = await targetsColl.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: defaultCompanyId } }
    );
    report.targetsUpdated = targetsRes.modifiedCount;

    // 7. Tasks / TaskNodes
    const tasksColl = db.collection("tasknodes");
    const tasks = await tasksColl.find({}).toArray();
    for (const t of tasks) {
      const updates: Record<string, unknown> = {};
      if (!t.companyId) {
        updates.companyId = defaultCompanyId;
      }

      // Normalize status
      const currentStatus = String(t.status || "").toLowerCase();
      let normalizedStatus = t.status;
      if (currentStatus === "active") {
        normalizedStatus = "In Progress";
        report.normalizedTaskStatuses++;
      } else if (currentStatus === "todo") {
        normalizedStatus = "Todo";
      } else if (currentStatus === "done") {
        normalizedStatus = "Done";
      } else if (currentStatus === "blocked") {
        normalizedStatus = "Blocked";
      }
      if (normalizedStatus !== t.status) {
        updates.status = normalizedStatus;
      }

      // Map assignee
      if (t.assignee && (!t.assigneeIds || t.assigneeIds.length === 0)) {
        const uid = await getOrCreateUserId(t.assignee);
        if (uid) {
          updates.assigneeIds = [uid];
          updates.assignees = [uid];
        }
      }

      if (Object.keys(updates).length > 0) {
        if (!isDryRun) {
          await tasksColl.updateOne({ _id: t._id }, { $set: updates });
        }
        report.tasksUpdated++;
      }
    }

    // 8. Pipelines
    const pipelinesColl = db.collection("pipelines");
    const pipelines = await pipelinesColl.find({}).toArray();
    for (const p of pipelines) {
      const updates: Record<string, unknown> = {};
      if (!p.companyId) {
        updates.companyId = defaultCompanyId;
      }
      if (p.owner && !p.ownerId) {
        const uid = await getOrCreateUserId(p.owner);
        if (uid) updates.ownerId = uid;
      }
      if (p.todos && Array.isArray(p.todos)) {
        let changedTodos = false;
        const newTodos = await Promise.all(
          p.todos.map(async (todo: any) => {
            if (todo.assigneeName && !todo.assigneeId) {
              const uid = await getOrCreateUserId(todo.assigneeName);
              if (uid) {
                changedTodos = true;
                return { ...todo, assigneeId: uid };
              }
            }
            return todo;
          })
        );
        if (changedTodos) {
          updates.todos = newTodos;
        }
      }
      if (Object.keys(updates).length > 0) {
        if (!isDryRun) {
          await pipelinesColl.updateOne({ _id: p._id }, { $set: updates });
        }
        report.pipelinesUpdated++;
      }
    }

    // 9. Deals
    const dealsColl = db.collection("deals");
    const deals = await dealsColl.find({}).toArray();
    for (const d of deals) {
      const updates: Record<string, unknown> = {};
      if (!d.companyId) updates.companyId = defaultCompanyId;
      if (d.owner && !d.ownerId) {
        const uid = await getOrCreateUserId(d.owner);
        if (uid) updates.ownerId = uid;
      }
      if (Object.keys(updates).length > 0) {
        if (!isDryRun) {
          await dealsColl.updateOne({ _id: d._id }, { $set: updates });
        }
        report.dealsUpdated++;
      }
    }

    // 10. Leads
    const leadsColl = db.collection("leads");
    const leads = await leadsColl.find({}).toArray();
    for (const l of leads) {
      const updates: Record<string, unknown> = {};
      if (!l.companyId) updates.companyId = defaultCompanyId;
      if (l.owner && !l.ownerId) {
        const uid = await getOrCreateUserId(l.owner);
        if (uid) updates.ownerId = uid;
      }
      if (Object.keys(updates).length > 0) {
        if (!isDryRun) {
          await leadsColl.updateOne({ _id: l._id }, { $set: updates });
        }
        report.leadsUpdated++;
      }
    }

    console.log("✅ Migration completed successfully!");
    console.log(JSON.stringify(report, null, 2));

    const reportPath = path.resolve(process.cwd(), "scripts/migration-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Written report to ${reportPath}`);
  } catch (err: any) {
    console.error("❌ Migration error:", err);
    report.errors.push(err.message || String(err));
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database.");
  }
}

runMigration();
