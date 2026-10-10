"use client";

import { useState } from "react";
import { unlinkUserFromTeam, linkUserToTeam, deleteTeam } from "@/actions";
import MemberProfileModal, { UserDetail } from "@/components/MemberProfileModal";
import { Badge } from "@/components/ui/Badge";
import {
  calculateMeritEvaluation,
  getPromotionBadgeInfo,
  UserMeritData,
} from "@/utils/meritEvaluation";
import {
  Users,
  Trash2,
  UserMinus,
  UserPlus,
  Settings2,
  X,
  Award,
  Plus,
  Clock,
  Star,
  Sparkles,
  CheckSquare,
  TrendingUp,
  Crown,
} from "lucide-react";

interface TeamMember extends UserMeritData {
  _id: string;
  name: string;
  role: string;
  position?: string;
  rank?: string;
  status?: string;
  joinedDate?: string | null;
  leftDate?: string | null;
  details?: string;
}

interface TeamData {
  _id: string;
  name: string;
  members: TeamMember[];
}

interface TeamCardProps {
  team: TeamData;
  allUsers: UserDetail[];
  currentRole?: string;
  currentUserId?: string;
}

// Natural per-team color identity — deterministic from team id/name so each
// squad card feels distinct yet calm. Soft tints, never loud.
interface TeamTheme {
  topbar: string;
  header: string;
  medallion: string;
  countPill: string;
  outlineBtn: string;
  row: string;
  rowHover: string;
  avatar: string;
  accentText: string;
  bar: string;
  solidBtn: string;
}

