"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Mail, Send, AlertCircle, Loader2, MessageSquare } from "lucide-react";
import { submitContactInquiry } from "@/actions/contact";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
    discordNotified?: boolean;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("email", email);
      formData.set("company", company);
      formData.set("message", message);

      const result = await submitContactInquiry(formData);

      if (result.success) {
        setFeedback({
          type: "success",
          text: `Thank you, ${name}! Your inquiry has been received and saved. Our team will review and reply within 1-2 business days.`,
          discordNotified: result.discordNotified,
        });
        setName("");
        setEmail("");
        setCompany("");
        setMessage("");
      } else {
        setFeedback({
          type: "error",
          text: result.error || "Failed to submit message. Please try again.",
        });
      }
    });
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#27272A] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#0078d4] focus:outline-none transition-colors";

  return (
    <div className="grid md:grid-cols-5 gap-6 mt-8">
      <form onSubmit={handleSubmit} className="md:col-span-3 bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded-sm p-6 space-y-4 shadow-xs">
        {feedback && (
          <div
            className={`p-4 rounded-sm border flex items-start gap-3 text-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                : "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-medium">{feedback.text}</p>
              {feedback.discordNotified && (
                <p className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Instant notification delivered directly to our operations Discord channel.</span>
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-name" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">
              Your name *
            </label>
            <input
              id="contact-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              className={inputCls}
              disabled={isPending}
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">
              Work email *
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ada@company.com"
              className={inputCls}
              disabled={isPending}
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-company" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">
            Company / Organization
          </label>
          <input
            id="contact-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Inc."
            className={inputCls}
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="contact-message" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">
            How can we help? *
          </label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="We want to deploy TaskPMS for a 40-person engineering + sales organization..."
            className={inputCls}
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="bg-[#0078d4] hover:bg-[#005a9e] disabled:opacity-60 text-white font-semibold text-sm px-6 py-2.5 rounded-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending message...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send message</span>
              </>
            )}
          </button>

          <span className="text-xs text-gray-400">
            Recorded in database &amp; dispatched via webhook
          </span>
        </div>
      </form>

      <aside className="md:col-span-2 space-y-4">
        <div className="bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded-sm p-5 shadow-xs">
          <p className="flex items-center gap-2 font-semibold text-sm text-gray-900 dark:text-white mb-1">
            <Mail className="w-4 h-4 text-[#0078d4]" /> Direct Contact
          </p>
          <a href="mailto:hello@taskpms.com" className="text-sm text-[#0078d4] hover:underline font-medium">
            hello@taskpms.com
          </a>
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-light mt-2">
            For subscriptions, enterprise onboarding, SLA contracts, and Discord integration setup.
          </p>
        </div>

        <div className="bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded-sm p-5 text-sm shadow-xs">
          <p className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Operations &amp; Support Channels</span>
          </p>
          <ul className="text-[13px] text-gray-600 dark:text-zinc-300 font-light space-y-2">
            <li>· <strong>Instant Discord Alerts:</strong> Inquiries posted here alert our team on our private Discord channel in real-time.</li>
            <li>· <strong>Subscription Onboarding:</strong> Start directly at <a href="/auth/signup" className="text-[#0078d4] hover:underline">Subscribe ($3/user/mo)</a></li>
            <li>· <strong>Workspaces:</strong> Active tenants can log in at <a href="/auth/login" className="text-[#0078d4] hover:underline">Sign In</a></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
