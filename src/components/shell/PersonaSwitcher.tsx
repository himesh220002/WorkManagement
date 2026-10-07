"use client";

import React, { useState, useEffect } from "react";
import {
  Crown,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Shield,
  ChevronDown,
  Check,
  KeyRound,
} from "lucide-react";

export interface PersonaConfig {
  role: string;
  name: string;
  badge: string;
  icon: any;
  desc: string;
  style: string;
}

export const PERSONAS: PersonaConfig[] = [
  {
    role: "owner",
    name: "Alex Sterling",
    badge: "Owner",
    icon: Crown,
    desc: "Free hand: Full company authority, assigns managers & all roles",
    style: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200",
  },
  {
    role: "manager",
    name: "Sarah Connor",
    badge: "Manager",
    icon: ShieldCheck,
    desc: "Provisions employee logins & passes, assigns project TLs & staff, updates tags (cannot touch Owner)",
    style: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200",
  },
  {
    role: "teamlead",
    name: "Marcus Vance",
    badge: "Team Lead",
    icon: Sparkles,
    desc: "Project-centric lead: controls assigned project agendas & approves changes",
    style: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200",
  },
  {
    role: "employee",
    name: "Elena Rostova",
    badge: "Employee",
    icon: UserCheck,
    desc: "Executes tasks, read-only agendas, submits change requests to TL",
    style: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200",
  },
  {
    role: "superuser",
    name: "Dev Antigravity",
    badge: "Developer",
    icon: Shield,
    desc: "Global system developer override",
    style: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200",
  },
];

export function PersonaSwitcher() {
  const [currentRole, setCurrentRole] = useState<string>("manager");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Read active demo persona from cookie
    const match = document.cookie.match(/(?:^|; )demo_persona_role=([^;]*)/);
    if (match && match[1]) {
      setCurrentRole(match[1]);
    }
  }, []);

  const selectPersona = (role: string) => {
    setCurrentRole(role);
    setIsOpen(false);
    // Set 30-day cookie
    document.cookie = `demo_persona_role=${role}; path=/; max-age=2592000`;
    // Refresh page to re-run server components and server actions under the new role
    window.location.reload();
  };

  const activePersona =
    PERSONAS.find((p) => p.role === currentRole) || PERSONAS[1]; // default to Manager
  const ActiveIcon = activePersona.icon;

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-xs font-semibold transition-all cursor-pointer ${activePersona.style}`}
        title="Switch active role persona to test corporate permissions"
      >
        <ActiveIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline font-bold">{activePersona.badge}</span>
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-72 rounded-[6px] bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] shadow-xl z-50 py-1 divide-y divide-[#F3F2F1] dark:divide-[#292827]">
            <div className="px-3 py-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#605E5C] dark:text-[#A19F9D] block">
                Corporate Role Persona Simulator
              </span>
              <p className="text-[10px] text-[#8A8886] mt-0.5">
                Switch role to experience real-time permissions across projects, agendas &amp; credentials.
              </p>
            </div>

            <div className="py-1">
              {PERSONAS.map((p) => {
                const Icon = p.icon;
                const isSelected = p.role === currentRole;
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => selectPersona(p.role)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2.5 hover:bg-[#F3F2F1] dark:hover:bg-[#292827] transition-colors cursor-pointer ${
                      isSelected ? "bg-[#EBF3FC] dark:bg-[#1C2B3D]" : ""
                    }`}
                  >
                    <div className="mt-0.5">
                      <Icon className="w-4 h-4 text-[#0078D4]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#242424] dark:text-white">
                          {p.badge} ({p.name})
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#0078D4]" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] mt-0.5 leading-snug">
                        {p.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
