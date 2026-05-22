"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { trackError } from "@/lib/track";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  surface?: string;
}

/**
 * Friendly error boundary fallback. Used by every error.tsx in the app router.
 * - Logs the error via track() so we see it server-side.
 * - Offers Retry and Home.
 * - Shows digest in mono pill so users can paste it when reporting.
 */
export function ErrorFallback({ error, reset, surface }: Props) {
  useEffect(() => {
    trackError(error, surface);
  }, [error, surface]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="size-14 rounded-xl border border-[var(--ember)]/40 bg-[var(--ember)]/10 flex items-center justify-center mb-5">
        <AlertTriangle size={22} className="text-[var(--ember)]" />
      </div>
      <div className="mono cap text-[10px] text-[var(--ember)] mb-2">
        {surface ? `Surface fault · ${surface}` : "Surface fault"}
      </div>
      <h2 className="text-[22px] font-semibold tracking-tight mb-2">
        Something went sideways.
      </h2>
      <p className="text-[14px] text-[var(--text-2)] max-w-[480px] leading-relaxed mb-5">
        This surface crashed, but the rest of Qyntra is fine. Try again, head home,
        or send us the code below if it keeps happening.
      </p>
      {error.digest && (
        <code className="mono text-[10.5px] px-2.5 py-1 rounded border border-[var(--line)] text-[var(--muted)] mb-5">
          digest · {error.digest}
        </code>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="mono cap text-[11px] px-4 py-2 rounded bg-[var(--ember)] text-white inline-flex items-center gap-2 hover:bg-[var(--ember-2)] transition"
        >
          <RefreshCw size={12} /> Try again
        </button>
        <Link
          href="/home"
          className="mono cap text-[11px] px-4 py-2 rounded border border-[var(--line)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--ember)]/40 inline-flex items-center gap-2 transition"
        >
          <Home size={12} /> Home
        </Link>
      </div>
    </div>
  );
}
