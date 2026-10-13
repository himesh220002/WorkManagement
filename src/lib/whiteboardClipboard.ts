import { IWhiteboardNode, IWhiteboardEdge } from "@/models/whiteboard";

export const WHITEBOARD_CLIPBOARD_STORAGE_KEY = "taskpms_whiteboard_clipboard_v1";

export interface WhiteboardClipboardPayload {
  app: "TaskPMS_Whiteboard";
  version: 1;
  sourceBoardId?: string;
  copiedAt: number;
  nodes: IWhiteboardNode[];
  edges: IWhiteboardEdge[];
}

/**
 * Saves whiteboard items (individual nodes or groups with connector edges)
 * to localStorage and system clipboard for cross-whiteboard copy-paste.
 */
export function saveWhiteboardClipboard(
  nodes: IWhiteboardNode[],
  edges: IWhiteboardEdge[],
  sourceBoardId?: string
): WhiteboardClipboardPayload | null {
  if (!nodes || nodes.length === 0) return null;

  const payload: WhiteboardClipboardPayload = {
    app: "TaskPMS_Whiteboard",
    version: 1,
    sourceBoardId,
    copiedAt: Date.now(),
    nodes,
    edges: edges || [],
  };

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(WHITEBOARD_CLIPBOARD_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch (err) {
    console.warn("Could not save whiteboard clipboard to localStorage:", err);
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(JSON.stringify(payload)).catch(() => {});
    }
  } catch {}

  return payload;
}

/**
 * Reads whiteboard clipboard payload from localStorage.
 */
export function readWhiteboardClipboard(): WhiteboardClipboardPayload | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(WHITEBOARD_CLIPBOARD_STORAGE_KEY);
      if (raw) {
        return parseWhiteboardClipboardJson(raw);
      }
    }
  } catch (err) {
    console.warn("Could not read whiteboard clipboard from localStorage:", err);
  }
  return null;
}

/**
 * Safely parses JSON text into a valid whiteboard clipboard payload.
 */
export function parseWhiteboardClipboardJson(text: string): WhiteboardClipboardPayload | null {
  if (!text || typeof text !== "string") return null;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") return null;

    if (Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
      return {
        app: "TaskPMS_Whiteboard",
        version: 1,
        sourceBoardId: parsed.sourceBoardId,
        copiedAt: parsed.copiedAt || Date.now(),
        nodes: parsed.nodes,
        edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      };
    }
  } catch {}
  return null;
}

export interface PreparePastedItemsOptions {
  clipNodes: IWhiteboardNode[];
  clipEdges: IWhiteboardEdge[];
  targetBoardId?: string;
  sourceBoardId?: string;
  existingNodesCount: number;
  viewport?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  targetCenter?: {
    x: number;
    y: number;
  };
}

/**
 * Prepares cloned nodes and internal edges for pasting.
 * If pasted into a different whiteboard or outside current viewport,
 * places the group centered in front of the user while strictly preserving
 * internal layout and relative arrow connections.
 */
