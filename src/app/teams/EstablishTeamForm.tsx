"use client";

import React, { useState } from "react";
import { Building2, Plus, Sparkles, Hash, Users, Layers } from "lucide-react";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";

export const teamSquadMapping: Record<string, string[]> = {
  // core engineering & software creation
  dev: [
    "frontend",
    "backend",
    "fullstack",
    "mobile_ios",
    "mobile_android",
    "embedded_iot",
    "game_dev",
    "api_platform",
  ],

  // product strategy, validation, & visual arts
  prod: [
    "uiux_design",
    "user_research",
    "product_discovery",
    "growth_product",
    "technical_writing",
    "design_systems",
  ],

  // quality assurance, automation, & testing infrastructure
  qa: [
    "manual_testing",
    "test_automation",
    "performance_load",
    "security_penetration",
    "mobile_testing",
  ],

  // infrastructure, cloud, stability, & site reliability
  ops: [
    "devops",
    "sre_reliability",
    "cloud_architecture",
    "platform_engineering",
    "database_admin",
    "cicd_automation",
  ],

  // cybersecurity, network defense, governance, & compliance
  sec: [
    "secops",
    "application_security",
    "threat_intelligence",
    "incident_response",
    "grc_compliance",
    "iam_identity",
  ],

  // advanced data processing, engineering, & artificial intelligence
  data: [
    "data_engineering",
    "data_analytics",
    "data_science",
    "machine_learning",
    "mloops_infrastructure",
    "business_intelligence",
    "ai_research",
  ],

  // internal enterprise support & physical hardware infrastructure
  it: [
    "helpdesk_support",
    "system_administration",
    "network_engineering",
    "asset_management",
    "internal_tools",
  ],

  // corporate management, strategy, finances, & legal protection
  biz: [
    "corporate_strategy",
    "financial_planning",
    "accounting_payroll",
    "legal_compliance",
    "procurement_sourcing",
    "investor_relations",
  ],

  // human capital, workplace operations, & talent acquisition
  hr: [
    "talent_acquisition",
    "people_operations",
    "employee_experience",
    "compensation_benefits",
    "learning_development",
  ],

  // demand generation, branding, content, & user acquisition
  mktg: [
    "performance_marketing",
    "brand_social_media",
    "content_strategy",
    "seo_growth",
    "event_marketing",
    "product_marketing",
  ],

  // direct outbound sales, accounts, & revenue optimization
  sales: [
    "lead_generation_sdr",
    "account_executives",
    "enterprise_sales",
    "sales_operations",
    "revops_strategy",
  ],

  // post-sale lifecycle, retention, & user enablement
  cust: [
    "customer_success",
    "technical_account_mgmt",
    "client_onboarding",
    "customer_support",
    "community_engagement",
  ],

  // special initiatives, incubation, & transformation
  randd: [
    "hardware_prototyping",
    "applied_research",
    "innovation_lab",
    "sustainability_green",
  ],
};

export const TEAM_TYPE_DESCRIPTIONS: Record<string, string> = {
  dev: "Core Engineering & Software Creation",
  prod: "Product Strategy, Validation & Visual Arts",
  qa: "Quality Assurance, Automation & Testing",
  ops: "Infrastructure, Cloud, Stability & SRE",
  sec: "Cybersecurity, Defense & Compliance",
  data: "Data Engineering, Analytics & AI",
  it: "Enterprise IT & Hardware Infrastructure",
  biz: "Corporate Strategy, Finance & Legal",
  hr: "Human Capital & Workplace Operations",
  mktg: "Growth Marketing, Brand & Acquisition",
  sales: "Outbound Sales & Revenue Optimization",
  cust: "Post-Sale Lifecycle, CSM & Retention",
  randd: "Special Initiatives, Prototyping & R&D",
};

export const SQUAD_SHORT_CODES: Record<string, string> = {
  // dev
  frontend: "front",
  backend: "back",
  fullstack: "full",
  mobile_ios: "ios",
  mobile_android: "android",
  embedded_iot: "iot",
  game_dev: "game",
  api_platform: "api",

  // prod
  uiux_design: "uiux",
  user_research: "research",
  product_discovery: "discovery",
  growth_product: "growth",
  technical_writing: "techwrite",
  design_systems: "designsys",

  // qa
  manual_testing: "manual",
  test_automation: "auto",
  performance_load: "perf",
  security_penetration: "pen",
  mobile_testing: "mobile",

  // ops
  devops: "devops",
  sre_reliability: "sre",
  cloud_architecture: "cloud",
  platform_engineering: "platform",
  database_admin: "dba",
  cicd_automation: "cicd",

  // sec
  secops: "secops",
  application_security: "appsec",
  threat_intelligence: "threat",
  incident_response: "ir",
  grc_compliance: "grc",
  iam_identity: "iam",

  // data
  data_engineering: "eng",
  data_analytics: "analytics",
  data_science: "science",
  machine_learning: "ml",
  mloops_infrastructure: "mlops",
  business_intelligence: "bi",
  ai_research: "ai",

  // it
  helpdesk_support: "helpdesk",
  system_administration: "sysadmin",
  network_engineering: "network",
  asset_management: "asset",
  internal_tools: "tools",

  // biz
  corporate_strategy: "strategy",
  financial_planning: "fpna",
  accounting_payroll: "payroll",
  legal_compliance: "legal",
  procurement_sourcing: "procure",
  investor_relations: "ir",

  // hr
  talent_acquisition: "ta",
  people_operations: "people",
  employee_experience: "empexp",
  compensation_benefits: "comp",
  learning_development: "lnd",

  // mktg
  performance_marketing: "perf",
  brand_social_media: "brand",
  content_strategy: "content",
  seo_growth: "seo",
  event_marketing: "events",
  product_marketing: "pmm",

  // sales
  lead_generation_sdr: "sdr",
  account_executives: "ae",
  enterprise_sales: "ent",
  sales_operations: "ops",
  revops_strategy: "revops",

  // cust
  customer_success: "cs",
  technical_account_mgmt: "tam",
  client_onboarding: "onboard",
  customer_support: "support",
  community_engagement: "community",

  // randd
  hardware_prototyping: "hardware",
  applied_research: "research",
  innovation_lab: "innov",
  sustainability_green: "green",
};

