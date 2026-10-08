"use client";

import React, { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { TopBar, Breadcrumbs } from "@/components/shell";
import ShowcaseGuestCard from "@/components/showcase/ShowcaseGuestCard";

export const ShellContext = createContext<{
  isStandalone: boolean;
  setStandalone: (val: boolean) => void;
}>({
  isStandalone: false,
  setStandalone: () => {},
});

export function useShell() {
  return useContext(ShellContext);
}

/**
 * Decides between the public marketing chrome (landing `/`, about us,
 * legal, contact, and error pages) and the dashboard shell
 * (TopBar + Sidebar + Breadcrumbs).
 */
const PUBLIC_MARKETING_PATHS = new Set([
  "/",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/404",
  "/500",
  "/not-found",
]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [isStandalone, setIsStandalone] = useState(false);

  // Standalone public/error page surface — no dashboard chrome
  if (isStandalone || PUBLIC_MARKETING_PATHS.has(pathname)) {
    return (
      <ShellContext.Provider value={{ isStandalone, setStandalone: setIsStandalone }}>
        {children}
      </ShellContext.Provider>
    );
  }

  return (
    <ShellContext.Provider value={{ isStandalone, setStandalone: setIsStandalone }}>
      <TopBar />
      <div className="flex-1 flex flex-col xl:flex-row w-full max-w-[1920px] mx-auto min-h-[calc(100vh-48px)]">
        <Sidebar />
        <main className="flex-1 min-w-0 p-2 sm:p-4 lg:p-6 overflow-x-hidden">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </ShellContext.Provider>
  );
}
