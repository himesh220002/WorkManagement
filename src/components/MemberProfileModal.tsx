"use client";

import { useState } from "react";
import { updateUserProfile, updateMemberMeritStats, promoteMemberByMerit } from "@/actions";
import { Badge } from "@/components/ui/Badge";
import {
  calculateMeritEvaluation,
  UserMeritData,
  MeritEvaluationResult,
} from "@/utils/meritEvaluation";
import {
  X,
  Award,
  Briefcase,
  Edit3,
  CheckCircle2,
  Clock,
  Users,
  Shield,
  FileText,
  TrendingUp,
  Star,
  CheckSquare,
  AlertCircle,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";

export interface UserDetail extends UserMeritData {
  _id: string;
  name: string;
  email?: string;
  role: string;
  position?: string;
  status?: string;
  leftDate?: string | null;
  details?: string;
  assignedTeams?: Array<{ _id: string; name: string }>;
}

interface MemberProfileModalProps {
  user: UserDetail;
  onClose: () => void;
  onUpdated?: () => void;
}

const RANK_DESCRIPTIONS: Record<string, string> = {
  "1": "Rank 1 • Associate / Junior Specialist",
  "2": "Rank 2 • Mid-Level Professional",
  "3": "Rank 3 • Senior Specialist",
  "4": "Rank 4 • Staff / Team Lead",
  "5": "Rank 5 • Principal / Executive Director",
};

export default function MemberProfileModal({
  user,
  onClose,
  onUpdated,
}: MemberProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"merit" | "profile" | "rate">("merit");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Compute live deterministic merit telemetry
  const merit: MeritEvaluationResult = calculateMeritEvaluation(user);
  const rankLabel = RANK_DESCRIPTIONS[user.rank || "1"] || `Rank ${user.rank || "1"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#1B1A19]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] flex items-center justify-center font-bold text-sm uppercase shrink-0 border border-[#0078D4]/30">
              {user.name.substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF]">
                  {user.name}
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-[3px] font-semibold ${
                    user.status === "Working" || !user.status
                      ? "bg-[#DFF6DD] text-[#107C10] dark:bg-[#0F3818] dark:text-[#54B054]"
                      : user.status === "Quit"
                      ? "bg-[#FFF4CE] text-[#8F6B00] dark:bg-[#4A3E09] dark:text-[#FFD335]"
                      : "bg-[#FDE7E9] text-[#D13438] dark:bg-[#44171A] dark:text-[#F1707B]"
                  }`}
                >
                  {user.status || "Working"}
                </span>
                {merit.isPromotionReady && (
                  <span className="text-[10px] px-2 py-0.5 rounded-[3px] font-bold bg-[#DFF6DD] text-[#107C10] animate-pulse flex items-center gap-1 border border-[#107C10]/30">
                    <Sparkles className="w-3 h-3" />
                    <span>Eligible for Rank {merit.nextRank}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                {user.role} {user.position ? `• ${user.position}` : ""} • {rankLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424] p-1.5 rounded-[4px]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E1DFDD] dark:border-[#3B3A39] px-6 bg-white dark:bg-[#201F1E] gap-2 pt-2">
          <button
            onClick={() => setActiveTab("merit")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "merit"
                ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
                : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Merit Telemetry &amp; Promotion ({merit.overallMeritScore}%)</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "profile"
                ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
                : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Member Record &amp; Squads</span>
          </button>

          <button
            onClick={() => setActiveTab("rate")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "rate"
                ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
                : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Update Ratings &amp; Reviews</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {/* ===================== TAB 1: MERIT & PROMOTION TELEMETRY ===================== */}
          {activeTab === "merit" && (
            <div className="space-y-5 text-xs">
              {/* Overall Merit Score & Next Rank Banner */}
              <div className="bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider block mb-1">
                      Objective Merit Score (Anti-Politics System)
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[#242424] dark:text-[#FFFFFF]">
                        {merit.overallMeritScore}%
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-[4px] ${
                          merit.isPromotionReady
                            ? "bg-[#DFF6DD] text-[#107C10] dark:bg-[#0F3818] dark:text-[#54B054]"
                            : merit.overallMeritScore >= 75
                            ? "bg-[#EBF3FC] text-[#0078D4] dark:bg-[#1C2B3D] dark:text-[#479EF5]"
                            : "bg-[#FFF4CE] text-[#8F6B00] dark:bg-[#4A3E09] dark:text-[#FFD335]"
                        }`}
                      >
                        {merit.readinessStatus}
                      </span>
                    </div>
                  </div>

                  {merit.nextRank && (
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] uppercase block">
                        Promotion Target
                      </span>
                      <span className="text-sm font-bold text-[#0078D4] dark:text-[#479EF5]">
                        Rank {merit.nextRank} Threshold: {merit.promotionThreshold}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress Bar towards Next Rank */}
                {merit.nextRank ? (
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#605E5C] dark:text-[#C8C6C4] mb-1">
                      <span>Progress toward Rank {merit.nextRank} promotion</span>
                      <span>{merit.progressPercent}% of target reached</span>
                    </div>
                    <div className="w-full bg-[#EDEBE9] dark:bg-[#323130] h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          merit.isPromotionReady ? "bg-[#107C10]" : "bg-[#0078D4]"
                        }`}
                        style={{ width: `${merit.progressPercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#107C10] font-semibold">
                    Top corporate rank attained. Governing architecture and organizational mentorship.
                  </p>
                )}

                {/* 1-Click Merit Promotion Approval if Eligible */}
                {merit.isPromotionReady && merit.nextRank && (
                  <div className="mt-4 pt-3 border-t border-[#E1DFDD] dark:border-[#3B3A39] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#DFF6DD]/40 dark:bg-[#0F3818]/30 p-3 rounded-[6px]">
                    <div className="flex items-center gap-2 text-[#107C10] dark:text-[#54B054] font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Verified: All tenure, project, and rating criteria satisfied.</span>
                    </div>

                    <form
                      action={async (formData) => {
                        await promoteMemberByMerit(formData);
                        if (onUpdated) onUpdated();
                        onClose();
                      }}
                      className="m-0"
                    >
                      <input type="hidden" name="userId" value={user._id} />
                      <input type="hidden" name="newRank" value={merit.nextRank.toString()} />
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#107C10] hover:bg-[#0E6A0E] text-white rounded-[4px] font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Promote to Rank {merit.nextRank}</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Verified Metrics Breakdown Grid */}
              <div>
                <h4 className="text-[11px] font-bold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider mb-2.5">
                  Verified Merit Components Breakdown
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Tenure / Working Days */}
                  <div className="p-3 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px]">
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] uppercase block mb-1">
                      Active Tenure Days
                    </span>
                    <span className="text-base font-bold text-[#242424] dark:text-[#FFFFFF] block">
                      {merit.workingDays} Days
                    </span>
                    <span
                      className={`text-[10px] font-medium flex items-center gap-1 mt-1 ${
                        merit.tenureSatisfied ? "text-[#107C10]" : "text-[#8F6B00]"
                      }`}
                    >
                      {merit.tenureSatisfied ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>Req: {merit.minTenureRequired}d</span>
                    </span>
                  </div>

                  {/* Completed Projects */}
                  <div className="p-3 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px]">
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] uppercase block mb-1">
                      Completed Projects
                    </span>
                    <span className="text-base font-bold text-[#107C10] dark:text-[#54B054] block">
                      {merit.completedProjects} Delivered
                    </span>
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] block mt-1">
                      {merit.currentProjects} Active Project(s)
                    </span>
                  </div>

                  {/* Team Lead Rating */}
                  <div className="p-3 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px]">
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] uppercase block mb-1">
                      Team Lead Rating
                    </span>
                    <span className="text-base font-bold text-[#0078D4] flex items-center gap-1">
                      <Star className="w-4 h-4 fill-[#0078D4] text-[#0078D4]" />
                      <span>{merit.teamLeadRating.toFixed(1)} / 5.0</span>
                    </span>
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] block mt-1">
                      Sprint execution peer score
                    </span>
                  </div>

                  {/* Supervisor Rating */}
                  <div className="p-3 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px]">
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] uppercase block mb-1">
                      Supervisor Rating
                    </span>
                    <span className="text-base font-bold text-[#5C2D91] dark:text-[#B4A0FF] flex items-center gap-1">
                      <Star className="w-4 h-4 fill-[#5C2D91] text-[#5C2D91]" />
                      <span>{merit.supervisorRating.toFixed(1)} / 5.0</span>
                    </span>
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] block mt-1">
                      Management review score
                    </span>
                  </div>

                  {/* Performance Execution Index */}
                  <div className="p-3 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px]">
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] uppercase block mb-1">
                      Performance Index
                    </span>
                    <span className="text-base font-bold text-[#242424] dark:text-[#FFFFFF] block">
                      {merit.performanceScore} / 100
                    </span>
                    <span className="text-[10px] text-[#107C10] block mt-1">
                      Task delivery rate
                    </span>
                  </div>

                  {/* Domain Relevancy Match */}
                  <div className="p-3 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px]">
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] uppercase block mb-1">
                      Domain Relevancy
                    </span>
                    <span className="text-base font-bold text-[#242424] dark:text-[#FFFFFF] block">
                      {merit.relevancyScore}% Match
                    </span>
                    <span className="text-[10px] text-[#0078D4] block mt-1">
                      Skill &amp; capability match
                    </span>
                  </div>
                </div>
              </div>

              {/* Actionable Feedback & Improvement Chances */}
              <div className="p-4 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px]">
                <h4 className="text-[11px] font-bold text-[#242424] dark:text-[#FFFFFF] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>Transparent Promotion Guidance &amp; Growth Path</span>
                </h4>
                <p className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4] mb-2.5">
                  Clear, objective milestones to earn the next rank without subjectivity or office politics:
                </p>
                <ul className="space-y-1.5 text-xs text-[#242424] dark:text-[#FFFFFF]">
                  {merit.actionableFeedback.map((fb, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0078D4] mt-1.5 shrink-0" />
                      <span>{fb}</span>
                    </li>
                  ))}
                </ul>

                {user.remarks && (
                  <div className="mt-3 pt-3 border-t border-[#F3F2F1] dark:border-[#292827] text-xs">
                    <span className="font-semibold text-[#605E5C] dark:text-[#C8C6C4] block mb-0.5">
                      Formal Supervisor &amp; Lead Remarks:
                    </span>
                    <p className="text-[#242424] dark:text-[#FFFFFF] italic bg-[#FAF9F8] dark:bg-[#1B1A19] p-2 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39]">
                      &quot;{user.remarks}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================== TAB 2: MEMBER PROFILE & TEAMS ===================== */}
          {activeTab === "profile" && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px]">
                  <span className="text-[10px] font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>Department / Category</span>
                  </span>
                  <span className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF]">
                    {user.role}
                  </span>
                </div>

                <div className="p-3.5 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px]">
                  <span className="text-[10px] font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#107C10]" />
                    <span>Designated Role / Title</span>
                  </span>
                  <span className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF]">
                    {user.position || "Staff Professional"}
                  </span>
                </div>
              </div>

              {/* Assigned Squads */}
              <div className="p-4 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px]">
                <span className="text-[11px] font-bold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <Users className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>Assigned Squads &amp; Operational Units</span>
                </span>
                {user.assignedTeams && user.assignedTeams.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.assignedTeams.map((t) => (
                      <span
                        key={t._id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] font-semibold text-xs border border-[#0078D4]/20"
                      >
                        <Building2 className="w-3 h-3" />
                        {t.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#8A8886] italic">
                    Not currently linked to any team. Assign from any team card via Manage &amp; Rotate.
                  </p>
                )}
              </div>

              {/* Joined Date & Tenure */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px]">
                  <span className="text-[10px] font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-[#107C10]" />
                    <span>Joined Organization</span>
                  </span>
                  <span className="text-xs font-semibold text-[#242424] dark:text-[#FFFFFF]">
                    {user.joinedDate
                      ? new Date(user.joinedDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Not specified"}
                  </span>
                  <span className="text-[10px] text-[#605E5C] block mt-0.5">
                    ({merit.workingDays} days of service)
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px]">
                  <span className="text-[10px] font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#8F6B00]" />
                    <span>Active Status</span>
                  </span>
                  <span className="text-xs font-semibold text-[#242424] dark:text-[#FFFFFF]">
                    {user.leftDate
                      ? `Departed: ${new Date(user.leftDate).toLocaleDateString("en-US")}`
                      : "Currently Active Staff"}
                  </span>
                </div>
              </div>

              {user.details && (
                <div className="p-3.5 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px]">
                  <span className="text-[10px] font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 text-[#605E5C]" />
                    <span>Member Notes &amp; Specializations</span>
                  </span>
                  <p className="text-xs text-[#242424] dark:text-[#FFFFFF] leading-relaxed">
                    {user.details}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 3: UPDATE RATINGS & STATS ===================== */}
          {activeTab === "rate" && (
            <form
              action={async (formData) => {
                await updateMemberMeritStats(formData);
                if (onUpdated) onUpdated();
                onClose();
              }}
              className="space-y-4 text-xs"
            >
              <input type="hidden" name="userId" value={user._id} />

              <div className="p-3 bg-[#EBF3FC] dark:bg-[#1C2B3D] border border-[#0078D4]/20 rounded-[6px]">
                <p className="text-[11px] text-[#0078D4] dark:text-[#479EF5] font-medium leading-relaxed">
                  Regular merit updates allow performance to directly dictate progression. Data inputs calculate
                  instant readiness without office politics.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Team Lead Rating (1.0 to 5.0 ★)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    name="teamLeadRating"
                    defaultValue={merit.teamLeadRating}
                    required
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none focus:border-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Supervisor / Director Rating (1.0 to 5.0 ★)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    name="supervisorRating"
                    defaultValue={merit.supervisorRating}
                    required
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Completed Projects Assigned
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="completedProjectsCount"
                    defaultValue={merit.completedProjects}
                    required
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none focus:border-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Active Projects Assigned
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="currentProjectsCount"
                    defaultValue={merit.currentProjects}
                    required
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Performance Execution Index (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="performanceScore"
                    defaultValue={merit.performanceScore}
                    required
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none focus:border-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                    Domain Relevancy Match (0 - 100%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="relevancyScore"
                    defaultValue={merit.relevancyScore}
                    required
                    className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
                  Supervisor &amp; Team Lead Remarks / Constructive Feedback
                </label>
                <textarea
                  name="remarks"
                  defaultValue={user.remarks || ""}
                  rows={3}
                  placeholder="Specific observations, delivered milestones, technical impact..."
                  className="w-full p-2 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none focus:border-[#0078D4]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E1DFDD] dark:border-[#3B3A39]">
                <button
                  type="button"
                  onClick={() => setActiveTab("merit")}
                  className="px-4 py-2 border rounded-[4px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[4px] font-semibold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Merit Telemetry</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
