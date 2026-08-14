"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ExecDashboard() {
  const financeData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "MRR ($k)",
        data: [120, 135, 125, 150, 180, 210],
        borderColor: "#10b981",
        tension: 0.4,
        fill: true,
        backgroundColor: "rgba(16, 185, 129, 0.1)",
      },
    ],
  };

  const salesData = {
    labels: ["Leads", "Qualified", "Proposal", "Closed Won"],
    datasets: [
      {
        label: "Count",
        data: [500, 250, 100, 45],
        backgroundColor: ["#e5e7eb", "#93c5fd", "#3b82f6", "#1d4ed8"],
      },
    ],
  };

  const devData = {
    labels: ["Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4"],
    datasets: [
      {
        label: "Story Points Completed",
        data: [45, 52, 38, 60],
        backgroundColor: "#8b5cf6",
        borderRadius: 4,
      },
    ],
  };

  const hrData = {
    labels: ["Engineering", "Sales", "Operations", "G&A"],
    datasets: [
      {
        data: [45, 20, 15, 10],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#6b7280"],
      },
    ],
  };

  return (
    <main className="main-dashboard p-6 flex-1">
      <header className="dashboard-banner flex justify-between items-center mb-8">
        <div>
          <h1 className="list-heading text-3xl font-bold text-[var(--text-primary)]">Strategic & Executive Dashboard</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Consolidated view of finance, sales, HR, and operations KPIs.
          </p>
        </div>
        <div className="storage-tag px-3 py-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full text-sm font-medium text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
          Active
        </div>
      </header>

      {/* Company OKRs */}
      <div className="mb-8">
        <h2 className="text-xl mb-4 text-[var(--text-primary)] font-semibold">Q3 Company OKRs</h2>
        <div className="kpi-grid grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card kpi-card p-4 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
            <div className="kpi-title text-sm text-[var(--text-secondary)] mb-1">Objective 1: Market Expansion</div>
            <div className="kpi-value text-2xl font-bold text-emerald-500">72%</div>
            <div className="progress-bar-bg w-full h-2 bg-gray-200 rounded mt-3">
              <div className="h-full bg-emerald-500 rounded" style={{ width: "72%" }}></div>
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-2">Key Result: Launch in 3 new EU regions</div>
          </div>
          <div className="glass-card kpi-card p-4 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
            <div className="kpi-title text-sm text-[var(--text-secondary)] mb-1">Objective 2: Product Innovation</div>
            <div className="kpi-value text-2xl font-bold text-blue-500">45%</div>
            <div className="progress-bar-bg w-full h-2 bg-gray-200 rounded mt-3">
              <div className="h-full bg-blue-500 rounded" style={{ width: "45%" }}></div>
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-2">Key Result: Release Enterprise Dashboard Suite</div>
          </div>
          <div className="glass-card kpi-card p-4 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
            <div className="kpi-title text-sm text-[var(--text-secondary)] mb-1">Objective 3: Financial Efficiency</div>
            <div className="kpi-value text-2xl font-bold text-violet-500">90%</div>
            <div className="progress-bar-bg w-full h-2 bg-gray-200 rounded mt-3">
              <div className="h-full bg-violet-500 rounded" style={{ width: "90%" }}></div>
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-2">Key Result: Reduce OPEX by 15%</div>
          </div>
        </div>
      </div>

      {/* Cross-Department Rollup Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Finance Rollup */}
        <div className="glass-card p-5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h3 className="text-md font-semibold mb-4 border-b border-[var(--glass-border)] pb-2 text-[var(--text-primary)]">
            Finance & Revenue (MRR)
          </h3>
          <div className="h-52">
            <Line data={financeData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* Sales Rollup */}
        <div className="glass-card p-5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h3 className="text-md font-semibold mb-4 border-b border-[var(--glass-border)] pb-2 text-[var(--text-primary)]">
            Sales Pipeline Conversion
          </h3>
          <div className="h-52">
            <Bar data={salesData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* Dev/Engineering Rollup */}
        <div className="glass-card p-5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h3 className="text-md font-semibold mb-4 border-b border-[var(--glass-border)] pb-2 text-[var(--text-primary)]">
            Engineering Velocity (Points)
          </h3>
          <div className="h-52">
            <Bar data={devData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* HR/Ops Rollup */}
        <div className="glass-card p-5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h3 className="text-md font-semibold mb-4 border-b border-[var(--glass-border)] pb-2 text-[var(--text-primary)]">
            Headcount & Capacity
          </h3>
          <div className="h-52">
            <Doughnut data={hrData} options={{ responsive: true, maintainAspectRatio: false, cutout: "70%", plugins: { legend: { position: "right" } } }} />
          </div>
        </div>
      </div>
    </main>
  );
}
