import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./frappe-gantt.css";
import { AppShell } from "@/components/shell/AppShell";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { ToastProvider } from "@/components/ui/Toast";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });

const SITE_URL = "https://taskpms.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TaskPMS — Task Project Management System for Modern Enterprises",
    template: "%s · TaskPMS",
  },
  description:
    "TaskPMS is a multi-tenant task project management system with isolated company databases, role-based permission management (RBAC), AWS S3 document vault, Gantt timelines and revenue pipelines.",
  keywords: [
    "task management system",
    "task project management system",
    "project management software",
    "multi-tenant project management",
    "permission management system",
    "role based access control software",
    "team task tracker",
    "sales pipeline software",
    "revenue dashboard",
    "gantt chart online",
    "document management system",
    "enterprise work management",
  ],
  authors: [{ name: "TaskPMS" }],
  creator: "TaskPMS",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "TaskPMS",
    title: "TaskPMS — Task Project Management System for Modern Enterprises",
    description:
      "Isolated workspaces per company, role-based permission management, S3 document vault, Gantt timelines, sales and revenue pipelines. First month free.",
    images: [{ url: "/logo.svg", width: 196, height: 40, alt: "TaskPMS logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskPMS — Task Project Management System for Modern Enterprises",
    description:
      "Multi-tenant task management with isolated databases, granular RBAC and a secure S3 document vault.",
    images: ["/logo.svg"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

const themeInitScript = `(function() {
  try {
    var savedTheme = localStorage.getItem('taskflow_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeInitScript,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} antialiased min-h-screen flex flex-col bg-[#FAF9F8] dark:bg-[#1B1A19]`}
      >
        <NextTopLoader color="#0078D4" height={2} showSpinner={false} />
        <GoogleAnalytics />
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
