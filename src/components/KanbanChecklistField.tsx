"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";

export type ChecklistItem = { text: string; completed: boolean };

export function emptyChecklistRow(): ChecklistItem {
  return { text: "", completed: false };
}

/** Editable checklist rows for Add/Edit modals. Serializes to hidden `checklist` JSON input. */
export default function KanbanChecklistField({
  initial = [],
  fieldName = "checklist",
  disabled = false,
}: {
  initial?: ChecklistItem[];
  fieldName?: string;
  disabled?: boolean;
}) {
  const [items, setItems] = useState<ChecklistItem[]>(
    initial.length > 0 ? initial.map((i) => ({ ...i })) : [emptyChecklistRow(), emptyChecklistRow(), emptyChecklistRow()]
  );

  const updateText = (idx: number, text: string) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, text } : it)));
  };

  const toggleDone = (idx: number) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, completed: !it.completed } : it)));
  };

  const removeRow = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    if (items.length >= 20) return;
    setItems((prev) => [...prev, emptyChecklistRow()]);
  };

  return (
    <div>
      <input type="hidden" name={fieldName} value={JSON.stringify(items)} />
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => toggleDone(idx)}
              title={item.completed ? "Mark as not done" : "Mark as done"}
              className={`w-5 h-5 shrink-0 rounded-[4px] border-[1.5px] flex items-center justify-center transition-colors cursor-pointer ${
                item.completed
                  ? "bg-[#107C10] border-[#107C10] text-white"
                  : "border-[#9A8C6B] bg-white text-transparent hover:border-[#2E2A24]"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Check className="w-3 h-3" strokeWidth={3} />
            </button>
            <input
              type="text"
              value={item.text}
              disabled={disabled}
              onChange={(e) => updateText(idx, e.target.value)}
              placeholder={`Checklist item ${idx + 1} — e.g. Call back, Send quote`}
              maxLength={120}
              className={`flex-1 p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] outline-none text-[#242424] dark:text-white focus:border-[#0078D4] ${
                item.completed ? "line-through opacity-60" : ""
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            />
            {!disabled && items.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="p-1.5 text-[#8A7D61] hover:text-[#B42318] hover:bg-red-500/10 rounded-md transition-colors cursor-pointer shrink-0"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
      {!disabled && (
        <button
          type="button"
          onClick={addRow}
          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0078D4] hover:text-[#106EBE] hover:underline cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add checklist item
        </button>
      )}
      <p className="mt-1.5 text-[10px] text-[#8A7D61]">
        These appear as tick boxes on the kanban card. Tick/untick directly on the board; edit text here.
      </p>
    </div>
  );
}
