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
  selectedProjectId,
  chartData,
}: {
  projects: any[];
  tasks: any[];
  selectedProjectId: string;
  chartData: any;
}) {
  const router = useRouter();

  const handleProjectFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/dev/dashboard?projectId=${e.target.value}`);
  };

  const hoursData = {
    labels: ["M1", "M2", "M3", "M4", "M5", "M6"],
    datasets: [
      {
        label: "Estimated Hours",
        data: [896, 593, 576, 550, 493, 700],
        backgroundColor: "#e2e8f0",
        hoverBackgroundColor: "#cbd5e1",
      },
      {
        label: "Actual Hours",
        data: [754, 591, 545, 423, 548, 680],
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
    <main className="main-dashboard p-6 flex-1">
      <header className="dashboard-banner glass-card p-6 rounded-lg mb-6 flex justify-between items-center">
        <div>
          <h1 className="list-heading text-3xl font-bold text-[var(--text-primary)]">Development Workflow</h1>
          <div className="date-badge mt-2 text-sm text-[var(--text-muted)] flex items-center gap-2">
            <i className="fa-regular fa-calendar-alt"></i>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
        <div className="storage-tag px-3 py-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full text-sm font-medium text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
          Active
        </div>
      </header>

      <div className="mb-6">
        <label htmlFor="projectFilter" className="text-[var(--text-muted)] text-sm font-bold block mb-2">
          Active Project Context:
        </label>
        <select
          id="projectFilter"
          className="priority-select w-72 p-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]"
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
        <div className="glass-card p-5 text-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h4 className="text-[var(--text-muted)] mb-2 text-sm">Total Tasks</h4>
          <h2 className="text-2xl font-bold m-0">{tasks.length}</h2>
        </div>
        <div className="glass-card p-5 text-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h4 className="text-[var(--text-muted)] mb-2 text-sm">Avg Cycle Time</h4>
          <h2 className="text-2xl font-bold m-0">5 Days</h2>
        </div>
        <div className="glass-card p-5 text-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h4 className="text-[var(--text-muted)] mb-2 text-sm">Project Completion Rate</h4>
          <h2 className="text-2xl font-bold m-0">58.8%</h2>
        </div>
        <div className="glass-card p-5 text-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h4 className="text-[var(--text-muted)] mb-2 text-sm">Billable Hours</h4>
          <h2 className="text-2xl font-bold m-0">{chartData.totalHours}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-card p-5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] md:col-span-2">
          <h3 className="text-md font-semibold mb-4 text-[var(--text-primary)]">Estimated vs Actual Work Hours</h3>
          <div className="h-64">
            <Bar data={hoursData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h3 className="text-md font-semibold mb-4 text-[var(--text-primary)]">Task Distribution by Severity</h3>
          <div className="h-64">
            <Doughnut
              data={severityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "75%",
                plugins: { legend: { position: "right", labels: { boxWidth: 10, usePointStyle: true } } },
              }}
            />
          </div>
        </div>
      </div>

      <div className="glass-card p-5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
        <h3 className="text-md font-semibold mb-4 text-[var(--text-primary)]">Incomplete Tasks by Status</h3>
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
    </main>
  );
}
