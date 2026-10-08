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
} from "lucide-react";
import { addClientAccount, updateClientStage, addClientInteraction, deleteClientAccount } from "@/actions/crm";

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
  currentRole?: string;
  isGuest?: boolean;
}

export default function CrmClient({
  accounts,
  projects,
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
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-[#EDEBE9] dark:border-[#292827] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#8A8886]">
                  Exec: <strong className="text-[#242424] dark:text-white">{account.accountExecutive}</strong>
                </span>

                <div className="flex items-center gap-2">
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
                      title={isGuest ? "Delete disabled in showcase mode" : "Delete account"}
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
                  {isGuest ? "Creation Disabled in Showcase Mode" : "Establish Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
