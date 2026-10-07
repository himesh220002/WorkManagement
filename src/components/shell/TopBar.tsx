"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sun, Moon, LayoutGrid, Menu, ShieldCheck, User, LogOut, Sparkles } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { ContextSwitcher } from "./ContextSwitcher";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { PersonaSwitcher } from "./PersonaSwitcher";
import MemberProfileModal, { UserDetail } from "@/components/MemberProfileModal";

export function TopBar() {
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    if (
      document.documentElement.getAttribute("data-theme") === "dark" ||
      document.documentElement.classList.contains("dark")
    ) {
      setIsDark(true);
    }

    // Fetch active session to show real logged-in company and profile
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setSessionData(data);
        }
      })
      .catch(() => { });
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.getAttribute("data-theme") === "dark" || root.classList.contains("dark")) {
      root.removeAttribute("data-theme");
      root.classList.remove("dark");
      setIsDark(false);
      localStorage.setItem("taskflow_theme", "light");
    } else {
      root.setAttribute("data-theme", "dark");
      root.classList.add("dark");
      setIsDark(true);
      localStorage.setItem("taskflow_theme", "dark");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch { }
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/auth/login";
  };

  const companyDisplayName = sessionData?.company
    ? `${sessionData.company.name} [${sessionData.company.code || ""}]`
    : "TaskFlow Organization";

  return (
    <>
      <header className="h-12 w-full bg-white dark:bg-[#201F1E] border-b border-[#E1DFDD] dark:border-[#3B3A39] px-3 sm:px-4 flex items-center justify-between gap-3 sticky top-0 z-30 select-none">
        {/* Left Section: Mobile Hamburger Toggle + Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="xl:hidden p-1.5 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#F3F2F1] hover:text-[#242424] transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-xs sm:text-sm text-[#242424] dark:text-white hover:text-[#0078D4] dark:hover:text-[#479EF5] transition-colors shrink-0"
          >
            <div className="w-6 h-6 rounded-[4px] bg-[#0078D4] flex items-center justify-center text-white shadow-sm">
              <LayoutGrid className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold tracking-tight">TaskPMS</span>
          </Link>
        </div>

        {/* Global Search Centre (Desktop & Tablet) */}
        <div className="hidden md:flex flex-1 justify-center max-w-md">
          <GlobalSearch />
        </div>

        {/* Right Controls: Real Profile + Auth Portal / Switcher + Context Switcher + Theme */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {sessionData?.user ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-1.5 sm:px-2 py-1 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] hover:border-[#0078D4] text-xs font-semibold text-[#242424] dark:text-white transition-all cursor-pointer shadow-sm"
                title="Click to view your personal telemetry, ratings & merit profile"
              >
                <div className="w-5 h-5 rounded-full bg-[#0078D4] text-white flex items-center justify-center text-[10px] font-bold">
                  {sessionData.user.name?.substring(0, 2).toUpperCase()}
                </div>
                <span className="hidden md:inline font-bold max-w-[100px] truncate">
                  {sessionData.user.name}
                </span>
                <span className="hidden sm:inline px-1.5 py-0.2 rounded text-[10px] bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] font-semibold uppercase">
                  {sessionData.user.role}
                </span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:flex p-1.5 rounded-[4px] text-[#8A8886] hover:text-[#D13438] hover:bg-[#FDE7E9] dark:hover:bg-[#44171A] transition-colors"
                title="Log Out of Organization"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-[4px] bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] hover:bg-[#0078D4] hover:text-white transition-colors border border-[#0078D4]/20"
              title="SaaS Multi-Tenant Authentication & RBAC Control"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tenant Auth</span>
            </Link>
          )}

          {/* Desktop-only: Persona Switcher and Context Switcher (embedded in Mobile Drawer on < lg to keep header compact) */}
          <div className="hidden lg:flex items-center gap-1.5 sm:gap-2">
            {/* <PersonaSwitcher /> */}
            <ContextSwitcher currentCompanyName={companyDisplayName} />
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="w-8 h-8 rounded-[4px] flex items-center justify-center border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#F3F2F1] dark:hover:bg-[#3B3A39] transition-colors cursor-pointer shrink-0"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#0078D4]" />}
          </button>
        </div>
      </header>

      {/* Slide-over Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentCompanyName={companyDisplayName}
        sessionData={sessionData}
        onOpenProfile={() => {
          setIsMobileMenuOpen(false);
          setIsProfileModalOpen(true);
        }}
        onLogout={handleLogout}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Real Logged-in User Profile Modal */}
      {isProfileModalOpen && sessionData?.user && (
        <MemberProfileModal
          user={sessionData.user}
          currentRole={sessionData.user.role}
          currentUserId={sessionData.user._id || sessionData.user.id}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </>
  );
}

