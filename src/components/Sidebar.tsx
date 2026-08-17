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
      ? "bg-blue-600 text-white shadow-md"
      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white";
  };

  const linkBaseClass = "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all";

  return (
    <aside className="bg-white dark:bg-gray-800 sticky top-0 h-screen border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col overflow-y-auto shadow-sm h-full">
      <div className="flex items-center gap-3 font-bold text-lg text-blue-600 mb-6 px-1">
        <i className="fa-solid fa-chart-line text-xl"></i>
        <span>TaskFlow PM</span>
      </div>

      <div className="mb-6">
        <label
          htmlFor="workspaceSelect"
          className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 block uppercase font-bold tracking-widest px-1"
        >
          Workspace
        </label>
        <select
          id="workspaceSelect"
          className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
          value={currentWorkspace}
          onChange={(e) => router.push(e.target.value)}
        >
          <option value="/exec/dashboard">🧠 Strategic & Executive</option>
          <option value="/dev/dashboard">💻 Development</option>
          <option value="/sales/dashboard">📈 Sales Pipeline</option>
          <option value="/revenue/dashboard">💰 Revenue Management</option>
        </select>
      </div>

      <button
        type="button"
        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold transition-colors flex items-center justify-center gap-2 mb-6 shadow-xs"
        onClick={toggleTheme}
      >
        <i className={`fa-solid ${isDark ? "fa-moon text-blue-400" : "fa-sun text-amber-500"}`}></i>
        <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
      </button>

      <nav className="flex-1 flex flex-col gap-1">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold px-3 mb-1 mt-2">Modules</div>

        <div>
          <Link href="/exec/dashboard" className={`${linkBaseClass} ${getIsActive("/exec/dashboard")}`}>
            <i className="fa-solid fa-chess-knight w-5 text-center"></i>
            <span>Exec Rollup</span>
          </Link>
        </div>
        <div>
          <Link href="/dev/dashboard" className={`${linkBaseClass} ${getIsActive("/dev/dashboard")}`}>
            <i className="fa-solid fa-gauge-high w-5 text-center"></i>
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
          <Link href="/projects" className={`${linkBaseClass} ${getIsActive("/projects")}`}>
            <i className="fa-solid fa-folder-tree w-5 text-center"></i>
            <span>Projects</span>
          </Link>
        </div>
        <div>
          <Link href="/revenue/targets" className={`${linkBaseClass} ${getIsActive("/revenue/targets")}`}>
            <i className="fa-solid fa-bullseye w-5 text-center"></i>
            <span>Targets & Goals</span>
          </Link>
        </div>
        <div>
          <Link href="/teams" className={`${linkBaseClass} ${getIsActive("/teams")}`}>
            <i className="fa-solid fa-users w-5 text-center"></i>
            <span>Teams & Units</span>
          </Link>
        </div>
        <div>
          <Link href="/diagrams" className={`${linkBaseClass} ${getIsActive("/diagrams")}`}>
            <i className="fa-solid fa-diagram-project w-5 text-center"></i>
            <span>Flow Diagrams</span>
          </Link>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold px-3 mb-1 mt-6">Legacy</div>
        <div>
          <Link href="/Today" className={`${linkBaseClass} ${getIsActive("/Today")}`}>
            <i className="fa-solid fa-list-check w-5 text-center"></i>
            <span>Todo Lists</span>
          </Link>
        </div>
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link href="/about" className={`${linkBaseClass} ${getIsActive("/about")}`}>
          <i className="fa-solid fa-circle-info w-5 text-center"></i>
          <span>About App</span>
        </Link>
      </div>
    </aside>
  );
}
