"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  User,
  KeyRound,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Crown,
  Briefcase,
  Users,
  Eye,
  EyeOff,
  LogOut,
  Layers,
  Shield,
  Zap,
  ChevronDown,
  CreditCard,
  Check,
} from "lucide-react";
import RazorpayCheckoutModal from "@/components/payment/RazorpayCheckoutModal";
import { PRICING_PLANS, PlanId } from "@/lib/razorpay";

interface SessionData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId?: string;
  };
  company?: {
    id: string;
    name: string;
    code: string;
  };
  permissions: {
    isSuperuser: boolean;
    canManageCompany: boolean;
    canManageProjects: boolean;
    canAssignTasks: boolean;
    isEmployeeOnly: boolean;
  };
}

type PersonaKey = "employee" | "owner" | "superuser";

interface PersonaMeta {
  key: PersonaKey;
  label: string;
  shortRole: string;
  icon: any;
  tagline: string;
  badgeStyle: string;
  accentBorder: string;
  demoCreds: {
    email: string;
    pass: string;
    company: string;
  };
}

const PERSONA_CONFIGS: PersonaMeta[] = [
  {
    key: "employee",
    label: "Company Employee",
    shortRole: "Department Specialist (Dev / Sales / Ops Specialist)",
    icon: Users,
    tagline: "Executes assigned tasks, client deals & department workflows; read-only project agendas with Team Lead approval requests",
    badgeStyle: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200",
    accentBorder: "border-slate-500",
    demoCreds: {
      email: "alex.chen@acme.corp",
      pass: "Employee#2026",
      company: "ACME",
    },
  },
  {
    key: "owner",
    label: "Company Owner",
    shortRole: "Founder & Owner",
    icon: Crown,
    tagline: "Free Hand: Create an organization, register subscription & govern all staff, managers and TLs",
    badgeStyle: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200",
    accentBorder: "border-amber-500",
    demoCreds: {
      email: "sarah.connor@acme.corp",
      pass: "OwnerSecure#2026",
      company: "ACME",
    },
  },
  {
    key: "superuser",
    label: "System Developer",
    shortRole: "Developer Superuser",
    icon: Shield,
    tagline: "Global multi-tenant override and internal architectural development",
    badgeStyle: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200",
    accentBorder: "border-rose-500",
    demoCreds: {
      email: "dev.superuser@taskflow.internal",
      pass: "SuperDev@2026",
      company: "",
    },
  },
];

