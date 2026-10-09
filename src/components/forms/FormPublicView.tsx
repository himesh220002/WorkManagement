"use client";

import React, { useState } from "react";
import {
  FileText,
  Check,
  Calendar,
  Paperclip,
  PenTool,
  Flag,
  Send,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { IForm } from "@/models/form";
import { useToast } from "@/components/ui/Toast";

interface FormPublicViewProps {
  form: IForm;
}

export default function FormPublicView({ form }: FormPublicViewProps) {
  const { success, error } = useToast();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/forms/${form._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          respondentName,
          respondentEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit form response");
      }

      setIsSuccess(true);
      success("Form submitted successfully!");
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
      error(err.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101013] text-[#E4E4E7] py-12 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-[#18181D] border border-[#27272D] rounded-2xl p-6 sm:p-10 shadow-2xl">
        {isSuccess ? (
          <div className="py-16 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Thank You!</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              Your response for &quot;{form.title}&quot; has been recorded and submitted directly into the workspace.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setIsSuccess(false);
                }}
                className="px-5 py-2.5 bg-[#0078D4] hover:bg-[#006abc] text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Submit Another Response
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Header */}
            <div className="border-b border-[#2A2A32] pb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  TaskPMS Form
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {form.title}
              </h1>
              {form.description && (
                <p className="mt-2 text-xs sm:text-sm text-gray-300 leading-relaxed">
                  {form.description}
                </p>
              )}
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Questions list */}
            <div className="space-y-6">
              {form.questions.map((q) => {
                if (q.type === "information_block") {
                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl bg-[#202026] border border-[#2E2E36] text-xs text-gray-300 leading-relaxed"
                    >
                      {q.layoutContent || q.title}
                    </div>
                  );
                }

                return (
                  <div key={q.id} className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-200">
                      {q.title} {q.required && <span className="text-rose-500">*</span>}
                    </label>
                    {q.description && (
                      <p className="text-[11px] text-gray-400 leading-relaxed">{q.description}</p>
                    )}

                    {/* Short Text */}
                    {q.type === "short_text" && (
                      <input
                        type="text"
                        required={q.required}
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        placeholder={q.placeholder || "Your answer..."}
                        className="w-full p-3 rounded-xl bg-[#121215] border border-[#2D2D36] text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] transition-all"
                      />
                    )}

                    {/* Long Text */}
                    {q.type === "long_text" && (
                      <textarea
                        rows={4}
                        required={q.required}
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        placeholder={q.placeholder || "Type your detailed thoughts..."}
                        className="w-full p-3 rounded-xl bg-[#121215] border border-[#2D2D36] text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] transition-all resize-y"
                      />
                    )}

                    {/* Single Select / Task Priority */}
                    {(q.type === "single_select" || q.type === "task_property") && (
                      <select
                        required={q.required}
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="w-full p-3 rounded-xl bg-[#121215] border border-[#2D2D36] text-xs sm:text-sm text-white focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] transition-all"
                      >
                        <option value="">-- Select an option --</option>
                        {(q.options || ["Option 1", "Option 2"]).map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Multi Select */}
                    {q.type === "multi_select" && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(q.options || []).map((opt, i) => {
                          const currentSelected: string[] = answers[q.id] || [];
                          const isChecked = currentSelected.includes(opt);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                const next = isChecked
                                  ? currentSelected.filter((item) => item !== opt)
                                  : [...currentSelected, opt];
                                setAnswers({ ...answers, [q.id]: next });
                              }}
                              className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                                isChecked
                                  ? "bg-[#0078D4] text-white border-[#0078D4]"
                                  : "bg-[#18181E] text-gray-300 border-[#2E2E36] hover:bg-[#22222A]"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Dates */}
                    {q.type === "date" && (
                      <input
                        type="date"
                        required={q.required}
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="w-full p-3 rounded-xl bg-[#121215] border border-[#2D2D36] text-xs sm:text-sm text-white focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
                      />
                    )}

                    {/* Uploads */}
                    {q.type === "uploads" && (
                      <div className="border border-dashed border-[#3A3A46] rounded-2xl p-6 text-center bg-[#121215]">
                        <Paperclip className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-300 font-medium">
                          Drop your files here, or <span className="text-sky-400 underline">browse</span>
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">Supports PDF, PNG, JPG, DOCX (Max 25MB)</p>
                        <input
                          type="text"
                          value={answers[q.id] || ""}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          placeholder="File name or attachment note (optional)..."
                          className="mt-3 w-full p-2 bg-[#1A1A20] rounded-lg border border-[#2D2D36] text-xs text-white"
                        />
                      </div>
                    )}

                    {/* Signature */}
                    {q.type === "signature" && (
                      <div className="border border-[#2D2D36] rounded-xl p-4 bg-[#121215] text-center">
                        <PenTool className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                        <input
                          type="text"
                          required={q.required}
                          value={answers[q.id] || ""}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          placeholder="Type your authorized full name / digital signature..."
                          className="w-full p-2 bg-transparent text-xs sm:text-sm text-white border-b border-gray-700 text-center focus:outline-none focus:border-[#0078D4]"
                        />
                      </div>
                    )}

                    {/* Contact info */}
                    {q.type === "contact_info" && (
                      <input
                        type="text"
                        required={q.required}
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        placeholder={q.placeholder || "alex@company.com"}
                        className="w-full p-3 rounded-xl bg-[#121215] border border-[#2D2D36] text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0078D4]"
                      />
                    )}

                    {/* Number */}
                    {q.type === "number" && (
                      <input
                        type="number"
                        required={q.required}
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        placeholder={q.placeholder || "0"}
                        className="w-40 p-3 rounded-xl bg-[#121215] border border-[#2D2D36] text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0078D4]"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Respondent contact info footer */}
            <div className="pt-6 border-t border-[#2A2A32] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Your Name (optional):</label>
                <input
                  type="text"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="e.g. Satyam Himesh"
                  className="w-full p-2.5 rounded-xl bg-[#121215] border border-[#2D2D36] text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Your Email (optional):</label>
                <input
                  type="email"
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  placeholder="e.g. satyam@company.com"
                  className="w-full p-2.5 rounded-xl bg-[#121215] border border-[#2D2D36] text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">Secured with 256-bit encryption</span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "Submitting..." : form.submitButtonText || "Submit Form"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
