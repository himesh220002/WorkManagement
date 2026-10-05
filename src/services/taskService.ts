import connectToDatabase from "@/lib/mongodb";
import { Task, ITask } from "@/models";
import { serializeDoc, serializeDocs } from "@/lib/serialize";

export interface TaskFilterOptions {
  companyId?: string;
  projectId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  search?: string;
}

export async function getTasks(options: TaskFilterOptions = {}) {
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (options.companyId) query.companyId = options.companyId;
  if (options.projectId) query.projectId = options.projectId;
  if (options.assigneeId) {
    query.$or = [
      { assigneeIds: options.assigneeId },
      { assignee: options.assigneeId },
    ];
  }
  if (options.status) query.status = options.status;
  if (options.priority) query.priority = options.priority;
  if (options.search) {
    query.name = { $regex: options.search, $options: "i" };
  }

  const tasks = await Task.find(query)
    .populate("assigneeIds")
    .populate("projectId", "name")
    .sort({ order: 1, createdAt: -1 })
    .lean();

  return serializeDocs<ITask>(tasks);
}

export async function getTaskById(taskId: string) {
  await connectToDatabase();
  const task = await Task.findById(taskId)
    .populate("assigneeIds")
    .populate("projectId")
    .lean();
  return serializeDoc<ITask>(task);
}

export async function getMyWorkTasks(userId: string) {
  await connectToDatabase();
  const tasks = await Task.find({
    $or: [{ assigneeIds: userId }],
  })
    .populate("projectId", "name")
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  return serializeDocs<ITask>(tasks);
}
