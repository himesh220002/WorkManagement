"use client";

import React from "react";
import Link from "next/link";

/**
 * Global 500 handler. Must be a client component and render its own
 * <html>/<body> because the root layout is replaced on fatal errors.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>500 — Server Fault · TaskPMS</title>
      </head>
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: "#f2f2f2",
          color: "#242424",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <header
          style={{
            background: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            height: "48px",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                background: "#0078D4",
                color: "#ffffff",
                padding: "2px 8px",
                borderRadius: "3px",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              TaskPMS
            </span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#242424" }}>
              Enterprise Work Management
            </span>
          </div>
          <Link
            href="/"
            style={{
              fontSize: "13px",
              color: "#0078D4",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            taskpms.com
          </Link>
        </header>

        {/* Hero Band */}
        <section
          style={{
            background: "linear-gradient(to right, #004578, #0078d4)",
            color: "#ffffff",
            padding: "48px 24px",
          }}
        >
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <span
              style={{
                display: "inline-block",
                background: "#005a9e",
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "2px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "12px",
              }}
            >
              Error 500 · Server Processing Fault
            </span>
            <h1
              style={{
                fontSize: "36px",
                fontWeight: 300,
                lineHeight: 1.15,
                margin: "0 0 16px 0",
              }}
            >
              An unexpected execution fault occurred.
            </h1>
            <p
              style={{
                fontSize: "15px",
                color: "#dbeafe",
                fontWeight: 300,
                lineHeight: 1.6,
                maxWidth: "600px",
                margin: "0 0 24px 0",
              }}
            >
              A fatal fault was encountered in the core page engine. Your underlying tenant
              database (MongoDB) and AWS S3 document vault remain completely secure and isolated.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  background: "#ffffff",
                  color: "#004578",
                  border: 0,
                  borderRadius: "2px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                ↻ Try Again
              </button>
              <Link
                href="/exec/dashboard"
                style={{
                  border: "1px solid rgba(255,255,255,0.4)",
                  color: "#ffffff",
                  borderRadius: "2px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Open Executive Dashboard
              </Link>
              <Link
                href="/"
                style={{
                  color: "#dbeafe",
                  borderRadius: "2px",
                  padding: "10px 16px",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            marginTop: "auto",
            background: "#ffffff",
            borderTop: "1px solid #e5e7eb",
            padding: "16px 24px",
            textAlign: "center",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          © 2026 TaskPMS · Task Project Management System · Isolated Multi-Tenant Cloud Architecture
        </footer>
      </body>
    </html>
  );
}
