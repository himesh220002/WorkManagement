import React from "react";

interface ProgressBarProps {
  value: number; // 0 to 100
  showLabel?: boolean;
  size?: "sm" | "md";
  tone?: "brand" | "success" | "warning" | "danger";
  className?: string;
}

export function ProgressBar({
  value,
  showLabel = false,
  size = "md",
  tone = "brand",
  className = "",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  let colorClass = "bg-[#0078D4]";
  if (tone === "success") colorClass = "bg-[#107C10]";
  else if (tone === "warning") colorClass = "bg-[#F7630C]";
  else if (tone === "danger") colorClass = "bg-[#D13438]";

  const heightClass = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold text-[#605E5C] dark:text-[#C8C6C4] mb-1">
          <span>Progress</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-[#F3F2F1] dark:bg-[#292827] rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${colorClass} ${heightClass} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
