"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  MessagesSquare,
  KanbanSquare,
  Wallet,
  Sparkles,
  Gauge,
} from "lucide-react";

type DemoId = "pipelines" | "deliver" | "collaborate" | "sell" | "govern" | "intelligence";

const tabs: { id: DemoId; label: string; route: string }[] = [
  { id: "pipelines", label: "Plan · Timelines", route: "/dev/timeline" },
  { id: "deliver", label: "Deliver · Dev Hub", route: "/dev/dashboard" },
  { id: "collaborate", label: "Chat · Teams", route: "/chat" },
  { id: "sell", label: "Sell · Pipeline", route: "/sales/dashboard" },
  { id: "govern", label: "Govern · Resources", route: "/exec/resources" },
  { id: "intelligence", label: "AI · Reports & Forms", route: "/reports" },
];

const copy: Record<
  DemoId,
  { eyebrow: string; title: string; body: string; bullets: string[]; cta: string; href: string; stats: [string, string][] }
> = {
  pipelines: {
    eyebrow: "Enterprise Parallel Pipeline Matrix",
    title: "Every project track, synchronized on one timeline",
    body: "The same view your delivery leads open daily: parallel streams from Jul 2026 → Jan 2027 with a TODAY marker, per-track progress and Done counters. No mockup — this is /dev/timeline.",
    bullets: [
      "3 project streams · 15 concurrent tracks (TESTPROJECT001, Hotel Booking Service, ApexVision 2K)",
      "Color-coded delivery bars: 2/6 Done, 3/4 Done, 4/5 Done with Oct–Dec windows",
      "Avg progress rollup per stream: 27% · 73% · 65% with Monthly / Sprint-Weeks horizons",
    ],
    cta: "Open live Timeline & Pipelines",
    href: "/dev/timeline",
    stats: [
      ["15", "concurrent tracks"],
      ["Jul–Jan", "multi-month horizon"],
      ["TODAY", "live cut-line"],
    ],
  },
  deliver: {
    eyebrow: "Production & Operations Delivery Hub",
    title: "Estimates vs. actuals, severity and status at a glance",
    body: "Engineering managers run the day from /dev/dashboard: deliverable counts, milestone velocity, pipeline progress and logged hours — then drill into module variance.",
    bullets: [
      "32 deliverables · 25-day avg milestone velocity · 65.4% active pipeline · 1884 hrs logged",
      "Estimated vs. Actual Hours by Module across ~30 components",
      "Task Severity donut (Critical / High / Medium / Low) + Todo → Done distribution bar",
    ],
    cta: "Open live Dev Dashboard",
    href: "/dev/dashboard",
    stats: [
      ["32", "deliverables tracked"],
      ["1884 hrs", "production time"],
      ["65.4%", "pipeline progress"],
    ],
  },
  collaborate: {
    eyebrow: "Chat Space + Teams & Members",
    title: "Talk where the work lives — then staff it",
    body: "Global All-Hands, department teams, squad groups and 1-to-1 DMs feed directly into squad staffing with merit, rank and on-track signals on /chat and /teams.",
    bullets: [
      "Global / Team / Group / Direct scopes with @-mentions and Saved Persons",
      "Departments (Engineering, Product, Sales…) + squads (#frontend-squad, #q4-release…)",
      "Merit cards: On Track 83–88%, Principal Tier, Contender 80%, Pending Review gates",
    ],
    cta: "Open live Chat & Teams",
    href: "/chat",
    stats: [
      ["20", "members in All-Hands"],
      ["6", "squad types"],
      ["R1–R5", "seniority ranks"],
    ],
  },
  sell: {
    eyebrow: "Leads Kanban → Pipeline execution → Revenue",
    title: "From $3M pipeline to checklist-level execution",
    body: "Sellers qualify on /sales/dashboard (New → Working → Qualified → Unqualified), then execute inside the pipeline modal: owners, dates, risk, revenue and checklists.",
    bullets: [
      "11 leads · 4 campaigns · $3,080,000 estimated pipeline · 36% funnel conversion",
      "Pipeline modal: HBS B2B Sales — 60% progress, $1.45M projected, $110K spend, 720% ROI",
      "Execution checklist 3/5 with owners (Elena Vance, Chloe Zhao) + reorder & add-task",
    ],
    cta: "Open live Sales Pipeline",
    href: "/sales/dashboard",
    stats: [
      ["$3.08M", "estimated pipeline"],
      ["36%", "funnel conversion"],
      ["3/5", "checklist done"],
    ],
  },
  govern: {
    eyebrow: "Resource Allocation Envelopes",
    title: "Capital, headcount and burn — ledger-grade control",
    body: "Finance and owners govern on /exec/resources: every envelope links to a project or deal, with allocated vs. used, burn bars and Low / Medium risk flags.",
    bullets: [
      "11 envelopes: AWS/GCP infra $60K, Meta-search $220K, CNC molds $280K, concierge ops 90K",
      "Burn bars 10–100% with Used vs. Allocated and deal linkage (Marriott pilot)",
      "Headcount + Budget types filtered by project, type and risk level",
    ],
    cta: "Open live Resource Allocation",
    href: "/exec/resources",
    stats: [
      ["11", "allocation envelopes"],
      ["95%", "highest burn flagged"],
      ["Low/Med", "risk gating"],
    ],
  },
  intelligence: {
    eyebrow: "AI Reports & Intel → Forms Builder",
    title: "Gemini insight that becomes an executable form",
    body: "Leaders generate on /reports (health, deadlines, problems/solutions, effort), then import the AI form schema into /forms Builder and collect responses via Preview/Share.",
    bullets: [
      "96% On Track · 0 overdue / 32 tracked · 0 probs · 100% capacity with benchmark tables",
      "AI Form Schema Preview (6 questions): short/long text, single-select, date, contact, uploads",
      "Builder → Preview → Submissions → Share flow with Live badge and validation",
    ],
    cta: "Open live AI Reports & Forms",
    href: "/reports",
    stats: [
      ["96%", "project health"],
      ["6", "schema questions"],
      ["1-click", "form import"],
    ],
  },
};

