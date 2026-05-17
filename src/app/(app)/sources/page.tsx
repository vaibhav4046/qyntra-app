"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { type QConnector } from "@/lib/data";
import { ConnIcon } from "@/components/conn-icon";
import { signIn, useSession } from "next-auth/react";
import { useConnectorStore } from "@/lib/connector-store";

export default function SourcesPage() {
  const { data: session } = useSession();
  const { connectors: conns, syncing, init, toggle } = useConnectorStore();

  useEffect(() => { init(); }, [init]);

  async function connectReal(c: QConnector) {
    if (c.provider === "google") signIn("google", { callbackUrl: "/sources" });
    else if (c.provider === "notion") signIn("notion", { callbackUrl: "/sources" });
    else if (c.provider === "slack") signIn("slack", { callbackUrl: "/sources" });
    else if (c.provider === "github") signIn("github", { callbackUrl: "/sources" });
    else if (c.provider === "linkedin") signIn("linkedin", { callbackUrl: "/sources" });
  }

  const onCount = conns.filter((x) => x.on).length;

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="mono cap text-[11px] text-[var(--ember)] mb-2">Surface 04 · Manage your connectors</div>
        <h1 className="text-[36px] font-bold tracking-tight">Plug in everywhere you already remember.</h1>
        <p className="mono cap text-[11px] text-[var(--muted)] mt-2">
          CONNECTORS · {onCount} OF {conns.length} ACTIVE · LOCAL-FIRST INGESTION{session?.user && ` · LOGGED IN AS ${session.user.email}`}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {conns.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="p-6 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--line-2)] transition"
          >
            <div className="flex items-center justify-between mb-5">
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
              <div className="flex gap-2">
                {c.provider && c.provider !== "local" && !c.on && (
                  <button
                    onClick={() => connectReal(c)}
                    className="mono cap text-[10px] px-3 py-1.5 rounded border border-[var(--ember)]/40 text-[var(--ember)] hover:bg-[var(--ember)]/10"
                  >
                    OAUTH
                  </button>
                )}
                <button
                  onClick={() => toggle(c)}
                  className={`relative w-12 h-6 rounded-full transition ${c.on ? "bg-[var(--ember)]" : "bg-[var(--bg-3)]"}`}
                >
                  <span
                    className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${c.on ? "translate-x-[26px]" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
            </div>
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
        ))}
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
    </div>
  );
}
