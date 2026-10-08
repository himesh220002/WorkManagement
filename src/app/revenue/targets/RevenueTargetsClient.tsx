"use client";

import { useState } from "react";
import {
  addTarget,
  toggleTargetChecklist,
  updateTargetChecklist,
  deleteTarget,
  updateTarget,
  addGoal,
} from "@/actions";
import { Badge } from "@/components/ui/Badge";
import {
  Target,
  Plus,
  Trash2,
  Edit3,
  Building2,
  Globe,
  Link as LinkIcon,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";

interface TargetChecklistItem {
  name: string;
  isCompleted: boolean;
}

interface TargetItem {
  _id: string;
  name: string;
  industry?: string;
  region?: string;
  status: string;
  expectedValue: number;
  actualValue: number;
  goalId?: string | null;
  checklist: TargetChecklistItem[];
}

interface GoalItem {
  _id: string;
  title: string;
}

interface RevenueTargetsClientProps {
  targets: TargetItem[];
  goals?: GoalItem[];
  isGuest?: boolean;
}

export default function RevenueTargetsClient({
  targets = [],
  goals = [],
  isGuest = false,
}: RevenueTargetsClientProps) {
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);

  return (
    <main className="flex flex-col min-w-0 p-0 sm:p-4 flex-1 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <header className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-4 sm:p-6 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg lg:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
              Revenue Target Customization &amp; Goals
            </h1>
            <Badge tone="brand" size="sm">
              Strategic OKRs
            </Badge>
            <Badge tone="success" size="sm">
              Live Alignment
            </Badge>
          </div>
          <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
            Define corporate revenue targets, link strategic OKR initiatives, and track milestone checklists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-[#DFF6DD] dark:bg-[#0F3818] text-[#107C10] dark:text-[#54B054] rounded-full inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#107C10]" />
            Active Target Tracking ({targets.length})
          </span>
        </div>
      </header>

      {/* Creation Panels (Goals & Targets) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Set Strategic Goal Form */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F3F2F1] dark:border-[#292827]">
            <Sparkles className="w-4 h-4 text-[#0078D4]" />
            <h2 className="text-sm font-semibold text-[#242424] dark:text-[#FFFFFF]">
              Strategic Goals &amp; Executive OKRs
            </h2>
          </div>
          <form action={addGoal} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
                Goal Title *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Q4 International Expansion & Enterprise ARR"
                className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
                  Key Result / Description
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="e.g. Hit $2.5M in closed ARR"
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
                  Category
                </label>
                <select
                  name="category"
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                >
                  <option value="Company">Company</option>
                  <option value="Department">Department</option>
                  <option value="Team">Team</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              {isGuest ? (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[4px] font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Set Goal</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[4px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Set Goal</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Create Target Form */}
        <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F3F2F1] dark:border-[#292827]">
            <Target className="w-4 h-4 text-[#107C10]" />
            <h2 className="text-sm font-semibold text-[#242424] dark:text-[#FFFFFF]">
              Create Quantitative Revenue Target
            </h2>
          </div>
          <form action={addTarget} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
                  Target Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. North America SaaS Target"
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
                  Link to Goal
                </label>
                <select
                  name="goalId"
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                >
                  <option value="">No Linked Goal</option>
                  {goals.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
                  Expected Val *
                </label>
                <input
                  type="number"
                  name="expectedValue"
                  required
                  placeholder="500000"
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
                  Actual Val
                </label>
                <input
                  type="number"
                  name="actualValue"
                  placeholder="0"
                  defaultValue={0}
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  name="industry"
                  placeholder="Fintech"
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
                  Region
                </label>
                <input
                  type="text"
                  name="region"
                  placeholder="NA East"
                  className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              {isGuest ? (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[4px] font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Target</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#107C10] hover:bg-[#0E6A0E] text-white rounded-[4px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Target</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Target Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {targets.map((target) => {
          const attainment = target.expectedValue
            ? Math.round((target.actualValue / target.expectedValue) * 100)
            : 0;
          const linkedGoal = goals.find((g) => g._id === target.goalId);

          return (
            <div
              key={target._id}
              className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-sm hover:shadow-md hover:border-[#0078D4] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Linked Goal Badge */}
                {linkedGoal && (
                  <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5]">
                    <LinkIcon className="w-3 h-3" />
                    <span className="truncate max-w-[240px]">{linkedGoal.title}</span>
                  </div>
                )}

                {editingTargetId === target._id ? (
                  <form
                    action={async (formData) => {
                      await updateTarget(formData);
                      setEditingTargetId(null);
                    }}
                    className="space-y-3 mb-4 text-xs"
                  >
                    <input type="hidden" name="targetId" value={target._id} />
                    <input
                      type="text"
                      name="name"
                      defaultValue={target.name}
                      required
                      className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] font-semibold text-[#242424] dark:text-[#FFFFFF]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        name="actualValue"
                        defaultValue={target.actualValue}
                        placeholder="Actual"
                        required
                        className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px]"
                      />
                      <input
                        type="number"
                        name="expectedValue"
                        defaultValue={target.expectedValue}
                        placeholder="Expected"
                        required
                        className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="industry"
                        defaultValue={target.industry || ""}
                        placeholder="Industry"
                        className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px]"
                      />
                      <input
                        type="text"
                        name="region"
                        defaultValue={target.region || ""}
                        placeholder="Region"
                        className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px]"
                      />
                    </div>
                    <select
                      name="status"
                      defaultValue={target.status}
                      className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px]"
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <select
                      name="goalId"
                      defaultValue={target.goalId || ""}
                      className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px]"
                    >
                      <option value="">No Linked Goal</option>
                      {goals.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.title}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingTargetId(null)}
                        className="px-3 py-1 bg-white dark:bg-[#292827] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px]"
                      >
                        Cancel
                      </button>
                      {isGuest ? (
                        <button
                          type="button"
                          disabled
                          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[4px] font-semibold"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="px-3 py-1 bg-[#0078D4] text-white rounded-[4px] font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#242424] dark:text-[#FFFFFF]">
                          {target.name}
                        </h3>
                        <button
                          onClick={() => setEditingTargetId(target._id)}
                          className="text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#0078D4] p-1"
                          title="Edit Target"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#605E5C] dark:text-[#C8C6C4] mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {target.industry || "General"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {target.region || "Global"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-[3px] ${target.status === "Completed"
                          ? "bg-[#DFF6DD] text-[#107C10]"
                          : target.status === "Rejected"
                            ? "bg-[#FDE7E9] text-[#D13438]"
                            : "bg-[#FFF4CE] text-[#8F6B00]"
                          }`}
                      >
                        {target.status}
                      </span>
                      {!isGuest && (
                        <form
                          action={deleteTarget}
                          onSubmit={(e) => {
                            if (!window.confirm(`Delete target "${target.name}"?`)) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="targetId" value={target._id} />
                          <button
                            type="submit"
                            className="text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#D13438] p-1 cursor-pointer"
                            title="Delete Target"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className="my-3">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-[#242424] dark:text-[#FFFFFF]">
                      ${target.actualValue.toLocaleString()} / ${target.expectedValue.toLocaleString()}
                    </span>
                    <span className="font-bold text-[#0078D4]">{attainment}%</span>
                  </div>
                  <div className="w-full bg-[#EDEBE9] dark:bg-[#323130] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0078D4] h-full rounded-full transition-all"
                      style={{ width: `${Math.min(attainment, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div className="mt-4 pt-3 border-t border-[#F3F2F1] dark:border-[#292827]">
                  <h4 className="text-xs font-semibold text-[#605E5C] dark:text-[#C8C6C4] uppercase tracking-wider mb-2">
                    Actionable Milestone Checklist
                  </h4>
                  <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
                    {target.checklist?.map((task, idx) => (
                      <form
                        key={idx}
                        action={isGuest ? undefined : toggleTargetChecklist}
                        onSubmit={isGuest ? (e) => e.preventDefault() : undefined}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-[#F3F2F1] dark:hover:bg-[#292827] transition-colors"
                      >
                        <input type="hidden" name="targetId" value={target._id} />
                        <input type="hidden" name="taskIndex" value={idx.toString()} />
                        <button
                          type="submit"
                          disabled={isGuest}
                          className={`text-[#0078D4] dark:text-[#479EF5] shrink-0 ${isGuest ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                        >
                          {task.isCompleted ? (
                            <CheckSquare className="w-4 h-4 text-[#107C10]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#8A8886]" />
                          )}
                        </button>
                        <span
                          className={`text-xs ${task.isCompleted
                            ? "line-through text-[#8A8886]"
                            : "text-[#242424] dark:text-[#FFFFFF]"
                            }`}
                        >
                          {task.name}
                        </span>
                      </form>
                    ))}
                    {(!target.checklist || target.checklist.length === 0) && (
                      <p className="text-xs text-[#8A8886] italic py-1">No steps added yet.</p>
                    )}
                  </div>

                  {/* Add Checklist Step Form */}
                  <form
                    action={isGuest ? undefined : updateTargetChecklist}
                    onSubmit={isGuest ? (e) => e.preventDefault() : undefined}
                    className="flex gap-2"
                  >
                    <input type="hidden" name="targetId" value={target._id} />
                    <input
                      type="text"
                      name="taskName"
                      required
                      placeholder="Add actionable step..."
                      disabled={isGuest}
                      className="flex-1 p-1.5 text-xs bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                    />
                    {isGuest ? (
                      <button
                        type="button"
                        disabled
                        className="px-2.5 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-[4px] text-xs font-semibold"
                      >
                        Add
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[4px] text-xs font-semibold cursor-pointer"
                      >
                        Add
                      </button>
                    )}
                  </form>
                </div>
              </div>
            </div>
          );
        })}

        {targets.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px]">
            <Target className="w-10 h-10 text-[#C8C6C4] mx-auto mb-2" />
            <h3 className="font-semibold text-sm text-[#242424] dark:text-[#FFFFFF]">
              No Revenue Targets Defined
            </h3>
            <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-1">
              Create your first target using the creation form above.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
