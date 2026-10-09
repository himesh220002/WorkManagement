import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Form } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { FORM_TEMPLATES } from "@/lib/formTemplates";
import { syncTenantWrite } from "@/lib/tenantDb";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const tenantFilter = getTenantQueryFilter(session);

    let forms = await Form.find(tenantFilter).sort({ updatedAt: -1, createdAt: -1 }).lean();

    // If no forms exist yet, pre-seed with default editable Project Intake and Feedback forms
    if (!forms || forms.length === 0) {
      const authorName = session.name || session.email?.split("@")[0] || "Admin";
      const projectIntakeTemplate = FORM_TEMPLATES.find((t) => t.id === "project-intake")!;
      const feedbackTemplate = FORM_TEMPLATES.find((t) => t.id === "feedback")!;

      try {
        const defaultIntake = await Form.create({
          companyId: session.companyId,
          title: "Project Intake Form",
          description: projectIntakeTemplate.description,
          templateId: "project-intake",
          themeColor: projectIntakeTemplate.themeColor,
          isPublished: true,
          submitButtonText: "Submit Project Request",
          createTaskOnSubmission: true,
          questions: projectIntakeTemplate.questions,
          submissions: [],
          authorName,
          authorId: session.userId || "",
        });

        const defaultFeedback = await Form.create({
          companyId: session.companyId,
          title: "Feedback Form",
          description: feedbackTemplate.description,
          templateId: "feedback",
          themeColor: feedbackTemplate.themeColor,
          isPublished: true,
          submitButtonText: "Send Feedback",
          createTaskOnSubmission: false,
          questions: feedbackTemplate.questions,
          submissions: [],
          authorName,
          authorId: session.userId || "",
        });

        if (session.companyCode) {
          await syncTenantWrite("Form", "create", defaultIntake, undefined, session.companyCode);
          await syncTenantWrite("Form", "create", defaultFeedback, undefined, session.companyCode);
        }

        forms = [defaultIntake.toObject(), defaultFeedback.toObject()];
      } catch (err) {
        console.warn("Failed to pre-seed initial forms in database:", err);
      }
    }

    return NextResponse.json({
      success: true,
      forms: forms || [],
    });
  } catch (error: any) {
    console.error("GET /api/forms error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    if (!session.companyId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session or missing organization context" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { templateId, title, description, questions, themeColor } = body;

    const selectedTemplate = FORM_TEMPLATES.find((t) => t.id === templateId) || FORM_TEMPLATES.find((t) => t.id === "scratch")!;

    const formTitle = title || selectedTemplate.name;
    const formDesc = description !== undefined ? description : selectedTemplate.description;
    const formQuestions = questions || selectedTemplate.questions;
    const formTheme = themeColor || selectedTemplate.themeColor;
    const authorName = session.name || session.email?.split("@")[0] || "Admin";

    const newForm = await Form.create({
      companyId: session.companyId,
      title: formTitle,
      description: formDesc,
      templateId: selectedTemplate.id,
      themeColor: formTheme,
      isPublished: true,
      submitButtonText: "Submit",
      createTaskOnSubmission: true,
      questions: formQuestions,
      submissions: [],
      authorName,
      authorId: session.userId || "",
    });

    if (session.companyCode) {
      await syncTenantWrite("Form", "create", newForm, undefined, session.companyCode);
    }

    return NextResponse.json({
      success: true,
      form: newForm,
    });
  } catch (error: any) {
    console.error("POST /api/forms error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create form" },
      { status: 500 }
    );
  }
}
