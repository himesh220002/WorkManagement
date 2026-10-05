"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "subtle" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  let variantStyles = "bg-[#0078D4] text-white hover:bg-[#106EBE] active:bg-[#005A9E]";
  if (variant === "secondary") {
    variantStyles =
      "bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-[#FFFFFF] hover:bg-[#FAF9F8] dark:hover:bg-[#292827]";
  } else if (variant === "subtle") {
    variantStyles =
      "bg-transparent text-[#242424] dark:text-[#FFFFFF] hover:bg-[#F3F2F1] dark:hover:bg-[#292827]";
  } else if (variant === "danger") {
    variantStyles = "bg-[#D13438] text-white hover:bg-[#A80000]";
  }

  let sizeStyles = "h-8 px-3 text-xs gap-1.5";
  if (size === "md") sizeStyles = "h-9 px-4 text-sm gap-2";
  if (size === "lg") sizeStyles = "h-11 px-5 text-base gap-2.5";

  return (
    <button
      className={`inline-flex items-center justify-center font-semibold rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D4] disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles} ${sizeStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
