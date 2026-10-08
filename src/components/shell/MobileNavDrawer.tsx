"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  LayoutGrid,
  Building2,
  ShieldCheck,
  LayoutDashboard,
  FolderKanban,
  GitGraph,
  Briefcase,
  CheckSquare,
  Clock,
  Users,
  BadgeDollarSign,
  TrendingUp,
  Cpu,
  BookOpen,
  Sun,
  Moon,
  Check,
  ChevronDown,
  LogOut,
  User,
  ExternalLink,
  FileText,
  Contact2,
  Video,
} from "lucide-react";
import { PERSONAS } from "./PersonaSwitcher";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentCompanyName?: string;
  sessionData?: any;
  onOpenProfile?: () => void;
  onLogout?: () => void;
  isDark?: boolean;
  toggleTheme?: () => void;
}

export const NAV_GROUPS = [
  {
    group: "Overview",
    items: [
      { label: "Exec Dashboard", href: "/exec/dashboard", icon: LayoutDashboard },
      { label: "Projects Blueprint", href: "/projects", icon: FolderKanban },
      { label: "Flow Diagrams", href: "/diagrams", icon: GitGraph },
      { label: "Roadmap & Demo Guide", href: "/projecthelpdemo", icon: GitGraph },
    ],
  },
  {
    group: "Work",
    items: [
      { label: "My Work", href: "/my-work", icon: Briefcase },
      { label: "Dev Dashboard", href: "/dev/dashboard", icon: CheckSquare },
      { label: "Timeline & Pipelines", href: "/dev/timeline", icon: Clock },
      { label: "Documentation Upload", href: "/docs", icon: FileText },
    ],
  },
  {
    group: "People",
    items: [
      { label: "Teams & Members", href: "/teams", icon: Users },
      { label: "Meetings & Discussions", href: "/teams/meetings", icon: Video },
    ],
  },
  {
    group: "Growth",
    items: [
      { label: "CRM & Client Hub", href: "/growth/crm", icon: Contact2 },
      { label: "Sales Pipeline", href: "/sales/dashboard", icon: BadgeDollarSign },
      { label: "Revenue & Targets", href: "/revenue/dashboard", icon: TrendingUp },
    ],
  },
  {
    group: "Admin & Security",
    items: [
      { label: "Document Vault (S3)", href: "/docs", icon: FileText },
      { label: "Resource Allocation", href: "/exec/resources", icon: Cpu },
      { label: "Documentation", href: "/about", icon: BookOpen },
      { label: "Tenant Auth & RBAC", href: "/auth/login", icon: ShieldCheck },
    ],
  },
];

