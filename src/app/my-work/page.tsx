import React from "react";
import connectToDatabase from "@/lib/mongodb";
import { Task, Pipeline, Deal, User } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { serializeDocs } from "@/lib/serialize";
import MyWorkClient from "@/app/my-work/MyWorkClient";

import { fetchWithCache } from "@/lib/cache";

export const metadata = {
  title: "My Work | TaskPMS",
  description: "Personal workspace with assigned tasks, pipelines, and deals",
};

export default async function MyWorkPage() {
  await connectToDatabase();
  const session = await getCurrentSession();
  const tenantFilter = getTenantQueryFilter(session);
  const cId = session.companyId || "default";

  const [tasks, pipelines, deals, users] = await Promise.all([
    fetchWithCache(`mywork_tasks:${cId}`, 20, () =>
      Task.find(tenantFilter)
        .populate({ path: "projectId", select: "name", strictPopulate: false })
        .populate({ path: "assigneeIds", select: "name", strictPopulate: false })
        .sort({ dueDate: 1, createdAt: -1 })
        .lean()
    ),
    fetchWithCache(`mywork_pipelines:${cId}`, 25, () =>
      Pipeline.find(tenantFilter)
        .populate({ path: "projectId", select: "name", strictPopulate: false })
        .populate({ path: "ownerId", select: "name", strictPopulate: false })
        .lean()
    ),
    fetchWithCache(`mywork_deals:${cId}`, 25, () =>
      Deal.find(tenantFilter)
        .populate({ path: "projectId", select: "name", strictPopulate: false })
        .populate({ path: "ownerId", select: "name", strictPopulate: false })
        .lean()
    ),
    fetchWithCache(`mywork_users:${cId}`, 30, () =>
      User.find({ ...tenantFilter, status: "Working" }).lean()
    ),
  ]);

  // Compute accurate dynamic progress for each pipeline based on todos and linked tasks
  const cleanPipelines = pipelines.map((p: any) => {
    const pIdStr = p._id?.toString() || "";
    const completedTodos = Array.isArray(p.todos)
      ? p.todos.filter((t: any) => t.completed).length
      : 0;
    const totalTodos = Array.isArray(p.todos) ? p.todos.length : 0;

    // Direct pipeline tasks
    const linkedTasks = tasks.filter(
      (t: any) => t.pipelineId && t.pipelineId.toString() === pIdStr
    );
    const completedLinkedTasks = linkedTasks.filter(
      (t: any) => ["done", "completed"].includes((t.status || "").toLowerCase())
    ).length;
    const totalLinkedTasks = linkedTasks.length;

    let computedProgress = 0;
    if (totalTodos > 0 && totalLinkedTasks > 0) {
      computedProgress = Math.round(
        ((completedTodos + completedLinkedTasks) / (totalTodos + totalLinkedTasks)) * 100
      );
    } else if (totalTodos > 0) {
      computedProgress = Math.round((completedTodos / totalTodos) * 100);
    } else if (totalLinkedTasks > 0) {
      computedProgress = Math.round((completedLinkedTasks / totalLinkedTasks) * 100);
    } else {
      computedProgress = Number(p.progress || 0);
    }

    return {
      ...p,
      progress: computedProgress,
      totalTodos,
      completedTodos,
      totalLinkedTasks,
      completedLinkedTasks,
    };
  });

  return (
    <MyWorkClient
      initialTasks={serializeDocs(tasks)}
      initialPipelines={serializeDocs(cleanPipelines)}
      initialDeals={serializeDocs(deals)}
      users={serializeDocs(users)}
    />
  );
}
