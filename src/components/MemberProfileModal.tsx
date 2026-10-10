"use client";

import { useState } from "react";
import {
  updateUserProfile,
  updateMemberMeritStats,
  promoteMemberByMerit,
  archiveMemberAction,
  restoreMemberAction,
  resignMemberAction,
} from "@/actions";
import { normalizeRole } from "@/server/auth/rbac";
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
  Archive,
  RotateCcw,
  LogOut,
  AlertTriangle,
  Target,
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
  currentRole?: string;
  currentUserId?: string;
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
  currentRole,
  currentUserId,
}: MemberProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"merit" | "profile" | "rate">("merit");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isResignConfirmOpen, setIsResignConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const normalizedCurrentRole = normalizeRole(currentRole);
  const normalizedTargetRole = normalizeRole(user.role);
  const isSelf = Boolean(currentUserId && currentUserId === user._id);

  // Archiving permission: Superuser can archive all, Owner can archive manager/TL/employee, Manager can archive TL/employee
  const canArchive =
    normalizedCurrentRole === "superuser" ||
    (normalizedCurrentRole === "owner" && normalizedTargetRole !== "superuser") ||
    (normalizedCurrentRole === "manager" && !["owner", "superuser", "manager"].includes(normalizedTargetRole));

  const canPromote = ["owner", "manager", "superuser"].includes(normalizedCurrentRole);
  const canRate = ["owner", "manager", "teamlead", "superuser"].includes(normalizedCurrentRole);

  const handleArchive = async () => {
    setActionLoading(true);
    try {
      const fd = new FormData();
      fd.set("userId", user._id);
      const res = await archiveMemberAction(fd);
      if (res.success) {
        setActionFeedback("Member archived successfully.");
        if (onUpdated) onUpdated();
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        alert(res.error || "Failed to archive member.");
      }
    } catch (err: any) {
      alert(err.message || "Error archiving member");
    } finally {
      setActionLoading(false);
      setIsArchiveConfirmOpen(false);
    }
  };

  const handleRestore = async () => {
    setActionLoading(true);
    try {
      const fd = new FormData();
      fd.set("userId", user._id);
      const res = await restoreMemberAction(fd);
      if (res.success) {
        setActionFeedback("Member restored to active working roster.");
        if (onUpdated) onUpdated();
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        alert(res.error || "Failed to restore member.");
      }
    } catch (err: any) {
      alert(err.message || "Error restoring member");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResign = async () => {
    setActionLoading(true);
    try {
      const fd = new FormData();
      fd.set("userId", user._id);
      const res = await resignMemberAction(fd);
      if (res.success) {
        alert("Your resignation has been submitted and processed. Session will now log out.");
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = "/auth/login";
      } else {
        alert(res.error || "Failed to submit resignation.");
      }
    } catch (err: any) {
      alert(err.message || "Error submitting resignation");
    } finally {
      setActionLoading(false);
      setIsResignConfirmOpen(false);
    }
  };

  // Compute live deterministic merit telemetry
  const merit: MeritEvaluationResult = calculateMeritEvaluation(user);
  const rankLabel = RANK_DESCRIPTIONS[user.rank || "1"] || `Rank ${user.rank || "1"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[12px] max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col relative">
        {/* Readiness accent ribbon */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          merit.isPromotionReady
            ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"
            : "bg-gradient-to-r from-[#0078D4] via-[#479EF5] to-[#0078D4]"
        }`} />
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E1DFDD] dark:border-[#3B3A39] bg-gradient-to-r from-[#F4F9FE] to-[#FAF9F8] dark:from-[#1C2B3D] dark:to-[#1B1A19]">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0078D4] to-[#479EF5] text-white flex items-center justify-center font-extrabold text-sm uppercase shadow-md ring-2 ring-white dark:ring-[#201F1E]">
                {user.name.substring(0, 2)}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#201F1E] ${
                  user.status === "Working" || !user.status ? "bg-emerald-500" : user.status === "Quit" ? "bg-amber-500" : "bg-rose-500"
                }`}
                title={user.status || "Working"}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base text-[#242424] dark:text-[#FFFFFF]">
                  {user.name}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-extrabold bg-[#0078D4] text-white shadow-sm">
                  {merit.overallMeritScore}%
                </span>
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
            className="text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424] hover:bg-black/5 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs — segmented control */}
        <div className="px-6 pt-3 bg-white dark:bg-[#201F1E]">
          <div className="flex gap-1 p-1 rounded-[8px] bg-[#F3F2F1] dark:bg-[#292827] w-full sm:w-auto sm:inline-flex">
          <button
            onClick={() => setActiveTab("merit")}
            className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-[6px] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "merit"
                ? "bg-white dark:bg-[#201F1E] text-[#0078D4] dark:text-[#479EF5] shadow-sm"
                : "text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Merit Telemetry ({merit.overallMeritScore}%)</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-[6px] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "profile"
                ? "bg-white dark:bg-[#201F1E] text-[#0078D4] dark:text-[#479EF5] shadow-sm"
                : "text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Member Record</span>
          </button>

          {canRate && (
            <button
              onClick={() => setActiveTab("rate")}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-[6px] transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "rate"
                  ? "bg-white dark:bg-[#201F1E] text-[#0078D4] dark:text-[#479EF5] shadow-sm"
                  : "text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Ratings &amp; Reviews</span>
            </button>
          )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {/* ===================== TAB 1: MERIT & PROMOTION TELEMETRY ===================== */}
          {activeTab === "merit" && (
            <div className="space-y-5 text-xs">
              {/* Overall Merit Score & Next Rank Banner */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#0078D4] to-[#004578] dark:from-[#1C2B3D] dark:to-[#0F1B2D] rounded-[10px] p-5 shadow-md text-white">
                <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10" />
                <div className="absolute -right-2 top-8 w-20 h-20 rounded-full bg-white/10" />
                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest block mb-1">
                      Objective Merit Score (Anti-Politics System)
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-4xl font-extrabold tracking-tight">
                        {merit.overallMeritScore}%
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${
                          merit.isPromotionReady
                            ? "bg-emerald-400 text-emerald-950"
                            : "bg-white/20 text-white border border-white/30"
                        }`}
                      >
                        {merit.readinessStatus}
                      </span>
                    </div>
                  </div>

                  {merit.nextRank && (
                    <div className="text-left sm:text-right bg-white/10 border border-white/20 rounded-[6px] px-3 py-2">
                      <span className="text-[10px] text-white/70 uppercase block">
                        Promotion Target
                      </span>
                      <span className="text-sm font-extrabold">
                        Rank {merit.nextRank} • {merit.promotionThreshold}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress Bar towards Next Rank */}
                {merit.nextRank ? (
                  <div className="relative">
                    <div className="flex justify-between text-[11px] font-medium text-white/80 mb-1.5">
                      <span>Progress toward Rank {merit.nextRank} promotion</span>
                      <span className="font-bold">{merit.progressPercent}% of target</span>
                    </div>
                    <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          merit.isPromotionReady ? "bg-emerald-300" : "bg-white"
                        }`}
                        style={{ width: `${merit.progressPercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="relative text-xs text-white/90 font-semibold">
                    Top corporate rank attained. Governing architecture and organizational mentorship.
                  </p>
                )}

                {/* 1-Click Merit Promotion Approval if Eligible */}
                {merit.isPromotionReady && merit.nextRank && (
                  <div className="relative mt-4 pt-3 border-t border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/10 p-3 rounded-[6px]">
                    <div className="flex items-center gap-2 text-white font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Verified: all tenure, project, and rating criteria satisfied.</span>
                    </div>

                    {canPromote ? (
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
                          className="px-4 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 rounded-[4px] font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Promote to Rank {merit.nextRank}</span>
                        </button>
                      </form>
                    ) : (
                      <span className="text-[11px] font-semibold text-white/90">
                        Pending Management Promotion Execution
                      </span>
                    )}
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
                  <div className="p-3 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#0078D4]" />
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] uppercase flex items-center gap-1.5 mb-1.5 font-bold">
                      <span className="w-5 h-5 rounded-[4px] bg-[#EBF3FC] dark:bg-[#1C2B3D] flex items-center justify-center shrink-0">
                        <Clock className="w-3 h-3 text-[#0078D4]" />
                      </span>
                      <span>Tenure Days</span>
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
                  <div className="p-3 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] uppercase flex items-center gap-1.5 mb-1.5 font-bold">
                      <span className="w-5 h-5 rounded-[4px] bg-[#DFF6DD] dark:bg-[#0F3818] flex items-center justify-center shrink-0">
                        <CheckSquare className="w-3 h-3 text-[#107C10]" />
                      </span>
                      <span>Projects</span>
                    </span>
                    <span className="text-base font-bold text-[#107C10] dark:text-[#54B054] block">
                      {merit.completedProjects} Delivered
                    </span>
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] block mt-1">
                      {merit.currentProjects} Active Project(s)
                    </span>
                  </div>

                  {/* Team Lead Rating */}
                  <div className="p-3 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#0078D4]" />
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] uppercase flex items-center gap-1.5 mb-1.5 font-bold">
                      <span className="w-5 h-5 rounded-[4px] bg-[#EBF3FC] dark:bg-[#1C2B3D] flex items-center justify-center shrink-0">
                        <Star className="w-3 h-3 text-[#0078D4] fill-[#0078D4]" />
                      </span>
                      <span>Lead Rating</span>
                    </span>
                    {merit.teamLeadRating > 0 ? (
                      <span className="text-base font-bold text-[#0078D4] flex items-center gap-1">
                        <Star className="w-4 h-4 fill-[#0078D4] text-[#0078D4]" />
                        <span>{merit.teamLeadRating.toFixed(1)} / 5.0</span>
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-[#8A8886] flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#8A8886]" />
                        <span>Not Yet Rated</span>
                      </span>
                    )}
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] block mt-1">
                      {merit.teamLeadRating > 0 ? "Sprint execution peer score" : "Pending TL sprint review"}
                    </span>
                  </div>

                  {/* Supervisor Rating */}
                  <div className="p-3 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#5C2D91]" />
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] uppercase flex items-center gap-1.5 mb-1.5 font-bold">
                      <span className="w-5 h-5 rounded-[4px] bg-[#EDE7F6] dark:bg-[#2E1F4D] flex items-center justify-center shrink-0">
                        <Star className="w-3 h-3 text-[#5C2D91] fill-[#5C2D91]" />
                      </span>
                      <span>Supervisor</span>
                    </span>
                    {merit.supervisorRating > 0 ? (
                      <span className="text-base font-bold text-[#5C2D91] dark:text-[#B4A0FF] flex items-center gap-1">
                        <Star className="w-4 h-4 fill-[#5C2D91] text-[#5C2D91]" />
                        <span>{merit.supervisorRating.toFixed(1)} / 5.0</span>
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-[#8A8886] flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#8A8886]" />
                        <span>Not Yet Rated</span>
                      </span>
                    )}
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] block mt-1">
                      {merit.supervisorRating > 0 ? "Management review score" : "Pending supervisor evaluation"}
                    </span>
                  </div>

                  {/* Performance Execution Index */}
                  <div className="p-3 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-teal-500" />
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] uppercase flex items-center gap-1.5 mb-1.5 font-bold">
                      <span className="w-5 h-5 rounded-[4px] bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-3 h-3 text-teal-600" />
                      </span>
                      <span>Performance</span>
                    </span>
                    <span className="text-base font-bold text-[#242424] dark:text-[#FFFFFF] block">
                      {merit.performanceScore > 0 ? `${merit.performanceScore} / 100` : "0 / 100 (Unreviewed)"}
                    </span>
                    <span className="text-[10px] text-[#107C10] block mt-1">
                      {merit.performanceScore > 0 ? "Task delivery rate" : "Awaiting initial sprint deliverables"}
                    </span>
                  </div>

                  {/* Domain Relevancy Match */}
                  <div className="p-3 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] uppercase flex items-center gap-1.5 mb-1.5 font-bold">
                      <span className="w-5 h-5 rounded-[4px] bg-[#FFF4CE] dark:bg-[#4A3E09] flex items-center justify-center shrink-0">
                        <Target className="w-3 h-3 text-[#8F6B00]" />
                      </span>
                      <span>Relevancy</span>
                    </span>
                    <span className="text-base font-bold text-[#242424] dark:text-[#FFFFFF] block">
                      {merit.relevancyScore > 0 ? `${merit.relevancyScore}% Match` : "Pending Skill Review"}
                    </span>
                    <span className="text-[10px] text-[#0078D4] block mt-1">
                      {merit.relevancyScore > 0 ? "Skill & capability match" : "Requires technical alignment"}
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

              {/* Lifecycle & Governance Card */}
              <div className="p-4 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>Employment Lifecycle &amp; Governance</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      user.status === "Archived"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        : user.status === "Resigned"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    }`}
                  >
                    {user.status || "Working"}
                  </span>
                </div>

                <p className="text-[11px] text-[#605E5C] dark:text-[#A19F9D] mb-3 leading-relaxed">
                  {user.status === "Archived"
                    ? "This member is currently archived. All active team and project assignments have been detached."
                    : user.status === "Resigned"
                    ? "This member has voluntarily resigned and concluded their tenure with the organization."
                    : "Active organization member. Management can archive staff upon offboarding, or employees may submit voluntary resignation."}
                </p>

                {actionFeedback && (
                  <div className="mb-3 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                    {actionFeedback}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F3F2F1] dark:border-[#292827]">
                  {/* Archive button for Owner, Manager, Superuser (when member is Working) */}
                  {canArchive && (user.status === "Working" || !user.status) && !isSelf && (
                    <button
                      type="button"
                      onClick={() => setIsArchiveConfirmOpen(true)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-[4px] border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive Member</span>
                    </button>
                  )}

                  {/* Restore button for Owner, Manager, Superuser (when member is Archived or Resigned) */}
                  {canArchive && (user.status === "Archived" || user.status === "Resigned") && (
                    <button
                      type="button"
                      onClick={handleRestore}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-[4px] border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore to Active Roster</span>
                    </button>
                  )}

                  {/* Resign / Quit button for Employees or Self */}
                  {(isSelf || normalizeRole(currentRole) === "employee") && (user.status === "Working" || !user.status) && (
                    <button
                      type="button"
                      onClick={() => setIsResignConfirmOpen(true)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-[4px] border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Resign / Quit Organization</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Archive Confirmation Dialog */}
              {isArchiveConfirmOpen && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-[8px] space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Confirm Archiving Member: {user.name}</span>
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                    Are you sure you want to archive <strong>{user.name}</strong> ({user.role.toUpperCase()})? This will offboard them from active company operations and release their team assignments.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsArchiveConfirmOpen(false)}
                      className="px-3 py-1 rounded-[4px] border border-rose-300 bg-white dark:bg-[#201F1E] text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleArchive}
                      disabled={actionLoading}
                      className="px-3 py-1 rounded-[4px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>{actionLoading ? "Archiving..." : "Yes, Archive Member"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Resign Confirmation Dialog */}
              {isResignConfirmOpen && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-[8px] space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Confirm Voluntary Resignation</span>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                    Are you sure you wish to submit your formal resignation? Your status will be updated to Resigned, your account will be offboarded, and your active session will terminate.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsResignConfirmOpen(false)}
                      className="px-3 py-1 rounded-[4px] border border-amber-300 bg-white dark:bg-[#201F1E] text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleResign}
                      disabled={actionLoading}
                      className="px-3 py-1 rounded-[4px] bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{actionLoading ? "Processing..." : "Yes, Submit Resignation"}</span>
                    </button>
                  </div>
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
