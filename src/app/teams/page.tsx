import connectToDatabase from "@/lib/mongodb";
import { Team, User } from "@/models";
import RegisterMemberForm from "@/app/teams/RegisterMemberForm";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import GlobalMemberDirectory from "@/app/teams/GlobalMemberDirectory";
import TeamCard from "@/app/teams/TeamCard";
import { Badge } from "@/components/ui/Badge";
import { calculateMeritEvaluation } from "@/utils/meritEvaluation";
import { revalidatePath } from "next/cache";
import {
  Users,
  Plus,
  Building2,
  UserPlus,
  Layers,
  Sparkles,
  ShieldCheck,
  Award,
} from "lucide-react";

async function addTeam(formData: FormData) {
  "use server";
  await connectToDatabase();
  const name = formData.get("teamName") as string;
  const memberIds = formData.getAll("memberIds") as string[];

  if (name) {
    await Team.create({ name, members: memberIds });
    revalidatePath("/teams");
    revalidatePath("/diagrams");
  }
}

export default async function TeamsPage() {
  await connectToDatabase();
  const teamsRaw = await Team.find({}).populate("members").lean();
  const allUsersData = await User.find({}).lean();

  // Sanitize for client components
  const allUsers = allUsersData.map((u: any) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email || "",
    role: u.role,
    position: u.position,
    rank: u.rank,
    status: u.status,
    joinedDate: u.joinedDate ? new Date(u.joinedDate).toISOString() : null,
    leftDate: u.leftDate ? new Date(u.leftDate).toISOString() : null,
    details: u.details || "",
    performanceScore: u.performanceScore ?? 82,
    completedProjectsCount: u.completedProjectsCount ?? 0,
    currentProjectsCount: u.currentProjectsCount ?? 1,
    relevancyScore: u.relevancyScore ?? 85,
    supervisorRating: u.supervisorRating ?? 4.2,
    teamLeadRating: u.teamLeadRating ?? 4.3,
    remarks: u.remarks || "",
  }));

  const userOptions = allUsers.map((u) => ({
    id: u._id,
    name: `${u.name} — ${u.role} ${u.position ? `(${u.position})` : ""} [Rank ${u.rank || 1}]`,
  }));

  const cleanTeams = teamsRaw.map((t: any) => ({
    _id: t._id.toString(),
    name: t.name,
    members: Array.isArray(t.members)
      ? t.members.map((m: any) => ({
          _id: (m._id || m).toString(),
          name: m.name || "Member",
          role: m.role || "Member",
          position: m.position || "",
          rank: m.rank || "1",
          status: m.status || "Working",
          joinedDate: m.joinedDate ? new Date(m.joinedDate).toISOString() : null,
          leftDate: m.leftDate ? new Date(m.leftDate).toISOString() : null,
          details: m.details || "",
          performanceScore: m.performanceScore ?? 82,
          completedProjectsCount: m.completedProjectsCount ?? 0,
          currentProjectsCount: m.currentProjectsCount ?? 1,
          relevancyScore: m.relevancyScore ?? 85,
          supervisorRating: m.supervisorRating ?? 4.2,
          teamLeadRating: m.teamLeadRating ?? 4.3,
          remarks: m.remarks || "",
        }))
      : [],
  }));

  // Aggregate promotion statistics
  const activeStaff = allUsers.filter((u) => u.status === "Working" || !u.status);
  const promotionReadyCount = activeStaff.filter(
    (u) => calculateMeritEvaluation(u).isPromotionReady
  ).length;
  const avgMeritScore =
    activeStaff.length > 0
      ? Math.round(
          activeStaff.reduce(
            (acc, u) => acc + calculateMeritEvaluation(u).overallMeritScore,
            0
          ) / activeStaff.length
        )
      : 80;

  return (
    <main className="flex flex-col min-w-0 p-4 flex-1 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <header className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 mb-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
              Teams, Squads &amp; Member Directory
            </h1>
            <Badge tone="brand" size="sm">
              Organizational Units
            </Badge>
            <Badge tone="success" size="sm">
              Dynamic Staff Rotation
            </Badge>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
            Enterprise squad management, talent capability tiers (Rank 1–5), cross-initiative rotations, and global personnel records.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-xs font-semibold px-3 py-1 bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] rounded-full inline-flex items-center gap-1.5 border border-[#0078D4]/20">
            <Users className="w-3.5 h-3.5" />
            <span>{cleanTeams.length} Active Squads</span>
          </div>
          <div className="text-xs font-semibold px-3 py-1 bg-[#DFF6DD] dark:bg-[#0F3818] text-[#107C10] dark:text-[#54B054] rounded-full inline-flex items-center gap-1.5 border border-[#107C10]/20">
            <span>{allUsers.length} Registered Members</span>
          </div>
          <div className="text-xs font-semibold px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full inline-flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-700 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>{promotionReadyCount} Promotion Eligible</span>
          </div>
        </div>
      </header>

      {/* Anti-Bias Meritocracy Architecture Ribbon */}
      <div className="bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#242424] dark:text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
              <span>Automated Merit Progression Engine</span>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Anti-Office Politics Active
              </span>
            </h2>
            <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-0.5">
              Promotions are computed dynamically: <strong>Performance Index (25%)</strong> + <strong>Tenure Working Days (10%)</strong> + <strong>Deliverables (25%)</strong> + <strong>Team Lead &amp; Supervisor Reviews (30%)</strong> + <strong>Skill Relevancy (10%)</strong>. Transparent criteria guarantee dedication is recognized automatically.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-[#EDEBE9] dark:border-[#292827]">
          <div className="text-center px-3.5 py-1.5 bg-white dark:bg-[#201F1E] rounded-[6px] border border-[#E1DFDD] dark:border-[#3B3A39]">
            <div className="text-[10px] text-[#8A8886]">Avg Merit Index</div>
            <div className="text-sm font-bold text-[#0078D4]">{avgMeritScore}%</div>
          </div>
          <div className="text-center px-3.5 py-1.5 bg-white dark:bg-[#201F1E] rounded-[6px] border border-[#E1DFDD] dark:border-[#3B3A39]">
            <div className="text-[10px] text-[#8A8886]">Ready for Rank-Up</div>
            <div className="text-sm font-bold text-emerald-600">{promotionReadyCount} staff</div>
          </div>
        </div>
      </div>

      {/* Forms Ribbon: Register Global Member + Create Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Register Global Member */}
        <RegisterMemberForm />

        {/* Create Team Form with Multi-Select initial members */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex-1 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F3F2F1] dark:border-[#292827]">
            <Building2 className="w-4 h-4 text-[#107C10]" />
            <h2 className="text-sm font-semibold text-[#242424] dark:text-[#FFFFFF]">
              Establish New Operational Team
            </h2>
          </div>

          <form action={addTeam} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
                Team / Squad Name *
              </label>
              <input
                type="text"
                name="teamName"
                placeholder="e.g. Core Engineering, Growth Squad"
                className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
                Initial Team Members (Optional)
              </label>
              <div className="overflow-visible relative z-20">
                <MultiSelectDropdown
                  name="memberIds"
                  options={userOptions}
                  placeholder="Select initial company members..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-[#107C10] hover:bg-[#0E6A0E] text-white rounded-[4px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Team</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Global Directory */}
      <div className="mb-6">
        <GlobalMemberDirectory users={allUsers} />
      </div>

      {/* Active Squads Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0078D4]" />
            <h3 className="font-bold text-sm text-[#242424] dark:text-[#FFFFFF] uppercase tracking-wider">
              Configured Teams &amp; Squads ({cleanTeams.length})
            </h3>
          </div>
          <span className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
            Click member to view profile • Manage &amp; Rotate to adjust squad composition
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cleanTeams.map((t) => (
            <TeamCard key={t._id} team={t} allUsers={allUsers} />
          ))}

          {cleanTeams.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px]">
              <Users className="w-10 h-10 text-[#C8C6C4] mx-auto mb-2" />
              <h4 className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF]">
                No Teams Established
              </h4>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
                Create a team above to assemble squads and assign members.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
