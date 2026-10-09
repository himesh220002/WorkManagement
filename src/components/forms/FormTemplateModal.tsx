"use client";

import React from "react";
import {
  X,
  MessageSquareQuote,
  Layers,
  ShoppingBag,
  Briefcase,
  Laptop,
  Plus,
  Sparkles,
} from "lucide-react";
import { FORM_TEMPLATES, FormTemplateDefinition } from "@/lib/formTemplates";

interface FormTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: FormTemplateDefinition) => void;
}

export default function FormTemplateModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: FormTemplateModalProps) {
  if (!isOpen) return null;

  const renderIcon = (iconName: string, id: string) => {
    switch (iconName) {
      case "MessageSquareQuote":
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <MessageSquareQuote className="w-5 h-5" />
          </div>
        );
      case "Layers":
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Layers className="w-5 h-5" />
          </div>
        );
      case "ShoppingBag":
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
        );
      case "Briefcase":
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Briefcase className="w-5 h-5" />
          </div>
        );
      case "Laptop":
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Laptop className="w-5 h-5" />
          </div>
        );
      case "Plus":
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <Plus className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#141416] border border-[#27272A] rounded-2xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header matching Screenshot 2 */}
        <div className="text-center max-w-lg mx-auto mb-8">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Create a new Form
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Get started with a Form template or create a custom Form to fit your exact needs.
          </p>
        </div>

        {/* 6 Cards Grid matching Screenshot 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {FORM_TEMPLATES.map((template) => {
            const isScratch = template.id === "scratch";
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
                className={`flex flex-col text-left p-5 rounded-xl border transition-all duration-200 group cursor-pointer ${
                  isScratch
                    ? "bg-[#18181B]/80 hover:bg-[#1E1E24] border-dashed border-[#3F3F46] hover:border-zinc-500 hover:shadow-lg"
                    : "bg-[#18181B] hover:bg-[#1E1E24] border-[#27272A] hover:border-[#3F3F46] hover:shadow-xl hover:-translate-y-0.5"
                }`}
              >
                <div className="mb-4">
                  {renderIcon(template.iconName, template.id)}
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors mb-1">
                  {template.name}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {template.subtitle}
                </p>
                {!isScratch && (
                  <div className="mt-4 pt-3 border-t border-[#27272A] flex items-center justify-between text-[11px] text-gray-500">
                    <span>{template.questions.length} questions included</span>
                    <span className="text-emerald-400 font-semibold group-hover:underline">Use Template →</span>
                  </div>
                )}
                {isScratch && (
                  <div className="mt-4 pt-3 border-t border-[#27272A] flex items-center justify-between text-[11px] text-gray-400">
                    <span>Blank canvas</span>
                    <span className="text-sky-400 font-semibold group-hover:underline">Start Blank →</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
