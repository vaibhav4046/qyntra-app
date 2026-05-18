"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ConnIcon } from "@/components/conn-icon";
import { CONNECTORS, ACTIVITY } from "@/lib/data";
import { ChatBubble } from "@/components/chat-bubble";
import { Search, ArrowRight, Sparkles, Beaker, Zap, Filter } from "lucide-react";
import { useProfileStore } from "@/lib/profile-store";

const demoStats = [
  { k: "PAGES", v: "9", d: "+2 today", c: "var(--ember)", href: "/read" },
  { k: "SOURCES", v: "142", d: "+18 this week", c: "var(--gold)", href: "/sources" },
  { k: "ENTITIES", v: "86", d: "+11 today", c: "var(--violet)", href: "/map-3d" },
  { k: "VERIFIED CLAIMS", v: "23/31", d: "74% verified", c: "var(--teal)", href: "/read" },
];

const emptyStats = [
  { k: "PAGES", v: "0", d: "Connect a source", c: "var(--ember)", href: "/sources" },
  { k: "SOURCES", v: "0", d: "0 items synced", c: "var(--gold)", href: "/sources" },
  { k: "ENTITIES", v: "0", d: "Awaiting first sync", c: "var(--violet)", href: "/map-3d" },
  { k: "VERIFIED CLAIMS", v: "0/0", d: "—", c: "var(--teal)", href: "/read" },
];

function firstName(s?: string | null): string {
  if (!s) return "Soldier";
  // Strip emails, take first token of name
  const cleaned = s.split("@")[0].split(/[. _-]/).filter(Boolean)[0] || "Soldier";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function greetingFor(hour: number): string {
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 8) return "Early bird";
  if (hour < 11) return "Good morning";
  if (hour < 13) return "Lunch break";
  if (hour < 16) return "Good afternoon";
  if (hour < 19) return "Coffee time";
  if (hour < 22) return "Good evening";
  return "Good night";
}

