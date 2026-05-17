"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ConnIcon } from "@/components/conn-icon";
import { CONNECTORS, ACTIVITY } from "@/lib/data";
import { ChatBubble } from "@/components/chat-bubble";
import { Search, ArrowRight, Sparkles, Beaker, Zap } from "lucide-react";
import { useProfileStore } from "@/lib/profile-store";

const demoStats = [
  { k: "PAGES", v: "9", d: "+2 today", c: "var(--ember)" },
  { k: "SOURCES", v: "142", d: "+18 this week", c: "var(--gold)" },
  { k: "ENTITIES", v: "86", d: "+11 today", c: "var(--violet)" },
  { k: "VERIFIED CLAIMS", v: "23/31", d: "74% verified", c: "var(--teal)" },
];

const emptyStats = [
  { k: "PAGES", v: "0", d: "Connect a source", c: "var(--ember)" },
  { k: "SOURCES", v: "0", d: "0 items synced", c: "var(--gold)" },
  { k: "ENTITIES", v: "0", d: "Awaiting first sync", c: "var(--violet)" },
  { k: "VERIFIED CLAIMS", v: "0/0", d: "—", c: "var(--teal)" },
];

export default function HomePage() {
  const { demoMode, init, setDemoMode } = useProfileStore();
  useEffect(() => { init(); }, [init]);

  const stats = demoMode ? demoStats : emptyStats;
  const connectors = demoMode ? CONNECTORS : CONNECTORS.map((c) => ({ ...c, on: false, count: 0 }));
  const activity = demoMode ? ACTIVITY : [];

  return (
    <div className="p-4 sm:p-8 max-w-[1320px] mx-auto">
      {/* Demo banner */}
      <div className="mb-6 p-3 sm:p-4 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="size-9 rounded bg-[var(--gold)]/20 border border-[var(--gold)]/40 flex items-center justify-center flex-shrink-0">
            <Beaker size={16} className="text-[var(--gold)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="pixel text-[13px] text-white">
              {demoMode ? "Demo mode ON — showing sample wiki." : "Live workspace — your data only."}
            </div>
            <div className="pixel text-[11px] text-[var(--muted)]">
              {demoMode ? "Toggle off to see only your real synced data." : "Turn demo on anytime to explore features with sample content."}
            </div>
          </div>
        </div>
        <button
          onClick={() => setDemoMode(!demoMode)}
          className={`pixel text-[12px] px-4 py-2 rounded transition flex items-center gap-2 flex-shrink-0 ${
            demoMode
              ? "bg-[var(--gold)] text-black hover:bg-[var(--gold)]/80"
              : "border border-[var(--gold)]/50 text-[var(--gold)] hover:bg-[var(--gold)]/10"
          }`}
        >
          <Zap size={12} />
          {demoMode ? "Demo: ON" : "Turn Demo ON"}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-[28px] sm:text-[40px] font-bold tracking-tight leading-tight">Welcome back.</h1>
          <div className="mono cap text-[11px] text-[var(--muted)] mt-1">
            {demoMode
              ? "Your wiki · 9 pages · 142 sources · last compile 2m ago"
              : "Empty workspace · connect sources to start"}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/ask" className="mono cap text-[11px] px-4 py-2.5 rounded-md border border-[var(--line-2)] flex items-center gap-2 hover:bg-[var(--bg-1)]">
            <Search size={13} /> SEARCH <kbd className="text-[9px] opacity-50">K</kbd>
          </Link>
          <Link href="/ask" className="shimmer mono cap text-[11px] px-4 py-2.5 rounded-md font-semibold flex items-center gap-2 glow-ember text-white">
            ASK YOUR WIKI <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-5 sm:p-7 rounded-xl border border-[var(--line-2)] bg-gradient-to-br from-[var(--bg-1)] to-black relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_70%_40%,rgba(255,193,92,0.25),transparent_50%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="mono cap text-[11px] text-[var(--ember)] mb-3 flex items-center gap-2">
              <Sparkles size={12} /> Your memory · Living document
            </div>
            <h2 className="text-[22px] sm:text-[28px] font-semibold tracking-tight max-w-[640px] leading-tight">
              {demoMode ? "23 new claims grew on your tree today." : "Plant your first source."}
            </h2>
            <p className="text-[14px] sm:text-[15px] text-[var(--text-2)] mt-2 max-w-[560px]">
              {demoMode
                ? "A unified context layer captures everything you read, write and decide. Open the map to walk the connections."
                : "Head to /sources to connect Notion, Drive, Gmail, Slack, or GitHub. Each source instantly populates your wiki."}
            </p>
          </div>
          <div className="flex gap-3 mono cap text-[10px]">
            <div className="px-3 py-2 rounded border border-[var(--line)]"><span className="text-[var(--muted)]">DEPTH</span> <strong>{demoMode ? 7 : 0}</strong></div>
            <div className="px-3 py-2 rounded border border-[var(--line)]"><span className="text-[var(--muted)]">BRANCHES</span> <strong>{demoMode ? 34 : 0}</strong></div>
            <div className="px-3 py-2 rounded border border-[var(--line)]"><span className="text-[var(--muted)]">LEAVES</span> <strong>{demoMode ? 219 : 0}</strong></div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.k}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="p-4 sm:p-5 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--line-2)] transition relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: s.c }} />
            <div className="mono cap text-[10px] text-[var(--muted)] mb-2">{s.k}</div>
            <div className="text-[28px] sm:text-[36px] font-bold tracking-tight">{s.v}</div>
            <div className="mono cap text-[10px] mt-1" style={{ color: s.c }}>{demoMode && "▲ "}{s.d}</div>
          </motion.div>
        ))}
      </div>

      {/* Activity + Connectors */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="p-5 sm:p-6 rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
          <div className="flex justify-between mb-4">
            <div className="mono cap text-[11px] text-[var(--ember)] flex items-center gap-2">
              Recent Activity <span className="px-1.5 py-0.5 text-[9px] rounded bg-[var(--good)]/20 text-[var(--good)]">LIVE</span>
            </div>
            <button className="mono cap text-[10px] text-[var(--muted)] hover:text-[var(--text)]">FILTER</button>
          </div>
          {activity.length === 0 ? (
            <div className="text-center py-10 text-[13px] text-[var(--muted)]">
              No activity yet. <Link href="/sources" className="text-[var(--ember)] hover:underline">Connect a source →</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {activity.map((a, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 py-2 border-b border-[var(--line)] last:border-0"
                >
                  <span className="mt-1.5 size-1.5 rounded-full" style={{ background: `var(--${a.color})` }} />
                  <span className="flex-1 text-[13px]">{a.text}</span>
                  <span className="mono cap text-[10px] text-[var(--muted)]">{a.t}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-5 sm:p-6 rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
          <div className="flex justify-between mb-4">
            <div className="mono cap text-[11px] text-[var(--ember)]">Connectors</div>
            <Link href="/sources" className="mono cap text-[10px] text-[var(--muted)] hover:text-[var(--text)]">MANAGE →</Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {connectors.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 p-2.5 rounded border border-[var(--line)] hover:border-[var(--line-2)] transition">
                <ConnIcon kind={c.icon} size={18} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] truncate">{c.name}</div>
                  <div className="mono cap text-[9px] text-[var(--muted)]">{c.count} items</div>
                </div>
                <span className={`size-1.5 rounded-full ${c.on ? "bg-[var(--good)]" : "bg-[var(--muted)]"}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <ChatBubble />
    </div>
  );
}
