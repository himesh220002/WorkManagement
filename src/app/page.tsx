import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  BadgeDollarSign,
  BarChart3,
  Briefcase,
  Building2,
  CheckSquare,
  Clock,
  Cpu,
  Database,
  DollarSign,
  FileText,
  FolderKanban,
  GitGraph,
  LayoutDashboard,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

const pillarCards = [
  {
    badge: "PM",
    badgeClass: "bg-blue-100 text-[#0078d4] dark:bg-blue-950/60 dark:text-blue-300",
    title: "High-Velocity Task Flow Management",
    body: "Daily team pipelines, multi-assignee tasks, sprint nodes with dependencies, goal trackers, and dev / sales metrics — all scoped to one isolated company workspace.",
    link: "/dev/dashboard",
    linkLabel: "Learn about task management",
  },
  {
    badge: "MT",
    badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
    title: "Isolated Enterprise Multi-Tenancy",
    body: "Every company gets its own MongoDB database (projectManageDB_{CODE}) plus edge middleware that blocks cross-tenant URL access before a single query runs.",
    link: "/about",
    linkLabel: "Read architecture specs",
  },
  {
    badge: "S3",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    title: "Cloud Document Vault & Granular RBAC",
    body: "AWS S3 presigned uploads (300s) and 60-second view links, structured per-company prefixes, 4 governed vaults, and role-checked archive / strict-delete flows.",
    link: "/docs",
    linkLabel: "Explore document security",
  },
];

const engineCards = [
  {
    icon: Target,
    iconClass: "bg-[#EBF3FC] text-[#0078d4] dark:bg-[#1C2B3D] dark:text-[#479EF5]",
    title: "1. Executive Strategy & OKRs",
    body: "Company objectives, key results and annual revenue targets with health telemetry that rolls up from every project and flags budget overruns.",
    link: "/exec/dashboard",
    linkLabel: "Inspect Executive Dashboard",
    accent: "text-[#0078d4]",
  },
  {
    icon: Workflow,
    iconClass: "bg-[#DFF6DD] text-[#107C10] dark:bg-[#0F3818] dark:text-[#54B054]",
    title: "2. Engineering Delivery & Gantt",
    body: "Multi-track pipelines, Frappe Gantt timelines, task-node dependencies and milestone checklists that turn sprint commitments into shipped delivery.",
    link: "/dev/timeline",
    linkLabel: "Inspect Gantt Timeline",
    accent: "text-[#107C10]",
  },
  {
    icon: DollarSign,
    iconClass: "bg-[#FFF4CE] text-[#8F6B00] dark:bg-[#4A3E09] dark:text-[#FFD335]",
    title: "3. Revenue, Deals & Targets",
    body: "7-stage commercial Kanban (Prospect → Integration), pipeline valuation, win-rate analytics, target attainment and budget-envelope tracking.",
    link: "/revenue/dashboard",
    linkLabel: "Inspect Revenue Management",
    accent: "text-[#8F6B00]",
  },
  {
    icon: Users,
    iconClass: "bg-[#EBF3FC] text-[#0078d4] dark:bg-[#1C2B3D] dark:text-[#479EF5]",
    title: "4. Squads & Capability Rotation",
    body: "Developer, designer, product, sales, finance and executive categories across 5 seniority ranks (Associate → Principal) for rapid team rotation.",
    link: "/teams",
    linkLabel: "Inspect Teams Directory",
    accent: "text-[#0078d4]",
  },
  {
    icon: BarChart3,
    iconClass: "bg-[#FDE7D9] text-[#F7630C] dark:bg-[#4A2209] dark:text-[#FFB85C]",
    title: "5. Commercial Growth & Campaigns",
    body: "Inbound / outbound campaigns linked to estimated revenue, plus lead funnels tracked as New → Working → Qualified → Unqualified.",
    link: "/sales/dashboard",
    linkLabel: "Inspect Sales Pipeline",
    accent: "text-[#F7630C]",
  },
  {
    icon: GitGraph,
    iconClass: "bg-[#EBF3FC] text-[#0078d4] dark:bg-[#1C2B3D] dark:text-[#479EF5]",
    title: "6. Live Topology & Diagrams",
    body: "Mermaid graphs generated from live production records with expandable squads, members, pipelines and tasks — plus pan & zoom topology views.",
    link: "/diagrams",
    linkLabel: "Inspect Live Topology",
    accent: "text-[#0078d4]",
  },
];

