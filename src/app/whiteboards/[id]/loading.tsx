import React from "react";

export default function WhiteboardLoading() {
  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-[#0D0E11] text-[#E1DFDD] select-none">
      {/* 1. Header Bar Skeleton */}
      <header className="absolute top-0 left-0 right-0 h-13 px-4 bg-[#121316]/90 backdrop-blur-md border-b border-[#22242B] flex items-center justify-between z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-[#202228] animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="w-40 h-5 bg-[#252730] rounded-md animate-pulse" />
            <div className="w-12 h-4 bg-[#1E2028] rounded-full animate-pulse hidden sm:block" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-20 h-7 bg-[#202228] rounded-md animate-pulse" />
          <div className="w-24 h-7 bg-[#0078D4]/30 rounded-md animate-pulse" />
          <div className="w-7 h-7 rounded-md bg-[#202228] animate-pulse" />
        </div>
      </header>

      {/* 2. Canvas Background with Subtle Dot Grid */}
      <div
        className="w-full h-full pt-13 flex items-center justify-center"
        style={{
          backgroundImage: "radial-gradient(#262833 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Placeholder Blueprint Cards Pulsing in Place */}
        <div className="flex flex-col items-center gap-8 opacity-40">
          <div className="w-36 h-36 rounded-full border-2 border-cyan-500/40 bg-cyan-950/20 animate-pulse flex items-center justify-center">
            <div className="w-20 h-3 bg-cyan-500/30 rounded" />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="w-48 h-28 rounded-xl border border-blue-500/30 bg-blue-950/20 animate-pulse p-4 flex flex-col justify-between">
              <div className="w-28 h-3.5 bg-blue-400/30 rounded" />
              <div className="w-16 h-2.5 bg-blue-400/20 rounded" />
            </div>
            <div className="w-48 h-28 rounded-xl border border-purple-500/30 bg-purple-950/20 animate-pulse p-4 flex flex-col justify-between">
              <div className="w-32 h-3.5 bg-purple-400/30 rounded" />
              <div className="w-20 h-2.5 bg-purple-400/20 rounded" />
            </div>
            <div className="w-48 h-28 rounded-xl border border-pink-500/30 bg-pink-950/20 animate-pulse p-4 flex flex-col justify-between">
              <div className="w-24 h-3.5 bg-pink-400/30 rounded" />
              <div className="w-14 h-2.5 bg-pink-400/20 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Floating Toolbar Skeleton */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#181920]/95 backdrop-blur-md border border-[#2D3039] rounded-2xl p-1.5 shadow-2xl flex items-center gap-1.5 z-40">
        <div className="w-8 h-8 rounded-lg bg-[#252834] animate-pulse" />
        <div className="w-8 h-8 rounded-lg bg-[#252834] animate-pulse" />
        <div className="w-8 h-8 rounded-lg bg-[#252834] animate-pulse" />
        <div className="h-5 w-px bg-[#2C2E38]" />
        <div className="w-8 h-8 rounded-lg bg-[#252834] animate-pulse" />
        <div className="w-8 h-8 rounded-lg bg-[#252834] animate-pulse" />
        <div className="w-8 h-8 rounded-lg bg-[#252834] animate-pulse" />
        <div className="w-8 h-8 rounded-lg bg-[#252834] animate-pulse" />
      </div>
    </div>
  );
}
