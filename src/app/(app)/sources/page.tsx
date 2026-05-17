"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { type QConnector } from "@/lib/data";
import { ConnIcon } from "@/components/conn-icon";
import { signIn, useSession } from "next-auth/react";
import { useConnectorStore } from "@/lib/connector-store";
import { ConnectGuide } from "@/components/connect-guide";
import { RefreshCw, Check, AlertCircle } from "lucide-react";
import { AutoIngestButton } from "@/components/auto-ingest";

interface SyncState {
  loading: boolean;
  message?: string;
  count?: number;
  error?: string;
}

export default function SourcesPage() {
  const { data: session } = useSession();
  const { connectors: conns, syncing, init, toggle } = useConnectorStore();
  const [syncs, setSyncs] = useState<Record<string, SyncState>>({});

  useEffect(() => { init(); }, [init]);

  // Listen for Slack popup postMessage
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "SLACK_CONNECTED" && e.data.ok) {
        setSyncs((s) => ({ ...s, slack: { loading: false, message: "Slack connected" } }));
        // Optimistically flip connector on
        toggle({ ...conns.find((x) => x.id === "slack")! } as QConnector);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [init, conns, toggle]);

  async function connectReal(c: QConnector) {
    if (c.provider === "google") signIn("google", { callbackUrl: "/sources" });
    else if (c.provider === "notion") signIn("notion", { callbackUrl: "/sources" });
    else if (c.provider === "github") signIn("github", { callbackUrl: "/sources" });
    else if (c.provider === "linkedin") signIn("linkedin", { callbackUrl: "/sources" });
    else if (c.provider === "slack") {
      // Slack is ingestion-only (not sign-in) because user tokens expire in ~12 hours.
      // Use custom OAuth flow via popup.
      const popup = window.open("", "slack-oauth", "width=500,height=700");
      if (!popup) return;
      const res = await fetch("/api/connectors/slack/start");
      const json = await res.json();
      if (json.url) {
        popup.location.href = json.url;
      } else {
        popup.close();
        setSyncs((s) => ({ ...s, slack: { loading: false, error: json.error || "Slack OAuth not configured" } }));
      }
    }
  }

  async function syncNow(c: QConnector) {
    setSyncs((s) => ({ ...s, [c.id]: { loading: true } }));
    try {
      const res = await fetch(`/api/ingest/${c.id}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setSyncs((s) => ({ ...s, [c.id]: { loading: false, error: json.error || "Failed" } }));
        return;
      }
      setSyncs((s) => ({ ...s, [c.id]: { loading: false, count: json.inserted, message: `Synced ${json.inserted} items` } }));
      // Optimistically bump count in store
    } catch (err) {
      setSyncs((s) => ({ ...s, [c.id]: { loading: false, error: (err as Error).message } }));
    }
  }

  const onCount = conns.filter((x) => x.on).length;

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="mono cap text-[11px] text-[var(--ember)] mb-2">Surface 04 · Manage your connectors</div>
        <h1 className="text-[26px] sm:text-[36px] font-bold tracking-tight leading-tight">Plug in everywhere you already remember.</h1>
        <p className="mono cap text-[11px] text-[var(--muted)] mt-2">
          CONNECTORS · {onCount} OF {conns.length} ACTIVE · LOCAL-FIRST INGESTION{session?.user && ` · ${session.user.email}`}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {conns.map((c, i) => {
          const sync = syncs[c.id];
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-5 sm:p-6 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--line-2)] transition"
            >
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-lg bg-[var(--bg-2)] flex items-center justify-center">
                    <ConnIcon kind={c.icon} size={26} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold">{c.name}</h3>
                    <div
                      className="mono cap text-[10px]"
                      style={{ color: syncing[c.id] ? "var(--gold)" : c.on ? "var(--good)" : "var(--muted)" }}
                    >
                      {syncing[c.id] ? "◌ SYNCING…" : c.on ? `LIVE · ${c.count} ITEMS` : "NOT CONNECTED"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {c.provider && c.provider !== "local" && (
                    <>
                      <button
                        onClick={() => connectReal(c)}
                        className="mono cap text-[10px] px-3 py-1.5 rounded border border-[var(--ember)]/40 text-[var(--ember)] hover:bg-[var(--ember)]/10"
                      >
                        {c.on ? "RE-AUTH" : "OAUTH"}
                      </button>
                      <button
                        onClick={() => syncNow(c)}
                        disabled={sync?.loading}
                        className="mono cap text-[10px] px-3 py-1.5 rounded border border-[var(--gold)]/40 text-[var(--gold)] hover:bg-[var(--gold)]/10 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw size={11} className={sync?.loading ? "animate-spin" : ""} />
                        {sync?.loading ? "SYNCING" : "SYNC"}
                      </button>
                    </>
                  )}
                  {c.provider === "local" && <AutoIngestButton onComplete={() => syncNow(c)} />}
                  <button
                    onClick={() => toggle(c)}
                    className={`relative w-12 h-6 rounded-full transition ${c.on ? "bg-[var(--ember)]" : "bg-[var(--bg-3)]"}`}
                    aria-label="Toggle connector"
                  >
                    <span
                      className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${c.on ? "translate-x-[26px]" : "translate-x-0.5"}`}
                    />
                  </button>
                </div>
              </div>

              {sync?.message && (
                <div className="mb-3 p-2 rounded border border-[var(--good)]/30 bg-[var(--good)]/5 flex items-center gap-2 mono cap text-[10px] text-[var(--good)]">
                  <Check size={12} /> {sync.message}
                </div>
              )}
              {sync?.error && (
                <div className="mb-3 p-2 rounded border border-[var(--bad)]/30 bg-[var(--bad)]/5 flex items-start gap-2 mono text-[10px] text-[var(--bad)]">
                  <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                  <span>{sync.error}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--line)]">
                <div>
                  <div className="mono cap text-[9px] text-[var(--muted)]">ITEMS</div>
                  <div className="text-[20px] font-semibold">{c.count.toLocaleString()}</div>
                </div>
                <div>
                  <div className="mono cap text-[9px] text-[var(--muted)]">CLAIMS</div>
                  <div className="text-[20px] font-semibold">{Math.floor(c.count * 0.18)}</div>
                </div>
                <div>
                  <div className="mono cap text-[9px] text-[var(--muted)]">FREQUENCY</div>
                  <div className={`mono cap text-[12px] mt-1 ${c.on ? "text-[var(--good)]" : "text-[var(--muted)]"}`}>
                    {c.on ? "EVERY 5M" : "PAUSED"}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 p-6 rounded-xl border border-dashed border-[var(--ember)]/30 bg-[var(--ember)]/5">
        <div className="mono cap text-[11px] text-[var(--ember)] mb-3">+ Add a source</div>
        <div className="flex gap-2 flex-wrap">
          {["Figma", "Linear", "Twitter/X", "Discord", "Apple Notes", "Obsidian", "Readwise", "Browser History"].map((n) => (
            <span key={n} className="mono cap text-[10px] px-3 py-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-1)] cursor-pointer hover:border-[var(--ember)]/40">
              + {n}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <ConnectGuide />
      </div>
    </div>
  );
}
