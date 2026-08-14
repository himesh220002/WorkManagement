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
    <main className="main-dashboard p-6 flex-1">
      <header className="dashboard-banner glass-card p-6 rounded-lg mb-6 border-l-4 border-cyan-500 flex justify-between items-center">
        <div>
          <h1 className="list-heading text-3xl font-bold text-[var(--text-primary)]">Logic Flow Diagram</h1>
          <div className="date-badge mt-2 text-sm text-[var(--text-muted)] flex items-center gap-2">
            <i className="fa-solid fa-project-diagram"></i> Architecture Visualization
          </div>
        </div>
      </header>

      <div className="glass-card p-8 text-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] mb-6">
        <h3 className="text-xl font-semibold mb-6 text-[var(--text-primary)]">Project Pipeline Architecture</h3>
        
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
