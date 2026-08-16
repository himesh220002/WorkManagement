"use client";

import { updateTaskNode } from "@/actions";

export default function EditableTaskList({ tasks, pipelines = [], cycles = [] }: { tasks: any[], pipelines?: any[], cycles?: any[] }) {
  if (!tasks || tasks.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <i className="fa-solid fa-list-check text-blue-600"></i> Active Project Tasks
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Task Name</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Severity</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Est. Hours</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actual Hours</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Pipeline</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Sprint</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="p-2">
                  <form action={updateTaskNode} className="m-0">
                    <input type="hidden" name="taskId" value={task._id} />
                    <input 
                      type="text" 
                      name="name" 
                      defaultValue={task.name} 
                      className="w-full p-2 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-transparent text-sm text-gray-900 dark:text-gray-100 transition-colors"
                      onBlur={(e) => {
                        if (e.target.value !== task.name) e.target.form?.requestSubmit();
                      }}
                    />
                  </form>
                </td>
                <td className="p-2">
                  <form action={updateTaskNode} className="m-0">
                    <input type="hidden" name="taskId" value={task._id} />
                    <select 
                      name="status" 
                      defaultValue={task.status?.toLowerCase() || "open"} 
                      className="w-full p-2 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 bg-transparent text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                      onChange={(e) => e.target.form?.requestSubmit()}
                    >
                      <option value="open">Open</option>
                      <option value="todo">Todo</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Code Review</option>
                      <option value="completed">Completed</option>
                      <option value="done">Done</option>
                    </select>
                  </form>
                </td>
                <td className="p-2">
                  <form action={updateTaskNode} className="m-0">
                    <input type="hidden" name="taskId" value={task._id} />
                    <select 
                      name="severity" 
                      defaultValue={task.severity?.toLowerCase() || "medium"} 
                      className="w-full p-2 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 bg-transparent text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                      onChange={(e) => e.target.form?.requestSubmit()}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </form>
                </td>
                <td className="p-2">
                  <form action={updateTaskNode} className="m-0">
                    <input type="hidden" name="taskId" value={task._id} />
                    <input 
                      type="number" 
                      name="estimatedHours" 
                      defaultValue={task.estimatedHours || ""} 
                      placeholder="0"
                      className="w-20 p-2 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-transparent text-sm text-gray-900 dark:text-gray-100 transition-colors"
                      onBlur={(e) => {
                        if (Number(e.target.value) !== (task.estimatedHours || 0)) e.target.form?.requestSubmit();
                      }}
                    />
                  </form>
                </td>
                <td className="p-2">
                  <form action={updateTaskNode} className="m-0">
                    <input type="hidden" name="taskId" value={task._id} />
                    <input 
                      type="number" 
                      name="actualHours" 
                      defaultValue={task.actualHours || ""} 
                      placeholder="0"
                      className="w-20 p-2 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-transparent text-sm text-gray-900 dark:text-gray-100 transition-colors"
                      onBlur={(e) => {
                        if (Number(e.target.value) !== (task.actualHours || 0)) e.target.form?.requestSubmit();
                      }}
                    />
                  </form>
                </td>
                <td className="p-2">
                  <form action={updateTaskNode} className="m-0">
                    <input type="hidden" name="taskId" value={task._id} />
                    <select 
                      name="pipelineId" 
                      defaultValue={task.pipelineId || "none"} 
                      className="w-full p-2 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 bg-transparent text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                      onChange={(e) => e.target.form?.requestSubmit()}
                    >
                      <option value="none">No Pipeline</option>
                      {pipelines.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </form>
                </td>
                <td className="p-2">
                  <form action={updateTaskNode} className="m-0">
                    <input type="hidden" name="taskId" value={task._id} />
                    <select 
                      name="cycleId" 
                      defaultValue={task.cycleId || "none"} 
                      className="w-full p-2 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 bg-transparent text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                      onChange={(e) => e.target.form?.requestSubmit()}
                    >
                      <option value="none">No Sprint</option>
                      {cycles.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
