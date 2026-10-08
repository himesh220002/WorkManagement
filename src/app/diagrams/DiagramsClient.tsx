"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import {
  FolderKanban,
  Workflow,
  GitGraph,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Target,
  Layers,
  CheckCircle2,
  Users,
  CheckSquare,
  Maximize2,
  Minimize2,
  ArrowRightLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";

interface TeamMemberItem {
  _id: string;
  name: string;
  role: string;
  position?: string;
  rank?: string;
}

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
  stats,
}: DiagramsClientProps) {
  const [activeDiagram, setActiveDiagram] = useState<
    "architecture" | "pipelines" | "lifecycle"
  >("architecture");

  // Dynamic Expansion Controls for the Architecture Hierarchy
  const [expandMembers, setExpandMembers] = useState(false);
  const [expandPipelines, setExpandPipelines] = useState(true);
  const [expandTasks, setExpandTasks] = useState(false);
  const [orientation, setOrientation] = useState<"LR" | "TD">("LR");

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
    if (panZoomRef.current) {
      try {
        panZoomRef.current.destroy();
      } catch (e) {
        console.warn("Failed to destroy panZoom", e);
      }
      panZoomRef.current = null;
    }
  };

  // Build live Mermaid code for the active diagram
  const getDiagramCode = () => {
    const sanitize = (str: string) =>
      (str || "").replace(/["'\[\]\(\)\{\}<>]/g, " ").trim();

    if (activeDiagram === "architecture") {
      let code = `flowchart ${orientation}\n`;
      code += `  classDef comp fill:#EBF3FC,stroke:#0078D4,stroke-width:2.5px,color:#0078D4,font-weight:bold;\n`;
      code += `  classDef proj fill:#F3F2F1,stroke:#0078D4,stroke-width:1.5px,color:#242424,font-weight:bold;\n`;
      code += `  classDef team fill:#FFFFFF,stroke:#605E5C,stroke-width:1.5px,color:#242424;\n`;
      code += `  classDef member fill:#F8F9FA,stroke:#0078D4,stroke-width:1px,color:#242424;\n`;
      code += `  classDef pipe fill:#DFF6DD,stroke:#107C10,stroke-width:1.5px,color:#107C10;\n`;
      code += `  classDef task fill:#FFFFFF,stroke:#E1DFDD,stroke-width:1px,color:#605E5C;\n`;
      code += `  classDef taskDone fill:#DFF6DD,stroke:#107C10,stroke-width:1px,color:#107C10;\n`;

      code += `  Company["🏢 Enterprise Organization"]:::comp\n`;

      // Projects Block
      projects.forEach((p) => {
        const pId = `P_${p._id}`;
        code += `  ${pId}["📁 Project: ${sanitize(p.name)}"]:::proj\n`;
        code += `  Company ==> ${pId}\n`;

        // Associated pipelines
        const pPipes = pipelines.filter((pipe) => pipe.projectId?._id === p._id);
        if (expandPipelines) {
          pPipes.forEach((pipe) => {
            const pipeId = `Pipe_${pipe._id}`;
            code += `  ${pipeId}["⚡ Pipeline: ${sanitize(pipe.name)} (${pipe.progress}%)"]:::pipe\n`;
            code += `  ${pId} --> ${pipeId}\n`;
          });
        } else if (pPipes.length > 0) {
          const pipeSummaryId = `Pipes_Sum_${p._id}`;
          code += `  ${pipeSummaryId}["⚡ ${pPipes.length} Pipelines"]:::pipe\n`;
          code += `  ${pId} --> ${pipeSummaryId}\n`;
        }

        // Associated tasks
        const pTasks = tasks.filter((t) => t.projectId?._id === p._id);
        if (pTasks.length > 0) {
          if (expandTasks) {
            // Expanded individual tasks
            pTasks.slice(0, 10).forEach((t: any) => {
              const isDone = ["done", "completed"].includes(t.status.toLowerCase());
              const tId = `T_${t._id}`;
              code += `  ${tId}["${isDone ? "✅" : "📋"} ${sanitize(t.name)} [${t.status}]"]:::${isDone ? "taskDone" : "task"
                }\n`;
              code += `  ${pId} -.-> ${tId}\n`;
            });
            if (pTasks.length > 10) {
              const moreId = `MoreTasks_${p._id}`;
              code += `  ${moreId}["... +${pTasks.length - 10} more tasks"]:::task\n`;
              code += `  ${pId} -.-> ${moreId}\n`;
            }
          } else {
            // Collapsed tasks count
            const tNode = `Tasks_${p._id}`;
            const doneCount = pTasks.filter((t: any) =>
              ["done", "completed"].includes(t.status.toLowerCase())
            ).length;
            code += `  ${tNode}["📋 ${pTasks.length} Tasks (${doneCount} Done)"]:::task\n`;
            code += `  ${pId} -.-> ${tNode}\n`;
          }
        }
      });

      // Teams Block
      if (teams.length > 0) {
        code += `  subgraph TeamsCluster ["👥 Shared Functional Teams"]\n`;
        teams.forEach((t) => {
          const tId = `T_${t._id}`;
          code += `    ${tId}["👥 ${sanitize(t.name)} (${t.membersCount || t.members?.length || 0} members)"]:::team\n`;
          code += `    Company -.-> ${tId}\n`;

          // Expanded individual team members
          if (expandMembers && Array.isArray(t.members) && t.members.length > 0) {
            t.members.forEach((m: TeamMemberItem) => {
              const mId = `M_${t._id}_${m._id}`;
              const roleDisplay = sanitize(m.position || m.role || "Member");
              const rankDisplay = m.rank ? ` R${m.rank}` : "";
              code += `    ${mId}["👤 ${sanitize(m.name)} - ${roleDisplay}${rankDisplay}"]:::member\n`;
              code += `    ${tId} --> ${mId}\n`;
            });
          }
        });
        code += `  end\n`;
      }

      return code;
    }

    if (activeDiagram === "pipelines") {
      const sanitize = (str: string) => (str || "").replace(/["'\[\]\(\)\{\}\<\>]/g, " ").trim();

      let code = `flowchart LR\n`;
      code += `  %% Live Parallel Pipeline Interconnectivity Flow\n`;
      code += `  classDef highProgress fill:#DFF6DD,stroke:#107C10,stroke-width:2px,color:#107C10,font-weight:bold;\n`;
      code += `  classDef medProgress fill:#EBF3FC,stroke:#0078D4,stroke-width:2px,color:#0078D4,font-weight:bold;\n`;
      code += `  classDef pendingProgress fill:#FFF4CE,stroke:#797673,stroke-width:1.5px,color:#242424;\n`;
      code += `  classDef commercial fill:#FDF3F2,stroke:#C4314B,stroke-width:1.5px,color:#C4314B,font-weight:bold;\n`;

      if (pipelines.length === 0) {
        code += `  subgraph Phase1 ["1. Production & Execution Phase"]\n`;
        code += `    Dev["⚡ Core Production Pipeline (0%)"]:::pendingProgress\n`;
        code += `  end\n`;
        code += `  subgraph Phase2 ["2. Operational & Channel Phase"]\n`;
        code += `    Ops["⚙️ Operations & Deployment (0%)"]:::pendingProgress\n`;
        code += `    Mktg["📢 Marketing & Channel Distribution (0%)"]:::pendingProgress\n`;
        code += `  end\n`;
        code += `  subgraph Phase3 ["3. Commercialization & Revenue"]\n`;
        code += `    Sales["💼 B2B Sales & Revenue Recognition"]:::commercial\n`;
        code += `  end\n`;
        code += `  Dev ==> Ops\n`;
        code += `  Dev ==> Mktg\n`;
        code += `  Ops --> Sales\n`;
        code += `  Mktg --> Sales\n`;
        return code;
      }

      // Group pipelines by Project
      const projectMap: Record<string, any[]> = {};
      const unassignedPipelines: any[] = [];

      pipelines.forEach((p) => {
        const pId = p.projectId?._id || (typeof p.projectId === "string" ? p.projectId : null);
        if (pId) {
          if (!projectMap[pId]) projectMap[pId] = [];
          projectMap[pId].push(p);
        } else {
          unassignedPipelines.push(p);
        }
      });

      const renderedPipeIds: string[] = [];

      Object.entries(projectMap).forEach(([projId, pipeList], projIdx) => {
        const proj = projects.find((pr) => pr._id === projId);
        const projName = sanitize(proj?.name || `Project ${projIdx + 1}`);
        const clusterId = `ProjCluster_${projId.replace(/[^a-zA-Z0-9]/g, "_")}`;

        code += `  subgraph ${clusterId} ["📁 ${projName} (Parallel Execution Tracks)"]\n`;
        code += `    direction TB\n`;

        pipeList.forEach((pipe, pipeIdx) => {
          const pipeNodeId = `Pipe_${pipe._id.replace(/[^a-zA-Z0-9]/g, "_")}`;
          renderedPipeIds.push(pipeNodeId);
          const safeName = sanitize(pipe.name || `Pipeline ${pipeIdx + 1}`);
          const prog = Math.round(Number(pipe.progress || 0));
          const risk = sanitize(pipe.riskLevel || "Low");
          const teamName = pipe.teamId?.name ? ` | 👥 ${sanitize(pipe.teamId.name)}` : "";
          const pClass = prog >= 100 ? "highProgress" : prog > 0 ? "medProgress" : "pendingProgress";

          code += `    ${pipeNodeId}["⚡ ${safeName}<br/><b>${prog}% Progress</b> (${risk} Risk)${teamName}"]:::${pClass}\n`;

          if (pipeIdx > 0) {
            const prevPipeNodeId = `Pipe_${pipeList[pipeIdx - 1]._id.replace(/[^a-zA-Z0-9]/g, "_")}`;
            code += `    ${prevPipeNodeId} ==> ${pipeNodeId}\n`;
          }
        });

        code += `  end\n`;
      });

      if (unassignedPipelines.length > 0) {
        code += `  subgraph GlobalTracks ["🌐 Global Operational Delivery Pipelines"]\n`;
        unassignedPipelines.forEach((pipe) => {
          const pipeNodeId = `Pipe_${pipe._id.replace(/[^a-zA-Z0-9]/g, "_")}`;
          renderedPipeIds.push(pipeNodeId);
          const safeName = sanitize(pipe.name);
          const prog = Math.round(Number(pipe.progress || 0));
          const pClass = prog >= 100 ? "highProgress" : prog > 0 ? "medProgress" : "pendingProgress";
          code += `    ${pipeNodeId}["⚡ ${safeName}<br/><b>${prog}% Progress</b>"]:::${pClass}\n`;
        });
        code += `  end\n`;
      }

      // Add Commercialization & Downstream Delivery Integration Hub
      code += `  subgraph CommercialHub ["3. Commercialization & Revenue Recognition"]\n`;
      code += `    SalesChannel["💼 B2B Sales & Channel Contracts"]:::commercial\n`;
      code += `    RevStream["💰 Revenue Inflow & Invoicing"]:::commercial\n`;
      code += `    SalesChannel ==> RevStream\n`;
      code += `  end\n`;

      if (renderedPipeIds.length > 0) {
        renderedPipeIds.forEach((pNodeId, i) => {
          if (i === renderedPipeIds.length - 1 || renderedPipeIds.length === 1 || i % 2 === 0) {
            code += `  ${pNodeId} ==> SalesChannel\n`;
          }
        });
      }

      return code;
    }

    // Lifecycle Diagram
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

            try {
              const { default: svgPanZoom } = await import("svg-pan-zoom");
              panZoomRef.current = svgPanZoom(svgElement, {
                zoomEnabled: true,
                controlIconsEnabled: false,
                fit: true,
                center: true,
                panEnabled: true,
                minZoom: 0.1,
                maxZoom: 10,
              });

              // Safe RAF wrap to guarantee the matrix is invertible
              requestAnimationFrame(() => {
                try {
                  panZoomRef.current?.zoom(0.85);
                  panZoomRef.current?.center();
                } catch (err) {
                  console.warn("svgPanZoom fit/zoom deferred:", err);
                }
              });
            } catch (err) {
              console.warn("svgPanZoom initialization deferred:", err);
            }
          }
        }
      })
      .catch((err) => {
        console.error("Mermaid render error:", err);
      });

    return () => destroyPanZoom();
  }, [
    activeDiagram,
    projects,
    pipelines,
    teams,
    tasks,
    expandMembers,
    expandPipelines,
    expandTasks,
    orientation,
  ]);

  const handleZoomIn = () => {
    try {
      panZoomRef.current?.zoomIn();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleZoomOut = () => {
    try {
      panZoomRef.current?.zoomOut();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleReset = () => {
    try {
      panZoomRef.current?.reset();
      panZoomRef.current?.zoom(0.85);
      panZoomRef.current?.center();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleExpandAll = () => {
    setExpandMembers(true);
    setExpandPipelines(true);
    setExpandTasks(true);
  };

  const handleCollapseAll = () => {
    setExpandMembers(false);
    setExpandPipelines(false);
    setExpandTasks(false);
  };

  return (
    <main className="flex flex-col min-w-0 p-0 sm:p-4 flex-1 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <header className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 sm:p-6 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg lg:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
              System Architecture &amp; Flow Diagrams
            </h1>
            <Badge tone="success" size="sm">
              Live Auto-Generated
            </Badge>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
            Dynamic architectural visualization generated directly from active database entities, teams, pipelines, and tasks.
          </p>
        </div>
      </header>

      {/* Live Ecosystem Rollup Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-2 sm:p-6 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveDiagram("architecture")}
              className={`px-3 py-2 rounded-[4px] text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeDiagram === "architecture"
                ? "bg-[#0078D4] text-white"
                : "bg-[#F3F2F1] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#EDEBE9]"
                }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>1. Live Entity Hierarchy</span>
            </button>

            <button
              onClick={() => setActiveDiagram("pipelines")}
              className={`px-3 py-2 rounded-[4px] text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeDiagram === "pipelines"
                ? "bg-[#0078D4] text-white"
                : "bg-[#F3F2F1] dark:bg-[#292827] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-[#EDEBE9]"
                }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>2. Parallel Pipeline Interconnectivity</span>
            </button>

            <button
              onClick={() => setActiveDiagram("lifecycle")}
              className={`px-3 py-2 rounded-[4px] text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeDiagram === "lifecycle"
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
              className="flex items-center gap-1 p-1.5 rounded bg-[#F3F2F1] dark:bg-[#292827] hover:bg-[#E1DFDD] text-[#242424] dark:text-[#FFFFFF] text-xs font-semibold px-2 transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-0.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Dynamic Expand/Retract Child Controls (Active for Architecture Diagram) */}
        {activeDiagram === "architecture" && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-4 rounded-[6px] bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] text-xs">
            <div className="flex items-center gap-2 font-semibold text-[#605E5C] dark:text-[#C8C6C4]">
              <span>Expand Hierarchy Branches:</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Toggle Team Members */}
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#242424] dark:text-[#FFFFFF]">
                <input
                  type="checkbox"
                  checked={expandMembers}
                  onChange={(e) => setExpandMembers(e.target.checked)}
                  className="rounded accent-[#0078D4] w-3.5 h-3.5 cursor-pointer"
                />
                <Users className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>Team Members</span>
              </label>

              {/* Toggle Pipelines */}
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#242424] dark:text-[#FFFFFF]">
                <input
                  type="checkbox"
                  checked={expandPipelines}
                  onChange={(e) => setExpandPipelines(e.target.checked)}
                  className="rounded accent-[#0078D4] w-3.5 h-3.5 cursor-pointer"
                />
                <Layers className="w-3.5 h-3.5 text-[#107C10]" />
                <span>Pipelines</span>
              </label>

              {/* Toggle Individual Tasks */}
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#242424] dark:text-[#FFFFFF]">
                <input
                  type="checkbox"
                  checked={expandTasks}
                  onChange={(e) => setExpandTasks(e.target.checked)}
                  className="rounded accent-[#0078D4] w-3.5 h-3.5 cursor-pointer"
                />
                <CheckSquare className="w-3.5 h-3.5 text-[#8F6B00]" />
                <span>Individual Tasks</span>
              </label>

              <span className="text-[#E1DFDD] dark:text-[#3B3A39]">|</span>

              {/* Orientation Switcher */}
              <button
                type="button"
                onClick={() => setOrientation(orientation === "LR" ? "TD" : "LR")}
                className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] hover:bg-[#F3F2F1] transition-colors font-medium text-[#242424] dark:text-[#FFFFFF]"
                title="Switch layout orientation (Left-to-Right or Top-to-Bottom)"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>Layout: {orientation === "LR" ? "Horizontal (LR)" : "Vertical (TD)"}</span>
              </button>

              {/* Expand All / Collapse All */}
              <button
                type="button"
                onClick={handleExpandAll}
                className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] hover:bg-[#F3F2F1] text-[#0078D4] font-medium"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Expand All</span>
              </button>

              <button
                type="button"
                onClick={handleCollapseAll}
                className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] hover:bg-[#F3F2F1] text-[#605E5C] dark:text-[#C8C6C4] font-medium"
              >
                <Minimize2 className="w-3 h-3" />
                <span>Collapse All</span>
              </button>
            </div>
          </div>
        )}

        {/* Diagram Canvas */}
        <div className="bg-[#FAF9F8] dark:bg-[#1B1A19] rounded-[8px] border border-[#E1DFDD] dark:border-[#3B3A39] w-full h-[650px] overflow-hidden relative shadow-inner">
          <div ref={containerRef} className="w-full h-full cursor-move" />
        </div>
      </div>
    </main>
  );
}
