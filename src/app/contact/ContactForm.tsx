"use client";

import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`TaskPMS enquiry from ${name}${company ? ` (${company})` : ""}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}${company ? `\n${company}` : ""}`);
    window.location.href = `mailto:hello@taskpms.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#27272A] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#0078d4] focus:outline-none";

  return (
    <div className="grid md:grid-cols-5 gap-6 mt-8">
      <form onSubmit={handleSubmit} className="md:col-span-3 bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded-sm p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-name" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">Your name *</label>
            <input id="contact-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className={inputCls} />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">Work email *</label>
            <input id="contact-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ada@company.com" className={inputCls} />
          </div>
        </div>
        <div>
          <label htmlFor="contact-company" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">Company</label>
          <input id="contact-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." className={inputCls} />
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">How can we help? *</label>
          <textarea id="contact-message" required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="We want to trial TaskPMS for a 40-person engineering + sales org…" className={inputCls} />
        </div>
        {sent && (
          <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Your email app should have opened — we&apos;ll reply within two business days.
          </p>
        )}
        <button type="submit" className="bg-[#0078d4] hover:bg-[#005a9e] text-white font-semibold text-sm px-6 py-2.5 rounded-sm transition-colors">
          Send message
        </button>
      </form>

      <aside className="md:col-span-2 space-y-4">
        <div className="bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded-sm p-5">
          <p className="flex items-center gap-2 font-semibold text-sm text-gray-900 dark:text-white mb-1"><Mail className="w-4 h-4 text-[#0078d4]" /> Email us directly</p>
          <a href="mailto:hello@taskpms.com" className="text-sm text-[#0078d4] hover:underline">hello@taskpms.com</a>
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-light mt-2">For trials, billing, security questions and data-deletion requests.</p>
        </div>
        <div className="bg-white dark:bg-[#201F1E] border border-gray-200 dark:border-[#3B3A39] rounded-sm p-5 text-sm">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">Before you write</p>
          <ul className="text-[13px] text-gray-600 dark:text-zinc-300 font-light space-y-1.5">
            <li>· Trial help → start at <a href="/auth/signup" className="text-[#0078d4] hover:underline">Try Free Month</a></li>
            <li>· Signed in already? Use <a href="/exec/dashboard" className="text-[#0078d4] hover:underline">Open Dashboard</a></li>
            <li>· Architecture questions → <a href="/about" className="text-[#0078d4] hover:underline">About Us</a></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
