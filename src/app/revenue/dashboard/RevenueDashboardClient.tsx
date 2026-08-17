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
import { addDeal, addPipeline, updateDealStage, updateDeal, deleteDeal, addResourceAllocation } from "@/actions";
import PipelineCard from "@/components/PipelineCard";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import RevenueExampleModal from "@/components/RevenueExampleModal";
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

export default function RevenueDashboardClient({
  deals,
  targets,
  pipelines = [],
  resources = [],
  options = { projects: [], teams: [], tasks: [], users: [] },
}: {
  deals: any[];
  targets: any[];
  pipelines?: any[];
  resources?: any[];
  options?: { projects: any[]; teams: any[]; tasks: any[]; users: any[] };
}) {
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const dealStages = ["Prospect", "Initial Analysis", "Due Diligence", "Closing", "Signing & Closing", "Closed", "Integration"];

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("dealId", dealId);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    if (dealId) {
      await updateDealStage(dealId, newStage);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // KPI Calculations
  const dealsInProspect = deals?.filter(d => d.stage === "Prospect").length || 0;
  const dealsInAnalysis = deals?.filter(d => d.stage === "Initial Analysis" || d.stage === "Due Diligence").length || 0;
  const dealsInClosing = deals?.filter(d => d.stage === "Signing & Closing" || d.stage === "Closing").length || 0;
  const revenueClosed = deals?.filter(d => d.stage === "Closed" || d.stage === "Integration").reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
  
  // Executive Dashboard Metrics
  const averageDealSize = deals?.length ? Math.round(deals.reduce((sum, d) => sum + (d.amount || 0), 0) / deals.length) : 0;
  const targetRevenueUSD = targets?.reduce((sum, t) => sum + (t.expectedValue || 0), 0) || 0;
  const achievedRevenueUSD = targets?.reduce((sum, t) => sum + (t.achievedRevenueUSD || 0), 0) || 0;
  
  // Dynamic Alerts
  const unallocatedDeals = deals?.filter(d => d.stage === "Integration" && !resources?.some(r => r.linkedDealId === d._id));
  const alerts = [
    ...(unallocatedDeals?.map(d => `No resources allocated for Integration Deal: ${d.name}`) || []),
    ...(pipelines?.filter(p => p.expensesUSD > (p.cashFlowProjectionUSD * 0.8)).map(p => `High expense ratio in financial pipeline: ${p.name}`) || [])
  ];

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
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowExampleModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all hover:scale-[1.02]"
          >
            <i className="fa-solid fa-graduation-cap"></i> See Example
          </button>
          <div className="storage-tag px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
            Active
          </div>
        </div>
      </header>

      {/* Executive Dashboard */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md p-5 text-white">
            <div className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-1">Avg Deal Size</div>
            <div className="text-2xl font-bold">${averageDealSize.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md p-5 text-white">
            <div className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Target Revenue</div>
            <div className="text-2xl font-bold">${targetRevenueUSD.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-md p-5 text-white">
            <div className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">Achieved</div>
            <div className="text-2xl font-bold">${achievedRevenueUSD.toLocaleString()}</div>
            <div className="w-full bg-white/30 h-1.5 rounded-full mt-2">
              <div className="bg-white h-1.5 rounded-full" style={{ width: `${Math.min((achievedRevenueUSD / (targetRevenueUSD || 1)) * 100, 100)}%` }}></div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><i className="fa-solid fa-bell text-amber-500"></i> Executive Alerts</h4>
          <div className="space-y-2 max-h-[100px] overflow-y-auto">
            {alerts.length > 0 ? alerts.map((alert, idx) => (
              <div key={idx} className="text-[11px] text-gray-700 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100 dark:border-amber-800/30">
                <i className="fa-solid fa-triangle-exclamation text-amber-500 mr-1.5"></i>{alert}
              </div>
            )) : <div className="text-[11px] text-gray-400">All systems nominal. No alerts.</div>}
          </div>
        </div>
      </div>

      {/* Data Entry Forms */}
      <div className="flex flex-wrap lg:flex-nowrap gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 flex-1">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Add New Deal</h4>
          <form action={addDeal} className="flex gap-2 flex-wrap items-center">
            <select name="projectId" className="w-40 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <option value="">No Project</option>
              {options?.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select name="pipelineId" className="w-40 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <option value="">No Pipeline</option>
              {pipelines?.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            
            <input type="text" name="name" list="dealTypes" className="flex-1 min-w-[150px] p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Deal Name" required />
            <datalist id="dealTypes">
              <option value="Enterprise Software Licensing" />
              <option value="Merger & Acquisition" />
              <option value="Strategic Partnership" />
              <option value="Series A Investment" />
              <option value="Real Estate Acquisition" />
              <option value="Cloud Infrastructure Migration" />
              <option value="Consulting Retainer" />
              <option value="Vendor Contract Renewal" />
              <option value="Marketing Agency Agreement" />
              <option value="IPO Underwriting" />
            </datalist>

            <input type="text" name="clientName" className="w-32 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Client Name" />
            <input type="text" name="clientIndustry" className="w-32 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Industry" />
            <input type="text" name="clientRegion" className="w-32 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Region" />
            
            <input type="date" name="expectedCloseDate" className="w-40 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" title="Expected Close Date" />
            
            <select name="priority" className="w-32 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
            
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

      {/* Deals Kanban Board */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <i className="fa-solid fa-handshake text-amber-500"></i> Deals Pipeline (Kanban)
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {dealStages.map(stage => (
            <div 
              key={stage} 
              className="flex-1 min-w-[260px] bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex justify-between items-center">
                {stage}
                <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {deals?.filter(d => d.stage === stage).length || 0}
                </span>
              </h4>
              <div className="space-y-3">
                {deals?.filter(d => d.stage === stage).map(deal => (
                  <div 
                    key={deal._id} 
                    draggable={editingDealId !== deal._id} 
                    onDragStart={(e) => handleDragStart(e, deal._id)}
                    className={`bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow ${editingDealId === deal._id ? '' : 'cursor-grab'}`}
                  >
                    {editingDealId === deal._id ? (
                      <form action={async (formData) => { await updateDeal(formData); setEditingDealId(null); }} className="flex flex-col gap-2">
                        <input type="hidden" name="dealId" value={deal._id} />
                        <input type="hidden" name="stage" value={deal.stage} />
                        <input type="text" name="name" defaultValue={deal.name} className="w-full p-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" required />
                        <input type="number" name="amount" defaultValue={deal.amount} className="w-full p-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" required />
                        <input type="text" name="clientName" defaultValue={deal.client?.name || ""} placeholder="Client Name" className="w-full p-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                        <input type="date" name="expectedCloseDate" defaultValue={deal.expectedCloseDate ? deal.expectedCloseDate.split('T')[0] : ""} className="w-full p-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                        <select name="priority" defaultValue={deal.metadata?.priority || "Medium"} className="w-full p-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                          <option value="High">High Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="Low">Low Priority</option>
                        </select>
                        <select name="projectId" defaultValue={deal.projectId || ""} className="w-full p-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                          <option value="">No Project</option>
                          {options?.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select name="pipelineId" defaultValue={deal.pipelineId || ""} className="w-full p-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                          <option value="">No Pipeline</option>
                          {pipelines?.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        <div className="flex gap-2 justify-end mt-1">
                          <button type="button" onClick={() => setEditingDealId(null)} className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-700">Cancel</button>
                          <button type="submit" className="px-2 py-1 text-[10px] bg-blue-500 text-white rounded">Save</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{deal.name}</span>
                          <div className="flex gap-1">
                            <button onClick={() => setEditingDealId(deal._id)} className="text-gray-400 hover:text-blue-500 text-[10px] p-1"><i className="fa-solid fa-pen"></i></button>
                            <form action={deleteDeal} className="m-0" onSubmit={(e) => { if (!window.confirm("Delete deal?")) e.preventDefault(); }}>
                              <input type="hidden" name="dealId" value={deal._id} />
                              <button type="submit" className="text-gray-400 hover:text-red-500 text-[10px] p-1"><i className="fa-solid fa-trash-can"></i></button>
                            </form>
                          </div>
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-1">
                          ${(deal.amount || 0).toLocaleString()}
                        </div>
                        {(deal.projectId || deal.pipelineId || deal.client?.name || deal.expectedCloseDate) && (
                          <div className="text-[10px] space-y-1 mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-700">
                            {deal.client?.name && <div className="text-gray-600 dark:text-gray-400"><i className="fa-solid fa-building mr-1"></i> {deal.client.name}</div>}
                            {deal.expectedCloseDate && <div className="text-emerald-600 dark:text-emerald-400"><i className="fa-regular fa-calendar mr-1"></i> {new Date(deal.expectedCloseDate).toLocaleDateString()}</div>}
                            {deal.projectId && <div className="text-blue-600 dark:text-blue-400"><i className="fa-solid fa-folder-tree mr-1"></i> {options?.projects.find(p => p.id === deal.projectId)?.name || 'Project'}</div>}
                            {deal.pipelineId && <div className="text-indigo-600 dark:text-indigo-400"><i className="fa-solid fa-layer-group mr-1"></i> {pipelines?.find(p => p._id === deal.pipelineId)?.name || 'Pipeline'}</div>}
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

      {/* Resource Allocation Overview */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <i className="fa-solid fa-scale-balanced text-teal-600"></i> Resource Allocation Overview
        </h3>
        
        <form action={addResourceAllocation} className="mb-4 flex gap-2 flex-wrap items-center bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <input type="text" name="name" className="flex-1 min-w-[120px] p-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Resource Name (e.g. Q3 Budget)" required />
          <select name="type" className="w-28 p-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <option value="Budget">Budget</option>
            <option value="Manpower">Manpower</option>
            <option value="Tools">Tools</option>
          </select>
          <input type="number" name="totalAllocated" className="w-28 p-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Allocated" required />
          <input type="number" name="totalUsed" className="w-24 p-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Used" required />
          <select name="riskLevel" className="w-28 p-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>
          <select name="linkedDealId" className="w-36 p-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <option value="">No Linked Deal</option>
            {deals?.filter(d => d.stage === 'Integration').map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <button type="submit" className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors">Allocate</button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources?.map(resource => (
            <div key={resource._id} className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{resource.name}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${resource.riskLevel === 'High' ? 'bg-red-100 text-red-700' : resource.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{resource.riskLevel} Risk</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-3"><i className="fa-solid fa-tag"></i> {resource.type}</div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mb-1">
                <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${Math.min((resource.totalUsed / (resource.totalAllocated || 1)) * 100, 100)}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-300 font-medium mb-3">
                <span>Used: {resource.totalUsed.toLocaleString()}</span>
                <span>Allocated: {resource.totalAllocated.toLocaleString()}</span>
              </div>
              
              {resource.assignedToProjectId && (
                <div className="text-[10px] pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <i className="fa-solid fa-folder-tree mr-1"></i> {resource.assignedToProjectId.name}
                </div>
              )}
              {resource.linkedDealId && (
                <div className="text-[10px] pt-1 text-gray-500 dark:text-gray-400">
                  <i className="fa-solid fa-handshake mr-1"></i> {deals?.find(d => d._id === resource.linkedDealId)?.name || "Linked Deal"}
                </div>
              )}
            </div>
          ))}
          {(!resources || resources.length === 0) && (
            <div className="col-span-full text-center text-sm text-gray-500 py-4">No resources allocated.</div>
          )}
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

      {showExampleModal && <RevenueExampleModal onClose={() => setShowExampleModal(false)} />}
    </main>
  );
}
