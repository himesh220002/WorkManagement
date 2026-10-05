"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Command, X, FolderKanban, Users, CheckSquare, GitBranch, DollarSign } from "lucide-react";

export function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const quickLinks = [
    { label: "Exec Dashboard", href: "/exec/dashboard", icon: FolderKanban },
    { label: "Projects Blueprint", href: "/projects", icon: FolderKanban },
    { label: "Dev Dashboard", href: "/dev/dashboard", icon: CheckSquare },
    { label: "Timeline & Pipelines", href: "/dev/timeline", icon: GitBranch },
    { label: "Teams Directory", href: "/teams", icon: Users },
    { label: "Sales Pipeline", href: "/sales/dashboard", icon: DollarSign },
    { label: "Revenue & Targets", href: "/revenue/dashboard", icon: DollarSign },
  ];

  const filteredLinks = query.trim()
    ? quickLinks.filter((l) =>
        l.label.toLowerCase().includes(query.toLowerCase())
      )
    : quickLinks;

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#201F1E] text-xs text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#F3F2F1] dark:hover:bg-[#292827] w-64 max-w-sm transition-colors"
      >
        <Search className="w-3.5 h-3.5 text-[#605E5C]" />
        <span className="flex-1 text-left">Search or jump to...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#605E5C] dark:text-[#C8C6C4]">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#201F1E] rounded-[8px] border border-[#E1DFDD] dark:border-[#3B3A39] shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E1DFDD] dark:border-[#3B3A39]">
              <Search className="w-4 h-4 text-[#0078D4]" />
              <input
                type="text"
                autoFocus
                placeholder="Type a screen name or action..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-sm bg-transparent outline-none text-[#242424] dark:text-white placeholder-[#A19F9D]"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#605E5C] hover:text-[#242424] dark:hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#605E5C] dark:text-[#A19F9D]">
                Navigation & Views
              </div>
              {filteredLinks.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item.href)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-[4px] text-[#242424] dark:text-white hover:bg-[#F3F2F1] dark:hover:bg-[#292827] text-left transition-colors"
                  >
                    <Icon className="w-4 h-4 text-[#0078D4]" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              {filteredLinks.length === 0 && (
                <div className="text-center py-6 text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                  No results found for &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
