"use client";

import { useEffect, useState, useRef } from "react";
import mermaid from "mermaid";

export default function ProjectHierarchyDiagram({ project }: { project: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramId = `mermaid-${project._id.toString()}`;

  useEffect(() => {
    if (isOpen && containerRef.current) {
      mermaid.initialize({ startOnLoad: false, theme: "dark" });
      
      // Generate Mermaid Code
      const pNode = `P_${project._id}`;
      const tasksNode = `Tasks_${project._id}`;

      let chart = `flowchart TD\n`;
      chart += `  ${pNode}["Project: ${project.name.replace(/["']/g, '')}"]\n`;
      
      const allMembers: any[] = [];

      if (project.teams && project.teams.length > 0) {
        project.teams.forEach((team: any) => {
          const tNode = `Team_${team._id}`;
          chart += `  ${tNode}["Team: ${team.name.replace(/["']/g, '')}"]\n`;
          chart += `  ${pNode} --> ${tNode}\n`;

          if (team.members && team.members.length > 0) {
            team.members.forEach((m: any) => {
              allMembers.push(m);
              const mNode = `M_${m._id}`;
              const roleStr = m.position ? `${m.role} - ${m.position}` : m.role;
              chart += `  ${mNode}["${m.name} (${roleStr})"]\n`;
              chart += `  ${tNode} --> ${mNode}\n`;
            });
          }
        });
      }

      if (project.tasks && project.tasks.length > 0) {
        chart += `  ${tasksNode}["Tasks"]\n`;
        chart += `  ${pNode} --> ${tasksNode}\n`;
        project.tasks.forEach((task: any) => {
          const taskNodeStr = `T_${task._id}`;
          chart += `  ${taskNodeStr}["${task.name.replace(/["']/g, '')}"]\n`;
          chart += `  ${tasksNode} --> ${taskNodeStr}\n`;
          
          if (task.assignee && task.assignee !== "Unassigned") {
            const member = allMembers.find((m: any) => m.name === task.assignee);
            if (member) {
              chart += `  ${taskNodeStr} -. "Assigned to" .-> M_${member._id}\n`;
            }
          }
        });
      }

      // Render the diagram
      mermaid.render(diagramId, chart).then((result) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = result.svg;
        }
      }).catch((e) => {
        console.error("Mermaid rendering failed:", e);
      });
    }
  }, [isOpen, project, diagramId]);

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
        <button onClick={() => setIsOpen(false)} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <i className="fa-solid fa-times mr-1"></i> Close
        </button>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 overflow-x-auto flex justify-center min-h-[200px]">
        <div ref={containerRef} className="mermaid flex justify-center w-full min-w-[600px]">
          {/* SVG will be injected here */}
        </div>
      </div>
    </div>
  );
}
