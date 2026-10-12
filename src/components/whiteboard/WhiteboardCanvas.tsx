"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  MousePointer,
  Hand,
  CheckSquare,
  PenTool,
  Square,
  Circle,
  Diamond,
  Triangle,
  Hexagon,
  MoveRight,
  MoveLeft,
  ArrowLeftRight,
  Minus,
  ArrowUpRight,
  StickyNote,
  Type,
  Maximize,
  Image as ImageIcon,
  Palette,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  MoreHorizontal,
  Bold,
  Italic,
  Code,
  List,
  Sparkles,
  Save,
  HelpCircle,
  X,
  FileText,
  Calendar,
  GitFork,
  Kanban,
  LayoutGrid,
  Layers,
  Upload,
  Minimize2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Cloud,
  CloudOff,
  AlertTriangle,
  ExternalLink,
  Download,
  FileCode,
  Loader2,
  Network,
  File,
  ListTodo,
  Compass,
  RefreshCcwIcon,
  Braces,
  FileUp,
  Eye,
  Edit3,
  Link2,
  Unlink,
  ChevronDown,
  Boxes,
  Table,
} from "lucide-react";
import { IWhiteboardNode, IWhiteboardEdge } from "@/models/whiteboard";
import {
  ICON_GALLERY_GROUPS,
  IIconGalleryItem,
  IconGroupType,
  getLucideIcon,
  filterIconGalleryItems,
} from "@/lib/whiteboardIconGallery";
import { WHITEBOARD_TEMPLATES, createFunctionalArea } from "@/lib/whiteboardTemplates";
import {
  parseNodeChecklist,
  serializeChecklistToBody,
  toggleChecklistItem,
  updateChecklistItemText,
  addChecklistItem,
  insertChecklistItemAfter,
  deleteChecklistItem,
  getStickyTextColor,
} from "@/lib/whiteboardChecklist";
import {
  DEFAULT_TEXT_NOTE,
  DEFAULT_JSON_NOTE,
  DEFAULT_MARKDOWN_NOTE,
  validateJson,
  renderJsonSyntaxHighlighted,
  renderMarkdownToJsx,
  toggleMarkdownCheckbox,
  NoteFormat,
} from "@/lib/whiteboardMarkdownAndJson";
import { RxReset } from "react-icons/rx";

interface WhiteboardCanvasProps {
  initialBoard: {
    _id: string;
    title: string;
    description?: string;
    templateId?: string;
    isFavorite?: boolean;
    authorName?: string;
    authorInitials?: string;
    nodes: IWhiteboardNode[];
    edges: IWhiteboardEdge[];
    backgroundColor?: string;
    updatedAt?: string | Date;
  };
  currentUserName: string;
}

const CANVAS_BG_THEMES = [
  { name: "Dark (Default)", label: "Dark", value: "#0D0E11" },
  { name: "Light (Clean)", label: "Light", value: "#F8FAFC" },
  { name: "Light Yellow (Paper)", label: "Yellow", value: "#FEF9C3" },
  { name: "Soft Green (Sage)", label: "Green", value: "#DCFCE7" },
  { name: "Soft Blue (Sky)", label: "Blue", value: "#E0F2FE" },
  { name: "Dark Slate", label: "Slate", value: "#1E293B" },
  { name: "Deep Navy", label: "Navy", value: "#0A192F" },
  { name: "Charcoal", label: "Charcoal", value: "#18181B" },
];

function isLightBackground(hex: string): boolean {
  if (!hex) return false;
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }
  return false;
}

const COLOR_PALETTE = [
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Green", value: "#10B981" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Blue", value: "#0078D4" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Dark Grey", value: "#374151" },
  { name: "White", value: "#FFFFFF" },
];

export function parseFontSizePx(fontSize?: string | number, defaultPx: number = 13): number {
  if (typeof fontSize === "number" && !isNaN(fontSize) && fontSize > 0) return Math.round(fontSize);
  if (!fontSize) return defaultPx;
  const str = String(fontSize).trim().toLowerCase();
  const parsed = parseInt(str, 10);
  if (!isNaN(parsed) && parsed > 0) return parsed;
  switch (str) {
    case "huge":
      return 28;
    case "large":
      return 20;
    case "medium":
      return 14;
    case "small":
      return 11;
    default:
      return defaultPx;
  }
}

function FontSizeControl({
  fontSize,
  onChange,
  defaultPx = 13,
}: {
  fontSize?: string;
  onChange: (newSize: string) => void;
  defaultPx?: number;
}) {
  const currentPx = parseFontSizePx(fontSize, defaultPx);
  const [localVal, setLocalVal] = useState<string>(String(currentPx));

  useEffect(() => {
    setLocalVal(String(currentPx));
  }, [currentPx]);

  const commitVal = (valStr: string) => {
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.max(6, Math.min(150, parsed));
      setLocalVal(String(clamped));
      onChange(`${clamped}px`);
    } else {
      setLocalVal(String(currentPx));
    }
  };

  return (
    <div
      className="flex items-center bg-[#121316] rounded border border-[#282B33] px-1 py-0.5 gap-0.5 focus-within:border-blue-500 hover:border-gray-600 transition-colors"
      title="Text font size in pixels (type or use +/- or arrow keys)"
    >
      <button
        type="button"
        onClick={() => {
          const next = Math.max(6, currentPx - 1);
          setLocalVal(String(next));
          onChange(`${next}px`);
        }}
        className="w-3.5 h-4 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#202228] rounded text-[10px] font-bold cursor-pointer select-none transition-colors"
        title="Decrease font size (-1px)"
      >
        -
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={localVal}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, "");
          setLocalVal(raw);
          const parsed = parseInt(raw, 10);
          if (!isNaN(parsed) && parsed >= 6 && parsed <= 150) {
            onChange(`${parsed}px`);
          }
        }}
        onBlur={() => commitVal(localVal)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commitVal(localVal);
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const next = Math.min(150, currentPx + 1);
            setLocalVal(String(next));
            onChange(`${next}px`);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = Math.max(6, currentPx - 1);
            setLocalVal(String(next));
            onChange(`${next}px`);
          }
        }}
        className="w-7 bg-transparent text-[11px] font-mono text-center text-white focus:outline-none"
        aria-label="Text size in pixels"
      />
      <span className="text-[10px] text-gray-400 font-mono select-none pr-0.5">px</span>
      <button
        type="button"
        onClick={() => {
          const next = Math.min(150, currentPx + 1);
          setLocalVal(String(next));
          onChange(`${next}px`);
        }}
        className="w-3.5 h-4 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#202228] rounded text-[10px] font-bold cursor-pointer select-none transition-colors"
        title="Increase font size (+1px)"
      >
        +
      </button>
    </div>
  );
}