export function preparePastedItems(options: PreparePastedItemsOptions): {
  clonedNodes: IWhiteboardNode[];
  clonedEdges: IWhiteboardEdge[];
  newLinkedGroupId?: string;
  isDifferentBoard: boolean;
} {
  const {
    clipNodes,
    clipEdges,
    targetBoardId,
    sourceBoardId,
    existingNodesCount,
    viewport,
    targetCenter,
  } = options;

  if (!clipNodes || clipNodes.length === 0) {
    return { clonedNodes: [], clonedEdges: [], isDifferentBoard: false };
  }

  // 1. Calculate bounding box of the group
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of clipNodes) {
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    const w = n.width || 100;
    const h = n.height || 100;
    if (n.x + w > maxX) maxX = n.x + w;
    if (n.y + h > maxY) maxY = n.y + h;
  }
  const groupWidth = maxX - minX;
  const groupHeight = maxY - minY;
  const groupCenterX = minX + groupWidth / 2;
  const groupCenterY = minY + groupHeight / 2;

  const isDifferentBoard = Boolean(sourceBoardId && targetBoardId && sourceBoardId !== targetBoardId);

  // Check if group is visible in current viewport
  let isVisibleInViewport = true;
  if (viewport) {
    const viewportRight = viewport.left + viewport.width;
    const viewportBottom = viewport.top + viewport.height;
    isVisibleInViewport =
      maxX >= viewport.left &&
      minX <= viewportRight &&
      maxY >= viewport.top &&
      minY <= viewportBottom;
  }

  let deltaX = 0;
  let deltaY = 0;

  if (isDifferentBoard || !isVisibleInViewport) {
    // If on a different board or outside viewport, place group centered at targetCenter or viewport center
    const center = targetCenter || (viewport ? {
      x: Math.round(viewport.left + viewport.width / 2),
      y: Math.round(viewport.top + viewport.height / 2),
    } : { x: 400, y: 300 });

    deltaX = Math.round(center.x - groupCenterX);
    deltaY = Math.round(center.y - groupCenterY);
  } else {
    // Same board and visible: +40, +40 offset
    deltaX = 40;
    deltaY = 40;
  }

  const idMap = new Map<string, string>();
  const newLinkedGroupId =
    clipNodes.length > 1
      ? `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      : undefined;

  const clonedNodes: IWhiteboardNode[] = clipNodes.map((sourceNode, idx) => {
    const newId = `${sourceNode.type}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
    idMap.set(sourceNode.id, newId);

    return {
      ...sourceNode,
      id: newId,
      groupId: newLinkedGroupId,
      x: sourceNode.x + deltaX,
      y: sourceNode.y + deltaY,
      title: sourceNode.title || "",
      zIndex: existingNodesCount + 2 + idx,
    };
  });

  const clonedEdges: IWhiteboardEdge[] = (clipEdges || [])
    .filter((e) => idMap.has(e.from) && idMap.has(e.to))
    .map((e, idx) => ({
      ...e,
      id: `edge-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      from: idMap.get(e.from)!,
      to: idMap.get(e.to)!,
    }));

  return {
    clonedNodes,
    clonedEdges,
    newLinkedGroupId,
    isDifferentBoard,
  };
}

export interface WhiteboardBlockFile {
  app: "TaskPMS_Whiteboard";
  type: "whiteboard_block";
  version: 1;
  title?: string;
  sourceBoardId?: string;
  exportedAt: number;
  nodes: IWhiteboardNode[];
  edges: IWhiteboardEdge[];
}

/**
 * Creates a clean, serialized WhiteboardBlockFile payload from selected nodes and internal edges.
 */
export function exportWhiteboardBlockFile(
  nodes: IWhiteboardNode[],
  edges: IWhiteboardEdge[],
  title?: string,
  sourceBoardId?: string
): WhiteboardBlockFile {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const nodeIds = new Set(safeNodes.map((n) => n.id));
  const safeEdges = Array.isArray(edges)
    ? edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to))
    : [];

  return {
    app: "TaskPMS_Whiteboard",
    type: "whiteboard_block",
    version: 1,
    title: title || (safeNodes[0]?.title ? `${safeNodes[0].title} Block` : "Whiteboard Block"),
    sourceBoardId,
    exportedAt: Date.now(),
    nodes: safeNodes,
    edges: safeEdges,
  };
}

/**
 * Triggers a browser download for a WhiteboardBlockFile (.json).
 */
export function downloadWhiteboardBlockFile(
  block: WhiteboardBlockFile,
  filename?: string
): boolean {
  if (typeof window === "undefined" || !document) return false;
  try {
    const jsonStr = JSON.stringify(block, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = (block.title || "block")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30);
    link.href = url;
    link.download = filename || `whiteboard-block-${safeTitle || "group"}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error("Failed to download whiteboard block file:", err);
    return false;
  }
}

/**
 * Parses and validates raw JSON text into a WhiteboardBlockFile structure.
 * Supports explicit whiteboard_block files, TaskPMS clipboard payloads, and node arrays.
 */
export function parseWhiteboardBlockJson(text: string): WhiteboardBlockFile | null {
  if (!text || typeof text !== "string") return null;
  try {
    const parsed = JSON.parse(text);
    if (!parsed) return null;

    // Direct array of nodes
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.type) {
      return {
        app: "TaskPMS_Whiteboard",
        type: "whiteboard_block",
        version: 1,
        title: "Imported Block",
        exportedAt: Date.now(),
        nodes: parsed,
        edges: [],
      };
    }

    if (typeof parsed === "object" && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
      return {
        app: "TaskPMS_Whiteboard",
        type: "whiteboard_block",
        version: 1,
        title: typeof parsed.title === "string" ? parsed.title : "Imported Block",
        sourceBoardId: parsed.sourceBoardId,
        exportedAt: typeof parsed.exportedAt === "number" ? parsed.exportedAt : Date.now(),
        nodes: parsed.nodes,
        edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      };
    }
  } catch {}
  return null;
}

