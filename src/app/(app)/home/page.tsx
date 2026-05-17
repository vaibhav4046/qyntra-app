"use client";

import { motion } from "framer-motion";
import { ConnIcon } from "@/components/conn-icon";
import { CONNECTORS, ACTIVITY } from "@/lib/data";
import { ChatBubble } from "@/components/chat-bubble";
import { Search, ArrowRight, Sparkles } from "lucide-react";

const stats = [
  { k: "PAGES", v: "9", d: "+2 today", c: "var(--ember)" },
  { k: "SOURCES", v: "142", d: "+18 this week", c: "var(--gold)" },
  { k: "ENTITIES", v: "86", d: "+11 today", c: "var(--violet)" },
  { k: "VERIFIED CLAIMS", v: "23/31", d: "74% verified", c: "var(--teal)" },
];

export default function HomePage() {
  return (
    <div className="p-8 max-w-[1320px] mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-[40px] font-bold tracking-tight">Welcome back.</h1>
          <div className="mono cap text-[11px] text-[var(--muted)] mt-1">
            Your wiki · 9 pages · 142 sources · last compile 2m ago
          </div>
        </div>
        <div className="flex gap-2">
          <button className="mono cap text-[11px] px-4 py-2.5 rounded-md border border-[var(--line-2)] flex items-center gap-2 hover:bg-[var(--bg-1)]">
            <Search size={13} /> SEARCH <kbd className="text-[9px] opacity-50">K</kbd>
          </button>
          <button className="shimmer mono cap text-[11px] px-4 py-2.5 rounded-md font-semibold flex items-center gap-2 glow-ember text-white">
            ASK YOUR WIKI <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-7 rounded-xl border border-[var(--line-2)] bg-gradient-to-br from-[var(--bg-1)] to-black relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_70%_40%,rgba(255,193,92,0.25),transparent_50%)]" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="mono cap text-[11px] text-[var(--ember)] mb-3 flex items-center gap-2">
              <Sparkles size={12} /> Your memory · Living document
            </div>
            <h2 className="text-[28px] font-semibold tracking-tight max-w-[640px]">
              23 new claims grew on your tree today.
            </h2>
            <p className="text-[15px] text-[var(--text-2)] mt-2 max-w-[560px]">
              A unified context layer captures everything you read, write and decide. Open the map to walk the connections.
            </p>
          </div>
          <div className="flex gap-3 mono cap text-[10px]">
            <div className="px-3 py-2 rounded border border-[var(--line)]"><span className="text-[var(--muted)]">DEPTH</span> <strong>7</strong></div>
            <div className="px-3 py-2 rounded border border-[var(--line)]"><span className="text-[var(--muted)]">BRANCHES</span> <strong>34</strong></div>
            <div className="px-3 py-2 rounded border border-[var(--line)]"><span className="text-[var(--muted)]">LEAVES</span> <strong>219</strong></div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.k}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="p-5 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--line-2)] transition relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: s.c }} />
            <div className="mono cap text-[10px] text-[var(--muted)] mb-2">{s.k}</div>
            <div className="text-[36px] font-bold tracking-tight">{s.v}</div>
            <div className="mono cap text-[10px] mt-1" style={{ color: s.c }}>▲ {s.d}</div>
          </motion.div>
        ))}
      </div>

      {/* Activity + Connectors */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="p-6 rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
          <div className="flex justify-between mb-4">
            <div className="mono cap text-[11px] text-[var(--ember)] flex items-center gap-2">
              Recent Activity <span className="px-1.5 py-0.5 text-[9px] rounded bg-[var(--good)]/20 text-[var(--good)]">LIVE</span>
            </div>
            <button className="mono cap text-[10px] text-[var(--muted)] hover:text-[var(--text)]">FILTER</button>
          </div>
          <ul className="space-y-3">
            {ACTIVITY.map((a, i) => (
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
        </div>

        <div className="p-6 rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
          <div className="flex justify-between mb-4">
            <div className="mono cap text-[11px] text-[var(--ember)]">Connectors</div>
            <a href="/sources" className="mono cap text-[10px] text-[var(--muted)] hover:text-[var(--text)]">MANAGE →</a>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CONNECTORS.map((c) => (
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