const quickLinks = [
  { icon: LayoutDashboard, label: "Exec Dashboard", href: "/exec/dashboard", desc: "OKRs, goals & revenue targets" },
  { icon: CheckSquare, label: "Dev Dashboard", href: "/dev/dashboard", desc: "Tasks, pipelines & workflow" },
  { icon: Clock, label: "Gantt Timeline", href: "/dev/timeline", desc: "Schedules & dependencies" },
  { icon: Briefcase, label: "My Work", href: "/my-work", desc: "Personal tasks & logs" },
  { icon: BadgeDollarSign, label: "Sales Pipeline", href: "/sales/dashboard", desc: "Leads, deals & campaigns" },
  { icon: TrendingUp, label: "Revenue & Targets", href: "/revenue/dashboard", desc: "Deals Kanban & budgets" },
  { icon: FolderKanban, label: "Projects Blueprint", href: "/projects", desc: "Agendas & change requests" },
  { icon: FileText, label: "Document Vault", href: "/docs", desc: "S3 presigned storage" },
];

const rbacTiers = [
  { role: "Company Owner", scope: "Billing, member caps, tenant settings", access: "TENANT ISOLATED", rank: "Rank 80", bar: "border-orange-500", chip: "text-orange-600" },
  { role: "Manager", scope: "Coordination scope, provisions team leads", access: "GROUP ISOLATED", rank: "Rank 60", bar: "border-blue-500", chip: "text-blue-600" },
  { role: "Team Lead", scope: "Task creation, trackers, assignee rules", access: "PROJECT SCOPED", rank: "Rank 40", bar: "border-emerald-500", chip: "text-emerald-600" },
  { role: "Employee", scope: "Personal tasks, logs, document uploads", access: "SELF SCOPED", rank: "Rank 20", bar: "border-zinc-400", chip: "text-zinc-500" },
];

const docVaults = [  { name: "Project & Deliverables", limit: "25 MB", ext: ".pdf, .png, .zip, .docx, .xlsx, .pptx, .md", subs: "7 sub-types · roadmaps, EDDs, QA plans" },
  { name: "Employee & Onboarding", limit: "5 MB", ext: ".pdf, .png, .jpg, .doc, .docx", subs: "4 sub-types · CVs, IDs, certificates" },
  { name: "Sales & Client Pipeline", limit: "15 MB", ext: ".pdf, .docx, .pptx, .xlsx, .csv", subs: "4 sub-types · proposals, contracts" },
  { name: "Salary, Payroll & Finance", limit: "10 MB", ext: ".pdf, .xlsx, .csv, .png, .jpg", subs: "4 sub-types · slips, balance sheets" },
];

const faqs = [
  {
    q: "What is TaskPMS?",
    a: "TaskPMS (Task Project Management System) is a multi-tenant enterprise work-management platform at taskpms.com. It unifies task tracking, project blueprints, team directories, sales pipelines, revenue targets and a secure document vault in one system, with every company running in its own isolated workspace.",
  },
  {
    q: "What does PMS stand for in TaskPMS?",
    a: "PMS means Task Project Management System — and inside every company workspace it works as a Permission Management System: a company role engine (owner, manager, team lead, employee) that guards every project, member action and document behind explicit permission checks.",
  },
  {
    q: "How does multi-tenant isolation work in TaskPMS?",
    a: "Each company gets its own MongoDB database (projectManageDB_{COMPANY_CODE}) and its own AWS S3 key prefixes. Edge middleware validates the organization on every request and blocks cross-tenant URLs before any data is read, so one company's tasks, members and files are never visible to another.",
  },
  {
    q: "Which roles and permissions does TaskPMS support?",
    a: "Four company ranks: owner (billing and member caps), manager (coordination scope), team lead (project-scoped task control) and employee (self-scoped worklogs). Owners provision managers, managers provision team leads and employees, and archiving or resignation follows the same rank guardrails — so every company controls its own hierarchy end to end.",
  },
  {
    q: "How does the TaskPMS document vault store files securely?",
    a: "Files upload directly from the browser to AWS S3 using short-lived presigned URLs (5 minutes for upload, 60 seconds for viewing), filed under structured per-company prefixes. There are no public links, and archive, restore and strict-delete actions are gated by role.",
  },
  {
    q: "What are the document upload limits?",
    a: "Project & Deliverables allow up to 25 MB, Sales & Client Pipeline up to 15 MB, Salary/Payroll & Finance up to 10 MB, and Employee & Onboarding up to 5 MB — each with restricted file formats and guided sub-types such as architecture specs, contracts, payslips and ID proofs.",
  },
  {
    q: "Which dashboards are included in TaskPMS?",
    a: "An executive dashboard with OKRs and revenue targets, a dev dashboard with pipelines and task workflows, a Frappe Gantt timeline, a personal My Work view, a sales dashboard with leads and campaigns, a 7-stage revenue deals Kanban, a teams directory, resource allocation, and live Mermaid topology diagrams.",
  },
  {
    q: "What is the pricing model for TaskPMS?",
    a: "TaskPMS operates with direct, transparent subscription tiers: $20 USD / month or $200 USD / year (save 17%). You can preview the full platform for free in our guest showcase workspace (TaskFlow Organization) before subscribing.",
  },
  {
    q: "What technology is TaskPMS built on?",
    a: "Next.js 16 with the App Router, TypeScript 5, MongoDB with per-tenant databases, Tailwind CSS 4 with Fluent design tokens, AWS S3 presigned storage, Mermaid topology graphs and Frappe Gantt timelines — deployed as one fast unit.",
  },
  {
    q: "How do I invite my team and manage members?",
    a: "Owners and managers provision members from the Teams directory with login credentials and initial roles. Role changes, archiving and resignations follow rank guardrails, and every membership event is recorded so the roster, seniority matrix (Ranks 1–5) and audit trail stay in sync.",
  },
];

