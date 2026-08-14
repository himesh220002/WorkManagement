"use client";

import { useEffect, useRef, useState, useMemo } from "react";
// @ts-ignore
import Gantt from "frappe-gantt";
import { addPipeline, updatePipelineProgress, updatePipelineDates, addPipelineTodo, togglePipelineTodo, deletePipelineTodo, reorderPipelineTodos } from "@/actions";

function PipelineCard({ pipeline }: { pipeline: any }) {
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
      <div className="p-4">
        <div>
          {/* Header */}
          <div className="p-4 flex justify-between items-start mb-3 gap-2">
            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">{pipeline.name}</h4>
            <span className={`px-2.5 py-0.5 text-[11px] rounded-full font-bold whitespace-nowrap ${pipeline.priority === 'High' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
              pipeline.priority === 'Medium' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              }`}>
              {pipeline.priority}
            </span>
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
              if (!text || !text.trim()) return;

              const newTodo = { _id: Date.now().toString(), text: text.trim(), completed: false };
              setTodos((prev: any) => [...prev, newTodo]);
              form.reset();

              // Background async save without blocking UI thread
              addPipelineTodo(pipeline._id, formData);
            }}
            id={`todo-form-${pipeline._id}`}
            className="flex gap-1.5"
          >
            <input
              type="text"
              name="text"
              placeholder="Add task..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center justify-center cursor-pointer"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function TimelineClient({ tasks }: { tasks: any[] }) {
  const ganttWrapperRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Development", "Sales", "Finance", "HR", "Operations", "Marketing", "General"];

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => activeCategory === "All" || t.category === activeCategory);
  }, [tasks, activeCategory]);

  useEffect(() => {
    // We only want to run this in the browser
    if (typeof window === "undefined" || !ganttWrapperRef.current) return;

    // Helper to safely format local dates without shifting timezones via UTC
    const formatLocal = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    // Keep a map of initial values to prevent Frappe Gantt from firing Server Actions on load
    const initialValues: Record<string, { start: string, end: string, progress: number }> = {};

    let ganttTasks = filteredTasks.map((t) => {
      let start = t.startDate ? new Date(t.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
      let end = t.endDate
        ? new Date(t.endDate).toISOString().split("T")[0]
        : new Date(new Date(start).getTime() + 86400000).toISOString().split("T")[0];

      const progress = t.progress || 0;
      initialValues[t._id] = { start, end, progress };

      return {
        id: t._id,
        name: t.name,
        start: start,
        end: end,
        progress: t.progress || 0,
        dependencies: t.dependencies && t.dependencies.length > 0 ? t.dependencies.join(",") : "",
        custom_class: "custom-gantt-bar",
      } as any;
    });

    if (ganttTasks.length === 0) {
      ganttTasks = [
        {
          id: "demo1",
          name: "Create your first pipeline task",
          start: new Date().toISOString().split("T")[0],
          end: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
          progress: 10,
          dependencies: "",
        },
      ];
    }

    // Completely wipe the wrapper and inject a fresh SVG to prevent duplicate Frappe Gantt wrappers
    ganttWrapperRef.current.innerHTML = '<svg id="gantt-svg"></svg>';
    const svgElement = ganttWrapperRef.current.querySelector('svg');

    // Initialize Frappe Gantt
    const instance = new Gantt(svgElement, ganttTasks, {
      view_mode: "Week",
      date_format: "YYYY-MM-DD",
      bar_height: 40,
      padding: 24,
      custom_popup_html: function (task: any) {
        return `
          <div class="details-container">
            <h5 class="text-md font-bold mb-2">${task.name}</h5>
            <p>Started on ${task._start.toLocaleDateString()}</p>
            <p>Progress: ${task.progress}%</p>
          </div>
        `;
      },
      on_progress_change: function (task: any, progress: number) {
        if (initialValues[task.id] && initialValues[task.id].progress !== progress) {
          updatePipelineProgress(task.id, progress);
        }
      },
      on_date_change: function (task: any, start: Date, end: Date) {
        const newStart = formatLocal(start);
        const newEnd = formatLocal(end);
        if (initialValues[task.id] && (initialValues[task.id].start !== newStart || initialValues[task.id].end !== newEnd)) {
          updatePipelineDates(task.id, newStart, newEnd);
        }
      },
    });

    ganttInstance.current = instance;

    // Auto-scroll to today so the user doesn't see blank previous dates
    setTimeout(() => {
      const scrollContainer = ganttWrapperRef.current?.parentElement;
      const todayHighlight = ganttWrapperRef.current?.querySelector('.today-highlight');
      if (scrollContainer && todayHighlight) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const todayRect = todayHighlight.getBoundingClientRect();
        // Scroll so today is aligned near the left (with 100px padding)
        const scrollAmount = todayRect.left - containerRect.left + scrollContainer.scrollLeft - 100;
        scrollContainer.scrollTo({ left: scrollAmount, behavior: "smooth" });
      }
    }, 200);

    // Custom Wheel Event Logic to override Frappe Gantt
    let lastZoomTime = 0;
    const handleWheel = (e: WheelEvent) => {
      // Prevent Frappe Gantt from hijacking the scroll event
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        // Zoom in / out with throttle
        e.preventDefault();
        const now = Date.now();
        if (now - lastZoomTime < 200) return; // 200ms throttle for smooth zoom
        lastZoomTime = now;

        const viewModes = ["Quarter Day", "Half Day", "Day", "Week", "Month"];
        const currentMode = instance.options.view_mode;
        const currentIndex = viewModes.indexOf(currentMode);

        if (e.deltaY > 0 && currentIndex < viewModes.length - 1) {
          instance.change_view_mode(viewModes[currentIndex + 1]);
        } else if (e.deltaY < 0 && currentIndex > 0) {
          instance.change_view_mode(viewModes[currentIndex - 1]);
        }
      } else if (e.shiftKey) {
        // Horizontal scroll
        e.preventDefault();
        const container = ganttWrapperRef.current?.querySelector('.gantt-container');
        if (container) {
          container.scrollLeft += e.deltaY > 0 ? 50 : -50;
        }
      }
      // If no modifiers, we let it do normal vertical scroll natively
    };

    ganttWrapperRef.current.addEventListener('wheel', handleWheel, { capture: true, passive: false });

    return () => {
      // Cleanup on unmount
      if (ganttWrapperRef.current) {
        ganttWrapperRef.current.removeEventListener('wheel', handleWheel, { capture: true });
        ganttWrapperRef.current.innerHTML = "";
      }
    };
  }, [filteredTasks]);

  const changeViewMode = (mode: string) => {
    if (ganttInstance.current) {
      ganttInstance.current.change_view_mode(mode);
    }
  };

  return (
    <main className="flex flex-col min-w-0 p-4 md:p-8 flex-1 min-w-0 max-w-full overflow-hidden">
      {/* Page Header */}
      <header className=" bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 rounded-xl shadow-xs mb-6 flex justify-between items-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div>
          <h1 className=" text-2xl font-bold text-gray-900 dark:text-gray-100">Parallel Pipeline Timeline</h1>
        </div>
        <div className="storage-tag px-3 py-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-2"></span>
          Active
        </div>
      </header>

      {/* Controls & Form Section */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-8">
        {/* Controls Bar */}
        <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-2">Category:</span>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800'
                  }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-2">Zoom:</span>
            <button type="button" className="px-4 py-2 text-xs font-medium rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer" onClick={() => changeViewMode("Quarter Day")}>Q-Day</button>
            <button type="button" className="px-4 py-2 text-xs font-medium rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer" onClick={() => changeViewMode("Half Day")}>H-Day</button>
            <button type="button" className="px-4 py-2 text-xs font-medium rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer" onClick={() => changeViewMode("Day")}>Day</button>
            <button type="button" className="px-4 py-2 text-xs font-medium rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer" onClick={() => changeViewMode("Week")}>Week</button>
            <button type="button" className="px-4 py-2 text-xs font-medium rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer" onClick={() => changeViewMode("Month")}>Month</button>
          </div>
        </div>

        {/* Form to Add Detailed Pipeline */}
        <div>
          <h4 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <i className="fa-solid fa-layer-group text-blue-600"></i> Initialize New Pipeline
          </h4>
          <form action={addPipeline} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
            <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
              <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">Pipeline Name *</label>
              <input type="text" name="name" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" placeholder="e.g. Frontend Sprint Q3" required />
            </div>
            <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
              <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">Category</label>
              <select name="category" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm">
                {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
              <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">Owner / Lead</label>
              <input type="text" name="owner" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" placeholder="Person or Team" />
            </div>
            <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
              <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">Priority</label>
              <select name="priority" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
              <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">Start Date *</label>
              <input type="date" name="startDate" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" required />
            </div>
            <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
              <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">End Date *</label>
              <input type="date" name="endDate" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" required />
            </div>
            <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
              <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">Initial Progress (%)</label>
              <input type="number" name="progress" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" min="0" max="100" defaultValue="0" />
            </div>
            <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
              <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">Risk Level</label>
              <select name="riskLevel" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400 lg:col-span-2">
              <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">Objectives / Goals</label>
              <input type="text" name="objectives" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" placeholder="What does this pipeline achieve?" />
            </div>
            <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400 lg:col-span-2">
              <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">KPIs / Metrics</label>
              <input type="text" name="kpis" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" placeholder="e.g. Latency < 200ms" />
            </div>

            <div className="lg:col-span-4 flex justify-end mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button type="submit" className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer">
                <i className="fa-solid fa-plus"></i> Create Pipeline
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Frappe Gantt Chart Section */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-2 md:p-6 rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-8 overflow-hidden">
        <div className="w-full overflow-x-auto min-h-[400px]">
          <div ref={ganttWrapperRef} className="min-w-[800px]"></div>
        </div>
      </section>

      {/* Detailed Pipeline Cards Grid */}
      <section className="mt-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
          <i className="fa-solid fa-layer-group text-blue-600"></i> Pipeline Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {filteredTasks.map(pipeline => (
            <PipelineCard key={pipeline._id} pipeline={pipeline} />
          ))}
          {filteredTasks.length === 0 && (
            <div className="col-span-full py-16 text-center text-base text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              No pipelines found for this category. Use the form above to add one.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
