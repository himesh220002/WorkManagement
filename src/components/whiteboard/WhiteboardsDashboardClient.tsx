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
  Lock,
  Unlock,
  Shield,
  Key,
  User,
  AlertTriangle,
  X,
  Eye,
  Check,
  ShieldAlert,
  Settings,
} from "lucide-react";
import { WHITEBOARD_TEMPLATES } from "@/lib/whiteboardTemplates";
import WhiteboardSettingsModal, {
  WhiteboardSecuritySettings,
} from "./WhiteboardSettingsModal";

interface WhiteboardListItem {
  _id: string;
  title: string;
  description?: string;
  templateId?: string;
  isFavorite?: boolean;
  authorName?: string;
  authorId?: string;
  authorInitials?: string;
  isProtected?: boolean;
  securityType?: "pin" | "password";
  deleteRequiresPass?: boolean;
  publicEdit?: boolean;
  tempTokenPhrase?: string;
  nodes?: any[];
  edges?: any[];
  updatedAt?: string | Date;
  createdAt?: string | Date;
}

interface WhiteboardsDashboardClientProps {
  initialWhiteboards: WhiteboardListItem[];
  currentUserName: string;
  currentUserId?: string;
}

export default function WhiteboardsDashboardClient({
  initialWhiteboards,
  currentUserName,
  currentUserId,
}: WhiteboardsDashboardClientProps) {
  const router = useRouter();
  const [whiteboards, setWhiteboards] = useState<WhiteboardListItem[]>(initialWhiteboards);
  const [activeTab, setActiveTab] = useState<"all" | "my" | "favorites" | "recents">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<"recent" | "title">("recent");
  const [isCreating, setIsCreating] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);

  // Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("blank");
  const [newTitle, setNewTitle] = useState("");
  const [creatorName, setCreatorName] = useState(currentUserName || "User");
  const [enableSecurity, setEnableSecurity] = useState(false);
  const [securityType, setSecurityType] = useState<"pin" | "password">("pin");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [createError, setCreateError] = useState("");

  // Delete Password Protected Modal State
  const [deleteModalBoard, setDeleteModalBoard] = useState<WhiteboardListItem | null>(null);
  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Settings Modal State
  const [settingsModalBoard, setSettingsModalBoard] = useState<WhiteboardListItem | null>(null);

  // Open Create Modal
  const openCreateModal = (templateId: string = "blank", templateTitle?: string) => {
    setShowNewDropdown(false);
    setSelectedTemplateId(templateId);
    const defaultTitle =
      templateTitle ||
      (templateId === "blank"
        ? "Untitled Whiteboard"
        : WHITEBOARD_TEMPLATES.find((t) => t.id === templateId)?.title || "New Whiteboard");
    setNewTitle(defaultTitle);
    setCreatorName(currentUserName || "User");
    setEnableSecurity(false);
    setSecurityType("pin");
    setPasswordInput("");
    setConfirmPasswordInput("");
    setCreateError("");
    setIsCreateModalOpen(true);
  };

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

  // Submit Create New Whiteboard
  const handleConfirmCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!newTitle.trim()) {
      setCreateError("Please enter a whiteboard title");
      return;
    }

    if (!creatorName.trim()) {
      setCreateError("Please enter who is creating this whiteboard");
      return;
    }

    if (enableSecurity) {
      if (!passwordInput) {
        setCreateError(
          securityType === "pin" ? "Please enter a 4-digit PIN" : "Please enter a 6-character password"
        );
        return;
      }

      if (securityType === "pin") {
        if (!/^\d{4}$/.test(passwordInput.trim())) {
          setCreateError("4-digit PIN must contain exactly 4 numeric digits");
          return;
        }
      } else {
        if (passwordInput.trim().length < 6) {
          setCreateError("Password must be at least 6 characters long");
          return;
        }
      }

      if (passwordInput.trim() !== confirmPasswordInput.trim()) {
        setCreateError("Password and Confirm Password do not match");
        return;
      }
    }

    try {
      setIsCreating(true);

      const res = await fetch("/api/whiteboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          templateId: selectedTemplateId,
          authorName: creatorName.trim(),
          isProtected: enableSecurity,
          securityType,
          password: enableSecurity ? passwordInput.trim() : "",
          deleteRequiresPass: true,
          publicEdit: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCreateError(data.error || "Failed to create whiteboard");
        return;
      }

      setIsCreateModalOpen(false);
      if (data.whiteboard?._id) {
        router.push(`/whiteboards/${data.whiteboard._id}?isNew=1`);
      }
    } catch (err: any) {
      console.error("Failed to create whiteboard:", err);
      setCreateError(err.message || "Network error while creating whiteboard");
    } finally {
      setIsCreating(false);
    }
  };

  // Initiate Delete Whiteboard
  const handleDeleteClick = (board: WhiteboardListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (board.isProtected && board.deleteRequiresPass) {
      setDeleteModalBoard(board);
      setDeletePasswordInput("");
      setDeleteError("");
    } else {
      if (!confirm(`Are you sure you want to delete "${board.title}"?`)) return;
      executeDelete(board._id);
    }
  };

  // Execute Delete
  const executeDelete = async (boardId: string, password?: string) => {
    try {
      setIsDeleting(true);
      setDeleteError("");

      const res = await fetch(`/api/whiteboards/${boardId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: password ? JSON.stringify({ password }) : undefined,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDeleteError(data.error || "Failed to delete whiteboard. Verification failed.");
        return;
      }

      setWhiteboards((prev) => prev.filter((b) => b._id !== boardId));
      setDeleteModalBoard(null);
    } catch (err: any) {
      console.error("Failed to delete whiteboard:", err);
      setDeleteError(err.message || "Failed to delete whiteboard");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & sort whiteboards
  const filteredBoards = useMemo(() => {
    return whiteboards
      .filter((b) => {
        if (activeTab === "favorites" && !b.isFavorite) return false;
        if (activeTab === "my") {
          const isMe =
            (b.authorName && currentUserName && b.authorName.toLowerCase() === currentUserName.toLowerCase()) ||
            (b.authorId && currentUserId && b.authorId === currentUserId);
          if (!isMe) return false;
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            b.title.toLowerCase().includes(q) ||
            (b.description && b.description.toLowerCase().includes(q)) ||
            (b.authorName && b.authorName.toLowerCase().includes(q))
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
  }, [whiteboards, activeTab, searchQuery, sortOrder, currentUserName, currentUserId]);

  const favoritesCount = whiteboards.filter((b) => b.isFavorite).length;
  const myBoardsCount = whiteboards.filter(
    (b) =>
      (b.authorName && currentUserName && b.authorName.toLowerCase() === currentUserName.toLowerCase()) ||
      (b.authorId && currentUserId && b.authorId === currentUserId)
  ).length;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#0D0E11] text-[#E1DFDD]">
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 shrink-0 border-r border-[#22242B] bg-[#121316] flex flex-col justify-between">
        <div className="p-4 border-b border-[#22242B]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>Whiteboards</span>
            </h1>
            <button
              onClick={() => openCreateModal("blank")}
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
                  {(currentUserName || "U")[0]?.toUpperCase()}
                </span>
                <span>My Whiteboards</span>
              </div>
              <span className="text-[11px] text-gray-500 font-semibold">{myBoardsCount}</span>
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
                  onClick={() => openCreateModal("blank")}
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
                    onClick={() => openCreateModal(tmpl.id, tmpl.title)}
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
          {/* Templates Row */}
          <div>
            <div className="text-xs font-semibold text-gray-400 mb-3">Templates & Functional Areas</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {WHITEBOARD_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => openCreateModal(tmpl.id, tmpl.title)}
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

          {/* Filter Bar */}
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
                  placeholder="Search whiteboards or creator..."
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

          {/* Whiteboards Grid / List */}
          {filteredBoards.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#22242B] rounded-xl bg-[#121316]">
              <Presentation className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">No whiteboards found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Create a new whiteboard from scratch or pick a template above to get started.
              </p>
              <button
                onClick={() => openCreateModal("org-chart", "Organizational Chart")}
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

                    {/* Security & Access Badges on top-left of Card */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20">
                      {board.isProtected && (
                        <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur text-[10px] text-amber-300 font-semibold flex items-center gap-1 border border-amber-500/40 shadow-xs">
                          <Lock className="w-2.5 h-2.5 text-amber-400" />
                          <span>{board.securityType === "password" ? "Pass Protected" : "PIN Protected"}</span>
                        </span>
                      )}
                      {board.publicEdit === false && (
                        <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur text-[10px] text-blue-300 font-semibold flex items-center gap-1 border border-blue-500/40 shadow-xs">
                          <Shield className="w-2.5 h-2.5 text-blue-400" />
                          <span>Approval Req</span>
                        </span>
                      )}
                    </div>

                    {/* Top Right Action Buttons (Favorite + Settings + Delete) */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-20">
                      <button
                        onClick={(e) => handleToggleFavorite(board._id, Boolean(board.isFavorite), e)}
                        className="p-1 rounded-md bg-[#16171E]/80 hover:bg-[#202229] text-gray-400 hover:text-amber-400 transition-colors"
                        title={board.isFavorite ? "Unstar" : "Star favorite"}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            board.isFavorite ? "text-amber-400 fill-amber-400" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setSettingsModalBoard(board);
                        }}
                        className="p-1 rounded-md bg-[#16171E]/80 hover:bg-[#202229] text-gray-400 hover:text-blue-400 transition-colors"
                        title="Whiteboard Security Settings & Approval Token"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(board, e)}
                        className="p-1 rounded-md bg-[#16171E]/80 hover:bg-rose-950/60 text-gray-400 hover:text-rose-400 transition-colors"
                        title={
                          board.isProtected && board.deleteRequiresPass
                            ? "Delete Whiteboard (PIN/Pass Required)"
                            : "Delete Whiteboard"
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Footer Info with Creator Name prominent */}
                  <div className="p-3.5 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                          {board.title}
                        </h4>
                        {/* Clear Creator user name on card so office staff know whom to ask */}
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-300 mt-1 font-medium truncate">
                          <User className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="text-gray-400">Creator:</span>
                          <span className="text-white font-semibold truncate">
                            {board.authorName || "Office Creator"}
                          </span>
                        </div>
                      </div>

                      {/* Author Initials Badge */}
                      <div
                        className="w-6 h-6 rounded-full bg-[#2A2D36] text-gray-200 font-bold text-[10px] flex items-center justify-center shrink-0 border border-[#383C48]"
                        title={`Created by ${board.authorName || "Creator"}`}
                      >
                        {board.authorInitials || "HS"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-[#1C1E26]">
                      <span>
                        Edited{" "}
                        {board.updatedAt
                          ? new Date(board.updatedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Recently"}
                      </span>
                      <span>
                        {board.publicEdit === false ? "Restricted" : "Public Edit"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="border border-[#22242B] rounded-xl overflow-hidden bg-[#14151B]">
              {filteredBoards.map((board, idx) => (
                <div
                  key={board._id}
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
                    <Link href={`/whiteboards/${board._id}`} className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white hover:text-blue-400 transition-colors truncate">
                          {board.title}
                        </h4>
                        {board.isProtected && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-[10px] text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            {board.securityType === "password" ? "Password" : "PIN"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1 text-gray-300">
                          <User className="w-3 h-3 text-blue-400" />
                          <span className="text-gray-400">Creator:</span>
                          <strong className="text-white font-semibold">
                            {board.authorName || "Office Creator"}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>{board.description || "Interactive canvas"}</span>
                      </div>
                    </Link>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>
                      {board.updatedAt ? new Date(board.updatedAt).toLocaleDateString() : "Today"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setSettingsModalBoard(board);
                      }}
                      className="p-1.5 rounded text-gray-400 hover:text-blue-400 hover:bg-[#202229] transition-colors"
                      title="Whiteboard Security Settings & Approval Token"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(board, e)}
                      className="p-1.5 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Delete Whiteboard"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div
                      className="w-6 h-6 rounded-full bg-[#2A2D36] text-gray-200 font-bold text-[10px] flex items-center justify-center border border-[#383C48]"
                      title={`Created by ${board.authorName || "Creator"}`}
                    >
                      {board.authorInitials || "HS"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* CREATE WHITEBOARD MODAL (Creator Name + 4-digit PIN / 6-char Password Option) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#16171D] border border-[#2B2D38] rounded-xl max-w-md w-full shadow-2xl p-5 text-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#242630]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Presentation className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Create New Whiteboard</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCreate} className="mt-4 space-y-4 text-xs">
              {/* Whiteboard Title */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  Whiteboard Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q4 Strategy Blueprint"
                  className="w-full px-3 py-2 rounded-lg bg-[#0F1014] border border-[#282A35] text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-500 text-xs"
                  required
                />
              </div>

              {/* Creator Name Setting */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Who is creating this whiteboard?</span>
                </label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="Creator Name (e.g. Satyam, Elena)"
                  className="w-full px-3 py-2 rounded-lg bg-[#0F1014] border border-[#282A35] text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-500 text-xs"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  This creator name is displayed on the card so office colleagues know whom to ask for edit approval.
                </p>
              </div>

              {/* Protection Option Tick */}
              <div className="pt-2 border-t border-[#22242E]">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableSecurity}
                    onChange={(e) => setEnableSecurity(e.target.checked)}
                    className="mt-0.5 rounded bg-[#0F1014] border-[#2E313D] text-blue-600 focus:ring-0"
                  />
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Protect whiteboard with PIN or Password</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Require a PIN/Password to delete and manage permissions.
                    </p>
                  </div>
                </label>

                {/* Sub-form when Security is Checked */}
                {enableSecurity && (
                  <div className="mt-3 p-3.5 rounded-lg bg-[#111216] border border-[#282A35] space-y-3 animate-in fade-in-50">
                    <div>
                      <span className="block text-[11px] font-semibold text-gray-300 mb-1.5">
                        Choose Security Type:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <label
                          className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                            securityType === "pin"
                              ? "bg-blue-950/40 border-blue-500/60 text-white"
                              : "bg-[#16171E] border-[#262832] text-gray-400 hover:text-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="securityType"
                            checked={securityType === "pin"}
                            onChange={() => {
                              setSecurityType("pin");
                              setPasswordInput("");
                              setConfirmPasswordInput("");
                            }}
                            className="sr-only"
                          />
                          <Key className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-semibold text-[11px]">4-Digit PIN</span>
                        </label>

                        <label
                          className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                            securityType === "password"
                              ? "bg-blue-950/40 border-blue-500/60 text-white"
                              : "bg-[#16171E] border-[#262832] text-gray-400 hover:text-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="securityType"
                            checked={securityType === "password"}
                            onChange={() => {
                              setSecurityType("password");
                              setPasswordInput("");
                              setConfirmPasswordInput("");
                            }}
                            className="sr-only"
                          />
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-semibold text-[11px]">6-Char Password</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-300 mb-1">
                        {securityType === "pin" ? "Enter 4-Digit PIN:" : "Enter 6-Character Password:"}
                      </label>
                      <input
                        type="password"
                        value={passwordInput}
                        maxLength={securityType === "pin" ? 4 : undefined}
                        onChange={(e) => {
                          const val = securityType === "pin" ? e.target.value.replace(/\D/g, "") : e.target.value;
                          setPasswordInput(val);
                        }}
                        placeholder={securityType === "pin" ? "e.g. 4829" : "e.g. Plan2026"}
                        className="w-full px-3 py-1.5 rounded-md bg-[#0C0D11] border border-[#2A2C38] text-white focus:outline-none focus:border-blue-500 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-300 mb-1">
                        Confirm {securityType === "pin" ? "PIN" : "Password"}:
                      </label>
                      <input
                        type="password"
                        value={confirmPasswordInput}
                        maxLength={securityType === "pin" ? 4 : undefined}
                        onChange={(e) => {
                          const val = securityType === "pin" ? e.target.value.replace(/\D/g, "") : e.target.value;
                          setConfirmPasswordInput(val);
                        }}
                        placeholder={securityType === "pin" ? "Re-enter 4-digit PIN" : "Re-enter password"}
                        className="w-full px-3 py-1.5 rounded-md bg-[#0C0D11] border border-[#2A2C38] text-white focus:outline-none focus:border-blue-500 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error Notice */}
              {createError && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#242630]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-white hover:bg-[#1E2028] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCreating ? "Creating..." : "Create Whiteboard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PASSWORD CONFIRMATION MODAL */}
      {deleteModalBoard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#16171D] border border-rose-900/40 rounded-xl max-w-sm w-full shadow-2xl p-5 text-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#242630]">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold text-white">Password Required to Delete</h3>
              </div>
              <button
                onClick={() => setDeleteModalBoard(null)}
                className="text-gray-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 text-xs space-y-3">
              <p className="text-gray-300">
                This whiteboard is protected with a{" "}
                <span className="font-semibold text-white">
                  {deleteModalBoard.securityType === "password" ? "6-character password" : "4-digit PIN"}
                </span>
                . Please enter the code set by{" "}
                <span className="font-semibold text-blue-400">
                  {deleteModalBoard.authorName || "the creator"}
                </span>{" "}
                to delete.
              </p>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                  Enter {deleteModalBoard.securityType === "password" ? "Password" : "4-Digit PIN"}:
                </label>
                <input
                  type="password"
                  value={deletePasswordInput}
                  onChange={(e) => setDeletePasswordInput(e.target.value)}
                  placeholder="Enter PIN or Password"
                  className="w-full px-3 py-2 rounded-lg bg-[#0E0F13] border border-[#2C2E3A] text-white focus:outline-none focus:border-rose-500 font-mono text-xs"
                  autoFocus
                />
              </div>

              {deleteError && (
                <div className="p-2 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#242630]">
                <button
                  type="button"
                  onClick={() => setDeleteModalBoard(null)}
                  className="px-3 py-1.5 rounded-md text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting || !deletePasswordInput.trim()}
                  onClick={() => executeDelete(deleteModalBoard._id, deletePasswordInput.trim())}
                  className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {isDeleting ? "Verifying..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHITEBOARD SECURITY & PERMISSIONS SETTINGS MODAL */}
      {settingsModalBoard && (
        <WhiteboardSettingsModal
          isOpen={Boolean(settingsModalBoard)}
          onClose={() => setSettingsModalBoard(null)}
          board={settingsModalBoard}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onSaveSuccess={(updated: WhiteboardSecuritySettings) => {
            setWhiteboards((prev) =>
              prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b))
            );
          }}
        />
      )}
    </div>
  );
}

