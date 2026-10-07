import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How TaskPMS collects, stores and protects your company workspace data — including tenant-isolated databases and encrypted S3 document storage.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    h: "1. Who we are",
    p: "TaskPMS (“Task Project Management System”, taskpms.com) provides a multi-tenant work-management platform for companies to run projects, teams, sales pipelines, revenue targets and document vaults in isolated workspaces. This policy explains what data we process and how we protect it. Contact: hello@taskpms.com.",
  },
  {
    h: "2. Data we collect",
    p: "Account data (name, work email, password hash, role and company association); workspace content you create (projects, tasks, pipelines, deals, goals, comments and activity logs); documents you upload (stored in isolated AWS S3 prefixes per company); and limited technical data (device, browser, pages visited) via cookies and — only if enabled — Google Analytics for aggregated usage statistics.",
  },
  {
    h: "3. How we use it",
    p: "To operate your workspace, authenticate you into the correct tenant, enforce role-based permissions, store and serve your documents, prevent abuse, and improve the product. We never sell personal data and never use one company's workspace content to serve another company.",
  },
  {
    h: "4. Tenant isolation",
    p: "Each company workspace is partitioned into its own database (projectManageDB_{COMPANY_CODE}) and its own S3 key prefixes. Edge middleware validates your organization on every request and blocks cross-tenant access before any data is read. Document previews use short-lived presigned URLs (60 seconds) instead of public links.",
  },
  {
    h: "5. Cookies & analytics",
    p: "We use strictly necessary cookies (authentication session, theme preference). If a Google Analytics measurement ID is configured, we set analytics cookies to understand aggregate usage; you can block them in your browser and the product keeps working. We do not run third-party advertising cookies on workspace pages.",
  },
  {
    h: "6. Data sharing",
    p: "We share data only with infrastructure sub-processors required to run the service (cloud hosting, MongoDB hosting, AWS S3 storage, email delivery) under data-processing terms. We disclose data when required by law or to protect the security of the service.",
  },
  {
    h: "7. Retention & deletion",
    p: "Workspace data is retained while your company account is active. Archived documents are kept separate from the active workspace until a manager or owner restores or strictly deletes them. You may request export or deletion of your company's data at any time via hello@taskpms.com; backups expire on a rolling basis.",
  },
  {
    h: "8. Your rights",
    p: "Depending on your jurisdiction you may have rights to access, correct, export or delete your personal data, and to object to certain processing. Company owners can manage most member data directly from the Teams directory; for anything else, email hello@taskpms.com and we respond within 30 days.",
  },
  {
    h: "9. Security",
    p: "Passwords are stored as salted hashes, sessions are signed tokens, uploads are validated against per-category size and format limits, and S3 objects are never publicly listed. No system is perfectly secure, but tenant isolation plus short-lived presigned URLs keeps blast radius to a single company by design.",
  },
  {
    h: "10. Changes to this policy",
    p: "We will update the “Last updated” date below and, for material changes, notify company owners by email before the new policy takes effect.",
  },
];

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <p className="text-xs font-bold text-[#0078d4] uppercase tracking-wider mb-2">Legal</p>
      <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 dark:text-white">Privacy Policy</h1>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">Last updated: October 7, 2026 · Applies to taskpms.com and all TaskPMS workspaces</p>
      <div className="mt-8 space-y-7">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{s.h}</h2>
            <p className="text-[15px] leading-relaxed text-gray-600 dark:text-zinc-300 font-light">{s.p}</p>
          </section>
        ))}
      </div>
    </MarketingShell>
  );
}
