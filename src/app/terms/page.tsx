import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms governing your TaskPMS trial and subscription — workspaces, fair use, billing, data ownership and acceptable use.",
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    h: "1. The service",
    p: "TaskPMS provides a hosted, multi-tenant task project management system: isolated company workspaces with projects, tasks, pipelines, teams, sales and revenue dashboards, and an S3-backed document vault. By creating an account or using a workspace you agree to these terms on behalf of your company.",
  },
  {
    h: "2. Free trial",
    p: "New companies receive one full month of free, full-access use. No credit card is required to start a trial. At the end of the trial you may choose a paid tier to continue; if you do not subscribe, your workspace is paused (not immediately deleted) so you can reactivate it later.",
  },
  {
    h: "3. Accounts & roles",
    p: "Company owners are responsible for the accounts they provision and the roles they assign across the 5-tier hierarchy (superuser, owner, manager, team lead, employee). You must keep credentials confidential, use a valid work email, and promptly offboard members who leave your organization.",
  },
  {
    h: "4. Your data stays yours",
    p: "All workspace content and uploaded documents remain the property of your company. We claim no ownership over them. Each company's data lives in its own isolated database and S3 prefixes, and we access it only to operate, secure or support the service — or when you explicitly ask us to.",
  },
  {
    h: "5. Acceptable use",
    p: "You agree not to: access another company's workspace; probe, scan or circumvent tenant isolation, authentication or rate limits; upload unlawful, infringing or malicious content; resell or white-label the service without written permission; or use the platform in a way that degrades it for others.",
  },
  {
    h: "6. Document storage limits",
    p: "Uploads are governed per vault: Project & Deliverables 25 MB, Sales & Client Pipeline 15 MB, Salary/Payroll & Finance 10 MB, Employee & Onboarding 5 MB — with restricted file formats per category. We may reject or quarantine files that violate these limits or appear malicious.",
  },
  {
    h: "7. Billing & cancellation",
    p: "Paid tiers are billed per company workspace as shown at signup. You can cancel at any time; service continues until the end of the paid period. Refunds are handled case by case within 14 days of a charge — contact hello@taskpms.com.",
  },
  {
    h: "8. Availability & support",
    p: "We target high availability but do not guarantee uninterrupted service; scheduled maintenance and incident updates are communicated to company owners. Support is provided via hello@taskpms.com with best-effort response within two business days on trial and standard tiers.",
  },
  {
    h: "9. Limitation of liability",
    p: "To the maximum extent permitted by law, TaskPMS is provided “as is”, and our aggregate liability is limited to the fees your company paid in the 12 months before the claim. We are not liable for indirect, incidental or consequential damages, including loss of profits or data — which is why owners control archive, export and strict-delete flows.",
  },
  {
    h: "10. Changes & contact",
    p: "We may update these terms as the product evolves; material changes are notified by email and take effect 14 days later. Questions: hello@taskpms.com.",
  },
];

export default function TermsPage() {
  return (
    <MarketingShell>
      <p className="text-xs font-bold text-[#0078d4] uppercase tracking-wider mb-2">Legal</p>
      <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 dark:text-white">Terms &amp; Conditions</h1>
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
