import { IChecklistItem, IWhiteboardNode } from "@/models/whiteboard";

/**
 * Parses checklist items from a whiteboard node.
 * If node has structured `checklist` array with items, returns them.
 * If node has `body` text, parses markdown checkboxes or lines into checklist items.
 * Otherwise, returns default starter todo items.
 */
export function parseNodeChecklist(node: Partial<IWhiteboardNode>): IChecklistItem[] {
  if (Array.isArray(node.checklist) && node.checklist.length > 0) {
    return node.checklist.map((item, idx) => ({
      id: item.id || `item-${Date.now()}-${idx}`,
      text: item.text || "",
      completed: Boolean(item.completed),
    }));
  }

  if (node.body && typeof node.body === "string") {
    const lines = node.body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l !== "Type your notes or pro-tips here...");

    if (lines.length > 0) {
      return lines.map((line, idx) => {
        const isDone = /^\s*(\[x\]|\[X\]|✓|✔)/i.test(line);
        const cleanText = line
          .replace(/^\s*(\[[ xX]\]|[•\-\*✓✔]|\d+[\.\)])\s*/, "")
          .trim();
        return {
          id: `item-${Date.now()}-${idx}`,
          text: cleanText || line,
          completed: isDone,
        };
      });
    }
  }

  return [
    { id: `c-${Date.now()}-1`, text: "To-do task 1", completed: false },
    { id: `c-${Date.now()}-2`, text: "Follow up with team", completed: false },
  ];
}

/**
 * Serializes checklist items into markdown-compatible text body.
 */
export function serializeChecklistToBody(items: IChecklistItem[]): string {
  if (!items || items.length === 0) return "";
  return items.map((i) => `[${i.completed ? "x" : " "}] ${i.text}`).join("\n");
}

/**
 * Toggles completion status of a checklist item by id.
 */
export function toggleChecklistItem(items: IChecklistItem[], itemId: string): IChecklistItem[] {
  return items.map((item) =>
    item.id === itemId ? { ...item, completed: !item.completed } : item
  );
}

/**
 * Updates text of a checklist item by id.
 */
export function updateChecklistItemText(
  items: IChecklistItem[],
  itemId: string,
  newText: string
): IChecklistItem[] {
  return items.map((item) =>
    item.id === itemId ? { ...item, text: newText } : item
  );
}

/**
 * Appends a new checklist item.
 */
export function addChecklistItem(
  items: IChecklistItem[],
  text: string = ""
): IChecklistItem[] {
  const newItem: IChecklistItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text,
    completed: false,
  };
  return [...items, newItem];
}

/**
 * Inserts a new checklist item right after a specific index.
 */
export function insertChecklistItemAfter(
  items: IChecklistItem[],
  afterIndex: number,
  text: string = ""
): IChecklistItem[] {
  const newItem: IChecklistItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text,
    completed: false,
  };
  return [
    ...items.slice(0, afterIndex + 1),
    newItem,
    ...items.slice(afterIndex + 1),
  ];
}

/**
 * Deletes a checklist item by id.
 */
export function deleteChecklistItem(
  items: IChecklistItem[],
  itemId: string
): IChecklistItem[] {
  return items.filter((item) => item.id !== itemId);
}

/**
 * Calculates checklist completion stats.
 */
export function getChecklistStats(items: IChecklistItem[]): {
  total: number;
  completed: number;
  percent: number;
} {
  const total = items.length;
  const completed = items.filter((i) => i.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percent };
}

/**
 * Returns aesthetically harmonious text color for pastel sticky backgrounds.
 */
export function getStickyTextColor(color?: string, customTextColor?: string): string {
  if (customTextColor && customTextColor.trim()) return customTextColor;
  const c = (color || "").toUpperCase();
  if (c.includes("F472B6") || c.includes("EC4899")) return "#FCE7F3"; // Pink
  if (c.includes("FBBF24") || c.includes("F59E0B")) return "#FEF3C7"; // Yellow/Amber
  if (c.includes("34D399") || c.includes("10B981")) return "#D1FAE5"; // Emerald/Green
  if (c.includes("38BDF8") || c.includes("60A5FA") || c.includes("0078D4")) return "#E0F2FE"; // Cyan/Blue
  if (c.includes("A78BFA") || c.includes("8B5CF6")) return "#EDE9FE"; // Purple
  if (c.includes("F87171") || c.includes("EF4444")) return "#FEE2E2"; // Red
  return "#F3F4F6";
}
