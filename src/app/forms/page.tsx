import React from "react";
import connectToDatabase from "@/lib/mongodb";
import { Form } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { serializeDocs } from "@/lib/serialize";
import FormsDashboardClient from "@/components/forms/FormsDashboardClient";
import { FORM_TEMPLATES } from "@/lib/formTemplates";

export const metadata = {
  title: "Forms & Surveys | TaskPMS",
  description: "Create customizable forms, project intake questionnaires, order forms, and team surveys.",
};

export default async function FormsPage() {
  await connectToDatabase();
  const session = await getCurrentSession();
  const tenantFilter = getTenantQueryFilter(session);

  let rawForms = await Form.find(tenantFilter)
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  if (!rawForms || rawForms.length === 0) {
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

      rawForms = [defaultIntake.toObject(), defaultFeedback.toObject()];
    } catch {
      rawForms = [
        {
          _id: "default-project-intake",
          title: "Project Intake Form",
          description: projectIntakeTemplate.description,
          templateId: "project-intake",
          themeColor: projectIntakeTemplate.themeColor,
          isPublished: true,
          questions: projectIntakeTemplate.questions,
          submissions: [],
          authorName: "Admin",
          updatedAt: new Date(),
        } as any,
      ];
    }
  }

  const forms = serializeDocs(rawForms);

  return (
    <FormsDashboardClient
      initialForms={forms as any}
      orgCode={session.companyCode || ""}
    />
  );
}
