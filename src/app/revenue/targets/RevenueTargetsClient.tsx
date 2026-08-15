"use client";

import { addTarget, toggleTargetChecklist, updateTargetChecklist, deleteTarget, updateTarget } from "@/actions";

import { useState } from "react";

export default function RevenueTargetsClient({ targets, goals = [] }: { targets: any[], goals?: any[] }) {
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);

  return (
    <main className="flex flex-col min-w-0 p-6 flex-1">
      <header className=" bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 rounded-lg mb-6 flex justify-between items-center">
        <div>
          <h1 className=" text-3xl font-bold text-gray-900 dark:text-gray-100">Target Customization & Goals</h1>
        </div>
        <div className="storage-tag px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
          Active
        </div>
      </header>

      {/* Create Target Form */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-6">
        <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Target</h4>
        <form action={addTarget} className="flex gap-4 flex-wrap items-center">
          <input type="text" name="name" className="flex-1 min-w-[150px] p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Target Name" required />
          <input type="number" name="expectedValue" className="w-32 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Expected Val" required />
          <input type="number" name="actualValue" className="w-32 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Actual Val" />
          
          <select name="goalId" className="w-48 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <option value="">No Linked Goal</option>
            {goals.map(g => (
              <option key={g._id} value={g._id}>{g.title}</option>
            ))}
          </select>
          
          <input type="text" name="industry" className="w-32 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Industry" />
          <input type="text" name="region" className="w-32 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Region" />
          <button type="submit" className="px-4 py-2 bg-emerald-500 text-white text-sm rounded hover:bg-emerald-600 transition-colors flex items-center gap-2">
            <i className="fa-solid fa-plus"></i> Create Target
          </button>
        </form>
      </div>

      {/* Target List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {targets && targets.length > 0 ? (
          targets.map((target) => (
            <div key={target._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 flex flex-col h-full relative">
              {target.goalId && (
                <div className="absolute -top-3 -right-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow border-2 border-white dark:border-gray-800">
                  <i className="fa-solid fa-link"></i> Linked
                </div>
              )}
              
              {editingTargetId === target._id ? (
                <form action={async (formData) => {
                  await updateTarget(formData);
                  setEditingTargetId(null);
                }} className="flex flex-col gap-3 mb-4">
                  <input type="hidden" name="targetId" value={target._id} />
                  <input type="text" name="name" defaultValue={target.name} className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-semibold" required />
                  <div className="flex gap-2">
                    <input type="number" name="actualValue" defaultValue={target.actualValue} className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Actual" required />
                    <input type="number" name="expectedValue" defaultValue={target.expectedValue} className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Expected" required />
                  </div>
                  <div className="flex gap-2">
                    <input type="text" name="industry" defaultValue={target.industry} className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Industry" />
                    <input type="text" name="region" defaultValue={target.region} className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Region" />
                  </div>
                  <select name="status" defaultValue={target.status} className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <div className="flex gap-2 justify-end mt-2">
                    <button type="button" onClick={() => setEditingTargetId(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Cancel</button>
                    <button type="submit" className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">Save Changes</button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{target.name}</h4>
                      <button onClick={() => setEditingTargetId(target._id)} className="text-gray-400 hover:text-blue-500 transition-colors p-1" title="Edit Target">
                        <i className="fa-solid fa-pen text-xs"></i>
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <i className="fa-solid fa-industry mr-1"></i> {target.industry || "N/A"} &nbsp;|&nbsp;
                      <i className="fa-solid fa-earth-americas ml-1 mr-1"></i> {target.region || "N/A"}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                        Actual: {target.actualValue}
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                        Expected: {target.expectedValue}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${target.status === "Completed" ? "bg-emerald-100 text-emerald-700" : target.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {target.status}
                    </span>
                    <form action={deleteTarget} className="m-0" onSubmit={(e) => { if (!window.confirm("Are you sure you want to delete this Target?")) e.preventDefault(); }}>
                      <input type="hidden" name="targetId" value={target._id.toString()} />
                      <button type="submit" className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Delete Target">
                        <i className="fa-solid fa-trash-can text-sm"></i>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Checklist */}
              <div className="flex-1 mb-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md border border-gray-300 dark:border-gray-600">
                <h5 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300">Completion Checklist</h5>
                <div className="space-y-3 mb-4">
                  {target.checklist && target.checklist.map((task: any, index: number) => (
                    <form key={index} action={toggleTargetChecklist} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:bg-gray-700/50 rounded transition-colors m-0">
                      <input type="hidden" name="targetId" value={target._id.toString()} />
                      <input type="hidden" name="taskIndex" value={index.toString()} />
                      <input 
                        type="checkbox" 
                        onChange={(e) => e.target.form?.submit()}
                        defaultChecked={task.isCompleted}
                        className="w-4 h-4 cursor-pointer accent-blue-500" 
                      />
                      <span className={`text-sm ${task.isCompleted ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                        {task.name}
                      </span>
                    </form>
                  ))}
                </div>
              </div>

              {/* Add New Checklist Item Form */}
              <form action={updateTargetChecklist} className="flex gap-2 m-0 border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto">
                <input type="hidden" name="targetId" value={target._id.toString()} />
                <input type="text" name="taskName" className="flex-1 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Add actionable step..." required />
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">Add</button>
              </form>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-10 text-center col-span-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <i className="fa-solid fa-bullseye text-4xl text-gray-500 dark:text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">No Targets Found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Create your first revenue or performance target above.</p>
          </div>
        )}
      </div>
    </main>
  );
}
