"use client";

import { useEffect, useRef, useState, useMemo } from "react";
// @ts-ignore
import Gantt from "frappe-gantt";
import { addPipeline, updatePipelineProgress, updatePipelineDates } from "@/actions";

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
    <main className="main-dashboard p-6 flex-1 min-w-0">
      <header className="dashboard-banner glass-card p-6 rounded-lg mb-6 flex justify-between items-center">
        <div>
          <h1 className="list-heading text-3xl font-bold text-[var(--text-primary)]">Parallel Pipeline Timeline</h1>
        </div>
        <div className="storage-tag px-3 py-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full text-sm font-medium text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
          Active
        </div>
      </header>

      <div className="glass-card p-6 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
        <div className="controls-bar mb-6 flex justify-between items-end flex-wrap gap-4">
          <div className="flex gap-2">
            <span className="text-sm font-semibold text-[var(--text-muted)] mr-2 flex items-center">Category:</span>
            {categories.map(cat => (
              <button
                key={cat}
                className={`theme-toggle-btn px-4 py-1 text-sm ${activeCategory === cat ? 'bg-blue-500 text-white border-transparent' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="text-sm font-semibold text-[var(--text-muted)] mr-2 flex items-center">Zoom:</span>
            <button className="theme-toggle-btn px-2 py-1 text-sm" onClick={() => changeViewMode("Quarter Day")}>Q-Day</button>
            <button className="theme-toggle-btn px-2 py-1 text-sm" onClick={() => changeViewMode("Half Day")}>H-Day</button>
            <button className="theme-toggle-btn px-2 py-1 text-sm" onClick={() => changeViewMode("Day")}>Day</button>
            <button className="theme-toggle-btn px-2 py-1 text-sm" onClick={() => changeViewMode("Week")}>Week</button>
            <button className="theme-toggle-btn px-2 py-1 text-sm" onClick={() => changeViewMode("Month")}>Month</button>
          </div>
        </div>

        {/* Form to Add Detailed Pipeline */}
        <div className="mb-6 p-5 bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] rounded-md">
          <h4 className="mb-4 text-md font-semibold text-[var(--text-primary)]">Add New Pipeline</h4>
          <form action={addPipeline} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col text-xs text-[var(--text-muted)]">
              <label className="mb-1">Pipeline Name *</label>
              <input type="text" name="name" className="w-full p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]" placeholder="e.g. Frontend Sprint Q3" required />
            </div>
            <div className="flex flex-col text-xs text-[var(--text-muted)]">
              <label className="mb-1">Category</label>
              <select name="category" className="w-full p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]">
                {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col text-xs text-[var(--text-muted)]">
              <label className="mb-1">Owner / Lead</label>
              <input type="text" name="owner" className="w-full p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]" placeholder="Person or Team" />
            </div>
            <div className="flex flex-col text-xs text-[var(--text-muted)]">
              <label className="mb-1">Priority</label>
              <select name="priority" className="w-full p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="flex flex-col text-xs text-[var(--text-muted)]">
              <label className="mb-1">Start Date *</label>
              <input type="date" name="startDate" className="p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]" required />
            </div>
            <div className="flex flex-col text-xs text-[var(--text-muted)]">
              <label className="mb-1">End Date *</label>
              <input type="date" name="endDate" className="p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]" required />
            </div>
            <div className="flex flex-col text-xs text-[var(--text-muted)]">
              <label className="mb-1">Initial Progress (%)</label>
              <input type="number" name="progress" className="w-full p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]" min="0" max="100" defaultValue="0" />
            </div>
            <div className="flex flex-col text-xs text-[var(--text-muted)]">
              <label className="mb-1">Risk Level</label>
              <select name="riskLevel" className="w-full p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="flex flex-col text-xs text-[var(--text-muted)] lg:col-span-2">
              <label className="mb-1">Objectives / Goals</label>
              <input type="text" name="objectives" className="w-full p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]" placeholder="What does this pipeline achieve?" />
            </div>
            <div className="flex flex-col text-xs text-[var(--text-muted)] lg:col-span-2">
              <label className="mb-1">KPIs / Metrics</label>
              <input type="text" name="kpis" className="w-full p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]" placeholder="e.g. Latency < 200ms" />
            </div>

            <div className="lg:col-span-4 flex justify-end">
              <button type="submit" className="theme-toggle-btn px-6 py-2 bg-emerald-500 text-white border-transparent flex items-center gap-2 font-medium">
                <i className="fa-solid fa-plus"></i> Create Pipeline
              </button>
            </div>
          </form>
        </div>

        <div className="w-full max-w-full overflow-hidden min-h-[400px] mb-8">
          <div ref={ganttWrapperRef} className="w-full max-w-full overflow-x-auto"></div>
        </div>

        {/* Detailed Pipeline Cards Grid */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Pipeline Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTasks.map(pipeline => (
              <div key={pipeline._id} className="glass-card p-5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] flex flex-col hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-bold text-[var(--text-primary)]">{pipeline.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded font-bold ${pipeline.priority === 'High' ? 'bg-red-500/20 text-red-500' :
                    pipeline.priority === 'Medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
                    }`}>
                    {pipeline.priority}
                  </span>
                </div>

                <div className="flex gap-2 mb-4">
                  <span className="px-2 py-1 text-[10px] rounded uppercase tracking-wider bg-[var(--glass-bg-hover)] text-[var(--text-secondary)] border border-[var(--glass-border)]">{pipeline.category}</span>
                  <span className="px-2 py-1 text-[10px] rounded uppercase tracking-wider bg-[var(--glass-bg-hover)] text-[var(--text-secondary)] border border-[var(--glass-border)]">{pipeline.status}</span>
                </div>

                <div className="text-sm text-[var(--text-muted)] space-y-2 mb-4 flex-1">
                  <div className="flex justify-between"><span className="font-semibold">Owner:</span> <span>{pipeline.owner}</span></div>
                  <div className="flex justify-between"><span className="font-semibold">Timeline:</span> <span>{pipeline.startDate ? pipeline.startDate.split('T')[0] : 'TBD'} - {pipeline.endDate ? pipeline.endDate.split('T')[0] : 'TBD'}</span></div>
                  {pipeline.objectives && <div className="mt-2"><span className="font-semibold block mb-1">Objectives:</span> <span className="text-xs">{pipeline.objectives}</span></div>}
                  {pipeline.kpis && <div className="mt-2"><span className="font-semibold block mb-1">KPIs:</span> <span className="text-xs">{pipeline.kpis}</span></div>}
                </div>

                <div className="mt-auto pt-4 border-t border-[var(--glass-border)]">
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="text-[var(--text-muted)]">Progress</span>
                    <span className="font-bold text-[var(--text-primary)]">{pipeline.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--glass-bg-hover)] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${pipeline.progress}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-xs">
                    <span className="text-[var(--text-muted)]">Risk Level:</span>
                    <span className={`font-semibold ${pipeline.riskLevel === 'High' ? 'text-red-500' :
                      pipeline.riskLevel === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                      {pipeline.riskLevel}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {filteredTasks.length === 0 && (
              <div className="col-span-full py-10 text-center text-[var(--text-muted)]">
                No pipelines found for this category.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
