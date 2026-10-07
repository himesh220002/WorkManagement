# TaskPMS (WorkManagement)

Enterprise-grade Work, Project, and Team Management Operating System built with Next.js 16 (App Router), React 19, TypeScript, and MongoDB (Mongoose 9). Designed according to the Microsoft Fluent 2 design language principles.

---

## 🏗 System Architecture & Entity Hierarchy

```
Company (Root organization)
 ├── Projects
 │    ├── Teams (Lead, Members, Capacity, Workload)
 │    ├── Pipelines (Milestones, Progress, Owners, Todos)
 │    ├── Tasks (Kanban / Table / Gantt, Assignees, Estimates)
 │    ├── Cycles (Sprints & Delivery phases)
 │    ├── Deals & Campaigns (Sales pipeline, MRR, Revenue)
 │    └── Customer Feedback & Resource Allocations
 ├── Goals (Company, Project, and Team scopes)
 │    ├── Targets (Measurable key metrics)
 │    └── Daily Goals (Daily standup rollup into Team Goals)
 └── People / Users (Assignments across Tasks, Pipelines, and Deals)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 20.x
- **MongoDB**: MongoDB Atlas or a local instance

### Environment Setup

Create or verify `.env` in the root directory:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.ckkeqng.mongodb.net/projectManageDB?retryWrites=true&w=majority
NODE_ENV=development
```

### Installation

```bash
npm install --legacy-peer-deps
```

### Available Scripts

- `npm run dev`: Starts the Next.js development server
- `npm run build`: Compiles production build
- `npm run start`: Starts production server
- `npm run lint`: Runs ESLint checks
- `npm run typecheck`: Validates TypeScript without emitting code
- `npm test`: Runs unit tests with Vitest
- `npx tsx scripts/check-db.ts`: Verifies MongoDB connectivity and lists collections
- `npx tsx scripts/migrate-v2.ts`: Runs the data migration and schema normalization pipeline

---

## 🎨 Design System

Styled with Microsoft Fluent 2 design tokens:
- Calm, clean neutral surfaces (`#FFFFFF`, `#FAF9F8`, `#F3F2F1`)
- Single high-contrast blue brand accent (`#0078D4`)
- Semantic status tokens: On Track (Success), At Risk (Caution), Behind / Blocked (Danger)
- Accessible type ramp using Segoe UI and modern typography
- Consistent component primitives: Buttons, Cards, Badges, Tables, Drawers, Empty States, Skeletons

---

## 📐 Upgrade & Change Context

All architectural refactors, schema migrations, and feature upgrades are tracked in [`upgradechangecontext.json`](./upgradechangecontext.json).