export default function AuthPage({
  prefillOrgCode,
  orgName,
}: {
  prefillOrgCode?: string;
  orgName?: string;
} = {}) {
  const router = useRouter();

  // 1. First step: Chosen persona toggle (defaults to employee)
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey>("employee");

  // Owner action mode: "signup" (create new company) or "login" (sign in)
  const [ownerMode, setOwnerMode] = useState<"signup" | "login">("login");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Active session
  const [session, setSession] = useState<SessionData | null>(null);

  // Form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginCompanyCode, setLoginCompanyCode] = useState(
    prefillOrgCode ? prefillOrgCode.toUpperCase() : ""
  );

  const [signupCompanyName, setSignupCompanyName] = useState("");
  const [signupCompanyCode, setSignupCompanyCode] = useState("");
  const [signupOwnerName, setSignupOwnerName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Razorpay Paywall Subscription State
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("monthly");
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Expired Owner Renewal State
  const [expiredOwnerInfo, setExpiredOwnerInfo] = useState<{
    companyCode: string;
    companyName: string;
    ownerEmail: string;
    planId: PlanId;
  } | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  // Check active session and payment URL parameters on mount
  useEffect(() => {
    fetchSession();

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam === "signup") {
        setSelectedPersona("owner");
        setOwnerMode("signup");
      }
      const token = urlParams.get("payment_token");
      const plan = urlParams.get("plan");
      const paid = urlParams.get("paid");
      if (token || paid === "true") {
        setIsPaymentVerified(true);
        if (token) setPaymentToken(token);
        if (plan === "annual" || plan === "monthly" || plan === "quarterly") setSelectedPlan(plan as PlanId);
        setPaymentId(urlParams.get("payment_id") || "pay_razorpay_verified");
      }
    }
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setSession(data);
        }
      }
    } catch { }
  };

  const handleSelectPersona = (pKey: PersonaKey) => {
    setSelectedPersona(pKey);
    setError(null);
    setSuccess(null);
    const config = PERSONA_CONFIGS.find((p) => p.key === pKey);
    if (config) {
      setLoginEmail(config.demoCreds.email);
      setLoginPassword(config.demoCreds.pass);
      setLoginCompanyCode(
        prefillOrgCode ? prefillOrgCode.toUpperCase() : config.demoCreds.company
      );
    }
  };

  // Populate initial role credentials on mount
  useEffect(() => {
    const config = PERSONA_CONFIGS.find((p) => p.key === selectedPersona);
    if (config && !loginEmail) {
      setLoginEmail(config.demoCreds.email);
      setLoginPassword(config.demoCreds.pass);
      if (!loginCompanyCode && config.demoCreds.company) {
        setLoginCompanyCode(
          prefillOrgCode ? prefillOrgCode.toUpperCase() : config.demoCreds.company
        );
      }
    }
  }, [selectedPersona]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          companyCode: loginCompanyCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.isSubscriptionExpired && data.isOwner) {
          setExpiredOwnerInfo({
            companyCode: data.companyCode,
            companyName: data.companyName,
            ownerEmail: data.ownerEmail,
            planId: data.planId || "monthly",
          });
          setIsRenewModalOpen(true);
        }
        throw new Error(data.error || data.message || "Login failed");
      }

      setSuccess(`Authenticated successfully as ${data.user.name} (${data.user.role})! Redirecting...`);
      if (typeof window !== "undefined") {
        localStorage.setItem("taskflow_jwt", data.token);
        document.cookie = `demo_persona_role=${data.user.role?.toLowerCase()}; path=/; max-age=2592000`;
      }

      await fetchSession();

      // Redirect immediately to clean tenant workspace with org code in URL
      const targetOrg = data.company?.code || loginCompanyCode || prefillOrgCode;
      setTimeout(() => {
        if (targetOrg) {
          window.location.href = `/${targetOrg}/exec/dashboard`;
        } else {
          window.location.href = "/exec/dashboard";
        }
      }, 700);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerRenewalSuccess = async (paymentData: {
    verificationToken: string;
    paymentId: string;
    plan: PlanId;
    planName: string;
  }) => {
    try {
      setLoading(true);
      const res = await fetch("/api/subscription/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentToken: paymentData.verificationToken,
          plan: paymentData.plan,
          companyCode: expiredOwnerInfo?.companyCode || loginCompanyCode,
          paymentId: paymentData.paymentId,
        }),
      });

      const renewData = await res.json();
      if (!renewData.success) {
        throw new Error(renewData.error || "Subscription renewal failed");
      }

      setIsRenewModalOpen(false);
      setSuccess("Subscription renewed! Logging in to reactivated workspace...");

      // Automatically complete login
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          companyCode: loginCompanyCode || expiredOwnerInfo?.companyCode,
        }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem("taskflow_jwt", loginData.token);
        document.cookie = `demo_persona_role=owner; path=/; max-age=2592000`;
        const targetOrg = loginData.company?.code || loginCompanyCode;
        setTimeout(() => {
          window.location.href = targetOrg ? `/${targetOrg}/exec/dashboard` : "/exec/dashboard";
        }, 700);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isPaymentVerified) {
      setError("Active subscription required. Please choose your plan and complete Razorpay checkout ($20/mo or $200/yr) to launch your workspace.");
      setIsCheckoutModalOpen(true);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: signupCompanyName,
          companyCode: signupCompanyCode,
          ownerName: signupOwnerName,
          email: signupEmail,
          password: signupPassword,
          plan: selectedPlan,
          paymentToken,
          paymentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Registration failed");
      }

      setSuccess(`Organization "${data.company.name}" created! Logged in as Owner. Launching clean workspace...`);
      if (typeof window !== "undefined") {
        localStorage.setItem("taskflow_jwt", data.token);
        document.cookie = `demo_persona_role=owner; path=/; max-age=2592000`;
      }

      await fetchSession();

      // Redirect immediately with org code attached to the URL
      const targetOrg = data.company?.code || signupCompanyCode;
      setTimeout(() => {
        if (targetOrg) {
          window.location.href = `/${targetOrg}/exec/dashboard`;
        } else {
          window.location.href = "/exec/dashboard";
        }
      }, 700);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") {
      localStorage.removeItem("taskflow_jwt");
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    setSession(null);
    setSuccess("Logged out successfully.");
  };

  const currentConfig = PERSONA_CONFIGS.find((p) => p.key === selectedPersona)!;
  const ActiveIcon = currentConfig.icon;

  return (
    <main className="flex flex-col min-w-0 p-3 sm:p-6 flex-1 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <header className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-5 sm:p-6 mb-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[6px] bg-[#0078D4] text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-[#242424] dark:text-[#FFFFFF]">
                Corporate Access &amp; Multi-Tenant Portal
              </h1>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4]">
                Strict tenant isolation by <code className="bg-[#FAF9F8] dark:bg-[#292827] px-1 py-0.5 rounded border border-[#E1DFDD] dark:border-[#3B3A39]">companyId</code> with role-based governance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/projects"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-[4px] border border-[#E1DFDD] dark:border-[#3B3A39] bg-white dark:bg-[#201F1E] text-[#242424] dark:text-white hover:bg-[#FAF9F8] transition-colors"
          >
            &larr; Return to Projects Workspace
          </Link>
        </div>
      </header>

      {/* Dedicated Organization Scoped Portal Badge */}
      {prefillOrgCode && (
        <div className="bg-[#EBF3FC] dark:bg-[#1C2B3D] border border-[#0078D4]/40 rounded-[8px] p-4 sm:p-5 mb-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[6px] bg-[#0078D4] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#0078D4] text-white">
                  Dedicated Organization Portal
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-[#0078D4] dark:text-[#479EF5]">
                  [{prefillOrgCode.toUpperCase()}]
                </span>
              </div>
              <h2 className="text-base font-bold text-[#242424] dark:text-white mt-1">
                {orgName ? orgName : `Company Code: ${prefillOrgCode.toUpperCase()}`}
              </h2>
              <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-0.5">
                All staff logins and workflows are automatically isolated and protected under this organization boundary.
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-[4px] bg-white dark:bg-[#201F1E] border border-[#0078D4]/30 text-xs text-[#0078D4] dark:text-[#479EF5] font-semibold shrink-0">
            URL Scoped: /{prefillOrgCode.toUpperCase()}
          </div>
        </div>
      )}

      {/* Active Session Notification Card */}
      {session && (
        <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-[8px] p-4 mb-6 shadow-sm animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {session.user.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-[#242424] dark:text-white">
                    {session.user.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    Role: {session.user.role}
                  </span>
                  {session.company && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-[#201F1E] border border-emerald-300 dark:border-emerald-700 text-[#242424] dark:text-white">
                      Organization: {session.company.name} [{session.company.code}]
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#605E5C] dark:text-[#C8C6C4] mt-0.5">
                  Active workspace scoped strictly to Company ID: <strong>{session.user.companyId || "Global (Dev)"}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/projects"
                className="px-3 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-[4px] text-xs font-semibold shadow-sm transition-colors"
              >
                Go to Workspace
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 bg-[#D13438] hover:bg-[#A80000] text-white rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= UNIFIED AUTH CARD WITH ROLE SELECTOR ================= */}
      <section className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 sm:p-8 mb-6 shadow-sm max-w-2xl mx-auto w-full">
        {/* Role Selector Dropdown */}
        <div className="pb-5 mb-5 border-b border-[#F3F2F1] dark:border-[#292827]">
          <label
            htmlFor="role-dropdown"
            className="block text-xs font-bold uppercase tracking-wider text-[#605E5C] dark:text-[#C8C6C4] mb-2"
          >
            Select Role to Sign In
          </label>
          <div className="relative">
            <select
              id="role-dropdown"
              value={selectedPersona}
              onChange={(e) => handleSelectPersona(e.target.value as PersonaKey)}
              className="w-full pl-10 pr-9 py-2.5 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[6px] text-xs font-bold text-[#242424] dark:text-white outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] appearance-none cursor-pointer shadow-xs transition-colors"
            >
              <option value="employee">Company Employee (Dev / Sales / Ops Specialist)</option>
              <option value="owner">Company Owner (Founder &amp; Executive Authority)</option>
              <option value="superuser">Developer Superuser (Master Mode)</option>
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0078D4] dark:text-[#479EF5]">
              <ActiveIcon className="w-4 h-4" />
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A8886]">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${currentConfig.badgeStyle}`}>
              {currentConfig.shortRole}
            </span>
            <span className="text-[11px] text-[#605E5C] dark:text-[#A19F9D]">
              {currentConfig.tagline}
            </span>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 mb-4 rounded-[4px] bg-[#FDE7E9] dark:bg-[#44171A] border border-[#F1707B] text-[#D13438] dark:text-[#F1707B] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 mb-4 rounded-[4px] bg-[#DFF6DD] dark:bg-[#0F3818] border border-[#107C10] text-[#107C10] dark:text-[#54B054] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* -------------------- 1. OWNER FORM (SIGNUP vs LOGIN) -------------------- */}
        {selectedPersona === "owner" && (
          <div>
            <div className="flex border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-5">
              <button
                type="button"
                onClick={() => setOwnerMode("login")}
                className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${ownerMode === "login"
                  ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
                  : "border-transparent text-[#605E5C] dark:text-[#C8C6C4]"
                  }`}
              >
                <Lock className="w-4 h-4" />
                <span>Sign In as Existing Owner</span>
              </button>

              <button
                type="button"
                onClick={() => setOwnerMode("signup")}
                className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${ownerMode === "signup"
                  ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
                  : "border-transparent text-[#605E5C] dark:text-[#C8C6C4]"
                  }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Create New Organization (Fresh Workspace)</span>
              </button>


            </div>

            {ownerMode === "signup" ? (
              !isPaymentVerified ? (
                <div className="space-y-4 text-xs max-w-2xl bg-white dark:bg-[#1E1E1E] p-6 rounded-xl border border-[#E1DFDD] dark:border-[#3B3A39] shadow-sm">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                    <Lock className="w-4 h-4" />
                    <span>Subscription Razorpay Payment</span>
                  </div>

                  <p className="text-[#605E5C] dark:text-[#C8C6C4] leading-relaxed text-xs">
                    TaskPMS provides an isolated per-company MongoDB database perimeter and AWS S3 document vault. A direct paid subscription (<span className="font-semibold text-gray-900 dark:text-white">$20 USD/mo</span>, <span className="font-semibold text-gray-900 dark:text-white">$55 USD/3mo</span>, or <span className="font-semibold text-gray-900 dark:text-white">$200 USD/yr</span>) is strictly required to provision a new organization workspace.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                    <div
                      onClick={() => setSelectedPlan("monthly")}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${selectedPlan === "monthly"
                          ? "border-[#0078D4] bg-[#EBF3FC]/50 dark:bg-[#1C2B3D]/50 shadow-xs"
                          : "border-[#E1DFDD] dark:border-[#3B3A39] hover:border-gray-400"
                        }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-[#242424] dark:text-white">Monthly Plan</span>
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === "monthly"
                              ? "border-[#0078D4] bg-[#0078D4]"
                              : "border-gray-400"
                            }`}
                        >
                          {selectedPlan === "monthly" && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-[#242424] dark:text-white">
                        $20 <span className="text-xs font-normal text-gray-500">USD / mo</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">Flexible month-to-month billing</p>
                    </div>

                    <div
                      onClick={() => setSelectedPlan("quarterly")}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${selectedPlan === "quarterly"
                          ? "border-[#0078D4] bg-[#EBF3FC]/50 dark:bg-[#1C2B3D]/50 shadow-xs"
                          : "border-[#E1DFDD] dark:border-[#3B3A39] hover:border-gray-400"
                        }`}
                    >
                      <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#0078D4] text-white shadow-xs">
                        Save $5 (3 Months)
                      </span>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-[#242424] dark:text-white">3-Month Plan</span>
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === "quarterly"
                              ? "border-[#0078D4] bg-[#0078D4]"
                              : "border-gray-400"
                            }`}
                        >
                          {selectedPlan === "quarterly" && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-[#242424] dark:text-white">
                        $55 <span className="text-xs font-normal text-gray-500">USD / 3 mo</span>
                      </div>
                      <p className="text-[10px] text-[#0078D4] dark:text-[#479EF5] font-medium mt-1">
                        Save $5 vs monthly
                      </p>
                    </div>

                    <div
                      onClick={() => setSelectedPlan("annual")}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${selectedPlan === "annual"
                          ? "border-[#0078D4] bg-[#EBF3FC]/50 dark:bg-[#1C2B3D]/50 shadow-xs"
                          : "border-[#E1DFDD] dark:border-[#3B3A39] hover:border-gray-400"
                        }`}
                    >
                      <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#107C10] text-white shadow-xs">
                        Save 17% ($40/yr)
                      </span>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-[#242424] dark:text-white">Annual Plan</span>
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === "annual"
                              ? "border-[#0078D4] bg-[#0078D4]"
                              : "border-gray-400"
                            }`}
                        >
                          {selectedPlan === "annual" && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-[#242424] dark:text-white">
                        $200 <span className="text-xs font-normal text-gray-500">USD / yr</span>
                      </div>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                        Best value for scaling
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[11px] text-[#605E5C] dark:text-[#A19F9D] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#107C10]" />
                      <span>Encrypted Razorpay payment gateway</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsCheckoutModalOpen(true)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        Pay with Razorpay (${selectedPlan === "annual" ? "200" : selectedPlan === "quarterly" ? "55" : "20"}) to Unlock
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4 text-xs max-w-2xl">
                  {/* Verified subscription banner */}
                  <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">✓ Subscription Payment Verified via Razorpay:</div>
                      <div className="text-[11px] mt-0.5">
                        Plan: <span className="font-semibold">{selectedPlan === "annual" ? "Enterprise Annual ($200/yr)" : selectedPlan === "quarterly" ? "Enterprise 3-Month ($55/3mo)" : "Enterprise Monthly ($20/mo)"}</span> · Receipt ID: <code className="bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded font-mono">{paymentId}</code>.
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
                        Fill in your organization details below to instantly initialize your dedicated database perimeter.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-medium text-[#242424] dark:text-white mb-1">
                        Organization / Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={signupCompanyName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSignupCompanyName(val);
                          if (!signupCompanyCode) {
                            const prefix = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
                            const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                            let gen = prefix;
                            while (gen.length < 6) {
                              gen += chars.charAt(Math.floor(Math.random() * chars.length));
                            }
                            setSignupCompanyCode(gen.slice(0, 6));
                          }
                        }}
                        placeholder="e.g. Globex Technologies"
                        className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-medium text-[#242424] dark:text-white">
                          6-Char Company Code *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const prefix = (signupCompanyName || "ORG")
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, "")
                              .slice(0, 3);
                            const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                            let gen = prefix;
                            while (gen.length < 6) {
                              gen += chars.charAt(Math.floor(Math.random() * chars.length));
                            }
                            setSignupCompanyCode(gen.slice(0, 6));
                          }}
                          className="text-[10px] text-[#0078D4] dark:text-[#479EF5] hover:underline font-semibold"
                        >
                          Regenerate Code
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={signupCompanyCode}
                        onChange={(e) =>
                          setSignupCompanyCode(
                            e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
                          )
                        }
                        placeholder="GLB724"
                        className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4] font-mono font-bold tracking-wider uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-medium text-[#242424] dark:text-white mb-1">
                        Owner Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={signupOwnerName}
                        onChange={(e) => setSignupOwnerName(e.target.value)}
                        placeholder="e.g. Alex Sterling"
                        className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-[#242424] dark:text-white mb-1">
                        Owner Login Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="owner@globex.com"
                        className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-[#242424] dark:text-white mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full p-2 pr-9 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-[#8A8886]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-[#0078D4] hover:bg-[#106EBE] disabled:opacity-50 text-white rounded font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <Crown className="w-4 h-4" />
                    <span>{loading ? "Creating Organization..." : "Launch Organization & Login"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )
            ) : (
              <form onSubmit={handleLogin} className="space-y-4 text-xs max-w-xl">
                <div>
                  <label className="block font-medium text-[#242424] dark:text-white mb-1">
                    Company Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={loginCompanyCode}
                    onChange={(e) => setLoginCompanyCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ACME"
                    className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4] font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#242424] dark:text-white mb-1">
                    Owner Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="sarah.connor@acme.corp"
                    className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#242424] dark:text-white mb-1">
                    Owner Password *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full p-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#0078D4] hover:bg-[#106EBE] disabled:opacity-50 text-white rounded font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loading ? "Authenticating..." : "Sign In as Owner"}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* -------------------- 2. MANAGER / TL / EMPLOYEE / DEV FORMS -------------------- */}
        {selectedPersona !== "owner" && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs max-w-xl">
            {selectedPersona !== "superuser" && (
              <div>
                <label className="block font-medium text-[#242424] dark:text-white mb-1">
                  6-Digit/Character Company Code *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#8A8886] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={loginCompanyCode}
                    onChange={(e) => setLoginCompanyCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="e.g. ACME01"
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4] font-mono font-bold tracking-wider uppercase"
                  />
                </div>
                <span className="text-[10px] text-[#8A8886] mt-0.5 block">
                  Your organization's 6-character code provided by your Owner or Operations Manager.
                </span>
              </div>
            )}

            <div>
              <label className="block font-medium text-[#242424] dark:text-white mb-1">
                {selectedPersona === "employee"
                  ? "Employee Login Email (Provided by Manager) *"
                  : "Superuser Developer Email *"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8A8886] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="user@acme.corp"
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#242424] dark:text-white mb-1">
                {selectedPersona === "employee"
                  ? "Initial Password (Provided by Manager) *"
                  : "Password *"}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#8A8886] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#8A8886]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#0078D4] hover:bg-[#106EBE] disabled:opacity-50 text-white rounded font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <ActiveIcon className="w-4 h-4" />
              <span>
                {loading
                  ? "Authenticating..."
                  : `Sign In as ${currentConfig.label}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </section>

      {/* Razorpay Subscription Paywall Modal */}
      <RazorpayCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        defaultPlan={selectedPlan}
        companyNameHint={signupCompanyName}
        emailHint={signupEmail}
        onPaymentSuccess={(data) => {
          setIsPaymentVerified(true);
          setPaymentToken(data.verificationToken);
          setPaymentId(data.paymentId);
          setSelectedPlan(data.plan);
          setIsCheckoutModalOpen(false);
          setSuccess(`Payment verified! Plan: ${data.planName}. Please enter your company details below.`);
        }}
      />

      {/* Razorpay Subscription Renewal Modal for Expired Owner */}
      <RazorpayCheckoutModal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        defaultPlan={expiredOwnerInfo?.planId || "monthly"}
        companyNameHint={expiredOwnerInfo?.companyName || loginCompanyCode}
        emailHint={expiredOwnerInfo?.ownerEmail || loginEmail}
        title="Renew Organization Subscription"
        subtitle="Workspace access is on hold. Complete Razorpay checkout to reactivate immediately."
        onPaymentSuccess={handleOwnerRenewalSuccess}
      />
    </main>
  );
}
