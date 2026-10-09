"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Copy,
  GripVertical,
  Flag,
  Calendar,
  CheckSquare,
  Paperclip,
  PenTool,
  Info,
  ChevronDown,
  Eye,
  Share2,
  Save,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Code,
  ArrowUp,
  ArrowDown,
  Settings,
  X,
  FileText,
  UserCheck,
} from "lucide-react";
import { IForm, IFormQuestion } from "@/models/form";
import AddQuestionDropdown from "./AddQuestionDropdown";
import FormTemplateModal from "./FormTemplateModal";
import { FormTemplateDefinition } from "@/lib/formTemplates";
import { useToast } from "@/components/ui/Toast";

interface FormEditorProps {
  initialForm: IForm;
  orgCode?: string;
  onSaved?: (updatedForm: IForm) => void;
}

export default function FormEditor({ initialForm, orgCode = "", onSaved }: FormEditorProps) {
  const { success, error } = useToast();
  const [form, setForm] = useState<IForm>(initialForm);
  const [activeTab, setActiveTab] = useState<"builder" | "preview" | "submissions" | "share">("builder");
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Preview Submission State
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});
  const [isSubmittingPreview, setIsSubmittingPreview] = useState(false);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

  // Save changes to backend
  const handleSaveForm = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/forms/${form._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          questions: form.questions,
          themeColor: form.themeColor,
          isPublished: form.isPublished,
          submitButtonText: form.submitButtonText,
          createTaskOnSubmission: form.createTaskOnSubmission,
          targetProjectId: form.targetProjectId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save form");
      }

      setHasUnsavedChanges(false);
      success("Form saved successfully!");
      if (onSaved) onSaved(data.form);
    } catch (err: any) {
      error(err.message || "An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateField = (field: keyof IForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAddQuestion = (newQuestion: IFormQuestion) => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
    setHasUnsavedChanges(true);
    success(`Added "${newQuestion.title}" question`);
  };

  const handleUpdateQuestion = (id: string, updates: Partial<IFormQuestion>) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    }));
    setHasUnsavedChanges(true);
  };

  const handleDeleteQuestion = (id: string) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
    setHasUnsavedChanges(true);
  };

  const handleDuplicateQuestion = (id: string) => {
    const qIndex = form.questions.findIndex((q) => q.id === id);
    if (qIndex === -1) return;
    const targetQ = form.questions[qIndex];
    const duplicated: IFormQuestion = {
      ...targetQ,
      id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      title: `${targetQ.title} (Copy)`,
    };
    const nextQuestions = [...form.questions];
    nextQuestions.splice(qIndex + 1, 0, duplicated);
    setForm((prev) => ({ ...prev, questions: nextQuestions }));
    setHasUnsavedChanges(true);
    success("Question duplicated");
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= form.questions.length) return;
    const nextQuestions = [...form.questions];
    const [moved] = nextQuestions.splice(index, 1);
    nextQuestions.splice(targetIdx, 0, moved);
    setForm((prev) => ({ ...prev, questions: nextQuestions }));
    setHasUnsavedChanges(true);
  };

  const handleSelectTemplate = (template: FormTemplateDefinition) => {
    setForm((prev) => ({
      ...prev,
      title: template.name,
      description: template.description,
      templateId: template.id,
      themeColor: template.themeColor,
      questions: template.questions.map((q) => ({
        ...q,
        id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      })),
    }));
    setHasUnsavedChanges(true);
    success(`Switched to "${template.name}" template`);
  };

  // Preview Submission Simulation
  const handlePreviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPreview(true);
    try {
      const res = await fetch(`/api/forms/${form._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: previewAnswers,
          respondentEmail: "tester@taskflow.local",
          respondentName: "Preview User",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission error");
      }
      setPreviewSubmitted(true);
      success("Form response recorded!");
    } catch (err: any) {
      error(err.message || "Failed to submit response");
    } finally {
      setIsSubmittingPreview(false);
    }
  };

  const publicShareUrl = typeof window !== "undefined"
    ? `${window.location.origin}${orgCode ? `/${orgCode}` : ""}/forms/${form._id}/share`
    : `/forms/${form._id}/share`;

  return (
    <div className="flex flex-col min-h-screen bg-[#111113] text-[#E4E4E7]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#16161A] border-b border-[#26262B] px-4 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white truncate max-w-[200px] sm:max-w-xs">
                  {form.title}
                </span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-medium">
                  {form.isPublished ? "Live" : "Draft"}
                </span>
              </div>
              <span className="text-[10px] text-gray-400">
                {form.questions.length} Questions · {form.submissions?.length || 0} Submissions
              </span>
            </div>
          </div>
        </div>

        {/* Center Mode Tabs */}
        <div className="flex items-center gap-1 bg-[#1E1E24] p-1 rounded-lg border border-[#2E2E36]">
          <button
            type="button"
            onClick={() => setActiveTab("builder")}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "builder" ? "bg-[#0078D4] text-white shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "preview" ? "bg-[#0078D4] text-white shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("submissions")}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "submissions" ? "bg-[#0078D4] text-white shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            Submissions ({form.submissions?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("share")}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "share" ? "bg-[#0078D4] text-white shadow-sm" : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-1">
              <Share2 className="w-3 h-3" />
              <span>Share</span>
            </span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg border border-[#3A3A42] bg-[#222228] text-gray-300 hover:text-white hover:bg-[#2A2A32] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          <button
            type="button"
            onClick={handleSaveForm}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#006abc] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Saved"}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {/* --- TAB 1: BUILDER MODE --- */}
        {activeTab === "builder" && (
          <div className="space-y-6">
            {/* Form Title & Subtitle Card matching Screenshot 1 */}
            <div className="p-6 rounded-2xl bg-[#18181C] border border-[#27272C] shadow-lg">
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleUpdateField("title", e.target.value)}
                placeholder="Form Title"
                className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-500 focus:outline-none border-b border-transparent hover:border-[#383842] focus:border-[#0078D4] transition-colors pb-1"
              />
              <textarea
                value={form.description || ""}
                onChange={(e) => handleUpdateField("description", e.target.value)}
                placeholder="Form Description / Subtitle..."
                rows={2}
                className="w-full mt-3 bg-transparent text-xs sm:text-sm text-gray-300 placeholder-gray-500 focus:outline-none resize-none border-b border-transparent hover:border-[#383842] focus:border-[#0078D4] transition-colors leading-relaxed"
              />
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {form.questions.map((question, idx) => {
                const isEditing = editingQuestionId === question.id;
                const isInfoBlock = question.type === "information_block";

                return (
                  <div
                    key={question.id}
                    className="relative group rounded-xl bg-[#18181C] border border-[#27272C] hover:border-[#3A3A42] p-5 transition-all shadow-sm"
                  >
                    {/* Header Row: Drag Handle, Title & Action Bar */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2.5 flex-1">
                        <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                          <GripVertical className="w-4 h-4 text-gray-500 hover:text-gray-300 cursor-grab" />
                        </div>
                        <div className="flex-1">
                          {/* Editable Question Title */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <input
                              type="text"
                              value={question.title}
                              onChange={(e) => handleUpdateQuestion(question.id, { title: e.target.value })}
                              className="bg-transparent text-sm font-semibold text-white focus:outline-none border-b border-transparent hover:border-gray-700 focus:border-[#0078D4] transition-colors flex-1 min-w-[200px]"
                            />
                            {question.required && !isInfoBlock && (
                              <span className="text-rose-500 font-bold">*</span>
                            )}
                          </div>

                          {/* Editable Question Description / Tip */}
                          {!isInfoBlock && (
                            <input
                              type="text"
                              value={question.description || ""}
                              onChange={(e) => handleUpdateQuestion(question.id, { description: e.target.value })}
                              placeholder="Add helpful tip or instructions for respondent..."
                              className="w-full mt-1 bg-transparent text-[11px] text-gray-400 placeholder-gray-600 focus:outline-none border-b border-transparent hover:border-gray-800 focus:border-[#0078D4] transition-colors"
                            />
                          )}
                        </div>
                      </div>

                      {/* Question Actions Toolbar */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setEditingQuestionId(isEditing ? null : question.id)}
                          className="px-2 py-1 rounded bg-[#24242A] hover:bg-[#2C2C34] text-[11px] font-medium text-gray-300 hover:text-white transition-colors cursor-pointer"
                        >
                          {isEditing ? "Done" : "Edit question"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, "up")}
                          disabled={idx === 0}
                          title="Move Up"
                          className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#24242A] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, "down")}
                          disabled={idx === form.questions.length - 1}
                          title="Move Down"
                          className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#24242A] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateQuestion(question.id)}
                          title="Duplicate"
                          className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#24242A] cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(question.id)}
                          title="Delete"
                          className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-[#24242A] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Specific Body / Preview matching Screenshot 1 */}
                    <div className="mt-3">
                      {/* 1. Information Block (Layout) */}
                      {isInfoBlock && (
                        <div className="p-3.5 rounded-lg bg-[#202026] border border-[#2E2E36] text-xs text-gray-300 leading-relaxed">
                          {isEditing ? (
                            <textarea
                              rows={3}
                              value={question.layoutContent || ""}
                              onChange={(e) => handleUpdateQuestion(question.id, { layoutContent: e.target.value })}
                              placeholder="Enter guidance, rich descriptions, or announcement text..."
                              className="w-full bg-[#18181C] p-2 rounded border border-[#3A3A42] text-xs text-white focus:outline-none focus:border-[#0078D4]"
                            />
                          ) : (
                            <p>{question.layoutContent || "Give as many details as you can..."}</p>
                          )}
                        </div>
                      )}

                      {/* 2. Short Text */}
                      {question.type === "short_text" && (
                        <input
                          type="text"
                          disabled
                          placeholder={question.placeholder || "Your answer here..."}
                          className="w-full p-2.5 rounded-lg bg-[#141416] border border-[#27272A] text-xs text-gray-400 placeholder-gray-600 cursor-not-allowed"
                        />
                      )}

                      {/* 3. Long Text */}
                      {question.type === "long_text" && (
                        <textarea
                          disabled
                          rows={3}
                          placeholder={question.placeholder || "Project goals, scope, task & Doc links"}
                          className="w-full p-2.5 rounded-lg bg-[#141416] border border-[#27272A] text-xs text-gray-400 placeholder-gray-600 cursor-not-allowed resize-none"
                        />
                      )}

                      {/* 4. Task Property (Priority Dropdown) / Single Select */}
                      {(question.type === "task_property" || question.type === "single_select") && (
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141416] border border-[#27272A] text-xs text-gray-400">
                          <div className="flex items-center gap-2">
                            {question.taskProperty === "priority" && <Flag className="w-3.5 h-3.5 text-rose-400" />}
                            <span>Select {question.taskProperty === "priority" ? "Priority" : "an Option"}</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        </div>
                      )}

                      {/* 5. Multi Select */}
                      {question.type === "multi_select" && (
                        <div className="flex flex-wrap gap-2">
                          {(question.options || ["Option 1", "Option 2"]).map((opt, oIdx) => (
                            <span
                              key={oIdx}
                              className="px-2.5 py-1 rounded bg-[#222228] border border-[#32323A] text-xs text-gray-300"
                            >
                              ☐ {opt}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 6. Dates */}
                      {question.type === "date" && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#141416] border border-[#27272A] text-xs text-gray-400">
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          <span>Select Date...</span>
                        </div>
                      )}

                      {/* 7. Uploads / Attachments Dropzone matching Screenshot 1 */}
                      {question.type === "uploads" && (
                        <div className="border border-dashed border-[#33333A] rounded-xl p-6 text-center bg-[#141416]/50">
                          <p className="text-xs text-gray-400">
                            Drop your files here to <span className="text-sky-400 underline">upload</span>
                          </p>
                        </div>
                      )}

                      {/* 8. Signature Pad Preview */}
                      {question.type === "signature" && (
                        <div className="border border-[#2E2E36] rounded-xl p-4 bg-[#141416] text-center">
                          <PenTool className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                          <span className="text-[11px] text-gray-400">Digital signature drawing pad</span>
                        </div>
                      )}

                      {/* 9. Contact Info */}
                      {question.type === "contact_info" && (
                        <input
                          type="text"
                          disabled
                          placeholder={question.placeholder || "alex@company.com"}
                          className="w-full p-2.5 rounded-lg bg-[#141416] border border-[#27272A] text-xs text-gray-400 placeholder-gray-600 cursor-not-allowed"
                        />
                      )}

                      {/* 10. Number */}
                      {question.type === "number" && (
                        <input
                          type="number"
                          disabled
                          placeholder={question.placeholder || "0"}
                          className="w-32 p-2.5 rounded-lg bg-[#141416] border border-[#27272A] text-xs text-gray-400 placeholder-gray-600 cursor-not-allowed"
                        />
                      )}

                      {/* 11. People */}
                      {question.type === "people" && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#141416] border border-[#27272A] text-xs text-gray-400">
                          <UserCheck className="w-4 h-4 text-cyan-400" />
                          <span>Assignee / Workspace Member Picker</span>
                        </div>
                      )}
                    </div>

                    {/* Inline Edit Panel when "Edit question" is active */}
                    {isEditing && (
                      <div className="mt-4 pt-3 border-t border-[#27272C] bg-[#141418] p-3.5 rounded-lg space-y-3 text-xs animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-300">Question Settings</span>
                          {!isInfoBlock && (
                            <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                              <input
                                type="checkbox"
                                checked={Boolean(question.required)}
                                onChange={(e) => handleUpdateQuestion(question.id, { required: e.target.checked })}
                                className="rounded text-[#0078D4] focus:ring-0"
                              />
                              <span>Required field</span>
                            </label>
                          )}
                        </div>

                        {!isInfoBlock && (
                          <div>
                            <label className="block text-[11px] text-gray-400 mb-1">Placeholder Text:</label>
                            <input
                              type="text"
                              value={question.placeholder || ""}
                              onChange={(e) => handleUpdateQuestion(question.id, { placeholder: e.target.value })}
                              placeholder="e.g. Example: Data Optimization Project"
                              className="w-full p-2 rounded bg-[#1C1C22] border border-[#2F2F38] text-xs text-white focus:outline-none focus:border-[#0078D4]"
                            />
                          </div>
                        )}

                        {/* Options Editor for single_select, multi_select, priority */}
                        {(question.type === "single_select" || question.type === "multi_select" || question.taskProperty === "priority") && (
                          <div>
                            <label className="block text-[11px] text-gray-400 mb-1">Answer Choices / Options:</label>
                            <div className="space-y-1.5">
                              {(question.options || []).map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const nextOpts = [...(question.options || [])];
                                      nextOpts[optIdx] = e.target.value;
                                      handleUpdateQuestion(question.id, { options: nextOpts });
                                    }}
                                    className="flex-1 p-1.5 rounded bg-[#1C1C22] border border-[#2F2F38] text-xs text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextOpts = (question.options || []).filter((_, i) => i !== optIdx);
                                      handleUpdateQuestion(question.id, { options: nextOpts });
                                    }}
                                    className="p-1 text-gray-400 hover:text-rose-400 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextOpts = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
                                  handleUpdateQuestion(question.id, { options: nextOpts });
                                }}
                                className="text-xs text-sky-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Choice</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Add Question Button matching Screenshot 1 & 3 */}
            <div className="relative pt-2">
              <button
                type="button"
                onClick={() => setIsAddQuestionOpen((prev) => !prev)}
                className="w-full py-3.5 px-4 rounded-xl border border-dashed border-[#32323A] hover:border-gray-500 bg-[#18181C]/60 hover:bg-[#1E1E24] text-gray-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 text-sky-400" />
                <span>Add question</span>
              </button>

              {/* Add Question Dropdown Popup Menu */}
              <AddQuestionDropdown
                isOpen={isAddQuestionOpen}
                onClose={() => setIsAddQuestionOpen(false)}
                onSelectQuestion={handleAddQuestion}
              />
            </div>
          </div>
        )}

        {/* --- TAB 2: LIVE PREVIEW & TEST MODE --- */}
        {activeTab === "preview" && (
          <div className="max-w-xl mx-auto bg-[#18181C] border border-[#27272C] rounded-2xl p-6 sm:p-8 shadow-xl">
            {previewSubmitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Thank You!</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Your response for &quot;{form.title}&quot; has been recorded and registered into the workspace.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewAnswers({});
                    setPreviewSubmitted(false);
                  }}
                  className="px-4 py-2 bg-[#0078D4] text-white rounded-lg text-xs font-bold hover:bg-[#006abc] cursor-pointer"
                >
                  Submit Another Response
                </button>
              </div>
            ) : (
              <form onSubmit={handlePreviewSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{form.title}</h2>
                  {form.description && (
                    <p className="mt-2 text-xs text-gray-400 leading-relaxed">{form.description}</p>
                  )}
                </div>

                <div className="space-y-5">
                  {form.questions.map((q) => {
                    if (q.type === "information_block") {
                      return (
                        <div key={q.id} className="p-3.5 rounded-lg bg-[#202026] border border-[#2E2E36] text-xs text-gray-300 leading-relaxed">
                          {q.layoutContent || q.title}
                        </div>
                      );
                    }

                    return (
                      <div key={q.id} className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-200">
                          {q.title} {q.required && <span className="text-rose-500">*</span>}
                        </label>
                        {q.description && (
                          <p className="text-[11px] text-gray-400">{q.description}</p>
                        )}

                        {q.type === "short_text" && (
                          <input
                            type="text"
                            required={q.required}
                            value={previewAnswers[q.id] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                            placeholder={q.placeholder || "Enter text..."}
                            className="w-full p-2.5 rounded-lg bg-[#141416] border border-[#2E2E34] text-xs text-white focus:outline-none focus:border-[#0078D4]"
                          />
                        )}

                        {q.type === "long_text" && (
                          <textarea
                            rows={3}
                            required={q.required}
                            value={previewAnswers[q.id] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                            placeholder={q.placeholder || "Type detailed answer..."}
                            className="w-full p-2.5 rounded-lg bg-[#141416] border border-[#2E2E34] text-xs text-white focus:outline-none focus:border-[#0078D4]"
                          />
                        )}

                        {(q.type === "single_select" || q.type === "task_property") && (
                          <select
                            required={q.required}
                            value={previewAnswers[q.id] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                            className="w-full p-2.5 rounded-lg bg-[#141416] border border-[#2E2E34] text-xs text-white focus:outline-none focus:border-[#0078D4]"
                          >
                            <option value="">-- Select an option --</option>
                            {(q.options || ["Option 1", "Option 2"]).map((opt, i) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}

                        {q.type === "multi_select" && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {(q.options || []).map((opt, i) => {
                              const currentSelected: string[] = previewAnswers[q.id] || [];
                              const isChecked = currentSelected.includes(opt);
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    const next = isChecked
                                      ? currentSelected.filter((item) => item !== opt)
                                      : [...currentSelected, opt];
                                    setPreviewAnswers({ ...previewAnswers, [q.id]: next });
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                    isChecked
                                      ? "bg-[#0078D4] text-white border-[#0078D4]"
                                      : "bg-[#1E1E24] text-gray-300 border-[#2E2E36] hover:bg-[#282830]"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {q.type === "date" && (
                          <input
                            type="date"
                            required={q.required}
                            value={previewAnswers[q.id] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                            className="w-full p-2.5 rounded-lg bg-[#141416] border border-[#2E2E34] text-xs text-white focus:outline-none focus:border-[#0078D4]"
                          />
                        )}

                        {q.type === "uploads" && (
                          <div className="border border-dashed border-[#3A3A44] rounded-xl p-5 text-center bg-[#141416]">
                            <Paperclip className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                            <p className="text-xs text-gray-400">
                              Attach files or drag and drop here
                            </p>
                          </div>
                        )}

                        {q.type === "signature" && (
                          <div className="border border-[#3A3A44] rounded-xl p-4 bg-[#141416] text-center">
                            <input
                              type="text"
                              value={previewAnswers[q.id] || ""}
                              onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                              placeholder="Type or enter digital initials / signature..."
                              className="w-full p-2 bg-transparent text-xs text-white border-b border-gray-700 text-center focus:outline-none"
                            />
                          </div>
                        )}

                        {q.type === "contact_info" && (
                          <input
                            type="text"
                            required={q.required}
                            value={previewAnswers[q.id] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                            placeholder={q.placeholder || "contact@company.com"}
                            className="w-full p-2.5 rounded-lg bg-[#141416] border border-[#2E2E34] text-xs text-white focus:outline-none focus:border-[#0078D4]"
                          />
                        )}

                        {q.type === "number" && (
                          <input
                            type="number"
                            required={q.required}
                            value={previewAnswers[q.id] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                            placeholder={q.placeholder || "0"}
                            className="w-36 p-2.5 rounded-lg bg-[#141416] border border-[#2E2E34] text-xs text-white focus:outline-none focus:border-[#0078D4]"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[#27272C] flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingPreview}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingPreview ? "Submitting..." : form.submitButtonText || "Submit Form"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* --- TAB 3: SUBMISSIONS VIEW --- */}
        {activeTab === "submissions" && (
          <div className="bg-[#18181C] border border-[#27272C] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272C]">
              <div>
                <h3 className="text-base font-bold text-white">Responses &amp; Submissions</h3>
                <p className="text-xs text-gray-400">
                  {form.submissions?.length || 0} total submissions collected
                </p>
              </div>
            </div>

            {(!form.submissions || form.submissions.length === 0) ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                No submissions received yet. Share your form link to collect responses!
              </div>
            ) : (
              <div className="space-y-3">
                {form.submissions.map((sub, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-4 rounded-xl bg-[#141416] border border-[#27272A] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-gray-400 border-b border-gray-800 pb-2">
                      <span className="font-semibold text-white">
                        {sub.respondentName || sub.respondentEmail || `Submission #${sIdx + 1}`}
                      </span>
                      <span>{new Date(sub.submittedAt).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {form.questions.map((q) => {
                        if (q.type === "information_block") return null;
                        const answer = sub.answers?.[q.id];
                        return (
                          <div key={q.id} className="p-2 rounded bg-[#1C1C22]">
                            <span className="block text-[10px] text-gray-400 font-medium truncate">{q.title}:</span>
                            <span className="text-xs text-gray-200">
                              {answer !== undefined && answer !== "" ? String(answer) : <em className="text-gray-600">None</em>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 4: SHARE MODE --- */}
        {activeTab === "share" && (
          <div className="bg-[#18181C] border border-[#27272C] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 max-w-xl mx-auto">
            <div>
              <h3 className="text-lg font-bold text-white">Share Your Form</h3>
              <p className="text-xs text-gray-400 mt-1">
                Anyone with this public link can fill out and submit responses directly into your TaskPMS workspace.
              </p>
            </div>

            {/* Direct Link */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">Public Link:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicShareUrl}
                  className="flex-1 p-2.5 rounded-lg bg-[#141416] border border-[#2E2E36] text-xs text-gray-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(publicShareUrl);
                    success("Copied share link to clipboard!");
                  }}
                  className="px-4 py-2.5 rounded-lg bg-[#0078D4] hover:bg-[#006abc] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Open Form Preview */}
            <div className="pt-4 border-t border-[#27272C]">
              <a
                href={publicShareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs text-sky-400 hover:text-sky-300 font-semibold"
              >
                <span>Open Form in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Template Modal */}
      <FormTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}