function BrowserChrome({ route, children }: { route: string; children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded-[8px] overflow-hidden shadow-[0_12px_40px_-16px_rgba(0,120,212,0.35)]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#1B1A19] shrink-0">
        <span className="flex gap-1.5">
          <i className="w-2.5 h-2.5 rounded-full bg-red-400/80 block" />
          <i className="w-2.5 h-2.5 rounded-full bg-yellow-400/80 block" />
          <i className="w-2.5 h-2.5 rounded-full bg-green-500/80 block" />
        </span>
        <span className="ml-2 text-[11px] font-mono bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded px-2 py-0.5 text-gray-600 dark:text-zinc-300 truncate">
          taskpms.com{route}
        </span>
        <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
          LIVE
        </span>
      </div>
      <div className="p-3 sm:p-4 bg-[#f2f2f2] dark:bg-[#111214] flex-1 min-h-[430px] lg:min-h-[470px] flex flex-col justify-start">{children}</div>
    </div>
  );
}

function PipelinesMock() {
  const rows = [
    { name: "TESTPROJECT001", sub: "3 concurrent tracks", pct: "27%", bars: [{ w: "18%", c: "bg-slate-700", t: "2/6 Done" }, { w: "16%", c: "bg-blue-600", t: "1/3 Done" }, { w: "62%", c: "bg-amber-500", t: "3/4 Done · Oct–Dec" }] },
    { name: "HOTEL BOOKING SERVICE", sub: "6 concurrent tracks", pct: "73%", bars: [{ w: "28%", c: "bg-emerald-500", t: "4/4 Done" }, { w: "36%", c: "bg-blue-500", t: "4/5 Done" }, { w: "30%", c: "bg-pink-600", t: "3/5 Done" }] },
    { name: "APEXVISION ESPORTS 2K", sub: "6 concurrent tracks", pct: "65%", bars: [{ w: "42%", c: "bg-blue-500", t: "4/4 Done" }, { w: "34%", c: "bg-slate-600", t: "4/5 Done" }] },
  ];
  return (
    <div className="bg-white dark:bg-[#1a1b1e] rounded border border-gray-200 dark:border-white/10 overflow-hidden text-left h-full flex flex-col">
      <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
        <p className="text-xs font-bold truncate">Enterprise Parallel Pipeline Matrix</p>
        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">Multi-Track Live Sync</span>
      </div>
      <div className="px-3 py-1.5 flex items-center gap-1.5 border-b border-gray-100 dark:border-white/10">
        <span className="text-[9px] font-bold border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5">▽ All Project Tracks</span>
        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">Monthly Horizon</span>
        <span className="text-[9px] font-semibold text-gray-500 border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5">Sprint Weeks</span>
      </div>
      <div className="grid grid-cols-8 text-[9px] font-semibold text-gray-400 px-3 py-1.5">
        {["Jul 26", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan 27"].map((m) => <span key={m}>{m}</span>)}
        <span className="text-right">Avg</span>
      </div>
      {rows.map((r) => (
        <div key={r.name} className="px-3 py-2 border-t border-gray-100 dark:border-white/5">
          <div className="flex justify-between items-baseline text-[10px] font-bold mb-1"><span className="truncate">● {r.name} <span className="font-normal text-gray-400">({r.sub})</span></span><span className="text-gray-500 shrink-0 ml-2">Avg {r.pct}</span></div>
          <div className="relative h-12 rounded bg-gray-50 dark:bg-white/5 overflow-hidden">
            <span className="absolute top-0 bottom-0 w-px bg-red-400 z-10" style={{ left: "58%" }} />
            <span className="absolute top-0.5 z-10 text-[7px] font-bold text-white bg-red-500 rounded px-1 -translate-x-1/2" style={{ left: "58%" }}>TODAY</span>
            <div className="absolute left-2 right-2 top-5 bottom-1.5 flex gap-1">
              {r.bars.map((b, i) => (
                <span key={i} className={`${b.c} rounded text-white text-[8px] font-semibold flex items-center px-1.5 truncate`} style={{ width: b.w }}>◷ {b.t}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
      <div className="mt-auto px-3 py-2 border-t border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] flex items-center gap-2">
        <span className="h-2 flex-1 rounded bg-gray-200 overflow-hidden flex"><span className="bg-emerald-500 block" style={{ width: "27%" }} /><span className="bg-blue-500 block" style={{ width: "38%" }} /><span className="bg-amber-500 block" style={{ width: "35%" }} /></span>
        <span className="text-[9px] font-bold shrink-0">15 tracks · 32 deliverables · next milestone Oct 28</span>
      </div>
    </div>
  );
}

function DeliverMock() {
  return (
    <div className="space-y-2.5 text-left h-full flex flex-col">
      <div className="grid grid-cols-4 gap-2">
        {[["32", "Deliverables", "across all projects"], ["25d", "Velocity", "avg milestone cycle"], ["65.4%", "Progress", "3 active pipelines"], ["1884h", "Logged", "actual time invested"]].map(([v, l, s]) => (
          <div key={l} className="bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 rounded p-2">
            <p className="text-[9px] uppercase tracking-wide text-gray-400 font-bold truncate">{l}</p>
            <p className="text-sm font-bold leading-tight">{v}</p>
            <p className="text-[8px] text-gray-500 truncate">{s}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 rounded p-2">
          <p className="text-[10px] font-bold leading-tight">Estimated vs. Actual Hours by Module</p>
          <div className="flex items-center gap-2 mt-0.5 mb-1">
            <span className="flex items-center gap-1 text-[8px] text-gray-500"><i className="w-2 h-2 rounded-sm bg-gray-300 block" />Estimated</span>
            <span className="flex items-center gap-1 text-[8px] text-gray-500"><i className="w-2 h-2 rounded-sm bg-[#0078d4] block" />Actual</span>
          </div>
          <div className="flex items-end gap-1 h-20">
            {[38, 30, 78, 52, 44, 56, 112, 88, 26, 42, 60, 88, 112, 72, 118, 64, 32, 132, 46, 92].map((h, i) => (
              <span key={i} className="flex-1 flex flex-col gap-0.5 justify-end">
                <span className="bg-gray-300 rounded-sm block" style={{ height: `${h * 0.42}px` }} />
                <span className="bg-[#0078d4] rounded-sm block" style={{ height: `${h * 0.36}px` }} />
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 rounded p-2 flex flex-col">
          <p className="text-[10px] font-bold">Task Severity Profile</p>
          <p className="text-[8px] text-gray-500">Critical, high, medium and low priority</p>
          <span className="mx-auto my-1 block w-16 h-16 rounded-full border-[11px] border-orange-500 border-t-red-600 border-l-blue-600 border-b-orange-500" />
          <p className="text-[8px] mt-auto text-center"><span className="text-red-600 font-bold">■ Critical</span> <span className="text-orange-500 font-bold">■ High</span> <span className="text-blue-600 font-bold">■ Medium</span></p>
        </div>
      </div>
      <div className="bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 rounded p-2">
        <p className="text-[10px] font-bold">Deliverable and Task Distribution by Status</p>
        <div className="flex gap-2 text-[8px] font-semibold my-1"><span>■ Todo 0</span><span className="text-blue-600">■ In Progress 9</span><span className="text-violet-500">■ Review 1</span><span className="text-green-700">■ Done 22</span></div>
        <div className="h-3 rounded overflow-hidden flex"><span className="bg-blue-600" style={{ width: "28%" }} /><span className="bg-violet-500" style={{ width: "6%" }} /><span className="bg-green-700" style={{ width: "66%" }} /></div>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2">
        <div className="rounded border border-blue-200 bg-blue-50/60 p-2 flex items-center gap-1.5"><span className="text-blue-600 font-bold">＋</span><p className="text-[9px] font-bold">Add Deliverable / Production Task</p></div>
        <div className="rounded border border-emerald-200 bg-emerald-50/60 p-2 flex items-center gap-1.5"><span className="text-emerald-600 font-bold">◷</span><p className="text-[9px] font-bold">Define Milestone, Batch or Sprint</p></div>
      </div>
    </div>
  );
}

function CollaborateMock() {
  return (
    <div className="text-left h-full flex flex-col gap-2">
      <div className="flex items-center gap-1.5 overflow-hidden">
        {["Marcus Chen · Product", "Elena Rostova · Principal", "Sarah Jenkins · VP", "Marcus Brody · Lead"].map((p) => (
          <span key={p} className="text-[8px] font-semibold border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1b1e] rounded-full px-2 py-0.5 truncate">⛉ {p}</span>
        ))}
        <span className="text-[8px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 shrink-0">＋ Pin to Saved Persons</span>
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1">
        <div className="bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 rounded p-2 flex flex-col">
          <p className="text-[9px] font-bold uppercase text-gray-400">Team message options</p>
          {[["Engineering", "4", "bg-violet-100 text-violet-700"], ["Product & Design", "3", "bg-violet-100 text-violet-700"], ["Sales & Marketing", "3", "bg-violet-100 text-violet-700"], ["#frontend-squad", "3", "bg-emerald-100 text-emerald-700"], ["#q4-release", "4", "bg-emerald-100 text-emerald-700"]].map(([t, n, chip]) => (
            <p key={t} className="text-[10px] py-1 border-b border-gray-50 dark:border-white/5 last:border-0 flex justify-between items-center">◆ {t}<span className={`text-[8px] font-bold rounded-full px-1.5 ${chip}`}>{n}</span></p>
          ))}
          <p className="text-[9px] font-bold uppercase text-gray-400 mt-2">Direct · Elena Vance ●</p>
          <div className="mt-1.5 space-y-1.5">
            {[["Dev Patel · R4", "88%", "83% Merit · On Track"], ["Sarah Jenkins · R4", "87%", "82% Merit · On Track"]].map(([n, w, s]) => (
              <div key={n} className="rounded bg-blue-50/70 border border-blue-100 p-1.5">
                <p className="text-[9px] font-bold">{n}</p>
                <div className="h-1.5 bg-gray-200 rounded mt-1"><span className="block h-full bg-amber-500 rounded" style={{ width: w }} /></div>
                <p className="text-[8px] text-gray-500">{s}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-2 bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 rounded p-2 flex flex-col">
          <div className="flex items-center justify-between"><p className="text-[10px] font-bold">Global All-Hands · 20 Members</p><span className="text-[8px] font-bold text-gray-400 border rounded px-1.5">GLOBAL</span></div>
          <div className="mt-2 space-y-2">
            <div className="flex gap-2"><span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">SJ</span><div className="text-[10px] bg-gray-50 dark:bg-white/5 rounded p-1.5"><p><strong>Sarah Jenkins</strong> <span className="text-gray-400">VP of Engineering · 12:49</span></p><p>🚀 Welcome to TaskPMS Company Chat Space! Post global announcements or squad updates.</p><p className="mt-1 text-[9px]">🚀 1 &nbsp; 🎉 1</p></div></div>
            <div className="flex gap-2"><span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">MC</span><div className="text-[10px] bg-gray-50 dark:bg-white/5 rounded p-1.5"><p><strong>Marcus Chen</strong> <span className="text-gray-400">Product Lead · 14:49</span></p><p>Heads up team: <span className="text-blue-600 font-bold bg-blue-100 rounded px-1">@Satyam</span> the Q4 release roadmap whiteboard is now live — adjustments needed?</p><p className="mt-1 text-[9px]">👍 1</p></div></div>
          </div>
          <div className="mt-auto pt-2">
            <div className="flex gap-1 mb-1.5"><span className="text-[8px] font-bold text-white bg-blue-600 rounded px-1.5 py-0.5">🌐 Global</span><span className="text-[8px] font-semibold text-gray-500">👥 Team</span><span className="text-[8px] font-semibold text-gray-500">💬 Group</span><span className="text-[8px] font-semibold text-gray-500">👤 Direct</span></div>
            <div className="border border-gray-200 dark:border-white/10 rounded p-1.5 flex justify-between items-center gap-2">
              <span className="text-[10px] text-gray-400 truncate">Message Global All-Hands… Type @ to mention</span>
              <span className="text-[10px] font-bold bg-blue-600 text-white rounded px-2 py-1 shrink-0">Send ➤</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SellMock() {
  const cols: [string, [string, string][]][] = [
    ["New · 2", [["Aman Luxury APAC", "Elena Vance"], ["Team Liquid GC", "Alex Rivera"]]],
    ["Working · 3", [["Ace Hotel Mgmt", "Chloe Zhao"], ["Newegg Hardware", "Alex Rivera"]]],
    ["Qualified · 4", [["Nomad Hotel", "Elena Vance"], ["CitizenM Urban", "Elena Vance"]]],
    ["Unqualified · 2", [["Backpacker Net", "Chloe Zhao"], ["Surplus LCD", "Alex Rivera"]]],
  ];
  return (
    <div className="text-left h-full flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-2">
        {[["11 · 4 Qualified", "Total inbound leads", "Active funnel prospects"], ["4", "Active campaigns", "Targeting key segments"], ["$3,080,000", "Estimated pipeline revenue", "Sum of campaign value"], ["36%", "Funnel conversion rate", "Qualified ÷ inbound"]].map(([v, l, s]) => (
          <div key={l} className="bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 rounded p-1.5"><p className="text-xs font-bold truncate">{v}</p><p className="text-[8px] text-gray-500 uppercase font-bold truncate">{l}</p><p className="text-[8px] text-gray-400 truncate">{s}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 flex-1">
        {cols.map(([h, cards]) => (
          <div key={h} className="bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded p-1.5 flex flex-col">
            <p className="text-[10px] font-bold mb-1">{h}</p>
            {cards.map(([c, o]) => (
              <div key={c} className="bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 rounded p-1.5 mb-1.5 shadow-sm">
                <p className="text-[9px] font-bold leading-tight">{c}</p>
                <p className="text-[8px] text-gray-500">⛉ Owner: {o}</p>
                <p className="text-[8px] text-blue-600 truncate">📣 Summer Vacation 2026 Ads Blitz</p>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 rounded p-2">
        <p className="text-[10px] font-bold">Execution Checklist (3/5) · Hospitality Partner Acquisition</p>
        <div className="mt-1 space-y-1 text-[9px]">
          <p className="flex justify-between bg-gray-50 dark:bg-white/5 rounded px-1.5 py-1"><span>☑ Sign master service agreements (50 hotels)</span><span className="text-gray-500">Elena Vance</span></p>
          <p className="flex justify-between bg-gray-50 dark:bg-white/5 rounded px-1.5 py-1"><span>☑ Negotiate 12% tiered commission schedule</span><span className="text-gray-500">Elena Vance</span></p>
          <p className="flex justify-between rounded px-1.5 py-1 border border-gray-100 dark:border-white/10"><span>☐ Structure group tour wholesale allocation</span><span className="text-gray-500">Chloe Zhao</span></p>
        </div>
      </div>
      <div className="mt-auto bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 rounded p-2 flex items-center gap-2">
        <span className="h-2 flex-1 bg-gray-200 rounded overflow-hidden"><span className="block h-full w-[60%] bg-blue-600 rounded" /></span>
        <span className="text-[9px] font-bold shrink-0">HBS B2B Sales · 60% · $1.45M · 720% ROI</span>
      </div>
    </div>
  );
}

function GovernMock() {
  const rows: [string, string, string, string, string, string, string][] = [
    ["AWS & GCP PMS Infra", "Budget", "$60K", "$42K", "70%", "Low", "w-[70%] bg-orange-500"],
    ["Field Specialists", "Headcount", "140K", "115K", "82%", "Medium", "w-[82%] bg-orange-500"],
    ["Meta-Search & Influencer", "Budget", "$220K", "$165K", "75%", "Low", "w-[75%] bg-orange-500"],
    ["Concierge Ops Desk", "Headcount", "90K", "58K", "64%", "Low", "w-[64%] bg-blue-600"],
    ["CNC Molds & Tooling", "Budget", "$280K", "$265K", "95%", "Medium", "w-[95%] bg-red-600"],
  ];
  return (
    <div className="text-left h-full flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-bold border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1b1e] rounded px-1.5 py-0.5">🔍 Search allocations…</span>
        <span className="text-[9px] font-semibold border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1b1e] rounded px-1.5 py-0.5">▽ All Projects (3)</span>
        <span className="text-[9px] font-semibold border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1b1e] rounded px-1.5 py-0.5">▽ All Types</span>
        <span className="text-[9px] font-semibold border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1b1e] rounded px-1.5 py-0.5">▽ All Risk Levels</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[["$750K", "Total allocated", "11 envelopes"], ["$595K", "Total used", "79% blended burn"], ["79%", "Average burn", "across envelopes"], ["2", "At-risk envelopes", "Medium risk flag"]].map(([v, l, s]) => (
          <div key={l} className="bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 rounded p-1.5"><p className="text-xs font-bold">{v}</p><p className="text-[8px] text-gray-500 uppercase font-bold truncate">{l}</p><p className="text-[8px] text-gray-400 truncate">{s}</p></div>
        ))}
      </div>
      <div className="bg-white dark:bg-[#1a1b1e] rounded border border-gray-200 dark:border-white/10 overflow-hidden flex-1">
        <div className="px-2 py-1.5 border-b border-gray-100 dark:border-white/10"><p className="text-[10px] font-bold">Resource Allocation Envelopes</p><p className="text-[8px] text-gray-500">Detailed ledger of capital, headcount and infrastructure commitments.</p></div>
        <div className="grid grid-cols-12 gap-1 px-2 py-1 text-[8px] font-bold uppercase text-gray-400 border-b border-gray-100 dark:border-white/10"><span className="col-span-4">Envelope</span><span className="col-span-2">Type</span><span className="col-span-2">Used</span><span className="col-span-3">Burn</span><span className="col-span-1">Risk</span></div>
        {rows.map(([n, t, a, u, p, r, bar]) => (
          <div key={n} className="grid grid-cols-12 gap-1 px-2 py-1.5 border-b border-gray-50 dark:border-white/5 last:border-0 items-center text-[9px]">
            <span className="col-span-4 font-bold truncate">{n}<span className="block font-normal text-gray-400 text-[8px] truncate">{a} → {u}</span></span>
            <span className="col-span-2"><span className={`text-[8px] font-bold rounded px-1 ${t === "Budget" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>{t}</span></span>
            <span className="col-span-2 text-gray-500 font-semibold">{u}</span>
            <span className="col-span-3 flex items-center gap-1"><span className="h-1.5 flex-1 bg-gray-100 rounded"><span className={`block h-full rounded ${bar.split(" ").slice(1).join(" ")} ${bar.split(" ")[0]}`} /></span><span className="font-bold">{p}</span></span>
            <span className="col-span-1"><span className={`rounded px-1.5 py-0.5 font-bold text-[8px] ${r === "Low" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{r}</span></span>
          </div>
        ))}
      </div>
      <div className="mt-auto bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 rounded p-2 flex items-center justify-between">
        <p className="text-[9px] text-gray-500">Linked deal: <span className="text-blue-600 font-semibold">Marriott Autograph Boutique Pilot</span> · utilization analytics update nightly</p>
        <span className="text-[10px] font-bold text-blue-600 shrink-0">＋ New Allocation</span>
      </div>
    </div>
  );
}

function IntelligenceMock() {
  const kpis: [string, string, string][] = [
    ["96%", "On Track", "text-emerald-400"],
    ["0 / 32", "overdue tracked", "text-emerald-400"],
    ["0 · 3", "probs · solutions", "text-sky-400"],
    ["100%", "team capacity", "text-purple-400"],
  ];
  const questions: [string, string][] = [
    ["Project / Initiative Name", "short_text"],
    ["Priority Level", "single_select"],
    ["Detailed Description", "long_text"],
    ["Target Deadline", "date"],
    ["Contact Email", "contact_info"],
    ["Supporting Docs", "uploads"],
  ];
  return (
    <div className="space-y-2.5 text-left h-full flex flex-col">
      <div className="grid grid-cols-4 gap-2">
        {kpis.map(([v, l, c]) => (
          <div key={l} className="bg-[#0F1117] text-white rounded p-2 border border-white/10">
            <p className={`text-sm font-black leading-none ${c}`}>{v}</p>
            <p className="text-[8px] text-gray-400 mt-1 leading-tight">{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 rounded p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold">Project Health, Deadlines & Solutions · TaskFlow Org</p>
          <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5 shrink-0">ON TRACK 96/100</span>
        </div>
        <div className="mt-1.5 border border-gray-100 dark:border-white/10 rounded overflow-hidden text-[8px]">
          <div className="grid grid-cols-4 gap-1 bg-gray-50 dark:bg-white/5 px-1.5 py-1 font-bold text-gray-500 uppercase tracking-wide">
            <span>Core metric</span><span>Current</span><span>Target</span><span>Variance</span>
          </div>
          {[["Health score", "96/100", "≥ 85.0", "+Optimal"], ["Overdue", "0", "0 target", "✓ Met"], ["Blocked items", "0", "0 goal", "✓ Clean"]].map(([a, b, cc, d]) => (
            <div key={a} className="grid grid-cols-4 gap-1 px-1.5 py-1 border-t border-gray-50 dark:border-white/5">
              <span className="font-bold">{a}</span><span>{b}</span><span className="text-gray-500">{cc}</span><span className="text-emerald-600 font-semibold">{d}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 rounded p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold">AI Form Schema Preview (6 Questions)</p>
          <span className="text-[8px] font-bold text-white bg-blue-600 rounded px-1.5 py-0.5 shrink-0">1-click import</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
          {questions.map(([q, t]) => (
            <div key={q} className="border border-gray-200 dark:border-white/10 rounded p-1.5 bg-gray-50 dark:bg-white/5">
              <p className="text-[9px] font-bold leading-tight">{q}</p>
              <span className="inline-block mt-0.5 text-[8px] font-mono text-gray-500 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded px-1">{t}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0d0d0f] text-white rounded p-2.5 border border-white/10 mt-auto">
        <div className="flex items-center gap-1.5 text-[9px] font-bold">
          <span className="px-1.5 py-0.5 rounded bg-blue-600">Builder</span>
          <span className="px-1.5 py-0.5 rounded bg-white/10">Preview</span>
          <span className="px-1.5 py-0.5 rounded bg-white/10">Submissions (0)</span>
          <span className="px-1.5 py-0.5 rounded bg-white/10">Share</span>
          <span className="ml-auto px-1.5 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40">Live</span>
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="rounded bg-white/5 border border-white/10 p-1.5">
            <p className="text-[8px] font-bold">Project / Initiative Name <span className="text-rose-400">*</span></p>
            <p className="mt-0.5 text-[8px] text-gray-500 bg-black/40 border border-white/10 rounded px-1.5 py-1">e.g., Mobile App Redesign</p>
          </div>
          <div className="rounded bg-white/5 border border-white/10 p-1.5">
            <p className="text-[8px] font-bold">Requested Target Deadline</p>
            <p className="mt-0.5 text-[8px] text-gray-500 bg-black/40 border border-white/10 rounded px-1.5 py-1">dd / mm / yyyy 📅</p>
          </div>
          <span className="block h-6 w-2/5 rounded bg-emerald-600 text-[8px] font-bold flex items-center justify-center">Submit Response</span>
        </div>
      </div>
    </div>
  );
}

export function HomeDemoShowcase() {
  const [active, setActive] = useState<DemoId>("pipelines");
  const c = copy[active];
  const ActiveIcon = active === "pipelines" ? CalendarClock : active === "deliver" ? Gauge : active === "collaborate" ? MessagesSquare : active === "sell" ? KanbanSquare : active === "govern" ? Wallet : Sparkles;

  return (
    <section id="demo" className="bg-white dark:bg-[#201F1E] border-y border-gray-200 dark:border-[#3B3A39] py-14 px-4 sm:px-6 scroll-mt-14">
      <div className="max-w-7xl mx-auto">
        <p className="text-xs font-bold text-[#0078d4] uppercase tracking-wider mb-2">Live product tour · ClickUp-style clarity</p>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900 dark:text-white leading-tight">
              One workspace, every workflow — see the actual screens
            </h2>
            <p className="text-sm text-gray-600 dark:text-zinc-400 font-light mt-2 max-w-3xl">
              No stock mockups. Each panel below recreates a real TaskPMS route from this repo — pick a workflow tab and
              follow the process from strategy to revenue, exactly as your teams will use it.
            </p>
          </div>
          <Link href="/about" className="shrink-0 text-sm font-medium text-[#0078d4] hover:underline">How the process connects →</Link>
        </div>

        <div className="flex flex-wrap gap-2 mt-6" role="tablist" aria-label="Demo workflows">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={active === t.id}
              onClick={() => setActive(t.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-sm border transition-all cursor-pointer ${active === t.id ? "bg-[#0078d4] text-white border-[#0078d4] shadow-sm" : "bg-[#FAF9F8] dark:bg-[#1B1A19] text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-[#3B3A39] hover:border-[#0078d4] hover:text-[#0078d4]"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_1.35fr] gap-6 mt-6 items-stretch">
          <div className="border border-gray-200 dark:border-[#3B3A39] rounded-[8px] p-6 bg-[#FAF9F8] dark:bg-[#1B1A19] h-full flex flex-col min-h-[430px] lg:min-h-[470px]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0078d4] flex items-center gap-2"><ActiveIcon className="w-4 h-4" />{c.eyebrow}</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2 leading-snug text-balance">{c.title}</h3>
            <p className="text-sm text-gray-600 dark:text-zinc-400 font-light leading-relaxed mt-2">{c.body}</p>
            <ul className="mt-4 space-y-2.5">
              {c.bullets.map((b) => (
                <li key={b} className="flex gap-2 text-[13px] text-gray-700 dark:text-zinc-300 font-light leading-relaxed">
                  <span className="text-green-600 font-bold shrink-0">✓</span><span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-3 gap-2 mt-5">
              {c.stats.map(([v, l]) => (
                <div key={l} className="bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded p-2 text-center">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{v}</p>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400">{l}</p>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-5">
              <Link href={c.href} className="inline-flex items-center gap-2 bg-[#0078d4] text-white px-4 py-2 text-sm font-semibold rounded-sm hover:bg-[#005a9e]">
                {c.cta}<ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <BrowserChrome route={tabs.find((t) => t.id === active)?.route ?? ""}>
            {active === "pipelines" && <PipelinesMock />}
            {active === "deliver" && <DeliverMock />}
            {active === "collaborate" && <CollaborateMock />}
            {active === "sell" && <SellMock />}
            {active === "govern" && <GovernMock />}
            {active === "intelligence" && <IntelligenceMock />}
          </BrowserChrome>
        </div>

        <div className="mt-8 border border-gray-200 dark:border-[#3B3A39] rounded-[8px] bg-[#FAF9F8] dark:bg-[#1B1A19] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">The TaskPMS process — strategy to revenue in one flow</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-light">Impact: fewer tools, isolated data, governed growth</p>
          </div>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-7 gap-2.5 text-left">
            {[
              ["01 · Strategize", "/exec/dashboard", "OKRs, goals, targets"],
              ["02 · Blueprint", "/projects", "Agendas & hierarchy"],
              ["03 · Deliver", "/dev/timeline", "Pipelines + Gantt"],
              ["04 · Collaborate", "/teams", "Squads, merit, chat"],
              ["05 · Sell", "/sales/dashboard", "Leads → Qualified"],
              ["06 · Recognize", "/revenue/dashboard", "7-stage deals + budgets"],
              ["07 · Learn", "/reports", "AI intel → forms"],
            ].map(([t, href, d]) => (
              <li key={t}>
                <Link href={href} className="block bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded p-3 hover:border-[#0078d4] hover:shadow-sm transition-all h-full">
                  <p className="text-xs font-bold text-[#0078d4]">{t}</p>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-light mt-1">{d}</p>
                </Link>
              </li>
            ))}
          </ol>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4 text-center">
            {[["8+", "live dashboards replace 4–5 tools"], ["21", "models per isolated tenant DB"], ["4", "governed S3 vaults, 60s links"], ["4 ranks", "owner → employee RBAC"]].map(([v, l]) => (
              <div key={l} className="bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded px-3 py-2.5">
                <p className="text-base font-bold text-gray-900 dark:text-white">{v}</p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-light">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
