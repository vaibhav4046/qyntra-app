"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Shuffle,
  BookOpen,
  Hash,
  Lightbulb,
  Calendar,
  TrendingUp,
  Globe,
  FileText,
  Users,
  FolderTree,
  Beaker,
} from "lucide-react";
import { NODES, FILES_SEED, CONNECTORS } from "@/lib/data";

const CATEGORIES = [
  { key: "concepts", label: "Concepts", icon: BookOpen, count: 42 },
  { key: "projects", label: "Projects", icon: FolderTree, count: 18 },
  { key: "people", label: "People", icon: Users, count: 23 },
  { key: "papers", label: "Papers", icon: FileText, count: 31 },
  { key: "tools", label: "Tools", icon: Beaker, count: 14 },
  { key: "meetings", label: "Meetings", icon: Calendar, count: 27 },
];

const DID_YOU_KNOW = [
  "You've mentioned “attention mechanism” in 47 files across 12 sources.",
  "Your Voyage 3 retrieval notes contradict your earlier GraphRAG claim — flagged 3d ago.",
  "Across your corpus, the word “contradiction” appears 31% more in Q3 than Q2.",
  "Your most-cited entity is HyDE — referenced by 14 separate wiki pages.",
  "On Aug 14, you wrote: “memory as a feature, not a bug” — quoted twice since.",
];

const ON_THIS_DAY = [
  { year: "1 year ago", text: "You saved 3 papers about transformers and started the Agent Memory page." },
  { year: "6 months ago", text: "Drafted the first GraphRAG vs RAG comparison — still your most-viewed page." },
];

