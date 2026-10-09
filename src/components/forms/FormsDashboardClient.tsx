"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Sparkles,
  ExternalLink,
  Trash2,
  Share2,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  MessageSquareQuote,
  ShoppingBag,
  Briefcase,
  Laptop,
} from "lucide-react";
import { IForm } from "@/models/form";
import FormTemplateModal from "./FormTemplateModal";
import { FormTemplateDefinition, FORM_TEMPLATES } from "@/lib/formTemplates";
import { useToast } from "@/components/ui/Toast";

interface FormsDashboardClientProps {
  initialForms: IForm[];
  orgCode?: string;
}

export default function FormsDashboardClient({
  initialForms,
  orgCode = "",
}: FormsDashboardClientProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [forms, setForms] = useState<IForm[]>(initialForms);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const orgPrefix = orgCode ? `/${orgCode}` : "";

  const handleCreateFromTemplate = async (template: FormTemplateDefinition) => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          title: template.name,
          description: template.description,
          themeColor: template.themeColor,
          questions: template.questions.map((q) => ({
            ...q,
            id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create form");
      }

      success(`Created new "${template.name}"!`);
      router.push(`${orgPrefix}/forms/${data.form._id}`);
    } catch (err: any) {
      error(err.message || "Failed to create form");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteForm = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this form?")) return;

    try {
      const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete");
      setForms((prev) => prev.filter((f) => String(f._id) !== id));
      success("Form deleted");
    } catch (err: any) {
      error(err.message || "Failed to delete form");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in text-[#242424] dark:text-[#E4E4E7]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-[#2C2C34]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Forms &amp; Surveys
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Create intake questionnaires, client orders, and team feedback forms with custom question types and task automation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsTemplateModalOpen(true)}
          disabled={isCreating}
          className="px-4 py-2 bg-[#0078D4] hover:bg-[#006abc] text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? "Creating..." : "Create Form"}</span>
        </button>
      </div>

      {/* Pre-built Templates Quick Row matching Screenshot 2 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Get Started with a Template
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {FORM_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleCreateFromTemplate(tmpl)}
              className="p-3.5 rounded-xl border border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#18181C] hover:border-gray-400 dark:hover:border-zinc-500 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <span className="text-lg mb-2 block">{tmpl.id === "scratch" ? "➕" : tmpl.id === "feedback" ? "💬" : tmpl.id === "project-intake" ? "📋" : tmpl.id === "order-form" ? "🛍️" : tmpl.id === "job-application" ? "💼" : "💻"}</span>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#0078D4] dark:group-hover:text-sky-300 transition-colors">
                  {tmpl.name}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                  {tmpl.subtitle}
                </p>
              </div>
              <span className="text-[10px] text-[#0078D4] dark:text-sky-400 font-semibold mt-3 pt-2 border-t border-gray-100 dark:border-[#27272A]">
                Use →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Existing Forms List */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Your Workspace Forms ({forms.length})
        </h2>

        {forms.length === 0 ? (
          <div className="py-12 border border-dashed border-gray-300 dark:border-zinc-800 rounded-2xl text-center space-y-3 bg-gray-50/50 dark:bg-[#141418]">
            <FileText className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">No Forms Created Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Choose one of the templates above or create a new form to begin collecting responses.
            </p>
            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-4 py-2 bg-[#0078D4] text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-[#006abc]"
            >
              Choose Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((item) => (
              <div
                key={String(item._id)}
                onClick={() => router.push(`${orgPrefix}/forms/${item._id}`)}
                className="p-5 rounded-2xl border border-gray-200 dark:border-[#27272C] bg-white dark:bg-[#18181C] hover:border-[#0078D4] dark:hover:border-zinc-500 hover:shadow-lg transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      {item.templateId || "Custom"}
                    </span>
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${window.location.origin}${orgPrefix}/forms/${item._id}/share`;
                          navigator.clipboard.writeText(url);
                          success("Copied public link!");
                        }}
                        title="Copy Share Link"
                        className="p-1 rounded text-gray-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteForm(String(item._id), e)}
                        title="Delete Form"
                        className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-zinc-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#0078D4] dark:group-hover:text-sky-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                    {item.description || "Custom workspace form."}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-[#27272A] flex items-center justify-between text-xs text-gray-400">
                  <span>{item.questions?.length || 0} Questions</span>
                  <span className="font-semibold text-emerald-500 dark:text-emerald-400">
                    {item.submissions?.length || 0} Submissions
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <FormTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleCreateFromTemplate}
      />
    </div>
  );
}
