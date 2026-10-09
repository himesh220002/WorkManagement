"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeDollarSign,
  Briefcase,
  CheckSquare,
  Clock,
  Compass,
  FileText,
  FolderKanban,
  HelpCircle,
  Home,
  LayoutDashboard,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useShell } from "@/components/shell/AppShell";

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

export default function RootErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { setStandalone } = useShell();

  useEffect(() => {
    setStandalone(true);
    return () => setStandalone(false);
  }, [setStandalone]);

  useEffect(() => {
    console.error("Runtime error caught by root boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f2f2f2] dark:bg-[#111214] text-[#242424] dark:text-[#E4E4E7] antialiased flex flex-col">
      {/* ── Microsoft-inspired Header ─────────────────────────── */}
      <header className="bg-white dark:bg-[#201F1E] border-b border-gray-200 dark:border-[#3B3A39] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-sm gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="TaskPMS home">
              <Image
                src="/logo.svg"
                alt="TaskPMS — Task Project Management System"
                width={132}
                height={27}
                className="h-[27px] w-auto"
                priority
              />
            </Link>
            <nav className="hidden lg:flex items-center gap-5 text-[#242424] dark:text-[#C8C6C4]">
              <Link href="/#features" className="hover:text-[#0078d4] border-b-2 border-transparent hover:border-[#0078d4] py-3">Features</Link>
              <Link href="/#multi-tenancy" className="hover:text-[#0078d4] border-b-2 border-transparent hover:border-[#0078d4] py-3">Multi-Tenancy</Link>
              <Link href="/#documents" className="hover:text-[#0078d4] border-b-2 border-transparent hover:border-[#0078d4] py-3">Documents</Link>
              <Link href="/#rbac" className="hover:text-[#0078d4] border-b-2 border-transparent hover:border-[#0078d4] py-3">RBAC</Link>
              <Link href="/#pricing" className="hover:text-[#0078d4] border-b-2 border-transparent hover:border-[#0078d4] py-3">Pricing</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/auth/login" className="text-[#0078d4] hover:underline font-medium hidden sm:inline">Sign in</Link>
            <Link href="/exec/dashboard" className="hidden md:inline-flex px-3 py-1.5 text-xs font-semibold border border-[#0078d4]/30 text-[#0078d4] rounded-sm hover:bg-[#EBF3FC] transition-colors">Open Dashboard</Link>
            <Link href="/auth/signup" className="bg-[#0078d4] text-white px-3 sm:px-4 py-1.5 font-medium hover:bg-[#005a9e] transition-colors rounded-sm text-xs sm:text-sm">Subscribe ($3/user/mo)</Link>
          </div>
        </div>
      </header>

      {/* ── Hero (Microsoft Azure Developer Style) ──────────────────────── */}
      <section className="bg-gradient-to-r from-[#004578] to-[#0078d4] text-white px-4 sm:px-6 py-14 sm:py-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="md:w-1/2 space-y-5">
            <span className="inline-block bg-[#005a9e] text-[11px] font-semibold px-2.5 py-1 uppercase tracking-wider rounded-sm">
              Error 500 · Server Processing Fault
            </span>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1]">
              An unexpected execution fault occurred.
            </h1>
            <p className="text-base sm:text-lg text-blue-100 font-light max-w-xl leading-relaxed">
              A runtime fault was intercepted while rendering this view. Your underlying tenant database and AWS S3 document vault remain completely secure and isolated.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => reset()}
                className="bg-white text-[#004578] px-5 py-2.5 font-semibold hover:bg-gray-100 transition-colors shadow-sm rounded-sm inline-flex items-center gap-2 text-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
              <Link
                href="/exec/dashboard"
                className="text-white border border-white/40 px-5 py-2.5 font-medium hover:bg-white/10 transition-colors rounded-sm inline-flex items-center gap-2 text-sm"
              >
                <Compass className="w-4 h-4" /> Open Executive Dashboard
              </Link>
              <Link
                href="/"
                className="text-blue-100 hover:text-white border border-transparent hover:border-white/20 px-4 py-2.5 font-medium transition-colors rounded-sm inline-flex items-center gap-1.5 text-sm"
              >
                <Home className="w-4 h-4" /> Return to Homepage
              </Link>
            </div>
            <p className="text-xs text-blue-200/90 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Tenant database perimeter intact · Isolated company partitions verified
            </p>
          </div>

          {/* Right Hero Diagnostics Telemetry Card */}
          <div className="md:w-1/2 w-full flex justify-center">
            <div className="bg-black/35 p-5 rounded-lg backdrop-blur-md border border-white/15 w-full max-w-md shadow-2xl font-mono text-xs">
              <div className="flex space-x-1.5 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-zinc-400 text-[11px] ml-2">runtime_fault_telemetry.log</span>
              </div>
              <div className="space-y-2 text-blue-100">
                <p className="text-amber-400 font-semibold">$ inspect_runtime_exception</p>
                <p className="text-zinc-300">
                  <span className="text-zinc-400">HTTP_FAULT:</span> <span className="text-rose-400 font-bold">500 INTERNAL_SERVER_ERROR</span>
                </p>
                {error.digest && (
                  <p className="text-zinc-300">
                    <span className="text-zinc-400">DIGEST:</span> <span className="text-amber-200 font-mono text-[11px]">{error.digest}</span>
                  </p>
                )}
                <p className="text-zinc-300">
                  <span className="text-zinc-400">DATABASE:</span> <span className="text-emerald-300">Tenant-isolated MongoDB OK</span>
                </p>
                <p className="text-zinc-300">
                  <span className="text-zinc-400">S3_VAULT:</span> <span className="text-emerald-300">Encrypted Pipelines OK</span>
                </p>
                <div className="pt-2 border-t border-white/10 text-zinc-400 text-[11px]">
                  💡 Clicking &apos;Try Again&apos; attempts to re-render this route without needing a full browser restart.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Navigation Matrix (from Home Page) ──────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-light text-gray-900 dark:text-white tracking-tight">
              Explore Active Workspaces & System Modules
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 font-light mt-1">
              Select one of the standard destinations below to continue your work without interruption.
            </p>
          </div>
          <Link
            href="/contact"
            className="text-xs text-[#0078d4] hover:underline flex items-center gap-1 font-medium shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Need help? Contact Support
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] p-4 rounded-sm hover:border-[#0078d4] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-sm bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078d4] dark:text-[#479EF5] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-[#0078d4] transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 font-light mt-1">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-gray-100 dark:border-[#2D2C2B] flex items-center text-xs text-[#0078d4] font-medium group-hover:translate-x-0.5 transition-transform">
                  <span>Open Module</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-white dark:bg-[#201F1E] border-t border-gray-200 dark:border-[#3B3A39] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/logo.svg"
              alt="TaskPMS — Task Project Management System"
              width={132}
              height={27}
              className="h-[27px] w-auto mb-3"
            />
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-light leading-relaxed">
              Multi-tenant enterprise OS for task flows, squads, sales pipelines and revenue — with isolated data perimeters and S3-grade document security.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-3">Product</p>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/exec/dashboard" className="hover:text-[#0078d4]">Exec Dashboard</Link></li>
              <li><Link href="/dev/timeline" className="hover:text-[#0078d4]">Gantt Timeline</Link></li>
              <li><Link href="/sales/dashboard" className="hover:text-[#0078d4]">Sales Pipeline</Link></li>
              <li><Link href="/revenue/dashboard" className="hover:text-[#0078d4]">Revenue &amp; Targets</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-3">Platform</p>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/projects" className="hover:text-[#0078d4]">Projects Blueprint</Link></li>
              <li><Link href="/teams" className="hover:text-[#0078d4]">Teams &amp; RBAC</Link></li>
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
          © 2026 TaskPMS · Task Project Management System · Tiered team subscriptions ($5/2 seats · $8/4 seats · +$3/seat/mo)
        </div>
      </footer>
    </div>
  );
}
