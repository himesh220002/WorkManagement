import { describe, it, expect } from "vitest";

/**
 * Tests for Pipeline Dynamic Progress calculation and ownership attribution.
 */
describe("Pipeline Dynamic Progress and Rollup", () => {
  function computePipelineProgress(
    pipeline: { progress?: number; todos?: Array<{ completed: boolean }> },
    linkedTasks: Array<{ status: string }> = []
  ): number {
    const completedTodos = Array.isArray(pipeline.todos)
      ? pipeline.todos.filter((t) => t.completed).length
      : 0;
    const totalTodos = Array.isArray(pipeline.todos) ? pipeline.todos.length : 0;

    const completedLinkedTasks = linkedTasks.filter((t) =>
      ["done", "completed"].includes((t.status || "").toLowerCase())
    ).length;
    const totalLinkedTasks = linkedTasks.length;

    if (totalTodos > 0 && totalLinkedTasks > 0) {
      return Math.round(
        ((completedTodos + completedLinkedTasks) / (totalTodos + totalLinkedTasks)) * 100
      );
    }
    if (totalTodos > 0) {
      return Math.round((completedTodos / totalTodos) * 100);
    }
    if (totalLinkedTasks > 0) {
      return Math.round((completedLinkedTasks / totalLinkedTasks) * 100);
    }
    return Number(pipeline.progress || 0);
  }

  function matchesPipelineOwner(
    pipeline: {
      ownerId?: string | { _id: string };
      owner?: string;
      memberIds?: string[];
    },
    selectedUserId: string,
    users: Array<{ _id: string; name: string }> = []
  ): boolean {
    if (selectedUserId === "all") return true;
    const ownerIdStr =
      typeof pipeline.ownerId === "object"
        ? pipeline.ownerId?._id
        : pipeline.ownerId;
    if (ownerIdStr === selectedUserId) return true;

    const user = users.find((u) => u._id === selectedUserId);
    if (
      user &&
      pipeline.owner &&
      pipeline.owner.toLowerCase() === user.name.toLowerCase()
    ) {
      return true;
    }

    if (
      Array.isArray(pipeline.memberIds) &&
      pipeline.memberIds.some((m) => m === selectedUserId)
    ) {
      return true;
    }

    return false;
  }

  it("should return default progress when no todos or linked tasks exist", () => {
    const pipeline = { progress: 35 };
    expect(computePipelineProgress(pipeline)).toBe(35);
  });

  it("should return 0% progress when todos exist but none are completed", () => {
    const pipeline = {
      progress: 0,
      todos: [
        { completed: false },
        { completed: false },
        { completed: false },
      ],
    };
    expect(computePipelineProgress(pipeline)).toBe(0);
  });

  it("should dynamically calculate 50% when 1 of 2 checklist todos is completed", () => {
    const pipeline = {
      progress: 0,
      todos: [
        { completed: true },
        { completed: false },
      ],
    };
    expect(computePipelineProgress(pipeline)).toBe(50);
  });

  it("should dynamically calculate 100% when all checklist todos are completed", () => {
    const pipeline = {
      progress: 0,
      todos: [
        { completed: true },
        { completed: true },
      ],
    };
    expect(computePipelineProgress(pipeline)).toBe(100);
  });

  it("should calculate progress from linked tasks when todos are empty", () => {
    const pipeline = { progress: 0, todos: [] };
    const tasks = [
      { status: "Done" },
      { status: "Todo" },
      { status: "In Progress" },
      { status: "Done" },
    ];
    // 2 out of 4 tasks done = 50%
    expect(computePipelineProgress(pipeline, tasks)).toBe(50);
  });

  it("should compute blended progress when both checklist todos and tasks exist", () => {
    const pipeline = {
      progress: 0,
      todos: [
        { completed: true },
        { completed: false },
      ],
    }; // 1/2
    const tasks = [
      { status: "Done" },
      { status: "Done" },
    ]; // 2/2
    // Total items: 4, Total completed: 3 -> 75%
    expect(computePipelineProgress(pipeline, tasks)).toBe(75);
  });

  it("should match pipeline ownership by ownerId", () => {
    const pipeline = { ownerId: "user_owner_1" };
    expect(matchesPipelineOwner(pipeline, "user_owner_1")).toBe(true);
    expect(matchesPipelineOwner(pipeline, "user_other")).toBe(false);
  });

  it("should match pipeline ownership by populated ownerId object", () => {
    const pipeline = { ownerId: { _id: "user_owner_1" } };
    expect(matchesPipelineOwner(pipeline, "user_owner_1")).toBe(true);
  });

  it("should match pipeline ownership by user name fallback", () => {
    const pipeline = { owner: "Sarah Connor" };
    const users = [{ _id: "usr_1", name: "Sarah Connor" }];
    expect(matchesPipelineOwner(pipeline, "usr_1", users)).toBe(true);
  });

  it("should match pipeline ownership when user is in memberIds", () => {
    const pipeline = { memberIds: ["usr_tl_1", "usr_dev_2"] };
    expect(matchesPipelineOwner(pipeline, "usr_tl_1")).toBe(true);
    expect(matchesPipelineOwner(pipeline, "usr_other")).toBe(false);
  });
});
