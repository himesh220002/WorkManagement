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
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { addDeal, addPipeline } from "@/actions";
import PipelineCard from "@/components/PipelineCard";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
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

export default function RevenueDashboardClient({
  deals,
  targets,
  pipelines = [],
  options = { projects: [], teams: [], tasks: [], users: [] },
}: {
  deals: any[];
  targets: any[];
  pipelines?: any[];
  options?: { projects: any[]; teams: any[]; tasks: any[]; users: any[] };
}) {
  // KPI Calculations
  const dealsInProspect = deals?.filter(d => d.stage === "Prospect").length || 0;
  const dealsInAnalysis = deals?.filter(d => d.stage === "Initial Analysis" || d.stage === "Due Diligence").length || 0;
  const dealsInClosing = deals?.filter(d => d.stage === "Signing & Closing" || d.stage === "Closing").length || 0;
  const revenueClosed = deals?.filter(d => d.stage === "Closed" || d.stage === "Integration").reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

  // Pipeline Data (Revenue by Deal Stage)
  const pipelineData = useMemo(() => {
    const stages = ["Prospect", "Initial Analysis", "Due Diligence", "Closing", "Signing & Closing", "Closed", "Integration"];
    const stageRevenue = stages.map(stage => {
      return deals?.filter(d => d.stage === stage).reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
    });

    return {
      labels: stages,
      datasets: [
        { 
          label: "Deal Revenue ($)", 
          data: stageRevenue, 
          backgroundColor: "#3b82f6" 
        },
      ],
    };
  }, [deals]);

  // Target Count by Region
  const regionData = useMemo(() => {
    const regionCounts = targets?.reduce((acc: any, t) => {
      const r = t.region || "Unassigned";
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});
    
    const regions = Object.keys(regionCounts || {});
    return {
      labels: regions.length > 0 ? regions : ["No Data"],
      datasets: [
        {
          data: regions.length > 0 ? regions.map(r => regionCounts[r]) : [0],
          backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#06b6d4", "#8b5cf6"],
        },
      ],
    };
  }, [targets]);

  // Target Count by Industry
  const industryData = useMemo(() => {
    const industryCounts = targets?.reduce((acc: any, t) => {
      const ind = t.industry || "Unassigned";
      acc[ind] = (acc[ind] || 0) + 1;
      return acc;
    }, {});

    const industries = Object.keys(industryCounts || {});
    return {
      labels: industries.length > 0 ? industries : ["No Data"],
      datasets: [
        {
          label: "Target Count",
          data: industries.length > 0 ? industries.map(ind => industryCounts[ind]) : [0],
          backgroundColor: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6"],
        },
      ],
    };
  }, [targets]);

  return (
    <main className="flex flex-col min-w-0 p-6 flex-1">
      <header className=" bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 rounded-lg mb-6 border-l-4 border-amber-500 flex justify-between items-center">
        <div>
          <h1 className=" text-3xl font-bold text-gray-900 dark:text-gray-100">Revenue Management</h1>
          <div className="date-badge mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <i className="fa-solid fa-dollar-sign"></i> Deals & Target Revenue Tracking
          </div>
        </div>
        <div className="storage-tag px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
          Active
        </div>
      </header>

      {/* Data Entry Forms */}
      <div className="flex flex-wrap lg:flex-nowrap gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 flex-1">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Add New Deal</h4>
          <form action={addDeal} className="flex gap-2 flex-wrap items-center">
            <input type="text" name="name" className="flex-1 min-w-[150px] p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Deal Name" required />
            <input type="number" name="amount" className="w-32 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Amount ($)" required />
            <select name="stage" className="w-40 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <option value="Prospect">Prospect</option>
              <option value="Initial Analysis">Initial Analysis</option>
              <option value="Due Diligence">Due Diligence</option>
              <option value="Closing">Closing</option>
              <option value="Signing & Closing">Signing & Closing</option>
              <option value="Closed">Closed</option>
              <option value="Integration">Integration</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors">Add Deal</button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 flex-1">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Create Finance Pipeline</h4>
          <form action={addPipeline} className="flex gap-2 flex-wrap items-center">
            <input type="hidden" name="category" value="Finance" />
            <input type="text" name="name" className="flex-1 min-w-[120px] p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Pipeline Name" required />
            <input type="text" name="owner" className="w-28 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Owner" />
            
            <select name="projectId" className="p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <option value="">No Project</option>
              {options.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select name="teamId" className="p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <option value="">No Team</option>
              {options.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select name="taskId" className="p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <option value="">No Task</option>
              {options.tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input type="text" name="createTaskName" className="w-32 p-2 text-sm rounded border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100" placeholder="Auto-Create Task" />
            <div className="w-48">
              <MultiSelectDropdown name="memberIds" options={options.users} placeholder="Members..." />
            </div>

            <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 transition-colors">Add</button>
          </form>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center relative group">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm flex justify-center items-center gap-1">
            Deals in Prospect
            <i className="fa-solid fa-circle-info text-gray-400 text-xs cursor-help" title="Count of deals currently in the 'Prospect' stage"></i>
          </h4>
          <h2 className="text-3xl font-bold text-blue-500">{dealsInProspect}</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center relative group">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm flex justify-center items-center gap-1">
            Deals in Analysis
            <i className="fa-solid fa-circle-info text-gray-400 text-xs cursor-help" title="Count of deals in 'Initial Analysis' or 'Due Diligence'"></i>
          </h4>
          <h2 className="text-3xl font-bold text-emerald-500">{dealsInAnalysis}</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center relative group">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm flex justify-center items-center gap-1">
            Deals in Closing
            <i className="fa-solid fa-circle-info text-gray-400 text-xs cursor-help" title="Count of deals in 'Signing & Closing' or 'Closing' stages"></i>
          </h4>
          <h2 className="text-3xl font-bold text-amber-500">{dealsInClosing}</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center relative group">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm flex justify-center items-center gap-1">
            Contribution (Closed)
            <i className="fa-solid fa-circle-info text-gray-400 text-xs cursor-help" title="Total amount of deals in 'Closed' or 'Integration' stages"></i>
          </h4>
          <h2 className="text-3xl font-bold text-violet-500">${revenueClosed.toLocaleString()}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 md:col-span-2">
          <h3 className="text-md font-semibold mb-4 text-gray-900 dark:text-gray-100">Pipeline Revenue by Deal Stage ($)</h3>
          <div className="h-72">
            <Bar data={pipelineData} options={{ indexAxis: "y", responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
          <h3 className="text-md font-semibold mb-4 text-gray-900 dark:text-gray-100">Target Count by Region</h3>
          <div className="h-72">
            <Doughnut data={regionData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
          <h3 className="text-md font-semibold mb-4 text-gray-900 dark:text-gray-100">Target Count by Industry / Vertical</h3>
          <div className="h-64">
            <Bar data={industryData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
          <h3 className="text-md font-semibold mb-4 text-gray-900 dark:text-gray-100">Recent Deals Activity</h3>
          <div className="overflow-x-auto h-64">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                  <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Stage</th>
                </tr>
              </thead>
              <tbody>
                {deals && deals.length > 0 ? (
                  deals.map((d, i) => (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-700/50">
                      <td className="p-3 text-sm text-gray-900 dark:text-gray-100">{d.name}</td>
                      <td className="p-3 text-sm text-gray-900 dark:text-gray-100">${(d.amount || 0).toLocaleString()}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">{d.stage}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">No deals yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Active Financial Pipelines */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <i className="fa-solid fa-layer-group text-blue-600"></i> Financial Operational Pipelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines.map((pipeline: any) => (
            <PipelineCard key={pipeline._id} pipeline={pipeline} />
          ))}
          {pipelines.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400 py-6">No active financial pipelines found.</div>
          )}
        </div>
      </div>
    </main>
  );
}
