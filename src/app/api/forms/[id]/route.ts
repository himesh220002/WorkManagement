import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Form } from "@/models";
import { getCurrentSession } from "@/server/auth/session";
import { syncTenantWrite } from "@/lib/tenantDb";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    let form: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      form = await Form.findById(id).lean();
    }
    if (!form) {
      form = await Form.findOne({
        $or: [{ templateId: id as any }, { title: new RegExp(`^${id}$`, "i") }],
      } as any).lean();
    }

    if (!form) {
      return NextResponse.json({ success: false, error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, form });
  } catch (error: any) {
    console.error("GET /api/forms/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve form" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    let updatedForm = await Form.findByIdAndUpdate(
      id,
      {
        $set: {
          title: body.title,
          description: body.description,
          questions: body.questions,
          themeColor: body.themeColor,
          isPublished: body.isPublished !== undefined ? body.isPublished : true,
          submitButtonText: body.submitButtonText || "Submit",
          createTaskOnSubmission: body.createTaskOnSubmission !== undefined ? body.createTaskOnSubmission : true,
          targetProjectId: body.targetProjectId || "",
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedForm) {
      return NextResponse.json({ success: false, error: "Form not found to update" }, { status: 404 });
    }

    if (session.companyCode) {
      await syncTenantWrite("Form", "update", updatedForm, undefined, session.companyCode);
    }

    return NextResponse.json({ success: true, form: updatedForm });
  } catch (error: any) {
    console.error("PUT /api/forms/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update form" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const { id } = await params;

    const deletedForm = await Form.findByIdAndDelete(id);
    if (!deletedForm) {
      return NextResponse.json({ success: false, error: "Form not found to delete" }, { status: 404 });
    }

    if (session.companyCode) {
      await syncTenantWrite("Form", "delete", { _id: id }, undefined, session.companyCode);
    }

    return NextResponse.json({ success: true, message: "Form successfully deleted" });
  } catch (error: any) {
    console.error("DELETE /api/forms/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete form" },
      { status: 500 }
    );
  }
}
