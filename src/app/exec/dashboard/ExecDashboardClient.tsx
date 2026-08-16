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
import PipelineCard from "@/components/PipelineCard";

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

import { addGoal, deleteGoal, updateGoal } from "@/actions";
import { useState } from "react";

export default function ExecDashboardClient({ cleanPipelines, goals = [], chartData }: { cleanPipelines: any[], goals?: any[], chartData?: any }) {
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Use real data if provided, fallback to defaults
  const m = chartData || {
    salesMetrics: { leads: 500, qualified: 250, proposal: 100, closedWon: 45 },
    devMetrics: { todo: 45, inProgress: 52, blocked: 38, done: 60 },
    hrMetrics: { engineering: 45, sales: 20, operations: 15, other: 10 },
    mrrMetrics: [120000, 135000, 125000, 150000, 180000, 210000]
  };

  const financeData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "MRR ($)",
        data: m.mrrMetrics,
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
        data: [m.salesMetrics.leads, m.salesMetrics.qualified, m.salesMetrics.proposal, m.salesMetrics.closedWon],
        backgroundColor: ["#e5e7eb", "#93c5fd", "#3b82f6", "#1d4ed8"],
      },
    ],
  };

  const devData = {
    labels: ["Todo", "In Progress", "Blocked", "Done"],
    datasets: [
      {
        label: "Tasks Count",
        data: [m.devMetrics.todo, m.devMetrics.inProgress, m.devMetrics.blocked, m.devMetrics.done],
        backgroundColor: "#8b5cf6",
        borderRadius: 4,
      },
    ],
  };

  const hrData = {
    labels: ["Engineering", "Sales", "Operations", "Other"],
    datasets: [
      {
        data: [m.hrMetrics.engineering, m.hrMetrics.sales, m.hrMetrics.operations, m.hrMetrics.other],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#6b7280"],
      },
    ],
  };

  return (
    <main className="flex flex-col min-w-0 p-6 flex-1">
      <header className=" flex justify-between items-center mb-8">
        <div>
          <h1 className=" text-3xl font-bold text-gray-900 dark:text-gray-100">Strategic & Executive Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Consolidated view of finance, sales, HR, and operations KPIs.
          </p>
        </div>
        <div className="storage-tag px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
          Active
        </div>
      </header>

      {/* Company OKRs / Goals */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-gray-900 dark:text-gray-100 font-semibold">Strategic Goals & OKRs</h2>
        </div>
        
        <form action={addGoal} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 mb-6 flex gap-4 flex-wrap items-center">
          <input
            type="text"
            name="title"
            className="flex-1 min-w-[200px] p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
            placeholder="New Goal Title (e.g. Q3 Market Expansion)..."
            required
          />
          <input
            type="text"
            name="description"
            className="flex-1 min-w-[200px] p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
            placeholder="Key Result / Description..."
          />
          <select name="category" className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm">
            <option value="Company">Company</option>
            <option value="Department">Department</option>
            <option value="Team">Team</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors flex items-center gap-2 text-sm font-medium">
            <i className="fa-solid fa-bullseye"></i> Set Goal
          </button>
        </form>

        <div className="kpi-grid grid grid-cols-1 md:grid-cols-3 gap-6">
          {goals.length > 0 ? goals.map((goal) => {
            let color = "emerald-500";
            if (goal.progress < 50) color = "blue-500";
            if (goal.progress < 25) color = "rose-500";
            if (goal.status === "Behind") color = "rose-500";
            
            return (
              <div key={goal._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm kpi-card p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative overflow-hidden flex flex-col h-full">
                <div className="absolute top-0 right-0 p-2 text-xs font-semibold text-gray-400">{goal.category}</div>
                
                {editingGoalId === goal._id ? (
                  <form action={async (formData) => {
                    await updateGoal(formData);
                    setEditingGoalId(null);
                  }} className="flex flex-col gap-2 mt-4 z-10 relative bg-white dark:bg-gray-800">
                    <input type="hidden" name="goalId" value={goal._id} />
                    <input type="text" name="title" defaultValue={goal.title} className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-semibold" required />
                    <input type="text" name="description" defaultValue={goal.description} className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                    <select name="category" defaultValue={goal.category} className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                      <option value="Company">Company</option>
                      <option value="Department">Department</option>
                      <option value="Team">Team</option>
                    </select>
                    <div className="flex gap-2 justify-end mt-2">
                      <button type="button" onClick={() => setEditingGoalId(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Cancel</button>
                      <button type="submit" className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors">Save</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1 pr-16 relative z-10">
                      <div className="kpi-title text-sm text-gray-600 dark:text-gray-300 font-semibold truncate">{goal.title}</div>
                      <button onClick={() => setEditingGoalId(goal._id)} className="text-gray-400 hover:text-emerald-500 transition-colors p-1" title="Edit Goal">
                        <i className="fa-solid fa-pen text-xs"></i>
                      </button>
                    </div>
                    <div className={`kpi-value text-2xl font-bold text-${color} relative z-10`}>{goal.progress}%</div>
                    <div className="progress-bar-bg w-full h-2 bg-gray-200 dark:bg-gray-700 rounded mt-3 relative z-10">
                      <div className={`h-full bg-${color} rounded`} style={{ width: `${goal.progress}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center mt-auto pt-4 relative z-10">
                      <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 flex-1 pr-2">{goal.description || "No specific key result description"}</div>
                      <form action={deleteGoal} className="m-0 flex" onSubmit={(e) => { if (!window.confirm("Are you sure you want to delete this Goal and all its connected Targets?")) e.preventDefault(); }}>
                        <input type="hidden" name="goalId" value={goal._id.toString()} />
                        <button type="submit" className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer" title="Delete Goal">
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            );
          }) : (
            <div className="col-span-full py-6 text-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
              No Goals Set. Create your first OKR above!
            </div>
          )}
        </div>
      </div>

      {/* Cross-Department Rollup Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Finance Rollup */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="text-md font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Finance & Revenue (MRR)
            <i className="fa-solid fa-circle-info text-gray-400 text-sm cursor-help" title="Projected Monthly Recurring Revenue based on Closed Won Deals"></i>
          </h3>
          <div className="h-52">
            <Line data={financeData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* Sales Rollup */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="text-md font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Sales Pipeline Conversion
            <i className="fa-solid fa-circle-info text-gray-400 text-sm cursor-help" title="Aggregate count of deals across the different pipeline stages"></i>
          </h3>
          <div className="h-52">
            <Bar data={salesData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* Dev/Engineering Rollup */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="text-md font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Engineering Velocity (Points)
            <i className="fa-solid fa-circle-info text-gray-400 text-sm cursor-help" title="Current distribution of task statuses across all development projects"></i>
          </h3>
          <div className="h-52">
            <Bar data={devData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* HR/Ops Rollup */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="text-md font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Headcount & Capacity
            <i className="fa-solid fa-circle-info text-gray-400 text-sm cursor-help" title="Total registered users grouped by their assigned roles"></i>
          </h3>
          <div className="h-52">
            <Doughnut data={hrData} options={{ responsive: true, maintainAspectRatio: false, cutout: "70%", plugins: { legend: { position: "right" } } }} />
          </div>
        </div>
      </div>
      <div className="mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <i className="fa-solid fa-layer-group text-blue-600"></i> Global Strategic Pipelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cleanPipelines.map((pipeline: any) => (
            <PipelineCard key={pipeline._id} pipeline={pipeline} />
          ))}
          {cleanPipelines.length === 0 && (
            <div className="col-span-full py-10 text-center text-gray-500 dark:text-gray-400">
              No active pipelines found across the company.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
