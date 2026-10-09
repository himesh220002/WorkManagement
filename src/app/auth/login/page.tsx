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
  Users,
  Eye,
  EyeOff,
  LogOut,
  CreditCard,
  Check,
  X,
  History,
  RotateCw,
} from "lucide-react";
import { SiRazorpay } from "react-icons/si";
import RazorpayCheckoutModal from "@/components/payment/RazorpayCheckoutModal";
import RepayServiceModal from "@/components/subscription/RepayServiceModal";
import { PRICING_PLANS, PlanId, calculateTieredSubscriptionCost } from "@/lib/razorpay";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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

export default function AuthPage({
  prefillOrgCode,
  orgName,
}: {
  prefillOrgCode?: string;
  orgName?: string;
} = {}) {
  const router = useRouter();

  // Unified Top Tab: "login" (Sign In to Workspace) vs "signup" (Create New Organization)
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Active session
  const [session, setSession] = useState<SessionData | null>(null);

  // Sign In Form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginCompanyCode, setLoginCompanyCode] = useState(prefillOrgCode || "");

  // Expired Subscription restriction state
  const [expiredOwnerInfo, setExpiredOwnerInfo] = useState<{
    isOwner: boolean;
    companyCode: string;
    companyName: string;
    ownerEmail: string;
    planId: string;
  } | null>(null);

  // Developer Bypass Popup (RegDevKey) State
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [devKeyInput, setDevKeyInput] = useState("8105542318220002");
  const [devCompanyCode, setDevCompanyCode] = useState(prefillOrgCode || "ORGTTU");
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);

  // Repay & Subscription Management Modal State
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);

  // Registration & Paywall States
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("monthly");
  const [selectedCurrency, setSelectedCurrency] = useState<"INR" | "USD">("INR");
  const [signupUserCount, setSignupUserCount] = useState<number>(2);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Inline Developer Key Bypass for Testing Registration
  const [isRegDevKeyOpen, setIsRegDevKeyOpen] = useState(false);
  const [regDevKeyInput, setRegDevKeyInput] = useState("8105542318220002");
  const [isDevKeyVerifying, setIsDevKeyVerifying] = useState(false);
  const [devKeyError, setDevKeyError] = useState<string | null>(null);

  // Company Details for Signup
  const [signupCompanyName, setSignupCompanyName] = useState("");
  const [signupCompanyCode, setSignupCompanyCode] = useState("");
  const [signupOwnerName, setSignupOwnerName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Calculate Tiered Costs
  const monthlyCalc = calculateTieredSubscriptionCost(signupUserCount, "monthly", selectedCurrency);
  const quarterlyCalc = calculateTieredSubscriptionCost(signupUserCount, "quarterly", selectedCurrency);
  const annualCalc = calculateTieredSubscriptionCost(signupUserCount, "annual", selectedCurrency);
  const currentCalc = calculateTieredSubscriptionCost(signupUserCount, selectedPlan, selectedCurrency);

  // Auto-generate company code on organization name change
  useEffect(() => {
    if (signupCompanyName && !signupCompanyCode) {
      const prefix = signupCompanyName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 3);
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let gen = prefix;
      while (gen.length < 6) {
        gen += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setSignupCompanyCode(gen.slice(0, 6));
    }
  }, [signupCompanyName, signupCompanyCode]);

  // Load Razorpay checkout script dynamically
  useEffect(() => {
    if (!document.getElementById("razorpay-sdk")) {
      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch current session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setSession({
              user: data.user,
              company: data.company,
              permissions: {
                isSuperuser: data.user.role === "superuser",
                canManageCompany: ["owner", "superuser"].includes(data.user.role),
                canManageProjects: ["owner", "manager", "teamlead", "superuser"].includes(data.user.role),
                canAssignTasks: ["owner", "manager", "teamlead", "superuser"].includes(data.user.role),
                isEmployeeOnly: data.user.role === "employee",
              },
            });
          }
        }
      } catch (err) {
        // Ignore unauthenticated on login page
      }
    };
    fetchSession();
  }, []);

  // Handle Unified Sign In (Auto-detects Owner / Manager / TL / Employee)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setExpiredOwnerInfo(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
          companyCode: loginCompanyCode.trim() ? loginCompanyCode.trim().toUpperCase() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.isSubscriptionExpired) {
          setExpiredOwnerInfo({
            isOwner: data.isOwner,
            companyCode: data.companyCode || loginCompanyCode,
            companyName: data.companyName,
            ownerEmail: data.ownerEmail || loginEmail,
            planId: data.planId || "monthly",
          });
          setError(data.error);
          return;
        }
        throw new Error(data.error || "Authentication failed. Please verify your credentials.");
      }

      setSession({
        user: data.user,
        company: data.company,
        permissions: {
          isSuperuser: data.user.role === "superuser",
          canManageCompany: ["owner", "superuser"].includes(data.user.role),
          canManageProjects: ["owner", "manager", "teamlead", "superuser"].includes(data.user.role),
          canAssignTasks: ["owner", "manager", "teamlead", "superuser"].includes(data.user.role),
          isEmployeeOnly: data.user.role === "employee",
        },
      });

      setSuccess(`Welcome back, ${data.user.name}! Accessing workspace perimeter...`);

      const targetPath = data.company?.code
        ? `/${data.company.code}/projects`
        : "/projects";
      setTimeout(() => {
        router.push(targetPath);
      }, 500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  // Developer Bypass Login via Popup
  const handleDevBypassLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevLoading(true);
    setDevError(null);

    try {
      const res = await fetch("/api/auth/dev-bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regDevKey: devKeyInput.trim(),
          companyCode: devCompanyCode.trim().toUpperCase(),
          action: "login",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Developer authentication failed.");
      }

      setIsDevModalOpen(false);
      setSuccess(`Developer Key accepted! Connecting to ${data.company?.name || devCompanyCode}...`);
      setTimeout(() => {
        router.push(data.redirectUrl || `/${data.company?.code || devCompanyCode}/projects`);
      }, 400);
    } catch (err: any) {
      setDevError(err.message || "Failed to bypass as Developer");
    } finally {
      setDevLoading(false);
    }
  };

  // Developer Bypass for Registration Checkout
  const handleVerifyDevKey = async () => {
    setIsDevKeyVerifying(true);
    setDevKeyError(null);

    try {
      const res = await fetch("/api/auth/dev-bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regDevKey: regDevKeyInput.trim(),
          action: "register",
          plan: selectedPlan,
          userCount: signupUserCount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Developer key validation failed");
      }

      setIsPaymentVerified(true);
      setPaymentToken(data.verificationToken);
      setPaymentId(data.paymentId);
      setIsRegDevKeyOpen(false);
      setSuccess(
        `✓ Developer Key Accepted! Payment bypassed for ${signupUserCount} seats under ${PRICING_PLANS[selectedPlan].name}. Please enter organization details below.`
      );
    } catch (err: any) {
      setDevKeyError(err.message || "Invalid Developer Key.");
    } finally {
      setIsDevKeyVerifying(false);
    }
  };

  // Razorpay Checkout for Fresh Workspace Registration
  const handleInitiateSignupPayment = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const orderRes = await fetch("/api/payment/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          userCount: signupUserCount,
          currency: selectedCurrency,
          companyName: signupCompanyName || "New Workspace",
          email: signupEmail || "admin@workspace.com",
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create subscription checkout order");
      }

      if (window.Razorpay && !orderData.isDirectBypass) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "TaskPMS Enterprise",
          description: `${orderData.planName} · ${signupUserCount} Seats Workspace`,
          order_id: orderData.orderId,
          prefill: {
            name: signupOwnerName || "Workspace Owner",
            email: signupEmail || "owner@example.com",
          },
          theme: { color: "#0078D4" },
          handler: async (response: any) => {
            await verifySignupPayment({
              orderId: response.razorpay_order_id || orderData.orderId,
              paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              signature: response.razorpay_signature || "signature_ok",
              plan: selectedPlan,
              userCount: signupUserCount,
              currency: selectedCurrency,
            });
          },
          modal: {
            ondismiss: () => {
              setIsProcessingPayment(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          setPaymentError(response.error?.description || "Payment failed. Please try again.");
          setIsProcessingPayment(false);
        });
        rzp.open();
      } else {
        await verifySignupPayment({
          orderId: orderData.orderId,
          paymentId: `pay_direct_${Date.now()}`,
          signature: "direct_bypass_signature",
          plan: selectedPlan,
          userCount: signupUserCount,
          currency: selectedCurrency,
        });
      }
    } catch (err: any) {
      setPaymentError(err.message || "Failed to initialize subscription checkout");
      setIsProcessingPayment(false);
    }
  };

  const verifySignupPayment = async (payload: {
    orderId: string;
    paymentId: string;
    signature: string;
    plan: PlanId;
    userCount: number;
    currency: "INR" | "USD";
  }) => {
    try {
      const verifyRes = await fetch("/api/payment/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new Error(verifyData.error || "Payment verification failed");
      }

      setIsProcessingPayment(false);
      setIsPaymentVerified(true);
      setPaymentToken(verifyData.verificationToken);
      setPaymentId(verifyData.paymentId);
      setSuccess(
        `✓ Subscription Verified! (${PRICING_PLANS[payload.plan].name} · ${payload.userCount} Seats · Receipt ID: ${verifyData.paymentId}). Please fill your organization details below.`
      );
    } catch (err: any) {
      setPaymentError(err.message || "Payment verification failed");
      setIsProcessingPayment(false);
    }
  };

  // Submit Fresh Workspace Registration Form
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isPaymentVerified) {
      setError(
        "Active subscription required. Please complete Razorpay checkout or enter your 16-digit RegDevKey to provision a new workspace."
      );
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
          userCount: signupUserCount,
          paymentToken,
          paymentId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create organization");
      }

      setSuccess(`Organization "${data.company.name}" created successfully! Launching workspace...`);
      setTimeout(() => {
        router.push(`/${data.company.code}/projects`);
      }, 600);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    setSuccess("Logged out successfully");
  };

  return (
    <main className="flex flex-col min-w-0 p-3 sm:p-6 flex-1 max-w-[1200px] mx-auto w-full">
      {/* Active Session Ribbon (If Already Logged In) */}
      {session && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0078D4] text-white flex items-center justify-center font-bold text-sm">
              {session.user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#242424] dark:text-white">
                  {session.user.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-[#0078D4] dark:bg-blue-900 dark:text-blue-200">
                  {session.user.role}
                </span>
                {session.company && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200">
                    {session.company.code}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Logged in as {session.user.email} · {session.company?.name || "Global Workspace"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={session.company?.code ? `/${session.company.code}/projects` : "/projects"}
              className="px-3 py-1.5 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded text-xs font-semibold shadow-xs transition-colors"
            >
              Go to Workspace
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= TOP UNIFIED AUTH CARD ================= */}
      <section className="bg-white dark:bg-[#1E1E1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-xl p-5 sm:p-8 shadow-sm mx-auto w-full">
        {/* Unified Top Tabs: Sign In vs Create New Organization */}
        <div className="flex border-b border-[#E1DFDD] dark:border-[#3B3A39] mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setError(null);
              setSuccess(null);
            }}
            className={`pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === "login"
                ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
                : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424] dark:hover:text-white"
              }`}
          >
            <Lock className="w-4 h-4" />
            <span>Sign In to Your Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("signup");
              setError(null);
              setSuccess(null);
            }}
            className={`pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === "signup"
                ? "border-[#0078D4] text-[#0078D4] dark:text-[#479EF5]"
                : "border-transparent text-[#605E5C] dark:text-[#C8C6C4] hover:text-[#242424] dark:hover:text-white"
              }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Create New Organization (Fresh Workspace)</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3 mb-5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div className="flex-1 min-w-0">{error}</div>
          </div>
        )}

        {/* Expired Subscription Account Hold Banner with 1-Click Repay Action */}
        {expiredOwnerInfo && (
          <div className="mb-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <strong className="block text-sm">Workspace Access On Hold: Subscription Expired</strong>
                <span className="text-[11px] text-amber-800 dark:text-amber-300">
                  {expiredOwnerInfo.isOwner
                    ? `Your organization '${expiredOwnerInfo.companyName}' (${expiredOwnerInfo.companyCode}) subscription period has ended. Reactivate workspace access by extending the plan.`
                    : `Organization '${expiredOwnerInfo.companyName}' is currently restricted due to plan expiration. Contact your owner or repay directly.`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRepayModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-sm shrink-0 cursor-pointer text-xs"
            >
              <CreditCard className="w-4 h-4" />
              <span>Repay &amp; Reactivate Workspace (+30 Days)</span>
            </button>
          </div>
        )}

        {/* Global Success Banner */}
        {success && (
          <div className="p-3 mb-5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* -------------------- 1. UNIFIED SIGN IN TAB -------------------- */}
        {activeTab === "login" && (
          <div>
            {/* Top Bar inside Login Form: Title + Developer Bypass Button */}
            <div className="flex items-center justify-between gap-3 flex-wrap pb-4 mb-5 border-b border-gray-100 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-sm text-[#242424] dark:text-white flex items-center gap-2">
                  <span>Sign In to Workspace</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-[#0078D4] dark:bg-blue-950/60 dark:text-blue-300">
                    Role Auto-Detected
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Enter your email and password. Organization boundary and role privileges (Owner, Manager, Team Lead, Employee) are resolved automatically.
                </p>
              </div>

              {/* Developer Logger Popup Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setIsDevModalOpen(true);
                  setDevError(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Developer logger popup using 16-character regDevKey"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Developer Bypass (RegDevKey)</span>
              </button>
            </div>

            {/* Single Unified Sign In Form */}
            <form onSubmit={handleLogin} className="space-y-4 text-xs max-w-xl">
              <div>
                <label className="block font-semibold text-[#242424] dark:text-white mb-1">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. sarah.connor@acme.corp or satyamhimesh@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#242424] dark:text-white mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-9 py-2 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-[#0078D4]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#242424] dark:text-white mb-1">
                  6-Character Company ID <span className="font-normal text-gray-400">(Optional / Auto-resolved)</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    value={loginCompanyCode}
                    onChange={(e) => setLoginCompanyCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="e.g. ORGTTU or ACME01"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-mono font-bold tracking-wider uppercase outline-none focus:border-[#0078D4]"
                  />
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Leave blank to auto-connect to your assigned organization, or specify code for exact multi-company routing.
                </span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#0078D4] hover:bg-[#106EBE] disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loading ? "Verifying Credentials..." : "Sign In to Workspace"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Repay Service Trigger Link */}
                <button
                  type="button"
                  onClick={() => setIsRepayModalOpen(true)}
                  className="text-[11px] text-[#0078D4] hover:underline flex items-center gap-1 font-semibold cursor-pointer self-center"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Subscription Expired? Open Repay Portal</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* -------------------- 2. CREATE NEW ORGANIZATION TAB -------------------- */}
        {activeTab === "signup" && (
          <div>
            {!isPaymentVerified ? (
              <div className="space-y-4 text-xs">
                {/* Header with Title and Action Buttons (Repay + RegDevKey) */}
                <div className="flex items-center justify-between gap-3 flex-wrap pb-4 mb-4 border-b border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0078D4] dark:text-[#479EF5] flex items-center justify-center font-bold">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#242424] dark:text-white flex items-center gap-1.5">
                        <span>Enterprise Workspace Subscription &amp; Dedicated Cloud Perimeter</span>
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Dedicated per-company isolated MongoDB database &amp; encrypted AWS S3 document vault
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Repay Service Button */}
                    <button
                      type="button"
                      onClick={() => setIsRepayModalOpen(true)}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Existing customer looking to renew or repay subscription"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Repay Existing Service</span>
                    </button>

                    {/* RegDevKey Bypass Button for testing signup */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegDevKeyOpen(!isRegDevKeyOpen);
                        setDevKeyError(null);
                      }}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Use 16-digit regDevKey from .env to bypass payment during testing"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Use RegDevKey</span>
                    </button>
                  </div>
                </div>

                {/* Inline RegDevKey Bypass Drawer for Testing */}
                {isRegDevKeyOpen && (
                  <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-purple-700 dark:text-purple-300" />
                        <span className="font-bold text-purple-900 dark:text-purple-200">
                          Developer 16-Digit regDevKey Direct Bypass
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsRegDevKeyOpen(false)}
                        className="text-purple-400 hover:text-purple-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-purple-700 dark:text-purple-300 mb-3">
                      Enter the 16-digit developer key from your <code>.env</code> file (defaults to <code>8105542318220002</code>) to bypass payment verification for test organization registration.
                    </p>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={regDevKeyInput}
                        onChange={(e) => setRegDevKeyInput(e.target.value.trim())}
                        placeholder="16-digit regDevKey"
                        className="w-full max-w-sm p-2 bg-white dark:bg-zinc-800 border border-purple-300 dark:border-purple-700 rounded text-xs font-mono font-bold tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyDevKey}
                        disabled={isDevKeyVerifying}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        {isDevKeyVerifying ? "Verifying..." : "Validate & Unlock"}
                      </button>
                    </div>
                    {devKeyError && (
                      <p className="text-[11px] text-rose-600 font-medium mt-2">{devKeyError}</p>
                    )}
                  </div>
                )}

                {/* Currency Switcher */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Choose Billing Currency &amp; Payment Rail:
                  </span>
                  <div className="flex rounded-lg border border-gray-300 dark:border-zinc-700 p-0.5 bg-gray-100 dark:bg-zinc-800">
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency("INR")}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${selectedCurrency === "INR"
                          ? "bg-white dark:bg-zinc-700 text-[#0078D4] shadow-xs"
                          : "text-gray-600 dark:text-gray-400"
                        }`}
                    >
                      India (INR ₹)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency("USD")}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${selectedCurrency === "USD"
                          ? "bg-white dark:bg-zinc-700 text-[#0078D4] shadow-xs"
                          : "text-gray-600 dark:text-gray-400"
                        }`}
                    >
                      US &amp; Global (USD $)
                    </button>
                  </div>
                </div>

                {/* Tiered Seat Stepper */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <div>
                      <span className="font-bold text-xs block text-[#242424] dark:text-white">
                        Workspace Team Seats:
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Total employee, manager &amp; owner accounts provisioned under this subscription
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSignupUserCount(Math.max(2, signupUserCount - 1))}
                        className="w-7 h-7 rounded border border-gray-300 dark:border-zinc-600 font-bold hover:bg-gray-200 dark:hover:bg-zinc-700 flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-sm">{signupUserCount}</span>
                      <button
                        type="button"
                        onClick={() => setSignupUserCount(signupUserCount + 1)}
                        className="w-7 h-7 rounded border border-gray-300 dark:border-zinc-600 font-bold hover:bg-gray-200 dark:hover:bg-zinc-700 flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                      <span className="text-xs text-gray-500">Seats</span>
                    </div>
                  </div>

                  {/* Popular Quick Tiers */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-gray-500 mr-1">Popular Tiers:</span>
                    {[2, 4, 5, 10, 20, 50, 100, 500].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSignupUserCount(num)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${signupUserCount === num
                            ? "bg-[#0078D4] text-white border-[#0078D4]"
                            : "bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:bg-gray-100"
                          }`}
                      >
                        {num} Seats
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-zinc-700 flex items-center justify-between text-[11px] flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500">Formula Applied:</span>
                      <strong className="text-[#0078D4] dark:text-[#479EF5]">
                        {monthlyCalc.tierFormulaLabel}
                      </strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500">Effective Cost:</span>
                      <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {selectedCurrency === "INR"
                          ? `₹${monthlyCalc.effectivePerUserMonthlyInr} / user / mo`
                          : `$${monthlyCalc.effectivePerUserMonthlyUsd.toFixed(2)} / user / mo`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Pricing Plan Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
                  {/* Monthly Plan */}
                  <div
                    onClick={() => setSelectedPlan("monthly")}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${selectedPlan === "monthly"
                        ? "border-[#0078D4] bg-[#EBF3FC]/50 dark:bg-[#1C2B3D]/50 shadow-xs"
                        : "border-gray-200 dark:border-zinc-700 hover:border-gray-400 bg-white dark:bg-[#252423]"
                      }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-[#242424] dark:text-white">Monthly Plan</span>
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === "monthly" ? "border-[#0078D4] bg-[#0078D4]" : "border-gray-400"
                            }`}
                        >
                          {selectedPlan === "monthly" && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-[#242424] dark:text-white">
                        {selectedCurrency === "INR"
                          ? `₹${monthlyCalc.totalInr.toLocaleString("en-IN")}`
                          : `$${monthlyCalc.totalUsd}`}{" "}
                        <span className="text-xs font-normal text-gray-500">/ mo</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Flexible month-to-month · {selectedCurrency === "INR" ? `₹${monthlyCalc.effectivePerUserMonthlyInr}` : `$${monthlyCalc.effectivePerUserMonthlyUsd.toFixed(2)}`} / user
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200/60 dark:border-zinc-700/60 font-semibold text-[11px] text-[#0078D4] dark:text-[#479EF5]">
                      Renews monthly · Full flexibility
                    </div>
                  </div>

                  {/* 3-Month Plan */}
                  <div
                    onClick={() => setSelectedPlan("quarterly")}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${selectedPlan === "quarterly"
                        ? "border-[#0078D4] bg-[#EBF3FC]/50 dark:bg-[#1C2B3D]/50 shadow-xs"
                        : "border-gray-200 dark:border-zinc-700 hover:border-gray-400 bg-white dark:bg-[#252423]"
                      }`}
                  >
                    <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#0078D4] text-white shadow-xs">
                      Save 7%
                    </span>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-[#242424] dark:text-white">3-Month Plan</span>
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === "quarterly" ? "border-[#0078D4] bg-[#0078D4]" : "border-gray-400"
                            }`}
                        >
                          {selectedPlan === "quarterly" && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-[#242424] dark:text-white">
                        {selectedCurrency === "INR"
                          ? `₹${quarterlyCalc.totalInr.toLocaleString("en-IN")}`
                          : `$${quarterlyCalc.totalUsd}`}{" "}
                        <span className="text-xs font-normal text-gray-500">/ 3 mo</span>
                      </div>
                      <p className="text-[10px] text-[#0078D4] font-medium mt-0.5">
                        Save 7% vs standard monthly rate
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200/60 dark:border-zinc-700/60 font-semibold text-[11px] text-[#0078D4] dark:text-[#479EF5]">
                      Total: {selectedCurrency === "INR" ? `₹${quarterlyCalc.totalInr.toLocaleString("en-IN")}` : `$${quarterlyCalc.totalUsd}`} for 3 months
                    </div>
                  </div>

                  {/* Annual Plan */}
                  <div
                    onClick={() => setSelectedPlan("annual")}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${selectedPlan === "annual"
                        ? "border-[#0078D4] bg-[#EBF3FC]/50 dark:bg-[#1C2B3D]/50 shadow-xs"
                        : "border-gray-200 dark:border-zinc-700 hover:border-gray-400 bg-white dark:bg-[#252423]"
                      }`}
                  >
                    <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#107C10] text-white shadow-xs">
                      Save 17% (2 Mo Free)
                    </span>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-[#242424] dark:text-white">Annual Plan</span>
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === "annual" ? "border-[#0078D4] bg-[#0078D4]" : "border-gray-400"
                            }`}
                        >
                          {selectedPlan === "annual" && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-[#242424] dark:text-white">
                        {selectedCurrency === "INR"
                          ? `₹${annualCalc.totalInr.toLocaleString("en-IN")}`
                          : `$${annualCalc.totalUsd}`}{" "}
                        <span className="text-xs font-normal text-gray-500">/ yr</span>
                      </div>
                      <p className="text-[10px] text-[#107C10] font-medium mt-0.5">
                        2 Months Free! (Pay for 10 months, get 12)
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200/60 dark:border-zinc-700/60 font-semibold text-[11px] text-[#107C10]">
                      Total: {selectedCurrency === "INR" ? `₹${annualCalc.totalInr.toLocaleString("en-IN")}` : `$${annualCalc.totalUsd}`} / year
                    </div>
                  </div>
                </div>

                {paymentError && (
                  <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Checkout Trigger Button */}
                <button
                  type="button"
                  onClick={handleInitiateSignupPayment}
                  disabled={isProcessingPayment}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0078D4] to-[#106EBE] hover:from-[#106EBE] hover:to-[#005A9E] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <SiRazorpay className="w-4 h-4" />
                  <span>
                    {isProcessingPayment
                      ? "Opening Secure Razorpay Portal..."
                      : `Verify & Pay ${selectedCurrency === "INR" ? `₹${currentCalc.totalInr.toLocaleString("en-IN")}` : `$${currentCalc.totalUsd}`} via Razorpay (${signupUserCount} Seats)`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Verified Workspace Configuration Form */
              <form onSubmit={handleSignup} className="space-y-4 text-xs max-w-xl">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">
                      Payment Verified · {signupUserCount} Seats provisioned ({PRICING_PLANS[selectedPlan].name})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPaymentVerified(false)}
                    className="text-[11px] underline font-medium hover:text-emerald-950"
                  >
                    Change Plan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold mb-1">Organization / Company Name *</label>
                    <input
                      type="text"
                      required
                      value={signupCompanyName}
                      onChange={(e) => setSignupCompanyName(e.target.value)}
                      placeholder="e.g. Globex Technologies"
                      className="w-full p-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none focus:border-[#0078D4]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold">6-Char Company Code *</label>
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
                        className="text-[10px] text-[#0078D4] hover:underline font-semibold"
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
                      className="w-full p-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg font-mono font-bold tracking-wider uppercase outline-none focus:border-[#0078D4]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold mb-1">Owner Full Name *</label>
                    <input
                      type="text"
                      required
                      value={signupOwnerName}
                      onChange={(e) => setSignupOwnerName(e.target.value)}
                      placeholder="e.g. Alex Sterling"
                      className="w-full p-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none focus:border-[#0078D4]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Owner Login Email *</label>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="owner@globex.com"
                      className="w-full p-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none focus:border-[#0078D4]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Initial Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full p-2 pr-9 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none focus:border-[#0078D4]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#0078D4] hover:bg-[#106EBE] disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>{loading ? "Creating Organization..." : "Launch Organization & Login"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}
      </section>

      {/* ================= DEVELOPER LOGGER POPUP (RegDevKey) ================= */}
      {isDevModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1E1E1E] border border-purple-200 dark:border-purple-800 rounded-xl shadow-2xl max-w-md w-full p-5 text-[#242424] dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Developer Workspace Logger</h3>
                  <span className="text-[10px] text-gray-500">Master bypass to any organization perimeter</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDevModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {devError && (
              <div className="mt-3 p-2.5 rounded bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{devError}</span>
              </div>
            )}

            <form onSubmit={handleDevBypassLogin} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  16-Character Developer Key (regDevKey) *
                </label>
                <input
                  type="text"
                  required
                  value={devKeyInput}
                  onChange={(e) => setDevKeyInput(e.target.value.trim())}
                  placeholder="8105542318220002"
                  className="w-full p-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-xs font-mono font-bold tracking-wider outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 block">
                  Configured in <code>.env</code> as REG_DEV_KEY.
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  6-Character Target Company ID *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={devCompanyCode}
                  onChange={(e) => setDevCompanyCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="e.g. ORGTTU"
                  className="w-full p-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-xs font-mono font-bold tracking-wider uppercase outline-none focus:border-purple-500"
                />

                {/* Quick Select Chips */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-gray-500">Quick Select:</span>
                  {["ORGTTU", "ORGTTV"].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setDevCompanyCode(code)}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border transition-all cursor-pointer ${devCompanyCode === code
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                        }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDevModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={devLoading}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{devLoading ? "Connecting..." : `Open ${devCompanyCode || "Company"} as Developer`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= REPAY & EXTENSION PORTAL MODAL ================= */}
      <RepayServiceModal
        isOpen={isRepayModalOpen}
        onClose={() => setIsRepayModalOpen(false)}
        initialCompanyCode={expiredOwnerInfo?.companyCode || loginCompanyCode || prefillOrgCode || ""}
        initialEmail={expiredOwnerInfo?.ownerEmail || loginEmail || ""}
        onRenewalSuccess={(renewedCode) => {
          setSuccess(`Organization ${renewedCode} subscription extended! You can now sign in.`);
          setExpiredOwnerInfo(null);
          setIsRepayModalOpen(false);
          setActiveTab("login");
        }}
      />
    </main>
  );
}
