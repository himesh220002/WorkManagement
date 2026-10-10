import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Pipeline, TaskNode as Task } from "@/models";
import { PipelineProgressSnapshot } from "@/models/pipelineSnapshot";
import { computePipelineProgress } from "@/utils/pipelineProgress";

/**
 * Daily 5pm pipeline progress snapshotter.
 * Records one row per pipeline per day (YYYY-MM-DD UTC) so bars can show
 * day-before -> yesterday -> today pairs with +deltas, immune to weekends.
 *
 * Trigger daily at 17:00 (Vercel Cron, EventBridge, or curl):
 *   curl -X POST "https://<host>/api/cron/pipeline-snapshots" \
 *        -H "Authorization: Bearer <CRON_SECRET>"
 *
 * Vercel cron (vercel.json):
 *   { "crons": [{ "path": "/api/cron/pipeline-snapshots", "schedule": "0 17 * * *" }] }
 */
export async function GET(req: NextRequest) {
  return handleSnapshot(req);
}

export async function POST(req: NextRequest) {
  return handleSnapshot(req);
}

function todayKey(d = new Date()) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function handleSnapshot(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET || "default_snapshot_secret";

  if (authHeader !== `Bearer ${expectedSecret}` && querySecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized: Invalid CRON_SECRET" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const date = req.nextUrl.searchParams.get("date") || todayKey();

    const pipelines = await Pipeline.find({}).select("_id companyId projectId todos progress").lean() as any[];
    let recorded = 0;

    for (const p of pipelines) {
      const linked = await Task.find({ pipelineId: p._id }).select("status progress subtasks").lean() as any[];
      const progress = computePipelineProgress(
        { progress: Number(p.progress || 0), todos: p.todos || [] },
        Array.isArray(linked) ? linked : []
      );
      const todos = Array.isArray(p.todos) ? p.todos : [];
      await PipelineProgressSnapshot.updateOne(
        { pipelineId: p._id, date },
        {
          $set: {
            companyId: p.companyId,
            projectId: p.projectId || null,
            progress,
            todoDone: todos.filter((t: any) => Boolean(t?.completed)).length,
            todoTotal: todos.length,
            taskUnits: linked.length,
          },
        },
        { upsert: true }
      );
      recorded += 1;
    }

    return NextResponse.json({ success: true, date, pipelines: recorded });
  } catch (error: any) {
    console.error("Pipeline snapshot cron failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Snapshot failed" },
      { status: 500 }
    );
  }
}
