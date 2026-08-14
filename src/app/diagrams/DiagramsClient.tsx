"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

export default function DiagramsClient() {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: "dark" });
    if (mermaidRef.current) {
      mermaid.contentLoaded();
    }
  }, []);

  return (
    <main className="flex flex-col min-w-0 p-6 flex-1">
      <header className=" bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 rounded-lg mb-6 border-l-4 border-cyan-500 flex justify-between items-center">
        <div>
          <h1 className=" text-3xl font-bold text-gray-900 dark:text-gray-100">Logic Flow Diagram</h1>
          <div className="date-badge mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <i className="fa-solid fa-project-diagram"></i> Architecture Visualization
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-8 text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-6">
        <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Project Pipeline Architecture</h3>
        
        <div ref={mermaidRef} className="mermaid flex justify-center w-full">
          {`graph TD
            A[Initiator] --> B(Project Core)
            B --> C{Cycle 1}
            C -->|Extender| D[Task Node Alpha]
            C -->|Shrinker| E[Task Node Beta]
            D --> F((Connector))
            E --> F
            F --> G{Merger}
            G --> H[Final Output]`}
        </div>
      </div>
    </main>
  );
}
