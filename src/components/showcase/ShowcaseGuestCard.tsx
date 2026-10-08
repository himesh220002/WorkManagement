"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  LogIn,
  X,
  Building2,
  Eye,
} from "lucide-react";
import RazorpayCheckoutModal from "@/components/payment/RazorpayCheckoutModal";

export default function ShowcaseGuestCard() {
  const [isGuest, setIsGuest] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [restrictionActionName, setRestrictionActionName] = useState("");

  useEffect(() => {
    // Check if current user is an unauthenticated guest
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !data.authenticated || data.isGuest) {
          setIsGuest(true);
        }
      })
      .catch(() => {
        setIsGuest(true);
      });

    // Listen for custom "taskflow:guest-restricted-action" events from mutation handlers
    const handleRestrictedAction = (e: CustomEvent) => {
      setRestrictionActionName(e.detail?.actionName || "Making workspace changes");
      setShowRestrictionModal(true);
    };

    window.addEventListener("taskflow:guest-restricted" as any, handleRestrictedAction);
    return () => {
      window.removeEventListener("taskflow:guest-restricted" as any, handleRestrictedAction);
    };
  }, []);

  if (!isGuest) return null;

  return (
    <>
      {/* Floating Small Card: TaskFlow Organization Showcase */}
      <div className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100vw-32px)] sm:w-96 select-none transition-all duration-300">
        <div className="bg-white dark:bg-[#1E1E1E] border border-[#0078D4]/40 dark:border-[#0078D4]/60 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Card Header Bar */}
          <div className="bg-gradient-to-r from-[#004578] via-[#0078D4] to-[#106EBE] px-3.5 py-2 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-xs tracking-tight">TaskFlow Organization</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/20 text-white uppercase tracking-wider">
                Showcase Mode
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title={isCollapsed ? "Expand showcase details" : "Collapse"}
              >
                {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Card Body */}
          {!isCollapsed && (
            <div className="p-3.5 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#EBF3FC] dark:bg-[#1C2B3D] text-[#0078D4] dark:text-[#479EF5] shrink-0 mt-0.5">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="text-xs text-[#605E5C] dark:text-[#C8C6C4] leading-relaxed">
                  <span className="font-semibold text-[#242424] dark:text-white">
                    Public Read-Only Preview:
                  </span>{" "}
                  You can inspect all sidebar modules, pipelines, Gantt timelines, and telemetry. Modifications require login or active organization subscription.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                <Link
                  href="/auth/login"
                  className="flex-1 py-1.5 px-3 rounded-md border border-[#E1DFDD] dark:border-[#3B3A39] hover:border-[#0078D4] text-xs font-semibold text-[#242424] dark:text-white hover:text-[#0078D4] dark:hover:text-[#479EF5] transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsPaywallOpen(true)}
                  className="flex-1 py-1.5 px-3 rounded-md bg-[#0078D4] hover:bg-[#106EBE] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Subscribe ($20/mo)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Blocked Modal: Login Needed to Continue */}
      {showRestrictionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E1DFDD] dark:border-[#3B3A39] shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setShowRestrictionModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              Login Needed to Continue
            </h3>
            <p className="text-xs font-semibold text-[#0078D4] mb-3">
              TaskFlow Organization — Showcase Mode
            </p>

            <p className="text-xs text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              You are currently exploring in guest showcase mode. To modify workflows, create pipelines, or initialize new blueprints, please sign in or subscribe to unlock your dedicated organization.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowRestrictionModal(false);
                  setIsPaywallOpen(true);
                }}
                className="flex-1 py-2 px-3 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Subscribe ($20/mo or $200/yr)</span>
              </button>

              <Link
                href="/auth/login"
                className="py-2 px-4 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Paywall Modal */}
      <RazorpayCheckoutModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
      />
    </>
  );
}

/**
 * Helper to dispatch guest restriction notice if guest tries modifying UI elements
 */
export function triggerGuestRestriction(actionName = "Modifying workspace") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("taskflow:guest-restricted", {
        detail: { actionName },
      })
    );
  }
}
