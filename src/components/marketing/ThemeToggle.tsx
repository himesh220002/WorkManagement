"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

function isDarkActive(): boolean {
  if (typeof document === "undefined") return false;
  const root = document.documentElement;
  return root.getAttribute("data-theme") === "dark" || root.classList.contains("dark");
}

/**
 * Theme toggle for public marketing navbars (home, legal, contact).
 * Mirrors the dashboard TopBar toggle: persists to `taskflow_theme` and
 * flips the same `data-theme` / `dark` class the root layout reads.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(isDarkActive());
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDarkActive()) {
      root.removeAttribute("data-theme");
      root.classList.remove("dark");
      try {
        localStorage.setItem("taskflow_theme", "light");
      } catch {}
      setIsDark(false);
    } else {
      root.setAttribute("data-theme", "dark");
      root.classList.add("dark");
      try {
        localStorage.setItem("taskflow_theme", "dark");
      } catch {}
      setIsDark(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`w-8 h-8 rounded-sm flex items-center justify-center border border-gray-200 dark:border-[#3B3A39] bg-white dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-gray-100 dark:hover:bg-[#3B3A39] transition-colors cursor-pointer shrink-0 ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#0078d4]" />}
    </button>
  );
}
