"use client";

import { useEffect } from "react";
import mermaid from "mermaid";

const pipelineCards = [
  {
    id: "strat-1",
    title: "Strategic OKRs",
    layer: "Strategic Level",
    owner: "Executive Team",
    status: "Active",
    progress: 72,
    risk: "Low",
    metrics: [{ label: "Goals Linked", value: "100%" }]
  },
  {
    id: "ops-1",
    title: "Q3 Revenue Targets",
    layer: "Operational Level",
    owner: "Sales Director",
    status: "At Risk",
    progress: 45,
    risk: "High",
    metrics: [{ label: "Pipeline Coverage", value: "2.4x" }]
  },
  {
    id: "exec-1",
    title: "Engineering Sprints",
    layer: "Execution Level",
    owner: "Dev Leads",
    status: "On Track",
    progress: 88,
    risk: "Medium",
    metrics: [{ label: "Velocity", value: "45 pts" }]
  }
];

export default function DiagramsClient() {
  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: "dark" });
    mermaid.contentLoaded();
  }, []);

  return (
    <main className="flex flex-col min-w-0 p-6 flex-1">
      <header className=" bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 rounded-lg mb-6 border-l-4 border-cyan-500 flex justify-between items-center">
        <div>
          <h1 className=" text-3xl font-bold text-gray-900 dark:text-gray-100">Logic Flow Diagrams</h1>
          <div className="date-badge mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <i className="fa-solid fa-project-diagram"></i> Architecture Visualization
          </div>
        </div>
      </header>

      {/* Pipeline Cards Ecosystem Rollup */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Live Ecosystem Rollup</h2>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Simulated Data</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pipelineCards.map(card => (
            <div key={card.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 mb-1 uppercase tracking-wider">{card.layer}</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{card.title}</h3>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${card.status === 'On Track' || card.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {card.status}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <i className="fa-regular fa-user"></i> {card.owner}
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{card.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${card.progress}%` }}></div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-3">
                {card.metrics.map((m, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{m.label}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{m.value}</span>
                  </div>
                ))}
                <div className="flex flex-col text-right">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Risk Profile</span>
                  <span className={`text-sm font-semibold ${card.risk === 'High' ? 'text-rose-500' : card.risk === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {card.risk}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-8 text-center mb-6 overflow-x-auto">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Work Management Lifecycle Workflow</h3>
        <p className="text-sm text-gray-500 mb-6 flex justify-center gap-4">
          <span><span className="mr-1">✅</span> Fully Implemented</span>
          <span><span className="mr-1">🔵</span> Implemented - Pending Test</span>
          <span><span className="mr-1">🟡</span> Focused for Implementation</span>
        </p>
        
        <div className="mermaid flex justify-center w-full min-w-[800px]">
          {`flowchart TD
    %% Strategic Planning Phase
    subgraph Strategy["Strategic Level (Exec Dashboard)"]
        G[✅ Define Company Goals / OKRs] --> T[✅ Set Quantifiable Targets]
    end
    
    %% Operational Phase
    subgraph Ops["Operational Level (Revenue & Sales Dashboards)"]
        T --> P1[🔵 Create Operational Pipelines]
        P1 --> D[🔵 Track Deals & Campaigns]
    end

    %% Execution Phase
    subgraph Execution["Execution Level (Dev & Projects Dashboards)"]
        G --> P2[✅ Create Projects]
        Team[✅ Assign Teams to Projects] -.-> P2
        P2 --> C[✅ Break down into Cycles/Sprints]
        C --> Tasks[✅ Assign TaskNodes to Users]
    end
    
    %% Data Flow Back to Dashboards
    Tasks -- "Hours & Status" --> DevDash((✅ Dev Dashboard Metrics))
    D -- "Revenue & Leads" --> RevDash((✅ Revenue Dashboard Metrics))
    T -- "Target Completion" --> ExecDash((✅ Exec Dashboard OKR Progress))
    Tasks -- "Task Rollups" --> ExecDash

    classDef dash fill:#090,stroke:#333,stroke-width:2px;
    class DevDash,RevDash,ExecDash dash;`}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-8 text-center mb-6 overflow-x-auto">
        <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Work Management Entity Data Model</h3>
        
        <div className="mermaid flex justify-center w-full min-w-[800px]">
          {`erDiagram
    USER ||--o{ TEAM_MEMBER : "belongs to"
    TEAM ||--o{ TEAM_MEMBER : "has"
    TEAM ||--o{ PROJECT : "owns"
    
    GOAL ||--o{ PROJECT : "drives"
    GOAL ||--o{ TARGET : "measured by"
    
    PROJECT ||--o{ CYCLE : "divided into"
    PROJECT ||--o{ TASKNODE : "contains"
    
    CYCLE ||--o{ TASKNODE : "scopes"
    
    PIPELINE ||--o{ TASKNODE : "operationalizes"
    
    USER {
        ObjectId id
        String name
        String role
    }
    
    TEAM {
        ObjectId id
        String name
        ObjectId[] members
    }
    
    GOAL {
        ObjectId id
        String title
        String description
        String category
        Number progress
        String status
    }
    
    PROJECT {
        ObjectId id
        String name
        ObjectId teamId
        Date deadline
        String status
    }
    
    TARGET {
        ObjectId id
        String name
        ObjectId goalId
        String status
        Number expectedValue
        Number actualValue
    }
    
    TASKNODE {
        ObjectId id
        String name
        ObjectId projectId
        ObjectId cycleId
        String assignee
        Number estimatedHours
        Number actualHours
    }`}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-8 text-center mb-6 overflow-x-auto">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Full Dashboard Ecosystem Map (360° Lifecycle)</h3>
        <p className="text-sm text-gray-500 mb-6 flex justify-center gap-4">
          <span><span className="mr-1">✅</span> Fully Implemented</span>
          <span><span className="mr-1">🔵</span> Implemented - Pending Test</span>
          <span><span className="mr-1">🟡</span> Focused for Implementation</span>
        </p>

        <div className="mermaid flex justify-center w-full min-w-[800px]">
          {`flowchart TD
    %% Portfolio / Enterprise Layer
    subgraph Portfolio["Portfolio Management (Enterprise)"]
        Board[🟡 Board / Investors Rollup]
        Alloc[🔵 Resource & Budget Allocation]
    end

    %% Strategic Layer
    subgraph Strategic["Strategic Level (Exec Dashboard)"]
        G[✅ Company OKRs] 
        ResDash((🔵 Resource Dashboard Risks & Budgets))
    end
    
    %% Operational Layer
    subgraph Operational["Operational Level (Sales, Finance, HR)"]
        T[✅ Targets & Quotas]
        P1[🔵 Sales Campaigns & Pipelines]
        D[🔵 Deals & Revenue Tracking]
    end

    %% Execution Layer
    subgraph Execution["Execution Level (Dev & Projects)"]
        P2[✅ Project Portfolios]
        C[✅ Dev Sprints & Cycles]
        Tasks[✅ TaskNodes & Engineering Delivery]
    end

    %% Customer Feedback Loop
    subgraph Market["Market & Customer"]
        CustInsights((🟡 Customer Insights Satisfaction & Feedback))
    end

    %% Flow Connections
    Board --> Alloc
    Alloc --> G
    Alloc --> ResDash
    
    G --> T
    G --> P2
    
    T --> P1
    P1 --> D
    
    P2 --> C
    C --> Tasks
    
    %% Cross-functional Dependencies & Loops
    Tasks -. "Feature Readiness" .-> P1
    D -. "Revenue/Funding" .-> ResDash
    ResDash -. "Constraints" .-> P2
    
    %% Output & Rollups
    Tasks -- "Dev Metrics" --> DevDash((✅ Dev Dashboard))
    D -- "Sales KPIs" --> RevDash((✅ Revenue Dashboard))
    
    %% Customer Loop
    Tasks --> Market
    Market --> CustInsights
    CustInsights -. "Feature Requests/Bugs" .-> P2
    
    DevDash --> Board
    RevDash --> Board
    G --> Board

    classDef dash fill:#080,stroke:#333,stroke-width:2px;
    class DevDash,RevDash,ResDash,CustInsights dash;`}
        </div>
      </div>
    </main>
  );
}
