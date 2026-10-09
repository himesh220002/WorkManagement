import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/marketing/ThemeToggle";

/**
 * Shared chrome for public legal / contact pages.
 * Mirrors the homepage nav so crawlers and AdSense reviewers
 * see one consistent TaskPMS marketing surface.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f2f2f2] dark:bg-[#111214] text-[#242424] dark:text-[#E4E4E7] antialiased flex flex-col">
      <header className="bg-white dark:bg-[#201F1E] border-b border-gray-200 dark:border-[#3B3A39] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-sm gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="TaskPMS home">
              <Image src="/logo.png" alt="TaskPMS — Task Project Management System" width={132} height={27} className="h-[27px] w-auto dark:hidden" priority />
              <Image src="/logo-dark.png" alt="TaskPMS — Task Project Management System" width={132} height={27} className="h-[27px] w-auto hidden dark:block" priority />
            </Link>
            <nav className="hidden md:flex items-center gap-5 text-[#242424] dark:text-[#C8C6C4]">
              <Link href="/about" className="hover:text-[#0078d4]">About Us</Link>
              <Link href="/#features" className="hover:text-[#0078d4]">Features</Link>
              <Link href="/#pricing" className="hover:text-[#0078d4]">Pricing</Link>
              <Link href="/contact" className="hover:text-[#0078d4]">Contact</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/auth/login" className="text-[#0078d4] hover:underline font-medium hidden sm:inline">Sign in</Link>
            <Link href="/auth/signup" className="bg-[#0078d4] text-white px-3 sm:px-4 py-1.5 font-medium hover:bg-[#005a9e] transition-colors rounded-sm text-xs sm:text-sm">Subscribe ($3/user/mo)</Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {children}
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
            <footer className="bg-white dark:bg-[#201F1E] border-t border-gray-200 dark:border-[#3B3A39] mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
                <div className="col-span-2 md:col-span-1">
                  <Image
                    src="/logo.png"
                    alt="TaskPMS — Task Project Management System"
                    width={132}
                    height={27}
                    className="h-[27px] w-auto mb-3 dark:hidden"
                  />
                  <Image
                    src="/logo-dark.png"
                    alt="TaskPMS — Task Project Management System"
                    width={132}
                    height={27}
                    className="h-[27px] w-auto mb-3 hidden dark:block"
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
