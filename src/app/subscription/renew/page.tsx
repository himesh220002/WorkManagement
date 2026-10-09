"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";
import RepayServiceModal from "@/components/subscription/RepayServiceModal";

export default function SubscriptionRenewPage() {
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#FAF9F8] dark:bg-[#11100F] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center mb-6">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#0078D4] hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspace Login</span>
        </Link>
        <h1 className="text-xl font-bold text-[#242424] dark:text-white">
          Workspace Repay &amp; Extension Portal
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Review your days remaining, seats occupancy, and extend your subscription cycle by 30 days.
        </p>
      </div>

      <RepayServiceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(true)}
      />
    </div>
  );
}
