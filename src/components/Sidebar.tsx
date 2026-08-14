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
    if (document.documentElement.getAttribute("data-theme") === "dark") {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.getAttribute("data-theme") === "dark") {
      root.removeAttribute("data-theme");
      setIsDark(false);
    } else {
      root.setAttribute("data-theme", "dark");
      setIsDark(true);
    }
  };

  const activeModule = pathname;

  const getIsActive = (path: string) => {
    return activeModule.startsWith(path) ? "active" : "";
  };

  return (
    <aside className="sidebar glass-card flex flex-col overflow-y-auto">
      <div className="brand mb-5">
        <i className="fa-solid fa-chart-line mr-2"></i>
        <span>TaskFlow PM</span>
      </div>

      <div className="workspace-selector mb-5">
        <label
          htmlFor="workspaceSelect"
          className="text-xs text-[var(--text-muted)] mb-1 block"
        >
          WORKSPACE
        </label>
        <select
          id="workspaceSelect"
          className="priority-select w-full"
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
        className="theme-toggle-btn mb-5 flex items-center justify-center gap-2 w-full"
        onClick={toggleTheme}
      >
        <i className={`fa-solid ${isDark ? "fa-moon" : "fa-sun"}`}></i>
        <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
      </button>

      <nav className="sidebar-nav flex-1">
        <div className="nav-title">Modules</div>

        <div className="nav-item-wrapper">
          <Link href="/exec/dashboard" className={`nav-item ${getIsActive("/exec/dashboard")}`}>
            <span>
              <i className="fa-solid fa-chess-knight w-6"></i> Exec Rollup
            </span>
          </Link>
        </div>
        <div className="nav-item-wrapper">
          <Link href="/dev/dashboard" className={`nav-item ${getIsActive("/dev/dashboard")}`}>
            <span>
              <i className="fa-solid fa-gauge-high w-6"></i> Dev Dashboard
            </span>
          </Link>
        </div>
        <div className="nav-item-wrapper">
          <Link href="/dev/timeline" className={`nav-item ${getIsActive("/dev/timeline")}`}>
            <span>
              <i className="fa-solid fa-bars-staggered w-6"></i> Parallel Pipeline
            </span>
          </Link>
        </div>
        <div className="nav-item-wrapper">
          <Link href="/projects" className={`nav-item ${getIsActive("/projects")}`}>
            <span>
              <i className="fa-solid fa-folder-tree w-6"></i> Projects
            </span>
          </Link>
        </div>
        <div className="nav-item-wrapper">
          <Link href="/revenue/targets" className={`nav-item ${getIsActive("/revenue/targets")}`}>
            <span>
              <i className="fa-solid fa-bullseye w-6"></i> Targets & Goals
            </span>
          </Link>
        </div>
        <div className="nav-item-wrapper">
          <Link href="/teams" className={`nav-item ${getIsActive("/teams")}`}>
            <span>
              <i className="fa-solid fa-users w-6"></i> Teams & Units
            </span>
          </Link>
        </div>
        <div className="nav-item-wrapper">
          <Link href="/diagrams" className={`nav-item ${getIsActive("/diagrams")}`}>
            <span>
              <i className="fa-solid fa-diagram-project w-6"></i> Flow Diagrams
            </span>
          </Link>
        </div>

        <div className="nav-title mt-5">Legacy</div>
        <div className="nav-item-wrapper">
          <Link href="/Today" className={`nav-item ${getIsActive("/Today")}`}>
            <span>
              <i className="fa-solid fa-list-check w-6"></i> Todo Lists
            </span>
          </Link>
        </div>
      </nav>

      <div className="mt-auto pt-4">
        <Link href="/about" className={`nav-item ${getIsActive("/about")}`}>
          <span>
            <i className="fa-solid fa-circle-info w-6"></i> About App
          </span>
        </Link>
      </div>
    </aside>
  );
}
