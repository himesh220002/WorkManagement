import connectToDatabase from "@/lib/mongodb";
import { Project, Team, Pipeline, Task, User } from "@/models";
import ProjectHierarchyDiagram from "@/app/projects/ProjectHierarchyDiagram";
import ProjectRbacController from "@/app/projects/ProjectRbacController";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { serializeDocs } from "@/lib/serialize";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { addProject } from "@/actions";
import { fetchWithCache, invalidateCachePrefix } from "@/lib/cache";
import { computePipelineProgress } from "@/utils/pipelineProgress";
import {
  FolderKanban,
  Plus,
  Trash2,
  Users,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Target,
  Shield,
  ShieldCheck,
  Lock,
} from "lucide-react";

async function deleteProjectAction(formData: FormData) {
  "use server";
  await connectToDatabase();
  const id = formData.get("projectId");

  if (id) {
    await Project.findByIdAndDelete(id);
    invalidateCachePrefix("projects_");
    invalidateCachePrefix("exec_");
    revalidatePath("/projects");
    revalidatePath("/exec/dashboard");
  }
}

export default async function ProjectsPage() {
  await connectToDatabase();
  const session = await getCurrentSession();
  const tenantFilter = getTenantQueryFilter(session);
  const cId = session.companyId || "default";

  const [projectsData, allTeams, allPipelines, allTasks, allUsersData] = await Promise.all([
    fetchWithCache(`projects_data:${cId}`, 30, () =>
      Project.find(tenantFilter).lean()
    ),
    fetchWithCache(`projects_teams:${cId}`, 30, () =>
      Team.find(tenantFilter).populate("members leadId").lean()
    ),
    fetchWithCache(`projects_pipelines:${cId}`, 30, () =>
      Pipeline.find(tenantFilter).lean()
    ),
    fetchWithCache(`projects_tasks:${cId}`, 20, () =>
      Task.find(tenantFilter).lean()
    ),
    fetchWithCache(`projects_users:${cId}`, 30, () =>
      User.find(tenantFilter).select("name role position").lean()
    ),
  ]);

  const cleanUsers = serializeDocs<any>(
    allUsersData.map((u: any) => ({
      _id: u._id.toString(),
      name: u.name,
      role: u.role || "employee",
      position: u.position || "",
    }))
  );

  // Aggregate project blueprints with accurate child links
  const projects = projectsData.map((p: any) => {
    const pIdStr = p._id.toString();

    // Associated teams
    const teams = allTeams.filter(
      (t: any) =>
        (Array.isArray(t.projectIds) &&
          t.projectIds.some((pid: any) => pid.toString() === pIdStr)) ||
        (Array.isArray(p.teams) &&
          p.teams.some((tid: any) => tid.toString() === t._id.toString()))
    );

    // Associated pipelines with live dynamic progress rollup
    const pipelines = allPipelines
      .filter((pipe: any) => pipe.projectId?.toString() === pIdStr)
      .map((pipe: any) => {
        const pipeIdStr = pipe._id?.toString();
        const linkedTasks = allTasks.filter(
          (t: any) => t.pipelineId && t.pipelineId.toString() === pipeIdStr
        );
        const progress = computePipelineProgress(pipe, linkedTasks);
        return {
          ...pipe,
          _id: pipeIdStr,
          progress,
        };
      });

    // Associated tasks
    const tasks = allTasks.filter(
      (task: any) => task.projectId?.toString() === pIdStr
    );

    const completedTasks = tasks.filter((t: any) =>
      ["done", "completed"].includes((t.status || "").toLowerCase())
    ).length;
    const totalTasks = tasks.length;
    const taskProgress =
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : Number(p.progress || 0);

    return {
      ...p,
      _id: pIdStr,
      teams,
      pipelines,
      tasksCount: totalTasks,
      completedTasks,
      taskProgress,
    };
  });

  const cleanProjects = serializeDocs<any>(projects);
  const totalProjects = cleanProjects.length;
  const activeProjects = cleanProjects.filter((p) => p.status === "Active").length;
  const totalTeamsCount = allTeams.length;
  const totalPipelinesCount = allPipelines.length;

  const currentRole = (session.role || "employee").toLowerCase();
  const canCreateProject = ["owner", "manager", "superuser"].includes(currentRole);
  const canDeleteProject = ["owner", "manager", "superuser"].includes(currentRole);

  return (
    <main className="flex flex-col min-w-0 p-0 sm:p-4 flex-1 max-w-[1600px] mx-auto w-full">
      {/* Page Header */}
      <header className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 sm:p-6 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg lg:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
              Projects Blueprint & System Architecture
            </h1>
            <Badge tone="brand" size="sm">
              Portfolio Blueprints
            </Badge>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
            System architectural maps linking each project to its teams, pipelines, deliverables, and execution telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dev/timeline"
            className="px-3 py-1.5 rounded-[4px] bg-[#F3F2F1] dark:bg-[#292827] hover:bg-[#EDEBE9] text-[#242424] dark:text-[#FFFFFF] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>Timeline View</span>
          </Link>
          <Link
            href="/diagrams"
            className="px-3 py-1.5 rounded-[4px] bg-[#EBF3FC] dark:bg-[#1C2B3D] hover:bg-[#0078D4]/20 text-[#0078D4] dark:text-[#479EF5] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Flow Diagrams</span>
          </Link>
        </div>
      </header>

      {/* Blueprint Portfolio Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          label="Total Blueprints"
          value={`${totalProjects} Projects`}
          subtext={`${activeProjects} Active in Production`}
          icon={<FolderKanban className="w-5 h-5 text-[#0078D4]" />}
        />
        <Stat
          label="Operational Teams"
          value={`${totalTeamsCount} Teams`}
          subtext="Allocated cross-functionally"
          icon={<Users className="w-5 h-5 text-[#107C10]" />}
        />
        <Stat
          label="Active Pipelines"
          value={`${totalPipelinesCount} Pipelines`}
          subtext="Delivery roadmaps configured"
          icon={<Layers className="w-5 h-5 text-[#0078D4]" />}
        />
        <Stat
          label="Task Execution"
          value={`${allTasks.filter((t: any) => ["done", "completed"].includes((t.status || "").toLowerCase())).length} / ${allTasks.length} Done`}
          subtext="Across entire ecosystem"
          icon={<CheckCircle2 className="w-5 h-5 text-[#107C10]" />}
        />
      </div>

      {/* Create Project Form Bar or Informative RBAC Governance Notice */}
      {canCreateProject ? (
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
          <span className="text-xs font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider block mb-2">
            Initialize New Project Blueprint
          </span>
          <form action={addProject} className="flex gap-3 flex-wrap items-center">
            <input
              type="text"
              name="name"
              className="flex-1 min-w-[200px] px-3 py-1.5 text-xs rounded bg-[#FAF9F8] dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
              placeholder="Project Name (e.g. Next-Gen Enterprise Portal)..."
              required
            />
            <input
              type="text"
              name="description"
              className="flex-1 min-w-[200px] px-3 py-1.5 text-xs rounded bg-[#FAF9F8] dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
              placeholder="Architecture objective / description..."
            />
            <select
              name="category"
              className="px-3 py-1.5 text-xs rounded bg-[#FAF9F8] dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-[#FFFFFF] cursor-pointer"
            >
              <option value="Internal">Internal</option>
              <option value="Client">Client</option>
              <option value="Product">Product</option>
              <option value="Research">Research</option>
              <option value="Other">Other</option>
            </select>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#0078D4] hover:bg-[#006CBE] text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Blueprint</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] rounded-[6px]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#242424] dark:text-[#FFFFFF] flex items-center gap-1.5">
                <span>Architectural Blueprint Governance</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 uppercase">
                  {session.role}
                </span>
              </h3>
              <p className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4] mt-0.5">
                {currentRole === "employee"
                  ? "Employees execute assigned tasks within projects. Project blueprints and agendas are read-only; submit change requests to your Team Lead."
                  : "Team Leads govern assigned project execution, agendas, and employee change proposals. Corporate blueprint initialization is reserved for Operations Managers & Company Owners."}
              </p>
            </div>
          </div>
          <div className="text-[11px] font-semibold text-[#0078D4] bg-[#EBF3FC] dark:bg-[#1C2B3D] px-2.5 py-1 rounded shrink-0">
            Task Execution Mode
          </div>
        </div>
      )}

      {/* Projects Blueprint Cards */}
      <div className="space-y-6">
        {cleanProjects.length > 0 ? (
          cleanProjects.map((p: any) => (
            <div
              key={p._id}
              className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col justify-between hover:border-[#0078D4] transition-all"
            >
              {/* Card Top Row */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-[6px] bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] flex items-center justify-center shrink-0">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#242424] dark:text-[#FFFFFF]">
                        {p.name}
                      </h3>
                      <StatusBadge status={p.health || "On Track"} />
                      <span className="text-xs font-medium text-[#605E5C] dark:text-[#C8C6C4] bg-[#F3F2F1] dark:bg-[#292827] px-2 py-0.5 rounded">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-0.5">
                      {p.description || "No project description provided."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#F3F2F1] dark:bg-[#292827] text-[#242424] dark:text-[#FFFFFF]">
                    Status: {p.status || "Active"}
                  </span>
                  {canDeleteProject && (
                    <form action={deleteProjectAction}>
                      <input type="hidden" name="projectId" value={p._id} />
                      <button
                        type="submit"
                        className="p-1.5 rounded hover:bg-[#FDE7E9] text-[#A19F9D] hover:text-[#D13438] transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Progress & Context Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-[#FAF9F8] dark:bg-[#292827] rounded-[6px] border border-[#E1DFDD] dark:border-[#3B3A39] mb-3 text-xs">
                {/* Tasks Progress */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#605E5C] dark:text-[#C8C6C4]">Tasks Completion</span>
                    <span className="font-bold text-[#242424] dark:text-[#FFFFFF]">
                      {p.completedTasks} / {p.tasksCount} ({p.taskProgress}%)
                    </span>
                  </div>
                  <ProgressBar value={p.taskProgress} size="sm" tone={p.taskProgress >= 70 ? "success" : "brand"} />
                </div>

                {/* Associated Teams */}
                <div>
                  <span className="text-[#605E5C] dark:text-[#C8C6C4] block mb-1">
                    Linked Teams ({p.teams.length}):
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {p.teams.length > 0 ? (
                      p.teams.map((tm: any) => (
                        <span key={tm._id} className="inline-flex items-center gap-1 text-[11px] bg-white dark:bg-[#201F1E] px-2 py-0.5 rounded border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-[#FFFFFF]">
                          <Users className="w-3 h-3 text-[#0078D4]" />
                          <span>{tm.name}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[#A19F9D]">No teams assigned</span>
                    )}
                  </div>
                </div>

                {/* Pipelines */}
                <div>
                  <span className="text-[#605E5C] dark:text-[#C8C6C4] block mb-1">
                    Active Pipelines ({p.pipelines.length}):
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {p.pipelines.length > 0 ? (
                      p.pipelines.map((pipe: any) => (
                        <span key={pipe._id} className="inline-flex items-center gap-1 text-[11px] bg-white dark:bg-[#201F1E] px-2 py-0.5 rounded border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-[#FFFFFF]">
                          <Layers className="w-3 h-3 text-[#107C10]" />
                          <span>{pipe.name} ({pipe.progress}%)</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[#A19F9D]">No pipelines yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Corporate RBAC: Team Lead, Staff Assignment, Agendas & Change Approvals */}
              <ProjectRbacController
                project={p}
                allUsers={cleanUsers}
                currentRole={session.role}
                currentUserId={session.userId}
              />

              {/* Interactive Architecture Flow Diagram */}
              <ProjectHierarchyDiagram project={p} />
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-[#201F1E] border border-dashed border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-12 text-center">
            <FolderKanban className="w-12 h-12 text-[#A19F9D] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#242424] dark:text-[#FFFFFF]">
              No Project Blueprints Found
            </h3>
            <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
              Initialize your first project architecture above to generate blueprints and flowcharts.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
