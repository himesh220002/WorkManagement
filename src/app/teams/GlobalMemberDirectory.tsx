"use client";

import { useState } from "react";
import MemberProfileModal, { UserDetail } from "@/components/MemberProfileModal";
import { updateMemberRoleTagAction } from "@/actions/member";
import { normalizeRole } from "@/server/auth/rbac";
import { useToast } from "@/components/ui/Toast";
import {
  calculateMeritEvaluation,
  getPromotionBadgeInfo,
  MeritEvaluationResult,
  PromotionBadgeInfo,
} from "@/utils/meritEvaluation";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Search,
  UserCheck,
  UserX,
  UserMinus,
  Award,
  Sparkles,
  Star,
  Clock,
  CheckSquare,
  TrendingUp,
  Crown,
  Target,
  ArrowUpRight,
  ShieldCheck,
  Shield,
  CheckCircle2,
  Lock,
  Tag,
} from "lucide-react";

interface GlobalMemberDirectoryProps {
  users: UserDetail[];
  currentRole?: string;
  currentUserId?: string;
}

type FilterOption = "all" | "ready" | "contender" | "rank1" | "rank2" | "rank3" | "rank4" | "rank5";

export default function GlobalMemberDirectory({
  users = [],
  currentRole,
  currentUserId,
}: GlobalMemberDirectoryProps) {
  const { success, error } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [isOpenWorking, setIsOpenWorking] = useState(true);
  const [isOpenQuit, setIsOpenQuit] = useState(false);
  const [isOpenDropped, setIsOpenDropped] = useState(false);

  const canMutateTags = ["owner", "manager", "superuser"].includes(
    (currentRole || "manager").toLowerCase()
  );

  const handleQuickRoleChange = async (
    e: React.MouseEvent,
    userId: string,
    userName: string,
    currentRoleStr?: string
  ) => {
    e.stopPropagation();
    const current = normalizeRole(currentRoleStr);

    if (current === "owner" || current === "superuser") {
      error("Owner and Developer tags are protected and cannot be altered by Managers.");
      return;
    }

    const nextRole = current === "teamlead" ? "employee" : "teamlead";
    try {
      const fd = new FormData();
      fd.set("userId", userId);
      fd.set("newRole", nextRole);
      const res = await updateMemberRoleTagAction(fd);
      if (res.success) {
        success(res.message || `Updated ${userName}'s tag to ${nextRole.toUpperCase()}`);
      } else {
        error(res.error || "Permission denied to alter tag");
      }
    } catch (err: any) {
      error(err.message);
    }
  };

  // Compute merit evaluations for each user
  const usersWithMerit = users.map((u) => {
    const merit = calculateMeritEvaluation(u);
    const badge = getPromotionBadgeInfo(merit);
    return { user: u, merit, badge };
  });

  // Calculate promotion stats across active personnel
  const activeStaff = usersWithMerit.filter(
    (item) => item.user.status === "Working" || !item.user.status
  );
  const readyCount = activeStaff.filter((item) => item.merit.isPromotionReady).length;
  const contenderCount = activeStaff.filter(
    (item) => item.merit.readinessStatus === "Strong Contender"
  ).length;

  const filtered = usersWithMerit.filter(({ user: u, merit }) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.position && u.position.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (activeFilter === "ready") return merit.isPromotionReady;
    if (activeFilter === "contender") return merit.readinessStatus === "Strong Contender";
    if (activeFilter === "rank1") return merit.currentRank === 1;
    if (activeFilter === "rank2") return merit.currentRank === 2;
    if (activeFilter === "rank3") return merit.currentRank === 3;
    if (activeFilter === "rank4") return merit.currentRank === 4;
    if (activeFilter === "rank5") return merit.currentRank === 5;
    return true;
  });

  const working = filtered.filter(
    (item) => item.user.status === "Working" || !item.user.status
  );
  const quit = filtered.filter(
    (item) => item.user.status === "Quit" || item.user.status === "Resigned"
  );
  const dropped = filtered.filter(
    (item) => item.user.status === "Dropped" || item.user.status === "Archived"
  );

  const renderMemberCard = ({
    user: u,
    merit,
    badge,
  }: {
    user: UserDetail;
    merit: MeritEvaluationResult;
    badge: PromotionBadgeInfo;
  }) => {
    const avgRating = ((merit.supervisorRating + merit.teamLeadRating) / 2).toFixed(1);

    return (
      <div
        key={u._id}
        onClick={() => setSelectedUser(u)}
        className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] hover:border-[#0078D4] dark:hover:border-[#0078D4] p-4 rounded-[8px] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
      >
        {/* Glowing Top accent when promotion ready */}
        {merit.isPromotionReady && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
        )}

        <div>
          {/* Header: Avatar, Name, Role, and Promotion Badge */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] flex items-center justify-center font-bold text-xs uppercase shrink-0 ring-2 ring-white dark:ring-[#201F1E] shadow-sm">
                {u.name.substring(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-xs sm:text-sm text-[#242424] dark:text-[#FFFFFF] truncate group-hover:text-[#0078D4] transition-colors">
                    {u.name}
                  </h4>
                  {u._id === currentUserId && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] border border-[#0078D4]/30">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {/* Corporate Role Tag */}
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      normalizeRole(u.role) === "owner" || normalizeRole(u.role) === "superuser"
                        ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700"
                        : normalizeRole(u.role) === "manager"
                        ? "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700"
                        : normalizeRole(u.role) === "teamlead"
                        ? "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-700"
                        : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
                    }`}
                  >
                    {normalizeRole(u.role) === "owner" ? (
                      <Crown className="w-2.5 h-2.5 text-amber-600" />
                    ) : normalizeRole(u.role) === "teamlead" ? (
                      <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                    ) : (
                      <UserCheck className="w-2.5 h-2.5 text-slate-600" />
                    )}
                    <span>{normalizeRole(u.role).toUpperCase()}</span>
                    {(normalizeRole(u.role) === "owner" || normalizeRole(u.role) === "superuser") && (
                      <span title="Protected: Owner tag cannot be changed by Managers">
                        <Lock className="w-2.5 h-2.5 text-amber-700 ml-0.5" />
                      </span>
                    )}
                  </span>

                  {/* Manager Tag Mutation: Change TL <-> Employee (Only visible to Managers & Owners) */}
                  {canMutateTags && !(normalizeRole(u.role) === "owner" || normalizeRole(u.role) === "superuser") && (
                    <button
                      type="button"
                      onClick={(e) => handleQuickRoleChange(e, u._id, u.name, u.role)}
                      className="px-1.5 py-0.5 text-[9px] rounded font-semibold border border-dashed border-[#0078D4]/40 hover:border-[#0078D4] text-[#0078D4] dark:text-[#479EF5] bg-white dark:bg-[#201F1E] hover:bg-[#EBF3FC] dark:hover:bg-[#1C2B3D] transition-colors cursor-pointer"
                      title="Manager permission: Toggle between Team Lead and Employee tag"
                    >
                      Make {normalizeRole(u.role) === "teamlead" ? "Employee" : "Team Lead"}
                    </button>
                  )}
                  {canMutateTags && (normalizeRole(u.role) === "owner" || normalizeRole(u.role) === "superuser") && (
                    <span className="text-[9px] text-amber-700 dark:text-amber-400 font-medium">
                      (Owner Protected)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4] truncate mt-0.5">
                  {u.position || u.role}
                </p>
              </div>
            </div>

            {/* Promotion Badge */}
            <div className="shrink-0">
              <span
                className={`text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full font-semibold border inline-flex items-center gap-1 shadow-sm ${badge.badgeStyle}`}
                title={`Status: ${merit.readinessStatus}`}
              >
                {badge.statusType === "ready" && (
                  <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                )}
                {badge.statusType === "contender" && (
                  <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                )}
                {badge.statusType === "principal" && (
                  <Crown className="w-3 h-3 text-purple-600" />
                )}
                <span>{badge.shortLabel}</span>
              </span>
            </div>
          </div>

          {/* Rank & Composite Merit Score Bar */}
          <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-[4px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#EDEBE9] dark:border-[#292827] mb-3">
            <span className="font-semibold text-[#242424] dark:text-[#FFFFFF] flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>Rank {merit.currentRank} Seniority</span>
            </span>
            <span
              className={`font-bold ${merit.isPromotionReady
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-[#0078D4]"
                }`}
            >
              {merit.overallMeritScore}% Merit Index
            </span>
          </div>

          {/* 4-Metric Objective Telemetry Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
            <div className="p-2 rounded-[4px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#F3F2F1] dark:border-[#292827]">
              <div className="flex items-center gap-1 text-[#8A8886] mb-0.5">
                <Clock className="w-3 h-3 text-[#0078D4]" />
                <span>Working Days</span>
              </div>
              <div className="font-bold text-[#242424] dark:text-[#FFFFFF]">
                {merit.workingDays}d{" "}
                <span className="text-[10px] font-normal text-[#8A8886]">
                  / {merit.minTenureRequired}d min
                </span>
              </div>
            </div>

            <div className="p-2 rounded-[4px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#F3F2F1] dark:border-[#292827]">
              <div className="flex items-center gap-1 text-[#8A8886] mb-0.5">
                <CheckSquare className="w-3 h-3 text-[#107C10]" />
                <span>Deliverables</span>
              </div>
              <div className="font-bold text-[#242424] dark:text-[#FFFFFF]">
                {merit.completedProjects} done{" "}
                <span className="text-[10px] font-normal text-[#8A8886]">
                  ({merit.currentProjects} active)
                </span>
              </div>
            </div>

            <div className="p-2 rounded-[4px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#F3F2F1] dark:border-[#292827]">
              <div className="flex items-center gap-1 text-[#8A8886] mb-0.5">
                <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                <span>Ratings (TL + Sup)</span>
              </div>
              <div className="font-bold text-[#242424] dark:text-[#FFFFFF]">
                {avgRating} ★{" "}
                <span className="text-[10px] font-normal text-[#8A8886]">
                  ({merit.teamLeadRating} / {merit.supervisorRating})
                </span>
              </div>
            </div>

            <div className="p-2 rounded-[4px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#F3F2F1] dark:border-[#292827]">
              <div className="flex items-center gap-1 text-[#8A8886] mb-0.5">
                <TrendingUp className="w-3 h-3 text-[#0078D4]" />
                <span>Performance</span>
              </div>
              <div className="font-bold text-[#242424] dark:text-[#FFFFFF]">
                {merit.performanceScore}%{" "}
                <span className="text-[10px] font-normal text-[#8A8886]">
                  ({merit.relevancyScore}% rel)
                </span>
              </div>
            </div>
          </div>

          {/* Progress towards Next Rank Bar */}
          {merit.currentRank < 5 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-[11px] text-[#605E5C] dark:text-[#C8C6C4] mb-1">
                <span>Target: Rank {merit.nextRank}</span>
                <span className="font-semibold text-[#0078D4]">
                  {merit.progressPercent}% ({merit.promotionThreshold}% req)
                </span>
              </div>
              <div className="w-full bg-[#EDEBE9] dark:bg-[#3B3A39] h-2 rounded-full overflow-hidden">
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
          )}

          {/* Sense of Achievement & Improvement Chance Highlight */}
          <div className="p-2.5 rounded-[4px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#EDEBE9] dark:border-[#292827] text-[11px] mb-3">
            {merit.isPromotionReady ? (
              <div className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 animate-pulse" />
                <span>All tenure, project &amp; performance benchmarks met. Promotion eligible!</span>
              </div>
            ) : merit.currentRank === 5 ? (
              <div className="flex items-start gap-1.5 text-purple-700 dark:text-purple-300 font-medium">
                <Crown className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-600" />
                <span>Principal tier reached. Strategic architectural and squad mentorship focus.</span>
              </div>
            ) : (
              <div className="flex items-start gap-1.5 text-[#605E5C] dark:text-[#C8C6C4]">
                <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#0078D4]" />
                <span className="line-clamp-2">
                  <strong className="text-[#242424] dark:text-[#FFFFFF]">Goal:</strong>{" "}
                  {merit.actionableFeedback[0] || "Continue active sprint deliverable cadence."}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#F3F2F1] dark:border-[#292827] text-[#8A8886]">
          <span>Audit trail verified</span>
          <span className="text-[#0078D4] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>Inspect Profile</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.14)] w-full">
      {/* Directory Header with Search & Merit Summary */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-5 pb-4 border-b border-[#E1DFDD] dark:border-[#3B3A39]">
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
            <div className="flex gap-2">
              <Users className="w-5 h-5 text-[#0078D4]" />
              <h2 className="text-xs sm:text-base font-bold text-[#242424] dark:text-[#FFFFFF]">
                Global Personnel &amp; Merit Progression Directory
              </h2>
            </div>
            <span className="text-center px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-[11px] font-semibold">
              Anti-Bias Objective Meritocracy
            </span>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
            Data-driven progression calculated from performance index, active tenure, deliverables, supervisor &amp; team lead reviews.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="w-4 h-4 text-[#8A8886] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, title..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
            />
          </div>
        </div>
      </div>

      {/* Filter Ribbon: All, Promotion Eligible, Contenders, Ranks */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 border-b border-[#F3F2F1] dark:border-[#292827] text-xs">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1.5 rounded-[4px] font-medium transition-colors shrink-0 ${activeFilter === "all"
            ? "bg-[#0078D4] text-white"
            : "bg-[#FAF9F8] dark:bg-[#1B1A19] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#F3F2F1]"
            }`}
        >
          All Members ({users.length})
        </button>

        <button
          onClick={() => setActiveFilter("ready")}
          className={`px-3 py-1.5 rounded-[4px] font-medium transition-colors shrink-0 flex items-center gap-1.5 ${activeFilter === "ready"
            ? "bg-emerald-600 text-white"
            : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800"
            }`}
        >
          <span>✨ Promotion Ready ({readyCount})</span>
        </button>

        <button
          onClick={() => setActiveFilter("contender")}
          className={`px-3 py-1.5 rounded-[4px] font-medium transition-colors shrink-0 flex items-center gap-1.5 ${activeFilter === "contender"
            ? "bg-amber-600 text-white"
            : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800"
            }`}
        >
          <Star className="w-3.5 h-3.5 fill-amber-500" />
          <span>Strong Contenders ({contenderCount})</span>
        </button>

        <span className="text-[#8A8886] mx-1">|</span>

        {(["rank1", "rank2", "rank3", "rank4", "rank5"] as FilterOption[]).map((r, i) => (
          <button
            key={r}
            onClick={() => setActiveFilter(r)}
            className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors shrink-0 ${activeFilter === r
              ? "bg-[#242424] text-white dark:bg-white dark:text-[#242424]"
              : "bg-[#FAF9F8] dark:bg-[#1B1A19] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#F3F2F1]"
              }`}
          >
            Rank {i + 1}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Working Active Members */}
        <div>
          <div
            onClick={() => setIsOpenWorking(!isOpenWorking)}
            className="flex items-center justify-between cursor-pointer py-2 border-b border-[#E1DFDD] dark:border-[#3B3A39] text-xs font-semibold text-[#107C10] select-none hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>Active Personnel ({working.length})</span>
            </div>
            {isOpenWorking ? (
              <ChevronUp className="w-4 h-4 text-[#605E5C]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#605E5C]" />
            )}
          </div>
          {isOpenWorking && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {working.map(renderMemberCard)}
              {working.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-[#8A8886] italic">
                  No active personnel matching the selected filter or search query.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quit Members */}
        <div>
          <div
            onClick={() => setIsOpenQuit(!isOpenQuit)}
            className="flex items-center justify-between cursor-pointer py-2 border-b border-[#E1DFDD] dark:border-[#3B3A39] text-xs font-semibold text-[#8F6B00] select-none hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <UserMinus className="w-4 h-4" />
              <span>Resigned / Quit ({quit.length})</span>
            </div>
            {isOpenQuit ? (
              <ChevronUp className="w-4 h-4 text-[#605E5C]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#605E5C]" />
            )}
          </div>
          {isOpenQuit && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {quit.map(renderMemberCard)}
              {quit.length === 0 && (
                <div className="col-span-full py-6 text-center text-xs text-[#8A8886] italic">
                  No resigned personnel found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dropped Members */}
        <div>
          <div
            onClick={() => setIsOpenDropped(!isOpenDropped)}
            className="flex items-center justify-between cursor-pointer py-2 border-b border-[#E1DFDD] dark:border-[#3B3A39] text-xs font-semibold text-[#D13438] select-none hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <UserX className="w-4 h-4" />
              <span>Dropped / Archived ({dropped.length})</span>
            </div>
            {isOpenDropped ? (
              <ChevronUp className="w-4 h-4 text-[#605E5C]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#605E5C]" />
            )}
          </div>
          {isOpenDropped && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {dropped.map(renderMemberCard)}
              {dropped.length === 0 && (
                <div className="col-span-full py-6 text-center text-xs text-[#8A8886] italic">
                  No archived personnel found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Member Profile Popup Modal */}
      {selectedUser && (
        <MemberProfileModal
          user={selectedUser}
          currentRole={currentRole}
          currentUserId={currentUserId}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

