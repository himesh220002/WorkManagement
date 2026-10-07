import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import {
  FolderKanban,
  Workflow,
  DollarSign,
  Users,
  Target,
  GitGraph,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Award,
  BarChart3,
  Building2,
  Database,
  Cpu,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "About TaskPMS: the enterprise operating system synchronizing engineering delivery, sales pipelines and revenue — multi-tenant architecture, 5-tier RBAC and S3 document vault.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="flex flex-col min-w-0 p-0 sm:p-4 flex-1 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <header className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 sm:p-6 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg lg:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
              About WorkManagement Platform
            </h1>
            <Badge tone="brand" size="sm">
              Enterprise Architecture v2.0
            </Badge>
            <Badge tone="success" size="sm">
              Microsoft Fluent 2 Standards
            </Badge>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
            System architectural doctrine, cross-pipeline operating model, and complete enterprise capability matrix.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/exec/dashboard"
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[4px] shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Executive Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/diagrams"
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] hover:bg-[#F3F2F1] text-[#242424] dark:text-[#FFFFFF] rounded-[4px] shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Workflow className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>Live Diagrams</span>
          </Link>
        </div>
      </header>

      {/* Hero Overview Banner */}
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-8 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.14)] relative overflow-hidden">
        <div className="max-w-4xl relative z-10">
          <span className="text-xs font-bold text-[#0078D4] dark:text-[#479EF5] uppercase tracking-wider block mb-2">
            The Enterprise Operating System
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#242424] dark:text-[#FFFFFF] mb-4 leading-tight">
            Synchronizing Engineering Delivery, Commercial Sales, and Revenue Realization in a Single Continuum
          </h2>
          <p className="text-sm text-[#605E5C] dark:text-[#C8C6C4] leading-relaxed mb-6">
            <strong>WorkManagement</strong> is a modern, unified enterprise orchestration system designed to eliminate
            organizational silos. It treats software deliverables, marketing campaigns, customer acquisition funnels,
            and balance sheet revenue recognition as an indivisible, synchronized flow of value.
          </p>
          <div className="flex flex-wrap gap-4 text-xs font-medium text-[#242424] dark:text-[#FFFFFF]">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
              <Zap className="w-4 h-4 text-[#0078D4]" />
              <span>Real-time Telemetry Rollup</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
              <ShieldCheck className="w-4 h-4 text-[#107C10]" />
              <span>Deterministic Database Integrity</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
              <Cpu className="w-4 h-4 text-[#8F6B00]" />
              <span>Next.js 16 + Turbopack Execution</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Core Pillars Architecture Grid */}
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-[#242424] dark:text-[#FFFFFF]">
            Architectural Pillars of the Platform
          </h3>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
            Five interconnected functional engines powering end-to-end enterprise operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Pillar 1 */}
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 shadow-sm flex flex-col justify-between hover:border-[#0078D4] transition-all">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] flex items-center justify-center mb-4">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF] mb-2">
                1. Executive Strategy &amp; OKRs
              </h4>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] leading-relaxed mb-4">
                Establishes overarching corporate objectives, quantitative key results, and annual revenue targets.
                Rolls up health telemetry across projects and automatically alerts leadership of budget overruns.
              </p>
            </div>
            <div className="pt-3 border-t border-[#F3F2F1] dark:border-[#292827]">
              <Link
                href="/exec/dashboard"
                className="text-xs font-semibold text-[#0078D4] hover:underline inline-flex items-center gap-1"
              >
                Inspect Portfolio Executive Dashboard &rarr;
              </Link>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 shadow-sm flex flex-col justify-between hover:border-[#0078D4] transition-all">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#DFF6DD] dark:bg-[#0F3818] text-[#107C10] dark:text-[#54B054] flex items-center justify-center mb-4">
                <Workflow className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF] mb-2">
                2. Engineering Delivery &amp; Gantt Timeline
              </h4>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] leading-relaxed mb-4">
                Deploys multi-track delivery pipelines with interactive Frappe Gantt timeline controls, task node dependencies,
                and milestone checklists. Ensures sprint commitments translate directly to customer delivery.
              </p>
            </div>
            <div className="pt-3 border-t border-[#F3F2F1] dark:border-[#292827]">
              <Link
                href="/dev/timeline"
                className="text-xs font-semibold text-[#107C10] hover:underline inline-flex items-center gap-1"
              >
                Inspect Gantt Timeline &amp; Pipelines &rarr;
              </Link>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 shadow-sm flex flex-col justify-between hover:border-[#0078D4] transition-all">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#FFF4CE] dark:bg-[#4A3E09] text-[#8F6B00] dark:text-[#FFD335] flex items-center justify-center mb-4">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF] mb-2">
                3. Revenue Management &amp; Deals Pipeline
              </h4>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] leading-relaxed mb-4">
                Operates a 7-stage commercial Kanban board (`Prospect` through `Integration`), tracking total pipeline valuation,
                win conversion rates, target attainment progress, and budget envelope utilization.
              </p>
            </div>
            <div className="pt-3 border-t border-[#F3F2F1] dark:border-[#292827]">
              <Link
                href="/revenue/dashboard"
                className="text-xs font-semibold text-[#8F6B00] hover:underline inline-flex items-center gap-1"
              >
                Inspect Revenue Management &rarr;
              </Link>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 shadow-sm flex flex-col justify-between hover:border-[#0078D4] transition-all">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF] mb-2">
                4. Squads &amp; Dynamic Capability Rotation
              </h4>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] leading-relaxed mb-4">
                Organizes global personnel across functional categories (Developer SDE, Designer, Product, Sales, Finance, Executive)
                with 5 standardized seniority tiers (Rank 1 Associate through Rank 5 Principal), supporting rapid team rotation.
              </p>
            </div>
            <div className="pt-3 border-t border-[#F3F2F1] dark:border-[#292827]">
              <Link
                href="/teams"
                className="text-xs font-semibold text-[#0078D4] hover:underline inline-flex items-center gap-1"
              >
                Inspect Teams &amp; Personnel Directory &rarr;
              </Link>
            </div>
          </div>

          {/* Pillar 5 */}
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 shadow-sm flex flex-col justify-between hover:border-[#0078D4] transition-all">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#FDE7D9] dark:bg-[#4A2209] text-[#F7630C] flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF] mb-2">
                5. Commercial Growth &amp; Campaigns
              </h4>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] leading-relaxed mb-4">
                Drives inbound and outbound lead generation, linking marketing campaigns to estimated revenue
                and tracking sales stage progression (`New`, `Working`, `Qualified`, `Unqualified`).
              </p>
            </div>
            <div className="pt-3 border-t border-[#F3F2F1] dark:border-[#292827]">
              <Link
                href="/sales/dashboard"
                className="text-xs font-semibold text-[#F7630C] hover:underline inline-flex items-center gap-1"
              >
                Inspect Sales Pipeline &rarr;
              </Link>
            </div>
          </div>

          {/* Pillar 6 */}
          <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 shadow-sm flex flex-col justify-between hover:border-[#0078D4] transition-all">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] flex items-center justify-center mb-4">
                <GitGraph className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF] mb-2">
                6. Live Entity Architecture Topology
              </h4>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] leading-relaxed mb-4">
                Auto-generates interactive Mermaid graph visualizers directly from production database records, with
                dynamic expansion controls for squads, team members, pipelines, and granular tasks.
              </p>
            </div>
            <div className="pt-3 border-t border-[#F3F2F1] dark:border-[#292827]">
              <Link
                href="/diagrams"
                className="text-xs font-semibold text-[#0078D4] hover:underline inline-flex items-center gap-1"
              >
                Inspect Live System Topology &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Seniority Rank Hierarchy Reference Matrix */}
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 mb-8 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-[#242424] dark:text-[#FFFFFF] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0078D4]" />
            <span>Enterprise Talent Capability &amp; Seniority Matrix (Ranks 1–5)</span>
          </h3>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
            Standardized seniority grading ensuring clear capability levels across engineering, product, sales, and management.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#1B1A19] text-[#605E5C] dark:text-[#C8C6C4]">
                <th className="py-2.5 px-4 font-semibold">Tier Rank</th>
                <th className="py-2.5 px-4 font-semibold">Designation Title</th>
                <th className="py-2.5 px-4 font-semibold">Scope of Responsibility</th>
                <th className="py-2.5 px-4 font-semibold">Typical Experience Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F2F1] dark:divide-[#292827] text-[#242424] dark:text-[#FFFFFF]">
              <tr>
                <td className="py-3 px-4 font-bold text-[#0078D4]">Rank 1</td>
                <td className="py-3 px-4 font-semibold">Associate / Junior Specialist</td>
                <td className="py-3 px-4 text-[#605E5C] dark:text-[#C8C6C4]">
                  Executes well-defined tasks under guidance; focuses on component development and routine QA.
                </td>
                <td className="py-3 px-4">0 – 2 Years / Entry Professional</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-[#00B7C3]">Rank 2</td>
                <td className="py-3 px-4 font-semibold">Mid-Level Professional</td>
                <td className="py-3 px-4 text-[#605E5C] dark:text-[#C8C6C4]">
                  Owns features independently; collaborates across squads; handles API integration and deal prospecting.
                </td>
                <td className="py-3 px-4">2 – 5 Years / Autonomous Contributor</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-[#107C10]">Rank 3</td>
                <td className="py-3 px-4 font-semibold">Senior Specialist / Lead Contributor</td>
                <td className="py-3 px-4 text-[#605E5C] dark:text-[#C8C6C4]">
                  Designs system architectures, negotiates complex commercial contracts, mentors lower-tier specialists.
                </td>
                <td className="py-3 px-4">5 – 8 Years / Subject Matter Authority</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-[#F7630C]">Rank 4</td>
                <td className="py-3 px-4 font-semibold">Staff Specialist / Squad Team Lead</td>
                <td className="py-3 px-4 text-[#605E5C] dark:text-[#C8C6C4]">
                  Sets technological and process direction across multiple squads; manages resource allocations and risk.
                </td>
                <td className="py-3 px-4">8 – 12 Years / Cross-functional Leader</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-[#5C2D91]">Rank 5</td>
                <td className="py-3 px-4 font-semibold">Principal / Executive Director</td>
                <td className="py-3 px-4 text-[#605E5C] dark:text-[#C8C6C4]">
                  Shapes company-wide strategy, multi-million dollar capital budgets, and enterprise governance doctrine.
                </td>
                <td className="py-3 px-4">12+ Years / Corporate Executive</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tech Stack & Infrastructure */}
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#242424] dark:text-[#FFFFFF] mb-2 flex items-center gap-2">
          <Database className="w-5 h-5 text-[#0078D4]" />
          <span>Technical Stack &amp; Infrastructure Specifications</span>
        </h3>
        <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-4">
          Built natively on a modern enterprise stack engineered for sub-second responses and high scalability.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center text-xs">
          <div className="p-3 rounded-[6px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
            <span className="font-bold text-[#242424] dark:text-[#FFFFFF] block">Next.js 16</span>
            <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4]">App Router &amp; SSR</span>
          </div>
          <div className="p-3 rounded-[6px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
            <span className="font-bold text-[#242424] dark:text-[#FFFFFF] block">TypeScript 5</span>
            <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4]">Strict Type Safety</span>
          </div>
          <div className="p-3 rounded-[6px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
            <span className="font-bold text-[#242424] dark:text-[#FFFFFF] block">MongoDB Cloud</span>
            <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4]">Mongoose ODM</span>
          </div>
          <div className="p-3 rounded-[6px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
            <span className="font-bold text-[#242424] dark:text-[#FFFFFF] block">Tailwind CSS 4</span>
            <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4]">Fluent 2 Tokens</span>
          </div>
          <div className="p-3 rounded-[6px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
            <span className="font-bold text-[#242424] dark:text-[#FFFFFF] block">Mermaid + SVG</span>
            <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4]">Pan &amp; Zoom Topology</span>
          </div>
          <div className="p-3 rounded-[6px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39]">
            <span className="font-bold text-[#242424] dark:text-[#FFFFFF] block">Frappe Gantt</span>
            <span className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4]">Schedule Timeline</span>
          </div>
        </div>
      </div>
    </main>
  );
}
