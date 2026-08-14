"use client";

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
import { addDeal } from "@/actions";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function RevenueDashboardClient({
  deals,
  targets,
}: {
  deals: any[];
  targets: any[];
}) {
  const pipelineData = {
    labels: ["Prospect", "Initial Analysis", "Due Diligence", "Signing & Closing", "Integration"],
    datasets: [
      { label: "High Value", data: [50, 40, 30, 20, 10], backgroundColor: "#3b82f6" },
      { label: "Mid Value", data: [80, 60, 40, 30, 20], backgroundColor: "#10b981" },
      { label: "Low Value", data: [120, 90, 70, 50, 40], backgroundColor: "#6366f1" },
    ],
  };

  const regionData = {
    labels: ["North America", "Europe", "APAC", "LATAM"],
    datasets: [
      {
        data: [45, 25, 20, 10],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#6366f1"],
      },
    ],
  };

  const industryData = {
    labels: ["SaaS / Software", "FinTech", "Healthcare IT", "E-commerce", "AI / ML"],
    datasets: [
      {
        label: "Target Count",
        data: [15, 12, 8, 10, 5],
        backgroundColor: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6"],
      },
    ],
  };

  return (
    <main className="main-dashboard p-6 flex-1">
      <header className="dashboard-banner glass-card p-6 rounded-lg mb-6 border-l-4 border-amber-500 flex justify-between items-center">
        <div>
          <h1 className="list-heading text-3xl font-bold text-[var(--text-primary)]">Revenue Management</h1>
          <div className="date-badge mt-2 text-sm text-[var(--text-muted)] flex items-center gap-2">
            <i className="fa-solid fa-dollar-sign"></i> Financial Targets Overview
          </div>
        </div>
        <div className="storage-tag px-3 py-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full text-sm font-medium text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
          Active
        </div>
      </header>

      {/* Data Entry Forms */}
      <div className="flex flex-wrap gap-6 mb-6">
        <div className="glass-card p-5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] flex-1">
          <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Add New Deal</h4>
          <form action={addDeal} className="flex gap-2 flex-wrap items-center">
            <input type="text" name="name" className="flex-1 min-w-[150px] p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]" placeholder="Deal Name" required />
            <input type="number" name="amount" className="w-32 p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]" placeholder="Amount ($)" required />
            <select name="stage" className="w-40 p-2 rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)]">
              <option value="Prospect">Prospect</option>
              <option value="Initial Analysis">Initial Analysis</option>
              <option value="Due Diligence">Due Diligence</option>
              <option value="Signing & Closing">Signing & Closing</option>
              <option value="Integration">Integration</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors">Add Deal</button>
          </form>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="glass-card p-5 text-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h4 className="text-[var(--text-muted)] mb-2 text-sm">New Targets (30 Days)</h4>
          <h2 className="text-3xl font-bold text-blue-500">50</h2>
        </div>
        <div className="glass-card p-5 text-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h4 className="text-[var(--text-muted)] mb-2 text-sm">Targets in Analysis</h4>
          <h2 className="text-3xl font-bold text-emerald-500">12</h2>
        </div>
        <div className="glass-card p-5 text-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h4 className="text-[var(--text-muted)] mb-2 text-sm">Targets in Signing</h4>
          <h2 className="text-3xl font-bold text-amber-500">6</h2>
        </div>
        <div className="glass-card p-5 text-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h4 className="text-[var(--text-muted)] mb-2 text-sm">Contribution (Closed)</h4>
          <h2 className="text-3xl font-bold text-violet-500">$160m</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-card p-5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] md:col-span-2">
          <h3 className="text-md font-semibold mb-4 text-[var(--text-primary)]">Pipeline Revenue by Deal Stage & Lead ($m)</h3>
          <div className="h-72">
            <Bar data={pipelineData} options={{ indexAxis: "y", responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
          <h3 className="text-md font-semibold mb-4 text-[var(--text-primary)]">Target Count by Region</h3>
          <div className="h-72">
            <Doughnut data={regionData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="glass-card p-5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] mb-6">
        <h3 className="text-md font-semibold mb-4 text-[var(--text-primary)]">Target Count by Industry / Vertical</h3>
        <div className="h-64">
          <Bar data={industryData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} />
        </div>
      </div>
    </main>
  );
}
