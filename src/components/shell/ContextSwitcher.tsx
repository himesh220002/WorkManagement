"use client";

import React, { useState } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";

interface ContextSwitcherProps {
  currentCompanyName?: string;
}

export function ContextSwitcher({
  currentCompanyName = "TaskFlow Organization",
}: ContextSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] text-xs font-semibold text-[#242424] dark:text-white hover:bg-[#FAF9F8] dark:hover:bg-[#292827] transition-colors"
      >
        <Building2 className="w-3.5 h-3.5 text-[#0078D4]" />
        <span>{currentCompanyName}</span>
        <ChevronDown className="w-3 h-3 text-[#605E5C]" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-56 rounded-[6px] bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] shadow-lg z-50 py-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#605E5C] dark:text-[#A19F9D]">
              Select Organization
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3 py-2 text-xs flex items-center justify-between text-[#242424] dark:text-white hover:bg-[#F3F2F1] dark:hover:bg-[#292827]"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-[#0078D4]" />
                <span className="font-medium">{currentCompanyName}</span>
              </div>
              <Check className="w-3.5 h-3.5 text-[#0078D4]" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
