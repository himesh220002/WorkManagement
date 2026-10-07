"use client";

import { useState } from "react";
import { provisionMemberAction } from "@/actions/member";
import {
  UserPlus,
  Plus,
  KeyRound,
  Mail,
  Shield,
  Copy,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  Building,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

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

interface RegisterMemberFormProps {
  defaultCompanyCode?: string;
}

export default function RegisterMemberForm({ defaultCompanyCode }: RegisterMemberFormProps) {
  const { success, error } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [systemRole, setSystemRole] = useState<"employee" | "teamlead" | "manager">("employee");
  const [category, setCategory] = useState<string>("Developer");
  const [position, setPosition] = useState<string>(ROLE_CATEGORIES["Developer"][0]);
  const [rank, setRank] = useState<string>("2");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // State to store successfully provisioned credentials card
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    position: string;
    companyCode: string;
    companyName?: string;
  } | null>(null);

  const positionsForCategory = ROLE_CATEGORIES[category] || [];

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value;
    setCategory(newCat);
    setPosition(ROLE_CATEGORIES[newCat]?.[0] || "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!email || email.includes("@taskflow.local")) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ".")
        .replace(/\.+/g, ".");
      if (slug) setEmail(`${slug}@taskflow.local`);
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789#$@!";
    let res = "";
    for (let i = 0; i < 12; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("email", email);
      formData.set("password", password);
      formData.set("role", systemRole);
      formData.set("category", category);
      formData.set("position", position);
      formData.set("rank", rank);

      const res = await provisionMemberAction(formData);

      if (res.success && res.data) {
        success(res.message || "Member provisioned successfully!");
        setCreatedCredentials({
          name: res.data.name,
          email: res.data.email,
          password: res.data.password,
          role: res.data.role,
          position: res.data.position,
          companyCode: res.data.companyCode || defaultCompanyCode || "ORG001",
          companyName: res.data.companyName || "TaskFlow Organization",
        });
        // Reset form
        setName("");
        setEmail("");
        setPassword("");
      } else {
        error(res.error || "Failed to provision member");
      }
    } catch (err: any) {
      error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const orgId = createdCredentials.companyCode || defaultCompanyCode || "ORG001";
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const loginPortal = `${origin}/${orgId}/auth/login`;
    const text = `TaskFlow PM Login Credentials\nOrganization ID: ${orgId}\nName: ${createdCredentials.name}\nRole: ${createdCredentials.role.toUpperCase()}\nEmail: ${createdCredentials.email}\nInitial Password: ${createdCredentials.password}\nLogin Portal: ${loginPortal}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.14)] flex-1">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F3F2F1] dark:border-[#292827]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[6px] bg-[#0078D4]/10 dark:bg-[#0078D4]/20 flex items-center justify-center text-[#0078D4]">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#242424] dark:text-[#FFFFFF]">
              Onboard &amp; Provision Member Credentials
            </h2>
            <p className="text-[11px] text-[#605E5C] dark:text-[#A19F9D]">
              Manager provisioning: Set login email and initial password for new hires.
            </p>
          </div>
        </div>
      </div>

      {createdCredentials && (
        <div className="mb-5 p-4 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  New Member Account Active &amp; Ready!
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
                Share these initial credentials with the employee. They will authenticate via their dedicated organization portal.
              </p>
            </div>
            <button
              type="button"
              onClick={copyCredentials}
              className="px-3 py-1.5 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Login Card"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 text-xs">
            <div>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 block font-semibold">
                Organization ID (Org Code)
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <code className="text-[11px] font-mono font-bold text-emerald-950 dark:text-emerald-100 bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                  {createdCredentials.companyCode}
                </code>
                {createdCredentials.companyName && (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 truncate font-medium">
                    ({createdCredentials.companyName})
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 block font-semibold">
                System Tag &amp; Role
              </span>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 uppercase mt-0.5">
                {createdCredentials.role}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 block font-semibold">
                Member Name
              </span>
              <strong className="text-emerald-950 dark:text-emerald-100 text-xs">
                {createdCredentials.name}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 block font-semibold">
                Login Email
              </span>
              <code className="text-[11px] font-mono text-emerald-900 dark:text-emerald-200 bg-white/70 dark:bg-black/30 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                {createdCredentials.email}
              </code>
            </div>

            <div>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 block font-semibold">
                Initial Password
              </span>
              <code className="text-[11px] font-mono font-bold text-emerald-900 dark:text-emerald-200 bg-white/70 dark:bg-black/30 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                {createdCredentials.password}
              </code>
            </div>

            <div>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 block font-semibold">
                Dedicated Tenant Login Portal
              </span>
              <a
                href={`${typeof window !== "undefined" ? window.location.origin : ""}/${createdCredentials.companyCode}/auth/login`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono font-bold text-[#0078D4] dark:text-[#479EF5] hover:underline flex items-center gap-1 mt-0.5 truncate"
                title="Open Dedicated Organization Login Portal"
              >
                <span>/{createdCredentials.companyCode}/auth/login</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Name & System Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
              Member Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Jordan Smith"
              className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
              System Access Tag / Role *
            </label>
            <select
              value={systemRole}
              onChange={(e) => setSystemRole(e.target.value as any)}
              className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4] cursor-pointer font-medium"
            >
              <option value="employee">Employee • Tasks execution, read-only timelines</option>
              <option value="teamlead">Team Lead • Project-centric lead & change approvals</option>
              <option value="manager">Operations Manager • Staffing, projects & credentials</option>
            </select>
          </div>
        </div>

        {/* Email & Initial Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
              Login Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan.smith@taskflow.local"
                className="w-full p-2 pl-8 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4]"
                required
              />
              <Mail className="w-3.5 h-3.5 text-[#605E5C] absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-[#242424] dark:text-[#FFFFFF]">
                Initial Password *
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[10px] text-[#0078D4] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate Strong</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Manager provided password"
                className="w-full p-2 pl-8 pr-8 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4] font-mono"
                required
              />
              <KeyRound className="w-3.5 h-3.5 text-[#605E5C] absolute left-2.5 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-[#605E5C] hover:text-[#242424] dark:hover:text-white"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Category & Specialized Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
              Department / Category *
            </label>
            <select
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

          <div>
            <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
              Specialized Role / Title *
            </label>
            <select
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
        </div>

        {/* Seniority Rank */}
        <div>
          <label className="block font-medium text-[#242424] dark:text-[#FFFFFF] mb-1">
            Seniority Tier (Rank 1 - 5) *
          </label>
          <select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[4px] text-[#242424] dark:text-[#FFFFFF] outline-none focus:border-[#0078D4] cursor-pointer"
          >
            <option value="1">Rank 1 • Associate / Junior Specialist</option>
            <option value="2">Rank 2 • Mid-Level Core Contributor</option>
            <option value="3">Rank 3 • Senior Specialist / Architect</option>
            <option value="4">Rank 4 • Staff / Project Lead</option>
            <option value="5">Rank 5 • Principal / Functional Director</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[#605E5C] dark:text-[#A19F9D]">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Employee role has read-only access to project agendas.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#0078D4] hover:bg-[#106EBE] disabled:opacity-50 text-white rounded-[4px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Provisioning..." : "Provision Member & Pass"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
