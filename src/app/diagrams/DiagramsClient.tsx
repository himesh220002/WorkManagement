"use client";

import { useEffect } from "react";
import mermaid from "mermaid";

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

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-8 text-center mb-6 overflow-x-auto">
        <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Work Management Lifecycle Workflow</h3>

        <div className="mermaid flex justify-center w-full min-w-[800px]">
          {`flowchart TD
    %% Strategic Planning Phase
    subgraph Strategy["Strategic Level (Exec Dashboard)"]
        G[Define Company Goals / OKRs] --> T[Set Quantifiable Targets]
    end
    
    %% Operational Phase
    subgraph Ops["Operational Level (Revenue & Sales Dashboards)"]
        T --> P1[Create Operational Pipelines]
        P1 --> D[Track Deals & Campaigns]
    end

    %% Execution Phase
    subgraph Execution["Execution Level (Dev & Projects Dashboards)"]
        G --> P2[Create Projects]
        Team[Assign Teams to Projects] -.-> P2
        P2 --> C[Break down into Cycles/Sprints]
        C --> Tasks[Assign TaskNodes to Users]
    end
    
    %% Data Flow Back to Dashboards
    Tasks -- "Hours & Status" --> DevDash((Dev Dashboard Metrics))
    D -- "Revenue & Leads" --> RevDash((Revenue Dashboard Metrics))
    T -- "Target Completion" --> ExecDash((Exec Dashboard OKR Progress))
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
        <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Full Dashboard Ecosystem Map (360° Lifecycle)</h3>

        <div className="mermaid flex justify-center w-full min-w-[800px]">
          {`flowchart TD
    %% Portfolio / Enterprise Layer
    subgraph Portfolio["Portfolio Management (Enterprise)"]
        Board[Board / Investors Rollup]
        Alloc[Resource & Budget Allocation]
    end

    %% Strategic Layer
    subgraph Strategic["Strategic Level (Exec Dashboard)"]
        G[Company OKRs] 
        ResDash((Resource Dashboard\nRisks & Budgets))
    end
    
    %% Operational Layer
    subgraph Operational["Operational Level (Sales, Finance, HR)"]
        T[Targets & Quotas]
        P1[Sales Campaigns & Pipelines]
        D[Deals & Revenue Tracking]
    end

    %% Execution Layer
    subgraph Execution["Execution Level (Dev & Projects)"]
        P2[Project Portfolios]
        C[Dev Sprints & Cycles]
        Tasks[TaskNodes & Engineering Delivery]
    end

    %% Customer Feedback Loop
    subgraph Market["Market & Customer"]
        CustInsights((Customer Insights\nSatisfaction & Feedback))
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
    Tasks -- "Dev Metrics" --> DevDash((Dev Dashboard))
    D -- "Sales KPIs" --> RevDash((Revenue Dashboard))
    
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
