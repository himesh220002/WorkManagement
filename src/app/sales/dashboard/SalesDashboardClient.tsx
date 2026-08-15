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
import { addLead, addCampaign } from "@/actions";
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

export default function SalesDashboardClient({
  leads,
  campaigns,
  pipelines = [],
}: {
  leads: any[];
  campaigns: any[];
  pipelines?: any[];
}) {
  const campaignsData = {
    labels: ["Q3 Webinar", "Email Blast v2", "Trade Show 2026", "Social Media Ads", "Cold Call Blitz"],
    datasets: [
      { label: "Hot", data: [30, 20, 15, 10, 5], backgroundColor: "#3b82f6" },
      { label: "Warm", data: [40, 25, 20, 15, 10], backgroundColor: "#10b981" },
      { label: "Cool", data: [20, 15, 10, 20, 25], backgroundColor: "#8b5cf6" },
    ],
  };

  const revenueData = {
    labels: ["Event", "Web Marketing", "Email", "Social Media", "Other"],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#6366f1"],
      },
    ],
  };

  const leadsData = {
    labels: ["Bill West", "Sarah Lee", "John Doe", "Emma Stone"],
    datasets: [
      { label: "New", data: [5, 2, 8, 3], backgroundColor: "#3b82f6" },
      { label: "Working", data: [10, 15, 5, 8], backgroundColor: "#06b6d4" },
      { label: "Qualified", data: [3, 5, 2, 4], backgroundColor: "#10b981" },
      { label: "Unqualified", data: [2, 1, 4, 1], backgroundColor: "#f59e0b" },
    ],
  };

  return (
    <main className="flex flex-col min-w-0 p-6 flex-1">
      <header className=" bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6 border-l-4 border-emerald-500 flex justify-between items-center">
        <div>
          <h1 className=" text-3xl font-bold text-gray-900 dark:text-gray-100">Sales Pipeline Management</h1>
          <div className="date-badge mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <i className="fa-solid fa-chart-line"></i> Active Campaigns Overview
          </div>
        </div>
        <div className="storage-tag px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
          Active
        </div>
      </header>

      {/* Data Entry Forms */}
      <div className="flex flex-wrap md:flex-nowrap gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 flex-1">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Add New Lead</h4>
          <form action={addLead} className="flex gap-2 flex-wrap items-center">
            <input type="text" name="name" className="flex-1 min-w-[150px] p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Lead Name" required />
            <input type="text" name="owner" className="w-32 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Owner" required />
            <select name="status" className="w-32 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <option value="New">New</option>
              <option value="Working">Working</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">Add Lead</button>
          </form>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 flex-1">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Add New Campaign</h4>
          <form action={addCampaign} className="flex gap-2 flex-wrap items-center">
            <input type="text" name="name" className="flex-1 min-w-[150px] p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Campaign Name" required />
            <input type="number" name="leadsGenerated" className="w-24 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Leads" required />
            <input type="number" name="expectedRevenue" className="w-32 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Est. Rev ($)" required />
            <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors">Add Campaign</button>
          </form>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm">Total Leads</h4>
          <h2 className="text-3xl font-bold text-blue-500">{leads ? leads.length : 0}</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm">Active Campaigns</h4>
          <h2 className="text-3xl font-bold text-emerald-500">{campaigns ? campaigns.length : 0}</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm">Expected Revenue</h4>
          <h2 className="text-3xl font-bold text-amber-500">$2.4M</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm">Conversion Rate</h4>
          <h2 className="text-3xl font-bold text-violet-500">18%</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 md:col-span-2">
          <h3 className="text-md font-semibold mb-4 text-gray-900 dark:text-gray-100">Top Campaigns by Leads Generated</h3>
          <div className="h-72">
            <Bar data={campaignsData} options={{ indexAxis: "y", responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
          <h3 className="text-md font-semibold mb-4 text-gray-900 dark:text-gray-100">Expected Revenue by Channel</h3>
          <div className="h-72">
            <Doughnut data={revenueData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
          <h3 className="text-md font-semibold mb-4 text-gray-900 dark:text-gray-100">Lead Status by Owner</h3>
          <div className="h-64">
            <Bar data={leadsData} options={{ indexAxis: "y", responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
          <h3 className="text-md font-semibold mb-4 text-gray-900 dark:text-gray-100">Recent Leads</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Source</th>
                </tr>
              </thead>
              <tbody>
                {leads && leads.length > 0 ? (
                  leads.slice(0, 5).map((l, i) => (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-700/50">
                      <td className="p-3 text-sm text-gray-900 dark:text-gray-100">{l.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">{l.status}</span>
                      </td>
                      <td className="p-3 text-sm text-gray-900 dark:text-gray-100">{l.source}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">No leads yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Active Sales Pipelines */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <i className="fa-solid fa-layer-group text-blue-600"></i> Active Sales Pipelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines.map((pipeline: any) => (
            <PipelineCard key={pipeline._id} pipeline={pipeline} />
          ))}
          {pipelines.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400 py-6">No active sales pipelines found.</div>
          )}
        </div>
      </div>
    </main>
  );
}
