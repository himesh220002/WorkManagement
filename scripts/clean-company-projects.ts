import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set");
  process.exit(1);
}

const targetCode = process.argv[2] || "ORGTTU";

async function main() {
  await mongoose.connect(uri!);
  const mainDb = mongoose.connection.db!;
  console.log(`Connected to main DB: ${mongoose.connection.name}`);

  const comp = await mainDb.collection("companies").findOne({ companyCode: targetCode });
  if (!comp) {
    console.error(`Company with code ${targetCode} not found!`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const cId = comp._id;
  console.log(`Target company: ${comp.name} (${targetCode}) [${cId}]`);

  // 1. In main DB:
  const tasksBefore = await mainDb.collection("tasknodes").countDocuments({ companyId: cId });
  const pipesBefore = await mainDb.collection("pipelines").countDocuments({ companyId: cId });
  const projsBefore = await mainDb.collection("projects").countDocuments({ companyId: cId });
  const cyclesBefore = await mainDb.collection("cycles").countDocuments({ companyId: cId });
  const snapsBefore = await mainDb.collection("pipelineprogresssnapshots").countDocuments({ companyId: cId });
  const resBefore = await mainDb.collection("resourceallocations").countDocuments({ companyId: cId });
  const teams = await mainDb.collection("teams").find({ companyId: cId }).toArray();

  console.log(`Main DB before cleanup:
  - Tasks: ${tasksBefore}
  - Pipelines: ${pipesBefore}
  - Projects: ${projsBefore}
  - Cycles: ${cyclesBefore}
  - Snapshots: ${snapsBefore}
  - Resource Allocations: ${resBefore}
  - Teams (preserved): ${teams.length} (${teams.map(t => t.name).join(", ")})
  `);

  // Delete all tasks, pipelines, projects, cycles, snapshots, resourceallocations for company
  const delTasks = await mainDb.collection("tasknodes").deleteMany({ companyId: cId });
  const delPipes = await mainDb.collection("pipelines").deleteMany({ companyId: cId });
  const delProjs = await mainDb.collection("projects").deleteMany({ companyId: cId });
  const delCycles = await mainDb.collection("cycles").deleteMany({ companyId: cId });
  const delSnaps = await mainDb.collection("pipelineprogresssnapshots").deleteMany({ companyId: cId });
  const delRes = await mainDb.collection("resourceallocations").deleteMany({ companyId: cId });

  // Reset projectIds on teams without deleting the teams
  const teamUpdate = await mainDb.collection("teams").updateMany(
    { companyId: cId },
    { $set: { projectIds: [] } }
  );

  console.log(`Main DB cleaned:
  - Deleted tasks: ${delTasks.deletedCount}
  - Deleted pipelines: ${delPipes.deletedCount}
  - Deleted projects: ${delProjs.deletedCount}
  - Deleted cycles: ${delCycles.deletedCount}
  - Deleted snapshots: ${delSnaps.deletedCount}
  - Deleted resource allocations: ${delRes.deletedCount}
  - Reset projectIds on teams: ${teamUpdate.modifiedCount}
  `);

  // 2. In tenant DB (e.g. projectManageDB_ORGTTU)
  const tenantDbName = `projectManageDB_${targetCode.toUpperCase().replace(/[^A-Z0-9_]/g, "_")}`;
  const tenantDb = mongoose.connection.useDb(tenantDbName);
  console.log(`Cleaning tenant DB: ${tenantDbName}...`);

  try {
    const tTasks = await tenantDb.collection("tasknodes").deleteMany({});
    const tPipes = await tenantDb.collection("pipelines").deleteMany({});
    const tProjs = await tenantDb.collection("projects").deleteMany({});
    const tCycles = await tenantDb.collection("cycles").deleteMany({});
    const tSnaps = await tenantDb.collection("pipelineprogresssnapshots").deleteMany({});
    const tRes = await tenantDb.collection("resourceallocations").deleteMany({});
    const tTeams = await tenantDb.collection("teams").updateMany({}, { $set: { projectIds: [] } });

    console.log(`Tenant DB cleaned:
    - Deleted tasks: ${tTasks.deletedCount}
    - Deleted pipelines: ${tPipes.deletedCount}
    - Deleted projects: ${tProjs.deletedCount}
    - Deleted cycles: ${tCycles.deletedCount}
    - Deleted snapshots: ${tSnaps.deletedCount}
    - Deleted resource allocations: ${tRes.deletedCount}
    - Reset projectIds on teams: ${tTeams.modifiedCount}
    `);
  } catch (err) {
    console.warn(`Tenant DB cleanup notice:`, err);
  }

  console.log("Cleanup completed successfully! Teams and users remain intact.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