const TEAM_THEMES: TeamTheme[] = [
  {
    topbar: "from-sky-400 to-sky-200",
    header: "from-sky-50 via-sky-50/70 to-white dark:from-sky-950/50 dark:via-[#1B1A19] dark:to-[#201F1E]",
    medallion: "bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300",
    countPill: "bg-sky-100/80 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
    outlineBtn: "border-sky-200 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950/50",
    row: "bg-sky-50/60 dark:bg-sky-950/20",
    rowHover: "hover:border-sky-400 dark:hover:border-sky-500",
    avatar: "bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300",
    accentText: "text-sky-700 dark:text-sky-300",
    bar: "from-sky-500 to-sky-300",
    solidBtn: "bg-sky-600 hover:bg-sky-700",
  },
  {
    topbar: "from-emerald-400 to-emerald-200",
    header: "from-emerald-50 via-emerald-50/70 to-white dark:from-emerald-950/50 dark:via-[#1B1A19] dark:to-[#201F1E]",
    medallion: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
    countPill: "bg-emerald-100/80 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    outlineBtn: "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50",
    row: "bg-emerald-50/60 dark:bg-emerald-950/20",
    rowHover: "hover:border-emerald-400 dark:hover:border-emerald-500",
    avatar: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
    accentText: "text-emerald-700 dark:text-emerald-300",
    bar: "from-emerald-500 to-emerald-300",
    solidBtn: "bg-emerald-600 hover:bg-emerald-700",
  },
  {
    topbar: "from-amber-400 to-amber-200",
    header: "from-amber-50 via-amber-50/70 to-white dark:from-amber-950/40 dark:via-[#1B1A19] dark:to-[#201F1E]",
    medallion: "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
    countPill: "bg-amber-100/80 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    outlineBtn: "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/50",
    row: "bg-amber-50/60 dark:bg-amber-950/20",
    rowHover: "hover:border-amber-400 dark:hover:border-amber-500",
    avatar: "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
    accentText: "text-amber-700 dark:text-amber-300",
    bar: "from-amber-500 to-amber-300",
    solidBtn: "bg-amber-600 hover:bg-amber-700",
  },
  {
    topbar: "from-violet-400 to-violet-200",
    header: "from-violet-50 via-violet-50/70 to-white dark:from-violet-950/50 dark:via-[#1B1A19] dark:to-[#201F1E]",
    medallion: "bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300",
    countPill: "bg-violet-100/80 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800",
    outlineBtn: "border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950/50",
    row: "bg-violet-50/60 dark:bg-violet-950/20",
    rowHover: "hover:border-violet-400 dark:hover:border-violet-500",
    avatar: "bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300",
    accentText: "text-violet-700 dark:text-violet-300",
    bar: "from-violet-500 to-violet-300",
    solidBtn: "bg-violet-600 hover:bg-violet-700",
  },
  {
    topbar: "from-rose-400 to-rose-200",
    header: "from-rose-50 via-rose-50/70 to-white dark:from-rose-950/50 dark:via-[#1B1A19] dark:to-[#201F1E]",
    medallion: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300",
    countPill: "bg-rose-100/80 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    outlineBtn: "border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/50",
    row: "bg-rose-50/60 dark:bg-rose-950/20",
    rowHover: "hover:border-rose-400 dark:hover:border-rose-500",
    avatar: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300",
    accentText: "text-rose-700 dark:text-rose-300",
    bar: "from-rose-500 to-rose-300",
    solidBtn: "bg-rose-600 hover:bg-rose-700",
  },
  {
    topbar: "from-teal-400 to-teal-200",
    header: "from-teal-50 via-teal-50/70 to-white dark:from-teal-950/50 dark:via-[#1B1A19] dark:to-[#201F1E]",
    medallion: "bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300",
    countPill: "bg-teal-100/80 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
    outlineBtn: "border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/50",
    row: "bg-teal-50/60 dark:bg-teal-950/20",
    rowHover: "hover:border-teal-400 dark:hover:border-teal-500",
    avatar: "bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300",
    accentText: "text-teal-700 dark:text-teal-300",
    bar: "from-teal-500 to-teal-300",
    solidBtn: "bg-teal-600 hover:bg-teal-700",
  },
  {
    topbar: "from-orange-400 to-orange-200",
    header: "from-orange-50 via-orange-50/70 to-white dark:from-orange-950/40 dark:via-[#1B1A19] dark:to-[#201F1E]",
    medallion: "bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300",
    countPill: "bg-orange-100/80 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
    outlineBtn: "border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/50",
    row: "bg-orange-50/60 dark:bg-orange-950/20",
    rowHover: "hover:border-orange-400 dark:hover:border-orange-500",
    avatar: "bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300",
    accentText: "text-orange-700 dark:text-orange-300",
    bar: "from-orange-500 to-orange-300",
    solidBtn: "bg-orange-600 hover:bg-orange-700",
  },
  {
    topbar: "from-indigo-400 to-indigo-200",
    header: "from-indigo-50 via-indigo-50/70 to-white dark:from-indigo-950/50 dark:via-[#1B1A19] dark:to-[#201F1E]",
    medallion: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300",
    countPill: "bg-indigo-100/80 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
    outlineBtn: "border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/50",
    row: "bg-indigo-50/60 dark:bg-indigo-950/20",
    rowHover: "hover:border-indigo-400 dark:hover:border-indigo-500",
    avatar: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300",
    accentText: "text-indigo-700 dark:text-indigo-300",
    bar: "from-indigo-500 to-indigo-300",
    solidBtn: "bg-indigo-600 hover:bg-indigo-700",
  },
];

