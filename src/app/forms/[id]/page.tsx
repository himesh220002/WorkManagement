import React from "react";
import connectToDatabase from "@/lib/mongodb";
import { Form } from "@/models";
import { getCurrentSession } from "@/server/auth/session";
import { serializeDoc } from "@/lib/serialize";
import FormEditor from "@/components/forms/FormEditor";
import { FORM_TEMPLATES } from "@/lib/formTemplates";
import { notFound } from "next/navigation";
import mongoose from "mongoose";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: `Form Editor | TaskPMS`,
  };
}

export default async function FormEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connectToDatabase();
  const session = await getCurrentSession();
  const { id } = await params;

  let rawForm: any = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    rawForm = await Form.findById(id).lean();
  }
  if (!rawForm) {
    rawForm = await Form.findOne({ templateId: id as any }).lean();
  }

  // Fallback to template if requested by template name/ID
  if (!rawForm) {
    const tmpl = FORM_TEMPLATES.find((t) => t.id === id);
    if (tmpl) {
      rawForm = {
        _id: id,
        title: tmpl.name,
        description: tmpl.description,
        templateId: tmpl.id,
        themeColor: tmpl.themeColor,
        isPublished: true,
        questions: tmpl.questions,
        submissions: [],
        authorName: session.name || "Admin",
      };
    }
  }

  if (!rawForm) {
    notFound();
  }

  const form = serializeDoc(rawForm);

  return (
    <FormEditor
      initialForm={form as any}
      orgCode={session.companyCode || ""}
    />
  );
}
