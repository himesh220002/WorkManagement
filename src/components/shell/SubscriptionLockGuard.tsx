"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, CreditCard, LogOut, Clock, Users } from "lucide-react";
import RazorpayCheckoutModal from "@/components/payment/RazorpayCheckoutModal";
import { PlanId } from "@/lib/razorpay";

interface LockSubscription {
  planId: PlanId;
  planName: string;
  currentPeriodEnd: string;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  totalSeats?: number;
  filledSeats?: number;
}

const PUBLIC_PREFIXES = ["/auth", "/subscription/renew"];
const PUBLIC_EXACT = new Set(["/", "/about", "/privacy", "/terms", "/contact", "/404", "/500", "/not-found"]);

/**
 * Hard enforcement for expired workspaces: blocks interaction with a
 * non-dismissible full-screen overlay (owner gets 1-click renew with
 * adjustable seats, others are told to contact the owner).
 * Supplements SubscriptionBanner so an expired "on hold" account can never
 * silently keep working inside the app.
 */
export function SubscriptionLockGuard() {
  const pathname = usePathname() || "";
  const [subscription, setSubscription] = useState<LockSubscription | null>(null);
  const [userRole, setUserRole] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [maintenanceOverride, setMaintenanceOverride] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.authenticated && data.company?.subscription?.isExpired) {
          setSubscription(data.company.subscription);
          setUserRole((data.user?.role || "").toLowerCase());
          setCompanyCode(data.company.code || "");
          setCompanyName(data.company.name || "");
        } else {
          setSubscription(null);
        }
      } catch {
        // fail-open for network errors; banner + login still enforce
      }
    }
    check();
    const id = setInterval(check, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pathname]);

  useEffect(() => {
    setMaintenanceOverride(false);
  }, [companyCode]);

  if (!subscription || maintenanceOverride) return null;

  // Never block public / auth / dedicated renew surfaces themselves.
  if (PUBLIC_EXACT.has(pathname)) return null;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  // Tenant login portal: /:org/auth/login
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length >= 3 && segs[1] === "auth" && segs[2] === "login") return null;

  const isOwner = ["owner", "superuser"].includes(userRole);
  const totalSeats = Math.max(1, subscription.totalSeats ?? 1);
  const filledSeats = Math.max(0, subscription.filledSeats ?? 0);
  const daysOverdue = Math.max(0, Math.abs(subscription.daysRemaining ?? 0));
  const endedOn = (() => {
    try {
      return new Date(subscription.currentPeriodEnd).toLocaleDateString();
    } catch {
      return "";
    }
  })();

  const handleRenewSuccess = async (paymentData: {
    verificationToken: string;
    paymentId: string;
    plan: PlanId;
    planName: string;
    userCount?: number;
  }) => {
    const res = await fetch("/api/subscription/renew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentToken: paymentData.verificationToken,
        plan: paymentData.plan,
        companyCode,
        paymentId: paymentData.paymentId,
        newSeatCount: paymentData.userCount,
        userCount: paymentData.userCount,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.success) {
      setIsRenewOpen(false);
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/auth/login";
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-lg bg-white dark:bg-[#1E1E1E] rounded-xl border border-red-300 dark:border-red-800 shadow-2xl p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#242424] dark:text-white">
            Workspace On Hold — Subscription Expired
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {companyName ? `${companyName} (${companyCode})` : companyCode} · ended {endedOn}
            {daysOverdue > 0 ? ` · ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue` : ""}
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Access frozen for all members
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {totalSeats} seats · {filledSeats} filled
            </span>
          </div>

          {isOwner ? (
            <>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-3">
                Renew now to instantly reactivate everyone for +30 days. You can reduce or add seats inside
                checkout before paying — the price updates live.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row items-stretch justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRenewOpen(true)}
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Renew &amp; Reactivate (+30 Days)</span>
                </button>
                <Link
                  href="/subscription/renew"
                  className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  Open Repay Portal
                </Link>
              </div>
              {userRole === "superuser" && (
                <button
                  type="button"
                  onClick={() => setMaintenanceOverride(true)}
                  className="mt-3 text-[11px] underline text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                >
                  Continue in read-only maintenance (developer only)
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-3">
                Your organization&apos;s plan has expired, so the workspace is on hold. Please ask your
                Organization Owner to renew via Razorpay to restore access.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row items-stretch justify-center gap-2">
                <Link
                  href="/subscription/renew"
                  className="px-5 py-2.5 rounded-lg bg-[#0078D4] hover:bg-[#106EBE] text-white font-bold text-xs flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Open Repay Portal</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isOwner && (
        <RazorpayCheckoutModal
          isOpen={isRenewOpen}
          onClose={() => setIsRenewOpen(false)}
          defaultPlan={subscription.planId}
          companyNameHint={companyName || companyCode}
          title={`Reactivate ${companyName || companyCode} — Expired`}
          subtitle={`Workspace is on hold since ${endedOn}. Adjust seats at checkout (${totalSeats} current, ${filledSeats} filled) then pay to unfreeze.`}
          initialUserCount={totalSeats}
          minSeats={Math.max(1, filledSeats)}
          onPaymentSuccess={handleRenewSuccess}
        />
      )}
    </>
  );
}
