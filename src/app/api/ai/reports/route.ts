import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { getCurrentSession } from "@/server/auth/session";
import { AIReport } from "@/models";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    const filter: any = {};
    if (session.companyId) {
      try {
        filter.companyId = new mongoose.Types.ObjectId(session.companyId.toString());
      } catch {
        filter.companyId = session.companyId;
      }
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    if (type && type !== "all") {
      filter.type = type;
    }

    const reports = await AIReport.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      reports: reports.map((r: any) => ({
        id: r._id.toString(),
        title: r.title,
        type: r.type,
        scope: r.scope,
        model: r.model,
        summary: r.summary,
        metrics: r.metrics,
        authorName: r.authorName,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Failed to fetch AI reports:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reports." },
      { status: 500 }
    );
  }
}
