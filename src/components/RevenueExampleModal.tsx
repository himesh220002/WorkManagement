"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import {
  TrendingUp,
  X,
  Handshake,
  Workflow,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
} from "lucide-react";

interface RevenueExampleModalProps {
  onClose: () => void;
}

export default function RevenueExampleModal({ onClose }: RevenueExampleModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panZoomRef = useRef<{
    destroy: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    reset: () => void;
    zoom: (scale: number) => void;
    center: () => void;
  } | null>(null);

  const destroyPanZoom = () => {
    try {
      if (panZoomRef.current) {
        panZoomRef.current.destroy();
      }
    } catch (err) {
      console.warn("Failed to destroy panZoom", err);
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
      mermaid
        .render(diagramId, graphDefinition)
        .then(async (result) => {
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
                  maxZoom: 10,
                });

                panZoomRef.current.zoom(0.8);
                panZoomRef.current.center();
              } catch (err) {
                console.warn("svg-pan-zoom initialization failed", err);
              }
            }
          }
        })
        .catch((err) => {
          console.error("Mermaid rendering failed", err);
        });
    };

    renderMermaid();

    return () => {
      destroyPanZoom();
    };
  }, []);

  const handleZoomIn = () => {
    try {
      panZoomRef.current?.zoomIn();
    } catch {
      // ignore
    }
  };

  const handleZoomOut = () => {
    try {
      panZoomRef.current?.zoomOut();
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    try {
      panZoomRef.current?.reset();
      panZoomRef.current?.zoom(0.8);
      panZoomRef.current?.center();
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] w-full max-w-[1400px] h-[90vh] rounded-[10px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#E1DFDD] dark:border-[#3B3A39] bg-[#FAF9F8] dark:bg-[#1B1A19]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-[#EBF3FC] dark:bg-[#1C2B3D] flex items-center justify-center text-[#0078D4] dark:text-[#479EF5]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#242424] dark:text-[#FFFFFF]">
                Revenue Lifecycle & Deals Architecture
              </h2>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                Complete journey from executive target setting through Kanban pipeline stages to recognized revenue.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424] dark:hover:text-[#FFFFFF] bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] hover:bg-[#F3F2F1] p-2 rounded-[6px] transition-colors"
            title="Close blueprint modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-[#201F1E]">
          <div className="flex flex-col gap-6">
            {/* Interactive Flow Diagram */}
            <div className="bg-[#FAF9F8] dark:bg-[#1B1A19] p-4 rounded-[8px] border border-[#E1DFDD] dark:border-[#3B3A39]">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#E1DFDD] dark:border-[#3B3A39]">
                <div className="flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-[#0078D4]" />
                  <h3 className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF]">
                    Interactive Revenue Pipeline Topology
                  </h3>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-[#FFFFFF] rounded-[4px] text-xs hover:bg-[#F3F2F1] flex items-center gap-1"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-[#FFFFFF] rounded-[4px] text-xs hover:bg-[#F3F2F1] flex items-center gap-1"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-2 py-1 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] text-[#242424] dark:text-[#FFFFFF] rounded-[4px] text-xs hover:bg-[#F3F2F1] flex items-center gap-1"
                    title="Reset view"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Diagram viewport */}
              <div className="w-full h-[520px] overflow-hidden bg-white dark:bg-[#201F1E] rounded-[6px] border border-[#E1DFDD] dark:border-[#3B3A39]">
                <div ref={containerRef} className="w-full h-full cursor-move" />
              </div>
            </div>

            {/* Structured Explanations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#FAF9F8] dark:bg-[#1B1A19] p-5 rounded-[8px] border border-[#E1DFDD] dark:border-[#3B3A39] border-l-4 border-l-[#F7630C]">
                <h4 className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF] mb-2 flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-[#F7630C]" />
                  <span>Deals Progression Lifecycle</span>
                </h4>
                <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-3">
                  How enterprise deals transition across verified checkpoints:
                </p>
                <ul className="text-xs space-y-2 text-[#605E5C] dark:text-[#C8C6C4]">
                  <li>
                    <strong className="text-[#242424] dark:text-[#FFFFFF]">1. Prospect:</strong> Inbound or outbound lead identified with estimated deal size.
                  </li>
                  <li>
                    <strong className="text-[#242424] dark:text-[#FFFFFF]">2. Analysis &amp; Diligence:</strong> Pre-sales evaluates tech scope while Legal reviews terms and compliance.
                  </li>
                  <li>
                    <strong className="text-[#242424] dark:text-[#FFFFFF]">3. Closing &amp; Signing:</strong> Executive negotiation, MSAs signed, purchase orders released.
                  </li>
                  <li>
                    <strong className="text-[#242424] dark:text-[#FFFFFF]">4. Closed &amp; Integration:</strong> Revenue officially recognized; operations and staff onboarded.
                  </li>
                </ul>
              </div>

              <div className="bg-[#FAF9F8] dark:bg-[#1B1A19] p-5 rounded-[8px] border border-[#E1DFDD] dark:border-[#3B3A39] border-l-4 border-l-[#0078D4]">
                <h4 className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF] mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0078D4]" />
                  <span>Cross-Departmental Synchronization</span>
                </h4>
                <ul className="text-xs space-y-2.5 text-[#605E5C] dark:text-[#C8C6C4] mt-3">
                  <li>
                    <strong className="text-[#0078D4] dark:text-[#479EF5]">Sales &rarr; Finance:</strong> Deals update cash flow projections and budget forecasts in real-time.
                  </li>
                  <li>
                    <strong className="text-[#107C10] dark:text-[#54B054]">Finance &rarr; Operations:</strong> Capital and budget envelopes are unlocked for execution squads.
                  </li>
                  <li>
                    <strong className="text-[#5C2D91] dark:text-[#B4A0FF]">Ops &rarr; HR / Staffing:</strong> Capacity demand triggers headcount allocation or contractor staffing.
                  </li>
                  <li>
                    <strong className="text-[#0078D4] dark:text-[#479EF5]">Integration &rarr; Strategy:</strong> Closed deal telemetry loops back into annual OKR targets.
                  </li>
                </ul>
              </div>

              <div className="bg-[#FAF9F8] dark:bg-[#1B1A19] p-5 rounded-[8px] border border-[#E1DFDD] dark:border-[#3B3A39] border-l-4 border-l-[#D13438]">
                <h4 className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF] mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D13438]" />
                  <span>Executive Telemetry &amp; Alerts</span>
                </h4>
                <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mb-3">
                  Automatic governance rules that protect profit margins:
                </p>
                <ul className="text-xs space-y-2 text-[#605E5C] dark:text-[#C8C6C4]">
                  <li>
                    <strong className="text-[#242424] dark:text-[#FFFFFF]">Unallocated Integration Deals:</strong> Flags won deals entering Integration that have no linked operational budget or team.
                  </li>
                  <li>
                    <strong className="text-[#242424] dark:text-[#FFFFFF]">High Expense Ratio:</strong> Warns when expenses exceed 80% of cash flow projections on active operational pipelines.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
