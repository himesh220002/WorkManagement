"use client";

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
      <body style={{ margin: 0, fontFamily: "'Segoe UI', Arial, sans-serif", background: "#f2f2f2", color: "#242424" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <p style={{ fontSize: 64, fontWeight: 300, color: "#0078D4", margin: 0 }}>500</p>
            <h1 style={{ fontSize: 24, fontWeight: 300, margin: "16px 0 0" }}>Something broke on our side</h1>
            <p style={{ fontSize: 14, color: "#605E5C", marginTop: 8 }}>
              Your workspace data is safe in its isolated tenant database — this is a rendering fault.
              Try again, or head back home.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
              <button
                onClick={() => reset()}
                style={{ background: "#0078D4", color: "#fff", border: 0, borderRadius: 2, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Try again
              </button>
              <Link href="/" style={{ border: "1px solid #ccc", borderRadius: 2, padding: "10px 20px", fontSize: 14, textDecoration: "none", color: "#242424" }}>
                Back to homepage
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
