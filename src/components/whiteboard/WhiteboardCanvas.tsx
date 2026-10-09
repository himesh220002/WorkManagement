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
  MoveRight,
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

  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save debounce
  const triggerAutoSave = useCallback(
    (newNodes: IWhiteboardNode[], newEdges: IWhiteboardEdge[], newTitle?: string) => {
      setSaveStatus("unsaved");
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
      }, 1000);
    },
    [boardId, title, isFavorite]
  );

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
        zIndex: 2,
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
        zIndex: 2,
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
        zIndex: 2,
      };
    } else {
      newNode = {
        id: newId,
        type: "shape",
        shapeType: shapeType as any,
        x: coords.x - 80,
        y: coords.y - 60,
        width: 160,
        height: 120,
        title: shapeType.charAt(0).toUpperCase() + shapeType.slice(1),
        body: "",
        color: customColor || activeColor,
        fillType: activeFillType,
        zIndex: 2,
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

  // Canvas Mouse Down (Panning, Deselecting, or Starting Rectangular Marquee Selection)
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

  // Global Mouse Move (Dragging Nodes / Group, Rectangular Selection, or Panning)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPanMouse.x,
        y: e.clientY - startPanMouse.y,
      });
      return;
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);

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

    // 2. Dragging Nodes as a Group
    if (isDraggingGroup && groupDragStartCoords) {
      const dx = coords.x - groupDragStartCoords.x;
      const dy = coords.y - groupDragStartCoords.y;

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
    }
  };

  // Global Mouse Up (End Panning, Selection Box, or Group Drag)
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (isSelectingBox) {
      setIsSelectingBox(false);
      setSelectionBox(null);
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
        setDoubleClickMenu(null);
        setShowShapePalette(false);
        setShowStylePalette(false);
      } else if (e.key === "v" || e.key === "V") {
        setActiveTool("select");
      } else if (e.key === "h" || e.key === "H") {
        setActiveTool("hand");
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
  }, [selectedNodeId, editingNodeId, nodes, edges]);

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

  // Render Connector SVG lines between nodes ("aero link setting" & branch handles)
  const renderEdges = () => {
    return edges.map((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) return null;

      // Start point: bottom-center of fromNode
      const startX = fromNode.x + fromNode.width / 2;
      const startY = fromNode.y + fromNode.height;

      // End point: top-center of toNode
      const endX = toNode.x + toNode.width / 2;
      const endY = toNode.y;

      // Orthogonal mid-way Y line
      const midY = startY + (endY - startY) / 2;
      const pathData = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;

      const isSelectedEdge = selectedEdgeId === edge.id;
      const isHovered = hoveredEdgeId === edge.id;

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
                x: endX,
                y: midY,
              });
            }}
          />

          {/* Visible line */}
          <path
            d={pathData}
            fill="none"
            stroke={isSelectedEdge ? "#38BDF8" : isHovered ? "#93C5FD" : edge.color || "#60A5FA"}
            strokeWidth={isSelectedEdge ? "3" : isHovered ? "2.5" : "2"}
            strokeDasharray={edge.style === "dashed" ? "6,4" : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors pointer-events-none"
          />

          {/* Arrowhead marker */}
          <polygon
            points={`${endX},${endY} ${endX - 5},${endY - 8} ${endX + 5},${endY - 8}`}
            fill={isSelectedEdge ? "#38BDF8" : isHovered ? "#93C5FD" : edge.color || "#60A5FA"}
            className="pointer-events-none"
          />

          {/* Interactive Arrow Link Setting Handle: "+" circular button at turn/midpoint */}
          <g
            className="pointer-events-auto cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEdgeId(edge.id);
              setEdgeSettingsPopover({
                edgeId: edge.id,
                x: endX,
                y: midY,
              });
            }}
          >
            <title>Arrow Link Setting: Click to add branch or adjust link</title>
            <circle
              cx={endX}
              cy={midY}
              r="10"
              fill="#121316"
              stroke={isSelectedEdge ? "#38BDF8" : isHovered ? "#60A5FA" : "#3B82F6"}
              strokeWidth="2"
              className="hover:scale-125 transition-transform"
            />
            <text
              x={endX}
              y={midY + 3.5}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="12"
              fontWeight="bold"
              className="select-none pointer-events-none"
            >
              +
            </text>
          </g>
        </g>
      );
    });
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-[#0D0E11] text-[#E1DFDD] select-none">
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

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
            className="p-1.5 rounded-md hover:bg-[#202228] text-gray-400 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. FLOATING FORMAT BAR (Shown above selected node - Matching Screenshot 3 & 5) */}
      {selectedNode && (
        <div
          className="absolute z-40 bg-[#1A1C22] border border-[#2D3039] rounded-lg shadow-2xl px-2 py-1.5 flex items-center gap-1.5 text-xs text-gray-300 animate-in fade-in-50"
          style={{
            left: Math.max(20, Math.min(window.innerWidth - 380, selectedNode.x * zoom + pan.x)),
            top: Math.max(60, selectedNode.y * zoom + pan.y - 48),
          }}
        >
          <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-400 text-[10px] font-bold uppercase">
            {selectedNode.type}
          </span>

          <div className="h-4 w-px bg-[#30333D]" />

          {/* Text Style Controls */}
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

          {/* Fill Type Selector */}
          <div className="flex items-center gap-1 bg-[#121316] p-0.5 rounded border border-[#282B33]">
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

          {/* Color Swatch Button */}
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

          <div className="h-4 w-px bg-[#30333D]" />

          {/* Add Branch Button directly from selected node */}
          <button
            onClick={() => handleAddBranchFromNode(selectedNode.id)}
            className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Add Branch Node (+)"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>+ Branch</span>
          </button>

          <div className="h-4 w-px bg-[#30333D]" />

          {/* Delete Button */}
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
          activeTool === "hand" || isPanning ? "cursor-grab active:cursor-grabbing" : "cursor-default"
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
          {/* SVG Connector Arrows */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {renderEdges()}
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
                  className={`p-3.5 rounded-md border-2 border-white/80 bg-[#0D0E11]/80 backdrop-blur-sm cursor-pointer shadow-xl ${
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
                    backgroundColor: "rgba(236, 72, 153, 0.15)",
                    borderColor: node.color || "#EC4899",
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer shadow-lg flex flex-col justify-between transition-all ${
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
                    />
                  ) : (
                    <p className="text-[11px] text-pink-200 leading-relaxed font-sans">
                      {node.body || "Click to add text..."}
                    </p>
                  )}
                </div>
              );
            }

            // 4. TASK CARD / ORG CHART POSITION NODE (Screenshots 2-5: Gold Task Header + Blue Position Box)
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
                  className={`rounded-md overflow-hidden cursor-pointer shadow-2xl transition-all relative group/node ${
                    isSelected ? "ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]" : ""
                  }`}
                >
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
                  <div className="h-10 bg-[#0F1E36] border-2 border-t-0 border-blue-500/80 rounded-b-md flex items-center justify-center text-center">
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
                </div>
              );
            }

            // 5. GEOMETRIC SHAPES (Square, Diamond, Circle, etc.)
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
                  backgroundColor:
                    node.fillType === "solid"
                      ? node.color
                      : node.fillType === "tint"
                      ? `${node.color}33`
                      : "transparent",
                  borderColor: node.color || "#0078D4",
                }}
                className={`p-3 rounded-md border-2 cursor-pointer shadow-md flex items-center justify-center text-center transition-all ${
                  isSelected ? "ring-2 ring-white" : ""
                }`}
              >
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={node.title}
                    onBlur={(e) => {
                      updateSelectedNode({ title: e.target.value });
                      setEditingNodeId(null);
                    }}
                    className="bg-transparent text-xs text-white text-center w-full focus:outline-none font-bold"
                  />
                ) : (
                  <span className="text-xs font-bold text-white">
                    {node.title || "Shape"}
                  </span>
                )}
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
          onClick={() => setActiveTool("draw")}
          className={`p-2 rounded-lg transition-colors ${
            activeTool === "draw"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-[#22242D]"
          }`}
          title="Draw (D)"
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
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#181920] border border-[#2D3039] rounded-xl shadow-2xl p-3 grid grid-cols-4 gap-2 w-48 z-50 animate-in fade-in-50">
              <button
                onClick={() => handleAddNode("shape", "rectangle")}
                className="p-2 hover:bg-[#242630] rounded flex items-center justify-center text-gray-300 hover:text-white"
                title="Rectangle"
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleAddNode("shape", "circle")}
                className="p-2 hover:bg-[#242630] rounded flex items-center justify-center text-gray-300 hover:text-white"
                title="Circle"
              >
                <Circle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleAddNode("shape", "diamond")}
                className="p-2 hover:bg-[#242630] rounded flex items-center justify-center text-gray-300 hover:text-white"
                title="Diamond"
              >
                <Diamond className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleAddNode("shape", "triangle")}
                className="p-2 hover:bg-[#242630] rounded flex items-center justify-center text-gray-300 hover:text-white"
                title="Triangle"
              >
                <Triangle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* A - Arrow / Connector Tool */}
        <button
          onClick={() => setActiveTool("arrow")}
          className={`p-2 rounded-lg transition-colors ${
            activeTool === "arrow"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-[#22242D]"
          }`}
          title="Arrow (A)"
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
