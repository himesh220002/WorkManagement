"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  ChevronRight,
  Type,
  AlignLeft,
  Calendar,
  ChevronDownSquare,
  Tag,
  Phone,
  Mail,
  Globe,
  Users,
  Paperclip,
  Hash,
  PenTool,
  Info,
  CheckSquare,
  Clock,
  Flag,
  UserCheck,
  Tags,
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  QUESTION_TYPE_MENU_ITEMS,
  QuestionTypeMenuItem,
} from "@/lib/formTemplates";
import { IFormQuestion, FormQuestionType, TaskPropertyField } from "@/models/form";

interface AddQuestionDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (newQuestion: IFormQuestion) => void;
}

export default function AddQuestionDropdown({
  isOpen,
  onClose,
  onSelectQuestion,
}: AddQuestionDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubmenuIndex, setActiveSubmenuIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
      setActiveSubmenuIndex(null);
      setSearchQuery("");
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "ClickUpLogo":
        return <Sliders className="w-4 h-4 text-[#7B68EE]" />;
      case "Type":
        return <Type className="w-4 h-4 text-sky-400" />;
      case "AlignLeft":
        return <AlignLeft className="w-4 h-4 text-indigo-400" />;
      case "Calendar":
        return <Calendar className="w-4 h-4 text-emerald-400" />;
      case "ChevronDownSquare":
        return <ChevronDownSquare className="w-4 h-4 text-amber-400" />;
      case "Tag":
        return <Tag className="w-4 h-4 text-purple-400" />;
      case "Phone":
        return <Phone className="w-4 h-4 text-rose-400" />;
      case "Users":
        return <Users className="w-4 h-4 text-cyan-400" />;
      case "Paperclip":
        return <Paperclip className="w-4 h-4 text-teal-400" />;
      case "Hash":
        return <Hash className="w-4 h-4 text-orange-400" />;
      case "PenTool":
        return <PenTool className="w-4 h-4 text-pink-400" />;
      case "Info":
        return <Info className="w-4 h-4 text-blue-400" />;
      default:
        return <Type className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSubItemIcon = (taskProperty?: TaskPropertyField, contactType?: string) => {
    if (taskProperty) {
      switch (taskProperty) {
        case "task_name":
          return <CheckSquare className="w-3.5 h-3.5 text-blue-400" />;
        case "description":
          return <AlignLeft className="w-3.5 h-3.5 text-indigo-400" />;
        case "priority":
          return <Flag className="w-3.5 h-3.5 text-rose-400" />;
        case "due_date":
          return <Clock className="w-3.5 h-3.5 text-amber-400" />;
        case "assignee":
          return <UserCheck className="w-3.5 h-3.5 text-emerald-400" />;
        case "tags":
          return <Tags className="w-3.5 h-3.5 text-purple-400" />;
        default:
          return <Sliders className="w-3.5 h-3.5 text-gray-400" />;
      }
    }
    if (contactType) {
      switch (contactType) {
        case "email":
          return <Mail className="w-3.5 h-3.5 text-cyan-400" />;
        case "phone":
          return <Phone className="w-3.5 h-3.5 text-rose-400" />;
        case "website":
          return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
        default:
          return <Phone className="w-3.5 h-3.5 text-gray-400" />;
      }
    }
    return <Type className="w-3.5 h-3.5 text-gray-400" />;
  };

  const handleSelectItem = (
    item: QuestionTypeMenuItem,
    subItem?: { title: string; taskProperty?: TaskPropertyField; contactType?: any }
  ) => {
    const newId = `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    let title = item.defaultData.title || item.title;
    let description = item.defaultData.description || "";
    let placeholder = item.defaultData.placeholder || "";
    let options = item.defaultData.options ? [...item.defaultData.options] : undefined;
    let layoutContent = item.defaultData.layoutContent || "";

    if (subItem) {
      title = subItem.title;
      if (subItem.taskProperty === "priority") {
        options = ["Urgent", "High", "Normal", "Low"];
        description = "Select task priority level";
      } else if (subItem.taskProperty === "task_name") {
        placeholder = "e.g., Launch landing page redesign";
      }
    }

    const question: IFormQuestion = {
      id: newId,
      type: item.type,
      title,
      description,
      placeholder,
      required: false,
      options,
      taskProperty: subItem?.taskProperty || item.defaultData.taskProperty,
      contactType: subItem?.contactType || item.defaultData.contactType,
      layoutContent,
    };

    onSelectQuestion(question);
    onClose();
  };

  // Filter items by search query
  const query = searchQuery.trim().toLowerCase();
  const filteredItems = QUESTION_TYPE_MENU_ITEMS.filter((item) => {
    if (!query) return true;
    if (item.title.toLowerCase().includes(query)) return true;
    if (item.category.toLowerCase().includes(query)) return true;
    if (item.subItems?.some((sub) => sub.title.toLowerCase().includes(query))) return true;
    return false;
  });

  const questionTypeItems = filteredItems.filter((i) => i.category === "Questions type");
  const layoutItems = filteredItems.filter((i) => i.category === "Layout");

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 z-50 w-72 sm:w-80 rounded-xl bg-[#1E1E22] border border-[#2E2E34] shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-gray-200 overflow-visible animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Search Input matching Screenshot 3 */}
      <div className="p-2.5 border-b border-[#2E2E34]">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#28282E] border border-[#3A3A42] focus-within:border-[#0078D4] focus-within:ring-1 focus-within:ring-[#0078D4] transition-all">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="max-h-[440px] overflow-y-auto py-1.5 custom-scrollbar">
        {/* Section: Questions type */}
        {questionTypeItems.length > 0 && (
          <div className="mb-2">
            <div className="px-3.5 py-1 text-[11px] font-semibold text-gray-400 tracking-wide uppercase">
              Questions type
            </div>
            {questionTypeItems.map((item, idx) => {
              const isSubmenuOpen = activeSubmenuIndex === idx && item.hasSubmenu;
              return (
                <div
                  key={item.type}
                  className="relative group px-1.5"
                  onMouseEnter={() => item.hasSubmenu && setActiveSubmenuIndex(idx)}
                  onMouseLeave={() => item.hasSubmenu && setActiveSubmenuIndex(null)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!item.hasSubmenu) {
                        handleSelectItem(item);
                      } else {
                        setActiveSubmenuIndex(activeSubmenuIndex === idx ? null : idx);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                      isSubmenuOpen
                        ? "bg-[#2A2B32] text-white"
                        : "hover:bg-[#28282E] text-gray-200 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        {getIcon(item.icon)}
                      </div>
                      <span className="truncate">{item.title}</span>
                    </div>
                    {item.hasSubmenu && (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 shrink-0" />
                    )}
                  </button>

                  {/* Flyout Submenu */}
                  {isSubmenuOpen && item.subItems && (
                    <div className="absolute left-full top-0 ml-1.5 z-50 w-52 rounded-xl bg-[#1E1E22] border border-[#2E2E34] shadow-[0_16px_40px_rgba(0,0,0,0.6)] p-1.5 animate-in fade-in slide-in-from-left-2 duration-150">
                      <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#2E2E34] mb-1">
                        Select {item.title}
                      </div>
                      <div className="space-y-0.5">
                        {item.subItems.map((sub, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSelectItem(item, sub)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-[#28282E] transition-colors cursor-pointer text-left"
                          >
                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                              {getSubItemIcon(sub.taskProperty, sub.contactType)}
                            </div>
                            <span className="truncate">{sub.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Section: Layout */}
        {layoutItems.length > 0 && (
          <div className="pt-1 border-t border-[#2E2E34]/80">
            <div className="px-3.5 py-1 text-[11px] font-semibold text-gray-400 tracking-wide uppercase">
              Layout
            </div>
            {layoutItems.map((item) => (
              <div key={item.type} className="px-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-200 hover:text-white hover:bg-[#28282E] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      {getIcon(item.icon)}
                    </div>
                    <span className="truncate">{item.title}</span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="py-6 px-4 text-center text-xs text-gray-400">
            No matching question types found for &quot;{searchQuery}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
