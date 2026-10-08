"use client";

import React, { useState, useMemo } from "react";
import {
  Contact2,
  Building2,
  TrendingUp,
  DollarSign,
  HeartHandshake,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  User,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Trash2,
  X,
  FileText,
  BadgeDollarSign,
  ExternalLink,
  Video,
  Mic,
  Hash,
  Link2,
  Copy,
} from "lucide-react";
import { addClientAccount, updateClientStage, addClientInteraction, deleteClientAccount } from "@/actions/crm";
import { createMeeting } from "@/actions/meetings";
import Link from "next/link";

interface CrmMeeting {
  _id: string;
  clientAccountId?: string | null;
  title: string;
  platform: "google_meet" | "zoom" | "slack" | "discord" | "in_person";
  meetingLink: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  discordChannelName?: string;
  discordChannelUrl?: string;
  slackChannelName?: string;
  transcript?: string;
  attendees?: Array<{ name: string; email: string }>;
}

interface CrmAccount {
  _id: string;
  accountName: string;
  tier: "Enterprise Key" | "Tier 1 Strategic" | "Tier 2 Growth" | "Mid-Market";
  lifecycleStage: string;
  industry: string;
  region: string;
  contractARR: number;
  healthScore: number;
  primaryContact: {
    name: string;
    title: string;
    email: string;
    phone?: string;
  };
  accountExecutive: string;
  projectId?: { _id: string; name: string } | null;
  nextAction?: { action: string; dueDate?: string | null } | null;
  interactions: Array<{
    _id: string;
    type: string;
    summary: string;
    date: string;
    recordedBy: string;
  }>;
  notes?: string;
}

interface CrmClientProps {
  accounts: CrmAccount[];
  projects: Array<{ _id: string; name: string }>;
  meetings?: CrmMeeting[];
  currentRole?: string;
  isGuest?: boolean;
}

