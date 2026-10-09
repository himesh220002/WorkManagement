"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Check,
  CreditCard,
  Zap,
  Lock,
  Sparkles,
  X,
  AlertCircle,
  Clock,
  ArrowRight,
  Database,
} from "lucide-react";
import { PRICING_PLANS, PlanId, calculateTieredSubscriptionCost } from "@/lib/razorpay";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (paymentData: {
    verificationToken: string;
    paymentId: string;
    plan: PlanId;
    planName: string;
    userCount?: number;
  }) => void;
  defaultPlan?: PlanId;
  defaultCurrency?: "INR" | "USD";
  companyNameHint?: string;
  emailHint?: string;
  title?: string;
  subtitle?: string;
}

export default function RazorpayCheckoutModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  defaultPlan = "monthly",
  defaultCurrency = "INR",
  companyNameHint = "",
  emailHint = "",
  title = "Enterprise Direct Paywall & Subscription",
  subtitle = "Secure checkout via Razorpay · Instant organization workspace provisioning",
}: RazorpayCheckoutModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(defaultPlan);
  const [currency, setCurrency] = useState<"INR" | "USD">(defaultCurrency);
  const [userCount, setUserCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  useEffect(() => {
    setSelectedPlan(defaultPlan);
  }, [defaultPlan]);

  useEffect(() => {
    setCurrency(defaultCurrency);
  }, [defaultCurrency]);

  // Dynamically load Razorpay SDK script
  useEffect(() => {
    if (!isOpen) return;

    if (!document.getElementById("razorpay-sdk")) {
      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPlanDetails = PRICING_PLANS[selectedPlan];
  const tiered = calculateTieredSubscriptionCost(userCount, selectedPlan, currency);
  const monthlyTiered = calculateTieredSubscriptionCost(userCount, "monthly", currency);
  const quarterlyTiered = calculateTieredSubscriptionCost(userCount, "quarterly", currency);
  const annualTiered = calculateTieredSubscriptionCost(userCount, "annual", currency);

  const handleCheckout = async (simulate = false) => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      // 1. Create Order via backend API
      const orderRes = await fetch("/api/payment/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          userCount,
          currency,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to initiate payment order");
      }

      setIsSandboxMode(Boolean(orderData.isSandbox));

      // If user chose simulate or if Razorpay credentials are in test mode and simulate clicked
      if (simulate || (!window.Razorpay && orderData.isSandbox)) {
        await verifyPaymentAndProceed({
          orderId: orderData.orderId,
          paymentId: `pay_sim_${Date.now()}`,
          signature: "simulated_test_signature",
          plan: selectedPlan,
          currency,
        });
        return;
      }

      // If Razorpay SDK is available, trigger official checkout modal
      if (typeof window !== "undefined" && window.Razorpay) {
        const totalDisplayAmount =
          currency === "INR"
            ? `₹${tiered.totalInr.toLocaleString("en-IN")}`
            : `$${tiered.totalUsd}`;

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || currency,
          name: "TaskPMS Enterprise",
          description: `${currentPlanDetails.name} (${totalDisplayAmount})`,
          order_id: orderData.isSandbox ? undefined : orderData.orderId,
          prefill: {
            name: companyNameHint || "Organization Owner",
            email: emailHint || "owner@company.com",
          },
          theme: {
            color: "#0078D4",
          },
          // Explicitly activate all payment channels: UPI, Cards, NetBanking, Wallets, EMI
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
            await verifyPaymentAndProceed({
              orderId: response.razorpay_order_id || orderData.orderId,
              paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              signature: response.razorpay_signature || "signature_ok",
              plan: selectedPlan,
              currency,
            });
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          setErrorMsg(response.error?.description || "Payment failed. Please try again.");
          setIsLoading(false);
        });
        rzp.open();
      } else {
        // Fallback simulation
        await verifyPaymentAndProceed({
          orderId: orderData.orderId,
          paymentId: `pay_test_${Date.now()}`,
          signature: "test_mode_signature",
          plan: selectedPlan,
          currency,
        });
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setErrorMsg(err.message || "An unexpected error occurred during payment.");
      setIsLoading(false);
    }
  };

  const verifyPaymentAndProceed = async (payload: {
    orderId: string;
    paymentId: string;
    signature: string;
    plan: PlanId;
    currency?: string;
  }) => {
    try {
      const verifyRes = await fetch("/api/payment/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          userCount,
          currency: payload.currency || currency,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new Error(verifyData.error || "Payment verification failed");
      }

      setIsLoading(false);

      if (onPaymentSuccess) {
        onPaymentSuccess({
          verificationToken: verifyData.verificationToken,
          paymentId: verifyData.paymentId,
          plan: payload.plan,
          planName: PRICING_PLANS[payload.plan].name,
          userCount,
        });
      } else {
        // Direct redirect to signup with verification token and bill details
        window.location.href = `/auth/login?tab=signup&payment_token=${encodeURIComponent(
          verifyData.verificationToken
        )}&plan=${payload.plan}&seats=${userCount}&currency=${payload.currency || currency}&payment_id=${encodeURIComponent(verifyData.paymentId)}&paid=true`;
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Verification failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E1DFDD] dark:border-[#3B3A39] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#004578] via-[#0078D4] to-[#106EBE] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">{title}</h2>
              <p className="text-xs text-blue-100 font-light">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tiered Pricing Notice */}
          <div className="p-3.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#0078D4] dark:text-[#479EF5] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Transparent Tiered Pricing & Elastic AWS S3 Storage: </span>
              <div>
                <strong>Tier 1 (1–2 seats): {currency === "INR" ? "₹425" : "$5"}/mo flat</strong> · <strong>Tier 2 (3–4 seats): {currency === "INR" ? "₹680" : "$8"}/mo flat</strong> · <strong>5+ seats: {currency === "INR" ? "₹680 + ₹255/seat" : "$8 + $3/seat"}</strong> with <strong>2 GB free included</strong> encrypted AWS S3 document vault.
              </div>
            </div>
          </div>

          {/* Payment Currency Selector (UPI, QR, Cards, NetBanking) */}
          <div className="bg-[#FAF9F8] dark:bg-[#252423] p-4 rounded-xl border border-[#E1DFDD] dark:border-[#3B3A39] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[#242424] dark:text-white">
                  Payment Currency & Methods
                </label>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-semibold">
                  {currency === "INR" ? "All Indian Rails Active" : "International Cards"}
                </span>
              </div>
              <div className="px-3 py-2 bg-gray-200/20 backdrop-blur-sm">
                <p className="text-[11px] text-[#605EFC] dark:text-[#A19F9D]">
                  {currency === "INR"
                    ? "🇮🇳 INR enables all methods: UPI (Google Pay, PhonePe, Paytm, QR), NetBanking (all Indian banks), Wallets, & Cards."
                    : "🇺🇸 USD enables international Credit and Debit Cards (Visa, MasterCard, Amex)."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#1E1E1E] rounded-lg border border-[#E1DFDD] dark:border-[#3B3A39]">
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${currency === "INR"
                  ? "bg-[#0078D4] text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                <span>🇮🇳 INR (₹)</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-normal ${currency === "INR" ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                  }`}>
                  UPI / Cards / NetBanking
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${currency === "USD"
                  ? "bg-[#0078D4] text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                <span>🇺🇸 USD ($)</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-normal ${currency === "USD" ? "bg-white/20 text-white" : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                  }`}>
                  Cards
                </span>
              </button>
            </div>
          </div>

          {/* Seat / User Counter */}
          <div className="bg-[#FAF9F8] dark:bg-[#252423] p-4 rounded-xl border border-[#E1DFDD] dark:border-[#3B3A39] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-[#242424] dark:text-white block">
                  How many team members / seats do you need?
                </label>
                <p className="text-[11px] text-[#605E5C] dark:text-[#A19F9D]">
                  Current formula: <strong className="text-[#0078D4] dark:text-[#479EF5]">{tiered.tierFormulaLabel}</strong> · Effective: <strong className="text-emerald-600 dark:text-emerald-400">{currency === "INR" ? `₹${tiered.effectivePerUserMonthlyInr}` : `$${tiered.effectivePerUserMonthlyUsd}`} / user / mo</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-[#E1DFDD] dark:border-[#3B3A39] rounded-lg bg-white dark:bg-[#1E1E1E] overflow-hidden shadow-xs">
                  <button
                    type="button"
                    onClick={() => setUserCount((c) => Math.max(1, c - 1))}
                    className="px-2.5 py-1 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-[#0078D4] dark:text-[#479EF5] min-w-[50px] text-center font-mono">
                    {userCount} {userCount === 1 ? "seat" : "seats"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUserCount((c) => c + 1)}
                    className="px-2.5 py-1 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Preset Chips [2, 4, 5, 10, 20, 50, 100, 500] */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[2, 4, 5, 10, 20, 50, 100, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setUserCount(preset)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all cursor-pointer ${userCount === preset
                    ? "border-[#0078D4] bg-[#0078D4] text-white shadow-xs"
                    : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:border-gray-400"
                    }`}
                >
                  {preset} Seats
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Plan Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#605E5C] dark:text-[#A19F9D] mb-3">
              Select Your Billing Cadence
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Monthly Plan */}
              <div
                onClick={() => setSelectedPlan("monthly")}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${selectedPlan === "monthly"
                  ? "border-[#0078D4] bg-[#EBF3FC]/50 dark:bg-[#1C2B3D]/50 shadow-sm"
                  : "border-[#E1DFDD] dark:border-[#3B3A39] hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-[#252423]"
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-[#242424] dark:text-white">
                      Monthly Cadence
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === "monthly"
                        ? "border-[#0078D4] bg-[#0078D4]"
                        : "border-gray-400"
                        }`}
                    >
                      {selectedPlan === "monthly" && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                  </div>
                  <div className="mb-1.5">
                    <span className="text-xl font-bold text-[#242424] dark:text-white">
                      {currency === "INR"
                        ? `₹${monthlyTiered.totalInr.toLocaleString("en-IN")}`
                        : `$${monthlyTiered.totalUsd}`}
                    </span>
                    <span className="text-[11px] text-[#605E5C] dark:text-[#A19F9D]">
                      {" "}{currency} / mo
                    </span>
                  </div>
                  <p className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] leading-snug">
                    {currency === "INR" ? `~₹${monthlyTiered.effectivePerUserMonthlyInr}` : `~$${monthlyTiered.effectivePerUserMonthlyUsd}`} / user / mo. Month-to-month flexibility with 2 GB vault included.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 text-[9px] text-gray-500">
                  Renews monthly
                </div>
              </div>

              {/* 3-Month Quarterly Plan */}
              <div
                onClick={() => setSelectedPlan("quarterly")}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${selectedPlan === "quarterly"
                  ? "border-[#0078D4] bg-[#EBF3FC]/50 dark:bg-[#1C2B3D]/50 shadow-sm"
                  : "border-[#E1DFDD] dark:border-[#3B3A39] hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-[#252423]"
                  }`}
              >
                <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#0078D4] text-white shadow-xs">
                  Save 7%
                </span>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-[#242424] dark:text-white">
                      3-Month Cadence
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === "quarterly"
                        ? "border-[#0078D4] bg-[#0078D4]"
                        : "border-gray-400"
                        }`}
                    >
                      {selectedPlan === "quarterly" && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                  </div>
                  <div className="mb-1.5">
                    <span className="text-xl font-bold text-[#242424] dark:text-white">
                      {currency === "INR"
                        ? `₹${quarterlyTiered.totalInr.toLocaleString("en-IN")}`
                        : `$${quarterlyTiered.totalUsd}`}
                    </span>
                    <span className="text-[11px] text-[#605E5C] dark:text-[#A19F9D]">
                      {" "}{currency} / 3 mo
                    </span>
                  </div>
                  <p className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] leading-snug">
                    {currency === "INR" ? `~₹${(quarterlyTiered.totalInr / userCount / 3).toFixed(0)}` : `~$${(quarterlyTiered.totalUsd / userCount / 3).toFixed(2)}`}/user/mo. 3-month runway with 2 GB vault included.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 text-[9px] text-[#0078D4] dark:text-[#479EF5] font-semibold">
                  Save 7% vs monthly
                </div>
              </div>

              {/* Annual Plan */}
              <div
                onClick={() => setSelectedPlan("annual")}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${selectedPlan === "annual"
                  ? "border-[#0078D4] bg-[#EBF3FC]/50 dark:bg-[#1C2B3D]/50 shadow-sm"
                  : "border-[#E1DFDD] dark:border-[#3B3A39] hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-[#252423]"
                  }`}
              >
                <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#107C10] text-white shadow-xs">
                  Save 17% (2 Mo Free)
                </span>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-[#242424] dark:text-white">
                      Annual (1 Year)
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === "annual"
                        ? "border-[#0078D4] bg-[#0078D4]"
                        : "border-gray-400"
                        }`}
                    >
                      {selectedPlan === "annual" && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                  </div>
                  <div className="mb-1.5">
                    <span className="text-xl font-bold text-[#242424] dark:text-white">
                      {currency === "INR"
                        ? `₹${annualTiered.totalInr.toLocaleString("en-IN")}`
                        : `$${annualTiered.totalUsd}`}
                    </span>
                    <span className="text-[11px] text-[#605E5C] dark:text-[#A19F9D]">
                      {" "}{currency} / yr
                    </span>
                  </div>
                  <p className="text-[10px] text-[#605E5C] dark:text-[#C8C6C4] leading-snug">
                    {currency === "INR" ? `~₹${(annualTiered.totalInr / userCount / 12).toFixed(0)}` : `~$${(annualTiered.totalUsd / userCount / 12).toFixed(2)}`}/user/mo. Pay 10 months, get 12 months!
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  2 Months Free Included
                </div>
              </div>
            </div>
          </div>

          {/* Plan Features Checklist */}
          <div className="bg-[#FAF9F8] dark:bg-[#252423] p-4 rounded-xl border border-[#E1DFDD] dark:border-[#3B3A39]">
            <span className="text-xs font-bold text-[#242424] dark:text-white block mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>Included in {currentPlanDetails.name} ({userCount} Seats)</span>
            </span>
            <ul className="space-y-2 text-xs text-[#484644] dark:text-[#C8C6C4]">
              {currentPlanDetails.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#107C10] shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-gray-50 dark:bg-[#181818] border-t border-[#E1DFDD] dark:border-[#3B3A39] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#605E5C] dark:text-[#A19F9D] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#107C10]" />
            <span>Encrypted 256-bit Razorpay processing · Instant Activation</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E1DFDD] dark:border-[#3B3A39] text-[#605E5C] dark:text-[#C8C6C4] hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleCheckout(false)}
              disabled={isLoading}
              className="flex-1 sm:flex-none px-5 py-2 bg-[#0078D4] hover:bg-[#106EBE] active:scale-98 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isLoading
                  ? "Contacting Razorpay..."
                  : currency === "INR"
                    ? `Pay ₹${tiered.totalInr.toLocaleString("en-IN")} & Unlock Workspace`
                    : `Pay $${tiered.totalUsd} & Unlock Workspace`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
