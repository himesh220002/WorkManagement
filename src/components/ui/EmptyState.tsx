import React from "react";
import { FolderKanban } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-[8px] border border-dashed border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#201F1E] ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] flex items-center justify-center mb-3">
        {icon || <FolderKanban className="w-6 h-6" />}
      </div>
      <h4 className="text-base font-semibold text-[#242424] dark:text-[#FFFFFF] mb-1">
        {title}
      </h4>
      <p className="text-sm text-[#605E5C] dark:text-[#C8C6C4] max-w-sm mb-4">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
