import Link from "next/link";
import Image from "next/image";

/**
 * Shared chrome for public legal / contact pages.
 * Mirrors the homepage nav so crawlers and AdSense reviewers
 * see one consistent TaskPMS marketing surface.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f2f2f2] dark:bg-[#111214] text-[#242424] dark:text-[#E4E4E7] antialiased flex flex-col">
      <header className="bg-white dark:bg-[#201F1E] border-b border-gray-200 dark:border-[#3B3A39] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-sm gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="TaskPMS home">
              <Image src="/logo.svg" alt="TaskPMS — Task Project Management System" width={132} height={27} />
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
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {children}
      </main>

      <footer className="bg-white dark:bg-[#201F1E] border-t border-gray-200 dark:border-[#3B3A39]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <Link href="/" className="flex items-center gap-2" aria-label="TaskPMS home">
            <Image src="/logo.svg" alt="TaskPMS" width={110} height={22} />
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px]">
            <Link href="/about" className="hover:text-[#0078d4]">About Us</Link>
            <Link href="/contact" className="hover:text-[#0078d4]">Contact Us</Link>
            <Link href="/privacy" className="hover:text-[#0078d4]">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#0078d4]">Terms &amp; Conditions</Link>
          </nav>
        </div>
        <div className="border-t border-gray-200 dark:border-[#3B3A39] py-4 text-center text-xs text-gray-500 dark:text-zinc-500">
          © 2026 TaskPMS · Task Project Management System · Tiered team subscriptions ($5/2 seats · $8/4 seats · +$3/seat/mo)
        </div>
      </footer>
    </div>
  );
}
