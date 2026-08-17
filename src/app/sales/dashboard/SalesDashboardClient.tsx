"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { addLead, addCampaign, addPipeline, updateLeadStatus, updateLead, deleteLead, updateCampaign, deleteCampaign } from "@/actions";
import PipelineCard from "@/components/PipelineCard";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import { useMemo, useState } from "react";
import { PREDEFINED_PIPELINE_TASKS } from "@/utils/taskConstants";

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
  options = { projects: [], teams: [], tasks: [], users: [] },
}: {
  leads: any[];
  campaigns: any[];
  pipelines?: any[];
  options?: { projects: any[]; teams: any[]; tasks: any[]; users: any[] };
}) {
  const totalLeads = leads?.length || 0;
  const activeCampaigns = campaigns?.length || 0;
  const expectedRevenue = campaigns?.reduce((sum, c) => sum + (c.expectedRevenue || 0), 0) || 0;
  const qualifiedLeads = leads?.filter((l) => l.status === "Qualified").length || 0;
  const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  
  const leadStages = ["New", "Working", "Qualified", "Unqualified"];

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
      await updateLeadStatus(leadId, newStatus);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Campaigns Data (Top 5 by leads)
  const sortedCampaigns = useMemo(() => {
    return [...(campaigns || [])]
      .sort((a, b) => (b.leadsGenerated || 0) - (a.leadsGenerated || 0))
      .slice(0, 5);
  }, [campaigns]);

  const campaignsData = {
    labels: sortedCampaigns.length > 0 ? sortedCampaigns.map((c) => c.name) : ["No Data"],
    datasets: [
      {
        label: "Leads Generated",
        data: sortedCampaigns.length > 0 ? sortedCampaigns.map((c) => c.leadsGenerated || 0) : [0],
        backgroundColor: "#3b82f6",
      },
    ],
  };

  const revenueData = {
    labels: sortedCampaigns.length > 0 ? sortedCampaigns.map((c) => c.name) : ["No Data"],
    datasets: [
      {
        data: sortedCampaigns.length > 0 ? sortedCampaigns.map((c) => c.expectedRevenue || 0) : [0],
        backgroundColor: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#6366f1"],
      },
    ],
  };

  const leadsByOwner = useMemo(() => {
    return leads?.reduce((acc: any, lead) => {
      if (!acc[lead.owner]) acc[lead.owner] = { New: 0, Working: 0, Qualified: 0, Unqualified: 0 };
      acc[lead.owner][lead.status] = (acc[lead.owner][lead.status] || 0) + 1;
      return acc;
    }, {});
  }, [leads]);

  const ownerLabels = Object.keys(leadsByOwner || {});
  const leadsData = {
    labels: ownerLabels.length > 0 ? ownerLabels : ["No Data"],
    datasets: [
      { label: "New", data: ownerLabels.length > 0 ? ownerLabels.map((o) => leadsByOwner[o].New) : [0], backgroundColor: "#3b82f6" },
      { label: "Working", data: ownerLabels.length > 0 ? ownerLabels.map((o) => leadsByOwner[o].Working) : [0], backgroundColor: "#06b6d4" },
      { label: "Qualified", data: ownerLabels.length > 0 ? ownerLabels.map((o) => leadsByOwner[o].Qualified) : [0], backgroundColor: "#10b981" },
      { label: "Unqualified", data: ownerLabels.length > 0 ? ownerLabels.map((o) => leadsByOwner[o].Unqualified) : [0], backgroundColor: "#f59e0b" },
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
      <div className="flex flex-wrap lg:flex-nowrap gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 flex-1">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Add New Lead</h4>
          <form action={addLead} className="flex gap-2 flex-wrap items-center">
            <input type="text" name="name" className="flex-1 min-w-[120px] p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Lead Name" required />
            <input type="text" name="owner" className="w-28 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Owner" required />
            <select name="status" className="w-28 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <option value="New">New</option>
              <option value="Working">Working</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">Add</button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 flex-1">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Add New Campaign</h4>
          <form action={addCampaign} className="flex gap-2 flex-wrap items-center">
            <input type="text" name="name" className="flex-1 min-w-[120px] p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Campaign Name" required />
            <input type="number" name="leadsGenerated" className="w-20 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Leads" required />
            <input type="number" name="expectedRevenue" className="w-28 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Est. Rev ($)" required />
            <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors">Add</button>
          </form>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm">Total Leads</h4>
          <h2 className="text-3xl font-bold text-blue-500">{totalLeads}</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm">Active Campaigns</h4>
          <h2 className="text-3xl font-bold text-emerald-500">{activeCampaigns}</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center relative group">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm flex justify-center items-center gap-1">
            Expected Revenue
            <i className="fa-solid fa-circle-info text-gray-400 text-xs cursor-help" title="Sum of expected revenue from all active campaigns"></i>
          </h4>
          <h2 className="text-3xl font-bold text-amber-500">${expectedRevenue.toLocaleString()}</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center relative group">
          <h4 className="text-gray-500 dark:text-gray-400 mb-2 text-sm flex justify-center items-center gap-1">
            Conversion Rate
            <i className="fa-solid fa-circle-info text-gray-400 text-xs cursor-help" title="Percentage of total leads that are currently marked as 'Qualified'"></i>
          </h4>
          <h2 className="text-3xl font-bold text-violet-500">{conversionRate}%</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 md:col-span-2">
          <h3 className="text-md font-semibold mb-4 text-gray-900 dark:text-gray-100">Top Campaigns by Leads Generated</h3>
          <div className="h-72">
            <Bar data={campaignsData} options={{ indexAxis: "y", responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
          <h3 className="text-md font-semibold mb-4 text-gray-900 dark:text-gray-100">Expected Revenue by Campaign</h3>
          <div className="h-72">
            <Doughnut data={revenueData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Leads Kanban Board */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <i className="fa-solid fa-users text-blue-600"></i> Leads Kanban Board
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {leadStages.map(stage => (
            <div 
              key={stage} 
              className="flex-1 min-w-[250px] bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex justify-between items-center">
                {stage}
                <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {leads?.filter(l => l.status === stage).length || 0}
                </span>
              </h4>
              <div className="space-y-3">
                {leads?.filter(l => l.status === stage).map(lead => (
                  <div 
                    key={lead._id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, lead._id)}
                    className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab hover:shadow-md transition-shadow"
                  >
                    {editingLeadId === lead._id ? (
                      <form action={async (formData) => { await updateLead(formData); setEditingLeadId(null); }} className="flex flex-col gap-2">
                        <input type="hidden" name="leadId" value={lead._id} />
                        <input type="hidden" name="status" value={lead.status} />
                        <input type="text" name="name" defaultValue={lead.name} className="w-full p-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" required />
                        <input type="text" name="owner" defaultValue={lead.owner} className="w-full p-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" required />
                        <select name="campaignId" defaultValue={lead.campaignId || ""} className="w-full p-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                          <option value="">No Campaign</option>
                          {campaigns?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <div className="flex gap-2 justify-end mt-1">
                          <button type="button" onClick={() => setEditingLeadId(null)} className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-700">Cancel</button>
                          <button type="submit" className="px-2 py-1 text-[10px] bg-blue-500 text-white rounded">Save</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{lead.name}</span>
                          <div className="flex gap-1">
                            <button onClick={() => setEditingLeadId(lead._id)} className="text-gray-400 hover:text-blue-500 text-[10px] p-1"><i className="fa-solid fa-pen"></i></button>
                            <form action={deleteLead} className="m-0" onSubmit={(e) => { if (!window.confirm("Delete lead?")) e.preventDefault(); }}>
                              <input type="hidden" name="leadId" value={lead._id} />
                              <button type="submit" className="text-gray-400 hover:text-red-500 text-[10px] p-1"><i className="fa-solid fa-trash-can"></i></button>
                            </form>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                          <i className="fa-solid fa-user text-[10px]"></i> {lead.owner}
                        </div>
                        {lead.campaignId && (
                          <div className="text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded inline-flex items-center gap-1 mt-1">
                            <i className="fa-solid fa-bullhorn"></i> {campaigns?.find(c => c._id === lead.campaignId)?.name || 'Campaign'}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Campaigns List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <i className="fa-solid fa-bullhorn text-emerald-600"></i> Active Campaigns
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns?.map(campaign => (
            <div key={campaign._id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              {editingCampaignId === campaign._id ? (
                <form action={async (formData) => { await updateCampaign(formData); setEditingCampaignId(null); }} className="flex flex-col gap-2">
                  <input type="hidden" name="campaignId" value={campaign._id} />
                  <input type="text" name="name" defaultValue={campaign.name} className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-semibold" required />
                  <div className="flex gap-2">
                    <input type="number" name="leadsGenerated" defaultValue={campaign.leadsGenerated} placeholder="Leads" className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                    <input type="number" name="expectedRevenue" defaultValue={campaign.expectedRevenue} placeholder="Revenue" className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                  </div>
                  <select name="projectId" defaultValue={campaign.projectId || ""} className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <option value="">Link to Project...</option>
                    {options?.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select name="pipelineId" defaultValue={campaign.pipelineId || ""} className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <option value="">Link to Pipeline...</option>
                    {pipelines?.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={() => setEditingCampaignId(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                    <button type="submit" className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded">Save</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{campaign.name}</h4>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingCampaignId(campaign._id)} className="text-gray-400 hover:text-blue-500 text-xs p-1"><i className="fa-solid fa-pen"></i></button>
                      <form action={deleteCampaign} className="m-0" onSubmit={(e) => { if (!window.confirm("Delete campaign?")) e.preventDefault(); }}>
                        <input type="hidden" name="campaignId" value={campaign._id} />
                        <button type="submit" className="text-gray-400 hover:text-red-500 text-xs p-1"><i className="fa-solid fa-trash-can"></i></button>
                      </form>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-2">
                    <span><i className="fa-solid fa-users mr-1"></i> {campaign.leadsGenerated} Leads</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">${campaign.expectedRevenue?.toLocaleString()} Rev</span>
                  </div>
                  {(campaign.projectId || campaign.pipelineId) && (
                    <div className="text-[10px] space-y-1 mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                      {campaign.projectId && <div className="text-blue-600 dark:text-blue-400"><i className="fa-solid fa-folder-tree mr-1"></i> {options?.projects.find(p => p.id === campaign.projectId)?.name || 'Project Linked'}</div>}
                      {campaign.pipelineId && <div className="text-indigo-600 dark:text-indigo-400"><i className="fa-solid fa-layer-group mr-1"></i> {pipelines?.find(p => p._id === campaign.pipelineId)?.name || 'Pipeline Linked'}</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {(!campaigns || campaigns.length === 0) && (
            <div className="col-span-full text-center text-sm text-gray-500 py-4">No active campaigns.</div>
          )}
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
            <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400 py-6">No active sales pipelines found. Create one above to get started.</div>
          )}
        </div>
      </div>
    </main>
  );
}
