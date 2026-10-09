import Link from "next/link";
import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import {
  Workflow,
  DollarSign,
  Users,
  Target,
  GitGraph,
  ArrowRight,
  ShieldCheck,
  Zap,
  Award,
  BarChart3,
  Database,
  PenTool,
  MessagesSquare,
  CreditCard,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "About TaskPMS: the enterprise operating system synchronizing engineering delivery, sales pipelines and revenue — multi-tenant architecture, company role management and S3 document vault.",
  alternates: { canonical: "/about" },
};

const engines = [
  {
    icon: Target,
    iconClass: "bg-[#EBF3FC] text-[#0078d4] dark:bg-[#1C2B3D] dark:text-[#479EF5]",
    title: "1. Executive Strategy & OKRs",
    body: "Company objectives, key results and annual revenue targets with health telemetry that rolls up from every project and flags budget overruns.",
    href: "/exec/dashboard",
    link: "Inspect Executive Dashboard",
    accent: "text-[#0078d4]",
  },
  {
    icon: Workflow,
    iconClass: "bg-[#DFF6DD] text-[#107C10] dark:bg-[#0F3818] dark:text-[#54B054]",
    title: "2. Engineering Delivery & Gantt",
    body: "Multi-track pipelines, Frappe Gantt timelines, task-node dependencies and milestone checklists that turn sprint commitments into shipped delivery.",
    href: "/dev/timeline",
    link: "Inspect Gantt Timeline",
    accent: "text-[#107C10]",
  },
  {
    icon: PenTool,
    iconClass: "bg-[#F3E8FF] text-[#7C3AED] dark:bg-[#2E1065] dark:text-[#C4B5FD]",
    title: "3. Visual Whiteboards & Org Charts",
    body: "Infinite canvas with the Organizational Chart template: company logo, positions and member tasks on one live board — zoom, pan, connect and edit inline.",
    href: "/whiteboards",
    link: "Inspect Whiteboards",
    accent: "text-[#7C3AED]",
  },
  {
    icon: MessagesSquare,
    iconClass: "bg-[#E0F2FE] text-[#0284C7] dark:bg-[#082F49] dark:text-[#7DD3FC]",
    title: "4. Chat Space, Teams & Meetings",
    body: "Global All-Hands, department teams, squad groups and 1-to-1 DMs with @-mentions, plus scheduled meetings — feeding directly into squad staffing.",
    href: "/chat",
    link: "Inspect Chat & Teams",
    accent: "text-[#0284C7]",
  },
  {
    icon: DollarSign,
    iconClass: "bg-[#FFF4CE] text-[#8F6B00] dark:bg-[#4A3E09] dark:text-[#FFD335]",
    title: "5. Revenue, Deals & Targets",
    body: "7-stage commercial Kanban (Prospect → Integration), pipeline valuation, win-rate analytics, target attainment and budget-envelope tracking.",
    href: "/revenue/dashboard",
    link: "Inspect Revenue Management",
    accent: "text-[#8F6B00]",
  },
  {
    icon: Users,
    iconClass: "bg-[#EBF3FC] text-[#0078d4] dark:bg-[#1C2B3D] dark:text-[#479EF5]",
    title: "6. Squads & Capability Rotation",
    body: "Developer, designer, product, sales, finance and executive categories across 5 seniority ranks (Associate → Principal) for rapid team rotation.",
    href: "/teams",
    link: "Inspect Teams Directory",
    accent: "text-[#0078d4]",
  },
  {
    icon: BarChart3,
    iconClass: "bg-[#FDE7D9] text-[#F7630C] dark:bg-[#4A2209] dark:text-[#FFB85C]",
    title: "7. Commercial Growth & Campaigns",
    body: "Inbound / outbound campaigns linked to estimated revenue, plus lead funnels tracked as New → Working → Qualified → Unqualified.",
    href: "/sales/dashboard",
    link: "Inspect Sales Pipeline",
    accent: "text-[#F7630C]",
  },
  {
    icon: GitGraph,
    iconClass: "bg-[#EBF3FC] text-[#0078d4] dark:bg-[#1C2B3D] dark:text-[#479EF5]",
    title: "8. Live Topology & Diagrams",
    body: "Mermaid graphs generated from live production records with expandable squads, members, pipelines and tasks — plus pan & zoom topology views.",
    href: "/diagrams",
    link: "Inspect Live Topology",
    accent: "text-[#0078d4]",
  },
];

