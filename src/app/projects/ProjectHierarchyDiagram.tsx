"use client";

import { useEffect, useState, useRef } from "react";
import mermaid from "mermaid";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Maximize2,
  FolderKanban,
  Users,
  Layers,
} from "lucide-react";

export default function ProjectHierarchyDiagram({ project }: { project: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panZoomRef = useRef<any>(null);
  const diagramId = `mermaid-${project._id.toString()}`;

  const destroyPanZoom = () => {
    if (panZoomRef.current) {
      panZoomRef.current.destroy();
      panZoomRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      destroyPanZoom();
      return;
    }

    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "loose",
      fontFamily: "Segoe UI, Inter, sans-serif",
    });

    const sanitize = (str: string) => (str || "").replace(/["'\[\]\(\)]/g, " ").trim();
    const pNode = `P_${project._id}`;
    const pName = sanitize(project.name);

    let chart = `flowchart TD\n`;
    chart += `  classDef proj fill:#EBF3FC,stroke:#0078D4,stroke-width:2px,color:#0078D4,font-weight:bold;\n`;
    chart += `  classDef team fill:#F3F2F1,stroke:#605E5C,stroke-width:1.5px,color:#242424;\n`;
    chart += `  classDef pipe fill:#DFF6DD,stroke:#107C10,stroke-width:1.5px,color:#107C10;\n`;
    chart += `  classDef task fill:#FFFFFF,stroke:#E1DFDD,stroke-width:1px,color:#242424;\n`;

    chart += `  ${pNode}["📁 Project: ${pName}"]:::proj\n`;

    // 1. Teams Section
    const teams = Array.isArray(project.teams) ? project.teams : [];
    if (teams.length > 0) {
      chart += `  subgraph SG_Teams ["👥 Project Teams"]\n`;
      chart += `    direction LR\n`;
      teams.forEach((t: any) => {
        const tId = t._id ? t._id.toString() : String(Math.random()).slice(2, 7);
        const tName = sanitize(t.name || "Team");
        const tNode = `T_${tId}`;
        chart += `    ${tNode}["👥 ${tName}"]:::team\n`;
        chart += `    ${pNode} --> ${tNode}\n`;

        // Team members
        const members = Array.isArray(t.members) ? t.members : [];
        members.slice(0, 4).forEach((m: any) => {
          const mId = m._id ? m._id.toString() : String(Math.random()).slice(2, 7);
          const mName = sanitize(m.name || "Member");
          const mNode = `M_${mId}`;
          chart += `    ${mNode}["👤 ${mName}"]:::task\n`;
          chart += `    ${tNode} -.-> ${mNode}\n`;
        });
      });
      chart += `  end\n`;
    }

    // 2. Pipelines & Tasks Section
    const pipelines = Array.isArray(project.pipelines) ? project.pipelines : [];
    if (pipelines.length > 0) {
      chart += `  subgraph SG_Pipelines ["⚡ Execution Pipelines"]\n`;
      chart += `    direction TB\n`;
      pipelines.forEach((pipeline: any) => {
        const pipeId = pipeline._id ? pipeline._id.toString() : String(Math.random()).slice(2, 7);
        const pipeName = sanitize(pipeline.name || "Pipeline");
        const pipeNode = `Pipe_${pipeId}`;

        chart += `    subgraph SG_Pipe_${pipeId} ["${pipeName} (${pipeline.progress || 0}%)"]\n`;
        chart += `      direction LR\n`;
        chart += `      ${pipeNode}["🚀 Start: ${pipeName}"]:::pipe\n`;

        const todos = Array.isArray(pipeline.todos) ? pipeline.todos : [];
        todos.forEach((todo: any, idx: number) => {
          const todoId = todo._id ? todo._id.toString() : `${pipeId}_${idx}`;
          const todoText = sanitize(todo.text || "Task item");
          const todoNode = `Todo_${todoId}`;
          const statusIcon = todo.completed ? "✓" : "○";
          chart += `      ${todoNode}["${statusIcon} ${todoText}"]:::task\n`;
          chart += `      ${pipeNode} --> ${todoNode}\n`;
        });
        chart += `    end\n`;

        chart += `    ${pNode} ==> ${pipeNode}\n`;
      });
      chart += `  end\n`;
    }

    // Render diagram
    destroyPanZoom();

    mermaid
      .render(diagramId, chart)
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
      .catch((e) => {
        console.error("Mermaid blueprint rendering failed:", e);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<div class="p-8 text-center text-sm text-[#D13438]">Failed to render architecture diagram. Check console for details.</div>`;
        }
      });

    return () => {
      destroyPanZoom();
    };
  }, [isOpen, project, diagramId]);

  const handleZoomIn = () => panZoomRef.current?.zoomIn();
  const handleZoomOut = () => panZoomRef.current?.zoomOut();
  const handleReset = () => panZoomRef.current?.reset();

  if (!isOpen) {
    return (
      <div className="pt-3 border-t border-[#EDEBE9] dark:border-[#292827] flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-xs font-semibold text-[#0078D4] dark:text-[#479EF5] hover:underline flex items-center gap-1.5 p-1 transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>View Blueprint Architecture Flow</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-[#EDEBE9] dark:border-[#292827] mt-3">
      {/* Blueprint Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-[#0078D4]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#242424] dark:text-[#FFFFFF]">
            System Blueprint: {project.name}
          </h4>
        </div>

        {/* Controls */}
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
            className="p-1.5 rounded bg-[#F3F2F1] dark:bg-[#292827] hover:bg-[#E1DFDD] text-[#242424] dark:text-[#FFFFFF] transition-colors text-xs font-semibold px-2"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded bg-[#FDE7E9] dark:bg-[#44171A] text-[#D13438] hover:bg-[#FCD2D6] transition-colors ml-2"
            title="Close Diagram"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Diagram Canvas */}
      <div className="bg-[#FAF9F8] dark:bg-[#1B1A19] rounded-[8px] border border-[#E1DFDD] dark:border-[#3B3A39] w-full h-[480px] overflow-hidden relative shadow-inner">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
