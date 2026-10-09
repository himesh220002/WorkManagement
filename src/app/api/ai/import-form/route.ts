import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { getCurrentSession } from "@/server/auth/session";
import { Form } from "@/models";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    const { formTitle, formDescription, questions, targetProjectId } = await req.json();

    if (!formTitle || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ success: false, error: "Invalid form payload." }, { status: 400 });
    }

    const companyIdToUse = session.companyId
      ? new mongoose.Types.ObjectId(session.companyId.toString())
      : new mongoose.Types.ObjectId("000000000000000000000000");

    const newForm = await Form.create({
      companyId: companyIdToUse,
      title: formTitle,
      description: formDescription || "AI Generated Form via TaskPMS Intelligence",
      templateId: "scratch",
      themeColor: "#0078D4",
      isPublished: true,
      submitButtonText: "Submit Response",
      createTaskOnSubmission: true,
      targetProjectId: targetProjectId || undefined,
      questions: questions.map((q: any, idx: number) => ({
        id: q.id || `q-${idx + 1}-${Date.now()}`,
        type: q.type || "short_text",
        title: q.title || `Question ${idx + 1}`,
        description: q.description || "",
        placeholder: q.placeholder || "",
        required: q.required ?? true,
        options: q.options || [],
      })),
      submissions: [],
      authorName: session.name || "AI Assistant",
      authorId: session.userId || "",
    });

    return NextResponse.json({
      success: true,
      formId: newForm._id.toString(),
      message: "Form successfully imported into Forms & Surveys!",
    });
  } catch (error: any) {
    console.error("Failed to import AI form:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
