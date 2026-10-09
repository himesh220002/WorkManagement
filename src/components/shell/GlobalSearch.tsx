"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Command,
  X,
  LayoutDashboard,
  Sparkles,
  FolderKanban,
  Presentation,
  GitGraph,
  Map,
  Briefcase,
  CheckSquare,
  Clock,
  FileText,
  MessageSquare,
  Users,
  Video,
  Contact2,
  BadgeDollarSign,
  TrendingUp,
  Cpu,
  BookOpen,
  ShieldCheck,
} from "lucide-react";

interface SearchEntry {
  label: string;
  href: string;
  group: string;
  description: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const GROUP_ORDER = ["Overview", "Work", "People", "Growth", "Admin and Security"];

const SEARCH_INDEX: SearchEntry[] = [
  { label: "Executive Dashboard", href: "/exec/dashboard", group: "Overview", description: "Company objectives, key results and revenue targets", keywords: ["exec", "executive", "okr", "objectives", "goals", "strategy", "health", "telemetry"], icon: LayoutDashboard },
  { label: "AI Reports and Intelligence", href: "/reports", group: "Overview", description: "Gemini health audits, forecasts and form generation", keywords: ["ai", "gemini", "report", "intel", "intelligence", "analytics", "forecast", "health"], icon: Sparkles },
  { label: "Projects Blueprint", href: "/projects", group: "Overview", description: "Project agendas, hierarchy and change requests", keywords: ["project", "blueprint", "agenda", "portfolio", "pipeline"], icon: FolderKanban },
  { label: "Whiteboards", href: "/whiteboards", group: "Overview", description: "Collaborative boards and roadmaps", keywords: ["whiteboard", "canvas", "roadmap", "drawing", "board"], icon: Presentation },
  { label: "Flow Diagrams and Topology", href: "/diagrams", group: "Overview", description: "Live diagrams of squads, pipelines and tasks", keywords: ["diagram", "flow", "mermaid", "topology", "graph"], icon: GitGraph },
  { label: "Roadmap and Demo Guide", href: "/projecthelpdemo", group: "Overview", description: "Guided walkthrough of the delivery process", keywords: ["roadmap", "demo", "guide", "help", "onboarding", "tour"], icon: Map },
  { label: "My Work", href: "/my-work", group: "Work", description: "Personal tasks, logs and assignments", keywords: ["my work", "personal", "task", "log", "todo", "assignment"], icon: Briefcase },
  { label: "Development Dashboard", href: "/dev/dashboard", group: "Work", description: "Delivery pipelines, milestone velocity and severity", keywords: ["dev", "development", "dashboard", "delivery", "velocity", "severity", "deliverable", "sprint"], icon: CheckSquare },
  { label: "Timeline and Pipelines", href: "/dev/timeline", group: "Work", description: "Gantt schedules and parallel project tracks", keywords: ["timeline", "gantt", "pipeline", "schedule", "sprint", "matrix", "track", "plan"], icon: Clock },
  { label: "Forms and Surveys", href: "/forms", group: "Work", description: "Form builder, live preview and submissions", keywords: ["form", "survey", "builder", "question", "intake", "response", "share"], icon: FileText },
  { label: "Documentation Upload and Vault", href: "/docs", group: "Work", description: "Secure S3 document uploads and previews", keywords: ["doc", "documentation", "upload", "vault", "s3", "file", "storage"], icon: FileText },
  { label: "Chat Space", href: "/chat", group: "People", description: "Global, team, group and direct messages", keywords: ["chat", "message", "all-hands", "mention", "dm", "direct", "space"], icon: MessageSquare },
  { label: "Teams and Members", href: "/teams", group: "People", description: "Squads, merit scores, ranks and rotation", keywords: ["team", "member", "squad", "merit", "rank", "directory", "people"], icon: Users },
  { label: "Meetings and Discussions", href: "/teams/meetings", group: "People", description: "Meeting schedules and discussion transcripts", keywords: ["meeting", "discussion", "transcript", "schedule", "video", "call"], icon: Video },
  { label: "Customer Relationship Management and Client Hub", href: "/growth/crm", group: "Growth", description: "Client accounts and relationship pipeline", keywords: ["crm", "client", "customer", "account", "contact", "relationship", "hub"], icon: Contact2 },
  { label: "Sales Pipeline", href: "/sales/dashboard", group: "Growth", description: "Lead kanban board and active campaigns", keywords: ["sale", "lead", "kanban", "campaign", "deal", "funnel", "pipeline"], icon: BadgeDollarSign },
  { label: "Revenue and Targets", href: "/revenue/dashboard", group: "Growth", description: "Seven stage deals, budgets and win rates", keywords: ["revenue", "target", "deal", "budget", "forecast", "arr", "mrr", "kanban"], icon: TrendingUp },
  { label: "Revenue Targets Detail", href: "/revenue/targets", group: "Growth", description: "Target attainment tracking by period", keywords: ["target", "attainment", "goal", "quota"], icon: TrendingUp },
  { label: "Resource Allocation", href: "/exec/resources", group: "Admin and Security", description: "Budget envelopes, burn rates and risk flags", keywords: ["resource", "allocation", "budget", "burn", "envelope", "headcount", "risk", "govern"], icon: Cpu },
  { label: "About and Documentation", href: "/about", group: "Admin and Security", description: "Architecture doctrine and capability matrix", keywords: ["about", "architecture", "help", "capability"], icon: BookOpen },
  { label: "Tenant Authentication and Access Control", href: "/auth/login", group: "Admin and Security", description: "Workspace sign in, roles and permissions", keywords: ["auth", "login", "signin", "rbac", "role", "permission", "tenant", "signup", "subscription"], icon: ShieldCheck },
];

/** Default suggestions shown when the box opens with no typing yet. */
const DEFAULT_SUGGESTIONS = [
  "Executive Dashboard",
  "Timeline and Pipelines",
  "Development Dashboard",
  "Chat Space",
  "Sales Pipeline",
  "AI Reports and Intelligence",
  "Forms and Surveys",
  "Resource Allocation",
];

function scoreEntry(entry: SearchEntry, tokens: string[]): number | null {
  const label = entry.label.toLowerCase();
  const description = entry.description.toLowerCase();
  const keywordText = entry.keywords.join(" ").toLowerCase();
  const initials = entry.label
    .split(/[\s&]+/)
    .filter(Boolean)
    .map((w) => w[0]?.toLowerCase() ?? "")
    .join("");

  let score = 0;
  for (const token of tokens) {
    if (!token) continue;
    const labelIdx = label.indexOf(token);
    if (labelIdx >= 0) {
      score += labelIdx === 0 ? 30 : 20 - Math.min(10, labelIdx);
      continue;
    }
    if (keywordText.includes(token)) {
      score += 12;
      continue;
    }
    if (token.length >= 2 && initials.startsWith(token)) {
      score += 10;
      continue;
    }
    if (description.includes(token)) {
      score += 5;
      continue;
    }
    return null;
  }
  return score;
}

export function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openSearch = () => {
    setQuery("");
    setActiveIndex(0);
    setIsOpen(true);
  };

