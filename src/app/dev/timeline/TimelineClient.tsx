"use client";

import { useEffect, useRef, useState, useMemo } from "react";
// @ts-ignore
import Gantt from "frappe-gantt";
import mermaid from "mermaid";
import { addPipeline, updatePipelineProgress, updatePipelineDates } from "@/actions";

interface Option { id: string, name: string }
interface Options { projects: Option[], teams: Option[], tasks: Option[], users: Option[] }
import PipelineCard from "@/components/PipelineCard";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import { PREDEFINED_PIPELINE_TASKS } from "@/utils/taskConstants";

export default function TimelineClient({ tasks, options, projectMetrics = [] }: { tasks: any[], options?: Options, projectMetrics?: any[] }) {
  const ganttWrapperRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);
  const mermaidContainerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formCategory, setFormCategory] = useState("Development");
  const [dayZoom, setDayZoom] = useState("Week");
  const [showExamplesModal, setShowExamplesModal] = useState(false);

  const categories = ["Company Pipeline", "All", "Development", "Sales", "Finance", "HR", "Operations", "Marketing", "General"];

  const dayZoomOptions = [
    { label: "Q-Day", value: "Quarter Day" },
    { label: "H-Day", value: "Half Day" },
    { label: "Day", value: "Day" },
    { label: "Week", value: "Week" },
    { label: "Month", value: "Month" }
  ];

  const filteredTasks = useMemo(() => {
    return tasks.filter((t: any) => activeCategory === "All" || t.category === activeCategory);
  }, [tasks, activeCategory]);

  useEffect(() => {
    if (!showExamplesModal || !mermaidContainerRef.current) return;

    const container = mermaidContainerRef.current;
    // Clear any previous render
    container.innerHTML = "";

    const id = `pipeline-flow-${Date.now()}`;
    mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });
    mermaid.render(id, pipelineFlowChart).then(({ svg }) => {
      container.innerHTML = svg;
    }).catch((err) => {
      console.error("Mermaid render error:", err);
      container.innerHTML = `<p class="text-red-400 text-sm">Diagram failed to render.</p>`;
    });
  }, [showExamplesModal]);

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

    let sourceTasks = activeCategory === "Company Pipeline" ? projectMetrics : filteredTasks;

    let ganttTasks = sourceTasks.map((t) => {
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
        progress: progress,
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
          const newMode = viewModes[currentIndex + 1];
          instance.change_view_mode(newMode);
          setDayZoom(newMode);
        } else if (e.deltaY < 0 && currentIndex > 0) {
          const newMode = viewModes[currentIndex - 1];
          instance.change_view_mode(newMode);
          setDayZoom(newMode);
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
      setDayZoom(mode);
    }
  };

  const pipelineFlowChart = `flowchart LR
    %% Cross-functional Pipeline Interconnectivity
    subgraph DevPhase ["Development Phase"]
        Dev[Development Pipeline]
    end

    subgraph LaunchPhase ["Launch and Operations Phase"]
        Mktg[Marketing Pipeline]
        Ops[Operations Pipeline]
        HR[HR Pipeline]
    end

    subgraph RevenuePhase ["Revenue Phase"]
        Sales[Sales Pipeline]
        Fin[Finance Pipeline]
    end

    Dev --> Mktg
    Dev --> Ops
    Dev --> HR
    Mktg --> Sales
    Ops --> Sales
    Sales --> Fin
    classDef highlight fill:#4f46e5,stroke:#fff,stroke-width:2px,color:#fff;
    class Dev,Sales,Fin highlight;`;

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
                className={`px-2 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeCategory === cat
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
            {dayZoomOptions.map((zoom) => (
              <button
                key={zoom.value}
                type="button"
                className={`px-2 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${dayZoom === zoom.value ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-blue-600 hover:text-white'}`}
                onClick={() => changeViewMode(zoom.value)}
              >
                {zoom.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form to Add Detailed Pipeline */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between w-full hover:opacity-80 transition-opacity cursor-pointer border-b border-transparent">
            <button
              type="button"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 outline-none py-2 flex-1 text-left"
            >
              <i className="fa-solid fa-layer-group text-blue-600"></i> Initialize New Pipeline
              <i className={`fa-solid fa-chevron-${isFormOpen ? 'up' : 'down'} text-gray-500 dark:text-gray-400 text-sm transition-transform ml-2`}></i>
            </button>
            <button
              type="button"
              onClick={() => setShowExamplesModal(true)}
              className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm"
            >
              <i className="fa-solid fa-lightbulb text-amber-400"></i> View Examples
            </button>
          </div>

          <div className={`grid transition-all duration-300 ease-in-out ${isFormOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <form action={addPipeline} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
                <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                  <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">Pipeline Name *</label>
                  <input type="text" name="name" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" placeholder="e.g. Frontend Sprint Q3" required />
                </div>
                <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                  <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">Category</label>
                  <select name="category" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm">
                    {categories.filter(c => c !== "All" && c !== "Company Pipeline").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                  <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">Owner (Text fallback)</label>
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

                {options && (
                  <>
                    <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                      <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">Link Project</label>
                      <select name="projectId" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm">
                        <option value="">None</option>
                        {options.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                      <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">Link Team</label>
                      <select name="teamId" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm">
                        <option value="">None</option>
                        {options.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                      <label className="mb-2 font-semibold text-gray-600 dark:text-gray-300">Link Existing Task</label>
                      <select name="taskId" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm">
                        <option value="">None (or Auto-Create Below)</option>
                        {options.tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                      <label className="mb-2 font-semibold text-blue-600 dark:text-blue-400">Auto-Create Category Task</label>
                      <select name="createTaskName" className="w-full px-4 py-2.5 rounded-lg border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm">
                        <option value="">Select Predefined Task...</option>
                        {PREDEFINED_PIPELINE_TASKS[formCategory]?.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                      <label className="mb-2 font-semibold text-blue-600 dark:text-blue-400">Or Custom Task Name</label>
                      <input type="text" name="customTaskName" className="w-full px-4 py-2.5 rounded-lg border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" placeholder="Generate custom execution task..." />
                    </div>
                    <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                      <label className="mb-2 font-semibold text-violet-600 dark:text-violet-400">Generate Team on the Fly</label>
                      <input type="text" name="newTeamName" className="w-full px-4 py-2.5 rounded-lg border border-violet-300 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all shadow-sm" placeholder="New Team Name..." />
                    </div>
                    <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                      <label className="mb-2 font-semibold text-violet-600 dark:text-violet-400">Select Members for New Team</label>
                      <MultiSelectDropdown name="memberIds" options={options.users} placeholder="Select team members..." />
                    </div>
                  </>
                )}

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
          </div>
        </div>
      </section>

      {/* Frappe Gantt Chart Section */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-2 md:p-6 mb-8 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <div ref={ganttWrapperRef} className="min-w-[800px]"></div>
        </div>
      </section>

      {/* Detailed Pipeline Cards Grid */}
      {activeCategory !== "Company Pipeline" && (
        <section className="mt-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
            <i className="fa-solid fa-layer-group text-blue-600"></i> Pipeline Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((pipeline: any) => (
              <PipelineCard key={pipeline._id} pipeline={pipeline} />
            ))}
            {filteredTasks.length === 0 && (
              <div className="col-span-full py-16 text-center text-base text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                No pipelines found for this category. Use the form above to add one.
              </div>
            )}
          </div>
        </section>
      )}
      {showExamplesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <i className="fa-solid fa-book text-indigo-500"></i> Example Pipeline Schemas
              </h2>
              <button
                onClick={() => setShowExamplesModal(false)}
                className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
                <p className="font-semibold mb-2">🔑 Best Practices for Pipeline Creation:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Use specific, actionable <strong>Pipeline Names</strong>.</li>
                  <li>Tailor <strong>Objectives</strong> & <strong>KPIs</strong> to the specific category (e.g., Latency for Dev, Conversion for Sales).</li>
                  <li>Always <strong>Link to a Project</strong> so metrics roll up to the Executive Dashboard.</li>
                  <li><strong>Generate or Link a Team</strong> to give ownership to the execution layer.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* 1. Frontend Sprint Q3 */}
                <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-900/10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">Frontend Sprint Q3</h3>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-full font-semibold">Development</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Owner:</span> Dev Team Alpha</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Priority:</span> <span className="text-red-500 font-bold">High</span></div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Project:</span> WebApp-AuthModule</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Task Link:</span> Frontend UI Components</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Objectives:</span> Deliver responsive UI and integrate APIs</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">KPIs:</span> Latency &lt; 200ms · Bug count &lt; 5</div>
                  </div>
                  <div className="border-t border-blue-100 dark:border-blue-800 pt-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Pipeline Tasks:</p>
                    <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                      {["UI Design & Wireframes","Frontend Component Development","Backend API Integration","Authentication Module","Unit Testing","CI/CD Pipeline Setup","Bug Fixes & QA"].map(t => <li key={t} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>{t}</li>)}
                    </ul>
                  </div>
                </div>

                {/* 2. Sales Campaign Q3 */}
                <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 bg-emerald-50/50 dark:bg-emerald-900/10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Sales Campaign Q3</h3>
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-full font-semibold">Sales</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Owner:</span> Sales Team Beta</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Priority:</span> <span className="text-yellow-500 font-bold">Medium</span></div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Project:</span> LeadGen-Platform</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Task Link:</span> Campaign Outreach</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Objectives:</span> Generate 200 qualified leads &amp; close 20 deals</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">KPIs:</span> Conversion Rate &gt; 10% · Revenue &gt; $50,000</div>
                  </div>
                  <div className="border-t border-emerald-100 dark:border-emerald-800 pt-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Pipeline Tasks:</p>
                    <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                      {["Lead List Preparation","Email Campaigns","Cold Calls","Demo Scheduling","Follow-ups","CRM Updates","Deal Closure"].map(t => <li key={t} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>{t}</li>)}
                    </ul>
                  </div>
                </div>

                {/* 3. Quarterly Finance Audit */}
                <div className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 bg-yellow-50/50 dark:bg-yellow-900/10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-yellow-700 dark:text-yellow-400 text-sm">Quarterly Finance Audit</h3>
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 rounded-full font-semibold">Finance</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Owner:</span> Finance Team</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Priority:</span> <span className="text-red-500 font-bold">High</span></div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Project:</span> Audit-2026Q3</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Task Link:</span> Expense Verification</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Objectives:</span> Ensure compliance and accurate reporting for Q3</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">KPIs:</span> Audit completion &lt; 20 days · Error rate &lt; 2%</div>
                  </div>
                  <div className="border-t border-yellow-100 dark:border-yellow-800 pt-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Pipeline Tasks:</p>
                    <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                      {["Expense Report Collection","Invoice Verification","Payroll Audit","Tax Compliance Check","Budget Variance Analysis","Financial Statement Preparation","Audit Report Submission"].map(t => <li key={t} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"></span>{t}</li>)}
                    </ul>
                  </div>
                </div>

                {/* 4. Supply Chain Optimization */}
                <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50/50 dark:bg-amber-900/10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-amber-600 dark:text-amber-400 text-sm">Supply Chain Optimization</h3>
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 rounded-full font-semibold">Operations</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Owner:</span> Ops Team Gamma</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Priority:</span> <span className="text-red-500 font-bold">High</span></div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Project:</span> SCM-Revamp</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Task Link:</span> Vendor Performance Review</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Objectives:</span> Reduce delivery delays and optimize warehouse</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">KPIs:</span> Delivery SLA compliance &gt; 95%</div>
                  </div>
                  <div className="border-t border-amber-100 dark:border-amber-800 pt-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Pipeline Tasks:</p>
                    <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                      {["Vendor Evaluation","Contract Review","Logistics Tracking","Warehouse Utilization Analysis","Inventory Reordering","Delivery SLA Monitoring","Process Improvement Implementation"].map(t => <li key={t} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>{t}</li>)}
                    </ul>
                  </div>
                </div>

                {/* 5. Employee Onboarding Drive */}
                <div className="border border-pink-200 dark:border-pink-800 rounded-lg p-4 bg-pink-50/50 dark:bg-pink-900/10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-pink-600 dark:text-pink-400 text-sm">Employee Onboarding Drive</h3>
                    <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300 rounded-full font-semibold">HR</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Owner:</span> HR Team</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Priority:</span> <span className="text-yellow-500 font-bold">Medium</span></div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Project:</span> Onboarding-2026</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Task Link:</span> New Hire Orientation</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Objectives:</span> Onboard 15 new employees</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">KPIs:</span> Onboarding completion 100%</div>
                  </div>
                  <div className="border-t border-pink-100 dark:border-pink-800 pt-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Pipeline Tasks:</p>
                    <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                      {["Offer Letter Dispatch","Document Verification","Orientation Session","Training Modules","System Access Provisioning","Mentorship Assignment","Feedback Collection"].map(t => <li key={t} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0"></span>{t}</li>)}
                    </ul>
                  </div>
                </div>

                {/* 6. Digital Marketing Push */}
                <div className="border border-violet-200 dark:border-violet-800 rounded-lg p-4 bg-violet-50/50 dark:bg-violet-900/10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-violet-600 dark:text-violet-400 text-sm">Digital Marketing Push</h3>
                    <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 rounded-full font-semibold">Marketing</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Owner:</span> Marketing Team Delta</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Priority:</span> <span className="text-red-500 font-bold">High</span></div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Project:</span> Campaign-DigitalReach</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Task Link:</span> Social Media Ads</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Objectives:</span> Boost brand awareness, drive 50,000 new site visits</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">KPIs:</span> CTR &gt; 5% · Engagement &gt; 15%</div>
                  </div>
                  <div className="border-t border-violet-100 dark:border-violet-800 pt-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Pipeline Tasks:</p>
                    <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                      {["Content Creation","Social Media Posting","Ad Campaign Setup","SEO Optimization","Influencer Outreach","Analytics Tracking","Campaign Report"].map(t => <li key={t} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0"></span>{t}</li>)}
                    </ul>
                  </div>
                </div>

                {/* 7. Performance Review Cycle */}
                <div className="border border-rose-200 dark:border-rose-800 rounded-lg p-4 bg-rose-50/50 dark:bg-rose-900/10 md:col-span-2">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-rose-600 dark:text-rose-400 text-sm">Performance Review Cycle</h3>
                    <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 rounded-full font-semibold">HR</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Owner:</span> HR Team</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Priority:</span> <span className="text-yellow-500 font-bold">Medium</span></div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Project:</span> HR-PerfReview</div>
                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">Task Link:</span> Employee Evaluation</div>
                    <div className="col-span-2"><span className="font-semibold text-gray-700 dark:text-gray-300">Objectives:</span> Conduct quarterly performance reviews for all staff</div>
                    <div className="col-span-2"><span className="font-semibold text-gray-700 dark:text-gray-300">KPIs:</span> Review completion 100% · Feedback turnaround &lt; 7 days</div>
                  </div>
                  <div className="border-t border-rose-100 dark:border-rose-800 pt-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Pipeline Tasks:</p>
                    <ul className="grid grid-cols-2 gap-x-4 text-xs text-gray-500 dark:text-gray-400">
                      {["Self-Assessment Collection","Manager Evaluations","Peer Reviews","Performance Scoring","Feedback Meetings","Promotion/Increment Decisions","HR Report Submission"].map(t => <li key={t} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>{t}</li>)}
                    </ul>
                  </div>
                </div>

              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">Pipeline Flow Architecture</h4>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg flex justify-center w-full min-w-full overflow-x-auto border border-gray-200 dark:border-gray-700">
                  <div ref={mermaidContainerRef} className="flex justify-center w-full min-h-[200px] items-center">
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </main>
  );
}
