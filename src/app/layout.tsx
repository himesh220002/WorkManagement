import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./frappe-gantt.css";
import Sidebar from "@/components/Sidebar";
import { TopBar, Breadcrumbs } from "@/components/shell";
import { ToastProvider } from "@/components/ui/Toast";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "TaskFlow PM - Enterprise Dashboard",
  description: "Advanced Enterprise Task, Project & Resource Management Suite",
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
        <ToastProvider>
          <TopBar />
          <div className="flex-1 flex flex-col xl:flex-row w-full max-w-[1920px] mx-auto min-h-[calc(100vh-48px)]">
            <Sidebar />
            <main className="flex-1 min-w-0 p-2 sm:p-4 lg:p-6 overflow-x-hidden">
              <Breadcrumbs />
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