  const closeSearch = () => {
    setIsOpen(false);
    setQuery("");
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return SEARCH_INDEX.filter((e) => DEFAULT_SUGGESTIONS.includes(e.label)).sort(
        (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group)
      );
    }
    const tokens = q.split(/\s+/).filter(Boolean);
    return SEARCH_INDEX.map((entry) => ({ entry, score: scoreEntry(entry, tokens) }))
      .filter((r): r is { entry: SearchEntry; score: number } => r.score !== null)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.entry);
  }, [query]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
  };

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) handleSelect(target.href);
    }
  };

  const grouped = useMemo(() => {
    const rows: { key: string; entry: SearchEntry; globalIndex: number; showGroup: boolean }[] = [];
    let prev = "";
    results.forEach((entry, globalIndex) => {
      const showGroup = Boolean(query.trim()) && entry.group !== prev;
      prev = entry.group;
      rows.push({ key: `${entry.href}-${entry.label}`, entry, globalIndex, showGroup });
    });
    return rows;
  }, [results, query]);

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#201F1E] text-xs text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#F3F2F1] dark:hover:bg-[#292827] w-64 max-w-sm transition-colors"
      >
        <Search className="w-3.5 h-3.5 text-[#605E5C]" />
        <span className="flex-1 text-left">Search or jump to...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#605E5C] dark:text-[#C8C6C4]">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={closeSearch}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#201F1E] rounded-[8px] border border-[#E1DFDD] dark:border-[#3B3A39] shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E1DFDD] dark:border-[#3B3A39]">
              <Search className="w-4 h-4 text-[#0078D4]" />
              <input
                type="text"
                autoFocus
                placeholder="Type a few letters, for example dev, sale, chat, report..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className="w-full text-sm bg-transparent outline-none text-[#242424] dark:text-white placeholder-[#A19F9D]"
              />
              <button
                onClick={closeSearch}
                className="text-[#605E5C] hover:text-[#242424] dark:hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#605E5C] dark:text-[#A19F9D]">
                {query.trim() ? `${results.length} matching dashboards and pages` : "Suggested dashboards and pages"}
              </div>
              {grouped.map(({ key, entry: item, globalIndex, showGroup }) => {
                const Icon = item.icon;
                const isActive = globalIndex === activeIndex;
                return (
                  <React.Fragment key={key}>
                    {showGroup && (
                      <div className="px-3 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8A8886]">
                        {item.group}
                      </div>
                    )}
                    <button
                      onMouseEnter={() => setActiveIndex(globalIndex)}
                      onClick={() => handleSelect(item.href)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-[4px] text-left transition-colors ${isActive ? "bg-[#EBF3FC] dark:bg-[#1C2B3D]" : "hover:bg-[#F3F2F1] dark:hover:bg-[#292827]"}`}
                    >
                      <Icon className="w-4 h-4 text-[#0078D4] shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-[#242424] dark:text-white">{item.label}</span>
                        <span className="block truncate text-[11px] text-[#8A8886]">{item.description}</span>
                      </span>
                      <span className="text-[10px] text-[#8A8886] shrink-0 hidden sm:inline">{item.group}</span>
                    </button>
                  </React.Fragment>
                );
              })}
              {results.length === 0 && (
                <div className="text-center py-6 text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                  No dashboards found for &ldquo;{query}&rdquo;. Try dev, sale, chat, report, team or revenue.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