export default function WikiHomePage() {
  const [q, setQ] = useState("");
  const [shuffled, setShuffled] = useState(0);

  // Pick rotating tips
  const dyk = useMemo(() => DID_YOU_KNOW[shuffled % DID_YOU_KNOW.length], [shuffled]);

  useEffect(() => {
    const id = setInterval(() => setShuffled((s) => s + 1), 9000);
    return () => clearInterval(id);
  }, []);

  // Featured = first node
  const featured = NODES[0];
  const recent = FILES_SEED.slice(0, 4);

  const stats = {
    pages: NODES.filter((n) => n.type === "page").length + FILES_SEED.length,
    entities: NODES.filter((n) => n.type === "entity").length,
    claims: NODES.filter((n) => n.type === "claim").length,
    citations: 138,
    sources: CONNECTORS.filter((c) => c.on).length,
    memoryPoints: 2412,
  };

  function randomPage() {
    const pickFrom = NODES.filter((n) => n.type === "page");
    const pick = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    if (pick) window.location.href = `/read?node=${pick.id}`;
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6 sm:py-10">
      {/* Hero search */}
      <div className="text-center mb-10">
        <div className="mono cap text-[11px] text-[var(--ember)] mb-3">Surface 05 · Your private Wikipedia</div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[36px] sm:text-[56px] font-bold tracking-tight leading-[1.05]"
        >
          Qyntra · Wiki
        </motion.h1>
        <p className="text-[14px] sm:text-[16px] text-[var(--text-2)] mt-3 max-w-[640px] mx-auto leading-relaxed">
          A living encyclopaedia compiled from <strong className="text-[var(--text)]">your</strong> notes, files, papers and conversations.
          Every claim cited. Every entity linked. Updated as you ingest.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) window.location.href = `/wiki/generate?topic=${encodeURIComponent(q.trim())}`;
          }}
          className="mt-6 max-w-[680px] mx-auto flex items-center gap-2 px-4 py-3 rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)] focus-within:border-[var(--ember)]/50 transition"
        >
          <Sparkles size={16} className="text-[var(--ember)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Write me a Wikipedia page on… (or Random / Ask)"
            className="flex-1 bg-transparent outline-none text-[14px]"
          />
          <button
            type="button"
            onClick={randomPage}
            title="Surprise me"
            className="mono cap text-[10px] px-2.5 py-1.5 rounded border border-[var(--line)] hover:border-[var(--ember)]/40 text-[var(--text-2)] flex items-center gap-1.5"
          >
            <Shuffle size={12} /> RANDOM
          </button>
          <button
            type="submit"
            className="mono cap text-[10px] px-3 py-1.5 rounded bg-[var(--ember)] text-white inline-flex items-center gap-1.5"
          >
            <Sparkles size={11} /> GENERATE →
          </button>
        </form>
        <div className="mt-2 text-[11px] text-[var(--muted)]">
          New: <Link href="/ask" className="underline hover:text-[var(--ember)]">Ask</Link> · <Link href="/wiki/generate" className="underline hover:text-[var(--ember)]">/wiki article auto-generator</Link>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* LEFT — Featured + Recent + Stats */}
        <div className="space-y-6">
          {/* Featured Article */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[var(--ember)]/30 bg-[var(--ember)]/5 p-6"
          >
            <div className="mono cap text-[10px] text-[var(--ember)] mb-2 flex items-center gap-1.5">
              <TrendingUp size={11} /> TODAY'S FEATURED ARTICLE
            </div>
            <h2 className="text-[26px] font-bold tracking-tight mb-2">{featured.label}</h2>
            <p className="text-[14px] text-[var(--text-2)] leading-relaxed mb-4">
              The architectural pattern of letting the model <em>not</em> know things — retrieve the relevant fragment
              per query and ground generation on it. Catalogued across 7 of your files, with 23 distinct claims and
              11 linked entities.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-4 mono cap text-[10px] text-[var(--muted)]">
              <span><strong className="text-[var(--ember)]">7</strong> sources</span>
              <span><strong className="text-[var(--gold)]">23</strong> claims</span>
              <span><strong className="text-[var(--violet)]">11</strong> entities</span>
              <span><strong className="text-[var(--good)]">87%</strong> confidence</span>
            </div>
            <Link
              href={`/read?node=${featured.id}`}
              className="mono cap text-[11px] px-4 py-2 rounded bg-[var(--ember)] text-white inline-flex items-center gap-2 hover:bg-[var(--ember-2)] transition"
            >
              Read the full article →
            </Link>
          </motion.section>

          {/* Did You Know */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-5"
          >
            <div className="mono cap text-[10px] text-[var(--gold)] mb-2 flex items-center gap-1.5">
              <Lightbulb size={11} /> DID YOU KNOW
            </div>
            <motion.p
              key={dyk}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[14.5px] leading-relaxed text-[var(--text)]"
            >
              … {dyk}
            </motion.p>
          </motion.section>

          {/* Recent Activity (new pages) */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-5"
          >
            <div className="mono cap text-[10px] text-[var(--ember)] mb-3 flex items-center gap-1.5">
              <Sparkles size={11} /> IN THE NEWS · YOUR RECENT INGESTIONS
            </div>
            <div className="space-y-2">
              {recent.map((f) => (
                <Link
                  key={f.id}
                  href={`/read?node=${f.id}`}
                  className="block p-3 rounded border border-transparent hover:border-[var(--ember)]/30 hover:bg-[var(--bg-2)] transition group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="mono cap text-[9px] text-[var(--ember)]">◆ {f.kind}</span>
                    <span className="mono cap text-[9px] text-[var(--muted)]">from {f.source}</span>
                  </div>
                  <div className="text-[14px] font-medium group-hover:text-[var(--ember)] transition">
                    {f.title}
                  </div>
                  <div className="text-[12px] text-[var(--text-2)] mt-0.5 line-clamp-1">{f.sub}</div>
                </Link>
              ))}
            </div>
          </motion.section>

          {/* On This Day */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-5"
          >
            <div className="mono cap text-[10px] text-[var(--violet)] mb-3 flex items-center gap-1.5">
              <Calendar size={11} /> ON THIS DAY
            </div>
            <div className="space-y-3">
              {ON_THIS_DAY.map((e, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mono cap text-[10px] text-[var(--gold)] w-24 flex-shrink-0">{e.year}</div>
                  <div className="text-[13.5px] text-[var(--text-2)] leading-relaxed">{e.text}</div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* RIGHT — Stats + Categories */}
        <div className="space-y-6">
          {/* Stats */}
          <motion.section
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)] p-5"
          >
            <div className="mono cap text-[10px] text-[var(--ember)] mb-4 flex items-center gap-1.5">
              <Hash size={11} /> WIKI STATISTICS
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Wiki Pages" value={stats.pages} accent="ember" />
              <StatBox label="Entities" value={stats.entities} accent="violet" />
              <StatBox label="Claims" value={stats.claims} accent="gold" />
              <StatBox label="Citations" value={stats.citations} accent="teal" />
              <StatBox label="Sources" value={stats.sources} accent="good" />
              <StatBox label="Memory Points" value={stats.memoryPoints.toLocaleString()} accent="ember" />
            </div>
          </motion.section>

          {/* Categories */}
          <motion.section
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-5"
          >
            <div className="mono cap text-[10px] text-[var(--gold)] mb-3 flex items-center gap-1.5">
              <FolderTree size={11} /> CATEGORIES
            </div>
            <div className="space-y-1">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                return (
                  <Link
                    key={c.key}
                    href={`/read?category=${c.key}`}
                    className="flex items-center gap-3 px-3 py-2 rounded hover:bg-[var(--bg-2)] transition group"
                  >
                    <Icon size={14} className="text-[var(--ember)]" />
                    <span className="flex-1 text-[13.5px] group-hover:text-[var(--ember)] transition">
                      {c.label}
                    </span>
                    <span className="mono cap text-[10px] text-[var(--muted)]">{c.count}</span>
                  </Link>
                );
              })}
            </div>
          </motion.section>

          {/* Random page CTA */}
          <motion.button
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={randomPage}
            className="w-full p-5 rounded-xl border border-dashed border-[var(--ember)]/40 hover:bg-[var(--ember)]/10 hover:border-[var(--ember)] transition text-left group"
          >
            <div className="mono cap text-[10px] text-[var(--ember)] mb-2 flex items-center gap-1.5">
              <Shuffle size={11} /> SURPRISE ME
            </div>
            <div className="text-[15px] font-semibold mb-1 group-hover:text-[var(--ember)] transition">
              Resurface forgotten knowledge
            </div>
            <div className="text-[12px] text-[var(--text-2)] leading-relaxed">
              Click for a random wiki page from your corpus. Often the most useful — things you forgot you knew.
            </div>
          </motion.button>

          {/* External (web search) */}
          <motion.section
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-5"
          >
            <div className="mono cap text-[10px] text-[var(--teal)] mb-2 flex items-center gap-1.5">
              <Globe size={11} /> EXTERNAL · HYBRID SEARCH
            </div>
            <p className="text-[12.5px] text-[var(--text-2)] leading-relaxed mb-3">
              Ask Qyntra and check the real web at the same time. Cited answers from your memory + live sources.
            </p>
            <Link
              href="/ask"
              className="mono cap text-[11px] px-3 py-2 rounded border border-[var(--teal)]/40 text-[var(--teal)] hover:bg-[var(--teal)]/10 inline-flex items-center gap-2 transition"
            >
              Open hybrid Ask →
            </Link>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  const c: Record<string, string> = {
    ember: "var(--ember)",
    gold: "var(--gold)",
    violet: "var(--violet)",
    teal: "var(--teal)",
    good: "var(--good)",
  };
  return (
    <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
      <div className="mono cap text-[9px] text-[var(--muted)] mb-1">{label}</div>
      <div className="text-[22px] font-bold" style={{ color: c[accent] || "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}
