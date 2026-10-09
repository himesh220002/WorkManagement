"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Building2,
  Mail,
  Lock,
  Calendar,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  History,
  RefreshCw,
  Crown,
  HeartHandshake,
  Zap,
  CloudBackup,
} from "lucide-react";
import RazorpayCheckoutModal from "@/components/payment/RazorpayCheckoutModal";
import { calculateTieredSubscriptionCost, type PlanId } from "@/lib/razorpay";
import { GiAerialSignal } from "react-icons/gi";

// Renewal tenure options: monthly (+30 days), quarterly (+90 days, save 7%),
// annual (+12 months, save 17% — pay for 10, get 12).
const TENURE_META: Record<
  PlanId,
  { label: string; duration: string; extension: string; badge?: string }
> = {
  monthly: { label: "Monthly", duration: "30 Days", extension: "+30 Days" },
  quarterly: { label: "3-Month", duration: "3 Months", extension: "+90 Days", badge: "Save 7%" },
  annual: { label: "Annual", duration: "12 Months", extension: "+12 Months", badge: "Save 17%" },
};

function normalizePlanId(raw: unknown): PlanId {
  const p = String(raw || "monthly").toLowerCase();
  return p === "annual" ? "annual" : p === "quarterly" ? "quarterly" : "monthly";
}

interface RepayServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCompanyCode?: string;
  initialEmail?: string;
  onRenewalSuccess?: (companyCode: string) => void;
}

interface LookupData {
  company: {
    id: string;
    name: string;
    code: string;
  };
  subscription: {
    status: string;
    planId: string;
    currentPeriodEnd: string;
    formattedPeriodEnd: string;
    daysRemaining: number;
    daysExpired: number;
    isExpired: boolean;
    totalSeats: number;
    filledSeats: number;
    availableSeats: number;
    tierFormulaLabel: string;
    renewalCostUSD: number;
    renewalCostINR: number;
  };
  paymentHistory: Array<{
    id: string;
    date: string;
    amountUsd: number;
    amountInr: number;
    seats: number;
    plan: string;
    status: string;
  }>;
}

