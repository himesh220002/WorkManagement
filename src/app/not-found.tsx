import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for does not exist on TaskPMS.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f2f2f2] dark:bg-[#111214] text-[#242424] dark:text-[#E4E4E7] antialiased flex flex-col">
      <header className="bg-white dark:bg-[#201F1E] border-b border-gray-200 dark:border-[#3B3A39]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center">
          <Link href="/" aria-label="TaskPMS home">
            <Image src="/logo.svg" alt="TaskPMS — Task Project Management System" width={132} height={27} className="h-[27px] w-auto" />
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="text-center max-w-md">
          <p className="text-7xl font-light text-[#0078d4]">404</p>
          <h1 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white mt-4">This page slipped off the board</h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400 font-light mt-2">
            The link may be mistyped, or the page moved to another workspace. Try one of these instead.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link href="/" className="bg-[#0078d4] text-white px-5 py-2.5 text-sm font-semibold rounded-sm hover:bg-[#005a9e]">Back to homepage</Link>
            <Link href="/exec/dashboard" className="border border-gray-300 dark:border-zinc-700 px-5 py-2.5 text-sm font-medium rounded-sm hover:border-[#0078d4] hover:text-[#0078d4]">Open Dashboard</Link>
            <Link href="/contact" className="text-sm text-[#0078d4] hover:underline">Contact support</Link>
          </div>
        </div>
      </main>
      <footer className="py-4 text-center text-xs text-gray-500 dark:text-zinc-500 border-t border-gray-200 dark:border-[#3B3A39]">
        © 2026 TaskPMS · <Link href="/privacy" className="hover:text-[#0078d4]">Privacy</Link> · <Link href="/terms" className="hover:text-[#0078d4]">Terms</Link>
      </footer>
    </div>
  );
}
