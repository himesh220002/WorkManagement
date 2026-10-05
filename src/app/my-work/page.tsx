import React from "react";
import connectToDatabase from "@/lib/mongodb";
import { Task, Pipeline, Deal, User } from "@/models";
import { serializeDocs } from "@/lib/serialize";
import MyWorkClient from "@/app/my-work/MyWorkClient";

export const metadata = {
  title: "My Work | TaskFlow PM",
  description: "Personal workspace with assigned tasks, pipelines, and deals",
};

export default async function MyWorkPage() {
  await connectToDatabase();

  const [tasks, pipelines, deals, users] = await Promise.all([
    Task.find({})
      .populate({ path: "projectId", select: "name", strictPopulate: false })
      .populate({ path: "assigneeIds", select: "name", strictPopulate: false })
      .sort({ dueDate: 1, createdAt: -1 })
      .lean(),
    Pipeline.find({})
      .populate({ path: "projectId", select: "name", strictPopulate: false })
      .populate({ path: "ownerId", select: "name", strictPopulate: false })
      .lean(),
    Deal.find({})
      .populate({ path: "projectId", select: "name", strictPopulate: false })
      .populate({ path: "ownerId", select: "name", strictPopulate: false })
      .lean(),
    User.find({ status: "Working" }).lean(),
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
