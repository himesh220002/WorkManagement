import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { getCurrentSession } from "@/server/auth/session";
import { aggregateWorkspaceContext } from "@/server/ai/contextAggregator";
import { generateWithGemini } from "@/server/ai/geminiClient";
import { AIReport, Company } from "@/models";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    const body = await req.json();
    const {
      type = "project",
      scope = "All Projects",
      projectId,
      customPrompt,
      tone = "executive",
      model = "gemini-3.7-flash",
      apiKey,
      saveKey = false,
      temperature = 0.7,
    } = body;

    // Resolve API key: body key -> company saved key -> env key
    let resolvedApiKey = apiKey;
    if (!resolvedApiKey && session.companyId) {
      const company = await Company.findById(session.companyId).select("aiConfig").lean();
      if (company?.aiConfig?.geminiApiKey) {
        resolvedApiKey = company.aiConfig.geminiApiKey;
      }
    }
    if (!resolvedApiKey && process.env.GEMINI_API_KEY) {
      resolvedApiKey = process.env.GEMINI_API_KEY;
    }

    // Save key to company if user checked "Remember key"
    if (apiKey && saveKey && session.companyId) {
      await Company.findByIdAndUpdate(session.companyId, {
        $set: {
          "aiConfig.geminiApiKey": apiKey,
          "aiConfig.defaultModel": model,
          "aiConfig.temperature": temperature,
          "aiConfig.updatedAt": new Date(),
        },
      });
    }

    // 1. Aggregate real workspace context
    const context = await aggregateWorkspaceContext(session.companyId, projectId);

    // 2. Generate Report via Gemini / Grounded Engine
    const aiResult = await generateWithGemini(
      {
        type,
        scope,
        projectId,
        customPrompt,
        tone,
        model,
        apiKey: resolvedApiKey,
        temperature,
      },
      context
    );

    // 3. Persist to AIReport model
    let savedReport = null;
    const companyIdToUse = session.companyId
      ? new mongoose.Types.ObjectId(session.companyId.toString())
      : new mongoose.Types.ObjectId("000000000000000000000000");

    try {
      savedReport = await AIReport.create({
        companyId: companyIdToUse,
        title: aiResult.title,
        type,
        scope,
        model: aiResult.modelUsed,
        summary: aiResult.summary,
        content: aiResult.content,
        metrics: aiResult.metrics,
        structuredData: aiResult.structuredData,
        authorName: session.name || session.email?.split("@")[0] || "User",
        authorId: session.userId || "",
      });
    } catch (saveErr) {
      console.warn("Could not save AIReport to DB:", saveErr);
    }

    return NextResponse.json({
      success: true,
      report: {
        id: savedReport?._id?.toString() || `report-${Date.now()}`,
        title: aiResult.title,
        type,
        scope,
        model: aiResult.modelUsed,
        summary: aiResult.summary,
        content: aiResult.content,
        metrics: aiResult.metrics,
        structuredData: aiResult.structuredData,
        isByok: aiResult.isByok,
        createdAt: savedReport?.createdAt || new Date(),
      },
    });
  } catch (error: any) {
    console.error("AI Generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate AI report.",
      },
      { status: 500 }
    );
  }
}
