"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Clock, CreditCard, Sparkles, X, ShieldAlert } from "lucide-react";
import RazorpayCheckoutModal from "@/components/payment/RazorpayCheckoutModal";
import { PlanId } from "@/lib/razorpay";

interface SubscriptionData {
  planId: PlanId;
  planName: string;
  status: "active" | "expiring_soon" | "expired" | "past_due";
  daysRemaining: number;
  currentPeriodEnd: string;
  isExpiringSoon: boolean;
  isExpired: boolean;
  warningMessage?: string;
}

export function SubscriptionBanner() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [companyCode, setCompanyCode] = useState<string>("");
  const [dismissed, setDismissed] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewSuccessMsg, setRenewSuccessMsg] = useState("");

  useEffect(() => {
    async function checkSubscription() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.company?.subscription) {
            setSubscription(data.company.subscription);
            setUserRole((data.user?.role || "").toLowerCase());
            setCompanyCode(data.company.code || "");
          }
        }
      } catch (err) {
        console.warn("Could not check subscription status:", err);
      }
    }
    checkSubscription();
  }, []);

  if (!subscription || dismissed) return null;

  const isOwner = ["owner", "superuser"].includes(userRole);
  const isExpiringSoon = subscription.isExpiringSoon;
  const isExpired = subscription.isExpired;

  // Only show if subscription is expiring soon or expired
  if (!isExpiringSoon && !isExpired && !renewSuccessMsg) return null;

  const handleRenewSuccess = async (paymentData: {
    verificationToken: string;
    paymentId: string;
    plan: PlanId;
    planName: string;
  }) => {
    try {
      const res = await fetch("/api/subscription/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentToken: paymentData.verificationToken,
          plan: paymentData.plan,
          companyCode,
          paymentId: paymentData.paymentId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsRenewModalOpen(false);
        setRenewSuccessMsg(`Workspace subscription renewed successfully with ${paymentData.planName}!`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (e) {
      console.error("Renewal processing error:", e);
    }
  };

  if (renewSuccessMsg) {
    return (
      <div className="w-full bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between shadow-sm animate-in fade-in">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>✓ {renewSuccessMsg}</span>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <>
        <div className="w-full bg-red-600 dark:bg-red-700 text-white text-xs px-4 py-2.5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 z-40">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-200" />
            <span className="font-semibold">
              Organization Subscription Expired: Workspace access is currently on hold.
            </span>
            <span className="hidden md:inline text-red-100 text-[11px]">
              Ended on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOwner ? (
              <button
                type="button"
                onClick={() => setIsRenewModalOpen(true)}
                className="px-3 py-1 rounded bg-white text-red-700 hover:bg-red-50 font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Renew Subscription via Razorpay</span>
              </button>
            ) : (
              <span className="text-[11px] bg-red-800/80 px-2 py-0.5 rounded text-red-200">
                Contact Organization Founder / Owner to Renew
              </span>
            )}
          </div>
        </div>

        <RazorpayCheckoutModal
          isOpen={isRenewModalOpen}
          onClose={() => setIsRenewModalOpen(false)}
          defaultPlan={subscription.planId}
          companyNameHint={companyCode}
          title="Renew Organization Subscription"
          subtitle="Instant workspace unfreeze & active period extension via Razorpay"
          onPaymentSuccess={handleRenewSuccess}
        />
      </>
    );
  }

  // Expiring soon warning: (3 days for monthly, 7 days for quarterly, 15 days for year)
  return (
    <>
      <div className="w-full bg-amber-500 text-zinc-950 dark:bg-amber-600 dark:text-white text-xs px-4 py-2 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 z-40">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-950 dark:text-amber-200" />
          <span className="font-bold">
            Continuous Subscription Reminder:
          </span>
          <span className="text-xs">
            Your {subscription.planName} ends in{" "}
            <strong>
              {subscription.daysRemaining} day{subscription.daysRemaining === 1 ? "" : "s"}
            </strong>{" "}
            ({new Date(subscription.currentPeriodEnd).toLocaleDateString()}).
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOwner ? (
            <button
              type="button"
              onClick={() => setIsRenewModalOpen(true)}
              className="px-3 py-1 rounded bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 font-bold text-xs shadow-xs transition-opacity cursor-pointer flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Renew Early</span>
            </button>
          ) : (
            <span className="text-[11px] opacity-80">
              Auto-renewal managed by Organization Owner
            </span>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="p-1 hover:bg-black/10 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <RazorpayCheckoutModal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        defaultPlan={subscription.planId}
        companyNameHint={companyCode}
        title="Renew Organization Subscription"
        subtitle="Extend your active workspace period with seamless Razorpay checkout"
        onPaymentSuccess={handleRenewSuccess}
      />
    </>
  );
}
