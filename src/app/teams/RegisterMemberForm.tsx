"use client";

import { useState } from "react";
import { registerUser } from "@/actions";
import { UserPlus, Plus } from "lucide-react";

export const ROLE_CATEGORIES: Record<string, string[]> = {
  Developer: [
    "SDE (Software Development Engineer)",
    "Frontend Engineer",
    "Backend Engineer",
    "Fullstack Engineer",
    "DevOps & Cloud Engineer",
    "Data & AI Engineer",
    "QA Automation Engineer",
    "Mobile Engineer (iOS/Android)",
    "Security & SRE Engineer",
  ],
  Designer: [
    "UI/UX Designer",
    "Product Designer",
    "Design System Specialist",
    "Graphic & Brand Designer",
  ],
  "Product & Project": [
    "Product Manager (PM)",
    "Technical Product Manager (TPM)",
    "Project Manager",
    "Scrum Master / Agile Coach",
  ],
  "Quality & Operations": [
    "QA Lead / Tester",
    "Release Engineer",
    "Operations Specialist",
    "IT Support Specialist",
  ],
  "Sales & Commercial": [
    "Account Executive (AE)",
    "Sales Development Rep (SDR)",
    "Business Development (BDR)",
    "Solutions Architect",
    "Customer Success Manager (CSM)",
  ],
  "Finance & RevOps": [
    "Financial Analyst",
    "Revenue Operations (RevOps)",
    "Procurement & Billing Specialist",
  ],
  Executive: [
    "Engineering Director / VP",
    "Chief Technology Officer (CTO)",
    "Chief Executive Officer (CEO)",
    "Chief Financial Officer (CFO)",
    "Chief Operating Officer (COO)",
  ],
};

const CATEGORY_KEYS = Object.keys(ROLE_CATEGORIES);

export default function RegisterMemberForm() {
  const [category, setCategory] = useState<string>("Developer");
  const [position, setPosition] = useState<string>(ROLE_CATEGORIES["Developer"][0]);
  const [rank, setRank] = useState<string>("2");

  const positionsForCategory = ROLE_CATEGORIES[category] || [];

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value;
    setCategory(newCat);
    setPosition(ROLE_CATEGORIES[newCat]?.[0] || "");
  };

  return (
    <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex-1">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F3F2F1] dark:border-[#292827]">
        <UserPlus className="w-4 h-4 text-[#0078D4]" />
        <h2 className="text-sm font-semibold text-[#242424] dark:text-[#FFFFFF]">
          Register Global Organization Member
        </h2>
      </div>

      <form action={registerUser} className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
              Member Full Name *
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Elena Rostova"
              className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
              Category / Type *
            </label>
            <select
              name="role"
              value={category}
              onChange={handleCategoryChange}
              className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4] cursor-pointer"
            >
              {CATEGORY_KEYS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
              Specialized Role / Title *
            </label>
            <select
              name="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4] cursor-pointer"
            >
              {positionsForCategory.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
              Seniority Tier (Rank 1 - 5) *
            </label>
            <select
              name="rank"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4] cursor-pointer"
            >
              <option value="1">Rank 1 • Associate / Junior</option>
              <option value="2">Rank 2 • Mid-Level Professional</option>
              <option value="3">Rank 3 • Senior Specialist</option>
              <option value="4">Rank 4 • Staff / Team Lead</option>
              <option value="5">Rank 5 • Principal / Director</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[4px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Member</span>
          </button>
        </div>
      </form>
    </div>
  );
}
