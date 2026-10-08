"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import PipelineCard from "@/components/PipelineCard";
import { addTaskNode, addCycle } from "@/actions";
import WorkflowGuide from "./WorkflowGuide";
import EditableTaskList from "./EditableTaskList";
import { PREDEFINED_PIPELINE_TASKS } from "@/utils/taskConstants";
import { Stat } from "@/components/ui/Stat";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import {
  CheckSquare,
  Clock,
  TrendingUp,
  Briefcase,
  Filter,
  Plus,
  Layers,
  FolderKanban,
  RotateCcw,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DevDashboardClient({
  projects,
  tasks,
  pipelines = [],
  cycles = [],
  avgPipelineProgress = 0,
  avgCycleTime = 0,
  selectedProjectId,
  chartData,
}: {
  projects: any[];
  tasks: any[];
  pipelines?: any[];
  cycles?: any[];
  avgPipelineProgress?: number | string;
  avgCycleTime?: number;
  selectedProjectId: string;
  chartData: any;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentProjectId, setCurrentProjectId] = useState(selectedProjectId || "all");
  const [taskProjectId, setTaskProjectId] = useState(
    selectedProjectId !== "all" ? selectedProjectId : projects[0]?._id || ""
  );
  const [sprintProjectId, setSprintProjectId] = useState(
    selectedProjectId !== "all" ? selectedProjectId : projects[0]?._id || ""
  );
  const [taskCategory, setTaskCategory] = useState<string>("Physical Goods & Hardware");

  useEffect(() => {
    setCurrentProjectId(selectedProjectId || "all");
    if (selectedProjectId && selectedProjectId !== "all") {
      setTaskProjectId(selectedProjectId);
      setSprintProjectId(selectedProjectId);
    } else if (projects.length > 0) {
      setTaskProjectId((prev: string) => prev || projects[0]._id);
      setSprintProjectId((prev: string) => prev || projects[0]._id);
    }
  }, [selectedProjectId, projects]);

  const handleProjectFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCurrentProjectId(val);
    if (val !== "all") {
      setTaskProjectId(val);
      setSprintProjectId(val);
    }
    router.push(`${pathname}?projectId=${val}`);
  };

  const hoursData = {
    labels: chartData.modules && chartData.modules.length > 0 ? chartData.modules : ["General"],
    datasets: [
      {
        label: "Estimated Hours",
        data: chartData.estimatedHoursData && chartData.estimatedHoursData.length > 0 ? chartData.estimatedHoursData : [0],
        backgroundColor: "#E1DFDD",
        hoverBackgroundColor: "#C8C6C4",
        borderRadius: 4,
      },
      {
        label: "Actual Hours",
        data: chartData.actualHoursData && chartData.actualHoursData.length > 0 ? chartData.actualHoursData : [0],
        backgroundColor: "#0078D4",
        hoverBackgroundColor: "#006CBE",
        borderRadius: 4,
      },
    ],
  };

  const severityData = {
    labels: ["Critical", "High", "Medium", "Low"],
    datasets: [
      {
        data: chartData.severity || [0, 0, 0, 0],
        backgroundColor: ["#D13438", "#F7630C", "#0078D4", "#107C10"],
      },
    ],
  };

  const statusData = {
    labels: ["Status Flow"],
    datasets: [
      { label: "Todo", data: [chartData.status[0]], backgroundColor: "#605E5C", borderRadius: 4 },
      { label: "In Progress", data: [chartData.status[1]], backgroundColor: "#0078D4", borderRadius: 4 },
      { label: "Code Review", data: [chartData.status[2]], backgroundColor: "#8764B8", borderRadius: 4 },
      { label: "Done", data: [chartData.status[3]], backgroundColor: "#107C10", borderRadius: 4 },
    ],
  };

  const activeProject = projects.find((p) => p._id === currentProjectId);

  return (
    <main className="flex flex-col min-w-0 p-0 sm:p-4 flex-1 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <header className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 sm:p-6 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg lg:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
              Production & Operations Delivery Hub
            </h1>
            <Badge tone="brand" size="sm">
              Universal Production
            </Badge>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
            Universal production tracking across physical goods manufacturing, service channel rollouts, creative design, and technical engineering.
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2 bg-[#F3F2F1] dark:bg-[#292827] px-3 py-1.5 rounded-[6px] border border-[#E1DFDD] dark:border-[#3B3A39] text-xs font-medium">
          <Filter className="w-4 h-4 text-[#0078D4]" />
          <span className="text-[#605E5C] dark:text-[#C8C6C4]">Context:</span>
          <select
            id="projectFilter"
            className="bg-transparent font-semibold cursor-pointer outline-none text-[#242424] dark:text-[#FFFFFF]"
            value={currentProjectId}
            onChange={handleProjectFilter}
          >
            <option value="all">All Projects (Global View)</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Production & Engineering Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          label="Total Tasks & Deliverables"
          value={`${tasks.length} Deliverables`}
          subtext={activeProject ? `Scoped to ${activeProject.name}` : "Across all projects"}
          icon={<CheckSquare className="w-5 h-5 text-[#0078D4]" />}
        />
        <Stat
          label="Avg Milestone Velocity"
          value={`${avgCycleTime} Days`}
          subtext="Based on milestone/batch cycle duration"
          icon={<Clock className="w-5 h-5 text-[#605E5C]" />}
        />
        <Stat
          label="Active Pipeline Progress"
          value={`${avgPipelineProgress}%`}
          subtext={`${pipelines.length} Active Production Pipelines`}
          icon={<Layers className="w-5 h-5 text-[#107C10]" />}
        />
        <Stat
          label="Production Hours Logged"
          value={`${chartData.totalHours} hrs`}
          subtext="Actual time invested across modules"
          icon={<Briefcase className="w-5 h-5 text-[#0078D4]" />}
        />
      </div>

      {/* Engineering Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Estimated vs Actual Hours */}
        <div className="lg:col-span-2 bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
          <h3 className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF] mb-1">
            Estimated vs. Actual Hours by Module
          </h3>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-4">
            Comparison between initial estimates and logged hours across architecture components.
          </p>
          <div className="h-60">
            <Bar
              data={hoursData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true, ticks: { precision: 0 } },
                },
              }}
            />
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
          <h3 className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF] mb-1">
            Task Severity Profile
          </h3>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-4">
            Critical, high, medium, and low priority tasks.
          </p>
          <div className="h-60 flex items-center justify-center">
            <Doughnut
              data={severityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%",
                plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } },
              }}
            />
          </div>
        </div>
      </div>

      {/* Status Flow Bar */}
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
        <h3 className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF] mb-1">
          Deliverable & Task Distribution by Status
        </h3>
        <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-4">
          Visual status breakdown across Backlog, In Progress, Review / QA, and Done.
        </p>
        <div className="h-28">
          <Bar
            data={statusData}
            options={{
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, display: false },
              },
            }}
          />
        </div>
      </div>

      {/* Creation Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Add Task Form */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
          <h3 className="font-bold text-sm text-[#242424] dark:text-[#FFFFFF] mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#0078D4]" /> Add Deliverable / Production Task
          </h3>
          <form action={addTaskNode} className="space-y-3">
            {/* Target Project Dropdown */}
            <div>
              <label className="text-[11px] font-semibold text-[#605E5C] dark:text-[#C8C6C4] block mb-1">
                Target Project *
              </label>
              <select
                name="projectId"
                value={taskProjectId}
                onChange={(e) => setTaskProjectId(e.target.value)}
                className="w-full p-2 rounded border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-xs text-[#242424] dark:text-[#FFFFFF] cursor-pointer"
                required
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
                {projects.length === 0 && (
                  <option value="">No projects available (Create a Project first)</option>
                )}
              </select>
            </div>

            {/* Production Domain Category */}
            <div>
              <label className="text-[11px] font-semibold text-[#605E5C] dark:text-[#C8C6C4] block mb-1">
                Production Domain
              </label>
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
                className="w-full p-2 rounded border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-xs text-[#242424] dark:text-[#FFFFFF] cursor-pointer"
              >
                {Object.keys(PREDEFINED_PIPELINE_TASKS).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <select
                name="pipelineId"
                className="flex-1 p-2 rounded border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-xs text-[#242424] dark:text-[#FFFFFF] cursor-pointer"
              >
                <option value="none">No Pipeline</option>
                {pipelines
                  .filter((p) => !taskProjectId || !p.projectId || p.projectId._id === taskProjectId || p.projectId === taskProjectId)
                  .map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
              </select>
              <select
                name="predefinedTask"
                className="flex-1 p-2 rounded border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-xs text-[#242424] dark:text-[#FFFFFF] cursor-pointer"
              >
                <option value="">Deliverable Preset...</option>
                {(PREDEFINED_PIPELINE_TASKS[taskCategory] || []).map((task: string) => (
                  <option key={task} value={task}>
                    {task}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="text"
              name="name"
              placeholder="Deliverable Title / Specification (e.g. Ergonomics Blueprint, Channel Rollout SOP)..."
              className="w-full p-2 rounded border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-xs text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
              required
            />

            <div className="flex gap-2">
              <input
                type="number"
                name="estimatedHours"
                placeholder="Est. Hours"
                className="w-full p-2 rounded border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-xs text-[#242424] dark:text-[#FFFFFF]"
              />
              <input
                type="number"
                name="actualHours"
                placeholder="Actual Hours"
                className="w-full p-2 rounded border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-xs text-[#242424] dark:text-[#FFFFFF]"
              />
            </div>

            <div className="flex gap-2">
              <select
                name="status"
                className="w-full p-2 rounded border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-xs text-[#242424] dark:text-[#FFFFFF] cursor-pointer"
              >
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Code Review">Review / QA Verification</option>
                <option value="Done">Done</option>
              </select>
              <select
                name="severity"
                className="w-full p-2 rounded border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-xs text-[#242424] dark:text-[#FFFFFF] cursor-pointer"
              >
                <option value="low">Low Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="high">High Severity</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#605E5C] dark:text-[#C8C6C4] block mb-1">
                Milestone, Batch or Sprint (Optional)
              </label>
              <select
                name="cycleId"
                className="w-full p-2 rounded border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-xs text-[#242424] dark:text-[#FFFFFF] cursor-pointer"
              >
                <option value="none">No Milestone / Batch (Backlog / General)</option>
                {cycles
                  .filter((c) => !taskProjectId || !c.project || c.project === taskProjectId)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={projects.length === 0}
              className="w-full py-2 bg-[#0078D4] hover:bg-[#006CBE] text-white rounded text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {projects.length === 0 ? "No Projects Available" : "Create Production Task"}
            </button>
          </form>
        </div>

        {/* Add Sprint Cycle Form */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
          <h3 className="font-bold text-sm text-[#242424] dark:text-[#FFFFFF] mb-3 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#107C10]" /> Define Milestone, Batch or Sprint
          </h3>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-3">
            Group deliverables into time-boxed manufacturing batches, service channel rollouts, or development sprints.
          </p>
          <form action={addCycle} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-[#605E5C] dark:text-[#C8C6C4] block mb-1">
                Target Project *
              </label>
              <select
                name="projectId"
                value={sprintProjectId}
                onChange={(e) => setSprintProjectId(e.target.value)}
                className="w-full p-2 rounded border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-xs text-[#242424] dark:text-[#FFFFFF] cursor-pointer"
                required
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
                {projects.length === 0 && (
                  <option value="">No projects available (Create a Project first)</option>
                )}
              </select>
            </div>

            <input
              type="text"
              name="name"
              placeholder="Milestone / Batch Name (e.g. Batch 01 - Tooling & BOM, Phase 2 - Regional Rollout, Sprint 24)..."
              className="w-full p-2 rounded border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-xs text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
              required
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4] block mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  className="w-full p-2 rounded border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-xs text-[#242424] dark:text-[#FFFFFF]"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4] block mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  className="w-full p-2 rounded border border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#292827] text-xs text-[#242424] dark:text-[#FFFFFF]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={projects.length === 0}
              className="w-full py-2 bg-[#107C10] hover:bg-[#0F7010] text-white rounded text-xs font-semibold disabled:opacity-50 transition-colors mt-4"
            >
              {projects.length === 0 ? "No Projects Available" : "Launch Milestone / Sprint"}
            </button>
          </form>
        </div>
      </div>

      {/* Editable Tasks Table */}
      <div className="mb-8 px-4">
        <h3 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF] mb-3">
          Interactive Task Backlog & Execution
        </h3>
        <EditableTaskList tasks={tasks} pipelines={pipelines} cycles={cycles} />
      </div>

      {/* Pipeline Cards Grid with Big Look Modal */}
      <div className="mb-8 px-4">
        <h3 className="font-bold text-base text-[#242424] dark:text-[#FFFFFF] mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#0078D4]" />
          Production Pipelines ({pipelines.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines.map((p) => (
            <PipelineCard key={p._id} pipeline={p} />
          ))}
          {pipelines.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-[#A19F9D] border border-dashed border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px]">
              No production pipelines found for this context.
            </div>
          )}
        </div>
      </div>

      {/* Workflow Guide */}
      <WorkflowGuide />
    </main>
  );
}
