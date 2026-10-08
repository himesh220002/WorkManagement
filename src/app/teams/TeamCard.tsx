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

  return (
    <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
      {/* Team Header */}
      <div className="flex flex-wrap gap-2 p-4 border-b border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#1B1A19] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-wrap font-bold text-sm text-[#242424] dark:text-[#FFFFFF]">
              {team.name}
            </h3>
            <p className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4]">
              {team.members.length} Assigned Members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Rotate/Manage Team Action: Restricted to Managers, Owners & Lead of this squad */}
          {canManage && (
            <button
              type="button"
              onClick={() => setIsRotateModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#0078D4] hover:bg-[#F3F2F1] font-medium transition-colors cursor-pointer"
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
              className="p-2.5 rounded-[6px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] hover:border-[#0078D4] transition-all group flex flex-col gap-2"
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
                  <div className="w-8 h-8 rounded-full bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] flex items-center justify-center font-bold text-[10px] uppercase shrink-0 mt-0.5">
                    {member.name.substring(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs text-[#242424] dark:text-[#FFFFFF] truncate group-hover:text-[#0078D4] transition-colors">
                        {member.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-[#EDEBE9] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4]">
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
                    <span className={merit.isPromotionReady ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-[#242424] dark:text-[#FFFFFF]"}>
                      {merit.overallMeritScore}% Merit
                    </span>
                  </div>
                </div>

                {/* Micro Progress Bar towards Next Rank */}
                {merit.currentRank < 5 ? (
                  <div>
                    <div className="flex items-center justify-between text-[9px] text-[#8A8886] mb-0.5">
                      <span>Target: Rank {merit.nextRank} ({merit.promotionThreshold}% req)</span>
                      <span className="font-semibold text-[#0078D4]">{merit.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-[#E1DFDD] dark:bg-[#3B3A39] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${merit.isPromotionReady
                          ? "bg-emerald-500 shadow-sm"
                          : merit.progressPercent >= 80
                            ? "bg-amber-500"
                            : "bg-[#0078D4]"
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
            className="px-2.5 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[4px] text-xs font-semibold flex items-center gap-1"
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
                    className="flex-1 p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none cursor-pointer"
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
                className="px-4 py-1.5 bg-[#0078D4] text-white rounded-[4px] font-semibold text-xs"
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
