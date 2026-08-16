"use client";

import { useEffect, useState, useRef } from "react";
import mermaid from "mermaid";

export default function WorkflowGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      mermaid.initialize({ startOnLoad: false, theme: "dark" });
      
      const chart = `
        graph TD
          Company((Company / Org))
          Project[Project]
          Team[Team]
          User[Member/User]
          Task[TaskNode]
          Cycle[Sprint/Cycle]
          Pipeline[Pipeline/Workflow]
          Lead[Lead]
          Campaign[Campaign]
          Deal[Deal / Finance]
          Goal[Strategic Goal]
          Target[Goal Target]
          
          Company -->|Creates| Project
          Project -->|Has many| Team
          Team -->|Has many| User
          Project -->|Has many| Task
          User -->|Assigned to| Task
          Project -->|Has many| Cycle
          Project -->|Has many| Pipeline
          Task -->|Tracked in| Pipeline
          
          Goal -->|Broken down into| Target
          Campaign -->|Generates| Lead
          Lead -->|Converts to| Deal
      `;

      mermaid.render("workflow-diagram", chart).then((result) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = result.svg;
        }
      }).catch((e) => {
        console.error("Mermaid rendering failed:", e);
      });
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
        <button 
          onClick={() => setIsOpen(true)} 
          className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 text-center text-blue-500 hover:text-blue-600 font-medium transition-colors"
        >
          <i className="fa-solid fa-book-open mr-2"></i> View Workflow Architecture & Manual Test Checklist
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <i className="fa-solid fa-sitemap text-blue-500"></i> Workflow Architecture
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <i className="fa-solid fa-times mr-1"></i> Close
          </button>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 overflow-x-auto flex justify-center min-h-[300px] mb-8">
          <div ref={containerRef} className="mermaid flex justify-center w-full min-w-[600px]">
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-list-check text-emerald-500"></i> Manual Test Checklist
        </h3>
        
        <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex gap-3">
            <input type="checkbox" className="mt-1 flex-shrink-0 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
            <div>
              <strong className="block text-gray-900 dark:text-gray-100 text-base mb-1">1. Project & Active Context Filtering</strong>
              <p className="mb-2">The <strong>Active Project Context</strong> dropdown defaults to "All Projects". This means you are seeing a global aggregation of <em>all</em> tasks, cycles, and hours across the entire company.</p>
              <p className="text-gray-500 dark:text-gray-400"><em>Action:</em> Select your specific project (e.g. "ft project 1") from the dropdown. This adds <code>?projectId=...</code> to the URL and dynamically filters the dashboard to only show tasks and sprints belonging to that exact project.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input type="checkbox" className="mt-1 flex-shrink-0 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
            <div>
              <strong className="block text-gray-900 dark:text-gray-100 text-base mb-1">2. Understanding Tasks vs. Pipelines</strong>
              <p className="mb-2">When you add a <strong>Task</strong> via the Dev Dashboard, it is created as an atomic unit of engineering work assigned globally to the selected Project. It feeds directly into the "Estimated vs Actual Work Hours" chart and the "Total Tasks" count.</p>
              <p className="mb-2">A <strong>Pipeline</strong> (e.g. "frontend pipe"), on the other hand, is a larger continuous workflow or epic. Pipelines do not strictly "own" the standalone tasks you create. Instead, Pipelines have their own internal checklists (todos) shown directly on their cards.</p>
              <p className="text-gray-500 dark:text-gray-400"><em>Action:</em> Use Tasks for modular tickets (bugs, features), and use Pipelines to track the overarching phases of project delivery (e.g. "Q3 Deployment Pipeline").</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input type="checkbox" className="mt-1 flex-shrink-0 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
            <div>
              <strong className="block text-gray-900 dark:text-gray-100 text-base mb-1">3. How Sprint Cycles Work</strong>
              <p className="mb-2">A <strong>Sprint/Cycle</strong> defines a specific time bucket for the Project (e.g. "Sprint 42" from Aug 15 to Aug 30). By adding multiple Sprints with distinct Start and End dates, the system calculates the <strong>Avg Cycle Time</strong> metric at the top of the dashboard.</p>
              <p className="text-gray-500 dark:text-gray-400"><em>Action:</em> Create a few Sprints. The Dev Dashboard averages their durations (End Date minus Start Date) to show your engineering velocity cycle time.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input type="checkbox" className="mt-1 flex-shrink-0 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
            <div>
              <strong className="block text-gray-900 dark:text-gray-100 text-base mb-1">4. Strategic Goals & OKRs (Executive Dashboard)</strong>
              <p className="mb-2">At the Executive level, <strong>Strategic Goals</strong> represent high-level company objectives (e.g., "Q3 Market Expansion"). Goals are broken down into specific <strong>Targets</strong>. As Targets are marked complete, the Goal's overall progress percentage automatically advances.</p>
              <p className="text-gray-500 dark:text-gray-400"><em>Action:</em> Check the Exec Dashboard. Any changes to targets or engineering velocity here will bubble up to give executives a bird's-eye view.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input type="checkbox" className="mt-1 flex-shrink-0 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
            <div>
              <strong className="block text-gray-900 dark:text-gray-100 text-base mb-1">5. Campaigns & Leads (Sales & Revenue)</strong>
              <p className="mb-2">In the Sales Dashboard, marketing <strong>Campaigns</strong> are created to generate <strong>Leads</strong>. When a Lead is nurtured successfully, it converts into a <strong>Deal</strong> in the Revenue Management dashboard.</p>
              <p className="text-gray-500 dark:text-gray-400"><em>Action:</em> Create a Campaign, add Leads, and watch the "Conversion Rate" metric calculate. Then create a Deal from that lead and watch the Monthly Recurring Revenue (MRR) projection update on the Executive Dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
