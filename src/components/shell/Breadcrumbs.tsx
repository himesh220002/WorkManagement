"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Home,
  Building2,
  FileText,
  FolderKanban,
  Users,
  GitGraph,
  Briefcase,
  LayoutDashboard,
  Clock,
  BadgeDollarSign,
  TrendingUp,
  Cpu,
  Target,
  Sparkles,
} from "lucide-react";

const KNOWN_ROOTS = new Set([
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
  "contact",
  "privacy",
  "terms",
  "404",
  "500",
  "not-found",
  "projecthelpdemo",
  "chat",
  "whiteboards",
  "forms",
  "reports",
]);

const SEGMENT_METADATA: Record<string, { label: string; icon?: React.ElementType }> = {
  projecthelpdemo: { label: "Project Roadmap & Execution Guide", icon: GitGraph },
  docs: { label: "Documentation Vault", icon: FileText },
  projects: { label: "Projects Blueprint", icon: FolderKanban },
  teams: { label: "Teams & Members", icon: Users },
  diagrams: { label: "Flow Diagrams", icon: GitGraph },
  "my-work": { label: "My Work", icon: Briefcase },
  exec: { label: "Executive", icon: LayoutDashboard },
  dashboard: { label: "Dashboard", icon: LayoutDashboard },
  resources: { label: "Resource Allocation", icon: Cpu },
  dev: { label: "Dev Pipelines", icon: LayoutDashboard },
  timeline: { label: "Gantt Timeline", icon: Clock },
  sales: { label: "Sales Pipeline", icon: BadgeDollarSign },
  revenue: { label: "Revenue & Targets", icon: TrendingUp },
  targets: { label: "Targets & Attainment", icon: Target },
  about: { label: "About TaskPMS", icon: Sparkles },
  reports: { label: "AI Reports & Intel", icon: Sparkles },
  forms: { label: "Forms & Surveys", icon: FileText },
  whiteboards: { label: "Whiteboards" },
  chat: { label: "Chat Space" },
  contact: { label: "Contact Support" },
  privacy: { label: "Privacy Policy" },
  terms: { label: "Terms of Service" },
};

export function Breadcrumbs() {
  const pathname = usePathname() || "";
  if (!pathname || pathname === "/" || pathname === "/404" || pathname === "/500") {
    return null;
  }

  const allSegments = pathname.split("/").filter(Boolean);
  if (allSegments.length === 0) return null;

  // Determine if URL starts with a tenant/organization identifier (e.g., /ORGTTV/docs)
  const isTenantPrefixed = allSegments.length > 0 && !KNOWN_ROOTS.has(allSegments[0]);
  const orgCode = isTenantPrefixed ? allSegments[0] : null;
  const orgPrefix = orgCode ? `/${orgCode}` : "";
  const routeSegments = isTenantPrefixed ? allSegments.slice(1) : allSegments;

  // Hide breadcrumb on primary executive home dashboard
  const homePath = `${orgPrefix}/exec/dashboard`;
  if (
    (pathname === "/exec/dashboard" && !orgCode) ||
    pathname === homePath ||
    routeSegments.length === 0
  ) {
    return null;
  }

  // Build breadcrumb items with smart resolution for parent routes
  const items: Array<{
    label: string;
    href: string;
    icon?: React.ElementType;
    isCurrent: boolean;
  }> = [];

  let accumulated = "";
  for (let i = 0; i < routeSegments.length; i++) {
    const rawSeg = routeSegments[i];
    accumulated += `/${rawSeg}`;
    const isCurrent = i === routeSegments.length - 1;

    // Friendly label resolution
    const meta = SEGMENT_METADATA[rawSeg.toLowerCase()];
    const label =
      meta?.label ||
      decodeURIComponent(rawSeg)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    // Smart route destination to avoid 404s on parent segment links
    let targetHref = `${orgPrefix}${accumulated}`;
    if (rawSeg.toLowerCase() === "exec") {
      targetHref = `${orgPrefix}/exec/dashboard`;
    } else if (rawSeg.toLowerCase() === "dev") {
      targetHref = `${orgPrefix}/dev/dashboard`;
    } else if (rawSeg.toLowerCase() === "sales") {
      targetHref = `${orgPrefix}/sales/dashboard`;
    } else if (rawSeg.toLowerCase() === "revenue") {
      targetHref = `${orgPrefix}/revenue/dashboard`;
    }

    items.push({
      label,
      href: targetHref,
      icon: meta?.icon,
      isCurrent,
    });
  }

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className="flex items-center flex-wrap gap-1 text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-3.5 select-none"
    >
      <ol className="flex items-center flex-wrap gap-1 m-0 p-0 list-none">
        {/* 1. Workspace Home */}
        <li className="flex items-center">
          <Link
            href={homePath}
            aria-label="Workspace Dashboard Home"
            className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] hover:bg-[#F3F2F1] dark:hover:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#0078D4] dark:hover:text-[#479EF5] transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D4]"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </li>

        {/* 2. Organization / Tenant Pill (if in a tenant-scoped route) */}
        {orgCode && (
          <li className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-[#A19F9D] dark:text-[#797775] shrink-0" />
            <Link
              href={homePath}
              title={`Active Organization: ${orgCode}`}
              className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#FAF9F8] dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#0078D4] dark:text-[#479EF5] font-semibold hover:border-[#0078D4] hover:bg-[#EBF3FC] dark:hover:bg-[#1C2B3D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D4]"
            >
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="tracking-wide uppercase text-[11px]">{orgCode}</span>
            </Link>
          </li>
        )}

        {/* 3. Nested Route Segments */}
        {items.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <li key={idx} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-[#A19F9D] dark:text-[#797775] shrink-0" />
              {item.isCurrent ? (
                <span
                  aria-current="page"
                  className="flex items-center gap-1.5 px-2 py-1 font-semibold text-[#242424] dark:text-white rounded-[4px] bg-black/[0.03] dark:bg-white/[0.04]"
                >
                  {IconComponent && <IconComponent className="w-3.5 h-3.5 text-[#0078D4] dark:text-[#479EF5]" />}
                  <span>{item.label}</span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] hover:bg-[#F3F2F1] dark:hover:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#0078D4] dark:hover:text-[#479EF5] transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D4]"
                >
                  {IconComponent && <IconComponent className="w-3.5 h-3.5 opacity-80" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
