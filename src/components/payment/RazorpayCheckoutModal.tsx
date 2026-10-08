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
import { PRICING_PLANS } from "@/lib/razorpay";

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
    plan: "monthly" | "annual";
    planName: string;
  }) => void;
  defaultPlan?: "monthly" | "annual";
  companyNameHint?: string;
  emailHint?: string;
}

export default function RazorpayCheckoutModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  defaultPlan = "monthly",
  companyNameHint = "",
  emailHint = "",
}: RazorpayCheckoutModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">(defaultPlan);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  useEffect(() => {
    setSelectedPlan(defaultPlan);
  }, [defaultPlan]);

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
          currency: "USD",
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
        });
        return;
      }

      // If Razorpay SDK is available, trigger official checkout modal
      if (typeof window !== "undefined" && window.Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || "USD",
          name: "TaskPMS Enterprise",
          description: `${currentPlanDetails.name} Subscription ($${currentPlanDetails.usdAmount}/${currentPlanDetails.billingCycle})`,
          order_id: orderData.isSandbox ? undefined : orderData.orderId,
          prefill: {
            name: companyNameHint || "Organization Owner",
            email: emailHint || "owner@company.com",
          },
          theme: {
            color: "#0078D4",
          },
          handler: async (response: any) => {
            await verifyPaymentAndProceed({
              orderId: response.razorpay_order_id || orderData.orderId,
              paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              signature: response.razorpay_signature || "signature_ok",
              plan: selectedPlan,
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
    plan: "monthly" | "annual";
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

      setIsLoading(false);

      if (onPaymentSuccess) {
        onPaymentSuccess({
          verificationToken: verifyData.verificationToken,
          paymentId: verifyData.paymentId,
          plan: payload.plan,
          planName: PRICING_PLANS[payload.plan].name,
        });
      } else {
        // Direct redirect to signup with verification token
        window.location.href = `/auth/login?tab=signup&payment_token=${encodeURIComponent(
          verifyData.verificationToken
        )}&plan=${payload.plan}&paid=true`;
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Verification failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E1DFDD] dark:border-[#3B3A39] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#004578] via-[#0078D4] to-[#106EBE] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Enterprise Direct Paywall & Subscription
              </h2>
              <p className="text-xs text-blue-100 font-light">
                Secure checkout via Razorpay · Instant organization workspace provisioning
              </p>
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

          {/* Strict Paywall Notice */}
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Strict Paywall Active: </span>
              Free trial has been retired. New organizations require an active subscription
              ($20/month or $200/year) to unlock dedicated multi-tenant databases and team workspaces.
            </div>
          </div>

          {/* Pricing Plan Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#605E5C] dark:text-[#A19F9D] mb-3">
              Select Your Subscription Plan
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Monthly Plan */}
              <div
                onClick={() => setSelectedPlan("monthly")}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                  selectedPlan === "monthly"
                    ? "border-[#0078D4] bg-[#EBF3FC]/50 dark:bg-[#1C2B3D]/50 shadow-sm"
                    : "border-[#E1DFDD] dark:border-[#3B3A39] hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-[#252423]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#242424] dark:text-white">
                      {PRICING_PLANS.monthly.name}
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedPlan === "monthly"
                          ? "border-[#0078D4] bg-[#0078D4]"
                          : "border-gray-400"
                      }`}
                    >
                      {selectedPlan === "monthly" && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="text-2xl font-bold text-[#242424] dark:text-white">$20</span>
                    <span className="text-xs text-[#605E5C] dark:text-[#A19F9D]"> USD / month</span>
                  </div>
                  <p className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4]">
                    {PRICING_PLANS.monthly.description}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-500">
                  Renews monthly · Cancel anytime
                </div>
              </div>

              {/* Annual Plan */}
              <div
                onClick={() => setSelectedPlan("annual")}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                  selectedPlan === "annual"
                    ? "border-[#0078D4] bg-[#EBF3FC]/50 dark:bg-[#1C2B3D]/50 shadow-sm"
                    : "border-[#E1DFDD] dark:border-[#3B3A39] hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-[#252423]"
                }`}
              >
                {PRICING_PLANS.annual.discountBadge && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#107C10] text-white shadow-xs">
                    {PRICING_PLANS.annual.discountBadge}
                  </span>
                )}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#242424] dark:text-white">
                      {PRICING_PLANS.annual.name}
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedPlan === "annual"
                          ? "border-[#0078D4] bg-[#0078D4]"
                          : "border-gray-400"
                      }`}
                    >
                      {selectedPlan === "annual" && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="text-2xl font-bold text-[#242424] dark:text-white">$200</span>
                    <span className="text-xs text-[#605E5C] dark:text-[#A19F9D]"> USD / year</span>
                  </div>
                  <p className="text-[11px] text-[#605E5C] dark:text-[#C8C6C4]">
                    {PRICING_PLANS.annual.description}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Save $40 compared to monthly billing
                </div>
              </div>
            </div>
          </div>

          {/* Plan Features Checklist */}
          <div className="bg-[#FAF9F8] dark:bg-[#252423] p-4 rounded-xl border border-[#E1DFDD] dark:border-[#3B3A39]">
            <span className="text-xs font-bold text-[#242424] dark:text-white block mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>Included in {currentPlanDetails.name}</span>
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
            <span>Encrypted 256-bit Razorpay processing</span>
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
                  : `Pay $${currentPlanDetails.usdAmount} & Unlock Workspace`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
