"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sun, Moon, LayoutGrid } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { ContextSwitcher } from "./ContextSwitcher";

export function TopBar() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (
      document.documentElement.getAttribute("data-theme") === "dark" ||
      document.documentElement.classList.contains("dark")
    ) {
      setIsDark(true);
    }
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

  return (
    <header className="h-12 w-full bg-white dark:bg-[#201F1E] border-b border-[#E1DFDD] dark:border-[#3B3A39] px-4 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Product Name */}
      <div className="flex items-center gap-3">
        <Link
          href="/exec/dashboard"
          className="flex items-center gap-2 font-semibold text-sm text-[#242424] dark:text-white hover:text-[#0078D4] dark:hover:text-[#479EF5] transition-colors"
        >
          <div className="w-6 h-6 rounded-[4px] bg-[#0078D4] flex items-center justify-center text-white">
            <LayoutGrid className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold tracking-tight">TaskFlow PM</span>
        </Link>
      </div>

      {/* Global Search Centre */}
      <div className="hidden md:flex flex-1 justify-center max-w-md">
        <GlobalSearch />
      </div>

      {/* Right Controls: Context Switcher + Theme Toggle */}
      <div className="flex items-center gap-2">
        <ContextSwitcher currentCompanyName="TaskFlow Organization" />

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="w-8 h-8 rounded-[4px] flex items-center justify-center border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#F3F2F1] dark:hover:bg-[#3B3A39] transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#0078D4]" />}
        </button>
      </div>
    </header>
  );
}
