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
import { useProfileStore } from "@/lib/profile-store";

interface SyncState {
  loading: boolean;
  message?: string;
  count?: number;
  error?: string;
}

export default function SourcesPage() {
  const { data: session } = useSession();
  const { demoMode } = useProfileStore();
  const { connectors: conns, syncing, init, toggle } = useConnectorStore();
  const [syncs, setSyncs] = useState<Record<string, SyncState>>({});

  useEffect(() => {
    init();
  }, [init]);

  function connectReal(c: QConnector) {
    const providerId = c.provider;
    if (!providerId || providerId === "local") return;
    // Auth.js v5 beta.31 client bug: signIn() uses broken GET redirect.
    // POST a form directly to /api/auth/signin/{provider} instead.
    fetch("/api/auth/csrf", { credentials: "include" })
      .then((r) => r.json())
      .then(({ csrfToken }) => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = `/api/auth/signin/${providerId}`;
        form.style.display = "none";

        const cb = document.createElement("input");
        cb.type = "hidden"; cb.name = "callbackUrl"; cb.value = "/sources";
        form.appendChild(cb);

        const csrf = document.createElement("input");
        csrf.type = "hidden"; csrf.name = "csrfToken"; csrf.value = csrfToken;
        form.appendChild(csrf);

        document.body.appendChild(form);
        form.submit();
      })
      .catch(() => signIn(providerId, { callbackUrl: "/sources" }));
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
      setSyncs((s) => ({
        ...s,
        [c.id]: {
          loading: false,
          count: json.inserted,
          message: `Synced ${json.inserted} items`,
        },
      }));
    } catch (err) {
      setSyncs((s) => ({ ...s, [c.id]: { loading: false, error: (err as Error).message } }));
    }
  }

  function markDesktopIngested(count: number) {
    setSyncs((s) => ({
      ...s,
      desktop: {
        loading: false,
        count,
        message: count > 0 ? `Ingested ${count} desktop files` : "No matching desktop files found",
      },
    }));
  }

  const onCount = conns.filter((x) => x.on).length;

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="mono cap text-[11px] text-[var(--ember)] mb-2">Surface 04 - Manage your connectors</div>
        <h1 className="text-[26px] sm:text-[36px] font-bold tracking-tight leading-tight">Plug in everywhere you already remember.</h1>
        <p className="mono cap text-[11px] text-[var(--muted)] mt-2">
          CONNECTORS - {onCount} OF {conns.length} ACTIVE - LOCAL-FIRST INGESTION{session?.user && ` - ${session.user.email}`}
        </p>
      </div>

      {demoMode && (
        <div className="mb-6 p-3 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/5 flex items-start gap-3">
          <AlertCircle size={16} className="text-[var(--gold)] mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-[13px] text-[var(--text-2)] leading-relaxed">
            <strong className="text-[var(--gold)]">Demo mode is ON.</strong> Connector data shown below is sample data — toggle this off in your avatar menu to connect real Drive, Gmail, Notion, and GitHub accounts via OAuth.
          </div>
        </div>
      )}

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
                    {(() => {
                      const isDemo = demoMode && c.on;
                      const label = syncing[c.id]
                        ? "SYNCING..."
                        : isDemo
                        ? `DEMO - SAMPLE DATA - ${c.count} ITEMS`
                        : c.on
                        ? `LIVE - ${c.count} ITEMS`
                        : "NOT CONNECTED";
                      const color = syncing[c.id]
                        ? "var(--gold)"
                        : isDemo
                        ? "var(--gold)"
                        : c.on
                        ? "var(--good)"
                        : "var(--muted)";
                      return (
                        <div className="mono cap text-[10px]" style={{ color }}>
                          {label}
                        </div>
                      );
                    })()}
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
                        disabled={sync?.loading || demoMode}
                        title={demoMode ? "Turn demo mode off to sync real data" : "Sync now"}
                        className="mono cap text-[10px] px-3 py-1.5 rounded border border-[var(--gold)]/40 text-[var(--gold)] hover:bg-[var(--gold)]/10 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw size={11} className={sync?.loading ? "animate-spin" : ""} />
                        {sync?.loading ? "SYNCING" : "SYNC"}
                      </button>
                    </>
                  )}
                  {c.provider === "local" && <AutoIngestButton onComplete={markDesktopIngested} />}
                  <button
                    onClick={() => toggle(c)}
                    aria-label={c.on ? "Disable connector" : "Enable connector"}
                    aria-pressed={c.on}
                    title={c.on ? "Click to pause this connector" : "Click to enable this connector"}
                    className={`relative inline-flex items-center w-[58px] h-7 rounded-full border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--ember)]/50 ${
                      c.on
                        ? "bg-[var(--ember)] border-[var(--ember)]"
                        : "bg-[var(--bg-3)] border-[var(--line-2)]"
                    }`}
                  >
                    <span
                      className={`absolute top-1/2 -translate-y-1/2 size-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        c.on ? "translate-x-[33px]" : "translate-x-1"
                      }`}
                    />
                    <span
                      className={`mono cap text-[8px] font-bold pointer-events-none select-none transition-opacity duration-200 ${
                        c.on
                          ? "opacity-100 text-white ml-1.5"
                          : "opacity-100 text-[var(--muted)] ml-[28px]"
                      }`}
                    >
                      {c.on ? "ON" : "OFF"}
                    </span>
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
