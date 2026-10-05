import React from "react";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "caution";

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, tone = "neutral", size = "sm", className = "" }: BadgeProps) {
  let toneClass = "bg-[#F3F2F1] text-[#605E5C] dark:bg-[#292827] dark:text-[#C8C6C4]";
  if (tone === "brand") {
    toneClass = "bg-[#EBF3FC] text-[#0078D4] dark:bg-[#1C2B3D] dark:text-[#479EF5]";
  } else if (tone === "success") {
    toneClass = "bg-[#DFF6DD] text-[#107C10] dark:bg-[#0F3818] dark:text-[#54B054]";
  } else if (tone === "warning") {
    toneClass = "bg-[#FDE7D9] text-[#F7630C] dark:bg-[#4A2209] dark:text-[#FF8C00]";
  } else if (tone === "danger") {
    toneClass = "bg-[#FDE7E9] text-[#D13438] dark:bg-[#44171A] dark:text-[#F1707B]";
  } else if (tone === "caution") {
    toneClass = "bg-[#FFF4CE] text-[#8F6B00] dark:bg-[#4A3E09] dark:text-[#FFD335]";
  }

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-[4px] border border-transparent ${toneClass} ${sizeClass} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = (status || "").toLowerCase();
  let tone: BadgeTone = "neutral";

  if (normalized === "on track" || normalized === "active" || normalized === "completed" || normalized === "done") {
    tone = "success";
  } else if (normalized === "at risk" || normalized === "working" || normalized === "in progress") {
    tone = "caution";
  } else if (normalized === "behind" || normalized === "blocked" || normalized === "danger") {
    tone = "danger";
  } else if (normalized === "todo" || normalized === "backlog" || normalized === "planning") {
    tone = "brand";
  }

  return <Badge tone={tone}>{status}</Badge>;
}
