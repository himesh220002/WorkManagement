"use client";

import { useRouter } from "next/navigation";
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
  avgPipelineProgress = 0,
  avgCycleTime = 0,
  selectedProjectId,
  chartData,
}: {
  projects: any[];
  tasks: any[];
  pipelines?: any[];
  avgPipelineProgress?: number | string;
  avgCycleTime?: number;
  selectedProjectId: string;
  chartData: any;
}) {
  const router = useRouter();

  const handleProjectFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/dev/dashboard?projectId=${e.target.value}`);
  };

  const hoursData = {
    labels: chartData.modules && chartData.modules.length > 0 ? chartData.modules : ["No Data"],
    datasets: [
      {
        label: "Estimated Hours",
        data: chartData.estimatedHoursData && chartData.estimatedHoursData.length > 0 ? chartData.estimatedHoursData : [0],
        backgroundColor: "#e2e8f0",
        hoverBackgroundColor: "#cbd5e1",
      },
      {
        label: "Actual Hours",
        data: chartData.actualHoursData && chartData.actualHoursData.length > 0 ? chartData.actualHoursData : [0],
        backgroundColor: "#3b82f6",
        hoverBackgroundColor: "#2563eb",
      },
    ],
  };

  const severityData = {
    labels: ["Critical", "High", "Medium", "Low"],
    datasets: [
      {
        data: chartData.severity,
        backgroundColor: ["#ef4444", "#f97316", "#eab308", "#22c55e"],
      },
    ],
  };

  const statusData = {
    labels: ["Tasks"],
    datasets: [
      { label: "Open", data: [chartData.status[0]], backgroundColor: "#94a3b8" },
      { label: "In Progress", data: [chartData.status[1]], backgroundColor: "#3b82f6" },
      { label: "Code Review", data: [chartData.status[2]], backgroundColor: "#8b5cf6" },
      { label: "Validated", data: [chartData.status[3]], backgroundColor: "#10b981" },
    ],
  };

  return (
    <main className="p-4 md:p-6 flex-1 flex flex-col min-w-0">
      <header className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Development Workflow</h1>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
            <i className="fa-regular fa-calendar-alt"></i>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
        <div className="px-3 py-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-2"></span>
          Active
        </div>
      </header>

      <div className="mb-6">
        <label htmlFor="projectFilter" className="text-gray-500 dark:text-gray-400 text-sm font-bold block mb-2">
          Active Project Context:
        </label>
        <select
          id="projectFilter"
          className="w-72 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
          value={selectedProjectId}
          onChange={handleProjectFilter}
        >
          <option value="all">🌍 All Projects (Global View)</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              🚀 {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm font-medium">Total Tasks</h4>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 m-0">{tasks.length}</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm font-medium">Avg Cycle Time</h4>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 m-0">{avgCycleTime} Days</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm font-medium">Global Pipeline Progress</h4>
          <h2 className="text-3xl font-bold text-blue-600 m-0">{avgPipelineProgress}%</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm font-medium">Billable Hours</h4>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 m-0">{chartData.totalHours}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 md:col-span-2">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Estimated vs Actual Work Hours</h3>
          <div className="h-64">
            <Bar data={hoursData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Task Distribution by Severity</h3>
          <div className="h-64">
            <Doughnut
              data={severityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "75%",
                plugins: { legend: { position: "right", labels: { boxWidth: 10, usePointStyle: true, color: 'inherit' } } },
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 mb-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Incomplete Tasks by Status</h3>
        <div className="h-40">
          <Bar
            data={statusData}
            options={{
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, display: false } },
            }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <i className="fa-solid fa-layer-group text-blue-600"></i> Active Development Pipelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines.map((pipeline: any) => (
            <PipelineCard key={pipeline._id} pipeline={pipeline} />
          ))}
          {pipelines.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400 py-6">No active development pipelines found. Head to Parallel Pipeline to create one.</div>
          )}
        </div>
      </div>
    </main>
  );
}
