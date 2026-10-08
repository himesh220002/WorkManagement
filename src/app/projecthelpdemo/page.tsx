import { getCurrentSession } from "@/server/auth/session";
import ProjectHelpDemoClient from "./ProjectHelpDemoClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Project Blueprint & Roadmap Guide · TaskPMS",
  description:
    "End-to-end operational roadmap for creating projects, budgeting, provisioning squads, executing task pipelines, closing commercial deals, and managing salary cashflows.",
};

export default async function ProjectHelpDemoPage() {
  const session = await getCurrentSession();

  return (
    <div className="w-full">
      <ProjectHelpDemoClient companyCode={session.companyCode || "DEMO"} />
    </div>
  );
}