const stack = [
  ["Next.js 16", "App Router & SSR"],
  ["TypeScript 5", "Strict type safety"],
  ["MongoDB", "Per-tenant isolated DBs"],
  ["Tailwind CSS 4", "Fluent 2 tokens"],
  ["Razorpay", "UPI · Cards · Netbanking"],
  ["Gemini AI", "Reports & form schemas"],
  ["AWS S3", "Presigned doc vault"],
  ["Gantt + Mermaid", "Timelines & topology"],
];

export default function AboutPage() {
  return (
    <MarketingShell>
      {/* ── Hero ── */}
      <p className="text-xs font-bold text-[#0078d4] uppercase tracking-wider mb-2">About TaskPMS</p>
      <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 dark:text-white">
        One workspace, every workflow
      </h1>
      <p className="text-sm sm:text-[15px] text-gray-600 dark:text-zinc-400 mt-3 leading-relaxed font-light max-w-3xl">
        <strong className="font-semibold text-gray-900 dark:text-white">TaskPMS</strong> (Task Project
        Management System) is a multi-tenant enterprise operating system that synchronizes engineering
        delivery, visual planning, team chat, commercial sales and revenue realization in a single
        continuum — every company running in its own isolated workspace with its own database, document
        vault and role hierarchy.
      </p>
      <div className="flex flex-wrap items-center gap-2.5 mt-5">
        <Link
          href="/#demo"
          className="bg-[#0078d4] text-white px-4 py-2 text-sm font-semibold hover:bg-[#005a9e] transition-colors rounded-sm inline-flex items-center gap-2"
        >
          See live product tour <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/#pricing"
          className="border border-gray-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium hover:border-[#0078d4] hover:text-[#0078d4] transition-colors rounded-sm"
        >
          View pricing
        </Link>
        <Link href="/contact" className="text-sm font-medium text-[#0078d4] hover:underline px-1">
          Talk to us →
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
        {[
          ["8+", "live engines replace 4–5 tools"],
          ["21", "models per isolated tenant DB"],
          ["4", "governed S3 vaults · 60s links"],
          ["4 ranks", "owner → employee RBAC"],
        ].map(([v, l]) => (
          <div key={l} className="bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded-sm px-4 py-3.5 text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{v}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-light mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* ── Capability engines ── */}
      <h2 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white mt-12">
        Eight engines, one operating model
      </h2>
      <p className="text-sm text-gray-600 dark:text-zinc-400 font-light mt-1">
        Every card opens a real, working dashboard — not a mockup.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {engines.map((e) => {
          const Icon = e.icon;
          return (
            <div key={e.title} className="bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded-[8px] p-6 flex flex-col justify-between hover:border-[#0078d4] transition-all">
              <div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${e.iconClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">{e.title}</h3>
                <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed mb-4 font-light">{e.body}</p>
              </div>
              <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
                <Link href={e.href} className={`text-xs font-semibold hover:underline inline-flex items-center gap-1 ${e.accent}`}>
                  {e.link} →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── AI band ── */}
      <div className="bg-gradient-to-r from-[#0B2A4A] to-[#0078d4] rounded-[8px] p-6 sm:p-8 mt-8 text-white shadow-sm relative overflow-hidden">
        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300 block mb-2">
          AI Reports & Intel → Forms Builder
        </span>
        <h3 className="text-lg sm:text-xl font-bold leading-tight mb-2">Gemini insight that becomes executable work</h3>
        <p className="text-sm text-blue-100 font-light leading-relaxed mb-4">
          Leaders generate health, deadline and capacity intelligence on <strong>/reports</strong>, then import
          the AI form schema into <strong>/forms</strong> Builder and collect responses via Preview and Share.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/reports" className="px-4 py-2 bg-white text-[#0B2A4A] text-xs font-bold rounded-[4px] hover:bg-sky-100 transition-colors inline-flex items-center gap-1.5">
            Open AI Reports <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link href="/forms" className="px-4 py-2 border border-white/40 text-white text-xs font-semibold rounded-[4px] hover:bg-white/10 transition-colors">
            Open Forms Builder
          </Link>
        </div>
      </div>

      {/* ── Subscription band ── */}
      <div className="bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded-[8px] p-6 shadow-sm mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0078d4]" />
            Tiered team pricing — monthly, quarterly & annual
          </h3>
          <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1 font-mono">
            $5 (₹425) - 2 seats · $8 (₹680) - 4 seats · +$3 (₹255)/seat/month · 3-month save 7% · annual save 17%
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/#pricing" className="px-4 py-2 text-xs font-semibold bg-[#0078d4] hover:bg-[#106EBE] text-white rounded-[4px] transition-colors inline-flex items-center gap-1.5">
            View pricing <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link href="/auth/signup" className="px-4 py-2 text-xs font-semibold border border-gray-200 dark:border-zinc-700 hover:border-[#0078d4] rounded-[4px] transition-colors">
            Subscribe
          </Link>
        </div>
      </div>

      {/* ── Seniority matrix ── */}
      <div className="bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded-[8px] mt-8 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 pb-2">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0078d4]" />
            Enterprise talent & seniority matrix (Ranks 1–5)
          </h3>
          <p className="text-xs text-gray-600 dark:text-zinc-400 font-light">
            Standardized grading across engineering, product, sales and management.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#1B1A19] text-gray-600 dark:text-zinc-400">
                <th className="py-2.5 px-4 font-semibold">Tier Rank</th>
                <th className="py-2.5 px-4 font-semibold">Designation Title</th>
                <th className="py-2.5 px-4 font-semibold">Scope of Responsibility</th>
                <th className="py-2.5 px-4 font-semibold">Typical Experience</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-900 dark:text-white">
              {[
                ["Rank 1", "Associate / Junior Specialist", "Executes well-defined tasks under guidance; component development and routine QA.", "0 – 2 years", "text-[#0078d4]"],
                ["Rank 2", "Mid-Level Professional", "Owns features independently; API integration and deal prospecting.", "2 – 5 years", "text-[#00B7C3]"],
                ["Rank 3", "Senior Specialist / Lead", "Designs architectures, negotiates contracts, mentors specialists.", "5 – 8 years", "text-[#107C10]"],
                ["Rank 4", "Staff Specialist / Squad Lead", "Sets direction across squads; manages allocations and risk.", "8 – 12 years", "text-[#F7630C]"],
                ["Rank 5", "Principal / Executive Director", "Shapes company strategy, capital budgets and governance.", "12+ years", "text-[#5C2D91]"],
              ].map(([rank, title, scope, exp, chip]) => (
                <tr key={rank}>
                  <td className={`py-3 px-4 font-bold ${chip}`}>{rank}</td>
                  <td className="py-3 px-4 font-semibold">{title}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-zinc-400 font-light">{scope}</td>
                  <td className="py-3 px-4">{exp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tech stack ── */}
      <div className="bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded-[8px] p-6 shadow-sm mt-8">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Database className="w-5 h-5 text-[#0078d4]" />
          Technical stack & infrastructure
        </h3>
        <p className="text-xs text-gray-600 dark:text-zinc-400 mb-4 font-light">
          A modern enterprise stack engineered for sub-second responses and tenant-isolated scale.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          {stack.map(([name, sub]) => (
            <div key={name} className="p-3 rounded-[6px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-gray-200 dark:border-[#3B3A39]">
              <span className="font-bold text-gray-900 dark:text-white block">{name}</span>
              <span className="text-[10px] text-gray-500 dark:text-zinc-400">{sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="mt-8 border border-gray-200 dark:border-[#3B3A39] rounded-[8px] bg-[#FAF9F8] dark:bg-[#1B1A19] p-6 sm:p-8 text-center">
        <p className="text-xs font-bold text-[#0078d4] uppercase tracking-wider flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" /> Launch in minutes
        </p>
        <h2 className="text-xl sm:text-2xl font-light tracking-tight text-gray-900 dark:text-white mt-2">
          Your isolated workspace is one checkout away
        </h2>
        <p className="text-sm text-gray-600 dark:text-zinc-400 font-light mt-2 max-w-xl mx-auto">
          Pick seats and tenure, pay via Razorpay, and get a dedicated database, document vault and full
          role hierarchy — instantly.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
          <Link href="/auth/signup" className="bg-[#0078d4] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#005a9e] transition-colors rounded-sm inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Subscribe & launch workspace
          </Link>
          <Link href="/contact" className="border border-gray-300 dark:border-zinc-700 px-5 py-2.5 text-sm font-medium hover:border-[#0078d4] hover:text-[#0078d4] transition-colors rounded-sm">
            Contact sales
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}
