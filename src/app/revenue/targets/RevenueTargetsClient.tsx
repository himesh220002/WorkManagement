"use client";

import { addTarget, toggleTargetChecklist, updateTargetChecklist } from "@/actions";

import { useState } from "react";

export default function RevenueTargetsClient({ targets }: { targets: any[] }) {
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
          <input type="text" name="name" className="flex-1 min-w-[200px] p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Target Name" required />
          <input type="text" name="industry" className="w-48 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Industry (Optional)" />
          <input type="text" name="region" className="w-48 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Region (Optional)" />
          <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors flex items-center gap-2">
            <i className="fa-solid fa-plus"></i> Create Target
          </button>
        </form>
      </div>

      {/* Target List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {targets && targets.length > 0 ? (
          targets.map((target) => (
            <div key={target._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-semibold mb-1 text-gray-900 dark:text-gray-100">{target.name}</h4>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <i className="fa-solid fa-industry mr-1"></i> {target.industry || "N/A"} &nbsp;|&nbsp;
                    <i className="fa-solid fa-earth-americas ml-1 mr-1"></i> {target.region || "N/A"}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${target.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {target.status}
                </span>
              </div>

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
