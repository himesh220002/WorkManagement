"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar({
  currentWorkspace = "exec",
}: {
  currentWorkspace?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme from document element
    if (document.documentElement.getAttribute("data-theme") === "dark" || document.documentElement.classList.contains("dark")) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.getAttribute("data-theme") === "dark" || root.classList.contains("dark")) {
      root.removeAttribute("data-theme");
      root.classList.remove("dark");
      setIsDark(false);
      localStorage.setItem('taskflow_theme', 'light');
    } else {
      root.setAttribute("data-theme", "dark");
      root.classList.add("dark");
      setIsDark(true);
      localStorage.setItem('taskflow_theme', 'dark');
    }
  };

  const activeModule = pathname;

  const getIsActive = (path: string) => {
    return activeModule.startsWith(path)
      ? "bg-blue-600/90 text-white shadow-lg shadow-blue-500/30 neon-border-blue"
      : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white backdrop-blur-sm";
  };

  const linkBaseClass = "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all";

  return (
    <aside className="glass-panel sticky top-4 h-[calc(100vh-2rem)] p-5 flex flex-col overflow-y-auto ml-4 mb-4">
      <div className="flex items-center gap-3 font-bold text-lg text-blue-600 mb-6 px-1">
        <i className="fa-solid fa-chart-line text-xl"></i>
        <span>TaskFlow PM</span>
      </div>


      <button
        type="button"
        className="w-full p-2.5 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-200 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 mb-6 shadow-sm backdrop-blur-sm hover:shadow-md"
        onClick={toggleTheme}
      >
        <i className={`fa-solid ${isDark ? "fa-moon text-blue-400" : "fa-sun text-amber-500"}`}></i>
        <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
      </button>

      <nav className="flex-1 flex flex-col gap-1">
        {/* 1. UNDERSTAND */}
        <div className="text-[10px] uppercase tracking-widest text-blue-500 dark:text-blue-400 font-bold px-3 mb-1 mt-2">1. Understand</div>
        <div>
          <Link href="/diagrams" className={`${linkBaseClass} ${getIsActive("/diagrams")}`}>
            <i className="fa-solid fa-diagram-project w-5 text-center"></i>
            <span>Flow Diagrams</span>
          </Link>
        </div>
        <div>
          <Link href="/projects" className={`${linkBaseClass} ${getIsActive("/projects")}`}>
            <i className="fa-solid fa-folder-tree w-5 text-center"></i>
            <span>Projects Blueprint</span>
          </Link>
        </div>
        <div>
          <Link href="/about" className={`${linkBaseClass} ${getIsActive("/about")}`}>
            <i className="fa-solid fa-book-open w-5 text-center"></i>
            <span>Core Documentation</span>
          </Link>
        </div>

        {/* 2. CREATE */}
        <div className="text-[10px] uppercase tracking-widest text-emerald-500 dark:text-emerald-400 font-bold px-3 mb-1 mt-4">2. Create</div>
        <div>
          <Link href="/dev/dashboard" className={`${linkBaseClass} ${getIsActive("/dev/dashboard")}`}>
            <i className="fa-solid fa-code w-5 text-center"></i>
            <span>Dev Dashboard</span>
          </Link>
        </div>
        <div>
          <Link href="/dev/timeline" className={`${linkBaseClass} ${getIsActive("/dev/timeline")}`}>
            <i className="fa-solid fa-bars-staggered w-5 text-center"></i>
            <span>Parallel Pipeline</span>
          </Link>
        </div>
        <div>
          <Link href="/teams" className={`${linkBaseClass} ${getIsActive("/teams")}`}>
            <i className="fa-solid fa-users-gear w-5 text-center"></i>
            <span>Teams & Units</span>
          </Link>
        </div>

        {/* 3. MANAGE */}
        <div className="text-[10px] uppercase tracking-widest text-amber-500 dark:text-amber-400 font-bold px-3 mb-1 mt-4">3. Manage</div>
        <div>
          <Link href="/exec/dashboard" className={`${linkBaseClass} ${getIsActive("/exec/dashboard")}`}>
            <i className="fa-solid fa-chess-knight w-5 text-center"></i>
            <span>Exec Rollup</span>
          </Link>
        </div>
        <div>
          <Link href="/exec/resources" className={`${linkBaseClass} ${getIsActive("/exec/resources")}`}>
            <i className="fa-solid fa-scale-balanced w-5 text-center"></i>
            <span>Resource Allocation</span>
          </Link>
        </div>
        <div>
          <Link href="/Today" className={`${linkBaseClass} ${getIsActive("/Today")}`}>
            <i className="fa-solid fa-list-check w-5 text-center"></i>
            <span>Tactical Todo Lists</span>
          </Link>
        </div>

        {/* 4. GROW */}
        <div className="text-[10px] uppercase tracking-widest text-purple-500 dark:text-purple-400 font-bold px-3 mb-1 mt-4">4. Grow</div>
        <div>
          <Link href="/sales/dashboard" className={`${linkBaseClass} ${getIsActive("/sales/dashboard")}`}>
            <i className="fa-solid fa-handshake-angle w-5 text-center"></i>
            <span>Sales Pipeline</span>
          </Link>
        </div>
        <div>
          <Link href="/revenue/dashboard" className={`${linkBaseClass} ${getIsActive("/revenue/dashboard")}`}>
            <i className="fa-solid fa-sack-dollar w-5 text-center"></i>
            <span>Revenue Management</span>
          </Link>
        </div>
        <div>
          <Link href="/revenue/targets" className={`${linkBaseClass} ${getIsActive("/revenue/targets")}`}>
            <i className="fa-solid fa-arrow-trend-up w-5 text-center"></i>
            <span>Targets & Goals</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
