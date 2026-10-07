import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact the TaskPMS team for trials, tenant onboarding, permission-management questions and support — replies within two business days.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <MarketingShell>
      <p className="text-xs font-bold text-[#0078d4] uppercase tracking-wider mb-2">Support</p>
      <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 dark:text-white">Contact Us</h1>
      <p className="text-[15px] text-gray-600 dark:text-zinc-300 font-light mt-3 max-w-2xl leading-relaxed">
        Questions about trials, tenant onboarding, permission management or the document vault?
        Write to us — a human replies within two business days.
      </p>
      <ContactForm />
    </MarketingShell>
  );
}
