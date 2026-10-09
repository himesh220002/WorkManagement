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

import { SiRazorpay } from "react-icons/si";

import RazorpayCheckoutModal from "@/components/payment/RazorpayCheckoutModal";
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
      email: "satyamhimesh@gmail.com",
      pass: "admin123",
      company: "ORGTTU",
    },
  },
  {
    key: "superuser",
    label: "System Developer",
    shortRole: "Developer Superuser",
    icon: Shield,
    tagline: "Log into any company workspace as Developer using your 16-digit regDevKey & 6-character Company ID",
    badgeStyle: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200",
    accentBorder: "border-rose-500",
    demoCreds: {
      email: "dev.superuser@taskflow.internal",
      pass: "8105542318220002",
      company: "ORGTTU",
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
  const [signupUserCount, setSignupUserCount] = useState<number>(2);
  const [selectedCurrency, setSelectedCurrency] = useState<"INR" | "USD">("INR");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentConfirmedAt, setPaymentConfirmedAt] = useState<string>("");
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // 16-Digit Developer Bypass Key (regDevKey) State
  const [isRegDevKeyOpen, setIsRegDevKeyOpen] = useState(false);
  const [regDevKeyInput, setRegDevKeyInput] = useState("");
  const [isVerifyingDevKey, setIsVerifyingDevKey] = useState(false);
  const [devKeyError, setDevKeyError] = useState<string | null>(null);

  // Expired Owner Renewal State
  const [expiredOwnerInfo, setExpiredOwnerInfo] = useState<{
    companyCode: string;
    companyName: string;
    ownerEmail: string;
    planId: PlanId;
  } | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  // Auto-record timestamp when payment is verified
  useEffect(() => {
    if (isPaymentVerified && !paymentConfirmedAt) {
      setPaymentConfirmedAt(
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  }, [isPaymentVerified, paymentConfirmedAt]);

  // Check active session, inject Razorpay SDK and check payment URL parameters on mount
  useEffect(() => {
    fetchSession();

    if (typeof window !== "undefined") {
      if (!document.getElementById("razorpay-sdk")) {
        const script = document.createElement("script");
        script.id = "razorpay-sdk";
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam === "signup") {
        setSelectedPersona("owner");
        setOwnerMode("signup");
      }
      const token = urlParams.get("payment_token");
      const plan = urlParams.get("plan");
      const paid = urlParams.get("paid");
      const seatsParam = urlParams.get("seats") || urlParams.get("user_count");
      const currencyParam = urlParams.get("currency");

      if (seatsParam) {
        const parsedSeats = parseInt(seatsParam, 10);
        if (!isNaN(parsedSeats) && parsedSeats > 0) setSignupUserCount(parsedSeats);
      }
      if (currencyParam === "USD" || currencyParam === "INR") {
        setSelectedCurrency(currencyParam);
      }

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

  const handleDevKeyBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevKeyError(null);
    setIsVerifyingDevKey(true);

    try {
      const res = await fetch("/api/auth/dev-bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regDevKey: regDevKeyInput,
          plan: selectedPlan,
          userCount: signupUserCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify developer key");
      }

      setIsPaymentVerified(true);
      setPaymentToken(data.verificationToken);
      setPaymentId(data.paymentId);
      setSelectedPlan(data.plan);
      if (data.userCount) setSignupUserCount(data.userCount);
      setIsRegDevKeyOpen(false);
      setSuccess(`✓ 16-digit regDevKey verified! Organization registration unlocked in Developer Mode.`);
    } catch (err: any) {
      setDevKeyError(err.message);
    } finally {
      setIsVerifyingDevKey(false);
    }
  };

  const handleDirectRazorpayCheckout = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);
    setError(null);

    try {
      const orderRes = await fetch("/api/payment/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          userCount: signupUserCount,
          currency: selectedCurrency,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      const planDetails = PRICING_PLANS[selectedPlan];
      const tieredCalc = calculateTieredSubscriptionCost(signupUserCount, selectedPlan, selectedCurrency);
      const displayAmount =
        selectedCurrency === "INR"
          ? `₹${tieredCalc.totalInr.toLocaleString("en-IN")}`
          : `$${tieredCalc.totalUsd}`;

      if (typeof window !== "undefined" && window.Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || selectedCurrency,
          name: "TaskPMS Enterprise",
          description: `${planDetails.name} · ${signupUserCount} Seat${signupUserCount > 1 ? "s" : ""} (${displayAmount})`,
          order_id: orderData.isSandbox ? undefined : orderData.orderId,
          prefill: {
            name: signupOwnerName || signupCompanyName || "Organization Owner",
            email: signupEmail || "owner@company.com",
          },
          theme: {
            color: "#0078D4",
          },
          method: {
            netbanking: true,
            card: true,
            upi: true,
            wallet: true,
            emi: true,
            paylater: true,
          },
          config: {
            display: {
              blocks: {
                all_methods: {
                  name: "All Payment Methods",
                  instruments: [
                    { method: "upi" },
                    { method: "card" },
                    { method: "netbanking" },
                    { method: "wallet" },
                    { method: "emi" },
                  ],
                },
              },
              sequence: ["block.all_methods"],
              preferences: {
                show_default_blocks: true,
              },
            },
          },
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
      console.error("Direct payment initiation error:", err);
      setPaymentError(err.message || "Failed to initialize payment");
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
        `✓ Subscription Payment Verified! (${PRICING_PLANS[payload.plan].name} · ${payload.userCount} Seat${payload.userCount > 1 ? "s" : ""} · Receipt ID: ${verifyData.paymentId}). Please enter your organization details below.`
      );
    } catch (err: any) {
      setPaymentError(err.message || "Payment verification failed");
      setIsProcessingPayment(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isPaymentVerified) {
      setError("Active subscription required. Please complete Razorpay checkout above or enter your 16-digit RegDevKey to unlock organization creation.");
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

  const currentPlan = PRICING_PLANS[selectedPlan];
  const tieredCalc = calculateTieredSubscriptionCost(signupUserCount, selectedPlan, selectedCurrency);
  const monthlyCalc = calculateTieredSubscriptionCost(signupUserCount, "monthly", selectedCurrency);
  const quarterlyCalc = calculateTieredSubscriptionCost(signupUserCount, "quarterly", selectedCurrency);
  const annualCalc = calculateTieredSubscriptionCost(signupUserCount, "annual", selectedCurrency);
  const totalDisplayPrice =
    selectedCurrency === "INR"
      ? `₹${tieredCalc.totalInr.toLocaleString("en-IN")}`
      : `$${tieredCalc.totalUsd}`;

  return (
    <main className="flex flex-col min-w-0 p-0 sm:p-6 flex-1 max-w-[1400px] mx-auto w-full">
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
      <section className="bg-white dark:bg-[#201F1E] border border-[#E1DFDD] dark:border-[#3B3A39] rounded-[8px] p-6 sm:p-8 mb-6 shadow-sm mx-auto w-full">
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
                <div className="space-y-4 text-xs bg-white dark:bg-[#1E1E1E] p-6 rounded-xl border border-[#E1DFDD] dark:border-[#3B3A39] shadow-sm">
                  {/* Header with Title and RegDevKey Quick Button */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0078D4] dark:text-[#479EF5] flex items-center justify-center font-bold">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#242424] dark:text-white flex items-center gap-1.5">
                          <span>Enterprise Workspace Subscription & Dedicated Cloud Perimeter</span>
                        </h3>
                        <p className="text-[11px] text-[#605E5C] dark:text-[#A19F9D]">
                          Dedicated per-company isolated MongoDB database & encrypted AWS S3 document vault
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsRegDevKeyOpen(!isRegDevKeyOpen);
                        setDevKeyError(null);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                      title="Use 16-digit regDevKey from .env to bypass payment for testing"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Use RegDevKey</span>
                    </button>
                  </div>

                  {/* 16-Digit Developer Key Inline Bypass Form */}
                  {isRegDevKeyOpen && (
                    <form
                      onSubmit={handleDevKeyBypass}
                      className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="font-bold text-xs text-purple-900 dark:text-purple-200">
                            Developer Registration Bypass (16-Digit regDevKey)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRegDevKeyOpen(false);
                            setDevKeyError(null);
                          }}
                          className="text-purple-400 hover:text-purple-700 dark:hover:text-purple-200 text-xs"
                        >
                          ✕ Close
                        </button>
                      </div>

                      <p className="text-[11px] text-purple-800 dark:text-purple-300 leading-relaxed">
                        Enter your 16-digit <code>REG_DEV_KEY</code> from <code>.env</code> to bypass Razorpay payment and unlock organization creation directly for local S3 and multi-tenant testing.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          required
                          maxLength={16}
                          minLength={16}
                          placeholder="e.g. 123A 1B2C 3D4E 5F6G"
                          value={regDevKeyInput}
                          onChange={(e) => setRegDevKeyInput(e.target.value.trim())}
                          className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                          type="submit"
                          disabled={isVerifyingDevKey || !regDevKeyInput}
                          className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {isVerifyingDevKey ? "Verifying..." : "Unlock with RegDevKey"}
                        </button>
                      </div>

                      {devKeyError && (
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                          ✕ {devKeyError}
                        </p>
                      )}

                      <div className="pt-1 flex items-center justify-between text-[11px]">
                        <span className="text-purple-700 dark:text-purple-300">
                          Already created a company? Log into its workspace as Developer:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectPersona("superuser");
                            setIsRegDevKeyOpen(false);
                          }}
                          className="text-purple-700 dark:text-purple-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>Log into Company as Dev →</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Payment Currency Selection & Visual Payment Rails */}
                  <div className="bg-[#FAF9F8] dark:bg-[#252423] p-4 rounded-xl border border-[#E1DFDD] dark:border-[#3B3A39] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#242424] dark:text-white">
                            Choose Billing Currency & Payment Rail
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {selectedCurrency === "INR" ? "Domestic Indian Rails Active" : "International Cards Active"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#605E5C] dark:text-[#A19F9D]">
                          Seamless checkout powered by Razorpay. Switch currency to view accepted local payment options.
                        </p>
                      </div>

                      {/* Currency Switch Buttons */}
                      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#1E1E1E] rounded-lg border border-[#E1DFDD] dark:border-[#3B3A39] shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedCurrency("INR")}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${selectedCurrency === "INR"
                            ? "bg-[#0078D4] text-white shadow-xs"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            }`}
                        >
                          <span>🇮🇳 India (INR ₹)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCurrency("USD")}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${selectedCurrency === "USD"
                            ? "bg-[#0078D4] text-white shadow-xs"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            }`}
                        >
                          <span>🇺🇸 US & Global (USD $)</span>
                        </button>
                      </div>
                    </div>

                    {/* Visual Payment Methods Highlight for Indian & US/Global clients */}
                    {selectedCurrency === "INR" ? (
                      <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-1 text-[11px] text-emerald-900 dark:text-emerald-200 font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Accepted Payment Methods in India:
                          </span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                            Instant UPI QR & Real-time Verification
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-2 rounded-md bg-white dark:bg-[#1E1E1E] border border-emerald-200/60 dark:border-emerald-900/40">
                            <div className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <span>📱 UPI Instant</span>
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                              Google Pay, PhonePe, Paytm, BHIM, Scan Any QR
                            </p>
                          </div>
                          <div className="p-2 rounded-md bg-white dark:bg-[#1E1E1E] border border-emerald-200/60 dark:border-emerald-900/40">
                            <div className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <span>🏛️ NetBanking</span>
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                              50+ Banks (HDFC, ICICI, SBI, Axis, Kotak)
                            </p>
                          </div>
                          <div className="p-2 rounded-md bg-white dark:bg-[#1E1E1E] border border-emerald-200/60 dark:border-emerald-900/40">
                            <div className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <span>💳 Cards</span>
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                              RuPay, Visa, MasterCard Credit & Debit
                            </p>
                          </div>
                          <div className="p-2 rounded-md bg-white dark:bg-[#1E1E1E] border border-emerald-200/60 dark:border-emerald-900/40">
                            <div className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <span>👛 Wallets</span>
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                              Amazon Pay, MobiKwik, Freecharge
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-1 text-[11px] text-blue-900 dark:text-blue-200 font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            Accepted US & International Payment Methods:
                          </span>
                          <span className="text-[10px] text-blue-700 dark:text-blue-400">
                            Global Cards with 3D Secure Verification
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="p-2 rounded-md bg-white dark:bg-[#1E1E1E] border border-blue-200/60 dark:border-blue-900/40">
                            <div className="font-bold text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-1">
                              <span>💳 International Cards</span>
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                              Visa, MasterCard, American Express, Discover, Diners
                            </p>
                          </div>
                          <div className="p-2 rounded-md bg-white dark:bg-[#1E1E1E] border border-blue-200/60 dark:border-blue-900/40">
                            <div className="font-bold text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-1">
                              <span>🌐 100+ Countries</span>
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                              Global cross-border payments with automatic currency settlement
                            </p>
                          </div>
                          <div className="p-2 rounded-md bg-white dark:bg-[#1E1E1E] border border-blue-200/60 dark:border-blue-900/40">
                            <div className="font-bold text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-1">
                              <span>🔒 Bank-Grade Security</span>
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                              PCI-DSS Level 1 certified gateway & instant invoice receipt
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Team Seats Selector & Tiered Formula Breakdown */}
                  <div className="bg-[#FAF9F8] dark:bg-[#252423] p-4 rounded-xl border border-[#E1DFDD] dark:border-[#3B3A39] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-xs text-[#242424] dark:text-white block">
                          Workspace Team Seats:
                        </span>
                        <p className="text-[11px] text-[#605E5C] dark:text-[#A19F9D]">
                          Total employee & manager accounts provisioned under this subscription
                        </p>
                      </div>

                      {/* Stepper + Input */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-[#E1DFDD] dark:border-[#3B3A39] rounded-lg bg-white dark:bg-[#1E1E1E] overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() => setSignupUserCount((c) => Math.max(2, c - 1))}
                            disabled={signupUserCount <= 1}
                            className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={2}
                            max={2000}
                            value={signupUserCount}
                            onChange={(e) => setSignupUserCount(Math.max(1, parseInt(e.target.value) || 2))}
                            className="w-16 px-1 py-1 text-center font-mono font-bold text-xs text-[#0078D4] dark:text-[#479EF5] bg-transparent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setSignupUserCount((c) => c + 1)}
                            className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                          {signupUserCount === 1 ? "Seat" : "Seats"}
                        </span>
                      </div>
                    </div>

                    {/* Quick Preset Buttons [2, 4, 5, 10, 20, 50, 100, 500] */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mr-1">
                        Popular Tiers:
                      </span>
                      {[2, 4, 5, 10, 20, 50, 100, 500].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSignupUserCount(preset)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all cursor-pointer ${signupUserCount === preset
                            ? "bg-[#0078D4] text-white border-[#0078D4] shadow-xs"
                            : "bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-gray-400"
                            }`}
                        >
                          {preset} Seats
                        </button>
                      ))}
                    </div>

                    {/* Dynamic Formula Applied & Effective Price Per User Breakdown */}
                    <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-200">
                        <span className="font-semibold text-gray-600 dark:text-gray-400">Formula Applied:</span>
                        <span className="font-bold text-[#0078D4] dark:text-[#479EF5]">
                          {monthlyCalc.tierFormulaLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Effective Cost:</span>
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
                        : "border-[#E1DFDD] dark:border-[#3B3A39] hover:border-gray-400 bg-white dark:bg-[#252423]"
                        }`}
                    >
                      <div>
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
                          {selectedCurrency === "INR"
                            ? `₹${monthlyCalc.totalInr.toLocaleString("en-IN")}`
                            : `$${monthlyCalc.totalUsd}`}{" "}
                          <span className="text-xs font-normal text-gray-500">/ mo</span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
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
                        : "border-[#E1DFDD] dark:border-[#3B3A39] hover:border-gray-400 bg-white dark:bg-[#252423]"
                        }`}
                    >
                      <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#0078D4] text-white shadow-xs">
                        Save 7%
                      </span>
                      <div>
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
                          {selectedCurrency === "INR"
                            ? `₹${quarterlyCalc.totalInr.toLocaleString("en-IN")}`
                            : `$${quarterlyCalc.totalUsd}`}{" "}
                          <span className="text-xs font-normal text-gray-500">/ 3 mo</span>
                        </div>
                        <p className="text-[10px] text-[#0078D4] dark:text-[#479EF5] font-medium mt-0.5">
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
                        : "border-[#E1DFDD] dark:border-[#3B3A39] hover:border-gray-400 bg-white dark:bg-[#252423]"
                        }`}
                    >
                      <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#107C10] text-white shadow-xs">
                        Save 17% (2 Mo Free)
                      </span>
                      <div>
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
                          {selectedCurrency === "INR"
                            ? `₹${annualCalc.totalInr.toLocaleString("en-IN")}`
                            : `$${annualCalc.totalUsd}`}{" "}
                          <span className="text-xs font-normal text-gray-500">/ yr</span>
                        </div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                          2 Months Free! (Pay for 10 months, get 12)
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-200/60 dark:border-zinc-700/60 font-semibold text-[11px] text-emerald-600 dark:text-emerald-400">
                        Total: {selectedCurrency === "INR" ? `₹${annualCalc.totalInr.toLocaleString("en-IN")}` : `$${annualCalc.totalUsd}`} / year
                      </div>
                    </div>
                  </div>

                  {/* Elastic Cloud Storage Callout */}
                  <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                    <span className="text-base shrink-0">📦</span>
                    <div className="leading-relaxed">
                      <span className="font-bold">AWS S3 Cloud Storage Included:</span> Every workspace includes{" "}
                      <strong>2 GB free</strong> encrypted document storage. When storage reaches 2 GB, it auto-expands to 7 GB for{" "}
                      <strong>+$3 USD in your next monthly bill</strong>, scaling elastically in seamless +5 GB increments ($3 USD each) without workflow interruption.
                    </div>
                  </div>

                  {/* Payment Error Inline Banner */}
                  {paymentError && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {/* Direct Pay Action & Security Badges (Unified: Opens Razorpay Directly) */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[#605E5C] dark:text-[#A19F9D] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#107C10]" />
                        <span>Encrypted Razorpay Gateway · Instant Workspace Activation</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegDevKeyOpen(true);
                          setDevKeyError(null);
                        }}
                        className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Use RegDevKey</span>
                      </button>
                    </div>
                    <div className="flex gap-4">
                      <SiRazorpay color="#0B44CD" size={40} />
                      <button
                        type="button"
                        onClick={handleDirectRazorpayCheckout}
                        disabled={isProcessingPayment}
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#0078D4] hover:bg-[#106EBE] disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>
                          {isProcessingPayment
                            ? "Opening Razorpay..."
                            : `Pay with Razorpay (${totalDisplayPrice}) to Unlock`}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4 text-xs max-w-2xl">
                  {/* Verified subscription banner */}
                  <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">✓ Subscription Payment Verified / Dev Mode Active:</div>
                      <div className="text-[11px] mt-0.5">
                        Plan: <span className="font-semibold">{PRICING_PLANS[selectedPlan].name}</span> ·{" "}
                        <span className="font-semibold">{signupUserCount} {signupUserCount === 1 ? "Seat" : "Seats"}</span> ({totalDisplayPrice}) · Receipt ID: <code className="bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded font-mono">{paymentId}</code>.
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
            <div>
              <label className="block font-medium text-[#242424] dark:text-white mb-1">
                {selectedPersona === "superuser"
                  ? "6-Character Target Company ID (to log into as Dev) *"
                  : "6-Digit/Character Company Code *"}
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#8A8886] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={loginCompanyCode}
                  onChange={(e) => setLoginCompanyCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder={selectedPersona === "superuser" ? "e.g. ORGTTU" : "e.g. ACME01"}
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4] font-mono font-bold tracking-wider uppercase"
                />
              </div>
              {selectedPersona === "superuser" ? (
                <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                    Enter the 6-character company code (e.g. ORGTTU, ORGTTV) to connect directly to that company&apos;s isolated MongoDB database and S3 bucket.
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-gray-500 font-medium">Quick Select:</span>
                    {["ORGTTU", "ORGTTV"].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setLoginCompanyCode(code)}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border transition-all cursor-pointer ${loginCompanyCode === code
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                          }`}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-[#8A8886] mt-0.5 block">
                  Your organization&apos;s 6-character code provided by your Owner or Operations Manager.
                </span>
              )}
            </div>

            <div>
              <label className="block font-medium text-[#242424] dark:text-white mb-1">
                {selectedPersona === "employee"
                  ? "Employee Login Email (Provided by Manager) *"
                  : "Developer Login Email *"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8A8886] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={selectedPersona === "superuser" ? "dev.superuser@taskflow.internal" : "user@acme.corp"}
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4]"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#242424] dark:text-white mb-1">
                {selectedPersona === "employee"
                  ? "Initial Password (Provided by Manager) *"
                  : "16-Digit regDevKey / Master Key (from .env) *"}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#8A8886] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={selectedPersona === "superuser" ? "16-digit key (e.g. 8105542318220002)" : "••••••••••••"}
                  className="w-full pl-9 pr-9 py-2 bg-[#FAF9F8] dark:bg-[#1B1A19] border border-[#E1DFDD] dark:border-[#3B3A39] rounded text-[#242424] dark:text-white outline-none focus:border-[#0078D4] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#8A8886]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {selectedPersona === "superuser" && (
                <span className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 block font-mono">
                  Using 16-digit REG_DEV_KEY grants instant superuser access into the specified organization&apos;s perimeter.
                </span>
              )}
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
                  : selectedPersona === "superuser"
                    ? `Sign In to ${loginCompanyCode || "Company"} as Developer`
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
          if (data.userCount) setSignupUserCount(data.userCount);
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
