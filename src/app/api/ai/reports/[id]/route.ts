import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { getCurrentSession } from "@/server/auth/session";
import { AIReport } from "@/models";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const report = await AIReport.findById(id).lean();
    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      report: {
        id: (report as any)._id.toString(),
        title: report.title,
        type: report.type,
        scope: report.scope,
        model: report.model,
        summary: report.summary,
        content: report.content,
        metrics: report.metrics,
        structuredData: report.structuredData,
        authorName: report.authorName,
        createdAt: report.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    await AIReport.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Report deleted." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
