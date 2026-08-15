"use client";

import { useState, useEffect } from "react";
import { addPipelineTodo, togglePipelineTodo, deletePipelineTodo, reorderPipelineTodos, deletePipeline } from "@/actions";

export default function PipelineCard({ pipeline }: { pipeline: any }) {
  const [todos, setTodos] = useState(pipeline.todos || []);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setTodos(pipeline.todos || []);
  }, [pipeline.todos]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newTodos = [...todos];
    const draggedItem = newTodos[draggedIndex];
    newTodos.splice(draggedIndex, 1);
    newTodos.splice(index, 0, draggedItem);
    setTodos(newTodos);
    setDraggedIndex(index);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedIndex(null);
    await reorderPipelineTodos(pipeline._id, todos);
  };

  return (
    <div className="p-6 rounded-2xl shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition-all duration-200">
      <div>
        {/* Header */}
        <div className="p-4 flex justify-between items-start mb-3 gap-2">
          <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">{pipeline.name}</h4>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 text-[11px] rounded-full font-bold whitespace-nowrap ${pipeline.priority === 'High' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
              pipeline.priority === 'Medium' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              }`}>
              {pipeline.priority}
            </span>
            <form action={deletePipeline} className="m-0 flex" onSubmit={(e) => { if (!window.confirm("Are you sure you want to delete this pipeline?")) e.preventDefault(); }}>
              <input type="hidden" name="pipelineId" value={pipeline._id.toString()} />
              <button type="submit" className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer" title="Delete Pipeline">
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </form>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2.5 py-0.5 text-[10px] rounded-md font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20">
            {pipeline.category}
          </span>
          <span className="px-2.5 py-0.5 text-[10px] rounded-md font-semibold uppercase tracking-wider bg-gray-500/10 text-gray-600 dark:text-gray-300 border border-gray-500/20">
            {pipeline.status}
          </span>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 mb-4">
          <div className="flex justify-between items-center"><span className="font-semibold text-gray-600 dark:text-gray-300">Owner:</span> <span>{pipeline.owner || 'Unassigned'}</span></div>
          <div className="flex justify-between items-center"><span className="font-semibold text-gray-600 dark:text-gray-300">Timeline:</span> <span>{pipeline.startDate ? pipeline.startDate.split('T')[0] : 'TBD'} to {pipeline.endDate ? pipeline.endDate.split('T')[0] : 'TBD'}</span></div>
          {pipeline.objectives && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-600 dark:text-gray-300 block mb-0.5">Objectives:</span>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{pipeline.objectives}</p>
            </div>
          )}
          {pipeline.kpis && (
            <div className="mt-1">
              <span className="font-semibold text-gray-600 dark:text-gray-300 block mb-0.5">KPIs:</span>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">{pipeline.kpis}</p>
            </div>
          )}
        </div>

        {/* Progress & Risk */}
        <div className="my-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Progress</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">{pipeline.progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-50 dark:bg-gray-700/50 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${pipeline.progress}%` }}></div>
          </div>
          <div className="flex justify-between items-center mt-2.5 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Risk Level:</span>
            <span className={`font-semibold text-[11px] px-2 py-0.5 rounded ${pipeline.riskLevel === 'High' ? 'bg-red-500/10 text-red-600' :
              pipeline.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-600' :
                'bg-emerald-500/10 text-emerald-600'
              }`}>
              {pipeline.riskLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Todo List Section */}
      <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex justify-between items-center mb-2.5">
          <h5 className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
            <i className="fa-solid fa-list-check text-blue-600"></i> Checklist
          </h5>
          <button
            type="button"
            onClick={() => setIsReorderMode(!isReorderMode)}
            className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-all ${isReorderMode
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
          >
            <i className="fa-solid fa-arrows-up-down mr-1"></i> {isReorderMode ? 'Done' : 'Reorder'}
          </button>
        </div>

        <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto pr-0.5">
          {todos.map((todo: any, index: number) => (
            <div
              key={todo._id || index}
              draggable={isReorderMode}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              className={`flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-xs transition-all ${isReorderMode ? 'cursor-move hover:bg-blue-500/10 border-blue-400' : ''
                } ${draggedIndex === index ? 'opacity-40 border-dashed border-blue-500' : ''}`}
            >
              {isReorderMode && <i className="fa-solid fa-grip-vertical text-gray-500 dark:text-gray-400 cursor-move"></i>}
              {!isReorderMode && (
                <input
                  type="checkbox"
                  className="rounded cursor-pointer accent-blue-600 w-3.5 h-3.5"
                  checked={todo.completed}
                  onChange={(e) => {
                    const newCompleted = e.target.checked;
                    const newTodos = [...todos];
                    newTodos[index].completed = newCompleted;
                    setTodos(newTodos);
                    togglePipelineTodo(pipeline._id, todo._id, newCompleted);
                  }}
                />
              )}
              <span className={`flex-1 break-words ${todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100 font-medium'}`}>
                {todo.text}
              </span>
              {todo.assigneeName && !isReorderMode && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-semibold whitespace-nowrap inline-flex items-center shrink-0">
                  {todo.assigneeType === 'Group' ? <i className="fa-solid fa-users mr-1"></i> : <i className="fa-solid fa-user mr-1"></i>}
                  {todo.assigneeName}
                </span>
              )}
              {!isReorderMode && (
                <button
                  type="button"
                  className="text-red-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                  onClick={() => {
                    const newTodos = [...todos];
                    newTodos.splice(index, 1);
                    setTodos(newTodos);
                    deletePipelineTodo(pipeline._id, todo._id);
                  }}
                >
                  <i className="fa-solid fa-trash-can text-[11px]"></i>
                </button>
              )}
            </div>
          ))}
          {todos.length === 0 && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 italic text-center py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
              No tasks added yet
            </p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            const text = formData.get("text") as string;
            const assigneeType = formData.get("assigneeType") as string || "Individual";
            const assigneeName = formData.get("assigneeName") as string || "";
            if (!text || !text.trim()) return;

            const newTodo = { _id: Date.now().toString(), text: text.trim(), completed: false, assigneeType, assigneeName };
            setTodos((prev: any) => [...prev, newTodo]);
            form.reset();

            // Background async save without blocking UI thread
            addPipelineTodo(pipeline._id, formData);
          }}
          id={`todo-form-${pipeline._id}`}
          className="flex gap-1.5 flex-wrap  items-center"
        >
          <input
            type="text"
            name="text"
            placeholder="Add task..."
            className="flex-1 min-w-[120px] px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            required
          />
          <select name="assigneeType" className="w-24 px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer">
            <option value="Individual">Individual</option>
            <option value="Group">Group</option>
          </select>
          <input
            type="text"
            name="assigneeName"
            placeholder="Assignee Name..."
            className="w-28 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center justify-center cursor-pointer shrink-0"
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        </form>
      </div>
    </div>
  );
}
