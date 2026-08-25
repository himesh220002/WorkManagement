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
import { addResourceAllocation } from "@/actions";
import { useMemo } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function ResourceDashboardClient({
  resources,
  projects,
}: {
  resources: any[];
  projects: any[];
}) {
  const budgetResources = resources.filter(r => r.type === "Budget");
  const headcountResources = resources.filter(r => r.type === "Headcount");

  const totalBudgetAllocated = budgetResources.reduce((sum, r) => sum + (r.totalAllocated || 0), 0);
  const totalBudgetUsed = budgetResources.reduce((sum, r) => sum + (r.totalUsed || 0), 0);
  
  const totalHeadcountAllocated = headcountResources.reduce((sum, r) => sum + (r.totalAllocated || 0), 0);
  const totalHeadcountUsed = headcountResources.reduce((sum, r) => sum + (r.totalUsed || 0), 0);

  // Budget Utilization Chart
  const budgetChartData = useMemo(() => {
    return {
      labels: budgetResources.map(r => r.name),
      datasets: [
        {
          label: "Allocated ($)",
          data: budgetResources.map(r => r.totalAllocated),
          backgroundColor: "#3b82f6",
        },
        {
          label: "Used ($)",
          data: budgetResources.map(r => r.totalUsed),
          backgroundColor: "#f59e0b",
        },
      ],
    };
  }, [budgetResources]);

  // Headcount Chart
  const headcountChartData = useMemo(() => {
    return {
      labels: headcountResources.map(r => r.name),
      datasets: [
        {
          data: headcountResources.map(r => r.totalUsed),
          backgroundColor: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"],
        },
      ],
    };
  }, [headcountResources]);

  return (
    <main className="flex flex-col min-w-0 p-6 flex-1">
      <header className="glass-card p-6 mb-6 border-l-4 border-indigo-500 flex justify-between items-center neon-border-purple">
        <div>
          <h1 className="text-3xl font-bold glow-text-purple">Resource Management</h1>
          <div className="date-badge mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <i className="fa-solid fa-scale-balanced"></i> Allocations, Budgets & Risks
          </div>
        </div>
        <div className="storage-tag px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block mr-2"></span>
          Strategic View
        </div>
      </header>

      {/* Data Entry Form */}
      <div className="glass-card p-5 mb-6">
        <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Allocate Resource</h4>
        <form action={addResourceAllocation} className="flex gap-3 flex-wrap items-center">
          <input type="text" name="name" className="tech-input flex-1 min-w-[150px]" placeholder="Resource Name (e.g. Q4 Cloud Budget)" required />
          <select name="type" className="tech-input w-32 cursor-pointer">
            <option value="Budget">Budget</option>
            <option value="Headcount">Headcount</option>
            <option value="Infrastructure">Infrastructure</option>
          </select>
          <input type="number" name="totalAllocated" className="tech-input w-28" placeholder="Allocated" required />
          <input type="number" name="totalUsed" className="tech-input w-28" placeholder="Used" required />
          
          <select name="riskLevel" className="tech-input w-32 cursor-pointer">
            <option value="Low">Risk: Low</option>
            <option value="Medium">Risk: Medium</option>
            <option value="High">Risk: High</option>
          </select>
          <select name="assignedToProjectId" className="tech-input w-40 cursor-pointer">
            <option value="">Unassigned</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 bg-indigo-500 text-white rounded-lg shadow-sm hover:bg-indigo-600 transition-colors font-semibold">Allocate</button>
        </form>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="glass-card p-5 text-center transition-all hover:neon-border-blue group">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm font-semibold">Total Budget Allocated</h4>
          <h2 className="text-3xl font-bold text-blue-500 group-hover:scale-110 transition-transform">${totalBudgetAllocated.toLocaleString()}</h2>
        </div>
        <div className="glass-card p-5 text-center transition-all hover:neon-border-amber group">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm font-semibold">Total Budget Used</h4>
          <h2 className="text-3xl font-bold text-amber-500 group-hover:scale-110 transition-transform">${totalBudgetUsed.toLocaleString()}</h2>
        </div>
        <div className="glass-card p-5 text-center transition-all hover:neon-border-indigo group">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm font-semibold">Headcount Allocated</h4>
          <h2 className="text-3xl font-bold text-indigo-500 group-hover:scale-110 transition-transform">{totalHeadcountAllocated}</h2>
        </div>
        <div className="glass-card p-5 text-center transition-all hover:neon-border-emerald group">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm font-semibold">Headcount Active</h4>
          <h2 className="text-3xl font-bold text-emerald-500 group-hover:scale-110 transition-transform">{totalHeadcountUsed}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-card p-5 md:col-span-2 hover:neon-border-blue transition-all">
          <h3 className="text-md font-semibold mb-4 text-gray-900 dark:text-gray-100">Budget Utilization Tracking ($)</h3>
          <div className="h-72">
            <Bar data={budgetChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="glass-card p-5 hover:neon-border-purple transition-all">
          <h3 className="text-md font-semibold mb-4 text-gray-900 dark:text-gray-100">Headcount Deployment</h3>
          <div className="h-72">
            <Doughnut data={headcountChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="glass-card p-5 hover:neon-border-emerald transition-all">
        <h3 className="text-md font-semibold mb-4 text-gray-900 dark:text-gray-100">Resource Allocation Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Resource Name</th>
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Type</th>
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Project / Team</th>
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Allocated</th>
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Used</th>
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Burn / Utilization</th>
                <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Risk</th>
              </tr>
            </thead>
            <tbody>
              {resources.length > 0 ? resources.map((r, i) => {
                const burnRate = r.totalAllocated > 0 ? Math.round((r.totalUsed / r.totalAllocated) * 100) : 0;
                return (
                  <tr key={i} className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-sm font-medium text-gray-900 dark:text-gray-100">{r.name}</td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        r.type === 'Budget' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        r.type === 'Headcount' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-900 dark:text-gray-100">{r.assignedToProjectName}</td>
                    <td className="p-3 text-sm text-gray-900 dark:text-gray-100">{r.type === 'Budget' ? `$${r.totalAllocated.toLocaleString()}` : r.totalAllocated}</td>
                    <td className="p-3 text-sm text-gray-900 dark:text-gray-100">{r.type === 'Budget' ? `$${r.totalUsed.toLocaleString()}` : r.totalUsed}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full ${burnRate > 90 ? 'bg-red-500' : burnRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(burnRate, 100)}%` }}></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{burnRate}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        r.riskLevel === 'High' ? 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' :
                        r.riskLevel === 'Medium' ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' :
                        'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {r.riskLevel}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="p-4 text-center text-gray-500 dark:text-gray-400">No resources allocated yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