function teamTheme(team: TeamData): TeamTheme {
  const seed = `${team._id}${team.name}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return TEAM_THEMES[h % TEAM_THEMES.length];
}

export default function TeamCard({ team, allUsers, currentRole, currentUserId }: TeamCardProps) {
  const [selectedMember, setSelectedMember] = useState<UserDetail | null>(null);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [selectedAddUserId, setSelectedAddUserId] = useState("");

  const role = (currentRole || "manager").toLowerCase();
  const isManagement = ["owner", "manager", "superuser"].includes(role);
  const isTeamLead = role === "teamlead";
  const isMemberOrLead = team.members.some((m) => m._id === currentUserId);
  const canManage = isManagement || (isTeamLead && isMemberOrLead);
  const canDelete = isManagement;

  const currentMemberIds = new Set(team.members.map((m) => m._id));
  const availableUsersToRotate = allUsers.filter(
    (u) => !currentMemberIds.has(u._id) && (u.status === "Working" || !u.status)
  );
  const theme = teamTheme(team);

  return (
    <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[10px] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden relative">
      {/* Team colour ribbon */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.topbar}`} />
      {/* Team Header */}
      <div className={`flex flex-wrap gap-2 p-4 pt-5 border-b border-[#E1DFDD] dark:border-[#3B3A39] bg-gradient-to-r ${theme.header} flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${theme.medallion} flex items-center justify-center font-bold shadow-sm ring-2 ring-white dark:ring-[#201F1E]`}>
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-wrap font-bold text-sm text-[#242424] dark:text-[#FFFFFF]">
              {team.name}
            </h3>
            <p className={`text-[11px] font-semibold inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full border ${theme.countPill}`}>
              {team.members.length} Assigned Member{team.members.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Rotate/Manage Team Action: Restricted to Managers, Owners & Lead of this squad */}
          {canManage && (
            <button
              type="button"
              onClick={() => setIsRotateModalOpen(true)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs bg-white dark:bg-[#292827] border rounded-[4px] font-medium transition-colors cursor-pointer ${theme.outlineBtn}`}
              title="Rotate & Manage Team Members"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Manage &amp; Rotate</span>
            </button>
          )}

          {/* Delete Team: Restricted strictly to Managers & Owners */}
          {canDelete && (
            <form
              action={deleteTeam}
              onSubmit={(e) => {
                if (!window.confirm(`Delete team "${team.name}"? Members will remain in company directory.`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="teamId" value={team._id} />
              <button
                type="submit"
                className="p-1.5 text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#D13438] transition-colors rounded-[4px] cursor-pointer"
                title="Delete Team"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Members List with Promotion Stats & Indication on Card */}
      <div className="p-4 space-y-2.5 flex-1">
        {team.members.map((member) => {
          const merit = calculateMeritEvaluation(member);
          const badge = getPromotionBadgeInfo(merit);

          return (
            <div
              key={member._id}
              className={`p-2.5 rounded-[8px] ${theme.row} border border-[#E1DFDD] dark:border-[#3B3A39] ${theme.rowHover} transition-all group flex flex-col gap-2 shadow-sm`}
            >
              {/* Member Top Row */}
              <div className="flex items-start justify-between gap-2">
                <div
                  onClick={() =>
                    setSelectedMember({
                      ...member,
                      assignedTeams: [{ _id: team._id, name: team.name }],
                    })
                  }
                  className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0"
                  title="Click to view comprehensive merit telemetry & improvement goals"
                >
                  <div className={`w-8 h-8 rounded-full ${theme.avatar} flex items-center justify-center font-bold text-[10px] uppercase shrink-0 mt-0.5 ring-2 ring-white dark:ring-[#201F1E] shadow-sm`}>
                    {member.name.substring(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs text-[#242424] dark:text-[#FFFFFF] truncate group-hover:text-[#0078D4] transition-colors">
                        {member.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold border ${theme.countPill}`}>
                        R{merit.currentRank}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4] truncate">
                      {member.position || member.role}
                    </p>
                  </div>
                </div>

                {/* Promotion Readiness Badge & Remove Button */}
                <div className="shrink-0 flex items-center gap-1">
                  <span
                    onClick={() =>
                      setSelectedMember({
                        ...member,
                        assignedTeams: [{ _id: team._id, name: team.name }],
                      })
                    }
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border cursor-pointer inline-flex items-center gap-1 ${badge.badgeStyle}`}
                    title={`Readiness Status: ${merit.readinessStatus}`}
                  >
                    {badge.statusType === "ready" && <Sparkles className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />}
                    {badge.statusType === "contender" && <Star className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />}
                    {badge.statusType === "principal" && <Crown className="w-2.5 h-2.5 text-purple-600" />}
                    <span>{badge.shortLabel}</span>
                  </span>

                  {/* Quick Unlink/Remove Member from Team */}
                  <form
                    action={unlinkUserFromTeam}
                    onSubmit={(e) => {
                      if (
                        !window.confirm(
                          `Remove "${member.name}" from ${team.name}? Member will stay in the global directory.`
                        )
                      ) {
                        e.preventDefault();
                      }
                    }}
                    className="m-0"
                  >
                    <input type="hidden" name="teamId" value={team._id} />
                    <input type="hidden" name="userId" value={member._id} />
                    <button
                      type="submit"
                      className="p-1 text-[#8A8886] hover:text-[#D13438] transition-colors rounded"
                      title="Remove member from this squad"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Merit Telemetry & Stats Row */}
              <div
                onClick={() =>
                  setSelectedMember({
                    ...member,
                    assignedTeams: [{ _id: team._id, name: team.name }],
                  })
                }
                className="pt-2 border-t border-[#F3F2F1] dark:border-[#292827] cursor-pointer"
              >
                <div className="grid grid-cols-4 gap-1 text-[10px] text-[#605E5C] dark:text-[#C8C6C4] mb-1.5">
                  <div title={`Tenure: ${merit.workingDays} working days since joining`} className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#0078D4]" />
                    <span>{merit.workingDays}d</span>
                  </div>
                  <div title={`Deliverables: ${merit.completedProjects} completed projects, ${merit.currentProjects} active`} className="flex items-center gap-1">
                    <CheckSquare className="w-3 h-3 text-[#107C10]" />
                    <span>{merit.completedProjects} done</span>
                  </div>
                  <div title={`Average Rating: ${((merit.supervisorRating + merit.teamLeadRating) / 2).toFixed(1)}/5 (Lead: ${merit.teamLeadRating}, Sup: ${merit.supervisorRating})`} className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                    <span>{((merit.supervisorRating + merit.teamLeadRating) / 2).toFixed(1)} ★</span>
                  </div>
                  <div title={`Composite Merit Score: ${merit.overallMeritScore}% (Threshold for next rank: ${merit.promotionThreshold}%)`} className="flex items-center justify-end font-semibold">
                    <span className={merit.isPromotionReady ? "text-emerald-600 dark:text-emerald-400 font-bold" : `${theme.accentText} font-bold`}>
                      {merit.overallMeritScore}% Merit
                    </span>
                  </div>
                </div>

                {/* Micro Progress Bar towards Next Rank */}
                {merit.currentRank < 5 ? (
                  <div>
                    <div className="flex items-center justify-between text-[9px] text-[#8A8886] mb-0.5">
                      <span>Target: Rank {merit.nextRank} ({merit.promotionThreshold}% req)</span>
                      <span className={`font-bold ${theme.accentText}`}>{merit.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-[#E1DFDD] dark:bg-[#3B3A39] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${merit.isPromotionReady
                          ? "bg-emerald-500 shadow-sm"
                          : merit.progressPercent >= 80
                            ? "bg-amber-500"
                            : `bg-gradient-to-r ${theme.bar}`
                          }`}
                        style={{ width: `${merit.progressPercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" />
                    <span>Principal Tier: Strategic Mentorship &amp; Architecture</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {team.members.length === 0 && (
          <div className="text-center py-6 text-xs text-[#8A8886] italic">
            No members currently assigned to this team. Use &quot;Manage &amp; Rotate&quot; to assign members.
          </div>
        )}
      </div>

      {/* Quick Add Member Footer */}
      <div className="p-3 border-t border-[#F3F2F1] dark:border-[#292827] bg-white dark:bg-[#201F1E]">
        <form action={linkUserToTeam} className="flex gap-2">
          <input type="hidden" name="teamId" value={team._id} />
          <select
            name="userId"
            className="w-full p-1.5 text-xs bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none cursor-pointer"
            defaultValue=""
            required
          >
            <option value="" disabled>
              + Quick add company member...
            </option>
            {availableUsersToRotate.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.position || u.role} - R{u.rank || "1"})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className={`px-2.5 py-1.5 text-white rounded-[4px] text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors ${theme.solidBtn}`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Member Profile Popup Modal */}
      {selectedMember && (
        <MemberProfileModal
          user={selectedMember}
          currentRole={currentRole}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* ===================== ROTATE & MANAGE TEAM MODAL ===================== */}
      {isRotateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#1B1A19]">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[#0078D4]" />
                <div>
                  <h3 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF]">
                    Rotate &amp; Manage Squad: {team.name}
                  </h3>
                  <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                    Add or remove squad members to rotate capacity dynamically across initiatives.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRotateModalOpen(false)}
                className="text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424] p-1.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
              {/* Current Active Squad Members */}
              <div>
                <h4 className="font-bold text-[#242424] dark:text-[#FFFFFF] uppercase tracking-wider text-[11px] mb-2 flex items-center justify-between">
                  <span>Current Team Members ({team.members.length})</span>
                  <span className="text-[#8A8886] font-normal normal-case">
                    Click Remove to rotate out
                  </span>
                </h4>

                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-2.5 rounded-[6px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] font-bold text-[10px] flex items-center justify-center shrink-0">
                          {member.name.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-[#242424] dark:text-[#FFFFFF] block truncate">
                            {member.name}
                          </span>
                          <span className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4] block truncate">
                            {member.position || member.role} • Rank {member.rank || "1"}
                          </span>
                        </div>
                      </div>

                      <form action={unlinkUserFromTeam}>
                        <input type="hidden" name="teamId" value={team._id} />
                        <input type="hidden" name="userId" value={member._id} />
                        <button
                          type="submit"
                          className="px-2.5 py-1 text-xs bg-[#FDE7E9] dark:bg-[#44171A] text-[#D13438] dark:text-[#F1707B] rounded-[4px] hover:bg-[#D13438] hover:text-white transition-colors font-medium flex items-center gap-1"
                          title="Rotate out from this team"
                        >
                          <UserMinus className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </form>
                    </div>
                  ))}

                  {team.members.length === 0 && (
                    <p className="text-[#8A8886] italic py-2">No members in this team.</p>
                  )}
                </div>
              </div>

              {/* Rotate In / Add Company Members */}
              <div className="pt-4 border-t border-[#E1DFDD] dark:border-[#3B3A39]">
                <h4 className="font-bold text-[#242424] dark:text-[#FFFFFF] uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-[#107C10]" />
                  <span>Rotate In Available Organization Members</span>
                </h4>

                <form action={linkUserToTeam} className="flex gap-2 items-center">
                  <input type="hidden" name="teamId" value={team._id} />
                  <select
                    name="userId"
                    value={selectedAddUserId}
                    onChange={(e) => setSelectedAddUserId(e.target.value)}
                    required
                    className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none cursor-pointer"
                  >
                    <option value="">Select company member to assign...</option>
                    {availableUsersToRotate.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} — {u.position || u.role} (Rank {u.rank || "1"})
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[4px] font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Assign to Squad</span>
                  </button>
                </form>

                {availableUsersToRotate.length === 0 && (
                  <p className="text-[#8A8886] italic text-[11px] mt-2">
                    All available active staff members are already in this team.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end p-4 border-t border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#1B1A19]">
              <button
                type="button"
                onClick={() => setIsRotateModalOpen(false)}
                className={`px-4 py-1.5 text-white rounded-[4px] font-semibold text-xs shadow-sm transition-colors ${theme.solidBtn}`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
