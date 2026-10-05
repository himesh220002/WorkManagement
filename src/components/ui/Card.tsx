import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface CardProps {
  title?: string;
  subtitle?: string;
  seeAllHref?: string;
  seeAllText?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Card({
  title,
  subtitle,
  seeAllHref,
  seeAllText = "See all",
  headerAction,
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14),0_0_2px_rgba(0,0,0,0.12)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.14),0_0_2px_rgba(0,0,0,0.12)] transition-shadow duration-200 ${className}`}
    >
      {(title || seeAllHref || headerAction) && (
        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-[#F3F2F1] dark:border-[#292827]">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-[#242424] dark:text-[#FFFFFF]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            {seeAllHref && (
              <Link
                href={seeAllHref}
                className="text-xs font-semibold text-[#0078D4] dark:text-[#479EF5] hover:underline inline-flex items-center gap-0.5"
              >
                <span>{seeAllText}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
