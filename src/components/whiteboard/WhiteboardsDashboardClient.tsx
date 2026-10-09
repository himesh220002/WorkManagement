"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Presentation,
  Plus,
  Star,
  Clock,
  Search,
  ArrowUpDown,
  Grid,
  List,
  FolderKanban,
  FileText,
  Trash2,
  Sparkles,
  GitFork,
  CheckCircle2,
  MoreVertical,
  ChevronDown,
} from "lucide-react";
import { WHITEBOARD_TEMPLATES } from "@/lib/whiteboardTemplates";

interface WhiteboardListItem {
  _id: string;
  title: string;
  description?: string;
  templateId?: string;
  isFavorite?: boolean;
  authorName?: string;
  authorInitials?: string;
  nodes?: any[];
  edges?: any[];
  updatedAt?: string | Date;
  createdAt?: string | Date;
}

interface WhiteboardsDashboardClientProps {
  initialWhiteboards: WhiteboardListItem[];
  currentUserName: string;
}

export default function WhiteboardsDashboardClient({
  initialWhiteboards,
  currentUserName,
}: WhiteboardsDashboardClientProps) {
  const router = useRouter();
  const [whiteboards, setWhiteboards] = useState<WhiteboardListItem[]>(initialWhiteboards);
  const [activeTab, setActiveTab] = useState<"all" | "my" | "favorites" | "recents">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<"recent" | "title">("recent");
  const [isCreating, setIsCreating] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);

  // Toggle favorite
  const handleToggleFavorite = async (boardId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      setWhiteboards((prev) =>
        prev.map((b) => (b._id === boardId ? { ...b, isFavorite: !currentStatus } : b))
      );

      await fetch(`/api/whiteboards/${boardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !currentStatus }),
      });
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  // Create new whiteboard
  const handleCreateWhiteboard = async (templateId: string = "blank", templateTitle?: string) => {
    try {
      setIsCreating(true);
      setShowNewDropdown(false);

      const title =
        templateTitle ||
        (templateId === "blank"
          ? "Untitled Whiteboard"
          : WHITEBOARD_TEMPLATES.find((t) => t.id === templateId)?.title || "New Whiteboard");

      const res = await fetch("/api/whiteboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, templateId }),
      });

      const data = await res.json();
      if (data.success && data.whiteboard) {
        router.push(`/whiteboards/${data.whiteboard._id}`);
      }
    } catch (err) {
      console.error("Failed to create whiteboard:", err);
    } finally {
      setIsCreating(false);
    }
  };

  // Delete whiteboard
  const handleDeleteWhiteboard = async (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this whiteboard?")) return;

    try {
      await fetch(`/api/whiteboards/${boardId}`, { method: "DELETE" });
      setWhiteboards((prev) => prev.filter((b) => b._id !== boardId));
    } catch (err) {
      console.error("Failed to delete whiteboard:", err);
    }
  };

  // Filter & sort whiteboards
  const filteredBoards = useMemo(() => {
    return whiteboards
      .filter((b) => {
        if (activeTab === "favorites" && !b.isFavorite) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            b.title.toLowerCase().includes(q) ||
            (b.description && b.description.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "title") return a.title.localeCompare(b.title);
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [whiteboards, activeTab, searchQuery, sortOrder]);

  const favoritesCount = whiteboards.filter((b) => b.isFavorite).length;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#0D0E11] text-[#E1DFDD]">
      {/* 1. LEFT SIDEBAR (Matching Screenshot 1) */}
      <aside className="w-64 shrink-0 border-r border-[#22242B] bg-[#121316] flex flex-col justify-between">
        <div className="p-4 border-b border-[#22242B]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>Whiteboards</span>
            </h1>
            <button
              onClick={() => handleCreateWhiteboard("blank")}
              disabled={isCreating}
              className="w-7 h-7 rounded-md bg-[#23252C] hover:bg-[#2B2E37] text-white flex items-center justify-center transition-colors border border-[#30333D]"
              title="New Whiteboard"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-[#23252C] text-white font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-[#1A1B20]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Grid className="w-4 h-4 text-blue-400" />
                <span>All Whiteboards</span>
              </div>
              <span className="text-[11px] text-gray-500 font-semibold">{whiteboards.length}</span>
            </button>

            <button
              onClick={() => setActiveTab("my")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "my"
                  ? "bg-[#23252C] text-white font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-[#1A1B20]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 text-[10px] font-bold flex items-center justify-center">
                  H
                </span>
                <span>My Whiteboards</span>
              </div>
              <span className="text-[11px] text-gray-500 font-semibold">{whiteboards.length}</span>
            </button>
          </nav>
        </div>

        {/* Favorites Section */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
              Favorites
            </div>
            {favoritesCount === 0 ? (
              <div className="p-4 rounded-lg bg-[#18191E] border border-dashed border-[#282A33] text-center">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400/20 mx-auto mb-1.5" />
                <p className="text-[11px] text-gray-400">Star a Whiteboard to see it here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {whiteboards
                  .filter((b) => b.isFavorite)
                  .map((b) => (
                    <Link
                      key={b._id}
                      href={`/whiteboards/${b._id}`}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-gray-300 hover:bg-[#1C1E24] hover:text-white transition-colors truncate"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                      <span className="truncate">{b.title}</span>
                    </Link>
                  ))}
              </div>
            )}
          </div>

          {/* Recents Section */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
              Recents
            </div>
            <div className="space-y-1">
              {whiteboards.slice(0, 4).map((b) => (
                <Link
                  key={b._id}
                  href={`/whiteboards/${b._id}`}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-gray-300 hover:bg-[#1C1E24] hover:text-white transition-colors truncate"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="truncate">{b.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Workspace Status */}
        <div className="p-3 border-t border-[#22242B] bg-[#101115] flex items-center justify-between text-[11px] text-gray-400">
          <span>Enterprise Canvas</span>
          <span className="text-emerald-400 font-medium">Online</span>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0D0E11] overflow-y-auto">
        {/* Top Header */}
        <div className="h-14 px-6 border-b border-[#22242B] bg-[#121316] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white">All Whiteboards</h2>
          </div>

          {/* "+ New Whiteboard" dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNewDropdown(!showNewDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#202228] hover:bg-[#282B33] text-white border border-[#30333D] rounded-md text-xs font-semibold shadow-sm transition-all"
            >
              <span>+ New Whiteboard</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showNewDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-[#18191E] border border-[#2D3039] rounded-lg shadow-2xl py-1 z-50 animate-in fade-in-50">
                <button
                  onClick={() => handleCreateWhiteboard("blank")}
                  className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-[#23252C] flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-blue-400" />
                  <span>Blank Canvas</span>
                </button>
                <div className="h-px bg-[#262830] my-1" />
                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Create from Template
                </div>
                {WHITEBOARD_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleCreateWhiteboard(tmpl.id, tmpl.title)}
                    className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-[#23252C] flex items-center gap-2"
                  >
                    <GitFork className="w-3.5 h-3.5 text-purple-400" />
                    <span>{tmpl.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Templates Row (Matching Screenshot 1) */}
          <div>
            <div className="text-xs font-semibold text-gray-400 mb-3">Templates & Functional Areas</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {WHITEBOARD_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleCreateWhiteboard(tmpl.id, tmpl.title)}
                  className="group relative p-3.5 rounded-xl bg-[#14151A] hover:bg-[#1B1D24] border border-[#24262E] hover:border-[#383C48] cursor-pointer transition-all duration-200 flex items-center gap-3.5 shadow-sm"
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${tmpl.iconColor} flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform`}
                  >
                    <Presentation className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {tmpl.title}
                    </h3>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {tmpl.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Bar (Sort, Search, Grid/List) */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === "recent" ? "title" : "recent")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#16171D] hover:bg-[#202229] border border-[#262832] text-gray-300 transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                <span>Sort: {sortOrder === "recent" ? "Recently Edited" : "Title"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Whiteboards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-md text-xs bg-[#16171D] border border-[#262832] focus:border-blue-500 focus:outline-none text-white placeholder:text-gray-400 w-48 sm:w-64 transition-all"
                />
              </div>

              <div className="flex items-center rounded-md border border-[#262832] bg-[#16171D] p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1 rounded ${
                    viewMode === "grid" ? "bg-[#252833] text-white" : "text-gray-400 hover:text-white"
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1 rounded ${
                    viewMode === "list" ? "bg-[#252833] text-white" : "text-gray-400 hover:text-white"
                  }`}
                  title="List view"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Whiteboards Grid / List (Matching Screenshot 1) */}
          {filteredBoards.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#22242B] rounded-xl bg-[#121316]">
              <Presentation className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">No whiteboards found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Create a new whiteboard from scratch or pick a template above to get started.
              </p>
              <button
                onClick={() => handleCreateWhiteboard("org-chart", "Organizational Chart")}
                className="mt-4 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition-all"
              >
                Launch Organizational Chart
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredBoards.map((board) => (
                <Link
                  key={board._id}
                  href={`/whiteboards/${board._id}`}
                  className="group relative flex flex-col rounded-xl bg-[#14151B] hover:bg-[#1A1C23] border border-[#22242B] hover:border-[#383C48] overflow-hidden shadow-sm transition-all duration-200"
                >
                  {/* Visual Canvas Thumbnail Preview */}
                  <div className="h-40 bg-[#0A0B0E] relative flex items-center justify-center p-4 border-b border-[#202229] overflow-hidden">
                    {/* Dot grid simulation */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: "radial-gradient(#555 1px, transparent 1px)",
                        backgroundSize: "16px 16px",
                      }}
                    />

                    {/* Miniature diagram preview */}
                    <div className="relative z-10 flex flex-col items-center gap-2 transform group-hover:scale-105 transition-transform duration-300">
                      <div className="w-12 h-7 rounded border border-blue-500/80 bg-blue-900/40 flex items-center justify-center">
                        <span className="w-6 h-1 rounded-full bg-blue-300" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 rounded border border-cyan-500/80 bg-cyan-900/40" />
                        <div className="w-10 h-6 rounded border border-amber-500/80 bg-amber-900/40" />
                      </div>
                    </div>

                    {/* Star Favorite Button */}
                    <button
                      onClick={(e) => handleToggleFavorite(board._id, Boolean(board.isFavorite), e)}
                      className="absolute top-2.5 right-2.5 p-1 rounded-md bg-[#16171E]/80 hover:bg-[#202229] text-gray-400 hover:text-amber-400 transition-colors z-20"
                      title={board.isFavorite ? "Unstar" : "Star favorite"}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          board.isFavorite ? "text-amber-400 fill-amber-400" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Card Footer Info */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                        {board.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Edited {board.updatedAt ? new Date(board.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently"}
                      </p>
                    </div>

                    {/* Author Initials Badge (HS from screenshot) */}
                    <div className="w-6 h-6 rounded-full bg-[#2A2D36] text-gray-200 font-bold text-[10px] flex items-center justify-center shrink-0 border border-[#383C48]">
                      {board.authorInitials || "HS"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="border border-[#22242B] rounded-xl overflow-hidden bg-[#14151B]">
              {filteredBoards.map((board, idx) => (
                <Link
                  key={board._id}
                  href={`/whiteboards/${board._id}`}
                  className={`flex items-center justify-between p-3.5 hover:bg-[#1C1E26] transition-colors ${
                    idx !== 0 ? "border-t border-[#202229]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={(e) => handleToggleFavorite(board._id, Boolean(board.isFavorite), e)}
                      className="p-1 text-gray-400 hover:text-amber-400"
                    >
                      <Star
                        className={`w-4 h-4 ${board.isFavorite ? "text-amber-400 fill-amber-400" : ""}`}
                      />
                    </button>
                    <div>
                      <h4 className="text-xs font-bold text-white hover:text-blue-400 transition-colors">
                        {board.title}
                      </h4>
                      <p className="text-[11px] text-gray-500">{board.description || "Canvas"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>
                      {board.updatedAt ? new Date(board.updatedAt).toLocaleDateString() : "Today"}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-[#2A2D36] text-gray-200 font-bold text-[10px] flex items-center justify-center border border-[#383C48]">
                      {board.authorInitials || "HS"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