export default function HomePage() {
  const router = useRouter();
  const { demoMode, init, setDemoMode } = useProfileStore();
  const { data: session } = useSession();
  const [activityFilter, setActivityFilter] = useState<"all" | "claims" | "entities" | "imports">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => { init(); }, [init]);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const stats = demoMode ? demoStats : emptyStats;
  const connectors = demoMode ? CONNECTORS : CONNECTORS.map((c) => ({ ...c, on: false, count: 0 }));
  const activity = demoMode ? ACTIVITY : [];

  const userName = useMemo(
    () => firstName(session?.user?.name) || firstName(session?.user?.email),
    [session]
  );
  const greeting = useMemo(() => (now ? greetingFor(now.getHours()) : "Welcome back"), [now]);
  const tz = useMemo(() => {
    if (!now) return "";
    try {
      return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(now);
    } catch {
      return now.toLocaleTimeString();
    }
  }, [now]);

  const filteredActivity = activity.filter((a) => {
    if (activityFilter === "all") return true;
    const t = a.text.toLowerCase();
    if (activityFilter === "claims") return t.includes("claim");
    if (activityFilter === "entities") return t.includes("entity");
    if (activityFilter === "imports") return t.includes("import") || t.includes("compile");
    return true;
  });

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
          <div className="mono cap text-[11px] text-[var(--ember)] mb-2">{tz}</div>
          <h1 className="text-[28px] sm:text-[40px] font-bold tracking-tight leading-tight">
            {greeting}, {userName}.
          </h1>
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

      {/* Hero card → /map-3d */}
      <motion.button
        type="button"
        onClick={() => router.push("/map-3d")}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="block w-full text-left mb-6 p-5 sm:p-7 rounded-xl border border-[var(--line-2)] bg-gradient-to-br from-[var(--bg-1)] to-black relative overflow-hidden hover:border-[var(--ember)]/40 hover:bg-[var(--bg-2)]/40 transition cursor-pointer"
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
                ? "Walk the connections in the 3D Galaxy. Click any entity for details."
                : "Head to /sources to connect Notion, Drive, Gmail, GitHub, or Desktop. Each source populates your wiki after consent."}
            </p>
            <span className="mono cap text-[10px] text-[var(--ember)] mt-3 inline-flex items-center gap-1">
              Open the map <ArrowRight size={11} />
            </span>
          </div>
          <div className="flex gap-3 mono cap text-[10px]">
            <div className="px-3 py-2 rounded border border-[var(--line)]"><span className="text-[var(--muted)]">DEPTH</span> <strong>{demoMode ? 7 : 0}</strong></div>
            <div className="px-3 py-2 rounded border border-[var(--line)]"><span className="text-[var(--muted)]">BRANCHES</span> <strong>{demoMode ? 34 : 0}</strong></div>
            <div className="px-3 py-2 rounded border border-[var(--line)]"><span className="text-[var(--muted)]">LEAVES</span> <strong>{demoMode ? 219 : 0}</strong></div>
          </div>
        </div>
      </motion.button>

      {/* Clickable stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.button
            key={s.k}
            type="button"
            onClick={() => router.push(s.href)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="text-left p-4 sm:p-5 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--ember)]/40 hover:bg-[var(--bg-2)]/40 transition relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: s.c }} />
            <div className="mono cap text-[10px] text-[var(--muted)] mb-2">{s.k}</div>
            <div className="text-[28px] sm:text-[36px] font-bold tracking-tight">{s.v}</div>
            <div className="mono cap text-[10px] mt-1" style={{ color: s.c }}>{demoMode && "▲ "}{s.d}</div>
          </motion.button>
        ))}
      </div>

      {/* Activity + Connectors */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="p-5 sm:p-6 rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
          <div className="flex justify-between mb-4">
            <div className="mono cap text-[11px] text-[var(--ember)] flex items-center gap-2">
              Recent Activity <span className="px-1.5 py-0.5 text-[9px] rounded bg-[var(--good)]/20 text-[var(--good)]">LIVE</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className="mono cap text-[10px] text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1"
              >
                <Filter size={10} /> {activityFilter.toUpperCase()}
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-6 z-10 bg-[var(--bg-2)] border border-[var(--line-2)] rounded-md py-1 min-w-[140px] shadow-xl">
                  {["all", "claims", "entities", "imports"].map((f) => (
                    <button
                      key={f}
                      onClick={() => { setActivityFilter(f as "all" | "claims" | "entities" | "imports"); setFilterOpen(false); }}
                      className={`block w-full text-left px-3 py-1.5 mono cap text-[10px] ${activityFilter === f ? "text-[var(--ember)] bg-[var(--ember)]/10" : "text-[var(--text-2)] hover:bg-[var(--bg-1)]"}`}
                    >
                      {activityFilter === f ? "● " : "○ "}{f.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {filteredActivity.length === 0 ? (
            <div className="text-center py-10 text-[13px] text-[var(--muted)]">
              No activity yet. <Link href="/sources" className="text-[var(--ember)] hover:underline">Connect a source →</Link>
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredActivity.map((a, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href="/read"
                    className="flex items-start gap-3 py-2 px-2 -mx-2 rounded hover:bg-[var(--bg-2)]/60 transition cursor-pointer"
                  >
                    <span className="mt-1.5 size-1.5 rounded-full flex-shrink-0" style={{ background: `var(--${a.color})` }} />
                    <span className="flex-1 text-[13px]">{a.text}</span>
                    <span className="mono cap text-[10px] text-[var(--muted)]">{a.t}</span>
                  </Link>
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
              <Link
                key={c.id}
                href={`/sources?connector=${c.id}`}
                className="flex items-center gap-2.5 p-2.5 rounded border border-[var(--line)] hover:border-[var(--ember)]/40 hover:bg-[var(--bg-2)]/40 transition cursor-pointer"
              >
                <ConnIcon kind={c.icon} size={18} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] truncate">{c.name}</div>
                  <div className="mono cap text-[9px] text-[var(--muted)]">{c.count} items</div>
                </div>
                <span className={`size-1.5 rounded-full ${c.on ? "bg-[var(--good)]" : "bg-[var(--muted)]"}`} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <ChatBubble />
    </div>
  );
}
