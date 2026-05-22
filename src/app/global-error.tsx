"use client";

import { useEffect } from "react";
import { trackError } from "@/lib/track";

/**
 * Global error boundary — runs when the root layout itself crashes.
 * Must include <html> and <body>. Keep it minimal so it never fails.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    trackError(error, "global");
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#0a0a0a", color: "#f4f4f5", fontFamily: "system-ui, sans-serif", margin: 0, padding: "48px 24px", textAlign: "center" }}>
        <h1 style={{ color: "#ff5b1f", fontSize: 26, marginBottom: 12 }}>Qyntra crashed</h1>
        <p style={{ color: "#a1a1aa", maxWidth: 460, margin: "0 auto 18px", lineHeight: 1.55, fontSize: 14 }}>
          Something blew up before the app could mount. Reload to recover. If it keeps happening, share the digest below.
        </p>
        {error.digest && (
          <code style={{ display: "inline-block", padding: "4px 10px", border: "1px solid #27272a", borderRadius: 6, color: "#a1a1aa", fontSize: 11, marginBottom: 18 }}>
            digest · {error.digest}
          </code>
        )}
        <div>
          <button
            onClick={() => reset()}
            style={{ padding: "8px 18px", borderRadius: 6, background: "#ff5b1f", color: "#fff", border: 0, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            Reload Qyntra
          </button>
        </div>
      </body>
    </html>
  );
}
