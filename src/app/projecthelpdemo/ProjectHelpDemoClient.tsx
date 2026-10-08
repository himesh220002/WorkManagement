"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Users,
  CheckSquare,
  BadgeDollarSign,
  TrendingUp,
  Workflow,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  DollarSign,
  Layers,
  ChevronRight,
  FileText,
  Target,
  BarChart3,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Briefcase,
  PlayCircle,
  Package,
  Hotel,
  Laptop,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Compass,
} from "lucide-react";

type ArchetypeId = "chair" | "hotel" | "webdev";

export default function ProjectHelpDemoClient({
  companyCode = "DEMO",
}: {
  companyCode?: string;
}) {
  const [activeArchetype, setActiveArchetype] = useState<ArchetypeId>("webdev");
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [interactiveChecked, setInteractiveChecked] = useState<Record<string, boolean>>({
    step1: true,
    step2: true,
    step3: false,
    step4: false,
    step5: false,
    step6: false,
  });

  const toggleTodo = (key: string) => {
    setInteractiveChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(interactiveChecked).filter(Boolean).length;
  const totalCount = Object.keys(interactiveChecked).length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const orgPrefix = companyCode && companyCode !== "DEMO" ? `/${companyCode}` : "";

  return (
    <div className="space-y-8 pb-16 text-[#242424] dark:text-[#E4E4E7]">
      {/* ── 1. Page Header & Hero Banner ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-md bg-gradient-to-r from-[#004578] via-[#005a9e] to-[#0078d4] p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Workflow className="h-3.5 w-3.5 text-blue-200" />
            <span>TaskPMS Operational Architecture · End-to-End Blueprint</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight">
            How to Create, Execute, Sell, and Profit from Any Project
          </h1>

          <p className="text-sm sm:text-base text-blue-100 font-light leading-relaxed max-w-2xl">
            A concrete operational roadmap explaining how to initialize projects, assign budgets, provision squads,
            execute task pipelines, acquire clients through campaigns, close milestone deals, and balance incoming revenue
            against team salary outflows.
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5 text-xs">
            <Link
              href={`${orgPrefix}/projects`}
              className="inline-flex items-center gap-1.5 rounded-sm bg-white px-4 py-2 font-semibold text-[#004578] hover:bg-gray-100 transition shadow-sm"
            >
              <FolderKanban className="h-3.5 w-3.5" />
              <span>Go to Projects</span>
            </Link>
            <Link
              href={`${orgPrefix}/teams`}
              className="inline-flex items-center gap-1.5 rounded-sm bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/20 transition border border-white/20"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Provision Teams</span>
            </Link>
            <Link
              href={`${orgPrefix}/dev/dashboard`}
              className="inline-flex items-center gap-1.5 rounded-sm bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/20 transition border border-white/20"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Dev Pipelines</span>
            </Link>
            <Link
              href={`${orgPrefix}/sales/dashboard`}
              className="inline-flex items-center gap-1.5 rounded-sm bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/20 transition border border-white/20"
            >
              <BadgeDollarSign className="h-3.5 w-3.5" />
              <span>Sales Campaigns</span>
            </Link>
            <Link
              href={`${orgPrefix}/revenue/dashboard`}
              className="inline-flex items-center gap-1.5 rounded-sm bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/20 transition border border-white/20"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Revenue Kanban</span>
            </Link>
          </div>
        </div>

        {/* Decorative background watermark */}
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
          <Workflow className="w-80 h-80" />
        </div>
      </div>

      {/* ── 2. The 6 Universal Operating Phases (Visual Roadmap Flow) ─────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E1DFDD] dark:border-[#3B3A39] pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#242424] dark:text-white flex items-center gap-2">
              <Compass className="h-5 w-5 text-[#0078D4]" />
              <span>Unified 6-Phase Project Lifecycle Roadmap</span>
            </h2>
            <p className="text-xs text-[#605E5C] dark:text-[#A19F9D]">
              Click any phase below to inspect the required app module and exact operational action.
            </p>
          </div>
          <span className="text-xs font-medium text-[#0078D4] dark:text-[#479EF5] bg-[#EBF3FC] dark:bg-[#1C2B3D] px-2.5 py-1 rounded">
            Connected Lifecycle
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[
            {
              phase: "Phase 1",
              title: "Project Genesis & Budget Envelope",
              module: "/projects",
              icon: FolderKanban,
              badge: "Project Blueprint",
              color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
              action: "Create Project in /projects with target Budget ($USD), Category, Agendas & Deadlines.",
              detail:
                "Sets the company boundary, locks initial cash envelope, and prepares the workspace before any team member starts billing hours.",
            },
            {
              phase: "Phase 2",
              title: "Squad Formation & Member Roles",
              module: "/teams",
              icon: Users,
              badge: "Squad Allocation",
              color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40",
              action: "Create Team in /teams, assign Lead (Rank 40/60) and link cross-functional employees (Rank 20).",
              detail:
                "Establishes role hierarchy (Owner, Manager, Lead, Member) and determines fixed monthly salary burden allocated to this project.",
            },
            {
              phase: "Phase 3",
              title: "Pipelines, Gantt & Execution Checklist",
              module: "/dev/dashboard",
              icon: CheckSquare,
              badge: "Execution Engine",
              color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
              action: "Create Pipeline in /dev/dashboard, connect Team & Project, and populate the Execution Checklist.",
              detail:
                "Break project deliverables into trackable sprint todos with assigned owners (Individual or Squad) and monitor cycle time in Frappe Gantt.",
            },
            {
              phase: "Phase 4",
              title: "Customer Acquisition & Ad Campaigns",
              module: "/sales/dashboard",
              icon: BadgeDollarSign,
              badge: "Commercial Growth",
              color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
              action: "Create Campaigns & Inbound Leads in /sales/dashboard; qualify leads from New → Working → Qualified.",
              detail:
                "Connects marketing spend ($) and lead acquisition channels (Meta ads, outbound outreach, partnerships) directly to the project's pipeline.",
            },
            {
              phase: "Phase 5",
              title: "Commercial Deals Kanban & Milestones",
              module: "/revenue/dashboard",
              icon: TrendingUp,
              badge: "Deal Velocity",
              color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40",
              action: "Log Deal in /revenue/dashboard, collect 30% kickoff prepayment, and advance stages to Closed Won.",
              detail:
                "Tracks the 7-stage commercial pipeline (Prospect → Initial Analysis → Closing → Closed Won) with contracts uploaded in the S3 vault.",
            },
            {
              phase: "Phase 6",
              title: "Treasury Inflow vs Salary Outflows",
              module: "/exec/dashboard",
              icon: Coins,
              badge: "Financial Health",
              color: "text-teal-600 bg-teal-50 dark:bg-teal-950/40",
              action: "Inspect rolled-up project ROI, cash inflow vs payroll expenses, and corporate OKR attainment.",
              detail:
                "Evaluates whether revenue from customer orders or milestone deposits exceeds operational expenses and team salaries for net profitability.",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            const isSelected = activePhaseIndex === idx;
            return (
              <div
                key={idx}
                onClick={() => setActivePhaseIndex(idx)}
                className={`cursor-pointer rounded-[4px] border p-4 transition-all flex flex-col justify-between ${isSelected
                  ? "border-[#0078D4] bg-[#F7FAFD] dark:bg-[#1C2B3D]/30 shadow-md ring-1 ring-[#0078D4]"
                  : "border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] hover:border-[#0078D4]"
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0078D4] dark:text-[#479EF5]">
                      {item.phase}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${item.color}`}>
                      {item.badge}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="p-2 rounded bg-[#FAF9F8] dark:bg-[#292827] border border-[#EDEBE9] dark:border-[#3B3A39] shrink-0">
                      <Icon className="w-4 h-4 text-[#0078D4] dark:text-[#479EF5]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#242424] dark:text-white leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#0078D4] font-medium mt-0.5">
                        Module: {item.module}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] font-light leading-relaxed mb-3">
                    {item.detail}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#EDEBE9] dark:border-[#3B3A39] flex items-center justify-between text-xs">
                  <span className="text-[#605E5C] dark:text-[#A19F9D] text-[11px] font-mono">
                    Step {idx + 1} of 6
                  </span>
                  <Link
                    href={`${orgPrefix}${item.module}`}
                    className="inline-flex items-center gap-1 font-semibold text-[#0078D4] dark:text-[#479EF5] hover:underline"
                  >
                    <span>Open Module</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. The 3 Business Archetype Deep Dives (Interactive Tabs) ──── */}
      <section className="space-y-5 rounded-md border border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E1DFDD] dark:border-[#3B3A39] pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0078D4] dark:text-[#479EF5]">
              Real-World Execution Blueprints
            </span>
            <h2 className="text-xl font-bold text-[#242424] dark:text-white mt-0.5">
              Three Specific Project Models &amp; Cash Flow Blueprints
            </h2>
          </div>

          {/* Archetype Tab Switcher */}
          <div className="flex flex-col 2xl:flex-row rounded-sm bg-[#FAF9F8] dark:bg-[#292827] p-1 border border-[#E1DFDD] dark:border-[#3B3A39] self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveArchetype("chair")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-semibold transition ${activeArchetype === "chair"
                ? "bg-white dark:bg-[#3B3A39] text-[#0078D4] dark:text-white shadow-sm"
                : "text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
                }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>1. Physical Office Chair</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveArchetype("hotel")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-semibold transition ${activeArchetype === "hotel"
                ? "bg-white dark:bg-[#3B3A39] text-[#0078D4] dark:text-white shadow-sm"
                : "text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
                }`}
            >
              <Hotel className="w-3.5 h-3.5" />
              <span>2. 4-City Hotel Service</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveArchetype("webdev")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-semibold transition ${activeArchetype === "webdev"
                ? "bg-white dark:bg-[#3B3A39] text-[#0078D4] dark:text-white shadow-sm"
                : "text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424]"
                }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>3. Full-Stack Web Dev Agency</span>
            </button>
          </div>
        </div>

        {/* ── ARCHETYPE 1: PHYSICAL OFFICE CHAIR ───────────────────────── */}
        {activeArchetype === "chair" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 text-xs text-[#0078D4] font-semibold uppercase tracking-wider">
                  <Package className="w-4 h-4" />
                  <span>Physical Product Manufacturing &amp; Omnichannel Retail</span>
                </div>
                <h3 className="text-lg font-bold text-[#242424] dark:text-white">
                  Ergonomic Mesh Executive Chair (2-Year Operating Lifecycle)
                </h3>
                <p className="text-xs sm:text-sm text-[#605E5C] dark:text-[#C8C6C4] leading-relaxed">
                  A physical hardware project requires heavy upfront capital expenditure (molds, tooling, BIFMA testing)
                  before regular sales commence. Once production matures, cash flows shift into steady D2C online orders
                  plus large B2B corporate purchase orders.
                </p>

                {/* Operations Checklist Grid */}
                <div className="rounded border border-[#E1DFDD] dark:border-[#3B3A39] p-4 bg-[#FAF9F8] dark:bg-[#292827] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#242424] dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Exact Setup Steps Inside TaskPMS</span>
                  </h4>
                  <ol className="list-decimal list-inside text-xs space-y-2 text-[#605E5C] dark:text-[#C8C6C4]">
                    <li>
                      <strong className="text-[#242424] dark:text-white">Create Project in /projects:</strong>{" "}
                      Name: &quot;ErgoComfort Executive Chair&quot;, Category: <code>Product</code>, Budget: $150,000 USD.
                    </li>
                    <li>
                      <strong className="text-[#242424] dark:text-white">Form 3 Squads in /teams:</strong>{" "}
                      1) Industrial Design Squad, 2) Supply Chain &amp; Assembly Squad, 3) Omnichannel Sales Squad.
                    </li>
                    <li>
                      <strong className="text-[#242424] dark:text-white">Provision 3 Pipelines in /dev/dashboard:</strong>{" "}
                      Pipeline A: &quot;CAD Prototyping &amp; Mold Tooling&quot;, Pipeline B: &quot;Factory Batch Production (2,000 units)&quot;, Pipeline C: &quot;D2C Storefront &amp; Logistics&quot;.
                    </li>
                    <li>
                      <strong className="text-[#242424] dark:text-white">Populate Execution Checklists:</strong>{" "}
                      CAD drawings, BIFMA drop tests, hydraulic gas-lift certification, Amazon FBA warehouse booking, 20 corporate dealer wholesale contracts.
                    </li>
                    <li>
                      <strong className="text-[#242424] dark:text-white">Setup Ad Campaigns in /sales/dashboard:</strong>{" "}
                      Meta Ergonomic Workstation Ads ($15k/mo budget, $45 Target CAC, $349 Retail Unit Price).
                    </li>
                    <li>
                      <strong className="text-[#242424] dark:text-white">Manage B2B Bulk Deals in /revenue/dashboard:</strong>{" "}
                      Log corporate office deals (50–500 chairs per company) through Prospect → Due Diligence → Closing → Closed Won.
                    </li>
                  </ol>
                </div>
              </div>

              {/* Financial Inflow vs Outflow Ledger */}
              <div className="rounded border border-[#E1DFDD] dark:border-[#3B3A39] p-4 bg-white dark:bg-[#201F1E] space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#E1DFDD] dark:border-[#3B3A39] pb-2">
                    <span className="text-xs font-bold text-[#242424] dark:text-white flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>Monthly Financial Ledger (Year 2)</span>
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      Profitable
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-emerald-600 font-bold flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Monthly Cash Inflow: $85,000</span>
                      </p>
                      <ul className="text-xs text-[#605E5C] dark:text-[#A19F9D] pl-4 list-disc space-y-0.5 mt-1 font-light">
                        <li>D2C Online Sales (150 chairs @ $349): $52,350</li>
                        <li>B2B Corporate Wholesale (100 chairs @ $299): $29,900</li>
                        <li>Spare parts &amp; lumbar accessories: $2,750</li>
                      </ul>
                    </div>

                    <div className="border-t border-[#EDEBE9] dark:border-[#3B3A39] pt-2">
                      <p className="text-[11px] uppercase tracking-wider text-rose-600 font-bold flex items-center gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        <span>Monthly Cash Outflow: $77,000</span>
                      </p>
                      <ul className="text-xs text-[#605E5C] dark:text-[#A19F9D] pl-4 list-disc space-y-0.5 mt-1 font-light">
                        <li>BOM &amp; Factory Manufacturing: $38,000</li>
                        <li>Digital Marketing Ads (Google/Meta): $12,000</li>
                        <li>
                          <strong className="text-[#242424] dark:text-white">Team Salaries Outflow (5 Staff):</strong> $22,000
                          <br />
                          <span className="text-[10px] text-[#8A8886]">
                            (1 Lead Designer @ $6k, 2 Supply Chain Ops @ $4.5k ea, 2 B2B Sales @ $3.5k ea)
                          </span>
                        </li>
                        <li>Warehousing, Freight &amp; Insurance: $5,000</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded bg-[#EBF3FC] dark:bg-[#1C2B3D] p-3 text-xs flex justify-between items-center">
                  <span className="font-semibold text-[#0078D4] dark:text-[#479EF5]">
                    Net Monthly Operating Margin
                  </span>
                  <span className="font-bold text-sm text-[#0078D4] dark:text-[#479EF5]">
                    +$8,000 / mo ($96k/yr)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ARCHETYPE 2: 4-CITY HOTEL SERVICE PLATFORM ───────────────── */}
        {activeArchetype === "hotel" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 text-xs text-[#0078D4] font-semibold uppercase tracking-wider">
                  <Hotel className="w-4 h-4" />
                  <span>Service Marketplace &amp; Commission Aggregator</span>
                </div>
                <h3 className="text-lg font-bold text-[#242424] dark:text-white">
                  4-City Curated Hotel Booking Platform (20 Partner Properties)
                </h3>
                <p className="text-xs sm:text-sm text-[#605E5C] dark:text-[#C8C6C4] leading-relaxed">
                  A high-velocity service platform does not own real estate or inventory. Instead, it aggregates the top 5
                  three-star and four-star hotels across 4 major destination cities (20 hotels total) and earns a 15% platform
                  commission on all room bookings made through the website and corporate partnerships.
                </p>

                {/* Operations Checklist Grid */}
                <div className="rounded border border-[#E1DFDD] dark:border-[#3B3A39] p-4 bg-[#FAF9F8] dark:bg-[#292827] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#242424] dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Exact Setup Steps Inside TaskPMS</span>
                  </h4>
                  <ol className="list-decimal list-inside text-xs space-y-2 text-[#605E5C] dark:text-[#C8C6C4]">
                    <li>
                      <strong className="text-[#242424] dark:text-white">Create Project in /projects:</strong>{" "}
                      Name: &quot;CityStay Curated Hotel Network&quot;, Category: <code>Product</code> / <code>Client</code>, Budget: $80,000 USD.
                    </li>
                    <li>
                      <strong className="text-[#242424] dark:text-white">Form 3 Squads in /teams:</strong>{" "}
                      1) Hotel Partnerships (Vendor Acquisition), 2) Booking Engine Devs (API &amp; Checkout), 3) Guest Relations &amp; Support.
                    </li>
                    <li>
                      <strong className="text-[#242424] dark:text-white">Provision 3 Pipelines in /dev/dashboard:</strong>{" "}
                      Pipeline A: &quot;20-Hotel SLA Contract Signings &amp; Inventory Integration&quot;, Pipeline B: &quot;Real-Time Availability API &amp; Escrow Gateway&quot;, Pipeline C: &quot;Launch Marketing &amp; Corporate Deals&quot;.
                    </li>
                    <li>
                      <strong className="text-[#242424] dark:text-white">Upload Contracts in /docs:</strong>{" "}
                      Store signed hotel partnership agreements, commission agreements, and cancellation policies in the S3 <code>SALES</code> and <code>PROJECT</code> vaults.
                    </li>
                    <li>
                      <strong className="text-[#242424] dark:text-white">Track City Flash Campaigns in /sales/dashboard:</strong>{" "}
                      Create 4 city campaigns (e.g. &quot;Mumbai Monsoon Getaway&quot;, &quot;Bengaluru Tech Week&quot;) tracking leads and room-night conversions.
                    </li>
                    <li>
                      <strong className="text-[#242424] dark:text-white">Monitor B2B Corporate Deals in /revenue/dashboard:</strong>{" "}
                      Sign corporate travel desks into &quot;Closed Won&quot; for predictable annual group bookings.
                    </li>
                  </ol>
                </div>
              </div>

              {/* Financial Inflow vs Outflow Ledger */}
              <div className="rounded border border-[#E1DFDD] dark:border-[#3B3A39] p-4 bg-white dark:bg-[#201F1E] space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#E1DFDD] dark:border-[#3B3A39] pb-2">
                    <span className="text-xs font-bold text-[#242424] dark:text-white flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>Monthly Financial Ledger (Platform)</span>
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      Asset-Light
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-emerald-600 font-bold flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Monthly Platform Inflow: $30,000</span>
                      </p>
                      <p className="text-[11px] text-[#605E5C] dark:text-[#A19F9D]">
                        Total GMV Booked through Site: $200,000 / month
                      </p>
                      <ul className="text-xs text-[#605E5C] dark:text-[#A19F9D] pl-4 list-disc space-y-0.5 mt-1 font-light">
                        <li>15% Net Commission on 2,500 room-nights: $30,000</li>
                        <li>Featured Hotel Spotlight listing fee: $1,500</li>
                      </ul>
                    </div>

                    <div className="border-t border-[#EDEBE9] dark:border-[#3B3A39] pt-2">
                      <p className="text-[11px] uppercase tracking-wider text-rose-600 font-bold flex items-center gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        <span>Monthly Cash Outflow: $25,500</span>
                      </p>
                      <ul className="text-xs text-[#605E5C] dark:text-[#A19F9D] pl-4 list-disc space-y-0.5 mt-1 font-light">
                        <li>Server APIs, SMS Gateway &amp; Stripe (2%): $4,000</li>
                        <li>Google Hotel Search &amp; Social Ads: $7,500</li>
                        <li>
                          <strong className="text-[#242424] dark:text-white">Team Salaries Outflow (6 Staff):</strong> $14,000
                          <br />
                          <span className="text-[10px] text-[#8A8886]">
                            (2 Partnership Mgrs @ $3k ea, 2 Fullstack Devs @ $2.5k ea, 2 Support Agents @ $1.5k ea)
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded bg-[#EBF3FC] dark:bg-[#1C2B3D] p-3 text-xs flex justify-between items-center">
                  <span className="font-semibold text-[#0078D4] dark:text-[#479EF5]">
                    Net Monthly Operating Surplus
                  </span>
                  <span className="font-bold text-sm text-[#0078D4] dark:text-[#479EF5]">
                    +$4,500 / mo ($54k/yr)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ARCHETYPE 3: FULL-STACK WEB DEV AGENCY ───────────────────── */}
        {activeArchetype === "webdev" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 text-xs text-[#0078D4] font-semibold uppercase tracking-wider">
                  <Laptop className="w-4 h-4" />
                  <span>B2B Client Digital Transformation &amp; Scale</span>
                </div>
                <h3 className="text-lg font-bold text-[#242424] dark:text-white">
                  Full-Stack Enterprise Web Application ($60k Contract + $3.5k/mo Retainer)
                </h3>
                <p className="text-xs sm:text-sm text-[#605E5C] dark:text-[#C8C6C4] leading-relaxed">
                  A modern software agency follows a milestone-gated payment model: 30% upfront deposit before commencing
                  sprints, 40% upon staging environment acceptance, and the remaining 30% upon production deployment, SEO
                  hardening, and transition to a monthly maintenance retainer.
                </p>

                {/* 10-Stage Milestone Operational Pipeline */}
                <div className="rounded border border-[#E1DFDD] dark:border-[#3B3A39] p-4 bg-[#FAF9F8] dark:bg-[#292827] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#242424] dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>The 10 Operational Stages from Client Hunting to Retainer</span>
                  </h4>
                  <div className="space-y-2 text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#0078D4] min-w-[20px]">1.</span>
                      <div>
                        <strong className="text-[#242424] dark:text-white">Client Prospecting (/sales/dashboard):</strong>{" "}
                        Log inbound inquiry or outbound LinkedIn lead as <code>New</code> → <code>Working</code>.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#0078D4] min-w-[20px]">2.</span>
                      <div>
                        <strong className="text-[#242424] dark:text-white">Discovery &amp; Architectural Blueprint (/docs):</strong>{" "}
                        Upload client scope document and system architecture into S3 <code>PROJECT</code> vault.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#0078D4] min-w-[20px]">3.</span>
                      <div>
                        <strong className="text-[#242424] dark:text-white">Deal Creation (/revenue/dashboard):</strong>{" "}
                        Open deal in <code>Prospect</code> stage valued at $60,000 USD.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#0078D4] min-w-[20px]">4.</span>
                      <div>
                        <strong className="text-[#242424] dark:text-white">Milestone 1 — 30% Kick-off Prepayment ($18,000 Inflow):</strong>{" "}
                        Move deal to <code>Signing &amp; Closing</code>; deposit collected into company bank before kickoff.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#0078D4] min-w-[20px]">5.</span>
                      <div>
                        <strong className="text-[#242424] dark:text-white">Sprint Execution &amp; Checklist (/dev/dashboard):</strong>{" "}
                        Squad engineers UI in Figma, Next.js components, MongoDB schema, and Stripe checkout.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#0078D4] min-w-[20px]">6.</span>
                      <div>
                        <strong className="text-[#242424] dark:text-white">Milestone 2 — 40% Acceptance Review ($24,000 Inflow):</strong>{" "}
                        Staging demo presented; client approves deliverables; second tranche cleared.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#0078D4] min-w-[20px]">7.</span>
                      <div>
                        <strong className="text-[#242424] dark:text-white">Deployment &amp; SEO Hardening:</strong>{" "}
                        Production deployment on Vercel/AWS, Lighthouse 95+ score, schema markup, SSL.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#0078D4] min-w-[20px]">8.</span>
                      <div>
                        <strong className="text-[#242424] dark:text-white">Milestone 3 — Final 30% Balance ($18,000 Inflow):</strong>{" "}
                        Deal moves to <code>Closed Won</code>. Full $60,000 contract value successfully settled.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#0078D4] min-w-[20px]">9.</span>
                      <div>
                        <strong className="text-[#242424] dark:text-white">Maintenance Retainer &amp; Ad Campaigns ($3,500/mo Inflow):</strong>{" "}
                        Deal transitions to <code>Integration</code> (recurring monthly retainer for uptime &amp; Google/Meta campaigns).
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#0078D4] min-w-[20px]">10.</span>
                      <div>
                        <strong className="text-[#242424] dark:text-white">Salary Outflow Distribution:</strong>{" "}
                        Disburse monthly developer salaries from milestone tranches while retaining net agency margin.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Inflow vs Outflow Ledger */}
              <div className="rounded border border-[#E1DFDD] dark:border-[#3B3A39] p-4 bg-white dark:bg-[#201F1E] space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#E1DFDD] dark:border-[#3B3A39] pb-2">
                    <span className="text-xs font-bold text-[#242424] dark:text-white flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>Project P&amp;L Ledger (Contract)</span>
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      High Margin
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-emerald-600 font-bold flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Contract Inflow: $60,000 Total</span>
                      </p>
                      <ul className="text-xs text-[#605E5C] dark:text-[#A19F9D] pl-4 list-disc space-y-0.5 mt-1 font-light">
                        <li>Milestone 1 (30% Kickoff Prepay): $18,000</li>
                        <li>Milestone 2 (40% Staging Acceptance): $24,000</li>
                        <li>Milestone 3 (30% Go-Live Clearance): $18,000</li>
                        <li>+ Ongoing Monthly Retainer: $3,500 / month</li>
                      </ul>
                    </div>

                    <div className="border-t border-[#EDEBE9] dark:border-[#3B3A39] pt-2">
                      <p className="text-[11px] uppercase tracking-wider text-rose-600 font-bold flex items-center gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        <span>Project Expenses &amp; Salary Outflow</span>
                      </p>
                      <ul className="text-xs text-[#605E5C] dark:text-[#A19F9D] pl-4 list-disc space-y-0.5 mt-1 font-light">
                        <li>Cloud Hosting, Domains &amp; APIs: $1,500</li>
                        <li>
                          <strong className="text-[#242424] dark:text-white">Team Salaries (4 Months):</strong> $37,000
                          <br />
                          <span className="text-[10px] text-[#8A8886]">
                            (1 Tech Lead @ $4k/mo × 4 = $16k, 2 Devs @ $2.2k/mo × 4 = $17.6k, 1 Designer pro-rata $3.4k)
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded bg-[#EBF3FC] dark:bg-[#1C2B3D] p-3 text-xs flex justify-between items-center">
                  <span className="font-semibold text-[#0078D4] dark:text-[#479EF5]">
                    Net Agency Project Profit
                  </span>
                  <span className="font-bold text-sm text-[#0078D4] dark:text-[#479EF5]">
                    +$21,500 (36% Net Margin)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── 4. Interactive Execution Checklist Simulator ─────────────── */}
      <section className="rounded-md border border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1DFDD] dark:border-[#3B3A39] pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0078D4] dark:text-[#479EF5]">
              Interactive Pattern Testing Sandbox
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[#242424] dark:text-white">
              Live Pipeline Checklist Simulator (Mirrors /dev/dashboard Modal)
            </h3>
            <p className="text-xs text-[#605E5C] dark:text-[#A19F9D]">
              Test checking off tasks below to see how progress calculation updates in the pipeline card.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-[#0078D4] dark:text-[#479EF5]">
                {completedCount}/{totalCount} Completed
              </span>
              <p className="text-[11px] text-[#8A8886]">{progressPct}% Total Progress</p>
            </div>
            <div className="w-20 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0078D4] h-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* The Todos List */}
        <div className="space-y-2">
          {[
            {
              key: "step1",
              text: "Find clients through outbound portfolio outreach & digital campaigns",
              assignee: "Sales Team",
              tag: "Lead Gen",
            },
            {
              key: "step2",
              text: "Ask their motive and record business requirements in S3 Document Vault",
              assignee: "Product Manager",
              tag: "Discovery",
            },
            {
              key: "step3",
              text: "Discuss their project plan and formulate technical scope & architecture",
              assignee: "Devteam",
              tag: "Scoping",
            },
            {
              key: "step4",
              text: "Introduce plan enhancements, timeline Gantt dependencies & milestone targets",
              assignee: "Devteam",
              tag: "Timeline",
            },
            {
              key: "step5",
              text: "Convince how it will be delivered with QA benchmarks & staging demos",
              assignee: "Tech Lead",
              tag: "Pitch",
            },
            {
              key: "step6",
              text: "Decide budget and collect initial 30% prepayment deposit before repository init",
              assignee: "Operations Manager",
              tag: "Prepayment",
            },
          ].map((item) => {
            const isDone = interactiveChecked[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggleTodo(item.key)}
                className={`cursor-pointer flex items-center justify-between p-3 rounded-[4px] border text-xs transition ${isDone
                  ? "bg-[#FAF9F8] dark:bg-[#292827] border-[#EDEBE9] dark:border-[#3B3A39]"
                  : "bg-white dark:bg-[#201F1E] border-[#E1DFDD] dark:border-[#3B3A39] hover:border-[#0078D4]"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => { }}
                    className="h-4 w-4 rounded accent-[#0078D4] cursor-pointer"
                  />
                  <span
                    className={`font-medium ${isDone
                      ? "line-through text-[#8A8886] dark:text-[#797775]"
                      : "text-[#242424] dark:text-white"
                      }`}
                  >
                    {item.text}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-[#605E5C] dark:text-[#A19F9D] bg-black/[0.04] dark:bg-white/[0.05] px-2 py-0.5 rounded">
                    {item.assignee}
                  </span>
                  <span className="text-[10px] font-semibold text-[#0078D4] dark:text-[#479EF5] uppercase">
                    {item.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-between items-center pt-2 text-xs text-[#605E5C] dark:text-[#A19F9D]">
          <span>
            💡 This exact checklist is available on any pipeline card in{" "}
            <Link href={`${orgPrefix}/dev/dashboard`} className="text-[#0078D4] font-semibold hover:underline">
              /dev/dashboard
            </Link>{" "}
            by clicking on the card.
          </span>
          <Link
            href={`${orgPrefix}/dev/dashboard`}
            className="font-semibold text-[#0078D4] hover:underline flex items-center gap-1"
          >
            <span>Open Real Pipeline Modal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ── 5. Direct Module Navigation Hub ─────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-[#242424] dark:text-white">
          Jump Directly to Any Application Sub-System
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "1. Projects", href: `${orgPrefix}/projects`, icon: FolderKanban, desc: "Create & Budget" },
            { label: "2. Teams", href: `${orgPrefix}/teams`, icon: Users, desc: "Squads & Roles" },
            { label: "3. Dev Hub", href: `${orgPrefix}/dev/dashboard`, icon: CheckSquare, desc: "Pipelines & Todos" },
            { label: "4. Sales", href: `${orgPrefix}/sales/dashboard`, icon: BadgeDollarSign, desc: "Campaigns & Leads" },
            { label: "5. Revenue", href: `${orgPrefix}/revenue/dashboard`, icon: TrendingUp, desc: "Deals & Inflow" },
            { label: "6. Vault", href: `${orgPrefix}/docs`, icon: FileText, desc: "S3 Contracts & Slips" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={i}
                href={item.href}
                className="group p-3 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] hover:border-[#0078D4] hover:shadow-sm transition text-center flex flex-col items-center justify-center gap-1.5"
              >
                <div className="p-2 rounded bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-[#242424] dark:text-white group-hover:text-[#0078D4] transition-colors">
                  {item.label}
                </span>
                <span className="text-[10px] text-[#8A8886] font-light">
                  {item.desc}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
