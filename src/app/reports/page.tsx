import React from "react";
import { getCurrentSession } from "@/server/auth/session";
import AIReportHub from "@/components/ai/AIReportHub";

export const metadata = {
  title: "AI Reports & Workspace Intelligence | TaskPMS",
  description:
    "Generate comprehensive AI-driven project health reports, team velocity metrics, company executive briefings, sales pipeline forecasts, form schemas, charts, and estimations with BYOK Google Gemini models.",
};

export default async function ReportsPage() {
  const session = await getCurrentSession();

  return (
    <div className="w-full min-h-[calc(100vh-48px)] bg-[#FAF9F8] dark:bg-[#1E1E1E]">
      <AIReportHub orgCode={session.companyCode || ""} />
    </div>
  );
}
