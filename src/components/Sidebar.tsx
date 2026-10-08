"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  GitGraph,
  CheckSquare,
  Clock,
  Users,
  BadgeDollarSign,
  TrendingUp,
  Cpu,
  BookOpen,
  Briefcase,
  ShieldCheck,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname() || "";

  // Extract tenant prefix if present (e.g. /ORGTTV/docs -> /ORGTTV) to prevent 307 redirects
  const segments = pathname.split("/").filter(Boolean);
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
    "projecthelpdemo",
  ];
  const orgPrefix =
    segments.length > 0 && !PROTECTED_ROOTS.includes(segments[0])
      ? `/${segments[0]}`
      : "";

  const navGroups = [
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
        { label: "Documentation Upload", href: "/docs", icon: BookOpen },
      ],
    },
    {
      group: "People",
      items: [
        { label: "Teams & Members", href: "/teams", icon: Users },
      ],
    },
    {
      group: "Growth",
      items: [
        { label: "Sales Pipeline", href: "/sales/dashboard", icon: BadgeDollarSign },
        { label: "Revenue & Targets", href: "/revenue/dashboard", icon: TrendingUp },
      ],
    },
    {
      group: "Admin",
      items: [
        { label: "Resource Allocation", href: "/exec/resources", icon: Cpu },
        { label: "Documentation", href: "/about", icon: BookOpen },
        { label: "Tenant Auth & RBAC", href: "/auth/login", icon: ShieldCheck },
      ],
    },
  ];

  return (
    <aside className="hidden xl:flex xl:flex-col w-64 sticky top-12 h-[calc(100vh-48px)] bg-white dark:bg-[#201F1E] border-r border-[#E1DFDD] dark:border-[#3B3A39] p-3 gap-6 overflow-y-auto shrink-0 select-none z-20">
      <nav className="flex flex-col gap-5">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="flex flex-col gap-1">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#605E5C] dark:text-[#A19F9D]">
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-[4px] text-xs font-medium transition-colors relative ${isActive
                      ? "bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] font-semibold before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:bg-[#0078D4] before:rounded-r"
                      : "text-[#242424] dark:text-[#C8C6C4] hover:bg-[#F3F2F1] dark:hover:bg-[#292827] hover:text-black dark:hover:text-white"
                    }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#0078D4] dark:text-[#479EF5]" : "text-[#605E5C] dark:text-[#C8C6C4]"}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