export function MobileNavDrawer({
  isOpen,
  onClose,
  currentCompanyName = "TaskFlow Organization",
  sessionData,
  onOpenProfile,
  onLogout,
  isDark,
  toggleTheme,
}: MobileNavDrawerProps) {
  const pathname = usePathname();
  const [currentPersonaRole, setCurrentPersonaRole] = useState<string>("manager");
  const [isPersonaExpanded, setIsPersonaExpanded] = useState(false);

  // Read active persona from cookie
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )demo_persona_role=([^;]*)/);
    if (match && match[1]) {
      setCurrentPersonaRole(match[1]);
    }
  }, [isOpen]);

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSelectPersona = (role: string) => {
    setCurrentPersonaRole(role);
    document.cookie = `demo_persona_role=${role}; path=/; max-age=2592000`;
    onClose();
    window.location.reload();
  };

  if (!isOpen) return null;

  const activePersona =
    PERSONAS.find((p) => p.role === currentPersonaRole) || PERSONAS[1];
  const ActivePersonaIcon = activePersona.icon;

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Body */}
      <div className="fixed inset-y-0 left-0 w-80 max-w-[88vw] bg-white dark:bg-[#201F1E] border-r border-[#E1DFDD] dark:border-[#3B3A39] shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200">
        <div>
          {/* Header */}
          <div className="p-3.5 border-b border-[#E1DFDD] dark:border-[#3B3A39] flex items-center justify-between bg-[#FAF9F8] dark:bg-[#1B1A19]">
            <Link
              href="/exec/dashboard"
              onClick={onClose}
              className="flex items-center gap-2 font-bold text-sm text-[#242424] dark:text-white"
            >
              <div className="w-6 h-6 rounded-[4px] bg-[#0078D4] flex items-center justify-center text-white shadow-sm">
                <LayoutGrid className="w-3.5 h-3.5" />
              </div>
              <span>TaskPMS</span>
            </Link>

            <div className="flex items-center gap-1.5">
              {toggleTheme && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle Theme"
                  className="p-1.5 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#EDEBE9] dark:hover:bg-[#3B3A39]"
                >
                  {isDark ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-[#0078D4]" />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="p-1.5 rounded-[4px] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#EDEBE9] dark:hover:bg-[#292827]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User Profile / Auth Status Section */}
          <div className="p-3 border-b border-[#F3F2F1] dark:border-[#292827] bg-[#FAF9F8]/50 dark:bg-[#1B1A19]/50">
            {sessionData?.user ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#0078D4] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                    {sessionData.user.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#242424] dark:text-white truncate">
                        {sessionData.user.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] font-semibold uppercase tracking-wider shrink-0">
                        {sessionData.user.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8A8886] truncate">
                      {sessionData.user.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {onOpenProfile && (
                    <button
                      type="button"
                      onClick={onOpenProfile}
                      className="px-2 py-1 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] hover:border-[#0078D4] text-[11px] font-semibold text-[#242424] dark:text-white flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <User className="w-3 h-3 text-[#0078D4]" />
                      <span>View Profile</span>
                    </button>
                  )}
                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="px-2 py-1 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] hover:bg-[#FDE7E9] dark:hover:bg-[#44171A] text-[11px] font-semibold text-[#D13438] flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Log Out</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={onClose}
                className="flex items-center justify-between p-2 rounded-[4px] bg-[#EBF3FC] dark:bg-[#1C2B3D] border border-[#0078D4]/30 hover:border-[#0078D4] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0078D4] dark:text-[#479EF5]" />
                  <div>
                    <div className="text-xs font-bold text-[#0078D4] dark:text-[#479EF5]">
                      Tenant Login &amp; Auth Portal
                    </div>
                    <div className="text-[10px] text-[#605E5C] dark:text-[#A19F9D]">
                      Sign in with Company 6-char code
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-[#0078D4]" />
              </Link>
            )}
          </div>

          {/* Active Tenant / Organization Context */}
          <div className="p-3 border-b border-[#F3F2F1] dark:border-[#292827]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8886] mb-1.5 flex items-center justify-between">
              <span>Organization Context</span>
              <span className="text-[9px] text-[#107C10] font-semibold bg-[#DFF6DD] dark:bg-[#133D16] px-1.5 py-0.5 rounded">
                Isolated Tenant
              </span>
            </div>
            <div className="p-2 rounded-[4px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-[#0078D4] shrink-0" />
                <span className="font-semibold text-[#242424] dark:text-white truncate">
                  {currentCompanyName}
                </span>
              </div>
              <Link
                href="/auth/login"
                onClick={onClose}
                className="text-[10px] text-[#0078D4] hover:underline shrink-0 flex items-center gap-0.5 font-semibold"
                title="Switch to another organization"
              >
                <span>Switch</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
          </div>

          {/* Corporate Role Persona Simulator Accordion */}
          {/* <div className="p-3 border-b border-[#F3F2F1] dark:border-[#292827]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8886]">
                Role Persona Simulator
              </span>
              <button
                type="button"
                onClick={() => setIsPersonaExpanded(!isPersonaExpanded)}
                className="text-[10px] text-[#0078D4] hover:underline font-semibold"
              >
                {isPersonaExpanded ? "Collapse" : "Change Role"}
              </button>
            </div> */}

          {/* Current Active Persona Summary Button */}
          {/* <button
              type="button"
              onClick={() => setIsPersonaExpanded(!isPersonaExpanded)}
              className={`w-full text-left p-2 rounded-[4px] border text-xs font-semibold flex items-center justify-between transition-all ${activePersona.style}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <ActivePersonaIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate font-bold">
                  {activePersona.badge} ({activePersona.name})
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform shrink-0 ${isPersonaExpanded ? "rotate-180" : ""
                  }`}
              />
            </button> */}

          {/* Expandable Persona List */}
          {/* {isPersonaExpanded && (
              <div className="mt-2 space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                <p className="text-[10px] text-[#8A8886] mb-1">
                  Switch persona to test permissions across blueprints, pipelines &amp; agendas:
                </p>
                {PERSONAS.map((p) => {
                  const Icon = p.icon;
                  const isSelected = p.role === currentPersonaRole;
                  return (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => handleSelectPersona(p.role)}
                      className={`w-full text-left p-2 rounded-[4px] border text-xs flex items-start gap-2 transition-colors ${
                        isSelected
                          ? "bg-[#EBF3FC] dark:bg-[#1C2B3D] border-[#0078D4]"
                          : "border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] hover:bg-[#FAF9F8] dark:hover:bg-[#292827]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-[#0078D4] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#242424] dark:text-white text-[11px]">
                            {p.badge} ({p.name})
                          </span>
                          {isSelected && (
                            <Check className="w-3 h-3 text-[#0078D4] shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-[#605E5C] dark:text-[#A19F9D] line-clamp-2 leading-tight mt-0.5">
                          {p.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )} */}
          {/* </div> */}

          {/* Navigation Links List */}
          {(() => {
            const segments = (pathname || "").split("/").filter(Boolean);
            const PROTECTED_ROOTS = [
              "exec",
              "projects",
              "teams",
              "sales",
              "revenue",
              "diagrams",
              "my-work",
              "dev",
              "about",
              "docs",
              "auth",
            ];
            const orgPrefix =
              segments.length > 0 && !PROTECTED_ROOTS.includes(segments[0])
                ? `/${segments[0]}`
                : "";

            return (
              <nav className="p-3 flex flex-col gap-4">
                {NAV_GROUPS.map((group, gIdx) => (
                  <div key={gIdx} className="flex flex-col gap-0.5">
                    <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#8A8886]">
                      {group.group}
                    </span>
                    {group.items.map((item, iIdx) => {
                      const Icon = item.icon;
                      const targetHref = item.href.startsWith("/auth")
                        ? item.href
                        : `${orgPrefix}${item.href}`;
                      const isActive =
                        item.href === "/exec/dashboard"
                          ? pathname === targetHref || pathname === `${orgPrefix}` || pathname === "/"
                          : pathname === targetHref || pathname.startsWith(`${targetHref}/`);

                      return (
                        <Link
                          key={iIdx}
                          href={targetHref}
                          prefetch={true}
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-xs font-medium transition-colors relative ${isActive
                            ? "bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] font-semibold before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:bg-[#0078D4] before:rounded-r"
                            : "text-[#242424] dark:text-[#C8C6C4] hover:bg-[#F3F2F1] dark:hover:bg-[#292827]"
                            }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 ${isActive
                              ? "text-[#0078D4] dark:text-[#479EF5]"
                              : "text-[#605E5C] dark:text-[#C8C6C4]"
                              }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            );
          })()}
        </div>

        {/* Footer / Tenant Auth Link */}
        <div className="p-3 border-t border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#1B1A19]">
          <Link
            href="/auth/login"
            onClick={onClose}
            className="w-full flex items-center justify-between p-2 rounded-[4px] bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] hover:border-[#0078D4] text-xs font-semibold text-[#0078D4] dark:text-[#479EF5] transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#107C10]" />
              <span>Multi-Tenant Auth Portal</span>
            </div>
            <span className="text-[10px] text-[#8A8886]">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
