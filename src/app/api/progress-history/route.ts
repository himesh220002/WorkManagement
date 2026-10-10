import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Pipeline } from "@/models";
import { PipelineProgressSnapshot } from "@/models/pipelineSnapshot";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { tripleFromSnapshots } from "@/lib/progressHistory";

/**
 * Progress history triples for the daily-delta bars.
 * GET /api/progress-history?scope=pipeline|project|company&id=<id>
 * Returns the last 3 recorded days ascending with pairwise deltas, e.g.
 * dayBefore -> yesterday -> today with +howmuch each step. Missing days
 * (weekends) are simply absent, so pairs never lie.
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const tenantFilter = getTenantQueryFilter(session);
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "pipeline";
    const id = searchParams.get("id") || "";

    let pipelineIds: string[] = [];
    if (scope === "pipeline") {
      if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
      pipelineIds = [id];
    } else if (scope === "project") {
      if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
      const pipes = await Pipeline.find({ ...tenantFilter, projectId: id }).select("_id").lean();
      pipelineIds = pipes.map((p: any) => String(p._id));
    } else {
      const pipes = await Pipeline.find({ ...tenantFilter }).select("_id").lean();
      pipelineIds = pipes.map((p: any) => String(p._id));
    }

    if (pipelineIds.length === 0) {
      return NextResponse.json({ success: true, points: [], deltas: [] });
    }

    const rows = (await PipelineProgressSnapshot.find({ pipelineId: { $in: pipelineIds } })
      .sort({ date: -1 })
      .limit(pipelineIds.length * 5)
      .lean()) as any[];

    const { points, deltas } = tripleFromSnapshots(rows, pipelineIds);

    return NextResponse.json({ success: true, points, deltas });
  } catch (error: any) {
    console.error("Progress history failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load history" },
      { status: 500 }
    );
  }
}