export default function Home() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TaskPMS",
    alternateName: "Task Project Management System",
    url: "https://taskpms.com",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "20", priceCurrency: "USD", description: "$20/month or $200/year subscription" },
    description:
      "Multi-tenant task project management system with isolated company databases, role-based permission management (RBAC), AWS S3 document vault, Gantt timelines, sales pipelines and revenue targets.",
  };
  return (
    <div className="min-h-screen bg-[#f2f2f2] dark:bg-[#111214] text-[#242424] dark:text-[#E4E4E7] antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {/* ── Global Microsoft-inspired nav ─────────────────────────── */}
      <header className="bg-white dark:bg-[#201F1E] border-b border-gray-200 dark:border-[#3B3A39] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-sm gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="TaskPMS home">
              <Image src="/logo.svg" alt="TaskPMS — Task Project Management System" width={132} height={27} className="h-[27px] w-auto" priority />
            </Link>
            <nav className="hidden lg:flex items-center gap-5 text-[#242424] dark:text-[#C8C6C4]">
              <a href="#features" className="hover:text-[#0078d4] border-b-2 border-transparent hover:border-[#0078d4] py-3">Features</a>
              <a href="#multi-tenancy" className="hover:text-[#0078d4] border-b-2 border-transparent hover:border-[#0078d4] py-3">Multi-Tenancy</a>
              <a href="#documents" className="hover:text-[#0078d4] border-b-2 border-transparent hover:border-[#0078d4] py-3">Documents</a>
              <a href="#rbac" className="hover:text-[#0078d4] border-b-2 border-transparent hover:border-[#0078d4] py-3">RBAC</a>
              <a href="#pricing" className="hover:text-[#0078d4] border-b-2 border-transparent hover:border-[#0078d4] py-3">Pricing</a>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/auth/login" className="text-[#0078d4] hover:underline font-medium hidden sm:inline">Sign in</Link>
            <Link href="/exec/dashboard" className="hidden md:inline-flex px-3 py-1.5 text-xs font-semibold border border-[#0078d4]/30 text-[#0078d4] rounded-sm hover:bg-[#EBF3FC] transition-colors">Open Dashboard</Link>
            <Link href="/auth/signup" className="bg-[#0078d4] text-white px-3 sm:px-4 py-1.5 font-medium hover:bg-[#005a9e] transition-colors rounded-sm text-xs sm:text-sm">Get Started ($20/mo)</Link>
          </div>
        </div>
      </header>

      {/* ── Hero (Microsoft Developer style) ──────────────────────── */}
      <section className="bg-gradient-to-r from-[#004578] to-[#0078d4] text-white px-4 sm:px-6 py-14 sm:py-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="md:w-1/2 space-y-5">
            <span className="inline-block bg-[#005a9e] text-[11px] font-semibold px-2.5 py-1 uppercase tracking-wider rounded-sm">
              New · Cloud Document Vault on AWS S3
            </span>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1]">
              Build, scale, and secure your enterprise workflows.
            </h1>
            <p className="text-base sm:text-lg text-blue-100 font-light max-w-xl leading-relaxed">
              A multi-tenant task-flow OS with isolated per-company databases, a
              company role engine (owner → employee), and presigned S3
              document pipelines — plus Gantt timelines, sales funnels and
              revenue targets in one continuum.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/auth/signup" className="bg-white text-[#004578] px-5 py-2.5 font-semibold hover:bg-gray-100 transition-colors shadow-sm rounded-sm inline-flex items-center gap-2">
                Subscribe & Launch Workspace <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#pricing" className="text-white border border-white/40 px-5 py-2.5 font-medium hover:bg-white/10 transition-colors rounded-sm">
                View Pricing ($20/mo or $200/yr)
              </Link>
            </div>
            <p className="text-xs text-blue-200/90">
              Direct paywall · $20/mo or $200/yr · Instant Razorpay checkout · Dedicated tenant MongoDB isolation
            </p>
          </div>
          <div className="md:w-1/2 w-full flex justify-center">
            <div className="bg-black/25 p-4 rounded-lg backdrop-blur-sm border border-white/10 w-full max-w-md shadow-2xl">
              <div className="flex space-x-1.5 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <pre className="text-xs font-mono text-blue-100 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                <span className="text-green-400">{"// Isolated multi-tenant cloud architecture"}</span>
                {"\ntenant.register({"}{"\n  id: \"company-enterprise-01\","}{"\n  db: \"projectManageDB_ORGTTV\","}{"\n  storage: \"s3://{companyId}/projects/…\","}{"\n  rbac: [\"owner\",\"manager\",\"teamlead\",\"employee\"]"}{"\n});"}
              </pre>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                {[
                  ["Isolated DBs", "per company"],
                  ["4 company roles", "owner → employee"],
                  ["60s links", "secure views"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-white/10 rounded-sm px-2 py-2">
                    <p className="text-sm font-semibold">{k}</p>
                    <p className="text-[11px] text-blue-200">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Jump into the platform ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900 dark:text-white">Jump straight into the live platform</h2>
            <p className="text-sm text-gray-600 dark:text-zinc-400 font-light mt-1">Every card below opens a real, working dashboard — not a mockup.</p>
          </div>
          <Link href="/about" className="hidden sm:inline-flex text-sm font-medium text-[#0078d4] hover:underline shrink-0">Full architecture doctrine →</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickLinks.map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.href + q.label} href={q.href} className="group bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] p-4 hover:shadow-md hover:border-[#0078d4] transition-all rounded-sm">
                <Icon className="w-5 h-5 text-[#0078d4] mb-2" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#0078d4]">{q.label}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 font-light">{q.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Triple-pillar grid ────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 scroll-mt-14">
        <h2 className="text-2xl sm:text-3xl font-light text-gray-900 dark:text-white mb-8 tracking-tight">Designed for complete company operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {pillarCards.map((p) => (
            <div key={p.title} className="bg-white dark:bg-[#201F1E] p-7 sm:p-8 border border-gray-200 dark:border-[#3B3A39] hover:shadow-md transition-shadow flex flex-col justify-between rounded-sm">
              <div>
                <div className={`w-10 h-10 flex items-center justify-center font-bold rounded-sm mb-6 text-sm ${p.badgeClass}`}>{p.badge}</div>
                <h3 className="text-xl font-normal text-gray-900 dark:text-white mb-3">{p.title}</h3>
                <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed font-light">{p.body}</p>
              </div>
              <Link href={p.link} className="text-[#0078d4] font-medium text-sm hover:underline mt-6 inline-flex items-center gap-1">{p.linkLabel} <span aria-hidden>→</span></Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Six engines ───────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#201F1E] border-y border-gray-200 dark:border-[#3B3A39] py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold text-[#0078d4] uppercase tracking-wider mb-2">The Enterprise Operating System</p>
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900 dark:text-white max-w-3xl leading-tight">Engineering delivery, commercial sales and revenue recognition — synchronized in one flow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {engineCards.map((e) => {
              const Icon = e.icon;
              return (
                <div key={e.title} className="border border-gray-200 dark:border-[#3B3A39] rounded-[8px] p-6 flex flex-col justify-between hover:border-[#0078d4] transition-all bg-white dark:bg-[#201F1E]">
                  <div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${e.iconClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">{e.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">{e.body}</p>
                  </div>
                  <Link href={e.link} className={`text-xs font-semibold hover:underline ${e.accent}`}>{e.linkLabel} →</Link>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2.5 mt-8 text-xs font-medium">
            {[
              { Icon: Zap, label: "Real-time telemetry rollup" },
              { Icon: ShieldCheck, label: "Deterministic tenant integrity" },
              { Icon: Cpu, label: "Next.js 16 + Turbopack execution" },
            ].map(({ Icon, label }) => {
              return (
                <span key={label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-gray-200 dark:border-[#3B3A39] text-gray-800 dark:text-zinc-200">
                  <Icon className="w-4 h-4 text-[#0078d4]" /> {label}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── RBAC spotlight ────────────────────────────────────────── */}
      <section id="rbac" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 scroll-mt-14">
        <div className="flex flex-col lg:flex-row items-start gap-10">
          <div className="lg:w-1/2 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900 dark:text-white">Granular RBAC, built around real team structures</h2>
            <p className="text-gray-600 dark:text-zinc-400 font-light leading-relaxed text-[15px]">
              Unlike flat single-role trackers, permissions here follow a company role hierarchy with
              tenant-isolated owners, coordination-scope managers, project-scoped team leads and
              self-scoped employees — enforced in APIs, document routes and member-management actions alike.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-zinc-300 font-light">
              {["Owner billing & member-cap control", "Owner-controlled member provisioning", "Manager coordination scope", "Team-lead pipeline & assignee control", "Employee self-scoped worklogs", "Archive / resign guardrails per rank"].map((t) => (
                <div key={t} className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span><span>{t}</span></div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/teams" className="inline-flex items-center gap-2 bg-[#0078d4] text-white px-4 py-2 text-sm font-semibold rounded-sm hover:bg-[#005a9e]">See Teams & RBAC in action <ArrowRight className="w-4 h-4" /></Link>
              <Link href="/auth/login" className="inline-flex items-center gap-2 border border-gray-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium rounded-sm hover:border-[#0078d4] hover:text-[#0078d4]">Tenant Auth portal</Link>
            </div>
          </div>
          <div className="lg:w-1/2 w-full bg-gray-50 dark:bg-[#18181B] border border-gray-200 dark:border-zinc-800 p-5 sm:p-6 rounded-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-4">Company role schema · owner → employee</h4>
            <div className="space-y-3 font-mono text-xs">
              {rbacTiers.map((r) => (
                <div key={r.role} className={`bg-white dark:bg-[#201F1E] p-3 border-l-4 ${r.bar} shadow-sm flex items-center justify-between gap-3 rounded-r-sm`}>
                  <span className="text-gray-800 dark:text-zinc-200"><strong>{r.role}:</strong> <span className="font-sans font-light">{r.scope}</span></span>
                  <span className="text-right shrink-0"><span className={`font-semibold block ${r.chip}`}>{r.access}</span><span className="text-[10px] text-gray-400">{r.rank}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Multi-tenancy deep dive ───────────────────────────────── */}
      <section id="multi-tenancy" className="bg-[#0B2A4A] text-white py-14 px-4 sm:px-6 scroll-mt-14">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <p className="text-xs font-bold text-sky-300 uppercase tracking-wider">Isolated tenant data perimeters</p>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight leading-tight">One codebase. A dedicated database per company. Zero cross-tenant leaks.</h2>
            <ol className="space-y-3 text-sm text-sky-100/90 font-light">
              <li><strong className="font-semibold text-white">1. Edge middleware</strong> reads the JWT, extracts <code className="font-mono text-sky-200">companyCode</code>, and rejects foreign <code className="font-mono text-sky-200">/:orgId</code> URLs with a redirect.</li>
              <li><strong className="font-semibold text-white">2. Tenant headers</strong> (<code className="font-mono text-sky-200">x-tenant-org-code</code>) ride the rewrite into every page and API route.</li>
              <li><strong className="font-semibold text-white">3. useDb(projectManageDB_CODE)</strong> binds all 21 models — users to documents — to that company&apos;s private database.</li>
              <li><strong className="font-semibold text-white">4. S3 prefixes</strong> (<code className="font-mono text-sky-200">{"{companyId}/projects/…"}</code>) keep object storage partitioned the same way.</li>
            </ol>
            <div className="flex flex-wrap gap-3">
              <Link href="/diagrams" className="bg-white text-[#0B2A4A] px-4 py-2 text-sm font-semibold rounded-sm hover:bg-sky-100">View live topology</Link>
              <Link href="/about" className="border border-white/40 px-4 py-2 text-sm font-medium rounded-sm hover:bg-white/10">Architecture doctrine</Link>
            </div>
          </div>
          <div className="bg-black/30 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex space-x-1.5 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <pre className="text-xs font-mono text-sky-100 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              <span className="text-green-400">{"// tenantDb.ts — isolated database per company"}</span>
              {"\ngetTenantDbName(\"ORGTTV\")  // → projectManageDB_ORGTTV"}
              {"\n\n// s3.ts — structured, partitioned object keys"}
              {"\n\"{companyId}/projects/{projectId}/{ts}_{file}\""}
              {"\n\"{companyId}/employees/{userId}/{ts}_{file}\""}
              {"\n\"{companyId}/sales/{dealId}/{ts}_{file}\""}
              {"\n\"{companyId}/finance/{year}/{ts}_{file}\""}
            </pre>
          </div>
        </div>
      </section>

      {/* ── Document vault ────────────────────────────────────────── */}
      <section id="documents" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 scroll-mt-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7">
          <div>
            <p className="text-xs font-bold text-[#0078d4] uppercase tracking-wider mb-1">AWS S3 Enterprise Vault</p>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900 dark:text-white">Four governed vaults, one secure pipeline</h2>
            <p className="text-sm text-gray-600 dark:text-zinc-400 font-light mt-1 max-w-2xl">Direct browser-to-S3 presigned transfers — 300s uploads, 60s view links, per-category size and format guards, archive drawers and manager-gated strict deletes.</p>
          </div>
          <Link href="/docs" className="shrink-0 inline-flex items-center gap-2 bg-[#0078d4] text-white px-4 py-2 text-sm font-semibold rounded-sm hover:bg-[#005a9e]">Open Document Vault <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {docVaults.map((d) => (
            <div key={d.name} className="bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] p-5 rounded-sm hover:shadow-md hover:border-[#0078d4] transition-all">
              <FileText className="w-5 h-5 text-[#0078d4] mb-3" />
              <p className="text-sm font-bold text-gray-900 dark:text-white">{d.name}</p>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">Max {d.limit}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-light mt-2 leading-relaxed">{d.ext}</p>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">{d.subs}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Talent + stack strip ──────────────────────────────────── */}
      <section className="bg-white dark:bg-[#201F1E] border-y border-gray-200 dark:border-[#3B3A39] py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Award className="w-5 h-5 text-[#0078d4]" /> Seniority matrix · Ranks 1–5</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-light mt-1 mb-4">Associate → Mid → Senior → Staff / Team Lead → Principal, shared across engineering, product, sales and management.</p>
            <div className="space-y-2 text-xs">
              {[["Rank 1 · Associate", "Executes guided tasks · 0–2 yrs"], ["Rank 2 · Mid-Level", "Owns features independently · 2–5 yrs"], ["Rank 3 · Senior / Lead", "Designs systems, mentors · 5–8 yrs"], ["Rank 4 · Staff / Squad Lead", "Sets direction across squads · 8–12 yrs"], ["Rank 5 · Principal / Director", "Shapes company strategy · 12+ yrs"]].map(([t, s]) => (
                <div key={t} className="flex items-center justify-between gap-3 border border-gray-100 dark:border-zinc-800 rounded-sm px-3 py-2 bg-[#FAF9F8] dark:bg-[#1B1A19]">
                  <span className="font-semibold text-gray-800 dark:text-zinc-200">{t}</span>
                  <span className="text-gray-500 dark:text-zinc-400 font-light text-right">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Database className="w-5 h-5 text-[#0078d4]" /> Production-grade stack</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-light mt-1 mb-4">Sub-second responses, strict TypeScript, and visual planning primitives — deployed as one Next.js 16 unit.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center text-xs">
              {[["Next.js 16", "App Router & SSR"], ["TypeScript 5", "Strict type safety"], ["MongoDB Cloud", "Per-tenant databases"], ["AWS S3", "Presigned vault"], ["Tailwind 4", "Fluent 2 tokens"], ["Mermaid + Gantt", "Topology & plans"]].map(([t, s]) => (
                <div key={t} className="p-3 rounded-[6px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-gray-200 dark:border-[#3B3A39]">
                  <span className="font-bold text-gray-900 dark:text-white block">{t}</span>
                  <span className="text-[10px] text-gray-500 dark:text-zinc-400">{s}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2.5 mt-5">
              <Link href="/dev/dashboard" className="text-xs font-semibold text-[#0078d4] hover:underline">Dev Dashboard →</Link>
              <Link href="/revenue/targets" className="text-xs font-semibold text-[#0078d4] hover:underline">Revenue Targets →</Link>
              <Link href="/exec/resources" className="text-xs font-semibold text-[#0078d4] hover:underline">Resource Allocation →</Link>
              <Link href="/my-work" className="text-xs font-semibold text-[#0078d4] hover:underline">My Work →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── About the tool (SEO) ─────────────────────────────────── */}
      <section className="bg-white dark:bg-[#201F1E] border-y border-gray-200 dark:border-[#3B3A39] py-14 px-4 sm:px-6">
        <article className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-[#0078d4] uppercase tracking-wider mb-2">About TaskPMS</p>
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900 dark:text-white mb-6">The task project management system with permission management built in</h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-gray-600 dark:text-zinc-300 font-light">
            <p>
              TaskPMS is a task project management system designed for companies that have outgrown single-workspace
              to-do apps. Most project management software treats every customer as rows in one shared database and
              bolts permissions on afterwards. TaskPMS inverts that model: each company receives its own isolated
              MongoDB database and its own AWS S3 storage prefixes, so tasks, members, deals and documents are
              partitioned by architecture — not by convention. Edge middleware validates your organization on every
              request and redirects foreign workspace URLs before a single query runs, which is why regulated teams
              trust it with delivery plans, payroll files and client contracts alike. From startups running their
              first sprint to enterprises coordinating engineering, sales and finance in parallel, the platform
              scales by adding isolated workspaces — never by mixing customer data.
            </p>
            <p>
              The second half of the name matters just as much. PMS also stands for permission management system: a
              company role engine spanning owner, manager, team lead and employee. Owners control billing and member
              caps, managers provision team leads and employees, team leads own task creation and assignee rules
              inside their assigned projects, and employees work from a self-scoped My Work view with logs and
              document uploads. Archiving, role changes and resignations all follow the same rank guardrails, so
              offboarding is a governed workflow instead of a Slack message and a prayer.
            </p>
            <p>
              Day to day, teams live in six connected engines. Executives track objectives, key results and annual
              revenue targets with health telemetry that rolls up from every project. Engineers plan multi-track
              delivery pipelines on an interactive Gantt timeline with task dependencies and milestone checklists.
              Commercial teams run leads and campaigns through a sales dashboard into a seven-stage revenue deals
              Kanban — Prospect through Integration — with pipeline valuation, win-rate analytics and budget-envelope
              tracking. Squads rotate across a standardized seniority matrix from Rank 1 Associate to Rank 5
              Principal, and live Mermaid topology diagrams render the whole organization from production data.
            </p>
            <p>
              The document vault completes the picture. Instead of files scattered across drives and chat threads,
              companies upload directly to S3 through short-lived presigned URLs into four governed vaults: Project
              &amp; Deliverables (25 MB), Sales &amp; Client Pipeline (15 MB), Salary, Payroll &amp; Finance (10 MB)
              and Employee &amp; Onboarding (5 MB). Format restrictions, guided sub-types, archive drawers and
              manager-gated strict deletes keep audits painless.
            </p>
            <p>
              Security and compliance reviewers get the same clarity as end users. Passwords are stored as salted
              hashes, sessions are signed tokens, and every upload is validated against per-vault size and format
              limits before it ever reaches S3. Document previews never use public links: the platform mints a
              60-second presigned view URL on demand, and only after the role check passes. Because tenant isolation
              is structural, the blast radius of any incident is a single company by design — a property that shared
              single-database task trackers cannot offer no matter how many permission flags they add later.
            </p>
            <p>
              Getting started takes minutes rather than a migration project. Create a company workspace, invite
              owners and managers, and provision team leads and employees from the Teams directory with logins and
              starter roles. Import or create your first projects, lay pipelines onto the Gantt timeline, connect
              sales campaigns to the deals Kanban, and upload existing specs and contracts into the matching vaults.
              Remote, hybrid and in-office teams share one operational picture: developers see sprint scope, sales
              sees pipeline value, finance sees payroll documents, and leadership sees rolled-up health everywhere.
              If you are comparing task management systems, start with the free month: invite your managers, import
              a real project, upload a real deliverable, and watch isolated multi-tenant project management,
              granular permission management and secure document management work as one system at taskpms.com.
            </p>
          </div>
        </article>
      </section>

      {/* ── FAQ (SEO + JSON-LD) ───────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        <p className="text-xs font-bold text-[#0078d4] uppercase tracking-wider mb-2">FAQ</p>
        <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900 dark:text-white mb-3">Frequently asked questions</h2>
        <p className="text-sm text-gray-600 dark:text-zinc-400 font-light mb-7">Everything buyers and evaluators ask before starting the free month.</p>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded-sm open:border-[#0078d4] transition-colors">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-5 py-4 text-[15px] font-semibold text-gray-900 dark:text-white">
                {f.q}
                <span className="text-[#0078d4] font-light text-xl leading-none group-open:rotate-45 transition-transform" aria-hidden>+</span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-gray-600 dark:text-zinc-300 font-light">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Pricing / paywall CTA ───────────────────────────────────── */}
      <section id="pricing" className="max-w-4xl mx-auto text-center py-16 sm:py-20 px-4 sm:px-6 scroll-mt-14">
        <Building2 className="w-8 h-8 text-[#0078d4] mx-auto mb-4" />
        <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900 dark:text-white mb-3">Enterprise Direct Subscription Pricing</h2>
        <p className="text-gray-600 dark:text-zinc-400 font-light max-w-2xl mx-auto mb-7 text-[15px]">
          Dedicated tenant database perimeter, AWS S3 document vault, Frappe Gantt timelines and 5 RBAC roles. Direct subscription via Razorpay — no free trial required.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 text-left text-xs mb-8 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-[#201F1E] border-2 border-[#0078d4] rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-sm text-gray-900 dark:text-white">Monthly Plan</span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-semibold px-2 py-0.5 rounded">Flexible</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">$20 <span className="text-xs font-normal text-gray-500">USD / mo</span></p>
            <p className="text-gray-500 dark:text-zinc-400 mb-3 font-light">All dashboards, unlimited parallel pipelines, presigned S3 vault, and 5 roles.</p>
            <Link href="/auth/signup?plan=monthly" className="w-full text-center block bg-[#0078d4] hover:bg-[#005a9e] text-white py-2 rounded text-xs font-bold transition-colors">
              Subscribe Monthly ($20/mo)
            </Link>
          </div>

          <div className="bg-white dark:bg-[#201F1E] border-2 border-emerald-600 rounded-lg p-5 shadow-sm relative">
            <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#107C10] text-white">
              Save 17% ($40/yr)
            </span>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-sm text-gray-900 dark:text-white">Annual Plan</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded">Best Value</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">$200 <span className="text-xs font-normal text-gray-500">USD / yr</span></p>
            <p className="text-gray-500 dark:text-zinc-400 mb-3 font-light">Includes all monthly features plus priority enterprise onboarding & assistance.</p>
            <Link href="/auth/signup?plan=annual" className="w-full text-center block bg-[#107C10] hover:bg-[#0E6B0E] text-white py-2 rounded text-xs font-bold transition-colors">
              Subscribe Annual ($200/yr)
            </Link>
          </div>
        </div>
        <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/exec/dashboard" className="text-[#0078d4] font-medium hover:underline text-sm">Preview Free Guest Showcase (TaskFlow Organization) →</Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-white dark:bg-[#201F1E] border-t border-gray-200 dark:border-[#3B3A39]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2 md:col-span-1">
            <Image src="/logo.svg" alt="TaskPMS — Task Project Management System" width={132} height={27} className="h-[27px] w-auto mb-3" />
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-light leading-relaxed">Multi-tenant enterprise OS for task flows, squads, sales pipelines and revenue — with isolated data perimeters and S3-grade document security.</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-3">Product</p>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/exec/dashboard" className="hover:text-[#0078d4]">Exec Dashboard</Link></li>
              <li><Link href="/dev/timeline" className="hover:text-[#0078d4]">Gantt Timeline</Link></li>
              <li><Link href="/sales/dashboard" className="hover:text-[#0078d4]">Sales Pipeline</Link></li>
              <li><Link href="/revenue/dashboard" className="hover:text-[#0078d4]">Revenue & Targets</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-3">Platform</p>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/projects" className="hover:text-[#0078d4]">Projects Blueprint</Link></li>
              <li><Link href="/teams" className="hover:text-[#0078d4]">Teams & RBAC</Link></li>
              <li><Link href="/docs" className="hover:text-[#0078d4]">Document Vault</Link></li>
              <li><Link href="/diagrams" className="hover:text-[#0078d4]">Live Topology</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-3">Resources</p>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/about" className="hover:text-[#0078d4]">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-[#0078d4]">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-[#0078d4]">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#0078d4]">Terms &amp; Conditions</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-[#3B3A39] py-4 text-center text-xs text-gray-500 dark:text-zinc-500">
          © 2026 TaskPMS · Task Project Management System · Direct Enterprise Subscriptions ($20/mo or $200/yr)
        </div>
      </footer>
    </div>
  );
}
