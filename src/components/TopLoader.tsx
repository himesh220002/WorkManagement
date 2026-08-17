"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = () => {
    setLoading(true);
    setWidth(0);

    // Immediately jump to 20% then trickle to ~85%
    setTimeout(() => setWidth(20), 10);
    setTimeout(() => setWidth(50), 200);
    setTimeout(() => setWidth(72), 600);
    timerRef.current = setTimeout(() => setWidth(85), 1200);
  };

  const finishLoading = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setWidth(100);
    completeTimerRef.current = setTimeout(() => {
      setLoading(false);
      setWidth(0);
    }, 400);
  };

  useEffect(() => {
    startLoading();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    if (width >= 85) {
      finishLoading();
    }
  }, [pathname]);

  useEffect(() => {
    // Finish on mount to handle direct navigations
    const timeout = setTimeout(() => finishLoading(), 300);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return (
    <>
      {loading && (
        <div
          className="fixed top-0 left-0 z-[9999] h-[3px] transition-all duration-300 ease-in-out"
          style={{
            width: `${width}%`,
            background: "linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)",
            boxShadow: "0 0 8px rgba(99, 102, 241, 0.8), 0 0 16px rgba(59, 130, 246, 0.5)",
            borderRadius: "0 2px 2px 0",
          }}
        >
          {/* Shimmer pulse at the tip */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full opacity-75"
            style={{
              background: "radial-gradient(circle, rgba(99,102,241,0.9) 0%, transparent 70%)",
              animation: "pulse 0.8s ease-in-out infinite",
            }}
          />
        </div>
      )}
    </>
  );
}
