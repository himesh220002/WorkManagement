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

      if (project.pipelines && project.pipelines.length > 0) {
        project.pipelines.forEach((pipeline: any) => {
          const pipeNodeStr = `Pipe_${pipeline._id}`;
          chart += `  ${pipeNodeStr}["Pipeline: ${pipeline.name.replace(/["']/g, '')}"]\n`;
          chart += `  ${pNode} --> ${pipeNodeStr}\n`;
          
          if (pipeline.todos && pipeline.todos.length > 0) {
            pipeline.todos.forEach((todo: any) => {
              const todoId = todo._id || Math.random().toString(36).substring(7);
              const todoNodeStr = `Todo_${todoId}`;
              chart += `  ${todoNodeStr}["Task: ${todo.text.replace(/["']/g, '')}"]\n`;
              chart += `  ${pipeNodeStr} --> ${todoNodeStr}\n`;
              
              if (todo.assigneeName) {
                const member = allMembers.find((m: any) => m.name === todo.assigneeName);
                if (member) {
                  chart += `  ${todoNodeStr} -. "Assigned to" .-> M_${member._id}\n`;
                } else {
                  // If it's a team/group or not in the member list
                  const dummyAssignee = `A_${todoId}`;
                  chart += `  ${dummyAssignee}["${todo.assigneeType}: ${todo.assigneeName.replace(/["']/g, '')}"]\n`;
                  chart += `  ${todoNodeStr} -. "Assigned to" .-> ${dummyAssignee}\n`;
                }
              }
            });
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
