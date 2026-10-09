import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Project } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const tenantFilter = getTenantQueryFilter(session);

    const projects = await Project.find(tenantFilter)
      .select("_id name status health category deadline")
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      success: true,
      projects: (projects || []).map((p: any) => ({
        _id: p._id.toString(),
        id: p._id.toString(),
        name: p.name,
        status: p.status,
        health: p.health,
        category: p.category,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
