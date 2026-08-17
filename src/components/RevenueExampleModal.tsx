"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

export default function RevenueExampleModal({ onClose }: { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panZoomRef = useRef<any>(null);

  const destroyPanZoom = () => {
    try {
      if (panZoomRef.current) {
        panZoomRef.current.destroy();
      }
    } catch (e) {
      console.warn("Failed to destroy panZoom", e);
    } finally {
      panZoomRef.current = null;
    }
  };

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "Inter, sans-serif",
    });

    const graphDefinition = `
flowchart TD
    %% Styling
    classDef exec fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#fff,rx:8px,ry:8px,font-size:16px
    classDef sales fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff,rx:8px,ry:8px,font-size:16px
    classDef finance fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff,rx:8px,ry:8px,font-size:16px
    classDef ops fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff,rx:8px,ry:8px,font-size:16px
    classDef deal fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#92400e,rx:8px,ry:8px,font-size:16px
    classDef milestone fill:#1f2937,stroke:#111827,stroke-width:2px,color:#fff,rx:8px,ry:8px,font-size:16px

    %% 1. Start of Project
    subgraph Phase1 [1. Start of Project / Strategy]
        direction TB
        E1[Executive Strategy: Set Revenue Targets]:::exec
        S1[Sales & Marketing: Prospecting & Lead Gen]:::sales
        F1[Finance: Track Expected Revenue Inflows]:::finance
        
        E1 --> S1
        E1 --> F1
    end

    %% 2. Deals Pipeline
    subgraph Deals [Deals Pipeline Kanban]
        direction LR
        D1[Prospect]:::deal
        D2[Initial Analysis]:::deal
        D3[Due Diligence]:::deal
        D4[Closing]:::deal
        D5[Signing & Closing]:::deal
        D6[Closed]:::deal
        D7[Integration]:::deal

        D1 --> D2 --> D3 --> D4 --> D5 --> D6 --> D7
    end
    
    S1 -->|Identifies Leads| D1

    %% 3. Mid-Side Execution
    subgraph Phase2 [2. Mid-Side Execution Phase]
        direction TB
        O1[Operations: Resource Allocation]:::ops
        O2[Operations: Vendor & Compliance Checks]:::ops
        
        D2 -.->|Assessing Fit & Budget| O1
        D3 -.->|Legal & Compliance| O2
    end

    %% 4. Closing Phase
    subgraph Phase3 [3. Near End Closing Phase]
        direction TB
        F2[Finance: Cash Flow Projections]:::finance
        F3[Finance: Budget Finalization]:::finance
        
        D5 -.->|Contracts Signed| F2
        F2 --> F3
    end

    %% 5. End of Project & Post-Project
    subgraph Phase4 [4. End of Project & Delivery]
        direction TB
        O3[Operations: Client Onboarding]:::ops
        O4[HR: Allocate Support Staff]:::ops
        F4[Finance: Revenue Recognized]:::finance
        
        D6 -.->|Deal Won| F4
        D7 -.->|Hand-off| O3
        O3 --> O4
    end
    
    %% 6. Feedback & Growth Loop
    subgraph Phase5 [5. Post-Project Updates]
        direction TB
        E2[Executive Dashboards: Roll-up Metrics]:::exec
        C1[Customer Feedback Loop]:::exec
        
        F4 --> E2
        O4 --> E2
        O3 --> C1
    end

    C1 -->|Strategic Adjustments| E1
`;

    const renderMermaid = () => {
      if (!containerRef.current) return;
      
      destroyPanZoom();

      const diagramId = `revenue-diagram-${Date.now()}`;
      mermaid.render(diagramId, graphDefinition).then(async (result) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = result.svg;

          const svgElement = containerRef.current.querySelector("svg");
          if (svgElement) {
            svgElement.style.width = "100%";
            svgElement.style.height = "100%";
            svgElement.style.maxWidth = "100%";
            
            const { default: svgPanZoom } = await import("svg-pan-zoom");
            
            try {
              panZoomRef.current = svgPanZoom(svgElement, {
                zoomEnabled: true,
                controlIconsEnabled: false,
                fit: true,
                center: true,
                panEnabled: true,
                minZoom: 0.1,
                maxZoom: 10
              });

              panZoomRef.current.zoom(0.8);
              panZoomRef.current.center();
            } catch (e) {
              console.warn("svg-pan-zoom initialization failed", e);
            }
          }
        }
      }).catch((e) => {
        console.error("Mermaid rendering failed", e);
      });
    };

    renderMermaid();

    return () => {
      destroyPanZoom();
    };
  }, []);

  const handleZoomIn = () => {
    try { panZoomRef.current?.zoomIn(); } catch(e) {}
  };
  const handleZoomOut = () => {
    try { panZoomRef.current?.zoomOut(); } catch(e) {}
  };
  const handleReset = () => {
    try { 
      panZoomRef.current?.reset(); 
      panZoomRef.current?.zoom(0.8);
      panZoomRef.current?.center();
    } catch(e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 w-full h-full max-w-[1400px] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <i className="fa-solid fa-money-bill-trend-up text-emerald-600"></i>
              Revenue Lifecycle & Deals Pipeline
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              The full execution journey from strategic planning to recognized revenue and integration.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded-full transition-colors"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-col gap-8">

            {/* Diagram */}
            <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-bold text-gray-700 dark:text-gray-300">Revenue Generation Flow</h3>
                
                {/* Zoom Controls */}
                <div className="flex items-center justify-center gap-2">
                  <button onClick={handleZoomIn} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded text-xs font-bold hover:bg-gray-300">+</button>
                  <button onClick={handleZoomOut} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded text-xs font-bold hover:bg-gray-300">−</button>
                  <button onClick={handleReset} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded text-xs hover:bg-gray-300">Reset</button>
                </div>
              </div>

              {/* Fixed height container for SVG */}
              <div className="w-full h-[600px] overflow-hidden bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                <div ref={containerRef} className="w-full h-full cursor-move" />
              </div>
            </div>

            {/* Explanations */}
            <div className="space-y-6 text-sm">
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm border-l-4 border-l-amber-500">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-handshake text-amber-500"></i> Deals Pipeline Example
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-3">Imagine selling a new Enterprise License. Here is how it flows through the Kanban board:</p>
                <ul className="list-disc pl-4 space-y-2 text-gray-600 dark:text-gray-400 marker:text-amber-400">
                  <li><strong>Prospect:</strong> Marketing webinar generates a lead (e.g., "Acme Corp"). Sales identifies them as a potential $250k deal.</li>
                  <li><strong>Analysis:</strong> Sales and Pre-Sales engineers assess Acme Corp's technical requirements and available budget.</li>
                  <li><strong>Due Diligence:</strong> Legal and Compliance teams step in to review terms, security, and vendor requirements.</li>
                  <li><strong>Closing:</strong> The Account Executive negotiates final discounts and terms with Acme Corp's procurement team.</li>
                  <li><strong>Closed:</strong> Contract is signed! The $250k revenue is officially booked into the financial forecast.</li>
                  <li><strong>Integration:</strong> The deal is handed off to Operations and Customer Success to begin onboarding Acme Corp.</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm border-l-4 border-l-blue-500">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-arrows-spin text-blue-500"></i> Cross-Pipeline Connections
                </h4>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li><span className="font-semibold text-emerald-600">Sales → Finance:</span> Deals feed into revenue forecasts and cash flow tracking.</li>
                  <li><span className="font-semibold text-teal-600">Finance → Ops:</span> Budgets are allocated for execution capacity.</li>
                  <li><span className="font-semibold text-blue-600">Ops → HR:</span> Triggers staffing, onboarding, and training for support.</li>
                  <li><span className="font-semibold text-indigo-600">Integration → Strategy:</span> Feedback loops inform future executive goals.</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm border-l-4 border-l-red-500">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-bell text-red-500"></i> Executive Alerts
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-3">The dashboard automatically flags operational anomalies to executives in real-time:</p>
                <ul className="list-disc pl-4 space-y-2 text-gray-600 dark:text-gray-400 marker:text-red-400">
                  <li><strong>Unallocated Integration Deals:</strong> If a deal successfully makes it to the "Integration" stage on the Kanban board, but no resources (budget, manpower) have been linked to it in the Resource Allocation Overview, the system will instantly flag: <em>"No resources allocated for Integration Deal: [Deal Name]"</em>. This prevents sold projects from stalling due to lack of assigned execution capacity.</li>
                  <li><strong>High Expense Ratios:</strong> Financial pipelines that track excessive expenses compared to their cash flow projections (expenses {'>'} 80% of projected revenue) are flagged for immediate financial review.</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
