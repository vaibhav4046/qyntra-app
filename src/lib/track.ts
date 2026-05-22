/**
 * Lightweight error tracking.
 *
 * - Always console.errors in dev for visibility.
 * - In prod, if NEXT_PUBLIC_SENTRY_DSN is set we forward to Sentry via the
 *   browser CDN (loaded lazily once). If it's not set we still POST a
 *   summarised event to /api/track so server logs catch surfaces issues.
 *
 * Keep this dependency-free so it never breaks the build.
 */

type Severity = "error" | "warn" | "info";

interface TrackPayload {
  message: string;
  severity: Severity;
  surface?: string;
  digest?: string;
  stack?: string;
  meta?: Record<string, unknown>;
}

const DSN =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SENTRY_DSN || "" : "";

let sentryLoaded = false;
async function ensureSentry() {
  if (sentryLoaded || !DSN || typeof window === "undefined") return;
  sentryLoaded = true;
  try {
    // Load the Sentry browser SDK from the official CDN. No package install needed.
    const s = document.createElement("script");
    s.src = "https://browser.sentry-cdn.com/8.42.0/bundle.min.js";
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
    await new Promise<void>((r, j) => {
      s.onload = () => r();
      s.onerror = () => j(new Error("sentry cdn failed"));
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Sentry = (window as any).Sentry;
    if (Sentry?.init) {
      Sentry.init({ dsn: DSN, tracesSampleRate: 0.05 });
    }
  } catch {
    /* fail open */
  }
}

export function track(payload: TrackPayload) {
  if (typeof console !== "undefined") {
    const fn = payload.severity === "info" ? console.info : payload.severity === "warn" ? console.warn : console.error;
    fn("[qyntra]", payload.message, payload);
  }

  if (typeof window !== "undefined") {
    ensureSentry();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Sentry = (window as any).Sentry;
    if (Sentry?.captureException) {
      const err = new Error(payload.message);
      if (payload.stack) err.stack = payload.stack;
      Sentry.captureException(err, { extra: { ...payload.meta, surface: payload.surface, digest: payload.digest } });
    }
    // Always send to our server route so we have a single backstop log
    try {
      navigator.sendBeacon?.(
        "/api/track",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
    } catch {
      /* ignore */
    }
  }
}

export function trackError(err: unknown, surface?: string, meta?: Record<string, unknown>) {
  const e = err instanceof Error ? err : new Error(String(err));
  track({
    message: e.message || "unknown error",
    severity: "error",
    surface,
    stack: e.stack,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    digest: (e as any).digest,
    meta,
  });
}