export interface PrepareImportedBlockOptions {
  block: WhiteboardBlockFile;
  existingNodesCount: number;
  viewport?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  targetCenter?: {
    x: number;
    y: number;
  };
}

/**
 * Prepares imported block nodes and internal connector arrows for canvas placement.
 * Remaps all IDs cleanly, groups multiple nodes as a unified linked entity,
 * and centers the block at targetCenter or viewport center.
 */
export function prepareImportedBlockItems(options: PrepareImportedBlockOptions): {
  clonedNodes: IWhiteboardNode[];
  clonedEdges: IWhiteboardEdge[];
  newLinkedGroupId?: string;
} {
  const { block, existingNodesCount, viewport, targetCenter } = options;
  const clipNodes = block?.nodes || [];
  const clipEdges = block?.edges || [];

  if (clipNodes.length === 0) {
    return { clonedNodes: [], clonedEdges: [] };
  }

  // Calculate bounding box of the block nodes
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of clipNodes) {
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    const w = n.width || 100;
    const h = n.height || 100;
    if (n.x + w > maxX) maxX = n.x + w;
    if (n.y + h > maxY) maxY = n.y + h;
  }
  const groupWidth = maxX - minX;
  const groupHeight = maxY - minY;
  const groupCenterX = minX + groupWidth / 2;
  const groupCenterY = minY + groupHeight / 2;

  // Determine target placement center
  const center =
    targetCenter ||
    (viewport
      ? {
          x: Math.round(viewport.left + viewport.width / 2),
          y: Math.round(viewport.top + viewport.height / 2),
        }
      : { x: 400, y: 300 });

  const deltaX = Math.round(center.x - groupCenterX);
  const deltaY = Math.round(center.y - groupCenterY);

  const idMap = new Map<string, string>();
  const newLinkedGroupId =
    clipNodes.length > 1
      ? `group-block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      : undefined;

  const clonedNodes: IWhiteboardNode[] = clipNodes.map((sourceNode, idx) => {
    const newId = `${sourceNode.type}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
    idMap.set(sourceNode.id, newId);

    return {
      ...sourceNode,
      id: newId,
      groupId: newLinkedGroupId,
      x: sourceNode.x + deltaX,
      y: sourceNode.y + deltaY,
      title: sourceNode.title || "",
      zIndex: existingNodesCount + 2 + idx,
    };
  });

  const clonedEdges: IWhiteboardEdge[] = (clipEdges || [])
    .filter((e) => idMap.has(e.from) && idMap.has(e.to))
    .map((e, idx) => ({
      ...e,
      id: `edge-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      from: idMap.get(e.from)!,
      to: idMap.get(e.to)!,
    }));

  return {
    clonedNodes,
    clonedEdges,
    newLinkedGroupId,
  };
}