export function getSquadPrefix(teamType: string, squadType: string): string {
  const shortSquad = SQUAD_SHORT_CODES[squadType] || squadType;
  return `${teamType}_${shortSquad}_`;
}

export function formatSquadLabel(squad: string): string {
  return squad
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface EstablishTeamFormProps {
  userOptions: { id: string; name: string }[];
  action: (formData: FormData) => Promise<void>;
}

export default function EstablishTeamForm({
  userOptions,
  action,
}: EstablishTeamFormProps) {
  const [selectedTeamType, setSelectedTeamType] = useState<string>("dev");
  const [selectedSquadType, setSelectedSquadType] = useState<string>("frontend");
  const [customName, setCustomName] = useState<string>("");
  const [isPending, startTransition] = React.useTransition();

  const currentSquadOptions = teamSquadMapping[selectedTeamType] || [];
  const currentPrefix = getSquadPrefix(selectedTeamType, selectedSquadType);
  
  const cleanSuffix = customName.trim().startsWith(currentPrefix)
    ? customName.trim().slice(currentPrefix.length)
    : customName.trim();
  const finalTeamName = cleanSuffix
    ? `${currentPrefix}${cleanSuffix}`
    : currentPrefix;

  const handleTeamTypeChange = (newTeamType: string) => {
    setSelectedTeamType(newTeamType);
    const newSquads = teamSquadMapping[newTeamType] || [];
    if (newSquads.length > 0) {
      setSelectedSquadType(newSquads[0]);
    }
  };

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await action(formData);
      setCustomName("");
    });
  };

  return (
    <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F3F2F1] dark:border-[#292827]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#107C10]" />
            <h2 className="text-sm font-semibold text-[#242424] dark:text-[#FFFFFF]">
              Establish New Operational Team
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-[#107C10] dark:text-[#54B054] border border-emerald-200 dark:border-emerald-800">
            Prefixed Squad Naming Active
          </span>
        </div>

        <form action={handleSubmit} className="space-y-3.5 text-xs">
          {/* Hidden full team name submitted to server */}
          <input type="hidden" name="teamName" value={finalTeamName} />

          {/* 1. Team Type & Squad Type Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
                Team Type *
              </label>
              <select
                value={selectedTeamType}
                onChange={(e) => handleTeamTypeChange(e.target.value)}
                className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4] font-medium cursor-pointer"
              >
                {Object.keys(teamSquadMapping).map((key) => (
                  <option key={key} value={key}>
                    {key.toUpperCase()} &mdash; {TEAM_TYPE_DESCRIPTIONS[key]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
                Squad Type *
              </label>
              <select
                value={selectedSquadType}
                onChange={(e) => setSelectedSquadType(e.target.value)}
                className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4] font-medium cursor-pointer"
              >
                {currentSquadOptions.map((squad) => (
                  <option key={squad} value={squad}>
                    {formatSquadLabel(squad)} ({getSquadPrefix(selectedTeamType, squad)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Team Name with Pre-text Prefix */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-medium text-[#242424] dark:text-[#FFFFFF]">
                Team / Squad Name *
              </label>
              <span className="text-[10px] text-[#8A8886] font-mono">
                Prefix: <strong>{currentPrefix}</strong>
              </span>
            </div>

            <div className="flex items-stretch rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] overflow-hidden focus-within:border-[#0078D4] bg-[#FAF9F8] dark:bg-[#1B1A19]">
              <span className="inline-flex items-center px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-[#107C10] dark:text-[#54B054] font-mono font-bold text-xs border-r border-[#E1DFDD] dark:border-[#3B3A39] select-none shrink-0">
                {currentPrefix}
              </span>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. alpha, core_platform, pod1"
                className="flex-1 p-2 bg-transparent text-[#242424] dark:text-[#FFFFFF] outline-none text-xs font-medium"
                required
              />
            </div>

            {/* Live Generated Name Pill */}
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#605E5C] dark:text-[#C8C6C4]">
              <Hash className="w-3.5 h-3.5 text-[#107C10]" />
              <span>Full Generated Team Name:</span>
              <code className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-[#107C10] dark:text-[#54B054] font-mono font-bold border border-emerald-200 dark:border-emerald-800">
                {finalTeamName || `${currentPrefix}your_name`}
              </code>
            </div>
          </div>

          {/* 3. Initial Team Members */}
          <div>
            <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
              Initial Team Members (Optional)
            </label>
            <div className="overflow-visible relative z-20">
              <MultiSelectDropdown
                name="memberIds"
                options={userOptions}
                placeholder="Select initial company members..."
              />
            </div>
          </div>

          {/* 4. Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-[#107C10] hover:bg-[#0E6A0E] disabled:opacity-60 text-white rounded-[4px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isPending ? "Creating Team..." : "Create Team"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
