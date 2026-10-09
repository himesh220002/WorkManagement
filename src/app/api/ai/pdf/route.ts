import { NextRequest, NextResponse } from "next/server";
import { generateReportPDF } from "@/server/ai/pdfExporter";
import connectToDatabase from "@/lib/mongodb";
import { AIReport } from "@/models";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { title, category, companyName, model, createdAt, metrics, content, reportId } = body;

    // If reportId provided, fetch from DB
    if (reportId && !content) {
      await connectToDatabase();
      const report = await AIReport.findById(reportId).lean();
      if (report) {
        title = (report as any).title;
        category = (report as any).type;
        model = (report as any).model;
        createdAt = (report as any).createdAt;
        metrics = (report as any).metrics;
        content = (report as any).content;
      }
    }

    if (!content) {
      return NextResponse.json({ success: false, error: "Content is required for PDF export." }, { status: 400 });
    }

    const pdfBytes = await generateReportPDF({
      title: title || "TaskPMS Executive AI Report",
      category: category || "project",
      companyName: companyName || "TaskPMS Organization",
      model: model || "gemini-3.7-flash",
      createdAt: createdAt || new Date(),
      metrics,
      content,
    });

    const safeFilename = (title || "TaskPMS_AI_Report")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40) + ".pdf";

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Length": pdfBytes.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("PDF generation failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
