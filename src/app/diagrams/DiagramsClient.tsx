"use client";

import { useEffect, useState, useRef } from "react";
import mermaid from "mermaid";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import {
  GitGraph,
  Layers,
  FolderKanban,
  Users,
  CheckCircle2,
  Workflow,
  Target,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

interface DiagramsClientProps {
  projects: any[];
  pipelines: any[];
  teams: any[];
  tasks: any[];
  goals: any[];
  stats: {
    totalProjects: number;
    totalPipelines: number;
    totalTeams: number;
    totalTasks: number;
    tasksDone: number;
    totalGoals: number;
    totalDeals: number;
  };
}

export default function DiagramsClient({
  projects,
  pipelines,
  teams,
  tasks,
  goals,
  stats,
}: DiagramsClientProps) {
  const [activeDiagram, setActiveDiagram] = useState<"architecture" | "lifecycle" | "pipelines">("architecture");
  const containerRef = useRef<HTMLDivElement>(null);
  const panZoomRef = useRef<any>(null);

  const destroyPanZoom = () => {
    if (panZoomRef.current) {
      panZoomRef.current.destroy();
      panZoomRef.current = null;
    }
  };

  // Build live Mermaid code for the active diagram
  const getDiagramCode = () => {
    const sanitize = (str: string) => (str || "").replace(/["'\[\]\(\)]/g, " ").trim();

    if (activeDiagram === "architecture") {
      let code = `flowchart TD\n`;
      code += `  classDef comp fill:#EBF3FC,stroke:#0078D4,stroke-width:2.5px,color:#0078D4,font-weight:bold;\n`;
      code += `  classDef proj fill:#F3F2F1,stroke:#0078D4,stroke-width:1.5px,color:#242424,font-weight:bold;\n`;
      code += `  classDef team fill:#FFFFFF,stroke:#605E5C,stroke-width:1.5px,color:#242424;\n`;
      code += `  classDef pipe fill:#DFF6DD,stroke:#107C10,stroke-width:1.5px,color:#107C10;\n`;
      code += `  classDef task fill:#FFFFFF,stroke:#E1DFDD,stroke-width:1px,color:#605E5C;\n`;

      code += `  Company["🏢 Enterprise Organization"]:::comp\n`;

      projects.forEach((p) => {
        const pId = `P_${p._id}`;
        code += `  ${pId}["📁 Project: ${sanitize(p.name)}"]:::proj\n`;
        code += `  Company ==> ${pId}\n`;

        // Associated pipelines
        const pPipes = pipelines.filter((pipe) => pipe.projectId?._id === p._id);
        pPipes.forEach((pipe) => {
          const pipeId = `Pipe_${pipe._id}`;
          code += `  ${pipeId}["⚡ Pipeline: ${sanitize(pipe.name)} (${pipe.progress}%)"]:::pipe\n`;
          code += `  ${pId} --> ${pipeId}\n`;
        });

        // Associated tasks count
        const pTasks = tasks.filter((t) => t.projectId?._id === p._id);
        if (pTasks.length > 0) {
          const tNode = `Tasks_${p._id}`;
          code += `  ${tNode}["📋 ${pTasks.length} Tasks (${pTasks.filter((t: any) => ['done', 'completed'].includes(t.status.toLowerCase())).length} Done)"]:::task\n`;
          code += `  ${pId} -.-> ${tNode}\n`;
        }
      });

      // Teams block
      if (teams.length > 0) {
        code += `  subgraph TeamsCluster ["👥 Shared Functional Teams"]\n`;
        teams.forEach((t) => {
          code += `    T_${t._id}["👥 ${sanitize(t.name)} (${t.membersCount} members)"]:::team\n`;
          code += `    Company -.-> T_${t._id}\n`;
        });
        code += `  end\n`;
      }

      return code;
    }

    if (activeDiagram === "pipelines") {
      return `flowchart LR
    %% Cross-functional Pipeline Interconnectivity
    subgraph DevPhase ["1. Development Phase"]
        Dev["💻 Core Development Pipeline"]
    end

    subgraph LaunchPhase ["2. Launch & Operations Phase"]
        Mktg["📢 Marketing & Growth"]
        Ops["⚙️ Operations & Deployment"]
        HR["👥 Talent & Capability"]
    end

    subgraph RevenuePhase ["3. Commercialization Phase"]
        Sales["💼 Sales & Deal Pipeline"]
        Fin["💰 Finance & Revenue Recognition"]
    end

    Dev ==> Mktg
    Dev ==> Ops
    Dev ==> HR
    Mktg --> Sales
    Ops --> Sales
    Sales ==> Fin
    
    classDef highlight fill:#EBF3FC,stroke:#0078D4,stroke-width:2px,color:#0078D4,font-weight:bold;
    class Dev,Sales,Fin highlight;`;
    }

    // Lifecycle
    return `flowchart TD
    subgraph Strategy ["Strategic Level (Executive Leadership)"]
        ExecDash["📊 Executive Dashboard & Portfolio Health"]
        OKRs["🎯 Strategic Goals & OKRs"]
        Finance["📈 Revenue Forecast & MRR Target"]
    end

    subgraph Management ["Management & Planning"]
        Blueprints["📁 Project Blueprints & Teams"]
        ResourceAlloc["👥 Capacity & Headcount Allocation"]
        SprintCycles["🔄 Sprint Cycles & Iterations"]
    end

    subgraph Execution ["Engineering & Operational Delivery"]
        Pipelines["⚡ Parallel Delivery Pipelines"]
        TaskNodes["✅ Task Nodes & Kanban Board"]
        TimelineGantt["📅 Timeline & Frappe Gantt Chart"]
    end

    subgraph Commercialization ["Commercialization & Feedback"]
        DealsPipe["🤝 B2B Sales & Pilot Agreements"]
        Telemetry["📡 Real-time Telemetry & Health Monitoring"]
    end

    ExecDash ==> Blueprints
    OKRs --> Pipelines
    Finance --> DealsPipe
    Blueprints ==> Pipelines
    ResourceAlloc --> TaskNodes
    Pipelines ==> TaskNodes
    SprintCycles --> TaskNodes
    TaskNodes ==> TimelineGantt
    TimelineGantt ==> DealsPipe
    DealsPipe ==> Telemetry
    Telemetry -. Live Rollups .-> ExecDash

    classDef stage fill:#FFFFFF,stroke:#0078D4,stroke-width:1.5px,color:#242424;
    class ExecDash,Blueprints,Pipelines,TaskNodes,DealsPipe,Telemetry stage;`;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    destroyPanZoom();

    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "loose",
      fontFamily: "Segoe UI, Inter, sans-serif",
    });

    const code = getDiagramCode();
    const renderId = `diagram-${activeDiagram}-${Date.now()}`;

    mermaid
      .render(renderId, code)
      .then(async (result) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = result.svg;

          const svgElement = containerRef.current.querySelector("svg");
          if (svgElement) {
            svgElement.style.width = "100%";
            svgElement.style.height = "100%";
            svgElement.style.maxWidth = "100%";

            const { default: svgPanZoom } = await import("svg-pan-zoom");
            panZoomRef.current = svgPanZoom(svgElement, {
              zoomEnabled: true,
              controlIconsEnabled: false,
              fit: true,
              center: true,
              panEnabled: true,
              minZoom: 0.2,
              maxZoom: 8,
            });

            panZoomRef.current.zoom(0.85);
            panZoomRef.current.center();
          }
        }
      })
      .catch((err) => {
        console.error("Mermaid render error:", err);
      });

    return () => destroyPanZoom();
  }, [activeDiagram, projects, pipelines, teams, tasks]);

  const handleZoomIn = () => panZoomRef.current?.zoomIn();
  const handleZoomOut = () => panZoomRef.current?.zoomOut();
  const handleReset = () => panZoomRef.current?.reset();

  return (
    <main className="flex flex-col min-w-0 p-4 md:p-8 flex-1 max-w-7xl mx-auto w-full">
      {/* Header */}
      <header className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
              System Architecture & Flow Diagrams
            </h1>
            <Badge tone="success" size="sm">
              Live Auto-Generated
            </Badge>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
            Dynamic architectural visualization generated directly from active database entities and pipeline dependencies.
          </p>
        </div>
      </header>

      {/* Live Ecosystem Rollup Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          label="Strategic Objectives"
          value={`${stats.totalGoals} Goals Active`}
          subtext="Linked to measurable targets"
          icon={<Target className="w-5 h-5 text-[#0078D4]" />}
        />
        <Stat
          label="Project Blueprints"
          value={`${stats.totalProjects} Projects`}
          subtext="Ecosystem architecture maps"
          icon={<FolderKanban className="w-5 h-5 text-[#0078D4]" />}
        />
        <Stat
          label="Delivery Pipelines"
          value={`${stats.totalPipelines} Roadmaps`}
          subtext="Active cross-functional tracks"
          icon={<Layers className="w-5 h-5 text-[#107C10]" />}
        />
        <Stat
          label="Task Execution"
          value={`${stats.tasksDone} / ${stats.totalTasks} Done`}
          subtext="Complete telemetry coverage"
          icon={<CheckCircle2 className="w-5 h-5 text-[#107C10]" />}
        />
      </div>

      {/* Flow Diagram Tabs & Controls */}
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveDiagram("architecture")}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeDiagram === "architecture"
                  ? "bg-[#0078D4] text-white"
                  : "bg-[#F3F2F1] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#EDEBE9]"
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>1. Live Entity Hierarchy</span>
            </button>

            <button
              onClick={() => setActiveDiagram("pipelines")}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeDiagram === "pipelines"
                  ? "bg-[#0078D4] text-white"
                  : "bg-[#F3F2F1] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#EDEBE9]"
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>2. Parallel Pipeline Interconnectivity</span>
            </button>

            <button
              onClick={() => setActiveDiagram("lifecycle")}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeDiagram === "lifecycle"
                  ? "bg-[#0078D4] text-white"
                  : "bg-[#F3F2F1] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#EDEBE9]"
              }`}
            >
              <GitGraph className="w-3.5 h-3.5" />
              <span>3. Work Management Lifecycle</span>
            </button>
          </div>

          {/* Pan Zoom Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded bg-[#F3F2F1] dark:bg-[#292827] hover:bg-[#E1DFDD] text-[#242424] dark:text-[#FFFFFF] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded bg-[#F3F2F1] dark:bg-[#292827] hover:bg-[#E1DFDD] text-[#242424] dark:text-[#FFFFFF] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded bg-[#F3F2F1] dark:bg-[#292827] hover:bg-[#E1DFDD] text-[#242424] dark:text-[#FFFFFF] text-xs font-semibold px-2 transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Diagram Canvas */}
        <div className="bg-[#FAF9F8] dark:bg-[#1B1A19] rounded-[8px] border border-[#E1DFDD] dark:border-[#3B3A39] w-full h-[650px] overflow-hidden relative shadow-inner">
          <div ref={containerRef} className="w-full h-full" />
        </div>
      </div>
    </main>
  );
}