const TEXT_COLOR_PALETTE = [
  { name: "White", value: "#FFFFFF" },
  { name: "Light Gray", value: "#E2E8F0" },
  { name: "Slate", value: "#94A3B8" },
  { name: "Dark", value: "#1E293B" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Yellow", value: "#FACC15" },
  { name: "Emerald", value: "#10B981" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
];

function TextColorPicker({
  value,
  onChange,
  defaultColor = "#FFFFFF",
}: {
  value?: string;
  onChange: (color: string) => void;
  defaultColor?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const currentColor = value || defaultColor;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex flex-col items-center justify-center w-6 h-6 rounded hover:bg-[#282A33] px-1 py-0.5 cursor-pointer transition-colors group ${isOpen ? "bg-[#282A33]" : ""
          }`}
        title={`Text Color (${currentColor})`}
        aria-label="Text Color"
      >
        <span className="text-[11px] font-bold text-gray-200 group-hover:text-white leading-none font-serif">
          A
        </span>
        <span
          className="w-3.5 h-[3px] rounded-full mt-0.5 shadow-xs border border-black/40"
          style={{ backgroundColor: currentColor }}
        />
      </button>

      {isOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute top-full left-0 mt-2 p-2.5 bg-[#1A1C22] border border-[#2E313B] rounded-lg shadow-2xl z-50 flex flex-col gap-2 min-w-[190px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Text Color
            </span>
            <span className="text-[10px] font-mono text-gray-300 uppercase">
              {currentColor}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {TEXT_COLOR_PALETTE.map((c) => (
              <button
                key={c.name}
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(c.value);
                  setIsOpen(false);
                }}
                className={`w-5 h-5 rounded-full hover:scale-110 transition-transform border cursor-pointer ${currentColor.toLowerCase() === c.value.toLowerCase()
                  ? "ring-2 ring-blue-500 border-white scale-105"
                  : "border-white/20"
                  }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>

          <div className="pt-2 border-t border-[#2E313B] flex items-center justify-between gap-2 px-0.5">
            <span className="text-[11px] text-gray-400">Custom</span>
            <div className="flex items-center gap-1.5 bg-[#121316] px-1.5 py-0.5 rounded border border-[#282B33]">
              <input
                type="color"
                value={currentColor.startsWith("#") ? currentColor : "#FFFFFF"}
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => onChange(e.target.value)}
                className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
                title="Choose custom hex color"
              />
              <span className="text-[10px] font-mono text-gray-300 uppercase select-all">
                {currentColor}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WhiteboardCanvas({
  initialBoard,
  currentUserName,
}: WhiteboardCanvasProps) {
  const router = useRouter();

  // Canvas Metadata
  const [boardId, setBoardId] = useState(initialBoard._id);
  const boardIdRef = useRef<string>(boardId);
  useEffect(() => {
    boardIdRef.current = boardId;
  }, [boardId]);

  const [title, setTitle] = useState(initialBoard.title || "Organizational Chart");
  const titleRef = useRef<string>(title);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const [isFavorite, setIsFavorite] = useState(Boolean(initialBoard.isFavorite));
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // Canvas State: Nodes, Edges & Background Color
  const [nodes, setNodes] = useState<IWhiteboardNode[]>(initialBoard.nodes || []);
  const [edges, setEdges] = useState<IWhiteboardEdge[]>(initialBoard.edges || []);
  const [canvasBgColor, setCanvasBgColor] = useState<string>(
    initialBoard.backgroundColor || "#0D0E11"
  );
  const [showBgColorPicker, setShowBgColorPicker] = useState<boolean>(false);
  const bgColorPickerRef = useRef<HTMLDivElement>(null);
  const canvasBgColorRef = useRef<string>(canvasBgColor);
  useEffect(() => {
    canvasBgColorRef.current = canvasBgColor;
  }, [canvasBgColor]);

  // Nodes & Edges refs to guarantee event handlers & pushHistory always read freshest state
  const nodesRef = useRef<IWhiteboardNode[]>(nodes);
  const edgesRef = useRef<IWhiteboardEdge[]>(edges);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  // Robust History Stack (Pre-initialized with the initial board snapshot so first actions can always be undone!)
  const historyStackRef = useRef<{ nodes: IWhiteboardNode[]; edges: IWhiteboardEdge[] }[]>([
    {
      nodes: JSON.parse(JSON.stringify(initialBoard.nodes || [])),
      edges: JSON.parse(JSON.stringify(initialBoard.edges || [])),
    },
  ]);
  const historyIndexRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Pan & Zoom
  const [zoom, setZoom] = useState<number>(0.5); // Default 30% matching screenshot 3
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanMouse, setStartPanMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Tools & Selection
  const [activeTool, setActiveTool] = useState<
    "select" | "hand" | "task" | "draw" | "shape" | "arrow" | "sticky" | "text" | "frame" | "line" | "arrow-line"
  >("select");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"title" | "subtitle" | null>(null);

  // Interactive Line Drawing on Canvas (Straight Line & Independent Arrow)
  const [interactiveLineDrawing, setInteractiveLineDrawing] = useState<{
    tool: "line" | "arrow-line";
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Interactive Line Tip Dragging State (Left tip vs Right tip rotatable drag)
  const [draggingLineTip, setDraggingLineTip] = useState<{
    nodeId: string;
    tip: "start" | "end";
    pinnedPoint: { x: number; y: number };
  } | null>(null);

  // Interactive Line Middle Dragging State (Drag from middle to move entire line/arrow)
  const [draggingLineMiddle, setDraggingLineMiddle] = useState<{
    nodeId: string;
    startX: number;
    startY: number;
    initialNode: { x: number; y: number };
  } | null>(null);

  // Dragging Node & Temporary Group
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);
  const [groupDragStartCoords, setGroupDragStartCoords] = useState<{ x: number; y: number } | null>(null);
  const [initialGroupNodePositions, setInitialGroupNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  // Rectangular Marquee Selection Box ("drag to select like rectangular selector")
  const [isSelectingBox, setIsSelectingBox] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Arrow Link ("aero link setting") and Branching State
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [edgeSettingsPopover, setEdgeSettingsPopover] = useState<{
    edgeId: string;
    x: number;
    y: number;
  } | null>(null);

  // Directional Arrow Connection State ("<- or -> or <->")
  const [arrowConnectType, setArrowConnectType] = useState<"forward" | "backward" | "bidirectional">("forward");
  const [connectingFromNodeId, setConnectingFromNodeId] = useState<string | null>(null);
  const [connectingMousePos, setConnectingMousePos] = useState<{ x: number; y: number } | null>(null);

  // Pen Freehand Drawing State ("draw by pen needed to activate")
  const [isDrawingPen, setIsDrawingPen] = useState(false);
  const [currentPenPoints, setCurrentPenPoints] = useState<{ x: number; y: number }[]>([]);
  const [penColor, setPenColor] = useState<string>("#EC4899");
  const [penStrokeWidth, setPenStrokeWidth] = useState<number>(3);

  // Popovers & Modals
  const [showShapePalette, setShowShapePalette] = useState(false);
  const [showStylePalette, setShowStylePalette] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const stylePaletteRef = useRef<HTMLDivElement>(null);
  const shapePaletteRef = useRef<HTMLDivElement>(null);
  const templateSelectorRef = useRef<HTMLDivElement>(null);

  // Minimap / Navigator Radar State in bottom-right corner ("small section at right corner which displays position ontime")
  const [showMinimap, setShowMinimap] = useState(true);
  const minimapSvgRef = useRef<SVGSVGElement | null>(null);
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: 1400,
    height: 900,
  });

  useEffect(() => {
    setIsMounted(true);
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Double Click Creation Popover (Prompt requirement: "functions double left click opens")
  const [doubleClickMenu, setDoubleClickMenu] = useState<{
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
  } | null>(null);

  // Styling properties for selected node
  const [activeFillType, setActiveFillType] = useState<"solid" | "tint" | "pattern" | "none">("solid");
  const [activeColor, setActiveColor] = useState<string>("#0078D4");

  // Drag movement candidate tracking (allows dragging group entities while single-clicking selects individual nodes for editing)
  const clickedCandidateNodeRef = useRef<{ node: IWhiteboardNode; wasMultiSelected: boolean } | null>(null);
  const hasActuallyMovedDragRef = useRef(false);

  // Fullscreen state (True edge-to-edge full screen with zero borders/margins)
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Interactive Resizing State (8-point resize handles)
  const [resizing, setResizing] = useState<{
    nodeId: string;
    handle: string;
    startX: number;
    startY: number;
    initialNode: { x: number; y: number; width: number; height: number };
  } | null>(null);

  // Interactive Task Card Divider Resizing State (Header vs Bottom height split)
  const [resizingDivider, setResizingDivider] = useState<{
    nodeId: string;
    startY: number;
    initialHeaderHeight: number;
    nodeHeight: number;
  } | null>(null);

  // Shape switcher popover for selected shape node
  const [showShapeSwitcher, setShowShapeSwitcher] = useState(false);
  const shapeSwitcherRef = useRef<HTMLDivElement>(null);
  // Multi-selection link options dropdown menu
  const [showLinkMenu, setShowLinkMenu] = useState(false);

  // Tech, Product & Flow Icons Gallery Popover Drawer
  const [showIconGallery, setShowIconGallery] = useState(false);
  const [iconGallerySearch, setIconGallerySearch] = useState("");
  const [iconGalleryActiveTab, setIconGalleryActiveTab] = useState<IconGroupType | "all">("all");
  const iconGalleryRef = useRef<HTMLDivElement>(null);

  // Table Grid Creation Popover State (Rows x Cols of Boxes)
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableGap, setTableGap] = useState(0);
  const [hoveredGridCell, setHoveredGridCell] = useState<{ r: number; c: number } | null>(null);
  const tableDialogRef = useRef<HTMLDivElement>(null);

  // Direct file upload ref for images, SVGs, graphs, diagrams
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Direct file import ref for .md, .json, .txt into formatted sticky notes
  const directFileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFileOver, setIsDraggingFileOver] = useState(false);
  const [isDraggingItemOver, setIsDraggingItemOver] = useState(false);

  // S3 object deletion modal & notification state ("Delete from here" vs "Delete here + S3")
  const [s3DeleteModal, setS3DeleteModal] = useState<{
    nodeIds: string[];
    s3Nodes: IWhiteboardNode[];
  } | null>(null);
  const [isDeletingFromS3, setIsDeletingFromS3] = useState(false);
  const [deleteToastMessage, setDeleteToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Temporary toast banner notification for user feedback
  const showTemporaryToast = useCallback((msg: string) => {
    setDeleteToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setDeleteToastMessage(null);
    }, 4500);
  }, []);

  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const clipboardGroupRef = useRef<{
    nodes: IWhiteboardNode[];
    edges: IWhiteboardEdge[];
  } | null>(null);

  // Auto-save with instant localStorage cache and debounced server sync
  const triggerAutoSave = useCallback(
    (
      newNodes: IWhiteboardNode[],
      newEdges: IWhiteboardEdge[],
      newTitle?: string,
      newBgColor?: string,
      immediate?: boolean
    ) => {
      setSaveStatus("unsaved");
      const currentBg = newBgColor !== undefined ? newBgColor : canvasBgColorRef.current;
      const currentTitle = newTitle !== undefined ? newTitle : titleRef.current;

      // Update refs synchronously so unmount or event handlers read current state instantly
      nodesRef.current = newNodes;
      edgesRef.current = newEdges;
      if (newBgColor !== undefined) {
        canvasBgColorRef.current = newBgColor;
      }
      if (newTitle !== undefined) {
        titleRef.current = newTitle;
      }

      // 1. Instant local persistence cache (0ms latency, eliminates data loss on crash/reload)
      try {
        if (typeof window !== "undefined") {
          const snapshot = {
            title: currentTitle,
            nodes: newNodes,
            edges: newEdges,
            backgroundColor: currentBg,
            savedAt: Date.now(),
          };
          const jsonStr = JSON.stringify(snapshot);
          const activeId = boardIdRef.current || boardId || "default-org-chart";
          localStorage.setItem(`taskflow_wb_cache_${activeId}`, jsonStr);

          // If working on default or org-chart template, also write to default keys
          if (
            activeId === "default-org-chart" ||
            activeId === "org-chart" ||
            activeId === "default" ||
            !activeId
          ) {
            localStorage.setItem("taskflow_wb_cache_default-org-chart", jsonStr);
            localStorage.setItem("taskflow_wb_cache_org-chart", jsonStr);
          }
        }
      } catch {
        // Handle storage quota exceeded gracefully
      }

      // 2. Background sync to MongoDB (0ms if immediate, else 400ms debounce)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      const doSync = async () => {
        const activeId = boardIdRef.current || boardId || "default-org-chart";
        try {
          setSaveStatus("saving");
          const res = await fetch(`/api/whiteboards/${activeId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: currentTitle,
              nodes: newNodes,
              edges: newEdges,
              isFavorite,
              backgroundColor: currentBg,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.whiteboard?._id) {
              const newServerId = String(data.whiteboard._id);
              if (newServerId !== activeId && activeId === "default-org-chart") {
                setBoardId(newServerId);
                boardIdRef.current = newServerId;
                try {
                  if (typeof window !== "undefined") {
                    localStorage.setItem(
                      `taskflow_wb_cache_${newServerId}`,
                      JSON.stringify({
                        title: currentTitle,
                        nodes: newNodes,
                        edges: newEdges,
                        backgroundColor: currentBg,
                        savedAt: Date.now(),
                      })
                    );
                  }
                } catch { }
              }
            }
            setSaveStatus("saved");
          } else {
            setSaveStatus("unsaved");
          }
        } catch (err) {
          console.error("Auto-save failed:", err);
          setSaveStatus("unsaved");
        }
      };

      if (immediate) {
        doSync();
      } else {
        saveTimeoutRef.current = setTimeout(doSync, 400);
      }
    },
    [boardId, isFavorite]
  );

  // Hydrate from localStorage on initial load if local cache is valid
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const activeId = boardId || "default-org-chart";
        const cacheKeys = [
          `taskflow_wb_cache_${activeId}`,
          "taskflow_wb_cache_default-org-chart",
          "taskflow_wb_cache_org-chart",
        ];

        let cached: any = null;
        for (const key of cacheKeys) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (
                parsed &&
                (parsed.backgroundColor || (Array.isArray(parsed.nodes) && parsed.nodes.length > 0))
              ) {
                cached = parsed;
                break;
              }
            } catch { }
          }
        }

        if (cached) {
          // 1. Restore canvas background color if present in cache
          if (cached.backgroundColor) {
            setCanvasBgColor(cached.backgroundColor);
            canvasBgColorRef.current = cached.backgroundColor;
          }

          // 2. Restore nodes, edges & title if cache exists
          if (Array.isArray(cached.nodes) && cached.nodes.length > 0) {
            const initialTime = initialBoard.updatedAt
              ? new Date(initialBoard.updatedAt).getTime()
              : 0;
            const cacheTime = cached.savedAt || 0;

            const isDefaultOrTemplate =
              !activeId ||
              activeId === "default-org-chart" ||
              activeId === "org-chart" ||
              activeId === "default" ||
              !initialBoard.updatedAt;

            if (isDefaultOrTemplate || cacheTime >= initialTime - 5000) {
              setNodes(cached.nodes);
              nodesRef.current = cached.nodes;
              if (Array.isArray(cached.edges)) {
                setEdges(cached.edges);
                edgesRef.current = cached.edges;
              }
              if (cached.title) {
                setTitle(cached.title);
                titleRef.current = cached.title;
              }
              historyStackRef.current = [
                {
                  nodes: JSON.parse(JSON.stringify(cached.nodes)),
                  edges: JSON.parse(JSON.stringify(cached.edges || [])),
                },
              ];
              historyIndexRef.current = 0;
            }
          }
        }
      }
    } catch (err) {
      console.error("Hydration from cache failed:", err);
    }
  }, [boardId, initialBoard.updatedAt]);

  // Flush latest canvas state on page refresh or unload to guarantee zero data loss
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        if (typeof window !== "undefined") {
          const activeId = boardIdRef.current || boardId || "default-org-chart";
          const snapshot = {
            title: titleRef.current,
            nodes: nodesRef.current,
            edges: edgesRef.current,
            backgroundColor: canvasBgColorRef.current,
            savedAt: Date.now(),
          };
          const jsonSnap = JSON.stringify(snapshot);
          localStorage.setItem(`taskflow_wb_cache_${activeId}`, jsonSnap);
          localStorage.setItem("taskflow_wb_cache_default-org-chart", jsonSnap);
          localStorage.setItem("taskflow_wb_cache_org-chart", jsonSnap);

          fetch(`/api/whiteboards/${activeId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: titleRef.current,
              nodes: nodesRef.current,
              edges: edgesRef.current,
              isFavorite,
              backgroundColor: canvasBgColorRef.current,
            }),
            keepalive: true,
          }).catch(() => { });
        }
      } catch { }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [boardId, isFavorite]);

  // Clean up RAF and timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Dismiss canvas background color picker and tool palettes on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (bgColorPickerRef.current && !bgColorPickerRef.current.contains(target)) {
        setShowBgColorPicker(false);
      }
      if (stylePaletteRef.current && !stylePaletteRef.current.contains(target)) {
        const inFormatBarPalette = (target as HTMLElement).closest?.("[data-palette-container='true']");
        if (!inFormatBarPalette) {
          setShowStylePalette(false);
        }
      }
      if (shapePaletteRef.current && !shapePaletteRef.current.contains(target)) {
        setShowShapePalette(false);
      }
      if (templateSelectorRef.current && !templateSelectorRef.current.contains(target)) {
        setShowTemplateSelector(false);
      }
      if (shapeSwitcherRef.current && !shapeSwitcherRef.current.contains(target)) {
        setShowShapeSwitcher(false);
      }
      if (iconGalleryRef.current && !iconGalleryRef.current.contains(target)) {
        setShowIconGallery(false);
      }
      if (tableDialogRef.current && !tableDialogRef.current.contains(target)) {
        setShowTableDialog(false);
      }
    }
    if (
      showBgColorPicker ||
      showStylePalette ||
      showShapePalette ||
      showTemplateSelector ||
      showShapeSwitcher ||
      showIconGallery ||
      showTableDialog
    ) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [
    showBgColorPicker,
    showStylePalette,
    showShapePalette,
    showTemplateSelector,
    showShapeSwitcher,
    showIconGallery,
    showTableDialog,
  ]);

  // Push history state with deep clone & boundary checks
  const pushHistory = useCallback(
    (newNodes: IWhiteboardNode[], newEdges: IWhiteboardEdge[]) => {
      const clonedNodes = JSON.parse(JSON.stringify(newNodes));
      const clonedEdges = JSON.parse(JSON.stringify(newEdges));

      const currentIndex = historyIndexRef.current;
      const currentStack = historyStackRef.current.slice(0, currentIndex + 1);

      // Skip duplicate consecutive state pushes
      const lastItem = currentStack[currentStack.length - 1];
      if (
        lastItem &&
        JSON.stringify(lastItem.nodes) === JSON.stringify(clonedNodes) &&
        JSON.stringify(lastItem.edges) === JSON.stringify(clonedEdges)
      ) {
        return;
      }

      if (currentStack.length >= 60) {
        currentStack.shift();
      }

      currentStack.push({ nodes: clonedNodes, edges: clonedEdges });
      historyStackRef.current = currentStack;
      historyIndexRef.current = currentStack.length - 1;

      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(false);

      triggerAutoSave(newNodes, newEdges);
    },
    [triggerAutoSave]
  );

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      const prevIndex = historyIndexRef.current - 1;
      historyIndexRef.current = prevIndex;
      const snapshot = historyStackRef.current[prevIndex];
      if (snapshot) {
        const restoredNodes = JSON.parse(JSON.stringify(snapshot.nodes));
        const restoredEdges = JSON.parse(JSON.stringify(snapshot.edges));
        setNodes(restoredNodes);
        setEdges(restoredEdges);
        setSelectedNodeId(null);
        setSelectedNodeIds([]);
        setEditingNodeId(null);

        setCanUndo(prevIndex > 0);
        setCanRedo(prevIndex < historyStackRef.current.length - 1);

        triggerAutoSave(restoredNodes, restoredEdges);
      }
    }
  }, [triggerAutoSave]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      const nextIndex = historyIndexRef.current + 1;
      historyIndexRef.current = nextIndex;
      const snapshot = historyStackRef.current[nextIndex];
      if (snapshot) {
        const restoredNodes = JSON.parse(JSON.stringify(snapshot.nodes));
        const restoredEdges = JSON.parse(JSON.stringify(snapshot.edges));
        setNodes(restoredNodes);
        setEdges(restoredEdges);
        setSelectedNodeId(null);
        setSelectedNodeIds([]);
        setEditingNodeId(null);

        setCanUndo(nextIndex > 0);
        setCanRedo(nextIndex < historyStackRef.current.length - 1);

        triggerAutoSave(restoredNodes, restoredEdges);
      }
    }
  }, [triggerAutoSave]);

  // Convert Screen Coordinates to Canvas Coordinates
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x: Math.round(x), y: Math.round(y) };
  };

  // DOUBLE LEFT CLICK HANDLER
  // User Requirement: "we need to add whiteboard ,,functions double left click opens"
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    // If double clicking on the background canvas, open the quick creation menu at mouse position!
    if (e.target === canvasRef.current || (e.target as HTMLElement).id === "canvas-grid") {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setDoubleClickMenu({
        x: e.clientX,
        y: e.clientY,
        canvasX: coords.x,
        canvasY: coords.y,
      });
      setSelectedNodeId(null);
      setEditingNodeId(null);
    }
  };

  // Toggle Fullscreen (True edge-to-edge full screen with zero borders/margins)
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => { });
        }
      } catch { }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => { });
        }
      } catch { }
    }
  };

  // Listen to Escape key & browser fullscreen change to keep isFullscreen in sync
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    const handleFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFsChange);
    };
  }, [isFullscreen]);

  // GraphML XML Topology Parser Helper
  const parseGraphML = (xmlString: string) => {
    try {
      if (typeof window === "undefined") return { nodes: [], edges: [] };
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "application/xml");
      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        return { nodes: [], edges: [] };
      }

      const nodeElements = Array.from(xmlDoc.querySelectorAll("node"));
      const edgeElements = Array.from(xmlDoc.querySelectorAll("edge"));

      const parsedNodes = nodeElements.map((el, i) => {
        const id = el.getAttribute("id") || `node-${i + 1}`;
        const dataEls = Array.from(el.querySelectorAll("data"));
        let label = "";
        for (const d of dataEls) {
          const text = d.textContent?.trim();
          if (text && !text.startsWith("http") && text.length < 100) {
            label = text;
            break;
          }
        }
        return { id, label: label || id };
      });

      const parsedEdges = edgeElements
        .map((el, i) => {
          const from = el.getAttribute("source") || "";
          const to = el.getAttribute("target") || "";
          return { id: el.getAttribute("id") || `edge-${i + 1}`, from, to };
        })
        .filter((e) => Boolean(e.from && e.to));

      return { nodes: parsedNodes, edges: parsedEdges };
    } catch (err) {
      console.warn("Failed to parse GraphML XML:", err);
      return { nodes: [], edges: [] };
    }
  };

  // Convert GraphML nodes & edges directly into native interactive whiteboard shape cards on canvas
  const handleImportGraphMLToCanvas = (graphNode: IWhiteboardNode) => {
    if (!graphNode.previewText) return;
    const { nodes: gNodes, edges: gEdges } = parseGraphML(graphNode.previewText);
    if (gNodes.length === 0) return;

    const startX = graphNode.x + graphNode.width + 80;
    const startY = graphNode.y;
    const cols = Math.ceil(Math.sqrt(gNodes.length));
    const cellW = 180;
    const cellH = 90;

    const idMapping: Record<string, string> = {};
    const newCanvasNodes: IWhiteboardNode[] = gNodes.map((gn, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      const newId = `gnode-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
      idMapping[gn.id] = newId;

      return {
        id: newId,
        type: "shape",
        shapeType: "rounded",
        x: startX + c * (cellW + 40),
        y: startY + r * (cellH + 50),
        width: cellW,
        height: cellH,
        title: gn.label,
        subtitle: `GraphML: ${gn.id}`,
        color: "#8B5CF6",
        fillType: "solid",
        fontSize: "Medium",
        zIndex: nodes.length + idx + 1,
      };
    });

    const newCanvasEdges: IWhiteboardEdge[] = [];
    gEdges.forEach((ge, idx) => {
      const fromMapped = idMapping[ge.from];
      const toMapped = idMapping[ge.to];
      if (fromMapped && toMapped) {
        newCanvasEdges.push({
          id: `gedge-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          from: fromMapped,
          to: toMapped,
          color: "#A78BFA",
          style: "orthogonal",
          arrowDirection: "forward",
        });
      }
    });

    const updatedNodes = [...nodes, ...newCanvasNodes];
    const updatedEdges = [...edges, ...newCanvasEdges];
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    pushHistory(updatedNodes, updatedEdges);
  };

  // Direct File Upload & Drag-and-Drop Handler (Supports .graphml, .pdf, .json, .md, images, SVGs)
  // Uploads file directly to AWS S3 to prevent large base64 payloads from slowing Vercel/MongoDB down
  const processUploadedFiles = useCallback(
    async (files: FileList | File[], clientX?: number, clientY?: number) => {
      const coords =
        clientX !== undefined && clientY !== undefined
          ? getCanvasCoords(clientX, clientY)
          : { x: Math.round(-pan.x / zoom + 400), y: Math.round(-pan.y / zoom + 300) };

      const fileList = Array.from(files);

      for (let index = 0; index < fileList.length; index++) {
        const file = fileList[index];
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const isImage = file.type.startsWith("image/") || ext === "svg";
        const isPdf = ext === "pdf";
        const isGraphml = ext === "graphml" || (ext === "xml" && file.name.toLowerCase().includes("graph"));
        const isJson = ext === "json";
        const isMarkdown = ext === "md" || ext === "markdown";

        // Determine whiteboard node type
        let nodeType: "image" | "pdf" | "graphml" | "json" | "markdown" | "file" = "file";
        if (isImage) nodeType = "image";
        else if (isPdf) nodeType = "pdf";
        else if (isGraphml) nodeType = "graphml";
        else if (isJson) nodeType = "json";
        else if (isMarkdown) nodeType = "markdown";

        const tempId = `asset-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`;
        const localBlobUrl = isImage ? URL.createObjectURL(file) : "";

        // Read local text for instant zero-wait card preview
        let localPreviewText = "";
        const localMetaData: Record<string, any> = { isUploadingToS3: true };

        if (isGraphml || isJson || isMarkdown || ext === "txt") {
          try {
            const rawText = await file.text();
            localPreviewText = rawText.slice(0, 15000);
            if (isGraphml) {
              const parsed = parseGraphML(rawText);
              localMetaData.nodeCount = parsed.nodes.length;
              localMetaData.edgeCount = parsed.edges.length;
            } else if (isJson) {
              try {
                const j = JSON.parse(rawText);
                localMetaData.keyCount = typeof j === "object" && j !== null ? Object.keys(j).length : 0;
                localMetaData.isArray = Array.isArray(j);
              } catch { }
            }
          } catch { }
        }

        const initialW = isImage ? 320 : isPdf ? 300 : isGraphml ? 340 : isJson ? 340 : isMarkdown ? 340 : 280;
        const initialH = isImage ? 220 : isPdf ? 210 : isGraphml ? 220 : isJson ? 240 : isMarkdown ? 260 : 160;

        const optimisticNode: IWhiteboardNode = {
          id: tempId,
          type: nodeType,
          x: coords.x + index * 45,
          y: coords.y + index * 45,
          width: initialW,
          height: initialH,
          title: file.name,
          imageUrl: localBlobUrl,
          fileUrl: "",
          fileName: file.name,
          fileSize: file.size,
          fileExtension: ext,
          previewText: localPreviewText,
          metaData: localMetaData,
          zIndex: nodes.length + index + 2,
        };

        // Render optimistic node immediately so user perceives instant zero-lag action
        setNodes((prev) => [...prev, optimisticNode]);
        setSelectedNodeId(tempId);
        setSelectedNodeIds([tempId]);

        // Background stream to AWS S3 via /api/whiteboards/upload
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("boardId", boardId);

          const res = await fetch("/api/whiteboards/upload", {
            method: "POST",
            body: formData,
          });
          const json = await res.json();

          if (json.success && json.data) {
            const s3Data = json.data;
            setNodes((prev) => {
              const updated = prev.map((n) => {
                if (n.id === tempId) {
                  return {
                    ...n,
                    imageUrl: isImage ? s3Data.url : n.imageUrl, // Store clean S3 URL (no heavy base64!)
                    fileUrl: s3Data.url,
                    s3Key: s3Data.s3Key,
                    previewText: s3Data.previewText || n.previewText,
                    metaData: {
                      ...n.metaData,
                      ...s3Data.metaData,
                      isUploadingToS3: false,
                      s3Stored: true,
                    },
                  };
                }
                return n;
              });
              pushHistory(updated, edges);
              return updated;
            });
          } else {
            // S3 upload failed or warning: remove upload badge
            setNodes((prev) => {
              const updated = prev.map((n) =>
                n.id === tempId
                  ? {
                    ...n,
                    metaData: { ...n.metaData, isUploadingToS3: false, s3Error: json.error || "Upload warning" },
                  }
                  : n
              );
              pushHistory(updated, edges);
              return updated;
            });
          }
        } catch (uploadErr) {
          console.error("Whiteboard S3 upload failed:", uploadErr);
          setNodes((prev) => {
            const updated = prev.map((n) =>
              n.id === tempId
                ? { ...n, metaData: { ...n.metaData, isUploadingToS3: false, s3Error: "Network error" } }
                : n
            );
            pushHistory(updated, edges);
            return updated;
          });
        }
      }
    },
    [pan, zoom, nodes, edges, boardId]
  );

  // Global Clipboard Paste Listener (Ctrl+V paste screenshots/images directly from PC)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        processUploadedFiles(e.clipboardData.files);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processUploadedFiles]);

  // Duplicate Selected Node
  const handleDuplicateNode = (nodeId?: string) => {
    const targetId = nodeId || selectedNodeId;
    if (!targetId) return;
    const sourceNode = nodes.find((n) => n.id === targetId);
    if (!sourceNode) return;

    const newId = `${sourceNode.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const isLineOrDrawing =
      sourceNode.type === "line" ||
      sourceNode.shapeType === "line" ||
      sourceNode.shapeType === "arrow" ||
      sourceNode.type === "drawing";

    let clonedTitle = "";
    if (isLineOrDrawing) {
      // Lines, arrows, and drawings do not auto-generate unwanted "Copy" tags
      clonedTitle =
        sourceNode.title && !sourceNode.title.toLowerCase().includes("copy")
          ? sourceNode.title
          : "";
    } else {
      clonedTitle = sourceNode.title ? `${sourceNode.title}` : "Copy";
    }

    const clonedNode: IWhiteboardNode = {
      ...sourceNode,
      id: newId,
      groupId: undefined,
      x: sourceNode.x + 35,
      y: sourceNode.y + 35,
      title: clonedTitle,
      zIndex: nodes.length + 2,
    };

    const updated = [...nodes, clonedNode];
    setNodes(updated);
    pushHistory(updated, edges);
    setSelectedNodeId(newId);
    setSelectedNodeIds([newId]);
  };

  // Interactive 8-Point Resize Mouse Down
  const handleResizeMouseDown = (node: IWhiteboardNode, handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing({
      nodeId: node.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialNode: {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
      },
    });
  };

  // Interactive Task Card Divider Resizing Mouse Down
  const handleDividerMouseDown = (
    node: IWhiteboardNode,
    currentHeaderHeight: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedNodeId(node.id);
    setSelectedNodeIds([node.id]);
    setResizingDivider({
      nodeId: node.id,
      startY: e.clientY,
      initialHeaderHeight: currentHeaderHeight,
      nodeHeight: node.height,
    });
  };

  // Calculate Start & End Tips for Straight Lines & Independent Arrows
  const getLineEndpoints = useCallback(
    (node: IWhiteboardNode): { x1: number; y1: number; x2: number; y2: number } => {
      const m = node.metaData;
      if (m?.x1 !== undefined && m?.y1 !== undefined && m?.x2 !== undefined && m?.y2 !== undefined) {
        if (m.isRelative) {
          return {
            x1: node.x + m.x1,
            y1: node.y + m.y1,
            x2: node.x + m.x2,
            y2: node.y + m.y2,
          };
        }
        return {
          x1: m.x1,
          y1: m.y1,
          x2: m.x2,
          y2: m.y2,
        };
      }
      return {
        x1: node.x,
        y1: node.y + Math.round(node.height / 2),
        x2: node.x + node.width,
        y2: node.y + Math.round(node.height / 2),
      };
    },
    []
  );

  // Interactive Line Tip Drag (Rotatable & Extensible independent tip drag)
  const handleLineTipMouseDown = (
    node: IWhiteboardNode,
    tip: "start" | "end",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedNodeId(node.id);
    setSelectedNodeIds([node.id]);
    const { x1, y1, x2, y2 } = getLineEndpoints(node);
    setDraggingLineTip({
      nodeId: node.id,
      tip,
      pinnedPoint: tip === "start" ? { x: x2, y: y2 } : { x: x1, y: y1 },
    });
  };

  // Interactive Line Middle Drag (Move whole line by dragging from middle or stroke)
  const handleLineMiddleMouseDown = (node: IWhiteboardNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setSelectedNodeIds([node.id]);
    setDraggingLineMiddle({
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      initialNode: { x: node.x, y: node.y },
    });
  };

  // Node Double Click -> Enter inline editing & format bar
  const handleNodeDoubleClick = (node: IWhiteboardNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setSelectedNodeIds([node.id]);
    setEditingNodeId(node.id);
    setDoubleClickMenu(null);
  };

  // Toolbar Item Drag Start (Hold to drag options onto whiteboard canvas)
  const handleItemDragStart = (e: React.DragEvent, itemData: any) => {
    e.dataTransfer.setData("application/taskflow-item", JSON.stringify(itemData));
    e.dataTransfer.setData("text/plain", JSON.stringify(itemData));
    e.dataTransfer.effectAllowed = "copy";
  };

  // --- MINIMAP / NAVIGATOR RADAR LOGIC ("small section at right corner which displays position ontime") ---
  const minimapW = 200;
  const minimapH = 130;

  const mmContentBounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 1800, maxY: 1200 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n.width || 100));
      maxY = Math.max(maxY, n.y + (n.height || 60));
    }
    return {
      minX: Math.min(minX, 0),
      minY: Math.min(minY, 0),
      maxX: Math.max(maxX, 1600),
      maxY: Math.max(maxY, 1000),
    };
  }, [nodes]);

  const winWidth = viewportSize.width;
  const winHeight = viewportSize.height;
  const viewCanvasX = -pan.x / zoom;
  const viewCanvasY = -pan.y / zoom;
  const viewCanvasW = winWidth / zoom;
  const viewCanvasH = winHeight / zoom;

  const mmMinX = Math.min(mmContentBounds.minX, viewCanvasX) - 300;
  const mmMinY = Math.min(mmContentBounds.minY, viewCanvasY) - 300;
  const mmMaxX = Math.max(mmContentBounds.maxX, viewCanvasX + viewCanvasW) + 300;
  const mmMaxY = Math.max(mmContentBounds.maxY, viewCanvasY + viewCanvasH) + 300;

  const mmWorldW = Math.max(mmMaxX - mmMinX, 1000);
  const mmWorldH = Math.max(mmMaxY - mmMinY, 650);

  const mmScale = Math.min(minimapW / mmWorldW, minimapH / mmWorldH);
  const mmOffsetX = (minimapW - mmWorldW * mmScale) / 2;
  const mmOffsetY = (minimapH - mmWorldH * mmScale) / 2;

  const vpBoxX = mmOffsetX + (viewCanvasX - mmMinX) * mmScale;
  const vpBoxY = mmOffsetY + (viewCanvasY - mmMinY) * mmScale;
  const vpBoxW = Math.max(6, viewCanvasW * mmScale);
  const vpBoxH = Math.max(4, viewCanvasH * mmScale);

  const handleMinimapNav = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!minimapSvgRef.current) return;
      const rect = minimapSvgRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left - mmOffsetX;
      const clickY = e.clientY - rect.top - mmOffsetY;

      const targetWorldX = mmMinX + clickX / mmScale;
      const targetWorldY = mmMinY + clickY / mmScale;

      const wW = typeof window !== "undefined" ? window.innerWidth : 1400;
      const wH = typeof window !== "undefined" ? window.innerHeight : 900;

      setPan({
        x: Math.round(wW / 2 - targetWorldX * zoom),
        y: Math.round(wH / 2 - targetWorldY * zoom),
      });
    },
    [mmOffsetX, mmOffsetY, mmMinX, mmMinY, mmScale, zoom]
  );

  const handleFitAllToScreen = useCallback(() => {
    if (nodes.length === 0) {
      setPan({ x: 50, y: 50 });
      setZoom(0.8);
      return;
    }
    const margin = 120;
    const contentW = mmContentBounds.maxX - mmContentBounds.minX + margin * 2;
    const contentH = mmContentBounds.maxY - mmContentBounds.minY + margin * 2;
    const wW = typeof window !== "undefined" ? window.innerWidth : 1400;
    const wH = typeof window !== "undefined" ? window.innerHeight : 900;

    const fitZoom = Math.min(
      Math.max(wW / contentW, 0.15),
      Math.max(wH / contentH, 0.15),
      1.5
    );
    const newZoom = Number(fitZoom.toFixed(2));
    const centerX = (mmContentBounds.minX + mmContentBounds.maxX) / 2;
    const centerY = (mmContentBounds.minY + mmContentBounds.maxY) / 2;

    setZoom(newZoom);
    setPan({
      x: Math.round(wW / 2 - centerX * newZoom),
      y: Math.round(wH / 2 - centerY * newZoom),
    });
  }, [nodes, mmContentBounds]);

  // Add a node at specific canvas position
  const handleAddNode = (
    type: IWhiteboardNode["type"],
    shapeType: string = "rectangle",
    customColor?: string,
    isChecklist?: boolean,
    explicitCoords?: { x: number; y: number },
    noteFormat?: NoteFormat,
    initialTitle?: string,
    initialBody?: string,
    iconName?: string,
    subtitle?: string,
    iconGroup?: string
  ) => {
    const coords = explicitCoords
      ? explicitCoords
      : doubleClickMenu
        ? { x: doubleClickMenu.canvasX, y: doubleClickMenu.canvasY }
        : { x: Math.round(-pan.x / zoom + 400), y: Math.round(-pan.y / zoom + 300) };

    const newId = `node-${Date.now()}`;
    let newNode: IWhiteboardNode;

    if (type === "icon") {
      const nodeWidth = 80;
      const nodeHeight = 82;
      newNode = {
        id: newId,
        type: "icon",
        x: coords.x - Math.round(nodeWidth / 2),
        y: coords.y - Math.round(nodeHeight / 2),
        width: nodeWidth,
        height: nodeHeight,
        title: initialTitle || "Icon Node",
        subtitle: subtitle || "",
        iconName: iconName || "Database",
        iconGroup: iconGroup || "infra",
        color: customColor || "#0EA5E9",
        fillType: "solid",
        textColor: "#FFFFFF",
        fontSize: "12px",
        fontWeight: "bold",
        zIndex: nodes.length + 1,
      };
    } else if (type === "sticky") {
      const resolvedFormat: NoteFormat =
        noteFormat || (isChecklist ? "checklist" : "text");
      const isFormatChecklist = resolvedFormat === "checklist";
      const isFormatJson = resolvedFormat === "json";
      const isFormatMd = resolvedFormat === "markdown";

      const defaultChecklist = isFormatChecklist
        ? [
          { id: `c-${Date.now()}-1`, text: "Review milestone goals", completed: false },
          { id: `c-${Date.now()}-2`, text: "Update project whiteboard", completed: false },
          { id: `c-${Date.now()}-3`, text: "Sync with team squad", completed: false },
        ]
        : undefined;

      const resolvedTitle = initialTitle
        ? initialTitle
        : isFormatJson
          ? "data.json"
          : isFormatMd
            ? "notes.md"
            : isFormatChecklist
              ? "Action Items"
              : "notes.txt";

      const resolvedBody =
        initialBody !== undefined
          ? initialBody
          : isFormatJson
            ? DEFAULT_JSON_NOTE
            : isFormatMd
              ? DEFAULT_MARKDOWN_NOTE
              : isFormatChecklist
                ? serializeChecklistToBody(defaultChecklist!)
                : DEFAULT_TEXT_NOTE;

      const resolvedWidth = isFormatMd ? 320 : isFormatJson ? 300 : isFormatChecklist ? 240 : 220;
      const resolvedHeight = isFormatMd ? 320 : isFormatJson ? 280 : isFormatChecklist ? 220 : 200;
      const resolvedColor =
        customColor ||
        (isFormatJson ? "#F59E0B" : isFormatMd ? "#6366F1" : isFormatChecklist ? "#38BDF8" : "#EC4899");

      newNode = {
        id: newId,
        type: "sticky",
        x: coords.x - Math.round(resolvedWidth / 2),
        y: coords.y - Math.round(resolvedHeight / 2),
        width: resolvedWidth,
        height: resolvedHeight,
        title: resolvedTitle,
        body: resolvedBody,
        hasCheckbox: isFormatChecklist,
        checklist: defaultChecklist,
        noteFormat: resolvedFormat,
        color: resolvedColor,
        fillType: "tint",
        zIndex: nodes.length + 1,
      };
    } else if (type === "task") {
      newNode = {
        id: newId,
        type: "task",
        x: coords.x - 100,
        y: coords.y - 60,
        width: 200,
        height: 120,
        title: "Add a task here to represent this team member!",
        subtitle: "Team Member / Role",
        color: customColor || "#0078D4",
        fillType: "solid",
        status: "Active",
        zIndex: nodes.length + 1,
      };
    } else if (type === "text") {
      newNode = {
        id: newId,
        type: "text",
        x: coords.x - 70,
        y: coords.y - 30,
        width: 160,
        height: 50,
        title: "Text Block",
        color: "#FFFFFF",
        fillType: "none",
        zIndex: nodes.length + 1,
      };
    } else if (type === "image") {
      newNode = {
        id: newId,
        type: "image",
        x: coords.x - 120,
        y: coords.y - 80,
        width: 240,
        height: 160,
        title: "Image",
        imageUrl: "",
        zIndex: nodes.length + 1,
      };
    } else if (type === "line" || shapeType === "line" || shapeType === "arrow") {
      const isArrow = shapeType === "arrow";
      const lineLen = 180;
      const x1 = coords.x - Math.round(lineLen / 2);
      const y1 = coords.y;
      const x2 = coords.x + Math.round(lineLen / 2);
      const y2 = coords.y;
      newNode = {
        id: newId,
        type: "line",
        shapeType: isArrow ? "arrow" : "line",
        x: x1,
        y: y1,
        width: lineLen,
        height: 20,
        color: customColor || "#60A5FA",
        strokeWidth: 3,
        lineStyle: "solid",
        arrowDirection: isArrow ? "forward" : "none",
        title: "",
        zIndex: nodes.length + 1,
        metaData: {
          x1: 0,
          y1: 0,
          x2: lineLen,
          y2: 0,
          isRelative: true,
        },
      };
    } else {
      newNode = {
        id: newId,
        type: "shape",
        shapeType: (shapeType || "rectangle") as any,
        x: coords.x - 80,
        y: coords.y - 60,
        width: shapeType === "circle" ? 140 : 160,
        height: shapeType === "circle" ? 140 : 120,
        title: shapeType.charAt(0).toUpperCase() + shapeType.slice(1),
        body: "",
        color: customColor || activeColor,
        fillType: activeFillType,
        zIndex: nodes.length + 1,
      };
    }

    const updated = [...nodes, newNode];
    setNodes(updated);
    pushHistory(updated, edges);
    setSelectedNodeId(newId);
    setShowShapePalette(false);
    triggerAutoSave(updated, edges);
  };

  // Table Grid Generator: Asks row,col and creates those exact number of boxes in r,c arrangement without outer wall
  const handleCreateTableGrid = useCallback(
    (
      rowCount: number,
      colCount: number,
      gap: number = 0,
      customCoords?: { x: number; y: number }
    ) => {
      const rows = Math.max(1, Math.min(25, rowCount));
      const cols = Math.max(1, Math.min(25, colCount));
      const cellWidth = 140;
      const cellHeight = 60;
      const totalW = cols * cellWidth + Math.max(0, cols - 1) * gap;
      const totalH = rows * cellHeight + Math.max(0, rows - 1) * gap;

      const winW = typeof window !== "undefined" ? window.innerWidth : 1400;
      const winH = typeof window !== "undefined" ? window.innerHeight : 900;

      const startX = customCoords
        ? customCoords.x - Math.round(totalW / 2)
        : Math.round(-pan.x / zoom + winW / 2 / zoom - totalW / 2);
      const startY = customCoords
        ? customCoords.y - Math.round(totalH / 2)
        : Math.round(-pan.y / zoom + winH / 2 / zoom - totalH / 2);

      const tableGroupId = `group-table-${Date.now()}`;
      const newCells: IWhiteboardNode[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cellX = startX + c * (cellWidth + gap);
          const cellY = startY + r * (cellHeight + gap);
          const isHeader = r === 0 && rows > 1;

          newCells.push({
            id: `cell-${Date.now()}-${r}-${c}`,
            type: "shape",
            shapeType: "rectangle",
            x: cellX,
            y: cellY,
            width: cellWidth,
            height: cellHeight,
            title: isHeader ? `Header ${c + 1}` : `Row ${r + 1}, Col ${c + 1}`,
            color: isHeader ? "#0078D4" : "#1A1C24",
            fillType: "solid",
            textColor: "#FFFFFF",
            fontSize: "12px",
            fontWeight: isHeader ? "bold" : "normal",
            textAlign: "center",
            zIndex: 2,
            groupId: tableGroupId,
          });
        }
      }

      const updated = [...nodes, ...newCells];
      setNodes(updated);
      pushHistory(updated, edges);
      triggerAutoSave(updated, edges);

      const cellIds = newCells.map((n) => n.id);
      setSelectedNodeId(cellIds[0]);
      setSelectedNodeIds(cellIds);
      setShowTableDialog(false);
    },
    [pan, zoom, nodes, edges, pushHistory, triggerAutoSave]
  );

  // Insert complete functional area (Meeting Notes, Notes, Diagram, Project Planner)
  const handleInsertFunctionalArea = (
    areaType: "meeting-notes" | "notes" | "diagram" | "project-planner" | "org-chart",
    explicitCoords?: { x: number; y: number }
  ) => {
    const coords = explicitCoords
      ? explicitCoords
      : doubleClickMenu
        ? { x: doubleClickMenu.canvasX, y: doubleClickMenu.canvasY }
        : { x: Math.round(-pan.x / zoom + 200), y: Math.round(-pan.y / zoom + 150) };

    const { nodes: newNodes, edges: newEdges } = createFunctionalArea(areaType, coords.x, coords.y);
    const mergedNodes = [...nodes, ...newNodes];
    const mergedEdges = [...edges, ...newEdges];

    setNodes(mergedNodes);
    setEdges(mergedEdges);
    pushHistory(mergedNodes, mergedEdges);
    setDoubleClickMenu(null);
    setShowTemplateSelector(false);
    triggerAutoSave(mergedNodes, mergedEdges);
  };

  // Branching: Add a new branch node connected to edge parent alongside target
  const handleAddBranchFromEdge = (edgeId: string) => {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;
    const parentNode = nodes.find((n) => n.id === edge.from);
    const siblingNode = nodes.find((n) => n.id === edge.to);
    if (!parentNode) return;

    const templateNode = siblingNode || parentNode;

    // Calculate position: right next to siblingNode, or below parent
    const newX = siblingNode ? siblingNode.x + siblingNode.width + 40 : parentNode.x + 120;
    const newY = siblingNode ? siblingNode.y : parentNode.y + parentNode.height + 70;

    const newBranchId = `node-branch-${Date.now()}`;
    let newBranchNode: IWhiteboardNode;

    if (templateNode.type === "task") {
      // ONLY org task card branches another org task card!
      newBranchNode = {
        id: newBranchId,
        type: "task",
        x: newX,
        y: newY,
        width: templateNode.width || 160,
        height: templateNode.height || 96,
        title: "New Team Member",
        subtitle: "Position",
        color: templateNode.color || "#0078D4",
        headerHeight: templateNode.headerHeight,
        fillType: templateNode.fillType || "solid",
        zIndex: 2,
      };
    } else if (templateNode.type === "shape") {
      // Shapes create branches matching their shape geometry, color, and styling (e.g. simple rounded design like in Image 2)
      newBranchNode = {
        id: newBranchId,
        type: "shape",
        shapeType: templateNode.shapeType || "rounded",
        x: newX,
        y: newY,
        width: templateNode.width || 180,
        height: templateNode.height || 100,
        title: templateNode.title || (templateNode.shapeType === "rounded" ? "Rounded" : "Shape"),
        color: templateNode.color || "#F59E0B",
        fillType: templateNode.fillType || "solid",
        textColor: templateNode.textColor || "#FFFFFF",
        fontWeight: templateNode.fontWeight || "bold",
        fontSize: templateNode.fontSize || "14px",
        textAlign: templateNode.textAlign || "center",
        zIndex: 2,
      };
    } else if (templateNode.type === "sticky") {
      newBranchNode = {
        id: newBranchId,
        type: "sticky",
        noteFormat: templateNode.noteFormat || "text",
        x: newX,
        y: newY,
        width: templateNode.width || 200,
        height: templateNode.height || 180,
        title: templateNode.title || "Note",
        body: "",
        color: templateNode.color || "#EC4899",
        textColor: templateNode.textColor,
        fontSize: templateNode.fontSize,
        zIndex: 2,
      };
    } else {
      newBranchNode = {
        id: newBranchId,
        type: templateNode.type,
        shapeType: templateNode.shapeType || "rounded",
        x: newX,
        y: newY,
        width: templateNode.width || 180,
        height: templateNode.height || 100,
        title: templateNode.title || "Branch",
        color: templateNode.color || "#F59E0B",
        fillType: templateNode.fillType || "solid",
        textColor: templateNode.textColor || "#FFFFFF",
        zIndex: 2,
      };
    }

    const newEdgeId = `edge-branch-${Date.now()}`;
    const newEdge: IWhiteboardEdge = {
      id: newEdgeId,
      from: parentNode.id,
      to: newBranchId,
      fromAnchor: "bottom",
      toAnchor: "top",
      color: edge.color || "#60A5FA",
      style: "orthogonal",
      lineStyle: "solid",
      arrowDirection: "forward",
    };

    const updatedNodes = [...nodes, newBranchNode];
    const updatedEdges = [...edges, newEdge];
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    pushHistory(updatedNodes, updatedEdges);
    triggerAutoSave(updatedNodes, updatedEdges);

    setSelectedNodeId(newBranchId);
    setSelectedNodeIds([newBranchId]);
    setEdgeSettingsPopover(null);
  };

  // Branching: Add child branch directly from a node
  const handleAddBranchFromNode = (nodeId: string) => {
    const parentNode = nodes.find((n) => n.id === nodeId);
    if (!parentNode) return;

    const existingChildrenEdges = edges.filter((e) => e.from === nodeId);
    const existingChildren = nodes.filter((n) => existingChildrenEdges.some((e) => e.to === n.id));

    let newX = parentNode.x;
    let newY = parentNode.y + parentNode.height + 70;

    if (existingChildren.length > 0) {
      const rightmost = existingChildren.reduce((max, n) => (n.x > max.x ? n : max), existingChildren[0]);
      newX = rightmost.x + rightmost.width + 40;
      newY = rightmost.y;
    }

    const newBranchId = `node-branch-${Date.now()}`;
    let newBranchNode: IWhiteboardNode;

    if (parentNode.type === "icon") {
      newBranchNode = {
        id: newBranchId,
        type: "icon",
        iconName: parentNode.iconName || "Database",
        iconGroup: parentNode.iconGroup || "infra",
        x: newX,
        y: newY,
        width: parentNode.width || 80,
        height: parentNode.height || 82,
        title: parentNode.title || "Connected Node",
        subtitle: parentNode.subtitle || "",
        color: parentNode.color || "#0EA5E9",
        fillType: parentNode.fillType || "solid",
        textColor: parentNode.textColor || "#FFFFFF",
        fontWeight: parentNode.fontWeight || "bold",
        fontSize: parentNode.fontSize || "12px",
        zIndex: 2,
      };
    } else if (parentNode.type === "task") {
      // ONLY org task card branches another org task card!
      newBranchNode = {
        id: newBranchId,
        type: "task",
        x: newX,
        y: newY,
        width: parentNode.width || 160,
        height: parentNode.height || 96,
        title: "New Team Member",
        subtitle: "Position",
        color: parentNode.color || "#0078D4",
        headerHeight: parentNode.headerHeight,
        fillType: parentNode.fillType || "solid",
        zIndex: 2,
      };
    } else if (parentNode.type === "shape") {
      // Shapes create branches matching their shape geometry, color, and styling (e.g. simple rounded design like in Image 2)
      newBranchNode = {
        id: newBranchId,
        type: "shape",
        shapeType: parentNode.shapeType || "rounded",
        x: newX,
        y: newY,
        width: parentNode.width || 180,
        height: parentNode.height || 100,
        title: parentNode.title || (parentNode.shapeType === "rounded" ? "Rounded" : "Shape"),
        color: parentNode.color || "#F59E0B",
        fillType: parentNode.fillType || "solid",
        textColor: parentNode.textColor || "#FFFFFF",
        fontWeight: parentNode.fontWeight || "bold",
        fontSize: parentNode.fontSize || "14px",
        textAlign: parentNode.textAlign || "center",
        zIndex: 2,
      };
    } else if (parentNode.type === "sticky") {
      newBranchNode = {
        id: newBranchId,
        type: "sticky",
        noteFormat: parentNode.noteFormat || "text",
        x: newX,
        y: newY,
        width: parentNode.width || 200,
        height: parentNode.height || 180,
        title: parentNode.title || "Note",
        body: "",
        color: parentNode.color || "#EC4899",
        textColor: parentNode.textColor,
        fontSize: parentNode.fontSize,
        zIndex: 2,
      };
    } else {
      newBranchNode = {
        id: newBranchId,
        type: parentNode.type || "shape",
        shapeType: parentNode.shapeType || "rounded",
        x: newX,
        y: newY,
        width: parentNode.width || 180,
        height: parentNode.height || 100,
        title: parentNode.title || "Branch",
        color: parentNode.color || "#F59E0B",
        fillType: parentNode.fillType || "solid",
        textColor: parentNode.textColor || "#FFFFFF",
        zIndex: 2,
      };
    }

    const newEdgeId = `edge-branch-${Date.now()}`;
    const newEdge: IWhiteboardEdge = {
      id: newEdgeId,
      from: parentNode.id,
      to: newBranchId,
      fromAnchor: "bottom",
      toAnchor: "top",
      color: "#60A5FA",
      style: "orthogonal",
      lineStyle: "solid",
      arrowDirection: "forward",
    };

    const updatedNodes = [...nodes, newBranchNode];
    const updatedEdges = [...edges, newEdge];
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    pushHistory(updatedNodes, updatedEdges);
    triggerAutoSave(updatedNodes, updatedEdges);

    setSelectedNodeId(newBranchId);
    setSelectedNodeIds([newBranchId]);
  };

  // Helper: Given a list of node IDs, expand to include all group members for any node belonging to a groupId
  const resolveGroupMembers = useCallback(
    (nodeIds: string[], allNodes: IWhiteboardNode[]): string[] => {
      const result = new Set<string>(nodeIds);
      const activeGroupIds = new Set<string>();

      for (const id of nodeIds) {
        const n = allNodes.find((item) => item.id === id);
        if (n?.groupId) {
          activeGroupIds.add(n.groupId);
        }
      }

      if (activeGroupIds.size > 0) {
        for (const n of allNodes) {
          if (n.groupId && activeGroupIds.has(n.groupId)) {
            result.add(n.id);
          }
        }
      }

      return Array.from(result);
    },
    []
  );

  // Group & Node Duplicate / Copy Handler
  // Clones group or selected nodes into linked form so relative arrangement is safe
  const handleDuplicateGroup = useCallback(
    (explicitGroupId?: string) => {
      let targetNodes: IWhiteboardNode[] = [];

      if (explicitGroupId) {
        targetNodes = nodes.filter((n) => n.groupId === explicitGroupId);
      } else if (selectedNodeIds.length > 1) {
        const expandedIds = resolveGroupMembers(selectedNodeIds, nodes);
        targetNodes = nodes.filter((n) => expandedIds.includes(n.id));
      } else if (selectedNodeId) {
        const single = nodes.find((n) => n.id === selectedNodeId);
        if (single?.groupId) {
          targetNodes = nodes.filter((n) => n.groupId === single.groupId);
        } else if (single) {
          targetNodes = [single];
        }
      }

      if (targetNodes.length === 0) return;

      const idMap = new Map<string, string>();
      // Cloned group nodes ALWAYS receive a unified groupId so they move together safely without dislocation
      const newLinkedGroupId =
        targetNodes.length > 1
          ? `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          : undefined;

      const offsetX = 40;
      const offsetY = 40;

      const clonedNodes: IWhiteboardNode[] = targetNodes.map((sourceNode) => {
        const newId = `${sourceNode.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        idMap.set(sourceNode.id, newId);

        return {
          ...sourceNode,
          id: newId,
          groupId: newLinkedGroupId,
          x: sourceNode.x + offsetX,
          y: sourceNode.y + offsetY,
          title: sourceNode.title || "",
          zIndex: nodes.length + 2,
        };
      });

      // Clone internal connector arrows that connect nodes within this group
      const clonedEdges: IWhiteboardEdge[] = edges
        .filter((e) => idMap.has(e.from) && idMap.has(e.to))
        .map((e) => ({
          ...e,
          id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          from: idMap.get(e.from)!,
          to: idMap.get(e.to)!,
        }));

      const updatedNodes = [...nodes, ...clonedNodes];
      const updatedEdges = [...edges, ...clonedEdges];

      setNodes(updatedNodes);
      setEdges(updatedEdges);
      pushHistory(updatedNodes, updatedEdges);
      triggerAutoSave(updatedNodes, updatedEdges);

      const clonedIds = clonedNodes.map((n) => n.id);
      setSelectedNodeId(clonedIds[0] || null);
      setSelectedNodeIds(clonedIds);

      // Save to clipboard buffer for consecutive pasting
      clipboardGroupRef.current = {
        nodes: targetNodes,
        edges: edges.filter((e) =>
          targetNodes.some((tn) => tn.id === e.from) && targetNodes.some((tn) => tn.id === e.to)
        ),
      };

      if (clonedNodes.length > 1) {
        showTemporaryToast(
          `Copied ${clonedNodes.length} items as a Linked Group. Safely drag anywhere without dislocation!`
        );
      } else {
        showTemporaryToast("Duplicated item");
      }
    },
    [nodes, edges, selectedNodeId, selectedNodeIds, resolveGroupMembers, pushHistory, triggerAutoSave, showTemporaryToast]
  );

  // Paste from clipboard in linked group form
  const handlePasteGroupFromClipboard = useCallback(() => {
    if (!clipboardGroupRef.current || clipboardGroupRef.current.nodes.length === 0) return;
    const { nodes: clipNodes, edges: clipEdges } = clipboardGroupRef.current;

    const idMap = new Map<string, string>();
    const newLinkedGroupId =
      clipNodes.length > 1
        ? `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        : undefined;

    const offsetX = 40;
    const offsetY = 40;

    const clonedNodes: IWhiteboardNode[] = clipNodes.map((sourceNode) => {
      const newId = `${sourceNode.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      idMap.set(sourceNode.id, newId);

      return {
        ...sourceNode,
        id: newId,
        groupId: newLinkedGroupId,
        x: sourceNode.x + offsetX,
        y: sourceNode.y + offsetY,
        title: sourceNode.title || "",
        zIndex: nodesRef.current.length + 2,
      };
    });

    const clonedEdges: IWhiteboardEdge[] = clipEdges
      .filter((e) => idMap.has(e.from) && idMap.has(e.to))
      .map((e) => ({
        ...e,
        id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        from: idMap.get(e.from)!,
        to: idMap.get(e.to)!,
      }));

    const updatedNodes = [...nodesRef.current, ...clonedNodes];
    const updatedEdges = [...edgesRef.current, ...clonedEdges];

    setNodes(updatedNodes);
    setEdges(updatedEdges);
    pushHistory(updatedNodes, updatedEdges);
    triggerAutoSave(updatedNodes, updatedEdges);

    const clonedIds = clonedNodes.map((n) => n.id);
    setSelectedNodeId(clonedIds[0] || null);
    setSelectedNodeIds(clonedIds);

    // Update clipboard coordinates for staggered future pastes
    clipboardGroupRef.current = {
      nodes: clonedNodes.map((n) => ({ ...n })),
      edges: clonedEdges,
    };

    if (clonedNodes.length > 1) {
      showTemporaryToast(
        `Pasted ${clonedNodes.length} items as a Linked Group entity`
      );
    } else {
      showTemporaryToast("Pasted item from clipboard");
    }
  }, [pushHistory, triggerAutoSave, showTemporaryToast]);

  // Node Dragging Start (Supports linked groups, Ctrl+Click multi-select, and compound temporary groups)
  const handleNodeMouseDown = (node: IWhiteboardNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === "hand") return;
    if (editingNodeId === node.id) return; // Allow text selection if editing

    setDoubleClickMenu(null);
    setEdgeSettingsPopover(null);
    setShowShapePalette(false);
    setShowTemplateSelector(false);
    setShowBgColorPicker(false);
    setShowShapeSwitcher(false);

    // 1. If Pen Draw Tool is active, start drawing even if mouse is pressed over a node
    if (activeTool === "draw") {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setIsDrawingPen(true);
      setCurrentPenPoints([coords]);
      return;
    }

    // 2. If Arrow Connection Tool is active, connect two different nodes with <-, ->, or <->
    if (activeTool === "arrow") {
      if (!connectingFromNodeId) {
        // Step 1: Click 1st node
        setConnectingFromNodeId(node.id);
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setConnectingMousePos(coords);
      } else {
        // Step 2: Click 2nd node
        if (connectingFromNodeId !== node.id) {
          const newEdge: IWhiteboardEdge = {
            id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            from: connectingFromNodeId,
            to: node.id,
            color: "#60A5FA",
            style: "solid",
            arrowDirection: arrowConnectType,
          };
          const updatedEdges = [...edges, newEdge];
          setEdges(updatedEdges);
          pushHistory(nodes, updatedEdges);
          triggerAutoSave(nodes, updatedEdges);
        }
        setConnectingFromNodeId(null);
        setConnectingMousePos(null);
      }
      return;
    }

    const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;

    if (isMultiSelect) {
      // Toggle node or its linked group in multi-selection group
      const nodeGroupMembers = node.groupId
        ? resolveGroupMembers([node.id], nodes)
        : [node.id];

      const isAlreadySelected = selectedNodeIds.includes(node.id);
      let nextSelected: string[];

      if (isAlreadySelected) {
        // Deselect node (and its group members if linked)
        nextSelected = selectedNodeIds.filter((id) => !nodeGroupMembers.includes(id));
      } else {
        // Add node (and all its linked group members)
        nextSelected = Array.from(new Set([...selectedNodeIds, ...nodeGroupMembers]));
      }

      setSelectedNodeIds(nextSelected);
      setSelectedNodeId(nextSelected[nextSelected.length - 1] || null);
      return;
    }

    // Normal click without Ctrl/Shift:
    // 1. For EDITING & FORMATTING: select this specific node so individual editing (box color, text, font, fill) works seamlessly!
    // 2. For DRAGGING & MOVEMENT: if this node belongs to a linked group (or an active multi-selection), move all group members together!
    const wasAlreadyMultiSelected = selectedNodeIds.length > 1 && selectedNodeIds.includes(node.id);
    let nodesToDrag: string[];

    if (wasAlreadyMultiSelected) {
      // User clicked within an existing multi-selection; prepare group drag
      nodesToDrag = resolveGroupMembers(selectedNodeIds, nodes);
    } else {
      // Single node selected for individual formatting & editing
      setSelectedNodeId(node.id);
      setSelectedNodeIds([node.id]);
      nodesToDrag = node.groupId ? resolveGroupMembers([node.id], nodes) : [node.id];
    }

    clickedCandidateNodeRef.current = { node, wasMultiSelected: wasAlreadyMultiSelected };
    hasActuallyMovedDragRef.current = false;

    setSelectedNodeId(node.id);
    setActiveColor(node.color || "#0078D4");
    setActiveFillType(node.fillType || "solid");

    const coords = getCanvasCoords(e.clientX, e.clientY);
    setIsDraggingGroup(true);
    setDraggingNodeId(node.id);
    setGroupDragStartCoords({ x: coords.x, y: coords.y });

    const initialPositions: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n) => {
      if (nodesToDrag.includes(n.id)) {
        initialPositions[n.id] = { x: n.x, y: n.y };
      }
    });
    setInitialGroupNodePositions(initialPositions);
  };

  // Canvas Mouse Down (Panning, Freehand Drawing, Deselecting, or Starting Rectangular Marquee Selection)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setDoubleClickMenu(null);
    setEdgeSettingsPopover(null);
    setShowStylePalette(false);
    setShowShapePalette(false);
    setShowTemplateSelector(false);
    setShowBgColorPicker(false);
    setShowShapeSwitcher(false);

    if (e.button === 1 || activeTool === "hand") {
      // Pan
      setIsPanning(true);
      setStartPanMouse({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Left click on canvas background
    if (e.button === 0) {
      // Freehand drawing with pen
      if (activeTool === "draw") {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setIsDrawingPen(true);
        setCurrentPenPoints([coords]);
        return;
      }

      // Interactive Straight Line & Independent Arrow Drawing
      if (activeTool === "line" || activeTool === "arrow-line") {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setInteractiveLineDrawing({
          tool: activeTool,
          startX: coords.x,
          startY: coords.y,
          currentX: coords.x,
          currentY: coords.y,
        });
        return;
      }

      // If in arrow connection mode, clicking empty canvas cancels active first node selection
      if (activeTool === "arrow") {
        if (connectingFromNodeId) {
          setConnectingFromNodeId(null);
          setConnectingMousePos(null);
        }
        return;
      }

      // If clicking outside the group without Ctrl: destroy the temporary group!
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        setSelectedNodeIds([]);
        setSelectedNodeId(null);
        setEditingNodeId(null);
        setEditingTitleId(null);
      }

      // Start drag-to-select rectangular selector
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setIsSelectingBox(true);
      setSelectionBox({
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y,
      });
    }
  };

  // Global Mouse Move (Dragging Nodes / Group, Rectangular Selection, Pen Drawing, or Panning)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPanMouse.x,
        y: e.clientY - startPanMouse.y,
      });
      return;
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);

    // Track cursor for dynamic arrow preview when connecting two nodes
    if (activeTool === "arrow" && connectingFromNodeId) {
      setConnectingMousePos(coords);
    }

    // Active pen drawing stroke
    if (isDrawingPen) {
      setCurrentPenPoints((prev) => [...prev, coords]);
      return;
    }

    // 0. Resizing Node via 8-Point Resize Handles
    if (resizing) {
      const dx = (e.clientX - resizing.startX) / zoom;
      const dy = (e.clientY - resizing.startY) / zoom;
      const init = resizing.initialNode;
      let newX = init.x;
      let newY = init.y;
      let newW = init.width;
      let newH = init.height;

      if (resizing.handle.includes("e")) {
        newW = Math.max(50, Math.round(init.width + dx));
      }
      if (resizing.handle.includes("s")) {
        newH = Math.max(30, Math.round(init.height + dy));
      }
      if (resizing.handle.includes("w")) {
        const clampedDx = Math.min(dx, init.width - 50);
        newX = Math.round(init.x + clampedDx);
        newW = Math.round(init.width - clampedDx);
      }
      if (resizing.handle.includes("n")) {
        const clampedDy = Math.min(dy, init.height - 30);
        newY = Math.round(init.y + clampedDy);
        newH = Math.round(init.height - clampedDy);
      }

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === resizing.nodeId
              ? {
                ...n,
                x: newX,
                y: newY,
                width: newW,
                height: newH,
                ...(n.headerHeight ? { headerHeight: Math.min(n.headerHeight, Math.max(24, newH - 24)) } : {}),
              }
              : n
          )
        );
      });
      return;
    }

    // 0.1 Resizing Task Card Divider Line (Header vs Bottom Height Split)
    if (resizingDivider) {
      const dy = (e.clientY - resizingDivider.startY) / zoom;
      const minHeaderHeight = 24;
      const maxHeaderHeight = Math.max(minHeaderHeight, resizingDivider.nodeHeight - 24);
      const newHeaderHeight = Math.round(
        Math.min(maxHeaderHeight, Math.max(minHeaderHeight, resizingDivider.initialHeaderHeight + dy))
      );

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === resizingDivider.nodeId
              ? { ...n, headerHeight: newHeaderHeight }
              : n
          )
        );
      });
      return;
    }

    // 0.2 Interactive Line / Arrow Drawing in Progress
    if (interactiveLineDrawing) {
      setInteractiveLineDrawing((prev) =>
        prev ? { ...prev, currentX: coords.x, currentY: coords.y } : null
      );
      return;
    }

    // 0.3 Dragging Line Tip (Start or End Tip - Rotatable & Extensible independent tip drag)
    if (draggingLineTip) {
      let targetX = coords.x;
      let targetY = coords.y;

      if (e.shiftKey) {
        const dx = targetX - draggingLineTip.pinnedPoint.x;
        const dy = targetY - draggingLineTip.pinnedPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);
        const snap = Math.PI / 12; // 15 degrees snap with Shift
        angle = Math.round(angle / snap) * snap;
        targetX = Math.round(draggingLineTip.pinnedPoint.x + dist * Math.cos(angle));
        targetY = Math.round(draggingLineTip.pinnedPoint.y + dist * Math.sin(angle));
      }

      const pX = draggingLineTip.pinnedPoint.x;
      const pY = draggingLineTip.pinnedPoint.y;
      const newX1 = draggingLineTip.tip === "start" ? targetX : pX;
      const newY1 = draggingLineTip.tip === "start" ? targetY : pY;
      const newX2 = draggingLineTip.tip === "end" ? targetX : pX;
      const newY2 = draggingLineTip.tip === "end" ? targetY : pY;

      const minX = Math.min(newX1, newX2);
      const minY = Math.min(newY1, newY2);
      const w = Math.max(Math.abs(newX2 - newX1), 10);
      const h = Math.max(Math.abs(newY2 - newY1), 10);

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === draggingLineTip.nodeId
              ? {
                ...n,
                x: minX,
                y: minY,
                width: w,
                height: h,
                metaData: {
                  ...n.metaData,
                  x1: newX1 - minX,
                  y1: newY1 - minY,
                  x2: newX2 - minX,
                  y2: newY2 - minY,
                  isRelative: true,
                },
              }
              : n
          )
        );
      });
      return;
    }

    // 0.4 Dragging Line Middle (Move whole line by dragging middle or stroke)
    if (draggingLineMiddle) {
      const dx = (e.clientX - draggingLineMiddle.startX) / zoom;
      const dy = (e.clientY - draggingLineMiddle.startY) / zoom;
      const newX = Math.round(draggingLineMiddle.initialNode.x + dx);
      const newY = Math.round(draggingLineMiddle.initialNode.y + dy);

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === draggingLineMiddle.nodeId
              ? { ...n, x: newX, y: newY }
              : n
          )
        );
      });
      return;
    }

    // 1. Rectangular Marquee Selection Box
    if (isSelectingBox && selectionBox) {
      setSelectionBox((prev) => (prev ? { ...prev, currentX: coords.x, currentY: coords.y } : null));

      const minX = Math.min(selectionBox.startX, coords.x);
      const maxX = Math.max(selectionBox.startX, coords.x);
      const minY = Math.min(selectionBox.startY, coords.y);
      const maxY = Math.max(selectionBox.startY, coords.y);

      // Only evaluate if dragged noticeably (prevents accidental selection on click)
      if (maxX - minX > 6 || maxY - minY > 6) {
        const intersectingIds = nodes
          .filter((n) => {
            const nodeRight = n.x + n.width;
            const nodeBottom = n.y + n.height;
            return n.x < maxX && nodeRight > minX && n.y < maxY && nodeBottom > minY;
          })
          .map((n) => n.id);

        const expandedIds = resolveGroupMembers(intersectingIds, nodes);
        setSelectedNodeIds(expandedIds);
        setSelectedNodeId(expandedIds[0] || null);
      }
      return;
    }

    // 2. Dragging Nodes as a Group (Throttled via requestAnimationFrame for silky 60fps/120fps hardware acceleration)
    if (isDraggingGroup && groupDragStartCoords) {
      const dx = coords.x - groupDragStartCoords.x;
      const dy = coords.y - groupDragStartCoords.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasActuallyMovedDragRef.current = true;
      }

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        setNodes((prev) => {
          const updated = prev.map((n) => {
            if (initialGroupNodePositions[n.id]) {
              return {
                ...n,
                x: initialGroupNodePositions[n.id].x + dx,
                y: initialGroupNodePositions[n.id].y + dy,
              };
            }
            return n;
          });
          nodesRef.current = updated;
          return updated;
        });
      });
    }
  };

  // Global Mouse Up (End Panning, Selection Box, Pen Drawing, or Group Drag)
  const handleMouseUp = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (isPanning) {
      setIsPanning(false);
    }

    // Finalize freehand pen stroke into a whiteboard node
    if (isDrawingPen) {
      setIsDrawingPen(false);
      if (currentPenPoints.length > 1) {
        const minX = Math.min(...currentPenPoints.map((p) => p.x));
        const minY = Math.min(...currentPenPoints.map((p) => p.y));
        const maxX = Math.max(...currentPenPoints.map((p) => p.x));
        const maxY = Math.max(...currentPenPoints.map((p) => p.y));
        const width = Math.max(16, maxX - minX);
        const height = Math.max(16, maxY - minY);
        const relPoints = currentPenPoints.map((p) => ({
          x: p.x - minX,
          y: p.y - minY,
        }));
        const pathData = generateSvgPath(relPoints);

        const newDrawNode: IWhiteboardNode = {
          id: `drawing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: "drawing",
          x: Math.round(minX),
          y: Math.round(minY),
          width: Math.round(width),
          height: Math.round(height),
          title: "Drawing",
          pathData,
          color: penColor,
          strokeWidth: penStrokeWidth,
          zIndex: nodes.length + 1,
        };

        const updated = [...nodes, newDrawNode];
        setNodes(updated);
        pushHistory(updated, edges);
      }
      setCurrentPenPoints([]);
    }

    if (isSelectingBox) {
      setIsSelectingBox(false);
      setSelectionBox(null);
    }

    if (resizing) {
      setResizing(null);
      pushHistory(nodesRef.current, edgesRef.current);
    }

    if (resizingDivider) {
      setResizingDivider(null);
      pushHistory(nodesRef.current, edgesRef.current);
      triggerAutoSave(nodesRef.current, edgesRef.current);
    }

    // Finalize interactive straight line / independent arrow drawing
    if (interactiveLineDrawing) {
      const isArrow = interactiveLineDrawing.tool === "arrow-line";
      const dx = interactiveLineDrawing.currentX - interactiveLineDrawing.startX;
      const dy = interactiveLineDrawing.currentY - interactiveLineDrawing.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const endX = dist < 8 ? interactiveLineDrawing.startX + 180 : interactiveLineDrawing.currentX;
      const endY = dist < 8 ? interactiveLineDrawing.startY : interactiveLineDrawing.currentY;

      const x1 = interactiveLineDrawing.startX;
      const y1 = interactiveLineDrawing.startY;
      const x2 = endX;
      const y2 = endY;
      const minX = Math.min(x1, x2);
      const minY = Math.min(y1, y2);
      const w = Math.max(Math.abs(x2 - x1), 10);
      const h = Math.max(Math.abs(y2 - y1), 10);
      const newId = `line-${Date.now()}`;
      const newLineNode: IWhiteboardNode = {
        id: newId,
        type: "line",
        shapeType: isArrow ? "arrow" : "line",
        x: minX,
        y: minY,
        width: w,
        height: h,
        color: activeColor || "#60A5FA",
        strokeWidth: 3,
        lineStyle: "solid",
        arrowDirection: isArrow ? "forward" : "none",
        title: "",
        zIndex: nodes.length + 1,
        metaData: {
          x1: x1 - minX,
          y1: y1 - minY,
          x2: x2 - minX,
          y2: y2 - minY,
          isRelative: true,
        },
      };

      const updated = [...nodes, newLineNode];
      setNodes(updated);
      pushHistory(updated, edges);
      setSelectedNodeId(newId);
      setSelectedNodeIds([newId]);
      setActiveTool("select");
      setInteractiveLineDrawing(null);
      triggerAutoSave(updated, edges);
    }

    if (draggingLineTip) {
      setDraggingLineTip(null);
      pushHistory(nodesRef.current, edgesRef.current);
      triggerAutoSave(nodesRef.current, edgesRef.current);
    }

    if (draggingLineMiddle) {
      setDraggingLineMiddle(null);
      pushHistory(nodesRef.current, edgesRef.current);
      triggerAutoSave(nodesRef.current, edgesRef.current);
    }

    if (isDraggingGroup) {
      setIsDraggingGroup(false);
      setDraggingNodeId(null);
      setGroupDragStartCoords(null);
      setInitialGroupNodePositions({});

      // If user clicked without dragging, ensure this node is individually selected for formatting & color editing
      if (!hasActuallyMovedDragRef.current && clickedCandidateNodeRef.current) {
        const targetNode = clickedCandidateNodeRef.current.node;
        setSelectedNodeId(targetNode.id);
        setSelectedNodeIds([targetNode.id]);
        setActiveColor(targetNode.color || "#0078D4");
        setActiveFillType(targetNode.fillType || "solid");
      }
      clickedCandidateNodeRef.current = null;
      hasActuallyMovedDragRef.current = false;

      pushHistory(nodesRef.current, edgesRef.current);
      triggerAutoSave(nodesRef.current, edgesRef.current);
    }
  };

  // Core canvas node deletion helper (synchronous UI update + auto-save)
  const executeCanvasDelete = useCallback(
    (idsToDelete: string[]) => {
      const updatedNodes = nodes.filter((n) => !idsToDelete.includes(n.id));
      const updatedEdges = edges.filter(
        (e) => !idsToDelete.includes(e.from) && !idsToDelete.includes(e.to)
      );
      setNodes(updatedNodes);
      setEdges(updatedEdges);
      pushHistory(updatedNodes, updatedEdges);
      triggerAutoSave(updatedNodes, updatedEdges);
      setSelectedNodeId(null);
      setSelectedNodeIds([]);
      setEditingNodeId(null);
    },
    [nodes, edges, pushHistory, triggerAutoSave]
  );

  // Delete Selected Node(s) - Supports Multi-Delete & S3 confirmation for external uploaded files
  const handleDeleteSelected = useCallback(() => {
    const idsToDelete =
      selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
    if (idsToDelete.length === 0) return;

    const targetNodes = nodes.filter((n) => idsToDelete.includes(n.id));

    // Identify if any selected node is an external file uploaded to AWS S3
    const s3Nodes = targetNodes.filter((n) => {
      if (n.s3Key && n.s3Key.trim().length > 0) return true;
      if (n.fileUrl && (n.fileUrl.includes(".amazonaws.com") || n.fileUrl.startsWith("http"))) {
        return true;
      }
      if (
        n.type === "image" &&
        n.imageUrl &&
        (n.imageUrl.includes(".amazonaws.com") ||
          (n.imageUrl.startsWith("http") && !n.imageUrl.startsWith("data:")))
      ) {
        return true;
      }
      return false;
    });

    if (s3Nodes.length > 0) {
      // Must prompt user: Delete from here only OR Delete here + S3
      setS3DeleteModal({
        nodeIds: idsToDelete,
        s3Nodes,
      });
      return;
    }

    // Regular native nodes -> delete immediately from canvas
    executeCanvasDelete(idsToDelete);
  }, [selectedNodeIds, selectedNodeId, nodes, executeCanvasDelete]);

  // Confirmation Option 1: Delete from canvas only (keeps S3 file intact)
  const handleConfirmDeleteCanvasOnly = useCallback(() => {
    if (!s3DeleteModal) return;
    executeCanvasDelete(s3DeleteModal.nodeIds);
    setS3DeleteModal(null);
    showTemporaryToast("Removed from whiteboard canvas (file preserved in S3)");
  }, [s3DeleteModal, executeCanvasDelete, showTemporaryToast]);

  // Confirmation Option 2: Delete from canvas + S3 (cleans up S3 storage)
  const handleConfirmDeleteCanvasAndS3 = useCallback(async () => {
    if (!s3DeleteModal) return;
    setIsDeletingFromS3(true);

    const { nodeIds, s3Nodes } = s3DeleteModal;
    const s3Keys = s3Nodes
      .map((n) => n.s3Key || n.fileUrl || n.imageUrl || "")
      .filter((k) => k.length > 0);

    // 1. Remove from whiteboard canvas immediately
    executeCanvasDelete(nodeIds);
    setS3DeleteModal(null);
    setIsDeletingFromS3(false);

    // 2. Call backend S3 deletion route
    try {
      if (s3Keys.length > 0) {
        const res = await fetch("/api/whiteboards/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ s3Keys }),
        });
        const data = await res.json();
        if (data.success) {
          showTemporaryToast(
            `Removed from whiteboard & deleted ${s3Keys.length > 1 ? `${s3Keys.length} files` : "file"} from S3 storage`
          );
        } else {
          showTemporaryToast("Removed from canvas. Note: S3 deletion had warnings.");
        }
      }
    } catch (err) {
      console.error("Failed to delete object from S3:", err);
      showTemporaryToast("Removed from canvas, but failed to connect to S3.");
    }
  }, [s3DeleteModal, executeCanvasDelete, showTemporaryToast]);

  // Link Selected Objects into a Unified Group Entity that moves together
  const handleGroupSelectedNodes = useCallback(() => {
    const ids =
      selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
    if (ids.length < 2) {
      showTemporaryToast("Select 2 or more objects to link as a group entity");
      return;
    }

    const newGroupId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const allIdsToGroup = resolveGroupMembers(ids, nodesRef.current);

    const updatedNodes = nodesRef.current.map((n) =>
      allIdsToGroup.includes(n.id) ? { ...n, groupId: newGroupId } : n
    );

    nodesRef.current = updatedNodes;
    setNodes(updatedNodes);
    // Select the primary node individually so individual editing (color, text, size) works immediately
    // while dragging it will move all group members together in the same space!
    const primaryId = ids[0] || allIdsToGroup[0];
    setSelectedNodeId(primaryId);
    setSelectedNodeIds([primaryId]);
    pushHistory(updatedNodes, edgesRef.current);
    triggerAutoSave(updatedNodes, edgesRef.current);
    showTemporaryToast(`Linked ${allIdsToGroup.length} objects as a unified group entity. Drag to move together.`);
  }, [selectedNodeIds, selectedNodeId, resolveGroupMembers, pushHistory, triggerAutoSave, showTemporaryToast]);

  // Unlink / Ungroup Selected Objects - dissolves group entity so objects move independently
  const handleUngroupSelectedNodes = useCallback(() => {
    const ids =
      selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
    if (ids.length === 0) return;

    // Find all groupIds present in selection
    const groupIdsToDissolve = new Set<string>();
    nodesRef.current.forEach((n) => {
      if (ids.includes(n.id) && n.groupId) {
        groupIdsToDissolve.add(n.groupId);
      }
    });

    if (groupIdsToDissolve.size === 0) {
      showTemporaryToast("Selected objects are not linked into any group");
      return;
    }

    const updatedNodes = nodesRef.current.map((n) =>
      n.groupId && groupIdsToDissolve.has(n.groupId) ? { ...n, groupId: undefined } : n
    );

    nodesRef.current = updatedNodes;
    setNodes(updatedNodes);
    pushHistory(updatedNodes, edgesRef.current);
    triggerAutoSave(updatedNodes, edgesRef.current);
    showTemporaryToast(`Unlinked group (${ids.length} objects are now independent entities)`);
  }, [selectedNodeIds, selectedNodeId, pushHistory, triggerAutoSave, showTemporaryToast]);

  // Link Selected Objects together with connector edges (supports Sequential, Star, and Bidirectional)
  const handleLinkSelectedNodes = useCallback(
    (mode: "sequence" | "star" | "bidirectional" = "sequence") => {
      const ids =
        selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
      if (ids.length < 2) {
        showTemporaryToast("Select 2 or more objects to create a link");
        return;
      }

      const newEdgesToAdd: IWhiteboardEdge[] = [];
      const updatedExisting = [...edges];

      if (mode === "bidirectional") {
        for (let i = 0; i < ids.length - 1; i++) {
          const fromId = ids[i];
          const toId = ids[i + 1];
          const existingIdx = updatedExisting.findIndex(
            (e) => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId)
          );
          if (existingIdx !== -1) {
            updatedExisting[existingIdx] = {
              ...updatedExisting[existingIdx],
              arrowDirection: "bidirectional",
            };
          } else {
            newEdgesToAdd.push({
              id: `edge-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
              from: fromId,
              to: toId,
              color: "#3B82F6",
              style: "orthogonal",
              lineStyle: "solid",
              arrowDirection: "bidirectional",
            });
          }
        }
      } else if (mode === "star") {
        // Star topology: First selected node links to all other selected nodes
        const rootId = ids[0];
        for (let i = 1; i < ids.length; i++) {
          const targetId = ids[i];
          const alreadyLinked = updatedExisting.some(
            (e) => (e.from === rootId && e.to === targetId) || (e.from === targetId && e.to === rootId)
          );
          if (!alreadyLinked) {
            newEdgesToAdd.push({
              id: `edge-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
              from: rootId,
              to: targetId,
              color: "#3B82F6",
              style: "orthogonal",
              lineStyle: "solid",
              arrowDirection: "forward",
            });
          }
        }
      } else {
        // Sequence topology: ids[0] -> ids[1] -> ids[2] ...
        for (let i = 0; i < ids.length - 1; i++) {
          const fromId = ids[i];
          const toId = ids[i + 1];
          const alreadyLinked = updatedExisting.some(
            (e) => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId)
          );
          if (!alreadyLinked) {
            newEdgesToAdd.push({
              id: `edge-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
              from: fromId,
              to: toId,
              color: "#3B82F6",
              style: "orthogonal",
              lineStyle: "solid",
              arrowDirection: "forward",
            });
          }
        }
      }

      if (newEdgesToAdd.length > 0 || mode === "bidirectional") {
        const merged = [...updatedExisting, ...newEdgesToAdd];
        setEdges(merged);
        pushHistory(nodes, merged);
        triggerAutoSave(nodes, merged);
        const count = newEdgesToAdd.length;
        showTemporaryToast(
          count > 0
            ? `Linked ${ids.length} objects with ${count} connector ${count === 1 ? "arrow" : "arrows"}`
            : `Updated links to bidirectional between ${ids.length} objects`
        );
      } else {
        showTemporaryToast("Selected objects are already linked");
      }
    },
    [selectedNodeIds, selectedNodeId, edges, nodes, pushHistory, triggerAutoSave, showTemporaryToast]
  );

  // Unlink Selected Objects - removes all connector edges between selected objects
  const handleUnlinkSelectedNodes = useCallback(() => {
    const ids =
      selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
    if (ids.length < 2) {
      showTemporaryToast("Select 2 or more objects to unlink");
      return;
    }

    const unlinkedEdges = edges.filter(
      (e) => ids.includes(e.from) && ids.includes(e.to)
    );

    if (unlinkedEdges.length === 0) {
      showTemporaryToast("No links to remove between selected objects");
      return;
    }

    const updatedEdges = edges.filter(
      (e) => !(ids.includes(e.from) && ids.includes(e.to))
    );

    setEdges(updatedEdges);
    pushHistory(nodes, updatedEdges);
    triggerAutoSave(nodes, updatedEdges);
    showTemporaryToast(
      `Unlinked ${ids.length} objects (removed ${unlinkedEdges.length} ${unlinkedEdges.length === 1 ? "arrow" : "arrows"})`
    );
  }, [selectedNodeIds, selectedNodeId, edges, nodes, pushHistory, triggerAutoSave, showTemporaryToast]);

  // Keybindings (Delete, Backspace, Esc, Shortcuts)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // 1. If actively typing in a form input or textarea or editing a node title, allow native input shortcuts
      const isInputActive =
        Boolean(editingNodeId) ||
        Boolean(
          document.activeElement &&
          (document.activeElement.tagName === "INPUT" ||
            document.activeElement.tagName === "TEXTAREA" ||
            (document.activeElement as HTMLElement).isContentEditable)
        );

      // 2. Undo & Redo Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z, Cmd+Z, Cmd+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && !isInputActive) {
        if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          return;
        } else if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          handleRedo();
          return;
        } else if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          const allIds = nodes.map((n) => n.id);
          setSelectedNodeIds(allIds);
          setSelectedNodeId(allIds[0] || null);
          return;
        } else if (e.key === "g" || e.key === "G") {
          e.preventDefault();
          if (e.shiftKey) {
            handleUngroupSelectedNodes();
          } else {
            handleGroupSelectedNodes();
          }
          return;
        } else if (e.key === "l" || e.key === "L") {
          e.preventDefault();
          if (e.shiftKey) {
            handleUngroupSelectedNodes();
          } else {
            handleGroupSelectedNodes();
          }
          return;
        } else if (e.key === "d" || e.key === "D") {
          e.preventDefault();
          handleDuplicateGroup();
          return;
        } else if (e.key === "c" || e.key === "C") {
          let nodesToCopy: IWhiteboardNode[] = [];
          if (selectedNodeIds.length > 1) {
            const exp = resolveGroupMembers(selectedNodeIds, nodes);
            nodesToCopy = nodes.filter((n) => exp.includes(n.id));
          } else if (selectedNodeId) {
            const s = nodes.find((n) => n.id === selectedNodeId);
            if (s?.groupId) {
              nodesToCopy = nodes.filter((n) => n.groupId === s.groupId);
            } else if (s) {
              nodesToCopy = [s];
            }
          }
          if (nodesToCopy.length > 0) {
            e.preventDefault();
            const targetIds = nodesToCopy.map((n) => n.id);
            const internalEdges = edges.filter(
              (ed) => targetIds.includes(ed.from) && targetIds.includes(ed.to)
            );
            clipboardGroupRef.current = { nodes: nodesToCopy, edges: internalEdges };
            showTemporaryToast(
              `Copied ${nodesToCopy.length} ${nodesToCopy.length === 1 ? "item" : "items (group)"} to clipboard`
            );
          }
          return;
        } else if (e.key === "v" || e.key === "V") {
          if (clipboardGroupRef.current && clipboardGroupRef.current.nodes.length > 0) {
            e.preventDefault();
            handlePasteGroupFromClipboard();
            return;
          }
        }
      }

      if (editingNodeId || isInputActive) return; // Typing in input

      // If S3 deletion modal is open, Escape closes it and other shortcuts are suppressed
      if (s3DeleteModal) {
        if (e.key === "Escape") {
          setS3DeleteModal(null);
        }
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        handleDeleteSelected();
      } else if (e.key === "Escape") {
        setSelectedNodeId(null);
        setSelectedNodeIds([]);
        setEditingNodeId(null);
        setEditingTitleId(null);
        setConnectingFromNodeId(null);
        setConnectingMousePos(null);
        setDoubleClickMenu(null);
        setShowShapePalette(false);
        setShowStylePalette(false);
        setShowBgColorPicker(false);
        setShowLinkMenu(false);
        if (activeTool === "arrow" || activeTool === "draw") {
          setActiveTool("select");
        }
      } else if (e.key === "v" || e.key === "V") {
        setActiveTool("select");
      } else if (e.key === "h" || e.key === "H") {
        setActiveTool("hand");
      } else if (e.key === "a" || e.key === "A") {
        setActiveTool("arrow");
      } else if (e.key === "p" || e.key === "P" || e.key === "d" || e.key === "D") {
        setActiveTool("draw");
      } else if (e.key === "l" || e.key === "L") {
        setActiveTool("line");
      } else if (e.key === "n" || e.key === "N") {
        setActiveTool("sticky");
        if (e.shiftKey) {
          handleAddNode("sticky", "rectangle", "#38BDF8", true);
        } else {
          handleAddNode("sticky");
        }
      } else if (e.key === "t" || e.key === "T") {
        setActiveTool("text");
        handleAddNode("text");
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    handleUndo,
    handleRedo,
    selectedNodeId,
    selectedNodeIds,
    editingNodeId,
    nodes,
    edges,
    activeTool,
    connectingFromNodeId,
    s3DeleteModal,
    handleDeleteSelected,
    handleGroupSelectedNodes,
    handleUngroupSelectedNodes,
    handleLinkSelectedNodes,
    handleUnlinkSelectedNodes,
    handleDuplicateGroup,
    handlePasteGroupFromClipboard,
    resolveGroupMembers,
    showTemporaryToast,
  ]);

  // Synchronize zoom and pan refs for wheel listener
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  // Mouse Wheel Navigation:
  // - scroll: Y axis scroll
  // - shift + scroll: horizontal (X axis) scroll
  // - ctrl + scroll: zoom in or out centered at mouse cursor
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleWheel = (e: WheelEvent) => {
      // Allow internal scrolling inside inputs / textareas / scrollable note bodies
      const target = e.target as HTMLElement | null;
      if (target && !e.ctrlKey && !e.metaKey) {
        const scrollable = (target.closest(
          "textarea, select, [data-scrollable='true'], .overflow-y-auto, .overflow-auto, .overflow-y-scroll, .overflow-x-auto"
        ) ||
          target.closest("[data-note-card='true']")?.querySelector(
            "textarea, [data-scrollable='true'], .overflow-y-auto, .overflow-auto"
          )) as HTMLElement | null;

        if (scrollable) {
          const hasVerticalOverflow = scrollable.scrollHeight > scrollable.clientHeight + 1;
          const hasHorizontalOverflow = scrollable.scrollWidth > scrollable.clientWidth + 1;

          if (hasVerticalOverflow || hasHorizontalOverflow) {
            // Scroll the element directly so transformed canvas doesn't swallow wheel events
            if (hasVerticalOverflow && e.deltaY !== 0) {
              scrollable.scrollTop += e.deltaY;
            }
            if (hasHorizontalOverflow && e.deltaX !== 0) {
              scrollable.scrollLeft += e.deltaX;
            }
            e.preventDefault(); // Stop canvas from panning underneath!
            return;
          }
        }
      }

      e.preventDefault();

      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      // 1. Ctrl + Scroll (or Cmd + Scroll) -> Zoom in / out centered around cursor
      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        const newZoom = Math.max(0.05, Math.min(3.0, Number((currentZoom * zoomFactor).toFixed(3))));

        const rect = canvasEl.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newPanX = mouseX - ((mouseX - currentPan.x) / currentZoom) * newZoom;
        const newPanY = mouseY - ((mouseY - currentPan.y) / currentZoom) * newZoom;

        setZoom(newZoom);
        setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
        return;
      }

      // 2. Shift + Scroll -> Horizontal scroll (X axis)
      if (e.shiftKey) {
        const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        setPan((prev) => ({
          x: Math.round(prev.x - delta),
          y: prev.y,
        }));
        return;
      }

      // 3. Normal Scroll -> Vertical scroll (Y axis) & deltaX if trackpad swipe
      setPan((prev) => ({
        x: Math.round(prev.x - (e.deltaX || 0)),
        y: Math.round(prev.y - e.deltaY),
      }));
    };

    canvasEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvasEl.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Selected Node Reference
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Direct node update by ID (guaranteed to persist even if selection changes during blur)
  const updateNode = useCallback(
    (id: string, patch: Partial<IWhiteboardNode>) => {
      if (!id) return;
      const updated = nodesRef.current.map((n) => (n.id === id ? { ...n, ...patch } : n));
      nodesRef.current = updated;
      setNodes(updated);
      pushHistory(updated, edgesRef.current);
      triggerAutoSave(updated, edgesRef.current);
    },
    [pushHistory, triggerAutoSave]
  );

  // Live text update during typing (keeps draft synchronously so text never reverts on blur/click)
  const handleLiveTextChange = useCallback(
    (nodeId: string, patch: Partial<IWhiteboardNode>) => {
      if (!nodeId) return;
      const updated = nodesRef.current.map((n) =>
        n.id === nodeId ? { ...n, ...patch } : n
      );
      nodesRef.current = updated;
      setNodes(updated);
      triggerAutoSave(updated, edgesRef.current);
    },
    [triggerAutoSave]
  );

  // Update selected node attributes (Supports updating single node or entire multi-selection with auto-save)
  const updateSelectedNode = useCallback(
    (patch: Partial<IWhiteboardNode>, fallbackNodeId?: string) => {
      let targetIds: string[];
      if (selectedNodeId && selectedNodeIds.length <= 1) {
        targetIds = [selectedNodeId];
      } else if (selectedNodeIds.length > 0) {
        targetIds = selectedNodeIds;
      } else if (selectedNodeId) {
        targetIds = [selectedNodeId];
      } else if (fallbackNodeId) {
        targetIds = [fallbackNodeId];
      } else if (editingNodeId) {
        targetIds = [editingNodeId];
      } else {
        return;
      }

      const updated = nodesRef.current.map((n) =>
        targetIds.includes(n.id) ? { ...n, ...patch } : n
      );
      nodesRef.current = updated;
      setNodes(updated);
      pushHistory(updated, edgesRef.current);
      triggerAutoSave(updated, edgesRef.current);
    },
    [selectedNodeIds, selectedNodeId, editingNodeId, pushHistory, triggerAutoSave]
  );

  // Sticky Note Checklist Handlers
  const handleToggleChecklistItem = useCallback(
    (nodeId: string, itemId: string) => {
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (!targetNode) return;
      const currentList = parseNodeChecklist(targetNode);
      const updatedList = toggleChecklistItem(currentList, itemId);
      const updatedBody = serializeChecklistToBody(updatedList);

      const updatedNodes = nodes.map((n) =>
        n.id === nodeId
          ? {
            ...n,
            hasCheckbox: true,
            checklist: updatedList,
            body: updatedBody,
          }
          : n
      );
      setNodes(updatedNodes);
      pushHistory(updatedNodes, edges);
    },
    [nodes, edges, pushHistory]
  );

  const handleUpdateChecklistItemText = useCallback(
    (nodeId: string, itemId: string, text: string) => {
      const targetNode = nodesRef.current.find((n) => n.id === nodeId);
      if (!targetNode) return;
      const currentList = parseNodeChecklist(targetNode);
      const updatedList = updateChecklistItemText(currentList, itemId, text);
      const updatedBody = serializeChecklistToBody(updatedList);

      const updatedNodes = nodesRef.current.map((n) =>
        n.id === nodeId
          ? {
            ...n,
            hasCheckbox: true,
            checklist: updatedList,
            body: updatedBody,
          }
          : n
      );
      nodesRef.current = updatedNodes;
      setNodes(updatedNodes);
      triggerAutoSave(updatedNodes, edgesRef.current);
    },
    [triggerAutoSave]
  );

  const handleAddChecklistItem = useCallback(
    (nodeId: string) => {
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (!targetNode) return;
      const currentList = parseNodeChecklist(targetNode);
      const updatedList = addChecklistItem(currentList, "");
      const updatedBody = serializeChecklistToBody(updatedList);

      const updatedNodes = nodes.map((n) =>
        n.id === nodeId
          ? {
            ...n,
            hasCheckbox: true,
            checklist: updatedList,
            body: updatedBody,
            height: Math.max(n.height, Math.min(500, 80 + updatedList.length * 34)),
          }
          : n
      );
      setNodes(updatedNodes);
      pushHistory(updatedNodes, edges);
      setSelectedNodeId(nodeId);
      setEditingNodeId(nodeId);
    },
    [nodes, edges, pushHistory]
  );

  const handleInsertChecklistItemAfter = useCallback(
    (nodeId: string, afterIndex: number) => {
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (!targetNode) return;
      const currentList = parseNodeChecklist(targetNode);
      const updatedList = insertChecklistItemAfter(currentList, afterIndex, "");
      const updatedBody = serializeChecklistToBody(updatedList);

      const updatedNodes = nodes.map((n) =>
        n.id === nodeId
          ? {
            ...n,
            hasCheckbox: true,
            checklist: updatedList,
            body: updatedBody,
            height: Math.max(n.height, Math.min(500, 80 + updatedList.length * 34)),
          }
          : n
      );
      setNodes(updatedNodes);
      pushHistory(updatedNodes, edges);
    },
    [nodes, edges, pushHistory]
  );

  const handleDeleteChecklistItem = useCallback(
    (nodeId: string, itemId: string) => {
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (!targetNode) return;
      const currentList = parseNodeChecklist(targetNode);
      const updatedList = deleteChecklistItem(currentList, itemId);
      const updatedBody = serializeChecklistToBody(updatedList);

      const updatedNodes = nodes.map((n) =>
        n.id === nodeId
          ? {
            ...n,
            hasCheckbox: true,
            checklist: updatedList,
            body: updatedBody,
          }
          : n
      );
      setNodes(updatedNodes);
      pushHistory(updatedNodes, edges);
    },
    [nodes, edges, pushHistory]
  );

  const handleToggleStickyChecklist = useCallback(
    (node: IWhiteboardNode) => {
      const isCurrentlyChecklist = Boolean(
        node.hasCheckbox || (node.checklist && node.checklist.length > 0)
      );

      if (isCurrentlyChecklist) {
        const items = parseNodeChecklist(node);
        const plainBody =
          items.length > 0
            ? items.map((i) => (i.completed ? `✓ ${i.text}` : `• ${i.text}`)).join("\n")
            : node.body || "";

        updateSelectedNode({
          hasCheckbox: false,
          checklist: [],
          body: plainBody,
        });
      } else {
        const items = parseNodeChecklist(node);
        const bodyText = serializeChecklistToBody(items);

        updateSelectedNode({
          hasCheckbox: true,
          checklist: items,
          body: bodyText,
          height: Math.max(node.height, 210),
          width: Math.max(node.width, 220),
        });
      }
    },
    [updateSelectedNode]
  );

  const handleSetStickyFormat = useCallback(
    (node: IWhiteboardNode, targetFormat: NoteFormat) => {
      let newBody = node.body || "";
      let newTitle = node.title || "";
      let newChecklist = node.checklist;
      let hasCheckbox = targetFormat === "checklist";
      let newColor = node.color;
      let newWidth = node.width;
      let newHeight = node.height;

      if (targetFormat === "json") {
        if (!newBody || newBody === DEFAULT_TEXT_NOTE || newBody === DEFAULT_MARKDOWN_NOTE) {
          newBody = DEFAULT_JSON_NOTE;
        } else {
          const v = validateJson(newBody);
          if (!v.isValid) {
            newBody = JSON.stringify({ title: node.title || "Note", content: node.body || "" }, null, 2);
          }
        }
        if (!newTitle || newTitle.endsWith(".txt") || newTitle.endsWith(".md") || newTitle === "Action Items") {
          newTitle = "data.json";
        }
        if (newColor === "#EC4899" || newColor === "#38BDF8") newColor = "#F59E0B";
        newWidth = Math.max(node.width, 300);
        newHeight = Math.max(node.height, 280);
      } else if (targetFormat === "markdown") {
        if (!newBody || newBody === DEFAULT_TEXT_NOTE || newBody === DEFAULT_JSON_NOTE) {
          newBody = DEFAULT_MARKDOWN_NOTE;
        }
        if (!newTitle || newTitle.endsWith(".txt") || newTitle.endsWith(".json") || newTitle === "Action Items") {
          newTitle = "notes.md";
        }
        if (newColor === "#EC4899" || newColor === "#F59E0B") newColor = "#6366F1";
        newWidth = Math.max(node.width, 320);
        newHeight = Math.max(node.height, 300);
      } else if (targetFormat === "checklist") {
        if (!newChecklist || newChecklist.length === 0) {
          newChecklist = parseNodeChecklist(node);
          newBody = serializeChecklistToBody(newChecklist);
        }
        if (!newTitle || newTitle.endsWith(".txt") || newTitle.endsWith(".json") || newTitle.endsWith(".md")) {
          newTitle = "Action Items";
        }
        if (newColor === "#EC4899" || newColor === "#F59E0B") newColor = "#38BDF8";
        newWidth = Math.max(node.width, 240);
        newHeight = Math.max(node.height, 220);
      } else if (targetFormat === "text") {
        if (!newBody || newBody === DEFAULT_JSON_NOTE || newBody === DEFAULT_MARKDOWN_NOTE) {
          newBody = DEFAULT_TEXT_NOTE;
        }
        if (!newTitle || newTitle.endsWith(".json") || newTitle.endsWith(".md") || newTitle === "Action Items") {
          newTitle = "notes.txt";
        }
      }

      const updatedNodes = nodes.map((n) =>
        n.id === node.id
          ? {
            ...n,
            noteFormat: targetFormat,
            hasCheckbox,
            checklist: targetFormat === "checklist" ? newChecklist : undefined,
            body: newBody,
            title: newTitle,
            color: newColor,
            width: newWidth,
            height: newHeight,
          }
          : n
      );
      setNodes(updatedNodes);
      pushHistory(updatedNodes, edges);
    },
    [nodes, edges, pushHistory]
  );

  const handlePrettifyJson = useCallback(
    (nodeId: string) => {
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (!targetNode || !targetNode.body) return;
      const v = validateJson(targetNode.body);
      if (v.isValid && v.formatted) {
        updateNode(nodeId, { body: v.formatted });
      }
    },
    [nodes, updateNode]
  );

  const handleToggleMarkdownCheckboxOnNode = useCallback(
    (nodeId: string, lineIndex: number) => {
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (!targetNode || !targetNode.body) return;
      const updatedBody = toggleMarkdownCheckbox(targetNode.body, lineIndex);
      updateNode(nodeId, { body: updatedBody });
    },
    [nodes, updateNode]
  );

  // Direct add .md / .json / .txt file from PC
  const handleDirectFileAdd = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isMd = ext === "md" || ext === "markdown";
      const isJson = ext === "json";

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = (event.target?.result as string) || "";
        const format: NoteFormat = isMd ? "markdown" : isJson ? "json" : "text";
        const wW = typeof window !== "undefined" ? window.innerWidth : 1400;
        const wH = typeof window !== "undefined" ? window.innerHeight : 900;
        const coords = doubleClickMenu
          ? { x: doubleClickMenu.canvasX, y: doubleClickMenu.canvasY }
          : {
            x: Math.round(-pan.x / zoom + wW / 2 / zoom),
            y: Math.round(-pan.y / zoom + wH / 2 / zoom),
          };
        handleAddNode(
          "sticky",
          "rectangle",
          isMd ? "#6366F1" : isJson ? "#F59E0B" : "#EC4899",
          false,
          coords,
          format,
          file.name,
          content
        );
        setDoubleClickMenu(null);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [doubleClickMenu, pan, zoom, handleAddNode]
  );

  const updateNodeTitle = useCallback(
    (id: string, title: string) => {
      updateNode(id, { title });
    },
    [updateNode]
  );

  // Generate smooth SVG path from stroke points for freehand pen drawing
  const generateSvgPath = (pts: { x: number; y: number }[]): string => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.1} ${pts[0].y + 0.1}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      d += ` Q ${pts[i].x} ${pts[i].y}, ${xc} ${yc}`;
    }
    d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
    return d;
  };

  // Geometric Shape Geometry SVG Vector Renderer
  const renderShapeGeometry = (node: IWhiteboardNode) => {
    const w = Math.round(node.width);
    const h = Math.round(node.height);
    const nodeColor = node.color || "#0078D4";
    const fill =
      node.fillType === "solid"
        ? nodeColor
        : node.fillType === "none"
          ? "transparent"
          : `${nodeColor}33`;
    const stroke = nodeColor;
    const strokeWidth = 2;

    switch (node.shapeType) {
      case "circle":
        return (
          <svg width="100%" height="100%" className="overflow-visible pointer-events-none drop-shadow-md">
            <ellipse
              cx={Math.round(w / 2)}
              cy={Math.round(h / 2)}
              rx={Math.max(2, Math.round(w / 2 - strokeWidth))}
              ry={Math.max(2, Math.round(h / 2 - strokeWidth))}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              suppressHydrationWarning
            />
          </svg>
        );
      case "diamond": {
        const cx = Math.round(w / 2);
        const cy = Math.round(h / 2);
        const pts = `${cx},${strokeWidth} ${w - strokeWidth},${cy} ${cx},${h - strokeWidth} ${strokeWidth},${cy}`;
        return (
          <svg width="100%" height="100%" className="overflow-visible pointer-events-none drop-shadow-md">
            <polygon
              points={pts}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              suppressHydrationWarning
            />
          </svg>
        );
      }
      case "triangle": {
        const cx = Math.round(w / 2);
        const pts = `${cx},${strokeWidth} ${w - strokeWidth},${h - strokeWidth} ${strokeWidth},${h - strokeWidth}`;
        return (
          <svg width="100%" height="100%" className="overflow-visible pointer-events-none drop-shadow-md">
            <polygon
              points={pts}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              suppressHydrationWarning
            />
          </svg>
        );
      }
      case "star": {
        const cx = Math.round(w / 2);
        const cy = Math.round(h / 2);
        const outerR = Math.min(w, h) / 2 - strokeWidth;
        const innerR = outerR * 0.42;
        const pts: string[] = [];
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? outerR : innerR;
          const px = Math.round(cx + r * Math.cos(angle));
          const py = Math.round(cy + r * Math.sin(angle));
          pts.push(`${px},${py}`);
        }
        return (
          <svg width="100%" height="100%" className="overflow-visible pointer-events-none drop-shadow-md">
            <polygon
              points={pts.join(" ")}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              suppressHydrationWarning
            />
          </svg>
        );
      }
      case "hexagon": {
        const cx = Math.round(w / 2);
        const cy = Math.round(h / 2);
        const rx = w / 2 - strokeWidth;
        const ry = h / 2 - strokeWidth;
        const pts: string[] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const px = Math.round(cx + rx * Math.cos(angle));
          const py = Math.round(cy + ry * Math.sin(angle));
          pts.push(`${px},${py}`);
        }
        return (
          <svg width="100%" height="100%" className="overflow-visible pointer-events-none drop-shadow-md">
            <polygon
              points={pts.join(" ")}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              suppressHydrationWarning
            />
          </svg>
        );
      }
      case "rounded":
        return (
          <div
            className="w-full h-full rounded-2xl border-2 transition-all drop-shadow-md"
            style={{
              backgroundColor: fill,
              borderColor: stroke,
            }}
          />
        );
      case "rectangle":
      default:
        return (
          <div
            className="w-full h-full rounded-md border-2 transition-all drop-shadow-md"
            style={{
              backgroundColor: fill,
              borderColor: stroke,
            }}
          />
        );
    }
  };

  // Render 8 Interactive Resize Handles around any selected node
  const renderResizeHandles = (node: IWhiteboardNode) => {
    if (selectedNodeId !== node.id || selectedNodeIds.length > 1) return null;

    const handles = [
      { name: "nw", cursor: "nwse-resize", style: { top: "-5px", left: "-5px" } },
      { name: "n", cursor: "ns-resize", style: { top: "-5px", left: "calc(50% - 5px)" } },
      { name: "ne", cursor: "nesw-resize", style: { top: "-5px", right: "-5px" } },
      { name: "e", cursor: "ew-resize", style: { top: "calc(50% - 5px)", right: "-5px" } },
      { name: "se", cursor: "nwse-resize", style: { bottom: "-5px", right: "-5px" } },
      { name: "s", cursor: "ns-resize", style: { bottom: "-5px", left: "calc(50% - 5px)" } },
      { name: "sw", cursor: "nesw-resize", style: { bottom: "-5px", left: "-5px" } },
      { name: "w", cursor: "ew-resize", style: { top: "calc(50% - 5px)", left: "-5px" } },
    ];

    return (
      <div className="pointer-events-auto">
        {handles.map((h) => (
          <div
            key={h.name}
            onMouseDown={(e) => handleResizeMouseDown(node, h.name, e)}
            style={{ ...h.style, cursor: h.cursor }}
            className="absolute w-2.5 h-2.5 bg-white border border-blue-600 rounded-[2px] shadow-md z-30 hover:scale-125 transition-transform"
            title={`Resize ${h.name.toUpperCase()}`}
          />
        ))}
      </div>
    );
  };

  // Render directional arrowhead polygon at (tipX, tipY) pointing from (fromX, fromY)
  const renderArrowhead = (
    tipX: number,
    tipY: number,
    fromX: number,
    fromY: number,
    color: string = "#60A5FA",
    strokeWidth: number = 3
  ) => {
    let angle = Math.atan2(tipY - fromY, tipX - fromX);
    if (isNaN(angle)) angle = 0;
    // Dynamically scale triangle size with line width (User request: triangle increases when line width changes)
    const wingLength = Math.max(12, Math.round(strokeWidth * 2.8 + 6));
    const wingAngle = Math.PI / 6; // 30 degrees
    const wing1X = tipX - wingLength * Math.cos(angle - wingAngle);
    const wing1Y = tipY - wingLength * Math.sin(angle - wingAngle);
    const wing2X = tipX - wingLength * Math.cos(angle + wingAngle);
    const wing2Y = tipY - wingLength * Math.sin(angle + wingAngle);

    return (
      <polygon
        points={`${tipX},${tipY} ${wing1X},${wing1Y} ${wing2X},${wing2Y}`}
        fill={color}
        className="pointer-events-none"
      />
    );
  };

  // Render Connector SVG lines between nodes ("aero link setting" & branch handles with <- or -> or <->)
  const renderEdges = () => {
    return edges.map((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) return null;

      const fromCenterX = fromNode.x + fromNode.width / 2;
      const fromCenterY = fromNode.y + fromNode.height / 2;
      const toCenterX = toNode.x + toNode.width / 2;
      const toCenterY = toNode.y + toNode.height / 2;

      const dx = toCenterX - fromCenterX;
      const dy = toCenterY - fromCenterY;

      let startX: number, startY: number, endX: number, endY: number;
      let pathData: string;
      let tipFromX: number, tipFromY: number;
      let srcFromX: number, srcFromY: number;

      // Calculate horizontal vs vertical spacing gaps
      // gapX > 0 means horizontally non-overlapping with space between nodes
      const gapX =
        dx > 0
          ? toNode.x - (fromNode.x + fromNode.width)
          : fromNode.x - (toNode.x + toNode.width);

      // gapY > 0 means vertically non-overlapping with space between nodes
      const gapY =
        dy > 0
          ? toNode.y - (fromNode.y + fromNode.height)
          : fromNode.y - (toNode.y + toNode.height);

      // Dynamically select best anchor face (up, down, left, right) based on relative positions
      let isHorizontal: boolean;
      if (gapX > 0 && gapY <= 0) {
        // Horizontally separated and overlapping vertically (side-by-side row)
        isHorizontal = true;
      } else if (gapY > 0 && gapX <= 0) {
        // Vertically separated and overlapping horizontally (stacked hierarchy)
        isHorizontal = false;
      } else if (gapX > 0 && gapY > 0) {
        // Diagonally separated: choose dominant gap
        isHorizontal = gapX >= gapY;
      } else {
        // Overlapping bounding boxes: fallback to center distance
        isHorizontal = Math.abs(dx) >= Math.abs(dy);
      }

      if (isHorizontal) {
        // Horizontal connection: connect closest horizontal faces directly (right <-> left)
        if (dx > 0) {
          startX = fromNode.x + fromNode.width;
          startY = fromCenterY;
          endX = toNode.x;
          endY = toCenterY;
        } else {
          startX = fromNode.x;
          startY = fromCenterY;
          endX = toNode.x + toNode.width;
          endY = toCenterY;
        }

        if (edge.style === "straight") {
          pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
          tipFromX = startX;
          tipFromY = startY;
          srcFromX = endX;
          srcFromY = endY;
        } else if (edge.style === "curved") {
          const midX = startX + (endX - startX) / 2;
          pathData = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
          tipFromX = midX;
          tipFromY = endY;
          srcFromX = midX;
          srcFromY = startY;
        } else {
          const midX = startX + (endX - startX) / 2;
          pathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
          tipFromX = midX;
          tipFromY = endY;
          srcFromX = midX;
          srcFromY = startY;
        }
      } else {
        // Vertical connection: connect closest vertical faces directly (bottom <-> top)
        if (dy > 0) {
          startX = fromCenterX;
          startY = fromNode.y + fromNode.height;
          endX = toCenterX;
          endY = toNode.y;
        } else {
          startX = fromCenterX;
          startY = fromNode.y;
          endX = toCenterX;
          endY = toNode.y + toNode.height;
        }

        if (edge.style === "straight") {
          pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
          tipFromX = startX;
          tipFromY = startY;
          srcFromX = endX;
          srcFromY = endY;
        } else if (edge.style === "curved") {
          const midY = startY + (endY - startY) / 2;
          pathData = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
          tipFromX = endX;
          tipFromY = midY;
          srcFromX = startX;
          srcFromY = midY;
        } else {
          const midY = startY + (endY - startY) / 2;
          pathData = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
          tipFromX = endX;
          tipFromY = midY;
          srcFromX = startX;
          srcFromY = midY;
        }
      }

      const isSelectedEdge = selectedEdgeId === edge.id;
      const isHovered = hoveredEdgeId === edge.id;
      const edgeColor = isSelectedEdge ? "#38BDF8" : isHovered ? "#93C5FD" : edge.color || "#60A5FA";
      const dir = edge.arrowDirection || "forward";
      const midPointX = (startX + endX) / 2;
      const midPointY = (startY + endY) / 2;

      return (
        <g key={edge.id} className="group">
          {/* Thick transparent hit-box path for easy click and hover */}
          <path
            d={pathData}
            fill="none"
            stroke="transparent"
            strokeWidth="24"
            className="pointer-events-auto cursor-pointer"
            onMouseEnter={() => setHoveredEdgeId(edge.id)}
            onMouseLeave={() => setHoveredEdgeId((prev) => (prev === edge.id ? null : prev))}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEdgeId(edge.id);
              setEdgeSettingsPopover({
                edgeId: edge.id,
                x: midPointX,
                y: midPointY,
              });
            }}
          />

          {/* Visible line */}
          <path
            d={pathData}
            fill="none"
            stroke={edgeColor}
            strokeWidth={isSelectedEdge ? "3" : isHovered ? "2.5" : "2"}
            strokeDasharray={edge.style === "dashed" ? "6,4" : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors pointer-events-none"
          />

          {/* Forward / Target Arrowhead (-> or <->) */}
          {(dir === "forward" || dir === "bidirectional") &&
            renderArrowhead(endX, endY, tipFromX, tipFromY, edgeColor)}

          {/* Backward / Source Arrowhead (<- or <->) */}
          {(dir === "backward" || dir === "bidirectional") &&
            renderArrowhead(startX, startY, srcFromX, srcFromY, edgeColor)}

          {/* Interactive Arrow Link Setting Handle: "+" circular button - ONLY VISIBLE ON HOVER OR SELECTED */}
          {(isSelectedEdge || isHovered) && (
            <g
              className="pointer-events-auto cursor-pointer animate-in fade-in-50"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEdgeId(edge.id);
                setEdgeSettingsPopover({
                  edgeId: edge.id,
                  x: midPointX,
                  y: midPointY,
                });
              }}
            >
              <title>Arrow Link Setting: Click to add branch or adjust link</title>
              <circle
                cx={midPointX}
                cy={midPointY}
                r="11"
                fill="#121316"
                stroke={isSelectedEdge ? "#38BDF8" : "#60A5FA"}
                strokeWidth="2"
                className="hover:scale-125 transition-transform"
              />
              <text
                x={midPointX}
                y={midPointY + 4}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="12"
                fontWeight="bold"
                className="select-none pointer-events-none"
              >
                +
              </text>
            </g>
          )}
        </g>
      );
    });
  };

  // Handle dropping draggable toolbar items or files onto canvas
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFileOver(false);
    setIsDraggingItemOver(false);

    // Check if an item was dragged from bottom toolbar or palettes
    const customData =
      e.dataTransfer.getData("application/taskflow-item") ||
      e.dataTransfer.getData("text/plain");

    if (customData) {
      try {
        const parsed = JSON.parse(customData);
        const dropCoords = getCanvasCoords(e.clientX, e.clientY);

        if (parsed.category === "table-grid") {
          handleCreateTableGrid(
            parsed.rows || 3,
            parsed.cols || 3,
            parsed.gap !== undefined ? parsed.gap : 0,
            dropCoords
          );
          setShowTableDialog(false);
          return;
        } else if (parsed.category === "functional-area") {
          handleInsertFunctionalArea(parsed.areaType, dropCoords);
          setShowTemplateSelector(false);
          return;
        } else if (parsed.category === "node") {
          handleAddNode(
            parsed.type,
            parsed.shapeType || "rectangle",
            parsed.color,
            parsed.isChecklist,
            dropCoords,
            parsed.noteFormat,
            parsed.initialTitle,
            parsed.initialBody,
            parsed.iconName,
            parsed.subtitle,
            parsed.iconGroup
          );
          setShowShapePalette(false);
          setShowIconGallery(false);
          return;
        }
      } catch { }
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files, e.clientX, e.clientY);
    }
  };

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes("Files")) {
          setIsDraggingFileOver(true);
        } else {
          setIsDraggingItemOver(true);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        if (!isDraggingFileOver && e.dataTransfer.types.includes("Files")) {
          setIsDraggingFileOver(true);
        }
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDraggingFileOver(false);
          setIsDraggingItemOver(false);
        }
      }}
      onDrop={handleCanvasDrop}
      className={`${isFullscreen
        ? "fixed inset-0 z-[999999] w-screen h-screen m-0 p-0"
        : "relative w-full h-[calc(100vh-64px)]"
        } overflow-hidden bg-[#0D0E11] text-[#E1DFDD] select-none`}
    >
      {/* Visual Drop Guide Pill when dragging toolbar items */}
      {isDraggingItemOver && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-blue-600/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl border border-blue-400/50 animate-in fade-in-50 flex items-center gap-2">
          <MousePointer className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
          <span>Release to place item at cursor position</span>
        </div>
      )}

      {/* Drag & Drop Visual Drop Zone Overlay */}
      {isDraggingFileOver && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-blue-500/10 backdrop-blur-[2px] border-2 border-dashed border-blue-400/60 rounded-xl flex items-center justify-center m-4 animate-in fade-in-50">
          <div className="bg-[#12141A]/95 border border-blue-500/40 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white">
            <Upload className="w-6 h-6 text-blue-400 animate-bounce" />
            <div>
              <p className="font-semibold text-sm text-blue-100">Drop files onto Whiteboard Canvas</p>
              <p className="text-xs text-gray-400">Supports .graphml, .pdf, .json, .md, images & diagrams (Hosted on AWS S3)</p>
            </div>
          </div>
        </div>
      )}
      {/* Hidden File Input for Image, SVG, PDF, GraphML, JSON, and Markdown upload from PC */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.svg,.graphml,.xml,.pdf,.json,.md,.markdown,.txt"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processUploadedFiles(e.target.files);
          }
          e.target.value = "";
        }}
      />

      {/* Hidden File Input for Direct .md, .json, .txt Sticky Note Import */}
      <input
        ref={directFileInputRef}
        type="file"
        accept=".md,.markdown,.json,.txt"
        className="hidden"
        onChange={handleDirectFileAdd}
      />

      {/* 1. TOP HEADER BAR (Breadcrumb, Title, Favorite, Author Avatar, Share, Fullscreen) */}
      <header className="absolute top-0 left-0 right-0 h-13 px-4 bg-[#121316]/10 border-b border-[#22242B] flex items-center justify-between z-30 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/whiteboards"
            className="p-1.5 rounded-md hover:bg-[#202228] text-gray-400 hover:text-white transition-colors"
            title="Back to Whiteboards"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                triggerAutoSave(nodes, edges, e.target.value);
              }}
              className="bg-transparent text-sm font-bold text-white focus:bg-[#1A1C23] px-2 py-1 rounded border border-transparent focus:border-blue-500 focus:outline-none transition-all"
            />
            <button
              onClick={() => {
                setIsFavorite(!isFavorite);
                triggerAutoSave(nodes, edges);
              }}
              className="p-1 text-gray-400 hover:text-amber-400 transition-colors"
              title="Toggle Favorite"
            >
              <Star
                className={`w-4 h-4 ${isFavorite ? "text-amber-400 fill-amber-400" : ""}`}
              />
            </button>
          </div>

          {/* Auto-save telemetry status */}
          <button
            type="button"
            onClick={() => {
              triggerAutoSave(nodesRef.current, edgesRef.current, undefined, undefined, true);
            }}
            className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 font-mono cursor-pointer transition-colors"
            title="Click to force immediate save"
          >
            {saveStatus === "saving" ? (
              <span className="text-amber-400">Saving...</span>
            ) : saveStatus === "saved" ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Saved
              </span>
            ) : (
              <span className="text-gray-400">Unsaved edits (click to save)</span>
            )}
          </button>
        </div>

        {/* Header Right Tools */}
        <div className="flex items-center gap-2.5">
          {/* Author avatar from screenshot ("HS") */}
          <div
            className="w-7 h-7 rounded-full bg-[#2A2D36] border border-[#3A3D49] text-gray-200 font-bold text-[10px] flex items-center justify-center shadow-xs"
            title={currentUserName}
          >
            {initialBoard.authorInitials || "HS"}
          </div>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert("Board link copied to clipboard!");
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-[#202228] hover:bg-[#282B33] text-gray-200 border border-[#30333D] rounded-md transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Edge-to-Edge True Fullscreen Maximize Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-md hover:bg-[#202228] transition-colors ${isFullscreen ? "text-cyan-400 bg-[#202228]" : "text-gray-400 hover:text-white"
              }`}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Full Screen (Zero Spaces)"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. FLOATING FORMAT BAR (Shown above selected node - Differentiated by Object Type) */}
      {selectedNode && selectedNodeIds.length <= 1 && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute z-40 bg-[#1A1C22] border border-[#2D3039] rounded-lg shadow-2xl px-2.5 py-1.5 flex items-center gap-2 text-xs text-gray-300 animate-in fade-in-50"
          style={{
            left: Math.max(20, Math.min(window.innerWidth - 760, selectedNode.x * zoom + pan.x)),
            top: Math.max(60, selectedNode.y * zoom + pan.y - 48),
          }}
        >
          <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
            {selectedNode.type === "shape"
              ? selectedNode.shapeType || "shape"
              : selectedNode.type === "icon"
                ? `${(selectedNode.iconGroup || "tech").toUpperCase()} · ${(selectedNode.iconName || "ICON").toUpperCase()}`
                : selectedNode.type}
          </span>

          {selectedNode.groupId && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleUngroupSelectedNodes}
                className="px-1.5 py-0.5 rounded bg-blue-500/20 hover:bg-amber-500/25 text-blue-300 hover:text-amber-200 border border-blue-500/35 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                title="Linked as group entity (drag moves together). Click to unlink."
              >
                <Link2 className="w-2.5 h-2.5 text-blue-400" />
                <span>Linked Group</span>
                <span className="text-[9px] text-gray-400">· Unlink</span>
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => handleDuplicateGroup(selectedNode.groupId)}
                className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 hover:text-white border border-cyan-500/35 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                title="Copy entire linked group: Clones in linked form so you can safely drag to a fresh area without dislocation"
              >
                <Copy className="w-2.5 h-2.5 text-cyan-400" />
                <span>Copy Group</span>
              </button>
            </div>
          )}

          <div className="h-4 w-px bg-[#30333D] shrink-0" />

          {/* A. SHAPE CONTROLS */}
          {selectedNode.type === "shape" && (
            <>
              {/* Shape Type Switcher */}
              <div className="relative" ref={shapeSwitcherRef}>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowShapeSwitcher(!showShapeSwitcher);
                  }}
                  className="p-1 rounded hover:bg-[#282A33] text-gray-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="Switch Shape Geometry"
                >
                  {selectedNode.shapeType === "circle" ? (
                    <Circle className="w-3.5 h-3.5 text-blue-400" />
                  ) : selectedNode.shapeType === "diamond" ? (
                    <Diamond className="w-3.5 h-3.5 text-blue-400" />
                  ) : selectedNode.shapeType === "triangle" ? (
                    <Triangle className="w-3.5 h-3.5 text-blue-400" />
                  ) : selectedNode.shapeType === "hexagon" ? (
                    <Hexagon className="w-3.5 h-3.5 text-blue-400" />
                  ) : selectedNode.shapeType === "star" ? (
                    <Star className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-blue-400" />
                  )}
                </button>

                {showShapeSwitcher && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 mt-2 p-1.5 bg-[#1A1C22] border border-[#2E313B] rounded-lg shadow-2xl grid grid-cols-4 gap-1 z-50 w-36"
                  >
                    {[
                      { type: "rectangle", icon: Square, label: "Rectangle" },
                      { type: "rounded", icon: Square, label: "Rounded" },
                      { type: "circle", icon: Circle, label: "Circle" },
                      { type: "diamond", icon: Diamond, label: "Diamond" },
                      { type: "triangle", icon: Triangle, label: "Triangle" },
                      { type: "hexagon", icon: Hexagon, label: "Hexagon" },
                      { type: "star", icon: Star, label: "Star" },
                    ].map((st) => {
                      const Icon = st.icon;
                      return (
                        <button
                          key={st.type}
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSelectedNode({ shapeType: st.type as any });
                            setShowShapeSwitcher(false);
                          }}
                          className={`p-1.5 rounded hover:bg-[#282A33] flex items-center justify-center cursor-pointer ${selectedNode.shapeType === st.type ? "bg-blue-600 text-white" : "text-gray-300"
                            }`}
                          title={st.label}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bold & Aa & Text Size [ ]px */}
              <button
                onClick={() =>
                  updateSelectedNode({
                    fontWeight: selectedNode.fontWeight === "bold" ? "normal" : "bold",
                  })
                }
                className={`p-1 rounded hover:bg-[#282A33] ${selectedNode.fontWeight === "bold" ? "text-blue-400 bg-[#282A33]" : ""
                  }`}
                title="Bold text"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  const cur = parseFontSizePx(selectedNode.fontSize, 13);
                  const next = cur < 15 ? 16 : cur < 20 ? 22 : cur < 26 ? 28 : 12;
                  updateSelectedNode({ fontSize: `${next}px` });
                }}
                className="px-1.5 py-0.5 rounded hover:bg-[#282A33] text-[11px] font-semibold text-gray-300 hover:text-white"
                title="Cycle Preset Font Sizes (Aa)"
              >
                Aa
              </button>

              <FontSizeControl
                fontSize={selectedNode.fontSize}
                onChange={(sz) => updateSelectedNode({ fontSize: sz })}
                defaultPx={13}
              />

              <TextColorPicker
                value={selectedNode.textColor}
                onChange={(color) => updateSelectedNode({ textColor: color })}
                defaultColor="#FFFFFF"
              />

              {/* Fill Type */}
              <div className="flex items-center gap-0.5 bg-[#121316] p-0.5 rounded border border-[#282B33]">
                {(["solid", "tint", "none"] as const).map((ft) => (
                  <button
                    key={ft}
                    onClick={() => {
                      setActiveFillType(ft);
                      updateSelectedNode({ fillType: ft });
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] capitalize ${selectedNode.fillType === ft
                      ? "bg-blue-600 text-white font-bold"
                      : "text-gray-400 hover:text-white"
                      }`}
                  >
                    {ft}
                  </button>
                ))}
              </div>

              {/* Color Swatch */}
              <div className="relative" data-palette-container="true">
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStylePalette(!showStylePalette);
                  }}
                  className="w-4 h-4 rounded-full border border-white/40 shadow-xs cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: selectedNode.color || "#0078D4" }}
                  title="Change Box Color"
                />

                {showStylePalette && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 mt-2 p-2 bg-[#1A1C22] border border-[#2E313B] rounded-lg shadow-2xl flex items-center gap-1 z-50"
                  >
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveColor(c.value);
                          updateSelectedNode({ color: c.value });
                          setShowStylePalette(false);
                        }}
                        className="w-5 h-5 rounded-full hover:scale-110 transition-transform border border-white/20 cursor-pointer"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => handleAddBranchFromNode(selectedNode.id)}
                className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Add Branch Node (+)"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>+ Branch</span>
              </button>
            </>
          )}

          {/* B. ICON NODE CONTROLS */}
          {selectedNode.type === "icon" && (
            <>
              {/* Color Swatch */}
              <div className="relative shrink-0" data-palette-container="true">
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStylePalette(!showStylePalette);
                  }}
                  className="w-4 h-4 rounded-full border border-white/40 shadow-xs cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: selectedNode.color || "#0EA5E9" }}
                  title="Change Component Color"
                />

                {showStylePalette && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 mt-2 p-2 bg-[#1A1C22] border border-[#2E313B] rounded-lg shadow-2xl flex items-center gap-1 z-50"
                  >
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveColor(c.value);
                          updateSelectedNode({ color: c.value });
                          setShowStylePalette(false);
                        }}
                        className="w-5 h-5 rounded-full hover:scale-110 transition-transform border border-white/20 cursor-pointer"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Bold text */}
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  updateSelectedNode({
                    fontWeight: selectedNode.fontWeight === "bold" ? "normal" : "bold",
                  });
                }}
                className={`p-1 rounded hover:bg-[#282A33] cursor-pointer ${selectedNode.fontWeight === "bold" ? "text-blue-400 bg-[#282A33]" : ""
                  }`}
                title="Bold title"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              <FontSizeControl
                fontSize={selectedNode.fontSize}
                onChange={(sz) => updateSelectedNode({ fontSize: sz })}
                defaultPx={12}
              />

              {/* Text Color Picker */}
              <TextColorPicker
                value={selectedNode.textColor}
                onChange={(color) => updateSelectedNode({ textColor: color })}
                defaultColor="#FFFFFF"
              />

              <div className="h-4 w-px bg-[#30333D] shrink-0" />

              {/* Branch Connection */}
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => handleAddBranchFromNode(selectedNode.id)}
                className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Add Connected Branch Node (+)"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>+ Branch</span>
              </button>
            </>
          )}

          {/* B. TASK CONTROLS */}
          {selectedNode.type === "task" && (
            <>
              {/* Box Color Swatch - Placed first so it is immediately prominent and never cut off */}
              <div className="relative shrink-0" data-palette-container="true">
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStylePalette(!showStylePalette);
                  }}
                  className="w-4 h-4 rounded-full border border-white/40 shadow-xs cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: selectedNode.color || "#0078D4" }}
                  title="Change Box Color"
                />

                {showStylePalette && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 mt-2 p-2 bg-[#1A1C22] border border-[#2E313B] rounded-lg shadow-2xl flex items-center gap-1 z-50"
                  >
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveColor(c.value);
                          updateSelectedNode({ color: c.value });
                          setShowStylePalette(false);
                        }}
                        className="w-5 h-5 rounded-full hover:scale-110 transition-transform border border-white/20 cursor-pointer"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Text / Header Color Picker */}
              <TextColorPicker
                value={selectedNode.textColor}
                onChange={(color) => updateSelectedNode({ textColor: color })}
                defaultColor="#FDE68A"
              />

              <div className="h-4 w-px bg-[#30333D] shrink-0" />

              {/* Status pills with smart progress presets */}
              <div className="flex items-center gap-0.5 bg-[#121316] p-0.5 rounded border border-[#282B33] shrink-0">
                {(["Active", "In Progress", "Completed", "Backlog"] as const).map((st) => {
                  const isCurrent = (selectedNode.status || "").toLowerCase() === st.toLowerCase();
                  return (
                    <button
                      key={st}
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        let newSubtitle = st as string;
                        let prog = 0;
                        if (st === "Completed") {
                          newSubtitle = "Completed (100%)";
                          prog = 100;
                        } else if (st === "In Progress") {
                          const match = (selectedNode.subtitle || "").match(/\((\d+)%\)/);
                          prog = match ? parseInt(match[1], 10) : 50;
                          newSubtitle = `In Progress (${prog}%)`;
                        } else if (st === "Active") {
                          const match = (selectedNode.subtitle || "").match(/\((\d+)%\)/);
                          prog = match ? parseInt(match[1], 10) : 100;
                          newSubtitle = `Active (${prog}%)`;
                        } else if (st === "Backlog") {
                          newSubtitle = "Planned (0%)";
                          prog = 0;
                        }
                        handleLiveTextChange(selectedNode.id, { status: st, subtitle: newSubtitle, progress: prog });
                        updateSelectedNode({ status: st, subtitle: newSubtitle, progress: prog });
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${isCurrent
                        ? "bg-blue-600 text-white font-bold"
                        : "text-gray-400 hover:text-white"
                        }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>

              {/* Tag / Progress Name & Percentage Input */}
              <div className="flex items-center gap-1 bg-[#121316] px-1.5 py-0.5 rounded border border-[#282B33] shrink-0">
                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">Tag / Progress:</span>
                <input
                  type="text"
                  value={selectedNode.subtitle || ""}
                  placeholder="e.g. Completed (100%) or President"
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleLiveTextChange(selectedNode.id, { subtitle: val });
                    updateSelectedNode({ subtitle: val });
                  }}
                  className="bg-[#1A1C22] text-xs text-blue-200 border border-blue-500/30 focus:border-blue-400 px-1.5 py-0.5 rounded w-32 md:w-36 focus:outline-none font-bold placeholder:text-gray-500"
                  title="Edit bottom tag or progress name & percentage"
                />
              </div>

              {/* Quick Percentage Presets */}
              <div className="flex items-center gap-0.5 bg-[#121316] p-0.5 rounded border border-[#282B33] shrink-0">
                {[0, 25, 50, 75, 90, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      const curr = selectedNode.subtitle || selectedNode.status || "In Progress";
                      const base = curr.replace(/\s*\(\d+%\)/, "").trim() || "Progress";
                      const newSub = `${base} (${pct}%)`;
                      handleLiveTextChange(selectedNode.id, { subtitle: newSub, progress: pct });
                      updateSelectedNode({ subtitle: newSub, progress: pct });
                    }}
                    className="px-1 py-0.5 rounded text-[9px] font-bold text-blue-300 hover:text-white hover:bg-blue-600/40 transition-colors cursor-pointer"
                    title={`Set progress to ${pct}%`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              <FontSizeControl
                fontSize={selectedNode.fontSize}
                onChange={(sz) => updateSelectedNode({ fontSize: sz })}
                defaultPx={11}
              />

              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => handleAddBranchFromNode(selectedNode.id)}
                className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                title="Add Branch Node (+)"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>+ Branch</span>
              </button>
            </>
          )}

          {/* C. STICKY NOTE CONTROLS (Text, JSON, Markdown, Checklist) */}
          {selectedNode.type === "sticky" && (() => {
            const currentFormat: NoteFormat =
              selectedNode.noteFormat ||
              (selectedNode.hasCheckbox || (selectedNode.checklist && selectedNode.checklist.length > 0)
                ? "checklist"
                : selectedNode.body?.trim().startsWith("{") && selectedNode.body?.trim().endsWith("}")
                  ? "json"
                  : "text");

            return (
              <>
                {/* Format Switcher Selector */}
                <div className="flex items-center gap-0.5 bg-black/40 p-0.5 rounded-lg border border-white/10">
                  <button
                    onClick={() => handleSetStickyFormat(selectedNode, "text")}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${currentFormat === "text"
                      ? "bg-pink-600/40 text-pink-300 ring-1 ring-pink-500/50"
                      : "text-gray-400 hover:text-white"
                      }`}
                    title="Plain Text File Structuring"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Text</span>
                  </button>

                  <button
                    onClick={() => handleSetStickyFormat(selectedNode, "json")}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${currentFormat === "json"
                      ? "bg-amber-600/40 text-amber-300 ring-1 ring-amber-500/50"
                      : "text-gray-400 hover:text-white"
                      }`}
                    title="JSON Formatting Structure"
                  >
                    <Braces className="w-3 h-3" />
                    <span>JSON</span>
                  </button>

                  <button
                    onClick={() => handleSetStickyFormat(selectedNode, "markdown")}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${currentFormat === "markdown"
                      ? "bg-indigo-600/40 text-indigo-300 ring-1 ring-indigo-500/50"
                      : "text-gray-400 hover:text-white"
                      }`}
                    title="Rendered Markdown Format (.md)"
                  >
                    <FileCode className="w-3 h-3" />
                    <span>.MD</span>
                  </button>

                  <button
                    onClick={() => handleSetStickyFormat(selectedNode, "checklist")}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${currentFormat === "checklist"
                      ? "bg-cyan-600/40 text-cyan-300 ring-1 ring-cyan-500/50"
                      : "text-gray-400 hover:text-white"
                      }`}
                    title="Todo Checklist with Checkboxes"
                  >
                    <ListTodo className="w-3 h-3" />
                    <span>Todo</span>
                  </button>
                </div>

                {/* JSON Format Specific Actions */}
                {currentFormat === "json" && (
                  <button
                    onClick={() => handlePrettifyJson(selectedNode.id)}
                    className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 hover:text-amber-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Auto-format / Prettify JSON with 2-space indentation"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Prettify</span>
                  </button>
                )}

                {/* Markdown Format Specific Actions */}
                {currentFormat === "markdown" && (
                  <button
                    onClick={() => {
                      if (editingNodeId === selectedNode.id) {
                        setEditingNodeId(null);
                      } else {
                        setEditingNodeId(selectedNode.id);
                      }
                    }}
                    className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title={editingNodeId === selectedNode.id ? "Switch to Rendered Preview" : "Edit Raw Markdown"}
                  >
                    {editingNodeId === selectedNode.id ? (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Rendered</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Raw</span>
                      </>
                    )}
                  </button>
                )}

                {/* Checklist Format Specific Actions */}
                {currentFormat === "checklist" && (
                  <button
                    onClick={() => handleAddChecklistItem(selectedNode.id)}
                    className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Add Item to Checklist"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Task</span>
                  </button>
                )}

                {/* Direct Import file into this note */}
                <button
                  onClick={() => directFileInputRef.current?.click()}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Import .md, .json, or .txt file directly into whiteboard"
                >
                  <FileUp className="w-3 h-3 text-cyan-400" />
                  <span>Import</span>
                </button>

                <div className="h-4 w-px bg-[#30333D]" />

                {/* Pastel Color Swatches */}
                <div className="flex items-center gap-1">
                  {[
                    { color: "#F472B6", name: "Pink" },
                    { color: "#FBBF24", name: "Yellow" },
                    { color: "#34D399", name: "Green" },
                    { color: "#38BDF8", name: "Cyan" },
                    { color: "#A78BFA", name: "Purple" },
                    { color: "#F87171", name: "Red" },
                  ].map((c) => (
                    <button
                      key={c.name}
                      onClick={() => updateSelectedNode({ color: c.color })}
                      className={`w-4 h-4 rounded-full transition-transform ${selectedNode.color === c.color ? "ring-2 ring-white scale-110" : "hover:scale-110"
                        }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>

                <div className="h-4 w-px bg-[#30333D]" />

                <button
                  onClick={() => updateSelectedNode({ textAlign: "left" })}
                  className={`p-1 rounded hover:bg-[#282A33] ${selectedNode.textAlign === "left" || !selectedNode.textAlign ? "text-blue-400 bg-[#282A33]" : ""
                    }`}
                  title="Align Left"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateSelectedNode({ textAlign: "center" })}
                  className={`p-1 rounded hover:bg-[#282A33] ${selectedNode.textAlign === "center" ? "text-blue-400 bg-[#282A33]" : ""
                    }`}
                  title="Align Center"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateSelectedNode({ textAlign: "right" })}
                  className={`p-1 rounded hover:bg-[#282A33] ${selectedNode.textAlign === "right" ? "text-blue-400 bg-[#282A33]" : ""
                    }`}
                  title="Align Right"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>

                <FontSizeControl
                  fontSize={selectedNode.fontSize}
                  onChange={(sz) => updateSelectedNode({ fontSize: sz })}
                  defaultPx={12}
                />

                <TextColorPicker
                  value={selectedNode.textColor}
                  onChange={(color) => updateSelectedNode({ textColor: color })}
                  defaultColor="#FBCFE8"
                />
              </>
            );
          })()}

          {/* D. TEXT BLOCK CONTROLS */}
          {selectedNode.type === "text" && (
            <>
              {/* Font Size Preset & Exact [ ]px Field */}
              <div className="flex items-center gap-0.5 bg-[#121316] p-0.5 rounded border border-[#282B33]">
                {(["Small", "Medium", "Large", "Huge"] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => updateSelectedNode({ fontSize: sz })}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${(selectedNode.fontSize || "Medium") === sz
                      ? "bg-blue-600 text-white font-bold"
                      : "text-gray-400 hover:text-white"
                      }`}
                  >
                    {sz[0]}
                  </button>
                ))}
              </div>

              <FontSizeControl
                fontSize={selectedNode.fontSize}
                onChange={(sz) => updateSelectedNode({ fontSize: sz })}
                defaultPx={15}
              />

              <button
                onClick={() =>
                  updateSelectedNode({
                    fontWeight: selectedNode.fontWeight === "bold" ? "normal" : "bold",
                  })
                }
                className={`p-1 rounded hover:bg-[#282A33] ${selectedNode.fontWeight === "bold" ? "text-blue-400 bg-[#282A33]" : ""
                  }`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => updateSelectedNode({ textAlign: "left" })}
                className={`p-1 rounded hover:bg-[#282A33] ${selectedNode.textAlign === "left" || !selectedNode.textAlign ? "text-blue-400 bg-[#282A33]" : ""
                  }`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateSelectedNode({ textAlign: "center" })}
                className={`p-1 rounded hover:bg-[#282A33] ${selectedNode.textAlign === "center" ? "text-blue-400 bg-[#282A33]" : ""
                  }`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateSelectedNode({ textAlign: "right" })}
                className={`p-1 rounded hover:bg-[#282A33] ${selectedNode.textAlign === "right" ? "text-blue-400 bg-[#282A33]" : ""
                  }`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>

              <TextColorPicker
                value={selectedNode.textColor || selectedNode.color}
                onChange={(color) => updateSelectedNode({ color, textColor: color })}
                defaultColor="#FFFFFF"
              />
            </>
          )}

          {/* E. IMAGE & FILE CONTROLS */}
          {selectedNode.type === "image" && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#252834] hover:bg-[#2E3242] text-white text-[11px] font-medium"
                title="Replace Image or Diagram"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Replace</span>
              </button>
            </>
          )}

          {(selectedNode.type === "pdf" ||
            selectedNode.type === "graphml" ||
            selectedNode.type === "json" ||
            selectedNode.type === "markdown" ||
            selectedNode.type === "file") && (
              <>
                {selectedNode.fileUrl && (
                  <a
                    href={selectedNode.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#252834] hover:bg-[#2E3242] text-white text-[11px] font-medium transition-colors"
                    title="Open file from AWS S3"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>Open S3 File</span>
                  </a>
                )}
                {selectedNode.type === "graphml" && selectedNode.previewText && (
                  <button
                    onClick={() => handleImportGraphMLToCanvas(selectedNode)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 text-[11px] font-medium transition-colors border border-indigo-500/30"
                    title="Unpack GraphML topology into native canvas nodes & arrows"
                  >
                    <Network className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Unpack Topology</span>
                  </button>
                )}
              </>
            )}

          {/* F. DRAWING CONTROLS */}
          {selectedNode.type === "drawing" && (
            <>
              <div className="flex items-center gap-0.5 bg-[#121316] p-0.5 rounded border border-[#282B33]">
                {[2, 4, 8].map((sw) => (
                  <button
                    key={sw}
                    onClick={() => updateSelectedNode({ strokeWidth: sw })}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${(selectedNode.strokeWidth || 3) === sw
                      ? "bg-pink-600 text-white font-bold"
                      : "text-gray-400 hover:text-white"
                      }`}
                  >
                    {sw}px
                  </button>
                ))}
              </div>

              {/* Stroke Color */}
              <div className="relative">
                <button
                  onClick={() => setShowStylePalette(!showStylePalette)}
                  className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                  style={{ backgroundColor: selectedNode.color || "#EC4899" }}
                  title="Stroke Color"
                />

                {showStylePalette && (
                  <div className="absolute top-full left-0 mt-2 p-2 bg-[#1A1C22] border border-[#2E313B] rounded-lg shadow-2xl flex items-center gap-1 z-50">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          updateSelectedNode({ color: c.value });
                          setShowStylePalette(false);
                        }}
                        className="w-5 h-5 rounded-full hover:scale-110 transition-transform border border-white/20"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* G. LOGO / LEGEND CONTROLS */}
          {(selectedNode.type === "logo" || selectedNode.type === "legend") && (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowStylePalette(!showStylePalette)}
                  className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                  style={{ backgroundColor: selectedNode.color || "#06B6D4" }}
                  title="Change Color"
                />

                {showStylePalette && (
                  <div className="absolute top-full left-0 mt-2 p-2 bg-[#1A1C22] border border-[#2E313B] rounded-lg shadow-2xl flex items-center gap-1 z-50">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          updateSelectedNode({ color: c.value });
                          setShowStylePalette(false);
                        }}
                        className="w-5 h-5 rounded-full hover:scale-110 transition-transform border border-white/20"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* H. STRAIGHT LINE & INDEPENDENT ARROW CONTROLS */}
          {(selectedNode.type === "line" ||
            selectedNode.shapeType === "line" ||
            selectedNode.shapeType === "arrow") && (
              <>
                {/* Arrow Direction switch: None, Forward ->, Backward <-, Bidirectional <-> */}
                <div className="flex items-center gap-0.5 bg-[#121316] p-0.5 rounded border border-[#282B33]">
                  <button
                    onClick={() =>
                      updateSelectedNode({
                        shapeType: "line",
                        arrowDirection: "none",
                      })
                    }
                    className={`p-1 rounded text-xs transition-colors ${(selectedNode.arrowDirection === "none" || !selectedNode.arrowDirection) &&
                      selectedNode.shapeType !== "arrow"
                      ? "bg-blue-600 text-white font-bold"
                      : "text-gray-400 hover:text-white"
                      }`}
                    title="Plain Line"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      updateSelectedNode({
                        shapeType: "arrow",
                        arrowDirection: "forward",
                      })
                    }
                    className={`p-1 rounded text-xs transition-colors ${selectedNode.arrowDirection === "forward" ||
                      (selectedNode.shapeType === "arrow" && !selectedNode.arrowDirection)
                      ? "bg-blue-600 text-white font-bold"
                      : "text-gray-400 hover:text-white"
                      }`}
                    title="Forward Arrow (->)"
                  >
                    <MoveRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      updateSelectedNode({
                        shapeType: "arrow",
                        arrowDirection: "backward",
                      })
                    }
                    className={`p-1 rounded text-xs transition-colors ${selectedNode.arrowDirection === "backward"
                      ? "bg-blue-600 text-white font-bold"
                      : "text-gray-400 hover:text-white"
                      }`}
                    title="Backward Arrow (<-)"
                  >
                    <MoveLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      updateSelectedNode({
                        shapeType: "arrow",
                        arrowDirection: "bidirectional",
                      })
                    }
                    className={`p-1 rounded text-xs transition-colors ${selectedNode.arrowDirection === "bidirectional"
                      ? "bg-blue-600 text-white font-bold"
                      : "text-gray-400 hover:text-white"
                      }`}
                    title="Bidirectional Arrow (<->)"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Stroke Style: Solid vs Dashed */}
                <div className="flex items-center gap-0.5 bg-[#121316] p-0.5 rounded border border-[#282B33]">
                  <button
                    onClick={() => updateSelectedNode({ lineStyle: "solid" })}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${selectedNode.lineStyle !== "dashed"
                      ? "bg-blue-600 text-white font-bold"
                      : "text-gray-400 hover:text-white"
                      }`}
                    title="Solid Line"
                  >
                    Solid
                  </button>
                  <button
                    onClick={() => updateSelectedNode({ lineStyle: "dashed" })}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${selectedNode.lineStyle === "dashed"
                      ? "bg-blue-600 text-white font-bold"
                      : "text-gray-400 hover:text-white"
                      }`}
                    title="Dashed Line"
                  >
                    Dashed
                  </button>
                </div>

                {/* Stroke Width Presets */}
                <div className="flex items-center gap-0.5 bg-[#121316] p-0.5 rounded border border-[#282B33]">
                  {[2, 3, 5, 8].map((sw) => (
                    <button
                      key={sw}
                      onClick={() => updateSelectedNode({ strokeWidth: sw })}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${(selectedNode.strokeWidth || 3) === sw
                        ? "bg-blue-600 text-white font-bold"
                        : "text-gray-400 hover:text-white"
                        }`}
                    >
                      {sw}px
                    </button>
                  ))}
                </div>

                {/* Stroke Color Swatch & Palette */}
                <div className="relative">
                  <button
                    onClick={() => setShowStylePalette(!showStylePalette)}
                    className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                    style={{ backgroundColor: selectedNode.color || "#60A5FA" }}
                    title="Change Stroke Color"
                  />

                  {showStylePalette && (
                    <div className="absolute top-full left-0 mt-2 p-2 bg-[#1A1C22] border border-[#2E313B] rounded-lg shadow-2xl flex items-center gap-1 z-50">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => {
                            setActiveColor(c.value);
                            updateSelectedNode({ color: c.value });
                            setShowStylePalette(false);
                          }}
                          className="w-5 h-5 rounded-full hover:scale-110 transition-transform border border-white/20"
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

          <div className="h-4 w-px bg-[#30333D]" />

          {/* Universal Duplicate Button */}
          <button
            onClick={() => {
              if (selectedNode.groupId) {
                handleDuplicateGroup(selectedNode.groupId);
              } else {
                handleDuplicateGroup();
              }
            }}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#282A33] rounded transition-colors cursor-pointer"
            title={selectedNode.groupId ? "Duplicate linked group (Ctrl+D)" : "Duplicate node (Ctrl+D)"}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Universal Delete Button */}
          <button
            onClick={handleDeleteSelected}
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-[#282A33] rounded transition-colors cursor-pointer"
            title="Delete element (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2b. MULTI-SELECTION FLOATING TOOLBAR WITH LINK AS GROUP ENTITY & UNLINK ACTIONS */}
      {selectedNodeIds.length > 1 && (() => {
        const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
        const minX = selectedNodes.length > 0 ? Math.min(...selectedNodes.map((n) => n.x)) : 0;
        const minY = selectedNodes.length > 0 ? Math.min(...selectedNodes.map((n) => n.y)) : 0;
        const maxX = selectedNodes.length > 0 ? Math.max(...selectedNodes.map((n) => n.x + n.width)) : 0;

        // Position centered above group in screen coordinates, safely clamped to screen viewport
        const groupCenterX = minX + (maxX - minX) / 2;
        const winW = typeof window !== "undefined" ? window.innerWidth : 1400;
        const screenLeft = Math.max(20, Math.min(winW - 740, groupCenterX * zoom + pan.x - 240));
        const screenTop = Math.max(65, minY * zoom + pan.y - 54);

        const selectedGroupIds = Array.from(
          new Set(selectedNodes.map((n) => n.groupId).filter(Boolean) as string[])
        );
        const isEntireSelectionOneGroup =
          selectedNodes.length > 1 &&
          selectedGroupIds.length === 1 &&
          selectedNodes.every((n) => n.groupId === selectedGroupIds[0]);
        const hasAnyGroupInSelection = selectedGroupIds.length > 0;
        const unlinkedCount = selectedNodes.filter((n) => !n.groupId).length;

        const linkedEdges = edges.filter(
          (e) => selectedNodeIds.includes(e.from) && selectedNodeIds.includes(e.to)
        );
        const hasArrows = linkedEdges.length > 0;

        return (
          <div
            className="absolute z-40 bg-[#1A1C22]/95 backdrop-blur-md border border-cyan-500/50 rounded-xl shadow-2xl px-3 py-1.5 flex items-center gap-2.5 text-xs text-gray-200 animate-in fade-in-50"
            style={{
              left: screenLeft,
              top: screenTop,
            }}
          >
            {/* Group Header Badge */}
            <div className="flex items-center gap-1.5 font-bold text-cyan-400 shrink-0">
              <Layers className="w-4 h-4" />
              <span>{selectedNodeIds.length} Selected</span>
            </div>

            {/* Link Status Pill */}
            {isEntireSelectionOneGroup ? (
              <span
                className="px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-300 text-[10px] font-mono border border-blue-500/40 flex items-center gap-1 shrink-0"
                title="Objects are linked into a single group entity that moves together"
              >
                <Link2 className="w-3 h-3 text-blue-400" />
                Linked Group ({selectedNodes.length})
              </span>
            ) : hasAnyGroupInSelection ? (
              <span
                className="px-2 py-0.5 rounded-full bg-purple-500/25 text-purple-300 text-[10px] font-mono border border-purple-500/40 flex items-center gap-1 shrink-0"
                title="Compound group containing linked entities and temporary items"
              >
                <Layers className="w-3 h-3 text-purple-400" />
                Compound ({selectedGroupIds.length} linked + {unlinkedCount} items)
              </span>
            ) : (
              <span
                className="px-2 py-0.5 rounded-full bg-white/10 text-gray-300 text-[10px] font-mono border border-white/15 flex items-center gap-1 shrink-0"
                title="Temporary group: moves together while selected"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Temporary Group ({selectedNodes.length})
              </span>
            )}

            <div className="h-4 w-px bg-[#30333D] shrink-0" />

            {/* Batch Color Swatch */}
            <div className="relative shrink-0">
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStylePalette(!showStylePalette);
                }}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Change color of all selected boxes"
              >
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>Color</span>
              </button>

              {showStylePalette && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-2 p-2 bg-[#1A1C22] border border-[#2E313B] rounded-lg shadow-2xl flex items-center gap-1 z-50"
                >
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveColor(c.value);
                        updateSelectedNode({ color: c.value });
                        setShowStylePalette(false);
                      }}
                      className="w-5 h-5 rounded-full hover:scale-110 transition-transform border border-white/20 cursor-pointer"
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-[#30333D] shrink-0" />

            {/* MAIN LINK AS GROUP ENTITY & UNLINK ACTIONS */}
            {isEntireSelectionOneGroup ? (
              <button
                type="button"
                onClick={handleUngroupSelectedNodes}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Unlink group so objects move independently (Ctrl+Shift+G or Ctrl+Shift+L)"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Unlink Group</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleGroupSelectedNodes}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
                  title="Link selected objects as a unified group entity that moves together (Ctrl+G or Ctrl+L)"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Link as Group</span>
                </button>
                {hasAnyGroupInSelection && (
                  <button
                    type="button"
                    onClick={handleUngroupSelectedNodes}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    title="Unlink existing groups in selection"
                  >
                    <Unlink className="w-3 h-3" />
                    <span>Unlink</span>
                  </button>
                )}
              </div>
            )}

            <div className="h-4 w-px bg-[#30333D] shrink-0" />

            {/* COPY GROUP (Clones selection into linked form so dragging is safe) */}
            <button
              type="button"
              onClick={() => handleDuplicateGroup()}
              className="px-2.5 py-1 bg-cyan-600/25 hover:bg-cyan-600/40 text-cyan-200 hover:text-white border border-cyan-500/40 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
              title="Copy Group (Ctrl+C / Ctrl+D): Copies selection and places on canvas in linked form so no boxes are dislocated when dragging"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Copy Group</span>
            </button>

            {/* OPTIONAL CONNECTOR ARROW LINES DROPDOWN */}
            <div className="relative flex items-center shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLinkMenu(!showLinkMenu);
                }}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Connect selected objects with arrow lines"
              >
                <MoveRight className="w-3 h-3 text-cyan-400" />
                <span>Arrows</span>
                {hasArrows && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {showLinkMenu && (
                <div
                  className="absolute top-full left-0 mt-1.5 bg-[#16171D] border border-blue-500/40 rounded-lg shadow-2xl p-1.5 w-52 z-50 flex flex-col gap-1 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleLinkSelectedNodes("sequence");
                      setShowLinkMenu(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-blue-600/20 text-gray-200 hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <MoveRight className="w-3.5 h-3.5 text-blue-400" />
                    <div>
                      <div className="font-semibold text-[11px]">Sequential Arrows</div>
                      <div className="text-[9px] text-gray-400">Node 1 → Node 2 → Node 3</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleLinkSelectedNodes("bidirectional");
                      setShowLinkMenu(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-blue-600/20 text-gray-200 hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                    <div>
                      <div className="font-semibold text-[11px]">Bidirectional Arrows</div>
                      <div className="text-[9px] text-gray-400">Node A ↔ Node B (Both Ways)</div>
                    </div>
                  </button>

                  {selectedNodeIds.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        handleLinkSelectedNodes("star");
                        setShowLinkMenu(false);
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-blue-600/20 text-gray-200 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                      <div>
                        <div className="font-semibold text-[11px]">Star Arrows</div>
                        <div className="text-[9px] text-gray-400">Node 1 → All others</div>
                      </div>
                    </button>
                  )}

                  {hasArrows && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUnlinkSelectedNodes();
                        setShowLinkMenu(false);
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors text-left cursor-pointer border-t border-white/10 mt-1"
                    >
                      <Unlink className="w-3.5 h-3.5 text-red-400" />
                      <div>
                        <div className="font-semibold text-[11px]">Remove Arrow Lines</div>
                        <div className="text-[9px] text-gray-400">Delete arrows between nodes</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-[#30333D] shrink-0" />

            {/* Group Movement Hint */}
            <span className="text-[11px] text-gray-400 hidden lg:inline shrink-0">
              Drag any item to move entity together
            </span>

            <div className="h-4 w-px bg-[#30333D] shrink-0" />

            {/* Delete Group */}
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="px-2 py-1 bg-red-950/60 hover:bg-red-900 text-red-300 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="Delete all nodes in group (Del)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            {/* Dissolve Group */}
            <button
              type="button"
              onClick={() => {
                setSelectedNodeIds([]);
                setSelectedNodeId(null);
                setShowLinkMenu(false);
              }}
              className="px-2 py-1 hover:bg-[#282A33] text-gray-400 hover:text-white rounded text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
              title="Dissolve selection (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })()}

      {/* 2c. ARROW LINK SETTINGS & BRANCHING POPOVER */}
      {edgeSettingsPopover && (() => {
        const edge = edges.find((e) => e.id === edgeSettingsPopover.edgeId);
        if (!edge) return null;

        return (
          <div
            className="fixed z-50 bg-[#16171D] border border-blue-500/60 rounded-xl shadow-2xl p-3 w-64 text-xs text-gray-200 animate-in zoom-in-95 duration-100"
            style={{
              left: Math.max(20, Math.min(window.innerWidth - 280, edgeSettingsPopover.x * zoom + pan.x - 120)),
              top: Math.max(60, Math.min(window.innerHeight - 220, edgeSettingsPopover.y * zoom + pan.y - 80)),
            }}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
              <div className="flex items-center gap-1.5 font-bold text-blue-400">
                <GitFork className="w-3.5 h-3.5" />
                <span>Arrow Link Settings</span>
              </div>
              <button
                onClick={() => setEdgeSettingsPopover(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* + Add Branch */}
              <button
                onClick={() => handleAddBranchFromEdge(edge.id)}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Connected Branch</span>
              </button>

              {/* Style: Solid vs Dashed */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-gray-400 text-[11px]">Line Style:</span>
                <div className="flex items-center gap-1 bg-[#121316] p-0.5 rounded border border-[#282B33]">
                  <button
                    onClick={() => {
                      const updated = edges.map((e) => (e.id === edge.id ? { ...e, style: "solid" as const } : e));
                      setEdges(updated);
                      pushHistory(nodes, updated);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${edge.style !== "dashed" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                      }`}
                  >
                    Solid
                  </button>
                  <button
                    onClick={() => {
                      const updated = edges.map((e) => (e.id === edge.id ? { ...e, style: "dashed" as const } : e));
                      setEdges(updated);
                      pushHistory(nodes, updated);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${edge.style === "dashed" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                      }`}
                  >
                    Dashed
                  </button>
                </div>
              </div>

              {/* Color Swatch */}
              <div className="pt-1">
                <span className="text-gray-400 text-[11px] block mb-1">Arrow Color:</span>
                <div className="flex items-center gap-1.5">
                  {["#60A5FA", "#38BDF8", "#A855F7", "#34D399", "#FBBF24", "#F87171"].map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        const updated = edges.map((e) => (e.id === edge.id ? { ...e, color: c } : e));
                        setEdges(updated);
                        pushHistory(nodes, updated);
                      }}
                      className={`w-5 h-5 rounded-full transition-transform hover:scale-110 border cursor-pointer ${edge.color === c ? "ring-2 ring-white scale-110" : "border-white/20"
                        }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Arrow Direction: <- , -> , <-> */}
              <div className="pt-1">
                <span className="text-gray-400 text-[11px] block mb-1">Arrow Direction:</span>
                <div className="grid grid-cols-3 gap-1 bg-[#121316] p-1 rounded-lg border border-[#282B33]">
                  <button
                    onClick={() => {
                      const updated = edges.map((e) =>
                        e.id === edge.id ? { ...e, arrowDirection: "backward" as const } : e
                      );
                      setEdges(updated);
                      pushHistory(nodes, updated);
                      triggerAutoSave(nodes, updated);
                    }}
                    className={`py-1.5 px-2 rounded flex items-center justify-center gap-1 font-mono text-xs font-bold transition-all cursor-pointer ${edge.arrowDirection === "backward"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-400 hover:text-white hover:bg-[#20222A]"
                      }`}
                    title="Backward arrow: Target points to Source (<-)"
                  >
                    <MoveLeft className="w-3.5 h-3.5" />
                    <span>&lt;-</span>
                  </button>
                  <button
                    onClick={() => {
                      const updated = edges.map((e) =>
                        e.id === edge.id ? { ...e, arrowDirection: "forward" as const } : e
                      );
                      setEdges(updated);
                      pushHistory(nodes, updated);
                      triggerAutoSave(nodes, updated);
                    }}
                    className={`py-1.5 px-2 rounded flex items-center justify-center gap-1 font-mono text-xs font-bold transition-all cursor-pointer ${edge.arrowDirection === "forward" || !edge.arrowDirection
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-400 hover:text-white hover:bg-[#20222A]"
                      }`}
                    title="Forward arrow: Source points to Target (->)"
                  >
                    <span>-&gt;</span>
                    <MoveRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const updated = edges.map((e) =>
                        e.id === edge.id ? { ...e, arrowDirection: "bidirectional" as const } : e
                      );
                      setEdges(updated);
                      pushHistory(nodes, updated);
                      triggerAutoSave(nodes, updated);
                    }}
                    className={`py-1.5 px-2 rounded flex items-center justify-center gap-1 font-mono text-xs font-bold transition-all cursor-pointer ${edge.arrowDirection === "bidirectional"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-400 hover:text-white hover:bg-[#20222A]"
                      }`}
                    title="Bidirectional arrow: Double-ended (<->)"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>&lt;-&gt;</span>
                  </button>
                </div>
              </div>

              {/* Delete Link */}
              <div className="pt-2 border-t border-gray-800 flex justify-end">
                <button
                  onClick={() => {
                    const updated = edges.filter((e) => e.id !== edge.id);
                    setEdges(updated);
                    pushHistory(nodes, updated);
                    setEdgeSettingsPopover(null);
                    setSelectedEdgeId(null);
                  }}
                  className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Arrow Link</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. DOUBLE-CLICK QUICK CREATION RADIAL / POPOVER MENU (Prompt Requirement: "functions double left click opens") */}
      {doubleClickMenu && (
        <div
          className="fixed z-50 bg-[#16171D] border border-[#2E313C] rounded-xl shadow-2xl p-2.5 w-64 animate-in zoom-in-95 duration-100"
          style={{
            left: Math.min(window.innerWidth - 270, doubleClickMenu.x),
            top: Math.min(window.innerHeight - 380, doubleClickMenu.y),
          }}
        >
          <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#242630] mb-2 flex items-center justify-between">
            <span>Functional Areas</span>
            <button
              onClick={() => setDoubleClickMenu(null)}
              className="hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Link as Group / Unlink if multiple objects are currently selected */}
          {selectedNodeIds.length >= 2 && (() => {
            const selectedGroupIds = Array.from(
              new Set(nodes.filter((n) => selectedNodeIds.includes(n.id)).map((n) => n.groupId).filter(Boolean))
            );
            const isGrouped = selectedGroupIds.length > 0;
            return (
              <div className="p-1.5 mb-2 bg-blue-950/40 border border-blue-500/30 rounded-lg flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => {
                    handleGroupSelectedNodes();
                    setDoubleClickMenu(null);
                  }}
                  className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Link selected objects as a unified group entity that moves together"
                >
                  <Link2 className="w-3 h-3" />
                  <span>Link as Group ({selectedNodeIds.length})</span>
                </button>
                {isGrouped && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUngroupSelectedNodes();
                      setDoubleClickMenu(null);
                    }}
                    className="py-1 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors border border-amber-500/30"
                    title="Unlink group entity"
                  >
                    <Unlink className="w-3 h-3" />
                    <span>Unlink</span>
                  </button>
                )}
              </div>
            );
          })()}

          {/* 4 Functional Areas requested by user */}
          <div className="space-y-1 mb-2">
            <button
              draggable={true}
              onDragStart={(e) =>
                handleItemDragStart(e, {
                  category: "functional-area",
                  areaType: "meeting-notes",
                })
              }
              onClick={() => handleInsertFunctionalArea("meeting-notes")}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#22242D] hover:text-white transition-colors cursor-grab active:cursor-grabbing"
            >
              <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="text-left">
                <div>Meeting Notes Area</div>
                <div className="text-[10px] text-gray-400 font-normal">Agenda, decisions & actions</div>
              </div>
            </button>

            <button
              draggable={true}
              onDragStart={(e) =>
                handleItemDragStart(e, {
                  category: "functional-area",
                  areaType: "notes",
                })
              }
              onClick={() => handleInsertFunctionalArea("notes")}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#22242D] hover:text-white transition-colors cursor-grab active:cursor-grabbing"
            >
              <StickyNote className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-left">
                <div>Notes & Brainstorm Area</div>
                <div className="text-[10px] text-gray-400 font-normal">4-quadrant color stickies</div>
              </div>
            </button>

            <button
              draggable={true}
              onDragStart={(e) =>
                handleItemDragStart(e, {
                  category: "functional-area",
                  areaType: "diagram",
                })
              }
              onClick={() => handleInsertFunctionalArea("diagram")}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#22242D] hover:text-white transition-colors cursor-grab active:cursor-grabbing"
            >
              <GitFork className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-left">
                <div>System Diagram Area</div>
                <div className="text-[10px] text-gray-400 font-normal">Connected service architecture</div>
              </div>
            </button>

            <button
              draggable={true}
              onDragStart={(e) =>
                handleItemDragStart(e, {
                  category: "functional-area",
                  areaType: "project-planner",
                })
              }
              onClick={() => handleInsertFunctionalArea("project-planner")}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#22242D] hover:text-white transition-colors cursor-grab active:cursor-grabbing"
            >
              <Kanban className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="text-left">
                <div>Project Planner Area</div>
                <div className="text-[10px] text-gray-400 font-normal">Phases, sprints & milestones</div>
              </div>
            </button>
          </div>

          <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-t border-[#242630] pt-1.5 mb-1">
            Single Elements
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button
              draggable={true}
              onDragStart={(e) =>
                handleItemDragStart(e, {
                  category: "node",
                  type: "sticky",
                  isChecklist: false,
                  color: "#EC4899",
                })
              }
              onClick={() => handleAddNode("sticky", "rectangle", "#EC4899")}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-gray-200 hover:bg-[#22242D] hover:text-white cursor-grab active:cursor-grabbing"
            >
              <StickyNote className="w-3.5 h-3.5 text-pink-400" />
              <span>Sticky</span>
            </button>
            <button
              draggable={true}
              onDragStart={(e) =>
                handleItemDragStart(e, {
                  category: "node",
                  type: "sticky",
                  isChecklist: true,
                  color: "#38BDF8",
                })
              }
              onClick={() => handleAddNode("sticky", "rectangle", "#38BDF8", true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-cyan-300 hover:bg-[#22242D] hover:text-white cursor-grab active:cursor-grabbing"
              title="Sticky Note with Interactive Todo Checkboxes"
            >
              <ListTodo className="w-3.5 h-3.5 text-cyan-400" />
              <span>Todo Note</span>
            </button>
            <button
              draggable={true}
              onDragStart={(e) =>
                handleItemDragStart(e, {
                  category: "node",
                  type: "sticky",
                  noteFormat: "json",
                  color: "#F59E0B",
                })
              }
              onClick={() => handleAddNode("sticky", "rectangle", "#F59E0B", false, undefined, "json")}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-amber-300 hover:bg-[#22242D] hover:text-white cursor-grab active:cursor-grabbing"
              title="JSON Structured Sticky Note with Syntax Highlighting"
            >
              <Braces className="w-3.5 h-3.5 text-amber-400" />
              <span>JSON Note</span>
            </button>
            <button
              draggable={true}
              onDragStart={(e) =>
                handleItemDragStart(e, {
                  category: "node",
                  type: "sticky",
                  noteFormat: "markdown",
                  color: "#6366F1",
                })
              }
              onClick={() => handleAddNode("sticky", "rectangle", "#6366F1", false, undefined, "markdown")}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-indigo-300 hover:bg-[#22242D] hover:text-white cursor-grab active:cursor-grabbing"
              title="Markdown Rendered Sticky Note (.md)"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>MD Note</span>
            </button>
            <button
              draggable={true}
              onDragStart={(e) =>
                handleItemDragStart(e, {
                  category: "node",
                  type: "task",
                  color: "#0078D4",
                })
              }
              onClick={() => handleAddNode("task", "rectangle", "#0078D4")}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-gray-200 hover:bg-[#22242D] hover:text-white cursor-grab active:cursor-grabbing"
            >
              <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Org Card</span>
            </button>
            <button
              draggable={true}
              onDragStart={(e) =>
                handleItemDragStart(e, {
                  category: "node",
                  type: "shape",
                  shapeType: "rectangle",
                  color: "#06B6D4",
                })
              }
              onClick={() => handleAddNode("shape", "rectangle", "#06B6D4")}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-gray-200 hover:bg-[#22242D] hover:text-white cursor-grab active:cursor-grabbing"
            >
              <Square className="w-3.5 h-3.5 text-cyan-400" />
              <span>Shape</span>
            </button>
            <button
              draggable={true}
              onDragStart={(e) =>
                handleItemDragStart(e, { category: "node", type: "text" })
              }
              onClick={() => handleAddNode("text")}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-gray-200 hover:bg-[#22242D] hover:text-white cursor-grab active:cursor-grabbing"
            >
              <Type className="w-3.5 h-3.5 text-gray-400" />
              <span>Text</span>
            </button>
            <button
              draggable={true}
              onDragStart={(e) =>
                handleItemDragStart(e, {
                  category: "node",
                  type: "line",
                  shapeType: "line",
                })
              }
              onClick={() => handleAddNode("line", "line")}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-gray-200 hover:bg-[#22242D] hover:text-white cursor-grab active:cursor-grabbing"
              title="Straight Line (Click or Hold & Drag)"
            >
              <Minus className="w-3.5 h-3.5 text-blue-400" />
              <span>Line</span>
            </button>
            <button
              draggable={true}
              onDragStart={(e) =>
                handleItemDragStart(e, {
                  category: "node",
                  type: "line",
                  shapeType: "arrow",
                })
              }
              onClick={() => handleAddNode("line", "arrow")}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-gray-200 hover:bg-[#22242D] hover:text-white cursor-grab active:cursor-grabbing"
              title="Independent Arrow (Click or Hold & Drag)"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
              <span>Arrow</span>
            </button>
            <button
              onClick={() => {
                directFileInputRef.current?.click();
                setDoubleClickMenu(null);
              }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-cyan-300 hover:bg-[#22242D] hover:text-white cursor-pointer"
              title="Direct add .md / .json / .txt file in rendered format"
            >
              <FileUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add .md File</span>
            </button>
            <button
              onClick={() => {
                const coords = doubleClickMenu
                  ? { x: doubleClickMenu.canvasX, y: doubleClickMenu.canvasY }
                  : undefined;
                handleCreateTableGrid(3, 3, 0, coords);
                setDoubleClickMenu(null);
              }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-emerald-300 hover:bg-[#22242D] hover:text-white cursor-pointer"
              title="Create 3x3 Table Grid of boxes"
            >
              <Table className="w-3.5 h-3.5 text-emerald-400" />
              <span>Table Grid</span>
            </button>
            <button
              onClick={() => {
                fileInputRef.current?.click();
                setDoubleClickMenu(null);
              }}
              className="col-span-2 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-emerald-300 hover:bg-[#22242D] hover:text-white border border-emerald-500/30 transition-colors"
              title="Upload .graphml, .pdf, .json, .md, images or diagrams directly to canvas (S3 hosted)"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload File / Diagram (.pdf, .graphml, .json, .md)</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. INFINITE CANVAS WITH SUBTLE DOT GRID (Matching Screenshots 2-5) */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleCanvasDoubleClick}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={handleCanvasDrop}
        className={`w-full h-full relative overflow-hidden ${activeTool === "hand" || isPanning
          ? "cursor-grab active:cursor-grabbing"
          : activeTool === "draw" || activeTool === "arrow" || activeTool === "line" || activeTool === "arrow-line"
            ? "cursor-crosshair"
            : "cursor-default"
          }`}
        style={{
          backgroundColor: canvasBgColor,
        }}
      >
        {/* SVG Infinite Dot Grid Pattern */}
        <svg
          id="canvas-grid"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            <pattern
              id="dot-grid"
              x={pan.x % (30 * zoom)}
              y={pan.y % (30 * zoom)}
              width={30 * zoom}
              height={30 * zoom}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={2}
                cy={2}
                r={1.2 * Math.min(1.5, Math.max(0.6, zoom))}
                fill={isLightBackground(canvasBgColor) ? "rgba(0, 0, 0, 0.22)" : "#242630"}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>

        {/* Scaled & Translated World Container */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: "10000px",
            height: "10000px",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {/* SVG Connector Arrows & Lines Layer (Never clipped at negative or out-of-bounds coordinates) */}
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              overflow: "visible",
            }}
            className="pointer-events-none z-10"
          >
            {renderEdges()}
          </svg>

          {/* Dynamic in-flight arrow preview while connecting two nodes (Rendered in top overlay) */}
          {activeTool === "arrow" && connectingFromNodeId && connectingMousePos && (() => {
            const fromNode = nodes.find((n) => n.id === connectingFromNodeId);
            if (!fromNode) return null;
            const fromCenterX = fromNode.x + fromNode.width / 2;
            const fromCenterY = fromNode.y + fromNode.height / 2;
            const targetX = connectingMousePos.x;
            const targetY = connectingMousePos.y;

            const mdx = targetX - fromCenterX;
            const mdy = targetY - fromCenterY;
            let startX = fromCenterX;
            let startY = fromCenterY;

            if (Math.abs(mdx) >= Math.abs(mdy)) {
              if (mdx > 0) {
                startX = fromNode.x + fromNode.width;
                startY = fromCenterY;
              } else {
                startX = fromNode.x;
                startY = fromCenterY;
              }
            } else {
              if (mdy > 0) {
                startX = fromCenterX;
                startY = fromNode.y + fromNode.height;
              } else {
                startX = fromCenterX;
                startY = fromNode.y;
              }
            }

            return (
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  overflow: "visible",
                }}
                className="pointer-events-none z-40"
              >
                <line
                  x1={startX}
                  y1={startY}
                  x2={targetX}
                  y2={targetY}
                  stroke="#38BDF8"
                  strokeWidth="3"
                  strokeDasharray="6,4"
                />
                {(arrowConnectType === "forward" || arrowConnectType === "bidirectional") &&
                  renderArrowhead(targetX, targetY, startX, startY, "#38BDF8")}
                {(arrowConnectType === "backward" || arrowConnectType === "bidirectional") &&
                  renderArrowhead(startX, startY, targetX, targetY, "#38BDF8")}
              </svg>
            );
          })()}

          {/* Live active stroke while pen drawing (Rendered in top overlay for instant real-time drag visibility) */}
          {isDrawingPen && currentPenPoints.length > 0 && (
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                overflow: "visible",
              }}
              className="pointer-events-none z-40"
            >
              <path
                d={generateSvgPath(currentPenPoints)}
                fill="none"
                stroke={penColor}
                strokeWidth={penStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none shadow-sm"
              />
            </svg>
          )}

          {/* Live active preview while drawing straight line or independent arrow */}
          {interactiveLineDrawing && (() => {
            const isArrow = interactiveLineDrawing.tool === "arrow-line";
            const x1 = interactiveLineDrawing.startX;
            const y1 = interactiveLineDrawing.startY;
            const x2 = interactiveLineDrawing.currentX;
            const y2 = interactiveLineDrawing.currentY;
            const strokeColor = activeColor || "#60A5FA";
            const strokeW = 3;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.hypot(dx, dy);
            const ux = dist > 0.001 ? dx / dist : 1;
            const uy = dist > 0.001 ? dy / dist : 0;
            const wingLength = Math.max(12, Math.round(strokeW * 2.8 + 6));
            const arrowDepth = wingLength * Math.cos(Math.PI / 6);
            const endOffset = isArrow ? Math.min(arrowDepth * 0.45, dist * 0.45) : 0;

            const strokeX2 = x2 - endOffset * ux;
            const strokeY2 = y2 - endOffset * uy;

            return (
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  overflow: "visible",
                }}
                className="pointer-events-none z-40"
              >
                <line
                  x1={x1}
                  y1={y1}
                  x2={strokeX2}
                  y2={strokeY2}
                  stroke={strokeColor}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                />
                {isArrow && renderArrowhead(x2, y2, x1, y1, strokeColor, strokeW)}
                <circle cx={x1} cy={y1} r={4} fill={strokeColor} />
                <circle cx={x2} cy={y2} r={4} fill={strokeColor} />
              </svg>
            );
          })()}

          {/* Rectangular Drag-to-Select Marquee Box */}
          {isSelectingBox && selectionBox && (
            <div
              style={{
                position: "absolute",
                left: `${Math.min(selectionBox.startX, selectionBox.currentX)}px`,
                top: `${Math.min(selectionBox.startY, selectionBox.currentY)}px`,
                width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}px`,
                height: `${Math.abs(selectionBox.currentY - selectionBox.startY)}px`,
              }}
              className="border-2 border-blue-400 bg-blue-500/15 rounded-xs pointer-events-none z-30 shadow-sm"
            />
          )}

          {/* Group Bounding Box Frame (Linked, Compound, or Temporary Group) */}
          {selectedNodeIds.length > 1 && (() => {
            const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
            if (selectedNodes.length === 0) return null;

            const minX = Math.min(...selectedNodes.map((n) => n.x)) - 12;
            const minY = Math.min(...selectedNodes.map((n) => n.y)) - 12;
            const maxX = Math.max(...selectedNodes.map((n) => n.x + n.width)) + 12;
            const maxY = Math.max(...selectedNodes.map((n) => n.y + n.height)) + 12;

            const selectedGroupIds = Array.from(
              new Set(selectedNodes.map((n) => n.groupId).filter(Boolean) as string[])
            );
            const isEntireSelectionOneGroup =
              selectedNodes.length > 1 &&
              selectedGroupIds.length === 1 &&
              selectedNodes.every((n) => n.groupId === selectedGroupIds[0]);
            const hasAnyGroupInSelection = selectedGroupIds.length > 0;
            const unlinkedCount = selectedNodes.filter((n) => !n.groupId).length;

            return (
              <div
                style={{
                  position: "absolute",
                  left: `${minX}px`,
                  top: `${minY}px`,
                  width: `${maxX - minX}px`,
                  height: `${maxY - minY}px`,
                }}
                className={`border-2 border-dashed rounded-xl pointer-events-none z-20 transition-all ${isEntireSelectionOneGroup
                  ? "border-blue-400 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                  : hasAnyGroupInSelection
                    ? "border-purple-400 bg-purple-500/5 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                    : "border-cyan-400 bg-cyan-400/5 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  }`}
              >
                <div
                  className={`absolute -top-7 left-2 px-2.5 py-0.5 rounded-full text-black text-[10px] font-bold flex items-center gap-1.5 shadow-md ${isEntireSelectionOneGroup
                    ? "bg-blue-400 text-white"
                    : hasAnyGroupInSelection
                      ? "bg-purple-400 text-white"
                      : "bg-cyan-500 text-black"
                    }`}
                >
                  {isEntireSelectionOneGroup ? (
                    <>
                      <Link2 className="w-3 h-3" />
                      <span>Linked Group ({selectedNodes.length} items) · Moves together as entity</span>
                    </>
                  ) : hasAnyGroupInSelection ? (
                    <>
                      <Layers className="w-3 h-3" />
                      <span>Compound Group ({selectedGroupIds.length} linked + {unlinkedCount} items) · Moves together</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-3 h-3" />
                      <span>Temporary Group ({selectedNodeIds.length} items) · Drag to move together</span>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Render All Canvas Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNodeIds.includes(node.id) || selectedNodeId === node.id;
            const isEditing = editingNodeId === node.id;
            const isConnectingSource = activeTool === "arrow" && connectingFromNodeId === node.id;
            const isConnectingTargetCandidate =
              activeTool === "arrow" && connectingFromNodeId && connectingFromNodeId !== node.id;

            // 0. FREEHAND PEN DRAWING NODE ("draw by pen")
            if (node.type === "drawing") {
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(node, e)}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                    pointerEvents: activeTool === "draw" ? "none" : "auto",
                  }}
                  className={`group/drawing cursor-pointer transition-all ${isConnectingSource
                    ? "ring-4 ring-cyan-400 ring-offset-2 ring-offset-[#0D0E11] shadow-[0_0_20px_rgba(6,182,212,0.8)]"
                    : isConnectingTargetCandidate
                      ? "hover:ring-2 hover:ring-cyan-300 hover:scale-[1.01]"
                      : isSelected
                        ? "ring-2 ring-pink-400 ring-offset-2 ring-offset-transparent rounded-sm"
                        : ""
                    }`}
                >
                  <svg
                    style={{
                      width: `${node.width}px`,
                      height: `${node.height}px`,
                      overflow: "visible",
                    }}
                    className="pointer-events-none"
                  >
                    <path
                      d={node.pathData || ""}
                      fill="none"
                      stroke={isSelected ? "#F472B6" : node.color || "#EC4899"}
                      strokeWidth={node.strokeWidth || 3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {isSelected && (
                    <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-pink-600 text-white text-[9px] font-bold pointer-events-none select-none shadow">
                      Drawing
                    </div>
                  )}
                  {isConnectingSource && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-cyan-400 text-black text-[10px] font-extrabold whitespace-nowrap shadow-lg animate-pulse">
                      Source Node
                    </div>
                  )}
                </div>
              );
            }

            // 1. GLOWING CIRCULAR LOGO (Screenshots 2-5)
            if (node.type === "logo") {
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(node, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                  }}
                  className={`flex flex-col items-center justify-center cursor-pointer transition-all relative ${isSelected ? "ring-2 ring-blue-500 rounded-full" : ""
                    }`}
                >
                  <div className="relative w-28 h-28 rounded-full border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.6)] flex items-center justify-center bg-[#0D0E11]/90">
                    {/* Inner glowing ring */}
                    <div className="absolute inset-1.5 rounded-full border border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                    <span className="text-[11px] font-bold text-center text-gray-200 tracking-wider">
                      COMPANY<br />LOGO
                    </span>
                  </div>
                  <div className="text-center mt-3">
                    <p className="text-xs font-bold tracking-wider text-gray-300">
                      COMPANY NAME
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Organizational Chart
                    </p>
                  </div>
                </div>
              );
            }

            // 2. LEGEND CONTAINER (Screenshot 2-5 top left)
            if (node.type === "legend") {
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(node, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                  }}
                  className={`p-3.5 rounded-md border-2 border-white/80 bg-[#0D0E11]/80 backdrop-blur-sm cursor-pointer shadow-xl relative ${isSelected ? "ring-2 ring-blue-500" : ""
                    }`}
                >
                  <div className="text-[11px] font-bold text-center tracking-widest text-white mb-3">
                    LEGEND
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center justify-center text-[7px] text-white shrink-0">
                        Logo
                      </div>
                      <span className="text-[10px] text-gray-300 leading-tight">
                        Insert Company Logo on the space (Optional)
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-14 h-6 rounded bg-[#0A2540] border border-blue-400 flex items-center justify-center text-[9px] text-blue-200 font-semibold shrink-0">
                        Position
                      </div>
                      <span className="text-[10px] text-gray-300 leading-tight">
                        Position or job function of the team member
                      </span>
                    </div>
                  </div>
                  {isSelected && renderResizeHandles(node)}
                </div>
              );
            }

            // 3. STICKY NOTE (Text structuring, JSON formatting, Markdown rendered, and Checklist todo)
            if (node.type === "sticky") {
              const format: NoteFormat =
                node.noteFormat ||
                (node.hasCheckbox || (node.checklist && node.checklist.length > 0)
                  ? "checklist"
                  : node.body?.trim().startsWith("{") && node.body?.trim().endsWith("}")
                    ? "json"
                    : "text");
              const isChecklist = format === "checklist";
              const isJson = format === "json";
              const isMarkdown = format === "markdown";
              const isText = format === "text";

              const stickyTextColor = getStickyTextColor(node.color, node.textColor);
              const items = isChecklist ? parseNodeChecklist(node) : [];
              const completedCount = items.filter((i) => i.completed).length;
              const totalCount = items.length;
              const progressPct =
                totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              const jsonInfo = isJson ? validateJson(node.body || "") : null;

              return (
                <div
                  key={node.id}
                  data-note-card="true"
                  onMouseDown={(e) => handleNodeMouseDown(node, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                    backgroundColor: `${node.color || "#EC4899"}26`,
                    borderColor: node.color || "#EC4899",
                  }}
                  className={`p-3 rounded-xl border-2 cursor-pointer shadow-lg flex flex-col justify-between transition-all relative overflow-visible group/sticky ${isSelected ? "ring-2 ring-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.3)]" : ""
                    }`}
                >
                  {/* HEADER FOR ALL FORMATS */}
                  <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-white/10 shrink-0 select-none">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {/* Format Badge Indicator */}
                      {isJson && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 font-mono text-[9px] font-bold border border-amber-500/30 flex items-center gap-1 shrink-0">
                          <Braces className="w-2.5 h-2.5" /> JSON
                        </span>
                      )}
                      {isMarkdown && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/25 text-indigo-300 font-mono text-[9px] font-bold border border-indigo-500/30 flex items-center gap-1 shrink-0">
                          <FileCode className="w-2.5 h-2.5" /> MD
                        </span>
                      )}
                      {isChecklist && (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/25 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/30 flex items-center gap-1 shrink-0">
                          <ListTodo className="w-2.5 h-2.5" /> TODO
                        </span>
                      )}
                      {isText && (
                        <span className="px-1.5 py-0.5 rounded bg-pink-500/25 text-pink-300 font-mono text-[9px] font-bold border border-pink-500/30 flex items-center gap-1 shrink-0">
                          <FileText className="w-2.5 h-2.5" /> TXT
                        </span>
                      )}

                      {/* Editable Note Title (Double-click or click pencil to edit) */}
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {editingTitleId === node.id ? (
                          <input
                            type="text"
                            defaultValue={node.title || (isJson ? "data.json" : isMarkdown ? "notes.md" : isChecklist ? "Action Items" : "notes.txt")}
                            autoFocus
                            onMouseDown={(e) => e.stopPropagation()}
                            onChange={(e) => handleLiveTextChange(node.id, { title: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
                            }}
                            onBlur={(e) => {
                              updateNode(node.id, { title: e.target.value });
                              setEditingTitleId(null);
                            }}
                            className="bg-black/50 border border-amber-400/80 rounded px-1.5 py-0.5 text-xs font-semibold text-white focus:outline-none w-full shadow-inner"
                            placeholder="Note Title"
                          />
                        ) : (
                          <div
                            className="flex items-center gap-1 min-w-0 group/title cursor-text flex-1"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingTitleId(node.id);
                            }}
                            onClick={(e) => {
                              if (isSelected) {
                                e.stopPropagation();
                                setEditingTitleId(node.id);
                              }
                            }}
                            title="Click or double-click to edit note title"
                          >
                            <span
                              className="text-xs font-bold truncate tracking-wide hover:underline"
                              style={{ color: stickyTextColor }}
                            >
                              {node.title || (isJson ? "data.json" : isMarkdown ? "notes.md" : isChecklist ? "Action Items" : "notes.txt")}
                            </span>
                            <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover/title:opacity-80 transition-opacity text-white/60 shrink-0" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Header Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isJson && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingNodeId(isEditing ? null : node.id);
                            }}
                            className="p-1 hover:bg-white/10 rounded text-amber-300 transition-colors cursor-pointer"
                            title={isEditing ? "View Highlighting" : "Edit JSON Raw"}
                          >
                            {isEditing ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrettifyJson(node.id);
                            }}
                            className="p-1 hover:bg-white/10 rounded text-amber-300 transition-colors cursor-pointer"
                            title="Format / Prettify JSON"
                          >
                            <Sparkles className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (node.body) navigator.clipboard.writeText(node.body);
                            }}
                            className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors cursor-pointer"
                            title="Copy JSON"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </>
                      )}

                      {isMarkdown && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingNodeId(isEditing ? null : node.id);
                            }}
                            className="p-1 hover:bg-white/10 rounded text-indigo-300 transition-colors cursor-pointer"
                            title={isEditing ? "Switch to Rendered Preview" : "Edit Raw Markdown"}
                          >
                            {isEditing ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (node.body) navigator.clipboard.writeText(node.body);
                            }}
                            className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors cursor-pointer"
                            title="Copy Markdown"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </>
                      )}

                      {isChecklist && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${completedCount === totalCount && totalCount > 0
                            ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                            : "bg-black/25 text-gray-300 border border-white/10"
                            }`}
                        >
                          {completedCount}/{totalCount}
                        </span>
                      )}

                      {isText && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingNodeId(isEditing ? null : node.id);
                            }}
                            className="p-1 hover:bg-white/10 rounded text-pink-300 transition-colors cursor-pointer"
                            title={isEditing ? "Finish Editing Text" : "Edit Note Text"}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (node.body) navigator.clipboard.writeText(node.body);
                            }}
                            className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors cursor-pointer"
                            title="Copy Text"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* BODY CONTENT BY FORMAT */}
                  {isChecklist && (
                    <div className="w-full flex-1 flex flex-col overflow-hidden mt-1.5" data-scrollable="true">
                      {/* Mini Progress Track */}
                      <div className="w-full h-1 bg-black/25 rounded-full overflow-hidden mb-1.5 shrink-0">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progressPct}%`,
                            backgroundColor:
                              completedCount === totalCount && totalCount > 0
                                ? "#10B981"
                                : node.color || "#EC4899",
                          }}
                        />
                      </div>

                      {/* Items List */}
                      <div data-scrollable="true" className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                        {items.map((item, idx) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-2 group/item relative py-0.5"
                          >
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleChecklistItem(node.id, item.id);
                              }}
                              className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center transition-all cursor-pointer border ${item.completed
                                ? "bg-emerald-500 border-emerald-400 text-white shadow-sm"
                                : "bg-black/20 hover:bg-black/40 border-white/40 hover:border-white/80 text-transparent"
                                }`}
                              title={item.completed ? "Mark incomplete" : "Mark completed"}
                            >
                              <Check
                                className={`w-3 h-3 stroke-[3] transition-transform ${item.completed ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
                              />
                            </button>

                            {isEditing ? (
                              <div className="flex-1 flex items-center gap-1">
                                <input
                                  type="text"
                                  defaultValue={item.text}
                                  onChange={(e) =>
                                    handleUpdateChecklistItemText(node.id, item.id, e.target.value)
                                  }
                                  onBlur={() => pushHistory(nodes, edges)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleInsertChecklistItemAfter(node.id, idx);
                                    } else if (
                                      e.key === "Backspace" &&
                                      item.text === "" &&
                                      items.length > 1
                                    ) {
                                      e.preventDefault();
                                      handleDeleteChecklistItem(node.id, item.id);
                                    }
                                  }}
                                  className="w-full bg-black/20 focus:bg-black/40 border border-transparent focus:border-white/30 rounded px-1.5 py-0.5 text-xs focus:outline-none"
                                  style={{ color: stickyTextColor }}
                                  placeholder="Type task..."
                                />
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteChecklistItem(node.id, item.id);
                                  }}
                                  className="p-0.5 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Delete task"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setEditingNodeId(node.id);
                                }}
                                className={`text-xs leading-relaxed flex-1 select-none transition-all break-words ${item.completed
                                  ? "line-through opacity-60 italic"
                                  : "opacity-95 font-medium"
                                  }`}
                                style={{
                                  textAlign: node.textAlign || "left",
                                  fontSize: `${parseFontSizePx(node.fontSize, 12)}px`,
                                  color: stickyTextColor,
                                }}
                              >
                                {item.text || "Empty item"}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Item Button */}
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddChecklistItem(node.id);
                        }}
                        className="mt-1 shrink-0 flex items-center gap-1.5 text-[11px] font-medium text-white/70 hover:text-white px-2 py-1 rounded bg-black/20 hover:bg-black/40 border border-white/10 hover:border-white/20 transition-all cursor-pointer w-fit"
                        title="Add task to checklist"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add task</span>
                      </button>
                    </div>
                  )}

                  {isJson && (
                    <div className="w-full flex-1 flex flex-col overflow-hidden mt-1.5" data-scrollable="true">
                      {isEditing ? (
                        <textarea
                          data-scrollable="true"
                          autoFocus
                          defaultValue={node.body}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) => handleLiveTextChange(node.id, { body: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") e.currentTarget.blur();
                          }}
                          onBlur={(e) => {
                            updateNode(node.id, { body: e.target.value });
                            setEditingNodeId(null);
                          }}
                          className="w-full flex-1 bg-black/40 text-amber-200 font-mono text-[11px] p-2 rounded-lg border border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none leading-relaxed overflow-y-auto scrollbar-thin shadow-inner"
                          placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
                        />
                      ) : (
                        <div
                          data-scrollable="true"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingNodeId(node.id);
                          }}
                          className="flex-1 overflow-auto p-1.5 bg-black/40 rounded-lg border border-amber-500/10 font-mono text-[11px] leading-relaxed scrollbar-thin cursor-text"
                          title="Double-click to edit JSON raw code"
                        >
                          {renderJsonSyntaxHighlighted(node.body || "{}")}
                        </div>
                      )}

                      {/* JSON Status Footer */}
                      <div className="mt-1 pt-1 border-t border-amber-500/15 flex items-center justify-between text-[9px] text-gray-400 font-mono shrink-0 select-none">
                        {jsonInfo?.isValid ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Valid JSON ({jsonInfo.keyCount} keys)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-400 font-semibold" title={jsonInfo?.error}>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                            Syntax Error
                          </span>
                        )}
                        <span className="text-gray-500">Double-click to edit</span>
                      </div>
                    </div>
                  )}

                  {isMarkdown && (
                    <div className="w-full flex-1 flex flex-col overflow-hidden mt-1.5" data-scrollable="true">
                      {isEditing ? (
                        <textarea
                          data-scrollable="true"
                          autoFocus
                          defaultValue={node.body}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) => handleLiveTextChange(node.id, { body: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") e.currentTarget.blur();
                          }}
                          onBlur={(e) => {
                            updateNode(node.id, { body: e.target.value });
                            setEditingNodeId(null);
                          }}
                          className="w-full flex-1 bg-black/40 text-indigo-100 font-mono text-xs p-2.5 rounded-lg border border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none leading-relaxed overflow-y-auto scrollbar-thin shadow-inner"
                          placeholder="# Write markdown...\n- [ ] Task item\n**Bold** text"
                        />
                      ) : (
                        <div
                          data-scrollable="true"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingNodeId(node.id);
                          }}
                          className="flex-1 overflow-y-auto p-2.5 bg-black/35 rounded-lg border border-indigo-500/10 select-text text-gray-200 text-xs leading-relaxed scrollbar-thin cursor-text"
                          title="Double-click to edit Markdown raw text"
                        >
                          {renderMarkdownToJsx(node.body || "", {
                            onToggleCheckbox: (lineIdx) => handleToggleMarkdownCheckboxOnNode(node.id, lineIdx),
                          })}
                        </div>
                      )}

                      <div className="mt-1 pt-1 border-t border-indigo-500/15 flex items-center justify-between text-[9px] text-gray-400 font-mono shrink-0 select-none">
                        <span className="text-indigo-300/80">Markdown Rendered</span>
                        <span className="text-gray-500">Double-click to edit raw</span>
                      </div>
                    </div>
                  )}

                  {isText && (
                    <div className="w-full flex-1 flex flex-col overflow-hidden mt-1.5" data-scrollable="true">
                      {isEditing ? (
                        <textarea
                          data-scrollable="true"
                          autoFocus
                          defaultValue={node.body}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) => handleLiveTextChange(node.id, { body: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") e.currentTarget.blur();
                          }}
                          onBlur={(e) => {
                            updateNode(node.id, { body: e.target.value });
                            setEditingNodeId(null);
                          }}
                          className="w-full flex-1 bg-black/40 focus:outline-none border border-pink-400/50 rounded-lg p-2 resize-none leading-relaxed text-xs text-gray-200 font-sans overflow-y-auto scrollbar-thin shadow-inner"
                          style={{
                            textAlign: node.textAlign || "left",
                            fontSize: `${parseFontSizePx(node.fontSize, 12)}px`,
                            color: stickyTextColor,
                          }}
                          placeholder="Type your notes here..."
                        />
                      ) : (
                        <div
                          data-scrollable="true"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingNodeId(node.id);
                          }}
                          className="flex-1 overflow-y-auto p-2 bg-black/20 rounded-lg border border-white/10 select-text whitespace-pre-wrap leading-relaxed font-sans scrollbar-thin cursor-text"
                          style={{
                            textAlign: node.textAlign || "left",
                            fontSize: `${parseFontSizePx(node.fontSize, 12)}px`,
                            color: stickyTextColor,
                          }}
                          title="Double-click to edit note text"
                        >
                          {node.body || (
                            <span className="opacity-40 italic">Double-click to add text...</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {isSelected && renderResizeHandles(node)}
                </div>
              );
            }

            // 4. TASK CARD / ORG CHART POSITION NODE (Gold Task Header + Blue Position Box)
            if (node.type === "task") {
              const defaultHeaderHeight =
                node.height > 160 ? Math.round(node.height * 0.4) : Math.min(56, Math.max(28, node.height - 28));
              const safeHeaderHeight = Math.max(
                24,
                Math.min(
                  node.height - 24,
                  node.headerHeight !== undefined && node.headerHeight !== null ? node.headerHeight : defaultHeaderHeight
                )
              );
              const bottomHeight = node.height - safeHeaderHeight;

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(node, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                  }}
                  className={`rounded-md cursor-pointer shadow-2xl transition-all relative group/node select-none ${isSelected ? "ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]" : ""
                    }`}
                >
                  <div
                    className="w-full h-full flex flex-col rounded-md overflow-hidden"
                    onBlur={(e) => {
                      // Only clear editing state if focus completely left this card
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setEditingNodeId(null);
                        setEditingField(null);
                      }
                    }}
                  >
                    {/* Top Task Banner (Dynamic accent / gold border) */}
                    <div
                      style={{
                        height: `${safeHeaderHeight}px`,
                        borderColor: node.color ? `${node.color}99` : "rgba(245, 158, 11, 0.8)",
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                        setSelectedNodeIds([node.id]);
                        setEditingNodeId(node.id);
                        setEditingField("title");
                      }}
                      className="p-2 bg-[#1A1813] border-2 rounded-t-md flex items-center justify-center text-center overflow-hidden relative group/header transition-colors"
                    >
                      {isEditing && (editingField === "title" || !editingField) ? (
                        <textarea
                          defaultValue={node.title}
                          autoFocus={editingField === "title" || !editingField}
                          rows={safeHeaderHeight > 70 ? 3 : 2}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) => handleLiveTextChange(node.id, { title: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              updateNode(node.id, { title: e.currentTarget.value });
                              setEditingField("subtitle");
                            }
                          }}
                          onBlur={(e) => {
                            updateNode(node.id, { title: e.target.value });
                          }}
                          className="bg-transparent text-center w-full h-full resize-none focus:outline-none font-medium leading-tight scrollbar-none"
                          style={{
                            fontSize: `${parseFontSizePx(node.fontSize, 10)}px`,
                            color: node.textColor || "#FDE68A",
                          }}
                          placeholder="Task title..."
                        />
                      ) : (
                        <span
                          className={`font-medium leading-tight ${safeHeaderHeight <= 60 ? "line-clamp-2" : "line-clamp-none max-h-full overflow-y-auto"
                            }`}
                          style={{
                            fontSize: `${parseFontSizePx(node.fontSize, 10)}px`,
                            color: node.textColor || "#FDE68A",
                          }}
                        >
                          {node.title || "Add a task here to represent this team member!"}
                        </span>
                      )}
                    </div>

                    {/* Draggable Divider Line (Horizontal split handle) */}
                    <div
                      onMouseDown={(e) => handleDividerMouseDown(node, safeHeaderHeight, e)}
                      className="relative w-full h-2.5 -my-1 z-30 cursor-row-resize group/divider flex items-center justify-center select-none"
                      title="Drag up or down to adjust header and bottom height"
                    >
                      <div
                        className={`w-full transition-all ${resizingDivider?.nodeId === node.id
                          ? "h-[3px] bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                          : "h-[2px] bg-amber-500/50 group-hover/divider:bg-cyan-400 group-hover/divider:h-[3px]"
                          }`}
                      />
                      <div
                        className={`absolute w-7 h-2 rounded-full bg-[#1A1C22] border transition-all flex items-center justify-center shadow-md ${resizingDivider?.nodeId === node.id || isSelected
                          ? "border-cyan-400 bg-cyan-950/90 opacity-100"
                          : "border-amber-500/60 opacity-0 group-hover/divider:opacity-100 group-hover/divider:border-cyan-400"
                          }`}
                      >
                        <div className="w-3.5 h-0.5 bg-amber-400 group-hover/divider:bg-cyan-300 rounded-full" />
                      </div>
                    </div>

                    {/* Bottom Position / Progress Box (Dynamic Color Box) */}
                    <div
                      style={{
                        height: `${bottomHeight}px`,
                        borderColor: node.color || "#3B82F6",
                        backgroundColor:
                          node.fillType === "solid"
                            ? (node.color || "#0A2540")
                            : node.fillType === "none"
                              ? "transparent"
                              : `${node.color || "#0078D4"}40`,
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                        setSelectedNodeIds([node.id]);
                        setEditingNodeId(node.id);
                        setEditingField("subtitle");
                      }}
                      className="p-2 border-2 border-t-0 rounded-b-md flex flex-col items-center justify-center text-center overflow-hidden relative group/bottom transition-colors"
                    >
                      {isEditing && (editingField === "subtitle" || !editingField) ? (
                        <input
                          type="text"
                          defaultValue={node.subtitle}
                          autoFocus={editingField === "subtitle"}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) => handleLiveTextChange(node.id, { subtitle: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                              setEditingNodeId(null);
                              setEditingField(null);
                            }
                          }}
                          onBlur={(e) => {
                            updateNode(node.id, { subtitle: e.target.value });
                          }}
                          placeholder="e.g. Completed (100%) or President"
                          className="bg-transparent text-xs text-blue-200 text-center w-full focus:outline-none font-bold placeholder:text-blue-400/50"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 w-full">
                          <span className="text-xs font-bold text-blue-200 leading-snug">
                            {node.subtitle || "Position"}
                          </span>
                          {node.body && bottomHeight > 70 && (
                            <p className="text-[10px] text-blue-300/80 line-clamp-3 leading-tight mt-1 whitespace-pre-wrap">
                              {node.body}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Branch Connector Handle on Node Bottom */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddBranchFromNode(node.id);
                    }}
                    className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#121316] border border-blue-400 text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:scale-125 hover:bg-blue-600 transition-all z-20 ${isSelected ? "opacity-100" : "opacity-0 group-hover/node:opacity-100"
                      }`}
                    title="Add connected branch node below (+)"
                  >
                    +
                  </button>

                  {isSelected && renderResizeHandles(node)}
                </div>
              );
            }

            // 5. IMAGE / MEDIA / SVG / DIAGRAM NODE (Stored in AWS S3)
            if (node.type === "image") {
              const isUploading = Boolean(node.metaData?.isUploadingToS3);
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(node, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                  }}
                  className={`group/img cursor-pointer rounded-lg transition-all relative ${isSelected
                    ? "ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                    : "shadow-xl border border-[#2D3039]"
                    }`}
                >
                  {node.imageUrl ? (
                    <img
                      src={node.imageUrl}
                      alt={node.title || "Whiteboard Media"}
                      className="w-full h-full object-contain pointer-events-none select-none bg-black/30 rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#181A22] text-gray-400 p-4 rounded-lg">
                      <ImageIcon className="w-8 h-8 mb-2 text-gray-500" />
                      <span className="text-xs font-medium">Click to upload media</span>
                    </div>
                  )}

                  {/* S3 Storage Cloud Badge */}
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] text-emerald-400 border border-emerald-500/30 select-none">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
                        <span className="text-amber-300">Syncing S3...</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-2.5 h-2.5" />
                        <span>AWS S3</span>
                      </>
                    )}
                  </div>

                  {node.title && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-xs py-1 px-2 text-[10px] text-gray-200 truncate pointer-events-none text-center flex items-center justify-between rounded-b-lg">
                      <span className="truncate">{node.title}</span>
                      {node.fileUrl && (
                        <a
                          href={node.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="pointer-events-auto text-emerald-400 hover:text-emerald-300 p-0.5 ml-1"
                          title="Open S3 asset in new tab"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {isSelected && renderResizeHandles(node)}
                </div>
              );
            }

            // 5b. PDF DOCUMENT NODE (Stored in AWS S3)
            if (node.type === "pdf") {
              const isUploading = Boolean(node.metaData?.isUploadingToS3);
              const fileSizeMb = node.fileSize ? (node.fileSize / (1024 * 1024)).toFixed(1) + " MB" : "";
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(node, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                  }}
                  className={`group/pdf cursor-pointer rounded-xl transition-all relative flex flex-col bg-[#1A1517] border border-red-500/30 ${isSelected
                    ? "ring-2 ring-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    : "shadow-xl hover:border-red-500/50"
                    }`}
                >
                  {/* PDF Header */}
                  <div className="px-3 py-2 bg-gradient-to-r from-red-950/80 to-[#2A181C] border-b border-red-500/30 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[9px] uppercase tracking-wider">
                        PDF
                      </span>
                      <span className="text-xs font-semibold text-white truncate" title={node.title}>
                        {node.title || "Document.pdf"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-red-300 shrink-0">
                      {isUploading ? (
                        <span className="flex items-center gap-1 text-amber-300">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400 font-mono">
                          <Cloud className="w-2.5 h-2.5" /> S3
                        </span>
                      )}
                    </div>
                  </div>

                  {/* PDF Body / Preview */}
                  <div className="flex-1 p-3 flex flex-col items-center justify-center text-center overflow-hidden bg-black/20">
                    <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-2 shadow-inner">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-gray-200 font-medium truncate max-w-full px-2">
                      {node.fileName || node.title}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {fileSizeMb ? `${fileSizeMb} • ` : ""}Adobe PDF Document
                    </p>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-3 py-2 bg-[#141012] border-t border-red-500/20 flex items-center justify-between gap-2 shrink-0">
                    <a
                      href={node.fileUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => {
                        if (!node.fileUrl) e.preventDefault();
                        e.stopPropagation();
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-600/20 hover:bg-red-600/40 text-red-300 text-[11px] font-semibold transition-colors border border-red-500/30 ${!node.fileUrl ? "opacity-50 pointer-events-none" : ""
                        }`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open PDF</span>
                    </a>
                    {node.fileUrl && (
                      <a
                        href={node.fileUrl}
                        download={node.fileName || "document.pdf"}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Download from S3"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {isSelected && renderResizeHandles(node)}
                </div>
              );
            }

            // 5c. GRAPHML NETWORK / TOPOLOGY NODE (Stored in AWS S3 with One-Click Canvas Import)
            if (node.type === "graphml") {
              const isUploading = Boolean(node.metaData?.isUploadingToS3);
              const nodeCount = node.metaData?.nodeCount || 0;
              const edgeCount = node.metaData?.edgeCount || 0;
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(node, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                  }}
                  className={`group/graphml cursor-pointer rounded-xl overflow-hidden transition-all relative flex flex-col bg-[#161424] border border-purple-500/40 ${isSelected
                    ? "ring-2 ring-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                    : "shadow-xl hover:border-purple-500/60"
                    }`}
                >
                  {/* GraphML Header */}
                  <div className="px-3 py-2 bg-gradient-to-r from-purple-950/80 to-[#221838] border-b border-purple-500/30 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold text-[9px] uppercase tracking-wider">
                        GraphML
                      </span>
                      <span className="text-xs font-semibold text-white truncate" title={node.title}>
                        {node.title || "Network.graphml"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-purple-300 shrink-0 font-mono">
                      {isUploading ? (
                        <span className="flex items-center gap-1 text-amber-300">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Cloud className="w-2.5 h-2.5" /> S3
                        </span>
                      )}
                    </div>
                  </div>

                  {/* GraphML Metrics & Preview */}
                  <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden bg-black/20">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-300 font-medium">
                        <Network className="w-3 h-3 text-purple-400" /> {nodeCount} Nodes
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-[10px] text-indigo-300 font-medium">
                        <GitFork className="w-3 h-3 text-indigo-400" /> {edgeCount} Connections
                      </span>
                    </div>

                    {node.previewText ? (
                      <div className="flex-1 bg-black/40 rounded-lg p-2 font-mono text-[9px] text-purple-200/80 overflow-y-auto max-h-24 select-text border border-purple-500/20">
                        {node.previewText.slice(0, 300)}...
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-[10px] text-gray-400">
                        GraphML topology stored in S3
                      </div>
                    )}
                  </div>

                  {/* Actions Bar: One-Click Unpack into Board Nodes + Download */}
                  <div className="px-3 py-2 bg-[#12101E] border-t border-purple-500/20 flex items-center justify-between gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImportGraphMLToCanvas(node);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
                      title="Convert GraphML nodes & edges directly into whiteboard cards on canvas"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Place Nodes on Canvas</span>
                    </button>
                    {node.fileUrl && (
                      <a
                        href={node.fileUrl}
                        download={node.fileName || "network.graphml"}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Download raw GraphML from S3"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {isSelected && renderResizeHandles(node)}
                </div>
              );
            }

            // 5d. JSON DATASET NODE (Stored in AWS S3)
            if (node.type === "json") {
              const isUploading = Boolean(node.metaData?.isUploadingToS3);
              const keyCount = node.metaData?.keyCount || 0;
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(node, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                  }}
                  className={`group/json cursor-pointer rounded-xl overflow-hidden transition-all relative flex flex-col bg-[#171614] border border-amber-500/30 ${isSelected
                    ? "ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                    : "shadow-xl hover:border-amber-500/50"
                    }`}
                >
                  {/* JSON Header */}
                  <div className="px-3 py-2 bg-gradient-to-r from-amber-950/80 to-[#262016] border-b border-amber-500/30 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white font-bold text-[9px] uppercase tracking-wider font-mono">
                        {"{ }"} JSON
                      </span>
                      <span className="text-xs font-semibold text-white truncate" title={node.title}>
                        {node.title || "Dataset.json"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-amber-300 shrink-0 font-mono">
                      {isUploading ? (
                        <span className="flex items-center gap-1 text-amber-300">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Cloud className="w-2.5 h-2.5" /> S3
                        </span>
                      )}
                    </div>
                  </div>

                  {/* JSON Code Preview */}
                  <div className="flex-1 p-2.5 bg-black/40 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between text-[10px] text-amber-400/80 pb-1 mb-1 border-b border-amber-500/10">
                      <span>{keyCount ? `${keyCount} root keys` : "JSON Object"}</span>
                      <span className="text-[9px] text-gray-500 font-mono">read-only preview</span>
                    </div>
                    <pre className="flex-1 font-mono text-[10px] text-amber-200/90 overflow-auto p-1 select-text whitespace-pre-wrap break-all">
                      {node.previewText || "{}"}
                    </pre>
                  </div>

                  {/* JSON Footer Actions */}
                  <div className="px-3 py-1.5 bg-[#12110F] border-t border-amber-500/20 flex items-center justify-between gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (node.previewText) {
                          navigator.clipboard.writeText(node.previewText);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-[10px] font-semibold transition-colors border border-amber-500/30 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy JSON</span>
                    </button>
                    {node.fileUrl && (
                      <a
                        href={node.fileUrl}
                        download={node.fileName || "data.json"}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Download JSON from S3"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {isSelected && renderResizeHandles(node)}
                </div>
              );
            }

            // 5e. MARKDOWN SPECIFICATION NODE (Stored in AWS S3)
            if (node.type === "markdown") {
              const isUploading = Boolean(node.metaData?.isUploadingToS3);
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(node, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                  }}
                  className={`group/md cursor-pointer rounded-xl overflow-hidden transition-all relative flex flex-col bg-[#131722] border border-blue-500/30 ${isSelected
                    ? "ring-2 ring-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    : "shadow-xl hover:border-blue-500/50"
                    }`}
                >
                  {/* Markdown Header */}
                  <div className="px-3 py-2 bg-gradient-to-r from-blue-950/80 to-[#182035] border-b border-blue-500/30 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider font-mono">
                        MD
                      </span>
                      <span className="text-xs font-semibold text-white truncate" title={node.title}>
                        {node.title || "Notes.md"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-blue-300 shrink-0 font-mono">
                      {isUploading ? (
                        <span className="flex items-center gap-1 text-amber-300">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Cloud className="w-2.5 h-2.5" /> S3
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Markdown Body Preview */}
                  <div className="flex-1 p-3 bg-black/30 overflow-y-auto select-text text-gray-200 text-xs leading-relaxed font-sans scrollbar-thin">
                    {renderMarkdownToJsx(node.previewText || node.body || "Empty markdown document.")}
                  </div>

                  {/* Markdown Footer Actions */}
                  <div className="px-3 py-1.5 bg-[#0F121C] border-t border-blue-500/20 flex items-center justify-between gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (node.previewText || node.body) {
                          navigator.clipboard.writeText(node.previewText || node.body || "");
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[10px] font-semibold transition-colors border border-blue-500/30 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy MD</span>
                    </button>
                    {node.fileUrl && (
                      <a
                        href={node.fileUrl}
                        download={node.fileName || "document.md"}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Download Markdown from S3"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {isSelected && renderResizeHandles(node)}
                </div>
              );
            }

            // 5f. GENERIC FILE ATTACHMENT NODE (Stored in AWS S3)
            if (node.type === "file") {
              const isUploading = Boolean(node.metaData?.isUploadingToS3);
              const fileSizeKb = node.fileSize ? (node.fileSize / 1024).toFixed(0) + " KB" : "";
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(node, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                  }}
                  className={`group/file cursor-pointer rounded-xl overflow-hidden transition-all relative flex flex-col bg-[#181A22] border border-gray-700 ${isSelected
                    ? "ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                    : "shadow-xl hover:border-gray-600"
                    }`}
                >
                  {/* File Header */}
                  <div className="px-3 py-2 bg-[#20222C] border-b border-gray-700 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-200 font-bold text-[9px] uppercase tracking-wider">
                        {node.fileExtension || "FILE"}
                      </span>
                      <span className="text-xs font-semibold text-white truncate" title={node.title}>
                        {node.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-gray-400 shrink-0 font-mono">
                      {isUploading ? (
                        <span className="flex items-center gap-1 text-amber-300">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Cloud className="w-2.5 h-2.5" /> S3
                        </span>
                      )}
                    </div>
                  </div>

                  {/* File Body */}
                  <div className="flex-1 p-3 flex flex-col items-center justify-center text-center overflow-hidden">
                    <File className="w-7 h-7 text-gray-400 mb-1.5" />
                    <p className="text-xs text-gray-200 font-medium truncate max-w-full">
                      {node.fileName || node.title}
                    </p>
                    {fileSizeKb && <p className="text-[10px] text-gray-500 mt-0.5">{fileSizeKb}</p>}
                  </div>

                  {/* File Footer */}
                  {node.fileUrl && (
                    <div className="px-3 py-1.5 bg-[#13141B] border-t border-gray-700/50 flex items-center justify-end shrink-0">
                      <a
                        href={node.fileUrl}
                        download={node.fileName || "attachment"}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-[10px] font-semibold"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>
                    </div>
                  )}

                  {isSelected && renderResizeHandles(node)}
                </div>
              );
            }

            // 6. TEXT BLOCK NODE
            if (node.type === "text") {
              const fontSizePx = `${parseFontSizePx(node.fontSize, 15)}px`;

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(node, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                  }}
                  className={`cursor-pointer p-2 flex items-center transition-all relative ${isSelected ? "ring-2 ring-blue-400 rounded-md bg-blue-500/10" : "hover:bg-white/5 rounded-md"
                    }`}
                >
                  {isEditing ? (
                    <textarea
                      autoFocus
                      defaultValue={node.title}
                      onMouseDown={(e) => e.stopPropagation()}
                      onChange={(e) => handleLiveTextChange(node.id, { title: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") e.currentTarget.blur();
                      }}
                      onBlur={(e) => {
                        updateNode(node.id, { title: e.target.value });
                        setEditingNodeId(null);
                      }}
                      className="w-full h-full bg-transparent focus:outline-none resize-none"
                      style={{
                        fontSize: fontSizePx,
                        fontWeight: node.fontWeight || "normal",
                        textAlign: node.textAlign || "left",
                        color: node.textColor || node.color || "#FFFFFF",
                      }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center"
                      style={{
                        justifyContent:
                          node.textAlign === "center"
                            ? "center"
                            : node.textAlign === "right"
                              ? "flex-end"
                              : "flex-start",
                      }}
                    >
                      <span
                        className="leading-snug break-words select-none"
                        style={{
                          fontSize: fontSizePx,
                          fontWeight: node.fontWeight || "normal",
                          textAlign: node.textAlign || "left",
                          color: node.textColor || node.color || "#FFFFFF",
                        }}
                      >
                        {node.title || "Text block"}
                      </span>
                    </div>
                  )}

                  {isSelected && renderResizeHandles(node)}
                </div>
              );
            }

            // 6.5 STRAIGHT LINE & INDEPENDENT ARROW NODE (360° Rotatable & Extensible Tips, Middle Drag)
            if (node.type === "line" || node.shapeType === "line" || node.shapeType === "arrow") {
              const { x1, y1, x2, y2 } = getLineEndpoints(node);
              const strokeColor = node.color || "#60A5FA";
              const strokeW = node.strokeWidth || 3;
              const isDashed = node.lineStyle === "dashed";
              const isArrow =
                node.shapeType === "arrow" || (node.arrowDirection && node.arrowDirection !== "none");
              const arrowDir = node.arrowDirection || (isArrow ? "forward" : "none");
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              const hasEndArrow = arrowDir === "forward" || arrowDir === "bidirectional";
              const hasStartArrow = arrowDir === "backward" || arrowDir === "bidirectional";

              const dx = x2 - x1;
              const dy = y2 - y1;
              const dist = Math.hypot(dx, dy);
              const ux = dist > 0.001 ? dx / dist : 1;
              const uy = dist > 0.001 ? dy / dist : 0;

              // Wing length and arrow depth dynamically scaling with stroke width
              const wingLength = Math.max(12, Math.round(strokeW * 2.8 + 6));
              const arrowDepth = wingLength * Math.cos(Math.PI / 6);

              // Trim line stroke ends under arrowheads so rounded cap never pokes through the triangle apex
              const startOffset = hasStartArrow ? Math.min(arrowDepth * 0.45, dist * 0.45) : 0;
              const endOffset = hasEndArrow ? Math.min(arrowDepth * 0.45, dist * 0.45) : 0;

              const strokeX1 = x1 + startOffset * ux;
              const strokeY1 = y1 + startOffset * uy;
              const strokeX2 = x2 - endOffset * ux;
              const strokeY2 = y2 - endOffset * uy;

              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 0,
                    height: 0,
                    overflow: "visible",
                  }}
                  className="select-none"
                >
                  <svg
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: 1,
                      height: 1,
                      overflow: "visible",
                    }}
                    className="pointer-events-none"
                  >
                    {/* Wide invisible hit target line for selecting & middle/stroke drag */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="transparent"
                      strokeWidth={Math.max(strokeW + 22, 26)}
                      strokeLinecap="round"
                      className="pointer-events-auto cursor-move"
                      onMouseDown={(e) => handleLineMiddleMouseDown(node, e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                        setSelectedNodeIds([node.id]);
                      }}
                      onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                    />

                    {/* Visible line with trimmed ends under arrowheads to prevent rounded cap from protruding */}
                    <line
                      x1={strokeX1}
                      y1={strokeY1}
                      x2={strokeX2}
                      y2={strokeY2}
                      stroke={isSelected ? "#38BDF8" : strokeColor}
                      strokeWidth={strokeW}
                      strokeDasharray={isDashed ? "8,6" : undefined}
                      strokeLinecap="round"
                      className="pointer-events-none"
                    />

                    {/* Arrowheads - dynamically sized to stroke width, apex exactly at end tip */}
                    {hasEndArrow &&
                      renderArrowhead(x2, y2, x1, y1, isSelected ? "#38BDF8" : strokeColor, strokeW)}
                    {hasStartArrow &&
                      renderArrowhead(x1, y1, x2, y2, isSelected ? "#38BDF8" : strokeColor, strokeW)}
                  </svg>

                  {/* Optional Title Label at midpoint */}
                  {isEditing ? (
                    <div
                      style={{
                        position: "absolute",
                        left: `${midX}px`,
                        top: `${midY - 14}px`,
                        transform: "translate(-50%, -100%)",
                      }}
                      className="z-40 pointer-events-auto"
                    >
                      <input
                        type="text"
                        autoFocus
                        defaultValue={node.title || ""}
                        onMouseDown={(e) => e.stopPropagation()}
                        onChange={(e) => handleLiveTextChange(node.id, { title: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                        onBlur={(e) => {
                          updateNode(node.id, { title: e.target.value });
                          setEditingNodeId(null);
                        }}
                        className="bg-[#16171E] text-white text-xs border border-blue-400 px-2 py-0.5 rounded shadow-lg focus:outline-none"
                        placeholder="Line label..."
                      />
                    </div>
                  ) : (
                    node.title && !node.title.toLowerCase().includes("copy") && (
                      <div
                        style={{
                          position: "absolute",
                          left: `${midX}px`,
                          top: `${midY - 14}px`,
                          transform: "translate(-50%, -100%)",
                        }}
                        className="px-2 py-0.5 rounded bg-[#16171E]/90 border border-gray-700 text-[11px] font-semibold text-gray-200 pointer-events-none whitespace-nowrap shadow-md"
                      >
                        {node.title}
                      </div>
                    )
                  )}

                  {/* Selection Handles: Left Tip, Right Tip, and Middle Handle (NO 8-point bounding box handles!) */}
                  {isSelected && (
                    <>
                      {/* Left Tip Handle (at x1, y1) - 360° Rotatable & Extensible independent tip */}
                      <div
                        style={{
                          position: "absolute",
                          left: `${x1}px`,
                          top: `${y1}px`,
                          transform: "translate(-50%, -50%)",
                        }}
                        className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg cursor-crosshair flex items-center justify-center hover:scale-125 hover:bg-blue-400 transition-transform pointer-events-auto z-30 group"
                        onMouseDown={(e) => handleLineTipMouseDown(node, "start", e)}
                        title="Left Tip: Drag in 360° to rotate or extend (Hold Shift for 15° snap)"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white pointer-events-none" />
                      </div>

                      {/* Right Tip Handle (at x2, y2) - 360° Rotatable & Extensible independent tip */}
                      <div
                        style={{
                          position: "absolute",
                          left: `${x2}px`,
                          top: `${y2}px`,
                          transform: "translate(-50%, -50%)",
                        }}
                        className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg cursor-crosshair flex items-center justify-center hover:scale-125 hover:bg-blue-400 transition-transform pointer-events-auto z-30 group"
                        onMouseDown={(e) => handleLineTipMouseDown(node, "end", e)}
                        title="Right Tip: Drag in 360° to rotate or extend (Hold Shift for 15° snap)"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white pointer-events-none" />
                      </div>

                      {/* Middle Handle (at midpoint) - Drag to move entire line/arrow */}
                      <div
                        style={{
                          position: "absolute",
                          left: `${midX}px`,
                          top: `${midY}px`,
                          transform: "translate(-50%, -50%)",
                        }}
                        className="w-4 h-4 rounded-full bg-cyan-400 border-2 border-[#16171E] shadow-md cursor-move flex items-center justify-center hover:scale-125 hover:bg-cyan-300 transition-transform pointer-events-auto z-30"
                        onMouseDown={(e) => handleLineMiddleMouseDown(node, e)}
                        title="Middle: Drag to move line across canvas"
                      >
                        <div className="w-1 h-1 rounded-full bg-black pointer-events-none" />
                      </div>
                    </>
                  )}
                </div>
              );
            }

            // 7. TECH, PRODUCT & FLOW ICON NODE (Icon Squircle Badge + Bottom Text Name only)
            if (node.type === "icon") {
              const nodeColor = node.color || "#0EA5E9";
              const IconComp = getLucideIcon(node.iconName);
              const isOldDefaultSize = node.width === 150 && node.height === 110;
              const nodeW = isOldDefaultSize ? 80 : (node.width || 80);
              const nodeH = isOldDefaultSize ? 82 : (node.height || 82);

              // Dynamically scale icon squircle relative to node bounds if resized
              const iconBoxSize = Math.max(
                32,
                Math.min(Math.round(nodeW * 0.72), Math.round(nodeH - 26))
              );
              const iconGlyphSize = Math.max(16, Math.round(iconBoxSize * 0.52));

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(node, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${nodeW}px`,
                    height: `${nodeH}px`,
                  }}
                  className={`relative cursor-pointer transition-all select-none group/iconNode flex flex-col items-center justify-between p-0.5 ${isSelected
                    ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent rounded-2xl"
                    : "hover:opacity-95"
                    }`}
                >
                  {/* Rounded Icon Squircle Box */}
                  <div
                    className="rounded-2xl flex items-center justify-center transition-transform group-hover/iconNode:scale-105 shrink-0"
                    style={{
                      width: `${iconBoxSize}px`,
                      height: `${iconBoxSize}px`,
                      backgroundColor: "#13151D",
                      border: `1.5px solid ${nodeColor}66`,
                      color: nodeColor,
                      boxShadow: `0 4px 18px -2px ${nodeColor}33`,
                    }}
                    title={node.subtitle || node.title}
                  >
                    <IconComp
                      style={{
                        width: `${iconGlyphSize}px`,
                        height: `${iconGlyphSize}px`,
                      }}
                      className="drop-shadow-md"
                    />
                  </div>

                  {/* Bottom Text Name */}
                  <div className="w-full text-center px-0.5 mt-1">
                    {isEditing ? (
                      <input
                        type="text"
                        defaultValue={node.title}
                        autoFocus
                        onMouseDown={(e) => e.stopPropagation()}
                        onChange={(e) => handleLiveTextChange(node.id, { title: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                        onBlur={(e) => {
                          updateNode(node.id, { title: e.target.value });
                          setEditingNodeId(null);
                        }}
                        className="bg-black/80 border border-white/30 rounded px-1 text-center w-full focus:outline-none font-bold text-white text-xs"
                      />
                    ) : (
                      <div
                        className="text-xs font-bold truncate leading-tight drop-shadow-sm"
                        style={{
                          color: node.textColor || "#FFFFFF",
                          fontSize: `${parseFontSizePx(node.fontSize, 12)}px`,
                          fontWeight: node.fontWeight || "bold",
                        }}
                        title={node.title}
                      >
                        {node.title || "Icon Node"}
                      </div>
                    )}
                  </div>

                  {isSelected && renderResizeHandles(node)}
                </div>
              );
            }

            // 8. GEOMETRIC SHAPES (Square, Diamond, Circle, Triangle, Star, Hexagon, etc.)
            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(node, e)}
                onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                style={{
                  position: "absolute",
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${node.width}px`,
                  height: `${node.height}px`,
                }}
                className={`relative cursor-pointer transition-all ${isSelected ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0D0E11]" : ""
                  }`}
              >
                {/* Vector Shape Geometry */}
                <div className="absolute inset-0 pointer-events-none">
                  {renderShapeGeometry(node)}
                </div>

                {/* Centered editable label */}
                <div className="absolute inset-0 flex items-center justify-center p-3 text-center pointer-events-none">
                  {isEditing ? (
                    <input
                      type="text"
                      defaultValue={node.title}
                      autoFocus
                      onMouseDown={(e) => e.stopPropagation()}
                      onChange={(e) => handleLiveTextChange(node.id, { title: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      onBlur={(e) => {
                        updateNode(node.id, { title: e.target.value });
                        setEditingNodeId(null);
                      }}
                      className="bg-transparent text-center w-full focus:outline-none font-bold pointer-events-auto"
                      style={{
                        fontWeight: node.fontWeight || "bold",
                        fontSize: `${parseFontSizePx(node.fontSize, 13)}px`,
                        color: node.textColor || "#FFFFFF",
                      }}
                    />
                  ) : (
                    <span
                      className="font-bold select-none leading-snug break-words px-1"
                      style={{
                        fontWeight: node.fontWeight || "bold",
                        fontSize: `${parseFontSizePx(node.fontSize, 13)}px`,
                        color: node.textColor || "#FFFFFF",
                      }}
                    >
                      {node.title || ""}
                    </span>
                  )}
                </div>

                {isSelected && renderResizeHandles(node)}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. BOTTOM-LEFT ZOOM CONTROLS (Matching Screenshots 2-5) */}
      <div className="absolute bottom-5 left-5 z-40 bg-[#14151B]/95 backdrop-blur-md border border-[#262832] rounded-lg shadow-xl px-2 py-1 flex items-center gap-1.5 text-xs text-gray-300">
        <button
          onClick={() => {
            setZoom(0.5);
            setPan({ x: 50, y: 50 });
          }}
          className="p-1 hover:bg-[#23252E] rounded text-gray-400 hover:text-white"
          title="Fit to screen"
        >
          <RefreshCcwIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((prev) => Math.max(0.1, Number((prev - 0.05).toFixed(2))))}
          className="p-1 hover:bg-[#23252E] rounded text-gray-400 hover:text-white"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] font-bold w-12 text-center text-gray-200">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((prev) => Math.min(2.0, Number((prev + 0.05).toFixed(2))))}
          className="p-1 hover:bg-[#23252E] rounded text-gray-400 hover:text-white"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[#262832]" />

        {/* Whiteboard Background Color Chooser */}
        <div className="relative" ref={bgColorPickerRef}>
          <button
            type="button"
            onClick={() => setShowBgColorPicker(!showBgColorPicker)}
            className="w-6 h-6 rounded flex items-center justify-center border border-[#2A2C38] hover:border-gray-500 hover:bg-[#23252E] transition-all cursor-pointer group"
            title={`Whiteboard Background (${canvasBgColor})`}
            aria-label="Choose whiteboard canvas background color"
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs transition-transform group-hover:scale-110"
              style={{ backgroundColor: canvasBgColor }}
            />
          </button>

          {showBgColorPicker && (
            <div
              className="absolute bottom-full left-0 mb-2 p-2.5 bg-[#1A1C22] border border-[#2E313B] rounded-lg shadow-2xl z-50 flex flex-col gap-2 min-w-[210px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Canvas Background
                </span>
                <span className="text-[10px] font-mono text-gray-300 uppercase">
                  {canvasBgColor}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {CANVAS_BG_THEMES.map((theme) => (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => {
                      setCanvasBgColor(theme.value);
                      canvasBgColorRef.current = theme.value;
                      setShowBgColorPicker(false);
                      triggerAutoSave(nodesRef.current, edgesRef.current, undefined, theme.value, true);
                    }}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-md border text-[10px] transition-all cursor-pointer ${canvasBgColor.toLowerCase() === theme.value.toLowerCase()
                      ? "border-blue-500 bg-blue-500/15 text-white font-bold"
                      : "border-[#2E313B] hover:border-gray-500 text-gray-400 hover:text-gray-200 hover:bg-[#23252E]"
                      }`}
                    title={theme.name}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-black/30 shadow-xs"
                      style={{ backgroundColor: theme.value }}
                    />
                    <span className="truncate max-w-[42px] leading-tight text-[9px]">{theme.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-[#2E313B] flex items-center justify-between gap-2 px-0.5">
                <span className="text-[11px] text-gray-400">Custom</span>
                <div className="flex items-center gap-1.5 bg-[#121316] px-1.5 py-0.5 rounded border border-[#282B33]">
                  <input
                    type="color"
                    value={canvasBgColor.startsWith("#") ? canvasBgColor : "#0D0E11"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCanvasBgColor(val);
                      canvasBgColorRef.current = val;
                      triggerAutoSave(nodesRef.current, edgesRef.current, undefined, val, true);
                    }}
                    className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
                    title="Choose custom hex color"
                  />
                  <span className="text-[10px] font-mono text-gray-300 uppercase select-all">
                    {canvasBgColor}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5a. BOTTOM-RIGHT CANVAS NAVIGATOR / MINIMAP RADAR ("small section at right corner which displays position ontime") */}
      <div className="absolute bottom-3 right-3 z-40 select-none">
        {isMounted && (
          showMinimap ? (
            <div className="bg-[#14151B]/10 border border-[#262832] rounded-xl shadow-2xl p-2 animate-in fade-in-50 duration-150">
              {/* Navigator Header */}
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#242630] text-[10px] text-gray-400">
                <div className="flex items-center gap-1.5 font-bold text-gray-200">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Navigator</span>
                  <span className="text-[9px] text-gray-500 font-normal">
                    ({nodes.length})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleFitAllToScreen}
                    className="p-1 hover:bg-[#22242D] rounded text-gray-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    title="Fit all diagrams to screen"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setShowMinimap(false)}
                    className="p-1 hover:bg-[#22242D] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Minimize navigator"
                  >
                    <Minimize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Interactive Minimap SVG */}
              <div className="relative rounded-lg overflow-hidden border border-[#22242E] bg-[#0A0B0E]">
                <svg
                  ref={minimapSvgRef}
                  width={minimapW}
                  height={minimapH}
                  className="cursor-crosshair block"
                  onMouseDown={(e) => {
                    setIsDraggingMinimap(true);
                    handleMinimapNav(e);
                  }}
                  onMouseMove={(e) => {
                    if (isDraggingMinimap) {
                      handleMinimapNav(e);
                    }
                  }}
                  onMouseUp={() => setIsDraggingMinimap(false)}
                  onMouseLeave={() => setIsDraggingMinimap(false)}
                >
                  {/* Subtle Grid Dots */}
                  <pattern
                    id="minimap-grid"
                    width="15"
                    height="15"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="2" cy="2" r="0.7" fill="#1C1E26" />
                  </pattern>
                  <rect width={minimapW} height={minimapH} fill="url(#minimap-grid)" />

                  {/* Miniature Nodes & Lines */}
                  {nodes.map((n) => {
                    if (n.type === "line" || n.shapeType === "line" || n.shapeType === "arrow") {
                      const { x1, y1, x2, y2 } = getLineEndpoints(n);
                      const mx1 = mmOffsetX + (x1 - mmMinX) * mmScale;
                      const my1 = mmOffsetY + (y1 - mmMinY) * mmScale;
                      const mx2 = mmOffsetX + (x2 - mmMinX) * mmScale;
                      const my2 = mmOffsetY + (y2 - mmMinY) * mmScale;
                      return (
                        <line
                          key={`mm-${n.id}`}
                          x1={mx1}
                          y1={my1}
                          x2={mx2}
                          y2={my2}
                          stroke={n.color || "#60A5FA"}
                          strokeWidth="1.5"
                          opacity={0.85}
                        />
                      );
                    }

                    const mx = mmOffsetX + (n.x - mmMinX) * mmScale;
                    const my = mmOffsetY + (n.y - mmMinY) * mmScale;
                    const mw = Math.max(3, (n.width || 60) * mmScale);
                    const mh = Math.max(2, (n.height || 40) * mmScale);
                    const isSel = selectedNodeIds.includes(n.id) || selectedNodeId === n.id;

                    return (
                      <rect
                        key={`mm-${n.id}`}
                        x={mx}
                        y={my}
                        width={mw}
                        height={mh}
                        rx={1}
                        fill={isSel ? "#38BDF8" : n.color || "#EC4899"}
                        stroke={isSel ? "#FFFFFF" : "transparent"}
                        strokeWidth="0.5"
                        opacity={isSel ? 1 : 0.75}
                      />
                    );
                  })}

                  {/* Viewport Camera Highlight Box */}
                  <rect
                    x={vpBoxX}
                    y={vpBoxY}
                    width={vpBoxW}
                    height={vpBoxH}
                    rx={2}
                    fill="rgba(56, 189, 248, 0.16)"
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                    strokeDasharray="4,2"
                    className="pointer-events-none"
                  />
                </svg>
              </div>

              {/* Minimap Status Footer */}
              <div className="mt-1.5 pt-1 border-t border-[#22242D] text-[9px] text-gray-500 flex items-center justify-between">
                <span>Zoom: {Math.round(zoom * 100)}%</span>
                <span className="text-cyan-400/80 font-medium">Click / drag to pan</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowMinimap(true)}
              className="px-2.5 py-1.5 rounded-xl bg-[#14151B]/95 backdrop-blur-md border border-[#262832] text-gray-300 hover:text-white hover:border-cyan-500/50 shadow-xl transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer group"
              title="Open Canvas Navigator Minimap"
            >
              <Compass className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
              <span>Navigator</span>
            </button>
          )
        )}
      </div>

      {/* 5b. FLOATING ARROW CONNECTION TOOLBAR ("connect two different nodes by arrows <- or -> or <->") */}
      {activeTool === "arrow" && (
        <div className="absolute bottom-18 left-1/2 -translate-x-1/2 z-40 bg-[#16171E]/95 backdrop-blur-md border border-blue-500/60 rounded-xl shadow-2xl px-3.5 py-2 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-1.5 pr-2 border-r border-[#2A2C37]">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-bold text-white text-[11px] tracking-wide whitespace-nowrap">Arrow Link</span>
          </div>

          {/* Direction Selector: <- , -> , <-> */}
          <div className="flex items-center gap-1 bg-[#101115] p-0.5 rounded-lg border border-[#262833]">
            <button
              onClick={() => setArrowConnectType("backward")}
              className={`px-2.5 py-1 rounded flex items-center gap-1 font-mono text-xs font-bold transition-all cursor-pointer ${arrowConnectType === "backward"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-gray-400 hover:text-white hover:bg-[#1E2028]"
                }`}
              title="Backward arrow: Target points to Source (<-)"
            >
              <MoveLeft className="w-3.5 h-3.5" />
              <span>&lt;-</span>
            </button>

            <button
              onClick={() => setArrowConnectType("forward")}
              className={`px-2.5 py-1 rounded flex items-center gap-1 font-mono text-xs font-bold transition-all cursor-pointer ${arrowConnectType === "forward"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-gray-400 hover:text-white hover:bg-[#1E2028]"
                }`}
              title="Forward arrow: Source points to Target (->)"
            >
              <span>-&gt;</span>
              <MoveRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setArrowConnectType("bidirectional")}
              className={`px-2.5 py-1 rounded flex items-center gap-1 font-mono text-xs font-bold transition-all cursor-pointer ${arrowConnectType === "bidirectional"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-gray-400 hover:text-white hover:bg-[#1E2028]"
                }`}
              title="Bidirectional arrow: Double-ended (<->)"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>&lt;-&gt;</span>
            </button>
          </div>

          {/* Status Message */}
          <div className="flex items-center text-[11px] whitespace-nowrap px-1">
            {connectingFromNodeId ? (
              <span className="text-amber-300 font-semibold flex items-center gap-1 animate-pulse">
                Click target node to connect
              </span>
            ) : (
              <span className="text-gray-300">
                Click 1st node, then click 2nd node
              </span>
            )}
          </div>

          {/* Cancel Button */}
          <button
            onClick={() => {
              if (connectingFromNodeId) {
                setConnectingFromNodeId(null);
                setConnectingMousePos(null);
              } else {
                setActiveTool("select");
              }
            }}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#22242D] cursor-pointer"
            title="Cancel (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 5c. FLOATING PEN DRAWING TOOLBAR ("draw by pen needed to activate") */}
      {activeTool === "draw" && (
        <div className="absolute bottom-18 left-1/2 -translate-x-1/2 z-40 bg-[#16171E]/95 backdrop-blur-md border border-pink-500/60 rounded-xl shadow-2xl px-3.5 py-2 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-1.5 pr-2 border-r border-[#2A2C37]">
            <div
              className="w-2.5 h-2.5 rounded-full shadow-sm animate-pulse"
              style={{ backgroundColor: penColor }}
            />
            <span className="font-bold text-white text-[11px] tracking-wide whitespace-nowrap">Pen Tool</span>
          </div>

          {/* Color Swatches */}
          <div className="flex items-center gap-1.5">
            {[
              { color: "#EC4899", name: "Pink" },
              { color: "#3B82F6", name: "Blue" },
              { color: "#10B981", name: "Green" },
              { color: "#F59E0B", name: "Amber" },
              { color: "#EF4444", name: "Red" },
              { color: "#8B5CF6", name: "Purple" },
              { color: "#FFFFFF", name: "White" },
            ].map((c) => (
              <button
                key={c.color}
                onClick={() => setPenColor(c.color)}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${penColor === c.color ? "ring-2 ring-white scale-125" : "border border-white/20 hover:scale-110"
                  }`}
                style={{ backgroundColor: c.color }}
                title={c.name}
              />
            ))}
          </div>

          <div className="h-4 w-px bg-[#2A2C37]" />

          {/* Stroke Width Selector */}
          <div className="flex items-center gap-0.5 bg-[#101115] p-0.5 rounded-lg border border-[#262833]">
            {[
              { width: 2, label: "Thin" },
              { width: 4, label: "Medium" },
              { width: 7, label: "Thick" },
              { width: 12, label: "Bold" },
            ].map((sw) => (
              <button
                key={sw.width}
                onClick={() => setPenStrokeWidth(sw.width)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${penStrokeWidth === sw.width
                  ? "bg-pink-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-[#1E2028]"
                  }`}
              >
                {sw.label}
              </button>
            ))}
          </div>

          <span className="text-gray-400 text-[11px] hidden md:inline whitespace-nowrap">
            Draw freehand on canvas
          </span>

          <button
            onClick={() => setActiveTool("select")}
            className="px-2 py-0.5 rounded bg-[#242630] hover:bg-[#2C2E3A] text-gray-200 hover:text-white text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* 6. FLOATING BOTTOM TOOLBAR (Matching exact layout from Screenshots 2, 3, 4, 5) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 bg-[#16171E]/95 backdrop-blur-md border border-[#262832] rounded-xl shadow-2xl px-3 py-1.5 flex items-center gap-1.5">
        {/* V - Select Tool */}
        <button
          onClick={() => setActiveTool("select")}
          className={`p-2 rounded-lg transition-colors ${activeTool === "select"
            ? "bg-blue-600 text-white shadow-sm"
            : "text-gray-400 hover:text-white hover:bg-[#22242D]"
            }`}
          title="Select (V)"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* H - Hand Tool */}
        <button
          onClick={() => setActiveTool("hand")}
          className={`p-2 rounded-lg transition-colors ${activeTool === "hand"
            ? "bg-blue-600 text-white shadow-sm"
            : "text-gray-400 hover:text-white hover:bg-[#22242D]"
            }`}
          title="Pan Hand (H)"
        >
          <Hand className="w-4 h-4" />
        </button>

        {/* Task Card Node Tool */}
        <button
          draggable={true}
          onDragStart={(e) =>
            handleItemDragStart(e, { category: "node", type: "task" })
          }
          onClick={() => {
            setActiveTool("task");
            handleAddNode("task");
          }}
          className={`p-2 rounded-lg transition-colors cursor-grab active:cursor-grabbing ${activeTool === "task"
            ? "bg-blue-600 text-white shadow-sm"
            : "text-gray-400 hover:text-white hover:bg-[#22242D]"
            }`}
          title="Add Org Task Card (Click or Hold & Drag onto canvas)"
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        {/* D - Pen / Draw Tool */}
        <button
          onClick={() => setActiveTool(activeTool === "draw" ? "select" : "draw")}
          className={`p-2 rounded-lg transition-colors ${activeTool === "draw"
            ? "bg-pink-600 text-white shadow-sm ring-1 ring-pink-400"
            : "text-gray-400 hover:text-white hover:bg-[#22242D]"
            }`}
          title="Pen Draw Tool (P or D)"
        >
          <PenTool className="w-4 h-4" />
        </button>

        {/* R - Shapes Tool with Palette Popover (Matching Screenshot 4) */}
        <div className="relative" ref={shapePaletteRef}>
          <button
            draggable={true}
            onDragStart={(e) =>
              handleItemDragStart(e, {
                category: "node",
                type: "shape",
                shapeType: "rectangle",
              })
            }
            onClick={() => setShowShapePalette(!showShapePalette)}
            className={`p-2 rounded-lg transition-colors cursor-grab active:cursor-grabbing ${showShapePalette || activeTool === "shape"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-[#22242D]"
              }`}
            title="Shapes (Click or Hold & Drag onto canvas)"
          >
            <Square className="w-4 h-4" />
          </button>

          {/* Screenshot 4: Shape Grid Palette Popover */}
          {showShapePalette && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#181920] border border-[#2D3039] rounded-xl shadow-2xl p-3 grid grid-cols-3 gap-2 w-56 z-50 animate-in fade-in-50">
              <button
                draggable={true}
                onDragStart={(e) =>
                  handleItemDragStart(e, {
                    category: "node",
                    type: "shape",
                    shapeType: "rectangle",
                  })
                }
                onClick={() => handleAddNode("shape", "rectangle")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-grab active:cursor-grabbing"
                title="Rectangle Box (Click or Hold & Drag onto canvas)"
              >
                <Square className="w-4 h-4" />
                <span className="text-[9px]">Box</span>
              </button>
              <button
                draggable={true}
                onDragStart={(e) =>
                  handleItemDragStart(e, {
                    category: "node",
                    type: "shape",
                    shapeType: "rounded",
                  })
                }
                onClick={() => handleAddNode("shape", "rounded")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-grab active:cursor-grabbing"
                title="Rounded Box (Click or Hold & Drag onto canvas)"
              >
                <Square className="w-4 h-4 rounded-md" />
                <span className="text-[9px]">Rounded</span>
              </button>
              <button
                draggable={true}
                onDragStart={(e) =>
                  handleItemDragStart(e, {
                    category: "node",
                    type: "shape",
                    shapeType: "circle",
                  })
                }
                onClick={() => handleAddNode("shape", "circle")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-grab active:cursor-grabbing"
                title="Circle (Click or Hold & Drag onto canvas)"
              >
                <Circle className="w-4 h-4" />
                <span className="text-[9px]">Circle</span>
              </button>
              <button
                draggable={true}
                onDragStart={(e) =>
                  handleItemDragStart(e, {
                    category: "node",
                    type: "shape",
                    shapeType: "diamond",
                  })
                }
                onClick={() => handleAddNode("shape", "diamond")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-grab active:cursor-grabbing"
                title="Diamond (Click or Hold & Drag onto canvas)"
              >
                <Diamond className="w-4 h-4" />
                <span className="text-[9px]">Diamond</span>
              </button>
              <button
                draggable={true}
                onDragStart={(e) =>
                  handleItemDragStart(e, {
                    category: "node",
                    type: "shape",
                    shapeType: "triangle",
                  })
                }
                onClick={() => handleAddNode("shape", "triangle")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-grab active:cursor-grabbing"
                title="Triangle (Click or Hold & Drag onto canvas)"
              >
                <Triangle className="w-4 h-4" />
                <span className="text-[9px]">Triangle</span>
              </button>
              <button
                draggable={true}
                onDragStart={(e) =>
                  handleItemDragStart(e, {
                    category: "node",
                    type: "shape",
                    shapeType: "hexagon",
                  })
                }
                onClick={() => handleAddNode("shape", "hexagon")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-grab active:cursor-grabbing"
                title="Hexagon (Click or Hold & Drag onto canvas)"
              >
                <Hexagon className="w-4 h-4" />
                <span className="text-[9px]">Hexagon</span>
              </button>
              <button
                draggable={true}
                onDragStart={(e) =>
                  handleItemDragStart(e, {
                    category: "node",
                    type: "line",
                    shapeType: "line",
                  })
                }
                onClick={() => handleAddNode("line", "line")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-grab active:cursor-grabbing"
                title="Straight Line (Click or Hold & Drag onto canvas)"
              >
                <Minus className="w-4 h-4 text-blue-400" />
                <span className="text-[9px]">Line</span>
              </button>
              <button
                draggable={true}
                onDragStart={(e) =>
                  handleItemDragStart(e, {
                    category: "node",
                    type: "line",
                    shapeType: "arrow",
                  })
                }
                onClick={() => handleAddNode("line", "arrow")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-grab active:cursor-grabbing"
                title="Independent Arrow (Click or Hold & Drag onto canvas)"
              >
                <ArrowUpRight className="w-4 h-4 text-blue-400" />
                <span className="text-[9px]">Arrow</span>
              </button>
              <button
                draggable={true}
                onDragStart={(e) =>
                  handleItemDragStart(e, {
                    category: "node",
                    type: "shape",
                    shapeType: "star",
                  })
                }
                onClick={() => handleAddNode("shape", "star")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-grab active:cursor-grabbing"
                title="Star (Click or Hold & Drag onto canvas)"
              >
                <Star className="w-4 h-4" />
                <span className="text-[9px]">Star</span>
              </button>
            </div>
          )}
        </div>

        {/* L - Straight Line Tool */}
        <button
          draggable={true}
          onDragStart={(e) =>
            handleItemDragStart(e, {
              category: "node",
              type: "line",
              shapeType: "line",
            })
          }
          onClick={() =>
            setActiveTool(activeTool === "line" ? "select" : "line")
          }
          className={`p-2 rounded-lg transition-colors cursor-grab active:cursor-grabbing ${activeTool === "line"
            ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400"
            : "text-gray-400 hover:text-white hover:bg-[#22242D]"
            }`}
          title="Straight Line (L) - Click to draw or drag onto canvas"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Independent Arrow Tool */}
        <button
          draggable={true}
          onDragStart={(e) =>
            handleItemDragStart(e, {
              category: "node",
              type: "line",
              shapeType: "arrow",
            })
          }
          onClick={() =>
            setActiveTool(activeTool === "arrow-line" ? "select" : "arrow-line")
          }
          className={`p-2 rounded-lg transition-colors cursor-grab active:cursor-grabbing ${activeTool === "arrow-line"
            ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400"
            : "text-gray-400 hover:text-white hover:bg-[#22242D]"
            }`}
          title="Independent Arrow - Click to draw or drag onto canvas"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>

        {/* A - Arrow / Connector Tool */}
        <button
          onClick={() => {
            if (activeTool === "arrow") {
              setActiveTool("select");
              setConnectingFromNodeId(null);
              setConnectingMousePos(null);
            } else {
              setActiveTool("arrow");
            }
          }}
          className={`p-2 rounded-lg transition-colors ${activeTool === "arrow"
            ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400"
            : "text-gray-400 hover:text-white hover:bg-[#22242D]"
            }`}
          title="Arrow Connector <- -> <-> (A)"
        >
          <MoveRight className="w-4 h-4" />
        </button>

        {/* Sticky Note Tool (Text File Structuring) */}
        <button
          draggable={true}
          onDragStart={(e) =>
            handleItemDragStart(e, {
              category: "node",
              type: "sticky",
              noteFormat: "text",
              isChecklist: false,
            })
          }
          onClick={() => {
            setActiveTool("sticky");
            handleAddNode("sticky", "rectangle", "#EC4899", false, undefined, "text");
          }}
          className={`p-2 rounded-lg transition-colors cursor-grab active:cursor-grabbing ${activeTool === "sticky"
            ? "bg-pink-600/30 text-pink-300 shadow-sm"
            : "text-gray-400 hover:text-white hover:bg-[#22242D]"
            }`}
          title="Sticky Note - Text File Structuring (Click or Hold & Drag)"
        >
          <StickyNote className="w-4 h-4 text-pink-400" />
        </button>

        {/* JSON Note Tool */}
        <button
          draggable={true}
          onDragStart={(e) =>
            handleItemDragStart(e, {
              category: "node",
              type: "sticky",
              color: "#F59E0B",
              isChecklist: false,
              noteFormat: "json",
            })
          }
          onClick={() => {
            setActiveTool("sticky");
            handleAddNode("sticky", "rectangle", "#F59E0B", false, undefined, "json");
          }}
          className="p-2 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-[#22242D] transition-colors cursor-grab active:cursor-grabbing"
          title="JSON Note - Syntax Highlighted & Auto-Format Structure (Click or Hold & Drag)"
        >
          <Braces className="w-4 h-4" />
        </button>

        {/* Markdown Note Tool */}
        <button
          draggable={true}
          onDragStart={(e) =>
            handleItemDragStart(e, {
              category: "node",
              type: "sticky",
              color: "#6366F1",
              isChecklist: false,
              noteFormat: "markdown",
            })
          }
          onClick={() => {
            setActiveTool("sticky");
            handleAddNode("sticky", "rectangle", "#6366F1", false, undefined, "markdown");
          }}
          className="p-2 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-[#22242D] transition-colors cursor-grab active:cursor-grabbing"
          title="Markdown Note - Rendered Markdown & Checklists (Click or Hold & Drag)"
        >
          <FileCode className="w-4 h-4" />
        </button>

        {/* Direct Add .md / .json File Tool */}
        <button
          type="button"
          onClick={() => directFileInputRef.current?.click()}
          className="p-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-[#22242D] transition-colors cursor-pointer"
          title="Direct Add .md / .json / .txt File from PC"
        >
          <FileUp className="w-4 h-4" />
        </button>

        {/* Shift+N - Todo / Checklist Sticky Tool */}
        <button
          draggable={true}
          onDragStart={(e) =>
            handleItemDragStart(e, {
              category: "node",
              type: "sticky",
              isChecklist: true,
              color: "#38BDF8",
              noteFormat: "checklist",
            })
          }
          onClick={() => {
            setActiveTool("sticky");
            handleAddNode("sticky", "rectangle", "#38BDF8", true, undefined, "checklist");
          }}
          className="p-2 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-[#22242D] transition-colors cursor-grab active:cursor-grabbing"
          title="Todo / Checklist Note with Checkboxes (Click or Hold & Drag onto canvas)"
        >
          <ListTodo className="w-4 h-4" />
        </button>

        {/* T - Text Tool */}
        <button
          draggable={true}
          onDragStart={(e) =>
            handleItemDragStart(e, { category: "node", type: "text" })
          }
          onClick={() => {
            setActiveTool("text");
            handleAddNode("text");
          }}
          className={`p-2 rounded-lg transition-colors cursor-grab active:cursor-grabbing ${activeTool === "text"
            ? "bg-blue-600 text-white shadow-sm"
            : "text-gray-400 hover:text-white hover:bg-[#22242D]"
            }`}
          title="Text (Click or Hold & Drag onto canvas)"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* F - Frame Tool */}
        <button
          draggable={true}
          onDragStart={(e) =>
            handleItemDragStart(e, {
              category: "node",
              type: "shape",
              shapeType: "rectangle",
              color: "#60A5FA",
            })
          }
          onClick={() => handleAddNode("shape", "rectangle", "#60A5FA")}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#22242D] transition-colors cursor-grab active:cursor-grabbing"
          title="Frame (Click or Hold & Drag onto canvas)"
        >
          <Maximize className="w-4 h-4" />
        </button>

        {/* Table Grid Tool (R x C arrangement of boxes) */}
        <div className="relative" ref={tableDialogRef}>
          <button
            type="button"
            onClick={() => setShowTableDialog(!showTableDialog)}
            className={`p-2 rounded-lg transition-colors cursor-pointer relative ${showTableDialog
              ? "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400"
              : "text-gray-400 hover:text-white hover:bg-[#22242D]"
              }`}
            title="Create Table Grid (Rows × Cols of boxes - Click or Drag onto canvas)"
          >
            <Table className="w-4 h-4 text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#121316]" />
          </button>

          {showTableDialog && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#151720] border border-[#2D3039] rounded-2xl shadow-2xl p-3.5 w-72 flex flex-col gap-3 z-50 animate-in fade-in-50 backdrop-blur-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-1.5 border-b border-[#252834]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Table className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Create Table Grid</div>
                    <div className="text-[10px] text-gray-400">R × C arrangement of boxes</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTableDialog(false)}
                  className="p-1 rounded-lg hover:bg-[#232530] text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Visual 6x6 Grid Hover Picker */}
              <div className="flex flex-col items-center gap-1.5 bg-[#0D0E13] p-2.5 rounded-xl border border-[#262935]">
                <div className="text-[11px] font-mono font-semibold text-emerald-400">
                  {hoveredGridCell
                    ? `${hoveredGridCell.r} Rows × ${hoveredGridCell.c} Columns`
                    : `${tableRows} Rows × ${tableCols} Columns (${tableRows * tableCols} Boxes)`}
                </div>
                <div
                  className="grid grid-cols-6 gap-1 p-1"
                  onMouseLeave={() => setHoveredGridCell(null)}
                >
                  {Array.from({ length: 6 }).map((_, rIdx) =>
                    Array.from({ length: 6 }).map((_, cIdx) => {
                      const r = rIdx + 1;
                      const c = cIdx + 1;
                      const isHovered =
                        hoveredGridCell && r <= hoveredGridCell.r && c <= hoveredGridCell.c;
                      const isSelected =
                        !hoveredGridCell && r <= tableRows && c <= tableCols;
                      const active = isHovered || isSelected;

                      return (
                        <div
                          key={`${r}-${c}`}
                          onMouseEnter={() => setHoveredGridCell({ r, c })}
                          onClick={() => {
                            setTableRows(r);
                            setTableCols(c);
                            handleCreateTableGrid(r, c, tableGap);
                          }}
                          className={`w-6 h-5 rounded transition-all cursor-pointer border ${active
                            ? "bg-emerald-500/30 border-emerald-400 scale-105"
                            : "bg-[#1E202B] border-[#2E3140] hover:border-gray-500"
                            }`}
                          title={`${r} × ${c} Table`}
                        />
                      );
                    })
                  )}
                </div>
                <div className="text-[9px] text-gray-500">
                  Hover to select, click to create instantly
                </div>
              </div>

              {/* Row & Col Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Rows
                  </label>
                  <div className="flex items-center bg-[#0D0E13] border border-[#2B2E3C] rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setTableRows(Math.max(1, tableRows - 1))}
                      className="px-2 py-1 text-gray-400 hover:text-white hover:bg-[#20222D] text-xs font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={tableRows}
                      onChange={(e) =>
                        setTableRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))
                      }
                      className="w-full text-center bg-transparent text-white text-xs py-1 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setTableRows(Math.min(20, tableRows + 1))}
                      className="px-2 py-1 text-gray-400 hover:text-white hover:bg-[#20222D] text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Columns
                  </label>
                  <div className="flex items-center bg-[#0D0E13] border border-[#2B2E3C] rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setTableCols(Math.max(1, tableCols - 1))}
                      className="px-2 py-1 text-gray-400 hover:text-white hover:bg-[#20222D] text-xs font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={tableCols}
                      onChange={(e) =>
                        setTableCols(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))
                      }
                      className="w-full text-center bg-transparent text-white text-xs py-1 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setTableCols(Math.min(20, tableCols + 1))}
                      className="px-2 py-1 text-gray-400 hover:text-white hover:bg-[#20222D] text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Spacing Option (Seamless vs Spaced) */}
              <div className="flex items-center justify-between text-[11px] px-0.5">
                <span className="text-gray-400 text-[10px]">Box Spacing:</span>
                <div className="flex items-center gap-1 bg-[#0D0E13] p-0.5 rounded-lg border border-[#282B38]">
                  {[
                    { label: "Seamless (0px)", val: 0 },
                    { label: "Spaced (6px)", val: 6 },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setTableGap(opt.val)}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${tableGap === opt.val
                        ? "bg-emerald-600 text-white font-bold"
                        : "text-gray-400 hover:text-white"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Insert / Drag Button */}
              <button
                type="button"
                draggable={true}
                onDragStart={(e) =>
                  handleItemDragStart(e, {
                    category: "table-grid",
                    rows: tableRows,
                    cols: tableCols,
                    gap: tableGap,
                  })
                }
                onClick={() => handleCreateTableGrid(tableRows, tableCols, tableGap)}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-grab active:cursor-grabbing shadow-lg shadow-emerald-950/40"
                title="Click to insert or drag onto canvas"
              >
                <Table className="w-4 h-4" />
                <span>
                  Create Table ({tableRows} × {tableCols} = {tableRows * tableCols} Boxes)
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Upload Media / Files / Graphs / SVGs / Diagrams from PC (AWS S3) */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-[#22242D] transition-colors cursor-pointer"
          title="Upload or Drag & Drop .graphml, .pdf, .json, .md, images or diagrams (Hosted on AWS S3)"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Tech, Product & Flow Icons Gallery Drawer */}
        <div className="relative" ref={iconGalleryRef}>
          <button
            type="button"
            onClick={() => setShowIconGallery(!showIconGallery)}
            className={`p-2 rounded-lg transition-colors cursor-pointer relative ${showIconGallery
              ? "bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400"
              : "text-gray-400 hover:text-white hover:bg-[#22242D]"
              }`}
            title="Tech, Product & Flow Icons Gallery (Click or Drag into draw board)"
          >
            <Boxes className="w-4 h-4 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#121316]" />
          </button>

          {showIconGallery && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#151720] border border-[#2D3039] rounded-2xl shadow-2xl p-3 w-[460px] max-h-[520px] flex flex-col gap-2.5 z-50 animate-in fade-in-50 backdrop-blur-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-1.5 border-b border-[#252834]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Tech & Product Icons</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">
                        42 Icons
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Click to add or hold & drag onto canvas
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIconGallery(false)}
                  className="p-1 rounded-lg hover:bg-[#232530] text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <input
                  type="text"
                  value={iconGallerySearch}
                  onChange={(e) => setIconGallerySearch(e.target.value)}
                  placeholder="Search icons (database, server, api, route, price)..."
                  className="w-full bg-[#0D0E13] border border-[#2B2E3C] focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
                {iconGallerySearch && (
                  <button
                    type="button"
                    onClick={() => setIconGallerySearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                {[
                  { id: "all", label: "All (42)", emoji: "✨" },
                  { id: "infra", label: "Infra (7)", emoji: "🌐" },
                  { id: "flow", label: "Flow (7)", emoji: "🔄" },
                  { id: "ideation", label: "Ideation (5)", emoji: "💡" },
                  { id: "logic", label: "Logic (7)", emoji: "🔢" },
                  { id: "metrics", label: "Metrics (9)", emoji: "📊" },
                  { id: "media", label: "Media (7)", emoji: "🎭" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setIconGalleryActiveTab(tab.id as any)}
                    className={`px-2 py-1 rounded-md shrink-0 font-medium transition-colors cursor-pointer flex items-center gap-1 ${iconGalleryActiveTab === tab.id
                      ? "bg-cyan-600 text-white font-bold"
                      : "bg-[#1E202B] text-gray-400 hover:text-gray-200 hover:bg-[#252837]"
                      }`}
                  >
                    <span>{tab.emoji}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Grouped Icons Content Area */}
              <div className="overflow-y-auto max-h-[320px] space-y-3 pr-1 scrollbar-thin">
                {ICON_GALLERY_GROUPS.filter(
                  (grp) => iconGalleryActiveTab === "all" || iconGalleryActiveTab === grp.type
                ).map((group) => {
                  const filteredItems = filterIconGalleryItems(
                    iconGallerySearch,
                    group.type
                  );
                  if (filteredItems.length === 0) return null;

                  return (
                    <div key={group.type} className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-200">
                          <span>{group.emoji}</span>
                          <span>{group.title}</span>
                          <span className="text-[9px] text-gray-500 font-mono">
                            ({filteredItems.length})
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-500 font-mono">type: "{group.type}"</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {filteredItems.map((item) => {
                          const IconComp = getLucideIcon(item.iconName);
                          return (
                            <div
                              key={item.id}
                              draggable={true}
                              onDragStart={(e) =>
                                handleItemDragStart(e, {
                                  category: "node",
                                  type: "icon",
                                  iconName: item.iconName,
                                  initialTitle: item.name,
                                  subtitle: item.subtitle,
                                  iconGroup: item.group,
                                  color: item.color,
                                })
                              }
                              onClick={() => {
                                handleAddNode(
                                  "icon",
                                  "rectangle",
                                  item.color,
                                  false,
                                  undefined,
                                  undefined,
                                  item.name,
                                  undefined,
                                  item.iconName,
                                  item.subtitle,
                                  item.group
                                );
                                setShowIconGallery(false);
                              }}
                              className="p-2 rounded-xl bg-[#1C1E27] hover:bg-[#242735] border border-[#2B2E3D] hover:border-cyan-500/40 transition-all flex items-start gap-2.5 cursor-grab active:cursor-grabbing group hover:shadow-lg"
                              title={`${item.name} - ${item.subtitle} (Click or Hold & Drag onto canvas)`}
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-xs"
                                style={{
                                  backgroundColor: `${item.color}20`,
                                  color: item.color,
                                  border: `1px solid ${item.color}40`,
                                }}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-gray-200 group-hover:text-white truncate">
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-gray-400 line-clamp-1 leading-tight mt-0.5">
                                  {item.subtitle}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Empty State */}
                {ICON_GALLERY_GROUPS.filter(
                  (grp) => iconGalleryActiveTab === "all" || iconGalleryActiveTab === grp.type
                ).every(
                  (grp) => filterIconGalleryItems(iconGallerySearch, grp.type).length === 0
                ) && (
                    <div className="py-8 text-center text-xs text-gray-500">
                      No matching icons found for &quot;{iconGallerySearch}&quot;.
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Templates & Functional Areas Drawer */}
        <div className="relative" ref={templateSelectorRef}>
          <button
            draggable={true}
            onDragStart={(e) =>
              handleItemDragStart(e, {
                category: "functional-area",
                areaType: "project-planner",
              })
            }
            onClick={() => setShowTemplateSelector(!showTemplateSelector)}
            className={`p-2 rounded-lg transition-colors cursor-grab active:cursor-grabbing ${showTemplateSelector
              ? "bg-purple-600 text-white shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-[#22242D]"
              }`}
            title="Templates & Functional Areas (Click or Hold & Drag onto canvas)"
          >
            <LayoutGrid className="w-4 h-4 text-purple-400" />
          </button>

          {showTemplateSelector && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#181920] border border-[#2D3039] rounded-xl shadow-2xl p-2.5 w-64 z-50 animate-in fade-in-50">
              <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Insert Functional Area</span>
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-1">
                <button
                  draggable={true}
                  onDragStart={(e) =>
                    handleItemDragStart(e, {
                      category: "functional-area",
                      areaType: "meeting-notes",
                    })
                  }
                  onClick={() => handleInsertFunctionalArea("meeting-notes")}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#23252E] hover:text-white text-left transition-colors cursor-grab active:cursor-grabbing"
                  title="Meeting Notes Area (Click or Hold & Drag onto canvas)"
                >
                  <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div>Meeting Notes Area</div>
                    <div className="text-[10px] text-gray-400 font-normal">Agendas & Action Items</div>
                  </div>
                </button>

                <button
                  draggable={true}
                  onDragStart={(e) =>
                    handleItemDragStart(e, {
                      category: "functional-area",
                      areaType: "notes",
                    })
                  }
                  onClick={() => handleInsertFunctionalArea("notes")}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#23252E] hover:text-white text-left transition-colors cursor-grab active:cursor-grabbing"
                  title="Notes & Brainstorm Area (Click or Hold & Drag onto canvas)"
                >
                  <StickyNote className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div>Notes & Brainstorm Area</div>
                    <div className="text-[10px] text-gray-400 font-normal">Color-Coded Stickies</div>
                  </div>
                </button>

                <button
                  draggable={true}
                  onDragStart={(e) =>
                    handleItemDragStart(e, {
                      category: "functional-area",
                      areaType: "diagram",
                    })
                  }
                  onClick={() => handleInsertFunctionalArea("diagram")}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#23252E] hover:text-white text-left transition-colors cursor-grab active:cursor-grabbing"
                  title="System Diagram Area (Click or Hold & Drag onto canvas)"
                >
                  <GitFork className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div>System Diagram Area</div>
                    <div className="text-[10px] text-gray-400 font-normal">Architecture & Flow</div>
                  </div>
                </button>

                <button
                  draggable={true}
                  onDragStart={(e) =>
                    handleItemDragStart(e, {
                      category: "functional-area",
                      areaType: "project-planner",
                    })
                  }
                  onClick={() => handleInsertFunctionalArea("project-planner")}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#23252E] hover:text-white text-left transition-colors cursor-grab active:cursor-grabbing"
                  title="Project Planner Area (Click or Hold & Drag onto canvas)"
                >
                  <Kanban className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div>Project Planner Area</div>
                    <div className="text-[10px] text-gray-400 font-normal">Phases & Milestones</div>
                  </div>
                </button>

                <button
                  draggable={true}
                  onDragStart={(e) =>
                    handleItemDragStart(e, {
                      category: "functional-area",
                      areaType: "org-chart",
                    })
                  }
                  onClick={() => handleInsertFunctionalArea("org-chart")}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#23252E] hover:text-white text-left transition-colors cursor-grab active:cursor-grabbing"
                  title="Organizational Chart Area (Click or Hold & Drag onto canvas)"
                >
                  <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div>Organizational Chart Area</div>
                    <div className="text-[10px] text-gray-400 font-normal">Hierarchy & Roles</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-[#262832]" />

        {/* Color / Fill Palette (Matching Screenshot 5) */}
        <div className="relative" ref={stylePaletteRef}>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setShowStylePalette(!showStylePalette)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#22242D] transition-colors cursor-pointer"
            title="Style Palette"
          >
            <Palette className="w-4 h-4" />
          </button>

          {showStylePalette && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#181920] border border-[#2D3039] rounded-xl shadow-2xl p-3 w-64 z-50 animate-in fade-in-50"
            >
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Color Palette
              </div>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      setActiveColor(c.value);
                      if (selectedNodeId || selectedNodeIds.length > 0) updateSelectedNode({ color: c.value });
                    }}
                    className="w-7 h-7 rounded-full border border-white/20 hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>

              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Fill Style
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(["solid", "tint", "none"] as const).map((ft) => (
                  <button
                    key={ft}
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      setActiveFillType(ft);
                      if (selectedNodeId || selectedNodeIds.length > 0) updateSelectedNode({ fillType: ft });
                    }}
                    className={`px-2 py-1 rounded text-xs capitalize cursor-pointer ${activeFillType === ft
                      ? "bg-blue-600 text-white font-semibold"
                      : "bg-[#22242D] text-gray-300 hover:text-white"
                      }`}
                  >
                    {ft}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-[#262832]" />

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={!canUndo}
          className={`p-2 rounded-lg transition-colors ${canUndo
            ? "text-gray-300 hover:text-white hover:bg-[#22242D] cursor-pointer"
            : "text-gray-600 cursor-not-allowed opacity-40"
            }`}
          title="Undo (Ctrl+Z)"
          aria-label="Undo action"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleRedo}
          disabled={!canRedo}
          className={`p-2 rounded-lg transition-colors ${canRedo
            ? "text-gray-300 hover:text-white hover:bg-[#22242D] cursor-pointer"
            : "text-gray-600 cursor-not-allowed opacity-40"
            }`}
          title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          aria-label="Redo action"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Toast Notification for S3 Deletion & Storage Cleanup */}
      {deleteToastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[10000000] bg-[#1A1C24] border border-[#2D303E] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          <Cloud className="w-4 h-4 text-emerald-400" />
          <span className="font-medium text-gray-200">{deleteToastMessage}</span>
        </div>
      )}

      {/* S3 File Object Deletion Dialog ("Delete from here" vs "Delete here + S3") */}
      {s3DeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50"
          onClick={() => {
            if (!isDeletingFromS3) setS3DeleteModal(null);
          }}
        >
          <div
            className="bg-[#15161C] border border-[#2A2C38] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 text-[#E1DFDD]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#232530] flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Delete Uploaded Object</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    This item is linked to an outside uploaded file stored in AWS S3
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setS3DeleteModal(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#20222B] transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: File details */}
            <div className="p-6 space-y-4">
              <div className="bg-[#1C1E26] border border-[#2B2E3C] rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Target File{s3DeleteModal.s3Nodes.length > 1 ? "s" : ""}</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Cloud className="w-3 h-3" />
                    <span>AWS S3 Storage</span>
                  </span>
                </div>
                {s3DeleteModal.s3Nodes.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs bg-[#14151B] p-2 rounded-lg border border-[#272935]"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate text-gray-200 font-medium">
                        {item.fileName || item.title || "Uploaded File"}
                      </span>
                    </div>
                    {item.fileSize ? (
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {(item.fileSize / 1024).toFixed(1)} KB
                      </span>
                    ) : null}
                  </div>
                ))}
                {s3DeleteModal.s3Nodes.length > 3 && (
                  <p className="text-[11px] text-gray-400 text-center">
                    + {s3DeleteModal.s3Nodes.length - 3} more files
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Choose how you want to delete this file object. Deleting from{" "}
                <strong className="text-white">here + S3</strong> permanently removes the file from your AWS S3 bucket to ensure unneeded objects do not accumulate in cloud storage.
              </p>

              {/* Action Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* 1. Delete from here only */}
                <button
                  type="button"
                  onClick={handleConfirmDeleteCanvasOnly}
                  disabled={isDeletingFromS3}
                  className="p-3.5 rounded-xl border border-[#2C2F3D] bg-[#1E202A] hover:bg-[#252835] text-left transition-all hover:border-gray-500 flex flex-col justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <X className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    <span className="text-xs font-semibold text-gray-200 group-hover:text-white">
                      Delete from here
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    Removes from canvas only. The file remains saved in S3.
                  </p>
                </button>

                {/* 2. Delete here + S3 */}
                <button
                  type="button"
                  onClick={handleConfirmDeleteCanvasAndS3}
                  disabled={isDeletingFromS3}
                  className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-600/20 hover:bg-rose-600/30 text-left transition-all hover:border-rose-500 flex flex-col justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Trash2 className="w-4 h-4 text-rose-400 group-hover:text-rose-300" />
                    <span className="text-xs font-semibold text-rose-300 group-hover:text-white">
                      Delete here + S3
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-300/80 leading-snug">
                    Removes from canvas AND permanently deletes from S3 storage.
                  </p>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-[#121318] border-t border-[#232530] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setS3DeleteModal(null)}
                disabled={isDeletingFromS3}
                className="px-3.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#20222B] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
