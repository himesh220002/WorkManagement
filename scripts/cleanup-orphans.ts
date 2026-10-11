import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

/**
 * Orphan audit + repair for the Project -> Pipeline -> Task -> Branch chain.
 *
 *   npx tsx scripts/cleanup-orphans.ts            # dry run (report only)
 *   npx tsx scripts/cleanup-orphans.ts --fix      # apply: delete orphan tasks/pipelines/snapshots, unlink dangling pipeline refs
 *
 * Rules (mirror the app delete semantics):
 *  - Task whose projectId points to a missing Project  -> ORPHAN (deleted with --fix)
 *  - Pipeline whose projectId points to a missing Project -> ORPHAN (deleted with --fix)
 *  - Task whose pipelineId points to a missing Pipeline -> DANGLING (unlinked to No Pipeline with --fix)
 *  - Cycle whose project points to a missing Project   -> ORPHAN (deleted with --fix)
 *  - Snapshot whose pipelineId/projectId no longer exists -> ORPHAN (deleted with --fix)
 */
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set in environment or .env");
  process.exit(1);
}
const FIX = process.argv.includes("--fix");

async function main() {
  await mongoose.connect(uri!);
  const db = mongoose.connection.db!;
  console.log(`Connected to ${mongoose.connection.name}  [${FIX ? "FIX MODE" : "DRY RUN"}]`);

  const projectIds = new Set((await db.collection("projects").find({}, { projection: { _id: 1 } }).toArray()).map((d) => String(d._id)));
  const pipelineIds = new Set((await db.collection("pipelines").find({}, { projection: { _id: 1 } }).toArray()).map((d) => String(d._id)));

  const tasks = await db.collection("tasknodes").find({}).project({ _id: 1, name: 1, projectId: 1, pipelineId: 1 }).toArray();
  const orphanTasks = tasks.filter((t: any) => t.projectId && !projectIds.has(String(t.projectId)));
  const danglingPipeTasks = tasks.filter((t: any) => t.pipelineId && !pipelineIds.has(String(t.pipelineId)));

  const pipes = await db.collection("pipelines").find({}).project({ _id: 1, name: 1, projectId: 1 }).toArray();
  const orphanPipes = pipes.filter((p: any) => p.projectId && !projectIds.has(String(p.projectId)));

  const cycles = await db.collection("cycles").find({}).project({ _id: 1, name: 1, project: 1 }).toArray();
  const orphanCycles = cycles.filter((c: any) => c.project && !projectIds.has(String(c.project)));

  const snaps = await db.collection("pipelineprogresssnapshots").find({}).project({ _id: 1, pipelineId: 1, projectId: 1 }).toArray().catch(() => []);
  const orphanSnaps = (snaps || []).filter(
    (s: any) =>
      (s.pipelineId && !pipelineIds.has(String(s.pipelineId))) ||
      (s.projectId && !projectIds.has(String(s.projectId)))
  );

  console.log(`\nProjects: ${projectIds.size} | Pipelines: ${pipes.length} | Tasks: ${tasks.length} | Cycles: ${cycles.length} | Snapshots: ${(snaps || []).length}`);
  console.log(`\nORPHAN tasks (project gone): ${orphanTasks.length}`);
  orphanTasks.slice(0, 20).forEach((t: any) => console.log(`  - ${t._id} "${t.name}" projectId=${t.projectId}`));
  console.log(`DANGLING pipeline refs on tasks: ${danglingPipeTasks.length}`);
  danglingPipeTasks.slice(0, 20).forEach((t: any) => console.log(`  - ${t._id} "${t.name}" pipelineId=${t.pipelineId}`));
  console.log(`ORPHAN pipelines (project gone): ${orphanPipes.length}`);
  orphanPipes.slice(0, 20).forEach((p: any) => console.log(`  - ${p._id} "${p.name}" projectId=${p.projectId}`));
  console.log(`ORPHAN cycles (project gone): ${orphanCycles.length}`);
  console.log(`ORPHAN snapshots: ${orphanSnaps.length}`);

  if (!FIX) {
    console.log("\nDry run — nothing changed. Re-run with --fix to repair.");
    await mongoose.disconnect();
    process.exit(0);
  }

  if (orphanTasks.length > 0) {
    const r = await db.collection("tasknodes").deleteMany({ _id: { $in: orphanTasks.map((t: any) => t._id) } });
    console.log(`Deleted ${r.deletedCount} orphan tasks.`);
  }
  if (danglingPipeTasks.length > 0) {
    const r = await db.collection("tasknodes").updateMany(
      { _id: { $in: danglingPipeTasks.map((t: any) => t._id) } },
      { $set: { pipelineId: null, stageRef: "" } }
    );
    console.log(`Unlinked ${r.modifiedCount} tasks from deleted pipelines (now No Pipeline).`);
  }
  if (orphanPipes.length > 0) {
    const r = await db.collection("pipelines").deleteMany({ _id: { $in: orphanPipes.map((p: any) => p._id) } });
    console.log(`Deleted ${r.deletedCount} orphan pipelines.`);
  }
  if (orphanCycles.length > 0) {
    const r = await db.collection("cycles").deleteMany({ _id: { $in: orphanCycles.map((c: any) => c._id) } });
    console.log(`Deleted ${r.deletedCount} orphan cycles.`);
  }
  if (orphanSnaps.length > 0) {
    const r = await db.collection("pipelineprogresssnapshots").deleteMany({ _id: { $in: orphanSnaps.map((s: any) => s._id) } });
    console.log(`Deleted ${r.deletedCount} orphan snapshots.`);
  }

  console.log("Done. Restart `next dev` (or wait ~30s for TTL caches) so all dashboards re-read fresh data.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
