"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/exec/dashboard") return null;

  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbItems = segments.map((seg, idx) => {
    const url = "/" + segments.slice(0, idx + 1).join("/");
    const label = decodeURIComponent(seg)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const isLast = idx === segments.length - 1;

    return {
      url,
      label,
      isLast,
    };
  });

  return (
    <nav className="flex items-center gap-1.5 text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-3">
      <Link
        href="/exec/dashboard"
        className="hover:text-[#0078D4] dark:hover:text-[#479EF5] flex items-center gap-1"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>

      {breadcrumbItems.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3 h-3 text-[#A19F9D]" />
          {item.isLast ? (
            <span className="font-semibold text-[#242424] dark:text-[#FFFFFF]">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.url}
              className="hover:text-[#0078D4] dark:hover:text-[#479EF5]"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
