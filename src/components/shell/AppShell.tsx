"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { TopBar, Breadcrumbs } from "@/components/shell";

/**
 * Decides between the public marketing chrome (landing `/`, about us,
 * legal and contact pages) and the authenticated dashboard shell
 * (TopBar + Sidebar + Breadcrumbs).
 * Keeps public pages free of dashboard chrome so they can mirror
 * developer.microsoft.com exactly and stay crawlable for AdSense/SEO.
 */
const PUBLIC_MARKETING_PATHS = new Set([
  "/",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  // Public marketing surface — no dashboard chrome.
  if (PUBLIC_MARKETING_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <TopBar />
      <div className="flex-1 flex flex-col xl:flex-row w-full max-w-[1920px] mx-auto min-h-[calc(100vh-48px)]">
        <Sidebar />
        <main className="flex-1 min-w-0 p-2 sm:p-4 lg:p-6 overflow-x-hidden">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </>
  );
}
