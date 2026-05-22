"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BeforeInstallPromptEvent = any;

/**
 * - Registers /sw.js once on mount (no-op in dev).
 * - Captures the `beforeinstallprompt` event so the user gets a subtle
 *   "Install Qyntra" chip on supported browsers.
 */
export function PWARegister() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "development") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    setDismissed(localStorage.getItem("qyntra:install-dismissed") === "1");

    const onPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt as EventListener);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt as EventListener);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred || installed || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-xs rounded-xl border border-[var(--ember)]/40 bg-[var(--bg-1)]/95 backdrop-blur-md shadow-xl p-3 flex items-start gap-3">
      <Download size={16} className="text-[var(--ember)] mt-0.5" />
      <div className="flex-1">
        <div className="mono cap text-[10px] text-[var(--ember)] mb-0.5">Install Qyntra</div>
        <div className="text-[12px] text-[var(--text-2)] leading-relaxed mb-2">
          Add to your home screen for offline access + faster launches.
        </div>
        <div className="flex gap-2">
          <button
            className="mono cap text-[10px] px-2.5 py-1 rounded bg-[var(--ember)] text-white"
            onClick={async () => {
              try {
                deferred.prompt();
                await deferred.userChoice;
              } catch {}
              setDeferred(null);
            }}
          >
            Install
          </button>
          <button
            className="mono cap text-[10px] px-2.5 py-1 rounded border border-[var(--line)] text-[var(--text-2)]"
            onClick={() => {
              localStorage.setItem("qyntra:install-dismissed", "1");
              setDismissed(true);
            }}
          >
            Later
          </button>
        </div>
      </div>
      <button
        aria-label="Dismiss"
        className="text-[var(--muted)] hover:text-[var(--text)] -mt-0.5"
        onClick={() => {
          localStorage.setItem("qyntra:install-dismissed", "1");
          setDismissed(true);
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}
