"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { IWhiteboardNode, IWhiteboardEdge } from "@/models/whiteboard";
import { WHITEBOARD_TEMPLATES, createFunctionalArea } from "@/lib/whiteboardTemplates";

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
  };
  currentUserName: string;
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

export default function WhiteboardCanvas({
  initialBoard,
  currentUserName,
}: WhiteboardCanvasProps) {
  const router = useRouter();

  // Canvas Metadata
  const [boardId] = useState(initialBoard._id);
  const [title, setTitle] = useState(initialBoard.title || "Organizational Chart");
  const [isFavorite, setIsFavorite] = useState(Boolean(initialBoard.isFavorite));
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // Canvas State: Nodes & Edges
  const [nodes, setNodes] = useState<IWhiteboardNode[]>(initialBoard.nodes || []);
  const [edges, setEdges] = useState<IWhiteboardEdge[]>(initialBoard.edges || []);
  const [history, setHistory] = useState<{ nodes: IWhiteboardNode[]; edges: IWhiteboardEdge[] }[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);

  // Pan & Zoom
  const [zoom, setZoom] = useState<number>(0.3); // Default 30% matching screenshot 3
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanMouse, setStartPanMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Tools & Selection
  const [activeTool, setActiveTool] = useState<
    "select" | "hand" | "task" | "draw" | "shape" | "arrow" | "sticky" | "text" | "frame"
  >("select");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

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

  // Shape switcher popover for selected shape node
  const [showShapeSwitcher, setShowShapeSwitcher] = useState(false);

  // Direct file upload ref for images, SVGs, graphs, diagrams
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Auto-save with instant localStorage cache and debounced server sync
  const triggerAutoSave = useCallback(
    (newNodes: IWhiteboardNode[], newEdges: IWhiteboardEdge[], newTitle?: string) => {
      setSaveStatus("unsaved");

      // 1. Instant local persistence cache (0ms latency, eliminates data loss on crash/reload)
      try {
        if (typeof window !== "undefined" && boardId) {
          localStorage.setItem(
            `taskflow_wb_cache_${boardId}`,
            JSON.stringify({
              title: newTitle || title,
              nodes: newNodes,
              edges: newEdges,
              savedAt: Date.now(),
            })
          );
        }
      } catch {
        // Handle storage quota exceeded gracefully
      }

      // 2. Debounced background sync to MongoDB (1.5s avoids network/thread congestion while moving items)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setSaveStatus("saving");
          await fetch(`/api/whiteboards/${boardId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: newTitle || title,
              nodes: newNodes,
              edges: newEdges,
              isFavorite,
            }),
          });
          setSaveStatus("saved");
        } catch (err) {
          console.error("Auto-save failed:", err);
          setSaveStatus("unsaved");
        }
      }, 1500);
    },
    [boardId, title, isFavorite]
  );

  // Hydrate from localStorage on initial load if local cache is newer or initial board was empty
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && boardId) {
        const cachedStr = localStorage.getItem(`taskflow_wb_cache_${boardId}`);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached && Array.isArray(cached.nodes) && cached.nodes.length > 0) {
            if (!initialBoard.nodes || initialBoard.nodes.length === 0) {
              setNodes(cached.nodes);
              if (Array.isArray(cached.edges)) setEdges(cached.edges);
              if (cached.title) setTitle(cached.title);
            }
          }
        }
      }
    } catch {}
  }, [boardId, initialBoard.nodes]);

  // Clean up RAF and timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Push history state
  const pushHistory = (newNodes: IWhiteboardNode[], newEdges: IWhiteboardEdge[]) => {
    setHistory((prev) => [...prev.slice(0, historyStep + 1), { nodes: newNodes, edges: newEdges }]);
    setHistoryStep((prev) => prev + 1);
    triggerAutoSave(newNodes, newEdges);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setNodes(history[prevStep].nodes);
      setEdges(history[prevStep].edges);
      setHistoryStep(prevStep);
      triggerAutoSave(history[prevStep].nodes, history[prevStep].edges);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setNodes(history[nextStep].nodes);
      setEdges(history[nextStep].edges);
      setHistoryStep(nextStep);
      triggerAutoSave(history[nextStep].nodes, history[nextStep].edges);
    }
  };

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
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {}
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {}
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

  // Direct File Upload & Drag-and-Drop Handler (Images, SVGs, Graphs, Diagrams)
  const processUploadedFiles = useCallback(
    (files: FileList | File[], clientX?: number, clientY?: number) => {
      const coords =
        clientX !== undefined && clientY !== undefined
          ? getCanvasCoords(clientX, clientY)
          : { x: Math.round(-pan.x / zoom + 400), y: Math.round(-pan.y / zoom + 300) };

      Array.from(files).forEach((file, index) => {
        if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".svg")) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (!result) return;

          const img = new window.Image();
          img.onload = () => {
            let w = img.width || 320;
            let h = img.height || 220;
            const maxDim = 400;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }

            const newId = `image-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`;
            const newNode: IWhiteboardNode = {
              id: newId,
              type: "image",
              x: coords.x + index * 40,
              y: coords.y + index * 40,
              width: Math.max(120, w),
              height: Math.max(80, h),
              title: file.name.replace(/\.[^/.]+$/, ""),
              imageUrl: result,
              zIndex: nodes.length + index + 2,
            };

            setNodes((prev) => {
              const updated = [...prev, newNode];
              pushHistory(updated, edges);
              return updated;
            });
            setSelectedNodeId(newId);
            setSelectedNodeIds([newId]);
          };

          img.onerror = () => {
            const newId = `image-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`;
            const newNode: IWhiteboardNode = {
              id: newId,
              type: "image",
              x: coords.x + index * 40,
              y: coords.y + index * 40,
              width: 320,
              height: 220,
              title: file.name.replace(/\.[^/.]+$/, ""),
              imageUrl: result,
              zIndex: nodes.length + index + 2,
            };

            setNodes((prev) => {
              const updated = [...prev, newNode];
              pushHistory(updated, edges);
              return updated;
            });
            setSelectedNodeId(newId);
            setSelectedNodeIds([newId]);
          };

          img.src = result;
        };
        reader.readAsDataURL(file);
      });
    },
    [pan, zoom, nodes, edges]
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
    const clonedNode: IWhiteboardNode = {
      ...sourceNode,
      id: newId,
      x: sourceNode.x + 35,
      y: sourceNode.y + 35,
      title: sourceNode.title ? `${sourceNode.title} (Copy)` : "Copy",
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

  // Node Double Click -> Enter inline editing & format bar
  const handleNodeDoubleClick = (node: IWhiteboardNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setEditingNodeId(node.id);
    setDoubleClickMenu(null);
  };

  // Add a node at specific canvas position
  const handleAddNode = (type: IWhiteboardNode["type"], shapeType: string = "rectangle", customColor?: string) => {
    const coords = doubleClickMenu
      ? { x: doubleClickMenu.canvasX, y: doubleClickMenu.canvasY }
      : { x: Math.round(-pan.x / zoom + 400), y: Math.round(-pan.y / zoom + 300) };

    const newId = `node-${Date.now()}`;
    let newNode: IWhiteboardNode;

    if (type === "sticky") {
      newNode = {
        id: newId,
        type: "sticky",
        x: coords.x - 90,
        y: coords.y - 80,
        width: 190,
        height: 170,
        title: "Note",
        body: "Type your notes or pro-tips here...",
        color: customColor || "#EC4899",
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
  };

  // Insert complete functional area (Meeting Notes, Notes, Diagram, Project Planner)
  const handleInsertFunctionalArea = (
    areaType: "meeting-notes" | "notes" | "diagram" | "project-planner" | "org-chart"
  ) => {
    const coords = doubleClickMenu
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
  };

  // Branching: Add a new branch node connected to edge parent alongside target
  const handleAddBranchFromEdge = (edgeId: string) => {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;
    const parentNode = nodes.find((n) => n.id === edge.from);
    const siblingNode = nodes.find((n) => n.id === edge.to);
    if (!parentNode) return;

    // Calculate position: right next to siblingNode, or below parent
    const newX = siblingNode ? siblingNode.x + siblingNode.width + 40 : parentNode.x + 120;
    const newY = siblingNode ? siblingNode.y : parentNode.y + parentNode.height + 70;

    const newBranchId = `node-branch-${Date.now()}`;
    const newBranchNode: IWhiteboardNode = {
      id: newBranchId,
      type: siblingNode ? siblingNode.type : "task",
      x: newX,
      y: newY,
      width: siblingNode ? siblingNode.width : 160,
      height: siblingNode ? siblingNode.height : 100,
      title: "New Team Member",
      subtitle: siblingNode?.subtitle || "Branch Position",
      color: siblingNode?.color || "#0078D4",
      fillType: "solid",
      zIndex: 2,
    };

    const newEdgeId = `edge-branch-${Date.now()}`;
    const newEdge: IWhiteboardEdge = {
      id: newEdgeId,
      from: parentNode.id,
      to: newBranchId,
      color: edge.color || "#60A5FA",
      style: edge.style || "solid",
    };

    const updatedNodes = [...nodes, newBranchNode];
    const updatedEdges = [...edges, newEdge];
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    pushHistory(updatedNodes, updatedEdges);

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
    const newBranchNode: IWhiteboardNode = {
      id: newBranchId,
      type: "task",
      x: newX,
      y: newY,
      width: 160,
      height: 96,
      title: "New Team Member",
      subtitle: "Position",
      color: "#0078D4",
      fillType: "solid",
      zIndex: 2,
    };

    const newEdgeId = `edge-branch-${Date.now()}`;
    const newEdge: IWhiteboardEdge = {
      id: newEdgeId,
      from: parentNode.id,
      to: newBranchId,
      color: "#60A5FA",
      style: "solid",
    };

    const updatedNodes = [...nodes, newBranchNode];
    const updatedEdges = [...edges, newEdge];
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    pushHistory(updatedNodes, updatedEdges);

    setSelectedNodeId(newBranchId);
    setSelectedNodeIds([newBranchId]);
  };

  // Node Dragging Start (Supports Ctrl+Click multi-select and Group Dragging)
  const handleNodeMouseDown = (node: IWhiteboardNode, e: React.MouseEvent) => {
    if (activeTool === "hand") return;
    if (editingNodeId === node.id) return; // Allow text selection if editing

    e.stopPropagation();
    setDoubleClickMenu(null);
    setEdgeSettingsPopover(null);

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

    const isCtrl = e.ctrlKey || e.metaKey;

    if (isCtrl) {
      // Toggle node in multi-selection group
      let nextSelected: string[];
      if (selectedNodeIds.includes(node.id)) {
        nextSelected = selectedNodeIds.filter((id) => id !== node.id);
      } else {
        nextSelected = [...selectedNodeIds, node.id];
      }
      setSelectedNodeIds(nextSelected);
      setSelectedNodeId(nextSelected[nextSelected.length - 1] || null);
      return;
    }

    // Normal click without Ctrl:
    // If clicking a node that is ALREADY part of the multi-selection group, keep the group to drag together!
    let activeGroup = selectedNodeIds;
    if (!selectedNodeIds.includes(node.id)) {
      activeGroup = [node.id];
      setSelectedNodeIds([node.id]);
    }
    setSelectedNodeId(node.id);
    setActiveColor(node.color || "#0078D4");
    setActiveFillType(node.fillType || "solid");

    const coords = getCanvasCoords(e.clientX, e.clientY);
    setIsDraggingGroup(true);
    setDraggingNodeId(node.id);
    setGroupDragStartCoords({ x: coords.x, y: coords.y });

    const initialPositions: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n) => {
      if (activeGroup.includes(n.id)) {
        initialPositions[n.id] = { x: n.x, y: n.y };
      }
    });
    setInitialGroupNodePositions(initialPositions);
  };

  // Canvas Mouse Down (Panning, Freehand Drawing, Deselecting, or Starting Rectangular Marquee Selection)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setDoubleClickMenu(null);
    setEdgeSettingsPopover(null);

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
              ? { ...n, x: newX, y: newY, width: newW, height: newH }
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

        setSelectedNodeIds(intersectingIds);
        setSelectedNodeId(intersectingIds[0] || null);
      }
      return;
    }

    // 2. Dragging Nodes as a Group (Throttled via requestAnimationFrame for silky 60fps/120fps hardware acceleration)
    if (isDraggingGroup && groupDragStartCoords) {
      const dx = coords.x - groupDragStartCoords.x;
      const dy = coords.y - groupDragStartCoords.y;

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        setNodes((prev) =>
          prev.map((n) => {
            if (initialGroupNodePositions[n.id]) {
              return {
                ...n,
                x: initialGroupNodePositions[n.id].x + dx,
                y: initialGroupNodePositions[n.id].y + dy,
              };
            }
            return n;
          })
        );
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
      pushHistory(nodes, edges);
    }

    if (isDraggingGroup) {
      setIsDraggingGroup(false);
      setDraggingNodeId(null);
      setGroupDragStartCoords(null);
      setInitialGroupNodePositions({});
      pushHistory(nodes, edges);
    }
  };

  // Delete Selected Node(s) - Supports Multi-Delete
  const handleDeleteSelected = () => {
    const idsToDelete =
      selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
    if (idsToDelete.length === 0) return;

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
  };

  // Keybindings (Delete, Backspace, Esc, Shortcuts)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (editingNodeId) return; // Typing in input

      if (e.key === "Delete" || e.key === "Backspace") {
        handleDeleteSelected();
      } else if (e.key === "Escape") {
        setSelectedNodeId(null);
        setSelectedNodeIds([]);
        setConnectingFromNodeId(null);
        setConnectingMousePos(null);
        setDoubleClickMenu(null);
        setShowShapePalette(false);
        setShowStylePalette(false);
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
      } else if (e.key === "n" || e.key === "N") {
        setActiveTool("sticky");
        handleAddNode("sticky");
      } else if (e.key === "t" || e.key === "T") {
        setActiveTool("text");
        handleAddNode("text");
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedNodeId, editingNodeId, nodes, edges, activeTool, connectingFromNodeId]);

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
      // Allow internal scrolling inside inputs / textareas when editing
      const target = e.target as HTMLElement | null;
      if (target && target.closest("textarea, input, [data-scrollable='true']")) {
        return;
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

  // Update selected node attributes (Supports updating entire temporary group at once)
  const updateSelectedNode = (patch: Partial<IWhiteboardNode>) => {
    const targetIds =
      selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
    if (targetIds.length === 0) return;
    const updated = nodes.map((n) => (targetIds.includes(n.id) ? { ...n, ...patch } : n));
    setNodes(updated);
    pushHistory(updated, edges);
  };

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
    const w = node.width;
    const h = node.height;
    const fill =
      node.fillType === "solid"
        ? node.color || "#0078D4"
        : node.fillType === "tint"
        ? `${node.color || "#0078D4"}33`
        : "transparent";
    const stroke = node.color || "#0078D4";
    const strokeWidth = 2;

    switch (node.shapeType) {
      case "circle":
        return (
          <svg width="100%" height="100%" className="overflow-visible pointer-events-none drop-shadow-md">
            <ellipse
              cx={w / 2}
              cy={h / 2}
              rx={Math.max(2, w / 2 - strokeWidth)}
              ry={Math.max(2, h / 2 - strokeWidth)}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );
      case "diamond":
        return (
          <svg width="100%" height="100%" className="overflow-visible pointer-events-none drop-shadow-md">
            <polygon
              points={`${w / 2},${strokeWidth} ${w - strokeWidth},${h / 2} ${w / 2},${h - strokeWidth} ${strokeWidth},${h / 2}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          </svg>
        );
      case "triangle":
        return (
          <svg width="100%" height="100%" className="overflow-visible pointer-events-none drop-shadow-md">
            <polygon
              points={`${w / 2},${strokeWidth} ${w - strokeWidth},${h - strokeWidth} ${strokeWidth},${h - strokeWidth}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          </svg>
        );
      case "star": {
        const cx = w / 2,
          cy = h / 2,
          outerR = Math.min(w, h) / 2 - strokeWidth,
          innerR = outerR * 0.42;
        const pts: string[] = [];
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? outerR : innerR;
          pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        }
        return (
          <svg width="100%" height="100%" className="overflow-visible pointer-events-none drop-shadow-md">
            <polygon
              points={pts.join(" ")}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          </svg>
        );
      }
      case "hexagon": {
        const cx = w / 2,
          cy = h / 2,
          rx = w / 2 - strokeWidth,
          ry = h / 2 - strokeWidth;
        const pts: string[] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          pts.push(`${cx + rx * Math.cos(angle)},${cy + ry * Math.sin(angle)}`);
        }
        return (
          <svg width="100%" height="100%" className="overflow-visible pointer-events-none drop-shadow-md">
            <polygon
              points={pts.join(" ")}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
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
    color: string = "#60A5FA"
  ) => {
    const angle = Math.atan2(tipY - fromY, tipX - fromX);
    const wingLength = 11;
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

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal dominance: connect closest horizontal edges directly
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
        const midX = startX + (endX - startX) / 2;
        pathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
        tipFromX = midX;
        tipFromY = endY;
      } else {
        // Vertical dominance: connect closest vertical edges directly
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
        const midY = startY + (endY - startY) / 2;
        pathData = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
        tipFromX = endX;
        tipFromY = midY;
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
            renderArrowhead(startX, startY, midPointX, midPointY, edgeColor)}

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

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processUploadedFiles(e.dataTransfer.files, e.clientX, e.clientY);
        }
      }}
      className={`${
        isFullscreen
          ? "fixed inset-0 z-[999999] w-screen h-screen m-0 p-0"
          : "relative w-full h-[calc(100vh-64px)]"
      } overflow-hidden bg-[#0D0E11] text-[#E1DFDD] select-none`}
    >
      {/* Hidden File Input for Image, SVG, Graph, Diagram upload from PC */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.svg"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processUploadedFiles(e.target.files);
          }
          e.target.value = "";
        }}
      />

      {/* 1. TOP HEADER BAR (Breadcrumb, Title, Favorite, Author Avatar, Share, Fullscreen) */}
      <header className="absolute top-0 left-0 right-0 h-13 px-4 bg-[#121316]/90 backdrop-blur-md border-b border-[#22242B] flex items-center justify-between z-30 shadow-md">
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
          <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
            {saveStatus === "saving" ? (
              <span className="text-amber-400">Saving...</span>
            ) : saveStatus === "saved" ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Saved
              </span>
            ) : (
              <span className="text-gray-400">Unsaved edits</span>
            )}
          </span>
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
            className={`p-1.5 rounded-md hover:bg-[#202228] transition-colors ${
              isFullscreen ? "text-cyan-400 bg-[#202228]" : "text-gray-400 hover:text-white"
            }`}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Full Screen (Zero Spaces)"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. FLOATING FORMAT BAR (Shown above selected node - Differentiated by Object Type) */}
      {selectedNode && (
        <div
          className="absolute z-40 bg-[#1A1C22] border border-[#2D3039] rounded-lg shadow-2xl px-2.5 py-1.5 flex items-center gap-2 text-xs text-gray-300 animate-in fade-in-50"
          style={{
            left: Math.max(20, Math.min(window.innerWidth - 480, selectedNode.x * zoom + pan.x)),
            top: Math.max(60, selectedNode.y * zoom + pan.y - 48),
          }}
        >
          <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
            {selectedNode.type === "shape" ? selectedNode.shapeType || "shape" : selectedNode.type}
          </span>

          <div className="h-4 w-px bg-[#30333D]" />

          {/* A. SHAPE CONTROLS */}
          {selectedNode.type === "shape" && (
            <>
              {/* Shape Type Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowShapeSwitcher(!showShapeSwitcher)}
                  className="p-1 rounded hover:bg-[#282A33] text-gray-300 hover:text-white flex items-center gap-1"
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
                  <div className="absolute top-full left-0 mt-2 p-1.5 bg-[#1A1C22] border border-[#2E313B] rounded-lg shadow-2xl grid grid-cols-4 gap-1 z-50 w-36">
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
                          onClick={() => {
                            updateSelectedNode({ shapeType: st.type as any });
                            setShowShapeSwitcher(false);
                          }}
                          className={`p-1.5 rounded hover:bg-[#282A33] flex items-center justify-center ${
                            selectedNode.shapeType === st.type ? "bg-blue-600 text-white" : "text-gray-300"
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

              {/* Bold & Aa */}
              <button
                onClick={() =>
                  updateSelectedNode({
                    fontWeight: selectedNode.fontWeight === "bold" ? "normal" : "bold",
                  })
                }
                className={`p-1 rounded hover:bg-[#282A33] ${
                  selectedNode.fontWeight === "bold" ? "text-blue-400 bg-[#282A33]" : ""
                }`}
                title="Bold text"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() =>
                  updateSelectedNode({
                    fontSize: selectedNode.fontSize === "Large" ? "Medium" : "Large",
                  })
                }
                className="px-1.5 py-0.5 rounded hover:bg-[#282A33] text-[11px] font-semibold"
                title="Font Size"
              >
                Aa
              </button>

              {/* Fill Type */}
              <div className="flex items-center gap-0.5 bg-[#121316] p-0.5 rounded border border-[#282B33]">
                {(["solid", "tint", "none"] as const).map((ft) => (
                  <button
                    key={ft}
                    onClick={() => {
                      setActiveFillType(ft);
                      updateSelectedNode({ fillType: ft });
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] capitalize ${
                      selectedNode.fillType === ft
                        ? "bg-blue-600 text-white font-bold"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {ft}
                  </button>
                ))}
              </div>

              {/* Color Swatch */}
              <div className="relative">
                <button
                  onClick={() => setShowStylePalette(!showStylePalette)}
                  className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                  style={{ backgroundColor: selectedNode.color || "#0078D4" }}
                  title="Change Color"
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

              <button
                onClick={() => handleAddBranchFromNode(selectedNode.id)}
                className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Add Branch Node (+)"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>+ Branch</span>
              </button>
            </>
          )}

          {/* B. TASK CONTROLS */}
          {selectedNode.type === "task" && (
            <>
              {/* Status pills */}
              <div className="flex items-center gap-0.5 bg-[#121316] p-0.5 rounded border border-[#282B33]">
                {(["Active", "In Progress", "Completed", "Backlog"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => updateSelectedNode({ status: st, subtitle: st })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                      (selectedNode.status || "Active").toLowerCase() === st.toLowerCase()
                        ? "bg-blue-600 text-white font-bold"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Color Swatch */}
              <div className="relative">
                <button
                  onClick={() => setShowStylePalette(!showStylePalette)}
                  className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                  style={{ backgroundColor: selectedNode.color || "#0078D4" }}
                  title="Change Color"
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

              <button
                onClick={() => handleAddBranchFromNode(selectedNode.id)}
                className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Add Branch Node (+)"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>+ Branch</span>
              </button>
            </>
          )}

          {/* C. STICKY NOTE CONTROLS */}
          {selectedNode.type === "sticky" && (
            <>
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
                    className={`w-4 h-4 rounded-full transition-transform ${
                      selectedNode.color === c.color ? "ring-2 ring-white scale-110" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>

              <div className="h-4 w-px bg-[#30333D]" />

              <button
                onClick={() => updateSelectedNode({ textAlign: "left" })}
                className={`p-1 rounded hover:bg-[#282A33] ${
                  selectedNode.textAlign === "left" || !selectedNode.textAlign ? "text-blue-400 bg-[#282A33]" : ""
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateSelectedNode({ textAlign: "center" })}
                className={`p-1 rounded hover:bg-[#282A33] ${
                  selectedNode.textAlign === "center" ? "text-blue-400 bg-[#282A33]" : ""
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateSelectedNode({ textAlign: "right" })}
                className={`p-1 rounded hover:bg-[#282A33] ${
                  selectedNode.textAlign === "right" ? "text-blue-400 bg-[#282A33]" : ""
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* D. TEXT BLOCK CONTROLS */}
          {selectedNode.type === "text" && (
            <>
              {/* Font Size */}
              <div className="flex items-center gap-0.5 bg-[#121316] p-0.5 rounded border border-[#282B33]">
                {(["Small", "Medium", "Large", "Huge"] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => updateSelectedNode({ fontSize: sz })}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      (selectedNode.fontSize || "Medium") === sz
                        ? "bg-blue-600 text-white font-bold"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {sz[0]}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  updateSelectedNode({
                    fontWeight: selectedNode.fontWeight === "bold" ? "normal" : "bold",
                  })
                }
                className={`p-1 rounded hover:bg-[#282A33] ${
                  selectedNode.fontWeight === "bold" ? "text-blue-400 bg-[#282A33]" : ""
                }`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => updateSelectedNode({ textAlign: "left" })}
                className={`p-1 rounded hover:bg-[#282A33] ${
                  selectedNode.textAlign === "left" || !selectedNode.textAlign ? "text-blue-400 bg-[#282A33]" : ""
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateSelectedNode({ textAlign: "center" })}
                className={`p-1 rounded hover:bg-[#282A33] ${
                  selectedNode.textAlign === "center" ? "text-blue-400 bg-[#282A33]" : ""
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateSelectedNode({ textAlign: "right" })}
                className={`p-1 rounded hover:bg-[#282A33] ${
                  selectedNode.textAlign === "right" ? "text-blue-400 bg-[#282A33]" : ""
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>

              {/* Color Swatch */}
              <div className="relative">
                <button
                  onClick={() => setShowStylePalette(!showStylePalette)}
                  className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                  style={{ backgroundColor: selectedNode.color || "#FFFFFF" }}
                  title="Change Text Color"
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

          {/* E. IMAGE CONTROLS */}
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

          {/* F. DRAWING CONTROLS */}
          {selectedNode.type === "drawing" && (
            <>
              <div className="flex items-center gap-0.5 bg-[#121316] p-0.5 rounded border border-[#282B33]">
                {[2, 4, 8].map((sw) => (
                  <button
                    key={sw}
                    onClick={() => updateSelectedNode({ strokeWidth: sw })}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      (selectedNode.strokeWidth || 3) === sw
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

          <div className="h-4 w-px bg-[#30333D]" />

          {/* Universal Duplicate Button */}
          <button
            onClick={() => handleDuplicateNode(selectedNode.id)}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#282A33] rounded transition-colors cursor-pointer"
            title="Duplicate node (Ctrl+D)"
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

      {/* 2b. TEMPORARY GROUP FLOATING TOOLBAR */}
      {selectedNodeIds.length > 1 && (
        <div
          className="absolute z-40 bg-[#1A1C22]/95 backdrop-blur-md border border-cyan-500/50 rounded-lg shadow-2xl px-3 py-1.5 flex items-center gap-2.5 text-xs text-gray-200 animate-in fade-in-50"
          style={{
            left: 20,
            top: 60,
          }}
        >
          <div className="flex items-center gap-1.5 font-bold text-cyan-400">
            <Layers className="w-4 h-4" />
            <span>Temporary Group ({selectedNodeIds.length} items)</span>
          </div>
          <div className="h-4 w-px bg-[#30333D]" />
          <span className="text-[11px] text-gray-400">Drag any element to move entire group</span>
          <div className="h-4 w-px bg-[#30333D]" />
          <button
            onClick={handleDeleteSelected}
            className="px-2 py-1 bg-red-950/60 hover:bg-red-900 text-red-300 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Delete all nodes in group"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Group</span>
          </button>
          <button
            onClick={() => {
              setSelectedNodeIds([]);
              setSelectedNodeId(null);
            }}
            className="px-2 py-1 hover:bg-[#282A33] text-gray-400 hover:text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
            title="Dissolve group (or click outside)"
          >
            <span>Dissolve Group</span>
          </button>
        </div>
      )}

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
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                      edge.style !== "dashed" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
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
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                      edge.style === "dashed" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
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
                      className={`w-5 h-5 rounded-full transition-transform hover:scale-110 border cursor-pointer ${
                        edge.color === c ? "ring-2 ring-white scale-110" : "border-white/20"
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
                    className={`py-1.5 px-2 rounded flex items-center justify-center gap-1 font-mono text-xs font-bold transition-all cursor-pointer ${
                      edge.arrowDirection === "backward"
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
                    className={`py-1.5 px-2 rounded flex items-center justify-center gap-1 font-mono text-xs font-bold transition-all cursor-pointer ${
                      edge.arrowDirection === "forward" || !edge.arrowDirection
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
                    className={`py-1.5 px-2 rounded flex items-center justify-center gap-1 font-mono text-xs font-bold transition-all cursor-pointer ${
                      edge.arrowDirection === "bidirectional"
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

          {/* 4 Functional Areas requested by user */}
          <div className="space-y-1 mb-2">
            <button
              onClick={() => handleInsertFunctionalArea("meeting-notes")}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#22242D] hover:text-white transition-colors"
            >
              <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="text-left">
                <div>Meeting Notes Area</div>
                <div className="text-[10px] text-gray-400 font-normal">Agenda, decisions & actions</div>
              </div>
            </button>

            <button
              onClick={() => handleInsertFunctionalArea("notes")}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#22242D] hover:text-white transition-colors"
            >
              <StickyNote className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-left">
                <div>Notes & Brainstorm Area</div>
                <div className="text-[10px] text-gray-400 font-normal">4-quadrant color stickies</div>
              </div>
            </button>

            <button
              onClick={() => handleInsertFunctionalArea("diagram")}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#22242D] hover:text-white transition-colors"
            >
              <GitFork className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-left">
                <div>System Diagram Area</div>
                <div className="text-[10px] text-gray-400 font-normal">Connected service architecture</div>
              </div>
            </button>

            <button
              onClick={() => handleInsertFunctionalArea("project-planner")}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#22242D] hover:text-white transition-colors"
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
              onClick={() => handleAddNode("sticky", "rectangle", "#EC4899")}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-gray-200 hover:bg-[#22242D] hover:text-white"
            >
              <StickyNote className="w-3.5 h-3.5 text-pink-400" />
              <span>Sticky</span>
            </button>
            <button
              onClick={() => handleAddNode("task", "rectangle", "#0078D4")}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-gray-200 hover:bg-[#22242D] hover:text-white"
            >
              <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Org Card</span>
            </button>
            <button
              onClick={() => handleAddNode("shape", "rectangle", "#06B6D4")}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-gray-200 hover:bg-[#22242D] hover:text-white"
            >
              <Square className="w-3.5 h-3.5 text-cyan-400" />
              <span>Shape</span>
            </button>
            <button
              onClick={() => handleAddNode("text")}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-gray-200 hover:bg-[#22242D] hover:text-white"
            >
              <Type className="w-3.5 h-3.5 text-gray-400" />
              <span>Text</span>
            </button>
            <button
              onClick={() => {
                fileInputRef.current?.click();
                setDoubleClickMenu(null);
              }}
              className="col-span-2 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-emerald-300 hover:bg-[#22242D] hover:text-white border border-emerald-500/30 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload Image / Diagram</span>
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
        className={`w-full h-full relative overflow-hidden ${
          activeTool === "hand" || isPanning
            ? "cursor-grab active:cursor-grabbing"
            : activeTool === "draw" || activeTool === "arrow"
            ? "cursor-crosshair"
            : "cursor-default"
        }`}
        style={{
          backgroundColor: "#0D0E11",
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
                fill="#242630"
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
          {/* SVG Connector Arrows & Live Interactions */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {renderEdges()}

            {/* Live dynamic arrow preview while connecting two nodes */}
            {activeTool === "arrow" && connectingFromNodeId && connectingMousePos && (() => {
              const fromNode = nodes.find((n) => n.id === connectingFromNodeId);
              if (!fromNode) return null;
              const startX = fromNode.x + fromNode.width / 2;
              const startY = fromNode.y + fromNode.height / 2;
              const targetX = connectingMousePos.x;
              const targetY = connectingMousePos.y;

              return (
                <g className="pointer-events-none">
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
                </g>
              );
            })()}

            {/* Live active stroke while pen drawing */}
            {isDrawingPen && currentPenPoints.length > 0 && (
              <path
                d={generateSvgPath(currentPenPoints)}
                fill="none"
                stroke={penColor}
                strokeWidth={penStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none shadow-sm"
              />
            )}
          </svg>

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

          {/* Temporary Group Bounding Box Frame (Drag as group) */}
          {selectedNodeIds.length > 1 && (() => {
            const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
            if (selectedNodes.length === 0) return null;

            const minX = Math.min(...selectedNodes.map((n) => n.x)) - 12;
            const minY = Math.min(...selectedNodes.map((n) => n.y)) - 12;
            const maxX = Math.max(...selectedNodes.map((n) => n.x + n.width)) + 12;
            const maxY = Math.max(...selectedNodes.map((n) => n.y + n.height)) + 12;

            return (
              <div
                style={{
                  position: "absolute",
                  left: `${minX}px`,
                  top: `${minY}px`,
                  width: `${maxX - minX}px`,
                  height: `${maxY - minY}px`,
                }}
                className="border-2 border-dashed border-cyan-400 bg-cyan-400/5 rounded-xl pointer-events-none z-20 shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all"
              >
                <div className="absolute -top-7 left-2 px-2.5 py-0.5 rounded-full bg-cyan-500 text-black text-[10px] font-bold flex items-center gap-1.5 shadow-md">
                  <Layers className="w-3 h-3" />
                  <span>Temporary Group ({selectedNodeIds.length} items) · Drag to move as group</span>
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
                  className={`group/drawing cursor-pointer transition-all ${
                    isConnectingSource
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
                  className={`flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isSelected ? "ring-2 ring-blue-500 rounded-full" : ""
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
                  className={`p-3.5 rounded-md border-2 border-white/80 bg-[#0D0E11]/80 backdrop-blur-sm cursor-pointer shadow-xl relative ${
                    isSelected ? "ring-2 ring-blue-500" : ""
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

            // 3. STICKY NOTE (Pink Pro-tip from screenshots)
            if (node.type === "sticky") {
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
                    backgroundColor: `${node.color || "#EC4899"}26`,
                    borderColor: node.color || "#EC4899",
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer shadow-lg flex flex-col justify-between transition-all relative ${
                    isSelected ? "ring-2 ring-pink-400" : ""
                  }`}
                >
                  {isEditing ? (
                    <textarea
                      autoFocus
                      defaultValue={node.body}
                      onBlur={(e) => {
                        updateSelectedNode({ body: e.target.value });
                        setEditingNodeId(null);
                      }}
                      className="w-full h-full bg-transparent text-xs text-pink-200 focus:outline-none resize-none leading-relaxed"
                      style={{ textAlign: node.textAlign || "left" }}
                    />
                  ) : (
                    <p
                      className="text-[11px] text-pink-200 leading-relaxed font-sans"
                      style={{ textAlign: node.textAlign || "left" }}
                    >
                      {node.body || "Click to add text..."}
                    </p>
                  )}
                  {isSelected && renderResizeHandles(node)}
                </div>
              );
            }

            // 4. TASK CARD / ORG CHART POSITION NODE (Gold Task Header + Blue Position Box)
            if (node.type === "task") {
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
                  className={`rounded-md cursor-pointer shadow-2xl transition-all relative group/node ${
                    isSelected ? "ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]" : ""
                  }`}
                >
                  <div className="w-full h-full flex flex-col rounded-md overflow-hidden">
                    {/* Top Task Banner (Gold bordered) */}
                    <div className="h-14 p-2 bg-[#1A1813] border-2 border-amber-500/80 rounded-t-md flex items-center justify-center text-center">
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={node.title}
                          onBlur={(e) => updateSelectedNode({ title: e.target.value })}
                          className="bg-transparent text-[10px] text-amber-200 text-center w-full focus:outline-none font-medium"
                        />
                      ) : (
                        <span className="text-[10px] text-amber-200/90 font-medium leading-tight line-clamp-2">
                          {node.title || "Add a task here to represent this team member!"}
                        </span>
                      )}
                    </div>

                    {/* Bottom Position Box (Blue bordered) */}
                    <div className="flex-1 min-h-[36px] bg-[#0F1E36] border-2 border-t-0 border-blue-500/80 rounded-b-md flex items-center justify-center text-center">
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={node.subtitle}
                          onBlur={(e) => {
                            updateSelectedNode({ subtitle: e.target.value });
                            setEditingNodeId(null);
                          }}
                          className="bg-transparent text-xs text-blue-200 text-center w-full focus:outline-none font-bold"
                        />
                      ) : (
                        <span className="text-xs font-bold text-blue-200">
                          {node.subtitle || "Position"}
                        </span>
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
                    className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#121316] border border-blue-400 text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:scale-125 hover:bg-blue-600 transition-all z-20 ${
                      isSelected ? "opacity-100" : "opacity-0 group-hover/node:opacity-100"
                    }`}
                    title="Add connected branch node below (+)"
                  >
                    +
                  </button>

                  {isSelected && renderResizeHandles(node)}
                </div>
              );
            }

            // 5. IMAGE / MEDIA / SVG / DIAGRAM NODE (Direct Upload or Drag-and-Drop)
            if (node.type === "image") {
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
                  className={`group/img cursor-pointer rounded-lg overflow-hidden transition-all relative ${
                    isSelected
                      ? "ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                      : "shadow-xl border border-[#2D3039]"
                  }`}
                >
                  {node.imageUrl ? (
                    <img
                      src={node.imageUrl}
                      alt={node.title || "Whiteboard Media"}
                      className="w-full h-full object-contain pointer-events-none select-none bg-black/30"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#181A22] text-gray-400 p-4">
                      <ImageIcon className="w-8 h-8 mb-2 text-gray-500" />
                      <span className="text-xs font-medium">Click to upload media</span>
                    </div>
                  )}

                  {node.title && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs py-0.5 px-2 text-[10px] text-gray-300 truncate pointer-events-none text-center">
                      {node.title}
                    </div>
                  )}

                  {isSelected && renderResizeHandles(node)}
                </div>
              );
            }

            // 6. TEXT BLOCK NODE
            if (node.type === "text") {
              const fontSizePx =
                node.fontSize === "Huge"
                  ? "28px"
                  : node.fontSize === "Large"
                  ? "20px"
                  : node.fontSize === "Small"
                  ? "12px"
                  : "15px";

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
                  className={`cursor-pointer p-2 flex items-center transition-all relative ${
                    isSelected ? "ring-2 ring-blue-400 rounded-md bg-blue-500/10" : "hover:bg-white/5 rounded-md"
                  }`}
                >
                  {isEditing ? (
                    <textarea
                      autoFocus
                      defaultValue={node.title}
                      onBlur={(e) => {
                        updateSelectedNode({ title: e.target.value });
                        setEditingNodeId(null);
                      }}
                      className="w-full h-full bg-transparent text-white focus:outline-none resize-none"
                      style={{
                        fontSize: fontSizePx,
                        fontWeight: node.fontWeight || "normal",
                        textAlign: node.textAlign || "left",
                        color: node.color || "#FFFFFF",
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
                          color: node.color || "#FFFFFF",
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

            // 7. GEOMETRIC SHAPES (Square, Diamond, Circle, Triangle, Star, Hexagon, etc.)
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
                className={`relative cursor-pointer transition-all ${
                  isSelected ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0D0E11]" : ""
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
                      onBlur={(e) => {
                        updateSelectedNode({ title: e.target.value });
                        setEditingNodeId(null);
                      }}
                      className="bg-transparent text-xs text-white text-center w-full focus:outline-none font-bold pointer-events-auto"
                    />
                  ) : (
                    <span
                      className="text-xs font-bold text-white select-none leading-snug break-words px-1"
                      style={{
                        fontWeight: node.fontWeight || "bold",
                        fontSize: node.fontSize === "Large" ? "14px" : "12px",
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
            setZoom(0.3);
            setPan({ x: 50, y: 50 });
          }}
          className="p-1 hover:bg-[#23252E] rounded text-gray-400 hover:text-white"
          title="Fit to screen"
        >
          ^
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
              className={`px-2.5 py-1 rounded flex items-center gap-1 font-mono text-xs font-bold transition-all cursor-pointer ${
                arrowConnectType === "backward"
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
              className={`px-2.5 py-1 rounded flex items-center gap-1 font-mono text-xs font-bold transition-all cursor-pointer ${
                arrowConnectType === "forward"
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
              className={`px-2.5 py-1 rounded flex items-center gap-1 font-mono text-xs font-bold transition-all cursor-pointer ${
                arrowConnectType === "bidirectional"
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
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                  penColor === c.color ? "ring-2 ring-white scale-125" : "border border-white/20 hover:scale-110"
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
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                  penStrokeWidth === sw.width
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
          className={`p-2 rounded-lg transition-colors ${
            activeTool === "select"
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
          className={`p-2 rounded-lg transition-colors ${
            activeTool === "hand"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-[#22242D]"
          }`}
          title="Pan Hand (H)"
        >
          <Hand className="w-4 h-4" />
        </button>

        {/* Task Card Node Tool */}
        <button
          onClick={() => {
            setActiveTool("task");
            handleAddNode("task");
          }}
          className={`p-2 rounded-lg transition-colors ${
            activeTool === "task"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-[#22242D]"
          }`}
          title="Add Org Task Card"
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        {/* D - Pen / Draw Tool */}
        <button
          onClick={() => setActiveTool(activeTool === "draw" ? "select" : "draw")}
          className={`p-2 rounded-lg transition-colors ${
            activeTool === "draw"
              ? "bg-pink-600 text-white shadow-sm ring-1 ring-pink-400"
              : "text-gray-400 hover:text-white hover:bg-[#22242D]"
          }`}
          title="Pen Draw Tool (P or D)"
        >
          <PenTool className="w-4 h-4" />
        </button>

        {/* R - Shapes Tool with Palette Popover (Matching Screenshot 4) */}
        <div className="relative">
          <button
            onClick={() => setShowShapePalette(!showShapePalette)}
            className={`p-2 rounded-lg transition-colors ${
              showShapePalette || activeTool === "shape"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-[#22242D]"
            }`}
            title="Shapes (R)"
          >
            <Square className="w-4 h-4" />
          </button>

          {/* Screenshot 4: Shape Grid Palette Popover */}
          {showShapePalette && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#181920] border border-[#2D3039] rounded-xl shadow-2xl p-3 grid grid-cols-3 gap-2 w-56 z-50 animate-in fade-in-50">
              <button
                onClick={() => handleAddNode("shape", "rectangle")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-pointer"
                title="Rectangle"
              >
                <Square className="w-4 h-4" />
                <span className="text-[9px]">Box</span>
              </button>
              <button
                onClick={() => handleAddNode("shape", "rounded")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-pointer"
                title="Rounded"
              >
                <Square className="w-4 h-4 rounded-md" />
                <span className="text-[9px]">Rounded</span>
              </button>
              <button
                onClick={() => handleAddNode("shape", "circle")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-pointer"
                title="Circle"
              >
                <Circle className="w-4 h-4" />
                <span className="text-[9px]">Circle</span>
              </button>
              <button
                onClick={() => handleAddNode("shape", "diamond")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-pointer"
                title="Diamond"
              >
                <Diamond className="w-4 h-4" />
                <span className="text-[9px]">Diamond</span>
              </button>
              <button
                onClick={() => handleAddNode("shape", "triangle")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-pointer"
                title="Triangle"
              >
                <Triangle className="w-4 h-4" />
                <span className="text-[9px]">Triangle</span>
              </button>
              <button
                onClick={() => handleAddNode("shape", "hexagon")}
                className="p-2 hover:bg-[#242630] rounded flex flex-col items-center justify-center text-gray-300 hover:text-white gap-1 cursor-pointer"
                title="Hexagon"
              >
                <Hexagon className="w-4 h-4" />
                <span className="text-[9px]">Hexagon</span>
              </button>
            </div>
          )}
        </div>

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
          className={`p-2 rounded-lg transition-colors ${
            activeTool === "arrow"
              ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400"
              : "text-gray-400 hover:text-white hover:bg-[#22242D]"
          }`}
          title="Arrow Connector <- -> <-> (A)"
        >
          <MoveRight className="w-4 h-4" />
        </button>

        {/* N - Sticky Note Tool */}
        <button
          onClick={() => {
            setActiveTool("sticky");
            handleAddNode("sticky");
          }}
          className={`p-2 rounded-lg transition-colors ${
            activeTool === "sticky"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-[#22242D]"
          }`}
          title="Sticky Note (N)"
        >
          <StickyNote className="w-4 h-4" />
        </button>

        {/* T - Text Tool */}
        <button
          onClick={() => {
            setActiveTool("text");
            handleAddNode("text");
          }}
          className={`p-2 rounded-lg transition-colors ${
            activeTool === "text"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-[#22242D]"
          }`}
          title="Text (T)"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* F - Frame Tool */}
        <button
          onClick={() => handleAddNode("shape", "rectangle", "#60A5FA")}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#22242D] transition-colors"
          title="Frame (F)"
        >
          <Maximize className="w-4 h-4" />
        </button>

        {/* Upload Media / Images / Graphs / SVGs / Diagrams from PC */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-[#22242D] transition-colors cursor-pointer"
          title="Upload Image, SVG, Graph or Diagram from PC"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Templates & Functional Areas Drawer */}
        <div className="relative">
          <button
            onClick={() => setShowTemplateSelector(!showTemplateSelector)}
            className={`p-2 rounded-lg transition-colors ${
              showTemplateSelector
                ? "bg-purple-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-[#22242D]"
            }`}
            title="Templates & Functional Areas"
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
                  onClick={() => handleInsertFunctionalArea("meeting-notes")}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#23252E] hover:text-white text-left transition-colors"
                >
                  <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div>Meeting Notes Area</div>
                    <div className="text-[10px] text-gray-400 font-normal">Agendas & Action Items</div>
                  </div>
                </button>

                <button
                  onClick={() => handleInsertFunctionalArea("notes")}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#23252E] hover:text-white text-left transition-colors"
                >
                  <StickyNote className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div>Notes & Brainstorm Area</div>
                    <div className="text-[10px] text-gray-400 font-normal">Color-Coded Stickies</div>
                  </div>
                </button>

                <button
                  onClick={() => handleInsertFunctionalArea("diagram")}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#23252E] hover:text-white text-left transition-colors"
                >
                  <GitFork className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div>System Diagram Area</div>
                    <div className="text-[10px] text-gray-400 font-normal">Architecture & Flow</div>
                  </div>
                </button>

                <button
                  onClick={() => handleInsertFunctionalArea("project-planner")}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#23252E] hover:text-white text-left transition-colors"
                >
                  <Kanban className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div>Project Planner Area</div>
                    <div className="text-[10px] text-gray-400 font-normal">Phases & Milestones</div>
                  </div>
                </button>

                <button
                  onClick={() => handleInsertFunctionalArea("org-chart")}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-[#23252E] hover:text-white text-left transition-colors"
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
        <div className="relative">
          <button
            onClick={() => setShowStylePalette(!showStylePalette)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#22242D] transition-colors"
            title="Style Palette"
          >
            <Palette className="w-4 h-4" />
          </button>

          {showStylePalette && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#181920] border border-[#2D3039] rounded-xl shadow-2xl p-3 w-64 z-50 animate-in fade-in-50">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Color Palette
              </div>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setActiveColor(c.value);
                      if (selectedNodeId) updateSelectedNode({ color: c.value });
                    }}
                    className="w-7 h-7 rounded-full border border-white/20 hover:scale-110 transition-transform"
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
                    onClick={() => {
                      setActiveFillType(ft);
                      if (selectedNodeId) updateSelectedNode({ fillType: ft });
                    }}
                    className={`px-2 py-1 rounded text-xs capitalize ${
                      activeFillType === ft
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
          onClick={handleUndo}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#22242D] transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleRedo}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#22242D] transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
