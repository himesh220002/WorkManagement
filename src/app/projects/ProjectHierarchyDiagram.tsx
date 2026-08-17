"use client";

import { useEffect, useState, useRef } from "react";
import mermaid from "mermaid";

export default function ProjectHierarchyDiagram({ project }: { project: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panZoomRef = useRef<any>(null);
  const diagramId = `mermaid-${project._id.toString()}`;


  // Helper to destroy existing pan-zoom instance safely
  const destroyPanZoom = () => {
    if (panZoomRef.current) {
      panZoomRef.current.destroy();
      panZoomRef.current = null;
    }
  };

  useEffect(() => {

    // Only run if the modal is open and the container exists
    if (!isOpen || !containerRef.current) {
      destroyPanZoom();
      return;
    }

    mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: 'loose' });

    // Generate Mermaid Code
    // 

    // Generate Mermaid Code
    const pNode = `P_${project._id}`;
    // Switch top level layout to LR or TD depending on your preference. 
    // TD works best with the nested subgraph strategy below.
    let chart = `flowchart TD\n`;
    chart += ` ${pNode}["Project: ${project.name.replace(/["']/g, '')}"]\n`;

    const allMembers: any[] = [];

    // [Your Teams & Members mapping loop stays here...]

    // --- REVISED PIPELINES AND TASKS MAPPING LOGIC ---
    if (project.pipelines && project.pipelines.length > 0) {
      project.pipelines.forEach((pipeline: any) => {
        const pipeNodeStr = `Pipe_${pipeline._id}`;

        // 1. Keep the subgraph panel for visual grouping
        chart += `  subgraph SG_${pipeline._id} ["Pipeline: ${pipeline.name.replace(/["']/g, '')}"]\n`;

        // 2. CHANGE DIRECTION TO LR: This forces tasks and their assignee chips 
        // to flow horizontally next to each other, keeping individual task chains compact!
        chart += `    direction LR\n`;

        // 3. Define the main Pipeline starting node
        chart += `    ${pipeNodeStr}["Start: ${pipeline.name.replace(/["']/g, '')}"]\n`;

        if (pipeline.todos && pipeline.todos.length > 0) {
          pipeline.todos.forEach((todo: any) => {
            const todoId = todo._id || Math.random().toString(36).substring(7);
            const todoNodeStr = `Todo_${todoId}`;

            // Render task node
            chart += `    ${todoNodeStr}["Task: ${todo.text.replace(/["']/g, '')}"]\n`;

            // FIXED: Every task now connects directly to the Pipeline Head, NOT the previous task!
            chart += `    ${pipeNodeStr} --> ${todoNodeStr}\n`;

            // Handle assignments
            if (todo.assigneeName) {
              const member = allMembers.find((m: any) => m.name === todo.assigneeName);
              if (member) {
                chart += `    ${todoNodeStr} -. "Assigned to" .-> M_${member._id}\n`;
              } else {
                const dummyAssignee = `A_${todoId}`;
                chart += `    ${dummyAssignee}["${todo.assigneeType || 'User'}: ${todo.assigneeName.replace(/["']/g, '')}"]\n`;
                chart += `    ${todoNodeStr} -. "Assigned to" .-> ${dummyAssignee}\n`;
              }
            }
          });
        }

        chart += `  end\n`; // Close subgraph

        // Link Project root to this pipeline box
        chart += `  ${pNode} --> ${pipeNodeStr}\n`;
      });
    }



    // Clean up old instance before rendering a new one
    destroyPanZoom();

    // Render the diagram
    mermaid.render(diagramId, chart).then(async (result) => {
      if (containerRef.current) {
        containerRef.current.innerHTML = result.svg;

        // Initialize pan/zoom
        const svgElement = containerRef.current.querySelector("svg");
        if (svgElement) {

          // CRITICAL: Make the SVG stretch to its wrapper container boundaries
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
            minZoom: 0.1,
            maxZoom: 10
          });

          panZoomRef.current.zoom(0.8);
          panZoomRef.current.center();
        }
      }
    }).catch((e) => {
      console.error("Mermaid rendering failed:", e);
    });
    // Cleanup hook memory on unmount
    return () => {
      destroyPanZoom();
    };
  }, [isOpen, project, diagramId]);

  const handleZoomIn = () => panZoomRef.current?.zoomIn();
  const handleZoomOut = () => panZoomRef.current?.zoomOut();
  const handleReset = () => panZoomRef.current?.reset();

  if (!isOpen) {
    return (
      <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4 flex justify-center">
        <button onClick={() => setIsOpen(true)} className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-2">
          <i className="fa-solid fa-sitemap"></i> View Project Hierarchy
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Project Hierarchy</h4>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <i className="fa-solid fa-times mr-1"></i> Close
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <button onClick={handleZoomIn} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded text-xs font-bold hover:bg-gray-300">+</button>
        <button onClick={handleZoomOut} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded text-xs font-bold hover:bg-gray-300">−</button>
        <button onClick={handleReset} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded text-xs hover:bg-gray-300">Reset</button>
      </div>

      {/* Diagram Canvas Container */}
      <div className="bg-gray-200 dark:bg-gray-900 rounded-lg p-4 mx-auto w-[95%] h-[900px] border border-gray-300 dark:border-gray-800 overflow-hidden">
        <div
          ref={containerRef}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
