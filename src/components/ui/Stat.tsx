import React from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatProps {
  label: string;
  value: string | number;
  subtext?: string;
  change?: {
    value: string;
    positive: boolean;
  };
  sourceHref?: string;
  sourceLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function Stat({
  label,
  value,
  subtext,
  change,
  sourceHref,
  sourceLabel = "View details",
  icon,
  className = "",
}: StatProps) {
  const content = (
    <div
      className={`bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14),0_0_2px_rgba(0,0,0,0.12)] hover:border-[#0078D4] transition-all flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-[#0078D4] dark:text-[#479EF5]">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
          {value}
        </span>
        {change && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              change.positive ? "text-[#107C10]" : "text-[#D13438]"
            }`}
          >
            {change.positive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {change.value}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-3">
          {subtext}
        </p>
      )}

      {sourceHref && (
        <div className="pt-2 border-t border-[#F3F2F1] dark:border-[#292827] mt-auto">
          <span className="text-xs font-medium text-[#0078D4] dark:text-[#479EF5] hover:underline inline-flex items-center gap-1">
            {sourceLabel} &rarr;
          </span>
        </div>
      )}
    </div>
  );

  if (sourceHref) {
    return (
      <Link href={sourceHref} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}