export default function RepayServiceModal({
  isOpen,
  onClose,
  initialCompanyCode = "",
  initialEmail = "",
  onRenewalSuccess,
}: RepayServiceModalProps) {
  const [companyCode, setCompanyCode] = useState(initialCompanyCode);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupData, setLookupData] = useState<LookupData | null>(null);

  // Razorpay Checkout State for Renewal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewSuccessMsg, setRenewSuccessMsg] = useState<string | null>(null);

  // Adjustable seat count for renewal (reduce or add seats before paying).
  // Defaults to currently purchased seats once lookup resolves.
  const [desiredSeats, setDesiredSeats] = useState<number | null>(null);

  // Renewal tenure: monthly (+30d) / quarterly (+90d) / annual (+12mo).
  // Defaults to the organization's current billing cadence.
  const [selectedTenure, setSelectedTenure] = useState<PlanId>("monthly");

  useEffect(() => {
    if (initialCompanyCode) setCompanyCode(initialCompanyCode);
    if (initialEmail) setEmail(initialEmail);
  }, [initialCompanyCode, initialEmail]);

  useEffect(() => {
    if (lookupData) {
      setDesiredSeats(lookupData.subscription.totalSeats);
      setSelectedTenure(normalizePlanId(lookupData.subscription.planId));
    } else {
      setDesiredSeats(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupData?.company.code]);

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRenewSuccessMsg(null);

    try {
      const res = await fetch("/api/subscription/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyCode: companyCode.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to lookup organization subscription.");
      }

      setLookupData(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during lookup");
    } finally {
      setLoading(false);
    }
  };

  const handleRenewalPaymentSuccess = async (paymentData: {
    verificationToken: string;
    paymentId: string;
    plan: any;
    userCount?: number;
  }) => {
    setIsCheckoutOpen(false);
    setIsRenewing(true);
    setError(null);

    try {
      // Prefer the seat count actually paid for in checkout; fall back to the
      // stepper value chosen in this portal.
      const seatsPaidFor =
        paymentData.userCount && paymentData.userCount > 0
          ? Math.floor(paymentData.userCount)
          : desiredSeats && desiredSeats > 0
            ? Math.floor(desiredSeats)
            : lookupData?.subscription.totalSeats;
      // Honor the tenure actually paid for (checkout lets the payer switch
      // monthly / 3-month / annual); fall back to the portal selection.
      const planPaidFor = normalizePlanId((paymentData as any).plan || selectedTenure);
      const res = await fetch("/api/subscription/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyCode: lookupData?.company.code || companyCode,
          paymentToken: paymentData.verificationToken,
          paymentId: paymentData.paymentId,
          plan: planPaidFor,
          newSeatCount: seatsPaidFor,
          userCount: seatsPaidFor,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to renew subscription.");
      }

      setSelectedTenure(planPaidFor);
      setRenewSuccessMsg(
        `Subscription successfully extended by ${TENURE_META[planPaidFor].duration}! Your workspace access is now fully active.`
      );

      // Re-lookup to refresh metrics
      const refreshRes = await fetch("/api/subscription/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyCode: companyCode.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });
      const refreshData = await refreshRes.json();
      if (refreshData.success) {
        setLookupData(refreshData);
      }

      if (onRenewalSuccess) {
        onRenewalSuccess(lookupData?.company.code || companyCode);
      }
    } catch (err: any) {
      setError(err.message || "Payment verified but renewing organization plan failed.");
    } finally {
      setIsRenewing(false);
    }
  };

  // Derived renewal pricing for the adjustable seat count + tenure. Falls back
  // to the looked-up quota until the user picks new values.
  const currentTotalSeats = lookupData?.subscription.totalSeats ?? 2;
  const filledSeats = lookupData?.subscription.filledSeats ?? 0;
  const minRenewalSeats = Math.max(1, filledSeats);
  const activeSeats =
    desiredSeats && desiredSeats > 0 ? Math.floor(desiredSeats) : currentTotalSeats;
  const monthlyPricing = calculateTieredSubscriptionCost(activeSeats, "monthly", "INR");
  const quarterlyPricing = calculateTieredSubscriptionCost(activeSeats, "quarterly", "INR");
  const annualPricing = calculateTieredSubscriptionCost(activeSeats, "annual", "INR");
  const tenurePricing: Record<PlanId, typeof monthlyPricing> = {
    monthly: monthlyPricing,
    quarterly: quarterlyPricing,
    annual: annualPricing,
  };
  const seatPricing = tenurePricing[selectedTenure];
  const basePricing = lookupData
    ? calculateTieredSubscriptionCost(currentTotalSeats, selectedTenure, "INR")
    : seatPricing;
  const seatDelta = activeSeats - currentTotalSeats;
  const isSeatSelectionInvalid = activeSeats < minRenewalSeats;
  const tenureMeta = TENURE_META[selectedTenure];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#18181B] border border-gray-200/80 dark:border-zinc-800 rounded-[4px] shadow-2xl shadow-black/30 max-w-4xl w-full p-4 sm:p-6 md:p-7 text-[#242424] dark:text-white my-6 max-h-[92vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 sm:pb-5 border-b border-gray-100 dark:border-zinc-800/80 gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-blue-500/15 dark:from-emerald-500/20 dark:to-blue-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
              <CreditCard className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="min-w-0">

              <h2 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                Repay Service &amp; Subscription Portal
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Lookup remaining validity, seat quota, past plans, or pay prior to extend workspace access.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close modal"
            className="p-1.5 sm:p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800/80 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {renewSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{renewSuccessMsg}</span>
          </div>
        )}

        {/* Step 1: Lookup Form */}
        {!lookupData ? (
          <form onSubmit={handleLookup} className="mt-5 space-y-4 text-xs">
            {/* VIP Welcome Notice */}
            <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-emerald-500/10 p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/60 text-blue-950 dark:text-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-xs text-blue-900 dark:text-blue-100">
                  Valued Partner Self-Service Gateway
                </span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-blue-800/90 dark:text-blue-300/90">
                Welcome back! Enter your organization credentials to immediately reveal your remaining days, configure seat tiers, and reactivate priority workspace access.
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                6-Character Company ID (Org Code) *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="e.g. ORGTTU"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold tracking-wider uppercase outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                Organization / Owner Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. owner@organization.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                Account Password (or Master Dev Key) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0078D4] hover:bg-[#106EBE] active:scale-[0.99] disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>{loading ? "Verifying Credentials & Fetching Quota..." : "Lookup Subscription & Reveal Remaining Days"}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </form>
        ) : (
          /* Step 2: Telemetry & Renewal Dashboard */
          <div className="mt-5 space-y-4 sm:space-y-5 text-xs">
            {/* VIP High-Priority Client Care Appreciation Banner */}
            <div className="relative overflow-hidden rounded-xl border border-amber-500/35 dark:border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/5 to-emerald-500/10 p-3.5 sm:p-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Crown className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                      Welcome Back · Valued Enterprise Partner
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 flex items-center gap-1">
                      <HeartHandshake className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <p className="text-[11.5px] text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    We sincerely appreciate you returning for our service! Your complete organization perimeter — projects, squads, sales targets, and S3 vaults — is safely preserved and ready for immediate continuity.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-amber-500/20 text-[10.5px] text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Instant 1-Click Reactivation</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Zero Data Loss · 100% Intact</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CloudBackup className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Dedicated Cloud SLA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Organization Info Banner */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-gray-50/80 dark:bg-zinc-800/50 border border-gray-200/80 dark:border-zinc-700/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-[#242424] dark:text-white">
                    {lookupData.company.name}
                  </span>
                  <code className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200">
                    {lookupData.company.code}
                  </code>

                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                  Registered Account: <strong className="text-gray-700 dark:text-gray-300">{email}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${lookupData.subscription.isExpired
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    }`}
                >
                  {lookupData.subscription.isExpired ? "Access On Hold" : "Active Plan"}
                </div>
                <button
                  type="button"
                  onClick={() => setLookupData(null)}
                  className="text-[11px] text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline cursor-pointer"
                >
                  Change Account
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Remaining Days */}
              <div
                className={`p-3 sm:p-3.5 rounded-xl border flex flex-col justify-between ${lookupData.subscription.isExpired
                  ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900"
                  : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"
                  }`}
              >
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Remaining</span>
                </div>
                <div
                  className={`text-xl font-bold mt-1.5 ${lookupData.subscription.isExpired
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                    }`}
                >
                  {lookupData.subscription.isExpired
                    ? `-${lookupData.subscription.daysExpired} Days`
                    : `${lookupData.subscription.daysRemaining} Days`}
                </div>
                <span className="text-[10px] text-gray-500 mt-1">
                  {lookupData.subscription.isExpired ? "Expired prior" : "Left in cycle"}
                </span>
              </div>

              {/* Expiration Date */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Expiration</span>
                </div>
                <div className="text-sm font-bold mt-1.5 text-[#242424] dark:text-white">
                  {lookupData.subscription.formattedPeriodEnd}
                </div>
                <span className="text-[10px] text-gray-500 mt-1">Period end</span>
              </div>

              {/* Total Seats */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Users</span>
                </div>
                <div className="text-xl font-bold mt-1.5 text-[#0078D4] dark:text-[#479EF5]">
                  {lookupData.subscription.totalSeats} Seats
                </div>
                <span className="text-[10px] text-gray-500 mt-1">
                  {lookupData.subscription.filledSeats} filled · {lookupData.subscription.availableSeats} open
                </span>
              </div>

              {/* Renewal Cost */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <GiAerialSignal className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    {tenureMeta.label}
                  </span>
                </div>
                <div className="text-xl font-bold mt-1.5 text-blue-700 dark:text-blue-300">
                  ₹{seatPricing.totalInr.toLocaleString("en-IN")}
                </div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                  (${seatPricing.totalUsd} USD · {activeSeats} seats)
                </span>
              </div>
            </div>

            {/* Adjust Seats Before Renewal */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-gray-50/80 dark:bg-zinc-800/50 border border-gray-200/80 dark:border-zinc-700/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs text-[#242424] dark:text-white flex items-center gap-1.5 flex-wrap">
                    <Users className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>Adjust Seats Before Renewal</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                      Reduce or add seats
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    {filledSeats} filled · minimum {minRenewalSeats} seats (cannot go below occupied seats).{" "}
                    {seatDelta === 0
                      ? `Renewing same ${currentTotalSeats}-seat quota.`
                      : seatDelta > 0
                        ? `Adding ${seatDelta} seat${seatDelta > 1 ? "s" : ""} to ${currentTotalSeats} → ${activeSeats}.`
                        : `Reducing ${Math.abs(seatDelta)} seat${Math.abs(seatDelta) > 1 ? "s" : ""}: ${currentTotalSeats} → ${activeSeats}.`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setDesiredSeats(Math.max(minRenewalSeats, activeSeats - 1))}
                    disabled={activeSeats <= minRenewalSeats}
                    className="w-8 h-8 rounded-lg border border-gray-300 dark:border-zinc-600 font-bold text-sm hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-40 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={minRenewalSeats}
                    max={500}
                    value={activeSeats}
                    onChange={(e) => {
                      const v = Math.floor(Number(e.target.value) || minRenewalSeats);
                      setDesiredSeats(Math.min(500, Math.max(minRenewalSeats, v)));
                    }}
                    className="w-16 text-center font-bold text-sm px-2 py-1.5 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-lg outline-none focus:border-[#0078D4]"
                  />
                  <button
                    type="button"
                    onClick={() => setDesiredSeats(Math.min(500, activeSeats + 1))}
                    className="w-8 h-8 rounded-lg border border-gray-300 dark:border-zinc-600 font-bold text-sm hover:bg-gray-200 dark:hover:bg-zinc-700 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    +
                  </button>
                  <span className="text-xs text-gray-500 font-medium">Seats</span>
                </div>
              </div>

              {/* Quick tier buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-gray-500 mr-1">Quick tiers:</span>
                {[2, 4, 5, 10, 20, 33, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={num < minRenewalSeats}
                    onClick={() => setDesiredSeats(num)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer disabled:opacity-40 ${activeSeats === num
                      ? "bg-[#0078D4] text-white border-[#0078D4] shadow-xs"
                      : "bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700"
                      }`}
                  >
                    {num} Seats
                  </button>
                ))}
                {currentTotalSeats !== 2 &&
                  currentTotalSeats !== 4 &&
                  currentTotalSeats !== 5 &&
                  currentTotalSeats !== 10 &&
                  currentTotalSeats !== 20 &&
                  currentTotalSeats !== 33 &&
                  currentTotalSeats !== 50 &&
                  currentTotalSeats !== 100 && (
                    <button
                      type="button"
                      onClick={() => setDesiredSeats(currentTotalSeats)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${activeSeats === currentTotalSeats
                        ? "bg-[#0078D4] text-white border-[#0078D4] shadow-xs"
                        : "bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700"
                        }`}
                    >
                      Current ({currentTotalSeats})
                    </button>
                  )}
              </div>

              <div className="pt-2.5 border-t border-gray-200/80 dark:border-zinc-700 flex items-center justify-between text-[11px] flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">Formula:</span>
                  <strong className="text-[#0078D4] dark:text-[#479EF5]">{seatPricing.tierFormulaLabel}</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">New total:</span>
                  <strong className="text-[#242424] dark:text-white">
                    ₹{seatPricing.totalInr.toLocaleString("en-IN")} (${seatPricing.totalUsd})
                  </strong>
                  {seatDelta !== 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${seatPricing.totalInr < basePricing.totalInr
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                    >
                      {seatPricing.totalInr < basePricing.totalInr ? "Saving " : "Extra "}
                      ₹{Math.abs(seatPricing.totalInr - basePricing.totalInr).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              {isSeatSelectionInvalid && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                  Cannot renew with {activeSeats} seats — {filledSeats} seats are already occupied. Increase to at
                  least {minRenewalSeats}.
                </p>
              )}
            </div>

            {/* Select Renewal Tenure: Monthly / 3-Month / Annual */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-gray-50/80 dark:bg-zinc-800/50 border border-gray-200/80 dark:border-zinc-700/70 space-y-3">
              <div>
                <h4 className="font-bold text-xs text-[#242424] dark:text-white flex items-center gap-1.5 flex-wrap">
                  <Calendar className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span>Select Renewal Tenure</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {tenureMeta.extension}
                  </span>
                </h4>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(Object.keys(TENURE_META) as PlanId[]).map((tid) => {
                  const calc = tenurePricing[tid];
                  const meta = TENURE_META[tid];
                  const isSelected = selectedTenure === tid;
                  return (
                    <button
                      key={tid}
                      type="button"
                      onClick={() => setSelectedTenure(tid)}
                      className={`p-3 sm:p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${isSelected
                        ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-sm"
                        : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 hover:border-gray-400 dark:hover:border-zinc-500"
                        }`}
                    >
                      {meta.badge && (
                        <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#0078D4] text-white shadow-xs">
                          {meta.badge}
                        </span>
                      )}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-[#242424] dark:text-white">
                          {meta.label}
                        </span>
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-emerald-600 bg-emerald-600" : "border-gray-400"
                            }`}
                        >
                          {isSelected && (
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          )}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-[#242424] dark:text-white">
                        ₹{calc.totalInr.toLocaleString("en-IN")}{" "}
                        <span className="text-[10px] font-normal text-gray-500">
                          / {tid === "monthly" ? "mo" : tid === "quarterly" ? "3 mo" : "yr"}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        ${calc.totalUsd} USD · {meta.extension} · {calc.tierFormulaLabel}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Repay Action Card */}
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/15 border border-emerald-400/40 dark:border-emerald-600/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-[#242424] dark:text-white flex items-center gap-2 flex-wrap">
                  <span>Extend Subscription by {tenureMeta.duration}</span>
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    Services Renewal
                  </span>
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                  {lookupData.subscription.isExpired
                    ? `Your workspace is currently locked. Pay now to reactivate instant access for ${activeSeats} seats for ${tenureMeta.extension} from today.`
                    : `Pay prior to expiration to stack ${tenureMeta.extension} for ${activeSeats} seats onto your remaining balance without losing existing days.`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCheckoutOpen(true)}
                disabled={isRenewing || isSeatSelectionInvalid}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>
                  Pay ₹{seatPricing.totalInr.toLocaleString("en-IN")} ({activeSeats} Seats · {tenureMeta.extension})
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* History of Older Plans & Payments with Responsive Overflow Controls */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Subscription Invoices &amp; Past Plan Records</span>
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  {lookupData.paymentHistory.length} Past Record{lookupData.paymentHistory.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Mobile horizontal scroll guidance indicator */}
              <div className="flex sm:hidden items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 px-1">
                <span>← Scroll table horizontally for all details</span>
                <span className="font-mono text-xs">⟷</span>
              </div>

              {/* Responsive scrollable table container */}
              <div className="w-full border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/40 shadow-xs">
                <div className="overflow-x-auto overscroll-x-contain">
                  <table className="w-full min-w-[540px] text-left text-[11px] border-collapse">
                    <thead className="bg-gray-50 dark:bg-zinc-800/80 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-zinc-700 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 sm:px-4">Invoice / Payment ID</th>
                        <th className="py-2.5 px-3 sm:px-4">Date</th>
                        <th className="py-2.5 px-3 sm:px-4">Seats</th>
                        <th className="py-2.5 px-3 sm:px-4">Amount</th>
                        <th className="py-2.5 px-3 sm:px-4 text-right sm:text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
                      {lookupData.paymentHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-gray-400 text-xs">
                            No prior payment records found for this workspace.
                          </td>
                        </tr>
                      ) : (
                        lookupData.paymentHistory.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="py-2.5 px-3 sm:px-4 font-mono text-gray-600 dark:text-gray-400 truncate max-w-[140px]">
                              {item.id}
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {item.date}
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 font-bold text-[#0078D4] dark:text-[#479EF5] whitespace-nowrap">
                              {item.seats} Seats
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 font-bold text-[#242424] dark:text-white whitespace-nowrap">
                              ₹{item.amountInr.toLocaleString("en-IN")}{" "}
                              <span className="text-[10px] font-normal text-gray-500">(${item.amountUsd})</span>
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 text-right sm:text-left whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60">
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Razorpay Modal for Checkout */}
      {lookupData && (
        <RazorpayCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          defaultPlan={selectedTenure}
          companyNameHint={lookupData.company.name}
          emailHint={email}
          title={`Renew Subscription: ${lookupData.company.name}`}
          subtitle={`${tenureMeta.label} renewal ${tenureMeta.extension} for ${activeSeats} seats (was ${currentTotalSeats}). Seats & tenure stay in sync — adjust here or inside checkout.`}
          initialUserCount={activeSeats}
          minSeats={minRenewalSeats}
          onPaymentSuccess={handleRenewalPaymentSuccess}
        />
      )}
    </div>
  );
}
