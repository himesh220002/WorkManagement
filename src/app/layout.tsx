import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import "./frappe-gantt.css";
import Sidebar from "@/components/Sidebar";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "TaskFlow PM - Enterprise Dashboard",
  description: "Advanced Task & Resource Management Suite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            try {
              const savedTheme = localStorage.getItem('taskflow_theme') || 'light';
              document.documentElement.setAttribute('data-theme', savedTheme);
            } catch (e) {}
          `}
        </Script>
        <div className="app-container">
          <Sidebar />
          {children}
        </div>
      </body>
    </html>
  );
}