export default function CrmClient({
  accounts,
  projects,
  meetings = [],
  currentRole = "manager",
  isGuest = false,
}: CrmClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("All");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [selectedAccount, setSelectedAccount] = useState<CrmAccount | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [interactionType, setInteractionType] = useState("Meeting");
  const [interactionSummary, setInteractionSummary] = useState("");
  const [isSubmittingInteraction, setIsSubmittingInteraction] = useState(false);

  // Client Meeting Scheduling State
  const [isClientMeetingModalOpen, setIsClientMeetingModalOpen] = useState(false);
  const [meetingTargetAccount, setMeetingTargetAccount] = useState<CrmAccount | null>(null);
  const [cmTitle, setCmTitle] = useState("");
  const [cmPlatform, setCmPlatform] = useState<"google_meet" | "zoom" | "slack" | "discord">("google_meet");
  const [cmScheduledAt, setCmScheduledAt] = useState("");
  const [cmDuration, setCmDuration] = useState("45");
  const [cmMeetingLink, setCmMeetingLink] = useState("");
  const [cmDiscordChannel, setCmDiscordChannel] = useState("");
  const [cmDiscordUrl, setCmDiscordUrl] = useState("");
  const [cmSlackChannel, setCmSlackChannel] = useState("");
  const [cmAttendees, setCmAttendees] = useState("");
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);

  // Derived Telemetry & Metrics
  const totalARR = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (a.contractARR || 0), 0);
  }, [accounts]);

  const avgHealth = useMemo(() => {
    if (accounts.length === 0) return 0;
    const sum = accounts.reduce((s, a) => s + (a.healthScore || 0), 0);
    return Math.round(sum / accounts.length);
  }, [accounts]);

  const keyAccountsCount = useMemo(() => {
    return accounts.filter((a) => a.tier === "Enterprise Key" || a.tier === "Tier 1 Strategic").length;
  }, [accounts]);

  const stagesList = ["All", "Active Enterprise", "Contract Expansion", "Active Pilot", "Renewal Pending", "At-Risk"];

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        searchTerm === "" ||
        acc.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.primaryContact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.primaryContact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.accountExecutive.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStage = selectedStage === "All" || acc.lifecycleStage === selectedStage;
      const matchesTier = selectedTier === "All" || acc.tier === selectedTier;

      return matchesSearch && matchesStage && matchesTier;
    });
  }, [accounts, searchTerm, selectedStage, selectedTier]);

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest || !selectedAccount || !interactionSummary.trim()) return;

    setIsSubmittingInteraction(true);
    try {
      await addClientInteraction(selectedAccount._id, interactionType, interactionSummary);
      setInteractionSummary("");
      // Update local state optimistic
      setSelectedAccount((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          interactions: [
            ...prev.interactions,
            {
              _id: Date.now().toString(),
              type: interactionType,
              summary: interactionSummary,
              date: new Date().toISOString(),
              recordedBy: "You",
            },
          ],
        };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingInteraction(false);
    }
  };

  const openScheduleClientMeeting = (account: CrmAccount) => {
    setMeetingTargetAccount(account);
    setCmTitle(`Executive Sync: ${account.accountName}`);
    setCmPlatform("google_meet");
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
    future.setMinutes(Math.ceil(future.getMinutes() / 15) * 15, 0, 0);
    const localIso = new Date(future.getTime() - future.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setCmScheduledAt(localIso);
    setCmDuration("45");
    setCmMeetingLink("");
    setCmDiscordChannel(
      account.accountName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20) + "-sync"
    );
    setCmDiscordUrl("");
    setCmSlackChannel(
      "client-" + account.accountName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 15)
    );
    setCmAttendees(account.primaryContact.email);
    setIsClientMeetingModalOpen(true);
  };

  const handleScheduleClientMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest || !meetingTargetAccount) return;

    setIsSubmittingMeeting(true);
    try {
      const formData = new FormData();
      formData.set("title", cmTitle);
      formData.set("clientAccountId", meetingTargetAccount._id);
      if (meetingTargetAccount.projectId?._id) {
        formData.set("projectId", meetingTargetAccount.projectId._id);
      }
      formData.set("platform", cmPlatform);
      formData.set("meetingLink", cmMeetingLink);
      formData.set("scheduledAt", cmScheduledAt);
      formData.set("durationMinutes", cmDuration);
      formData.set("discordChannelName", cmDiscordChannel);
      formData.set("discordChannelUrl", cmDiscordUrl);
      formData.set("slackChannelName", cmSlackChannel);

      const emails = cmAttendees
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      formData.set("attendeeEmails", emails.join(","));

      await createMeeting(formData);

      // Add optimistic interaction to selectedAccount if open
      if (selectedAccount && selectedAccount._id === meetingTargetAccount._id) {
        setSelectedAccount((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            interactions: [
              {
                _id: Date.now().toString(),
                type: "Meeting",
                summary: `Scheduled ${cmTitle} (${cmPlatform.toUpperCase()})${
                  cmDiscordChannel ? ` | Discord: #${cmDiscordChannel}` : ""
                }${cmSlackChannel ? ` | Slack: #${cmSlackChannel}` : ""}`,
                date: cmScheduledAt ? new Date(cmScheduledAt).toISOString() : new Date().toISOString(),
                recordedBy: "You",
              },
              ...prev.interactions,
            ],
            nextAction: {
              action: `Attend ${cmTitle} (${cmPlatform.toUpperCase()})`,
              dueDate: cmScheduledAt ? new Date(cmScheduledAt).toISOString() : null,
            },
          };
        });
      }

      setIsClientMeetingModalOpen(false);
      alert("Meeting scheduled! Connectivity details saved & interaction logged.");
    } catch (err: any) {
      alert(err.message || "Failed to schedule meeting.");
    } finally {
      setIsSubmittingMeeting(false);
    }
  };

  const getHealthBadge = (score: number) => {
    if (score >= 90) {
      return {
        label: `${score}% Excellent`,
        className: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
      };
    } else if (score >= 75) {
      return {
        label: `${score}% Healthy`,
        className: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800",
      };
    } else {
      return {
        label: `${score}% Attention`,
        className: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800",
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0078D4] text-white flex items-center justify-center shadow-sm">
              <Contact2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-[#242424] dark:text-white flex items-center gap-2">
                <span>Enterprise CRM &amp; Client Hub</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] font-semibold uppercase">
                  Growth Area
                </span>
              </h1>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-0.5">
                Centralized client relationship management, contract ARR telemetry, and account executive interaction logs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Client Account</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-1">
            <span>Managed Client Accounts</span>
            <Building2 className="w-4 h-4 text-[#0078D4]" />
          </div>
          <div className="text-2xl font-bold text-[#242424] dark:text-white">
            {accounts.length}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            100% active retention (0 churn)
          </div>
        </div>

        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-1">
            <span>Contracted Client ARR</span>
            <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#242424] dark:text-white">
            ${totalARR.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4] mt-1">
            Annual recurring revenue book
          </div>
        </div>

        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-1">
            <span>Average Client Health</span>
            <HeartHandshake className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-[#242424] dark:text-white">
            {avgHealth}%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            Excellent account satisfaction
          </div>
        </div>

        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-1">
            <span>Strategic Key Accounts</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-[#242424] dark:text-white">
            {keyAccountsCount}
          </div>
          <div className="text-[11px] text-[#0078D4] font-semibold mt-1">
            Tier 1 &amp; Enterprise Focus
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-3.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search accounts, decision maker, email or executive..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {stagesList.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStage(st)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
                  selectedStage === st
                    ? "bg-[#0078D4] text-white shadow-xs"
                    : "bg-[#FAF9F8] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] border border-[#E1DFDD] dark:border-[#3B3A39] hover:bg-[#F3F2F1]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="p-1.5 text-xs rounded bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-white cursor-pointer outline-none"
          >
            <option value="All">All Tiers</option>
            <option value="Enterprise Key">Enterprise Key</option>
            <option value="Tier 1 Strategic">Tier 1 Strategic</option>
            <option value="Tier 2 Growth">Tier 2 Growth</option>
            <option value="Mid-Market">Mid-Market</option>
          </select>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAccounts.map((account) => {
          const health = getHealthBadge(account.healthScore);
          return (
            <div
              key={account._id}
              className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] hover:border-[#0078D4] rounded-[8px] p-5 shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                {/* Account Top Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-md bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] flex items-center justify-center font-bold text-xs shrink-0">
                      {account.accountName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#242424] dark:text-white leading-tight">
                        {account.accountName}
                      </h3>
                      <div className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4] mt-0.5">
                        {account.industry} · {account.region}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0 ${
                      account.tier === "Enterprise Key"
                        ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300"
                        : "bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-300"
                    }`}
                  >
                    {account.tier}
                  </span>
                </div>

                {/* Contract ARR & Health Score Bar */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#EDEBE9] dark:border-[#292827] mb-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] block">
                      Contracted ARR
                    </span>
                    <span className="font-bold text-sm text-[#242424] dark:text-white text-emerald-600 dark:text-emerald-400">
                      ${account.contractARR.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] block">
                      Client Health Score
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block mt-0.5 ${health.className}`}>
                      {health.label}
                    </span>
                  </div>
                </div>

                {/* Primary Decision Maker Info */}
                <div className="space-y-1.5 text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-3">
                  <div className="flex items-center gap-1.5 font-semibold text-[#242424] dark:text-white">
                    <User className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>{account.primaryContact.name}</span>
                    <span className="text-[11px] font-normal text-[#8A8886]">
                      ({account.primaryContact.title})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <a
                      href={`mailto:${account.primaryContact.email}`}
                      className="hover:text-[#0078D4] hover:underline truncate"
                    >
                      {account.primaryContact.email}
                    </a>
                  </div>

                  {account.primaryContact.phone && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{account.primaryContact.phone}</span>
                    </div>
                  )}
                </div>

                {/* Next Scheduled Action */}
                {account.nextAction && (
                  <div className="p-2.5 rounded bg-[#F3F2F1] dark:bg-[#292827] text-xs mb-3">
                    <span className="text-[10px] font-bold text-[#605E5C] dark:text-[#A19F9D] uppercase tracking-wider block mb-0.5">
                      Next Strategic Action
                    </span>
                    <div className="text-[11px] text-[#242424] dark:text-white font-medium flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#0078D4] shrink-0" />
                      <span>{account.nextAction.action}</span>
                    </div>
                  </div>
                )}

                {/* Upcoming Meeting & Connectivity Indicator */}
                {(() => {
                  const clientMeets = (meetings || []).filter((m) => m.clientAccountId === account._id);
                  const upcomingMeet = clientMeets.find((m) => m.status === "Scheduled" || m.status === "In Progress");
                  if (!upcomingMeet) return null;
                  return (
                    <div className="p-2 rounded bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 text-[11px] mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        {upcomingMeet.platform === "discord" ? (
                          <Mic className="w-3.5 h-3.5 text-[#5865F2] shrink-0" />
                        ) : (
                          <Video className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                        )}
                        <span className="font-semibold truncate text-purple-950 dark:text-purple-200">
                          {upcomingMeet.platform === "discord" && upcomingMeet.discordChannelName
                            ? `#${upcomingMeet.discordChannelName}`
                            : upcomingMeet.title}
                        </span>
                      </div>
                      <a
                        href={upcomingMeet.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-600 dark:text-purple-400 hover:underline font-bold shrink-0 ml-2 flex items-center gap-0.5"
                      >
                        <span>Join</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  );
                })()}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-[#EDEBE9] dark:border-[#292827] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#8A8886]">
                  Exec: <strong className="text-[#242424] dark:text-white">{account.accountExecutive}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openScheduleClientMeeting(account)}
                    className="px-2 py-1 text-[11px] font-semibold rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    title="Schedule Meeting & Connectivity"
                  >
                    <Video className="w-3 h-3" />
                    <span>+ Meet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAccount(account)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] hover:bg-[#0078D4] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Timeline ({account.interactions.length})</span>
                  </button>

                  <form
                    action={deleteClientAccount}
                    onSubmit={(e) => {
                      if (isGuest) {
                        e.preventDefault();
                        return;
                      }
                      if (!window.confirm(`Delete client account "${account.accountName}"?`)) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="accountId" value={account._id} />
                    <button
                      type="submit"
                      disabled={isGuest}
                      className={`p-1 rounded transition-colors ${
                        isGuest
                          ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                          : "text-gray-400 hover:text-rose-600 cursor-pointer"
                      }`}
                      title={isGuest ? "Sign in to delete account" : "Delete account"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAccounts.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-[#8A8886] border border-dashed border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] bg-[#FAF9F8] dark:bg-[#201F1E]">
            No client accounts match your current filters.
          </div>
        )}
      </div>

      {/* Account Detail & Interaction History Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E1DFDD] dark:border-[#3B3A39] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E1DFDD] dark:border-[#3B3A39] flex items-center justify-between bg-[#FAF9F8] dark:bg-[#252423]">
              <div>
                <h2 className="text-base font-bold text-[#242424] dark:text-white flex items-center gap-2">
                  <span>{selectedAccount.accountName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                    {selectedAccount.lifecycleStage}
                  </span>
                </h2>
                <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                  Executive interaction history &amp; communication timeline
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Account Quick Telemetry */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#252423] border border-gray-200 dark:border-gray-800">
                <div>
                  <span className="text-[10px] text-gray-500 block">Annual ARR</span>
                  <span className="font-bold text-sm text-emerald-600">
                    ${selectedAccount.contractARR.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Health Score</span>
                  <span className="font-bold text-sm text-blue-600">
                    {selectedAccount.healthScore}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Account Executive</span>
                  <span className="font-bold text-xs text-gray-800 dark:text-gray-200">
                    {selectedAccount.accountExecutive}
                  </span>
                </div>
              </div>

              {/* Connected Meetings & Video / Discord Channels */}
              <div className="space-y-3 p-4 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900 dark:text-purple-300">
                    <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Meetings & Connectivity (Google Meet, Zoom, Slack, Discord)</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openScheduleClientMeeting(selectedAccount)}
                    disabled={isGuest}
                    className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isGuest
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule Meeting</span>
                  </button>
                </div>

                {/* Client meetings list */}
                {(() => {
                  const clientMeets = (meetings || []).filter((m) => m.clientAccountId === selectedAccount._id);
                  if (clientMeets.length === 0) {
                    return (
                      <p className="text-[11px] text-gray-500 italic">
                        No live meetings scheduled yet. Click &ldquo;Schedule Meeting&rdquo; to connect via Google Meet, Zoom, Slack, or Discord.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {clientMeets.map((m) => (
                        <div
                          key={m._id}
                          className="p-3 rounded-md bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 dark:text-white">{m.title}</span>
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                                {m.platform}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(m.scheduledAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-gray-500">
                              {m.discordChannelName && <span>Discord: #{m.discordChannelName}</span>}
                              {m.slackChannelName && <span>Slack: #{m.slackChannelName}</span>}
                              <span>Duration: {m.durationMinutes}m</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={m.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 rounded bg-[#0078D4] hover:bg-[#106EBE] text-white font-semibold text-[11px] flex items-center gap-1"
                            >
                              <span>Launch</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="text-right pt-1">
                  <Link
                    href="/teams/meetings"
                    className="text-[11px] text-[#0078D4] hover:underline font-semibold"
                  >
                    Open Full Meetings Hub &amp; Transcripts &rarr;
                  </Link>
                </div>
              </div>

              {/* Log New Interaction Form */}
              <form onSubmit={handleAddInteraction} className="space-y-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1B1A19]">
                <h4 className="font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>Log Client Interaction Note</span>
                </h4>

                <div className="flex gap-2">
                  <select
                    value={interactionType}
                    onChange={(e) => setInteractionType(e.target.value)}
                    className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201F1E] text-xs text-gray-800 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Meeting">Executive Meeting</option>
                    <option value="Call">Phone Call</option>
                    <option value="Email">Email Communication</option>
                    <option value="Contract">Contract / SOW Milestone</option>
                    <option value="Support">Support / Escalation</option>
                  </select>

                  <input
                    type="text"
                    value={interactionSummary}
                    onChange={(e) => setInteractionSummary(e.target.value)}
                    placeholder="Summary of meeting notes, next steps, action items..."
                    className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201F1E] text-xs text-gray-800 dark:text-white outline-none"
                    required
                  />

                  <button
                    type="submit"
                    disabled={isGuest || isSubmittingInteraction}
                    className={`px-4 py-2 rounded text-xs font-semibold transition-colors ${
                      isGuest
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600"
                        : "bg-[#0078D4] hover:bg-[#106EBE] text-white cursor-pointer"
                    }`}
                  >
                    {isGuest ? "Disabled (Guest)" : "Record"}
                  </button>
                </div>
              </form>

              {/* Interaction Feed */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                  Historical Activity Log ({selectedAccount.interactions.length})
                </h4>

                <div className="space-y-3">
                  {selectedAccount.interactions.map((it, idx) => (
                    <div
                      key={it._id || idx}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-[#FAF9F8] dark:bg-[#252423] space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#0078D4] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0078D4]" />
                          <span>{it.type}</span>
                        </span>
                        <span className="text-gray-400">
                          {new Date(it.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        {it.summary}
                      </p>
                      <div className="text-[10px] text-gray-400 pt-1">
                        Recorded by: {it.recordedBy}
                      </div>
                    </div>
                  ))}

                  {selectedAccount.interactions.length === 0 && (
                    <div className="py-6 text-center text-gray-400 border border-dashed rounded-lg">
                      No interactions recorded yet. Use the form above to add a meeting or note.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Client Account Creation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E1DFDD] dark:border-[#3B3A39] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E1DFDD] dark:border-[#3B3A39] flex items-center justify-between bg-[#FAF9F8] dark:bg-[#252423]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0078D4]" />
                <h3 className="font-bold text-base text-[#242424] dark:text-white">
                  Establish Enterprise Client Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              action={addClientAccount}
              onSubmit={(e) => {
                if (isGuest) {
                  e.preventDefault();
                  return;
                }
              }}
              className="p-6 overflow-y-auto space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Client Organization Name *
                  </label>
                  <input
                    type="text"
                    name="accountName"
                    placeholder="e.g. Hilton Worldwide Corp"
                    required
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201F1E] text-gray-900 dark:text-white outline-none focus:border-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Account Tier *
                  </label>
                  <select
                    name="tier"
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201F1E] text-gray-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Enterprise Key">Enterprise Key</option>
                    <option value="Tier 1 Strategic">Tier 1 Strategic</option>
                    <option value="Tier 2 Growth">Tier 2 Growth</option>
                    <option value="Mid-Market">Mid-Market</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Lifecycle Stage
                  </label>
                  <select
                    name="lifecycleStage"
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201F1E] text-gray-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Active Enterprise">Active Enterprise</option>
                    <option value="Contract Expansion">Contract Expansion</option>
                    <option value="Active Pilot">Active Pilot</option>
                    <option value="Renewal Pending">Renewal Pending</option>
                    <option value="Prospect">Prospect</option>
                    <option value="At-Risk">At-Risk</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Contract ARR (USD) *
                  </label>
                  <input
                    type="number"
                    name="contractARR"
                    placeholder="120000"
                    required
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201F1E] text-gray-900 dark:text-white outline-none focus:border-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Health Score (0-100)
                  </label>
                  <input
                    type="number"
                    name="healthScore"
                    defaultValue="90"
                    min="0"
                    max="100"
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201F1E] text-gray-900 dark:text-white outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    name="industry"
                    placeholder="Hospitality / Esports / Technology"
                    defaultValue="Technology"
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201F1E] text-gray-900 dark:text-white outline-none focus:border-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Region
                  </label>
                  <input
                    type="text"
                    name="region"
                    placeholder="North America / EMEA / APAC"
                    defaultValue="North America"
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201F1E] text-gray-900 dark:text-white outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              {/* Primary Contact Details */}
              <div className="p-3.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-[#FAF9F8] dark:bg-[#252423] space-y-3">
                <span className="font-bold text-gray-800 dark:text-white block">
                  Primary Client Decision Maker
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-0.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      placeholder="e.g. Richard Hendricks"
                      required
                      className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1A19] text-gray-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-0.5">
                      Title / Role
                    </label>
                    <input
                      type="text"
                      name="contactTitle"
                      placeholder="VP Procurement / Operations Director"
                      className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1A19] text-gray-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-0.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      placeholder="r.hendricks@client.com"
                      required
                      className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1A19] text-gray-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-0.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="contactPhone"
                      placeholder="+1 (555) 019-2831"
                      className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1A19] text-gray-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Linked Project */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Associated Project / Product
                </label>
                <select
                  name="projectId"
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#201F1E] text-gray-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="">No Associated Project (General Account)</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isGuest}
                  className={`px-5 py-2 rounded text-xs font-semibold transition-colors ${
                    isGuest
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600"
                      : "bg-[#0078D4] hover:bg-[#106EBE] text-white cursor-pointer shadow-sm"
                  }`}
                >
                  {isGuest ? "Sign In to Establish Account" : "Establish Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE CLIENT MEETING MODAL */}
      {isClientMeetingModalOpen && meetingTargetAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-[#FAF9F8] dark:bg-[#252423]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                  <Video className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    Schedule Client Meeting & Connectivity
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Connecting with {meetingTargetAccount.accountName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsClientMeetingModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleScheduleClientMeeting} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={cmTitle}
                  onChange={(e) => setCmTitle(e.target.value)}
                  className="w-full p-2.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-gray-900 dark:text-white outline-none focus:border-[#0078D4]"
                />
              </div>

              {/* Platform Selector */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Platform Connectivity *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "google_meet", label: "Google Meet", icon: Video },
                    { id: "zoom", label: "Zoom Video", icon: Video },
                    { id: "slack", label: "Slack Huddle", icon: MessageSquare },
                    { id: "discord", label: "Discord Voice", icon: Mic },
                  ].map((p) => {
                    const isSel = cmPlatform === p.id;
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setCmPlatform(p.id as any)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                          isSel
                            ? "border-purple-600 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252423] text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Discord Linkage Fields */}
              {cmPlatform === "discord" && (
                <div className="p-3 rounded-lg border border-[#5865F2]/30 bg-[#5865F2]/5 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#5865F2]">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Discord Channel Linkage</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-0.5">
                        Channel Name
                      </label>
                      <input
                        type="text"
                        value={cmDiscordChannel}
                        onChange={(e) => setCmDiscordChannel(e.target.value)}
                        placeholder="e.g. client-briefing"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-0.5">
                        Server / Channel Invite URL
                      </label>
                      <input
                        type="text"
                        value={cmDiscordUrl}
                        onChange={(e) => setCmDiscordUrl(e.target.value)}
                        placeholder="https://discord.gg/... or https://discord.com/..."
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Slack Linkage Fields */}
              {cmPlatform === "slack" && (
                <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/5 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-purple-600 dark:text-purple-400">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Slack Channel Linkage</span>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-0.5">
                      Channel Name
                    </label>
                    <input
                      type="text"
                      value={cmSlackChannel}
                      onChange={(e) => setCmSlackChannel(e.target.value)}
                      placeholder="e.g. client-sync"
                      className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Date & Time, Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Scheduled Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={cmScheduledAt}
                    onChange={(e) => setCmScheduledAt(e.target.value)}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-gray-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Duration
                  </label>
                  <select
                    value={cmDuration}
                    onChange={(e) => setCmDuration(e.target.value)}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-gray-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="15">15 Minutes (Sync)</option>
                    <option value="30">30 Minutes (Check-in)</option>
                    <option value="45">45 Minutes (Executive Review)</option>
                    <option value="60">60 Minutes (Strategic Workshop)</option>
                  </select>
                </div>
              </div>

              {/* Direct Link (optional override) with Live Provider Launcher */}
              <div className="space-y-1.5 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-[#FAF9F8] dark:bg-[#1E1E1E]">
                <div className="flex items-center justify-between gap-2">
                  <label className="block font-semibold text-gray-700 dark:text-gray-300">
                    Direct Meeting URL (Paste real link)
                  </label>

                  {(() => {
                    const launcher =
                      cmPlatform === "google_meet"
                        ? { url: "https://meet.google.com/new", label: "Create Google Meet ↗", color: "bg-emerald-600 hover:bg-emerald-700" }
                        : cmPlatform === "zoom"
                        ? { url: "https://zoom.us/meeting/schedule", label: "Schedule on Zoom ↗", color: "bg-sky-600 hover:bg-sky-700" }
                        : cmPlatform === "slack"
                        ? { url: "https://app.slack.com/", label: "Open Slack ↗", color: "bg-purple-600 hover:bg-purple-700" }
                        : cmPlatform === "discord"
                        ? { url: "https://discord.com/app", label: "Open Discord ↗", color: "bg-[#5865F2] hover:bg-[#4752C4]" }
                        : null;

                    if (!launcher) return null;
                    return (
                      <a
                        href={launcher.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold text-white ${launcher.color}`}
                        title="Open official platform to generate a real room link"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{launcher.label}</span>
                      </a>
                    );
                  })()}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cmMeetingLink}
                    onChange={(e) => setCmMeetingLink(e.target.value)}
                    placeholder={
                      cmPlatform === "google_meet"
                        ? "https://meet.google.com/xxx-yyyy-zzz"
                        : cmPlatform === "zoom"
                        ? "https://zoom.us/j/94827103819"
                        : cmPlatform === "slack"
                        ? "https://app.slack.com/client/T000/C000"
                        : "https://discord.gg/your-channel or https://discord.com/..."
                    }
                    className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-gray-900 dark:text-white outline-none"
                  />

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clip = await navigator.clipboard.readText();
                        if (clip) setCmMeetingLink(clip.trim());
                      } catch {
                        // ignore
                      }
                    }}
                    className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] hover:bg-gray-100 text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer shrink-0"
                    title="Paste from clipboard"
                  >
                    <Copy className="w-3 h-3 text-gray-400" />
                    <span>Paste</span>
                  </button>
                </div>
                <p className="text-[10px] text-gray-400">
                  Click the button above to launch your provider, copy your genuine room URL, and paste it here.
                </p>
              </div>

              {/* Attendees */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Invitees (Client & Team Emails)
                </label>
                <input
                  type="text"
                  value={cmAttendees}
                  onChange={(e) => setCmAttendees(e.target.value)}
                  placeholder="contact@client.com, executive@taskflow.internal"
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-gray-900 dark:text-white outline-none"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Primary client contact ({meetingTargetAccount.primaryContact.name}) is prefilled.
                </span>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsClientMeetingModalOpen(false)}
                  className="px-4 py-2 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2928]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGuest || isSubmittingMeeting}
                  className={`px-5 py-2 rounded font-semibold text-white transition-colors ${
                    isGuest
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-300 dark:border-gray-600"
                      : "bg-purple-600 hover:bg-purple-700 cursor-pointer"
                  }`}
                >
                  {isGuest ? "Sign In to Schedule" : isSubmittingMeeting ? "Scheduling..." : "Schedule & Connect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
