import React from "react";
import connectToDatabase from "@/lib/mongodb";
import { Task, Pipeline, Deal, User } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { serializeDocs } from "@/lib/serialize";
import MyWorkClient from "@/app/my-work/MyWorkClient";

import { fetchWithCache } from "@/lib/cache";

export const metadata = {
  title: "My Work | TaskFlow PM",
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

  return (
    <MyWorkClient
      initialTasks={serializeDocs(tasks)}
      initialPipelines={serializeDocs(pipelines)}
      initialDeals={serializeDocs(deals)}
      users={serializeDocs(users)}
    />
  );
}
