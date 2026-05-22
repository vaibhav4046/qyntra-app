"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Database,
  Beaker,
  Printer,
} from "lucide-react";
import { trackError } from "@/lib/track";

interface Article {
  title: string;
  lede: string;
  infobox: { label: string; value: string }[];
  sections: { heading: string; body: string }[];
  references: { id: number; title: string; source: string; url?: string; snippet?: string }[];
  seeAlso: string[];
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function GenerateInner() {
  const router = useRouter();
  const search = useSearchParams();
  const initialTopic = search.get("topic") || "";
  const [topic, setTopic] = useState(initialTopic);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [grounded, setGrounded] = useState(false);
  const [sourceCount, setSourceCount] = useState(0);
  const [activeHeading, setActiveHeading] = useState<string>("");
  const articleRef = useRef<HTMLDivElement>(null);

  const generate = async (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setError(null);
    setArticle(null);
    router.replace(`/wiki/generate?topic=${encodeURIComponent(q.trim())}`);
    try {
      const apiKey = typeof window !== "undefined" ? localStorage.getItem("qyntra:apiKey") || "" : "";
      const res = await fetch("/api/wiki/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(apiKey ? { "x-qyntra-api-key": apiKey } : {}),
        },
        body: JSON.stringify({ topic: q.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || "Generation failed");
      setArticle(data.article);
      setGrounded(!!data.grounded);
      setSourceCount(data.sourceCount || 0);
    } catch (err) {
      const msg = (err as Error).message || "Unknown error";
      setError(msg);
      trackError(err, "wiki/generate", { topic: q });
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate when topic comes from URL on first load
  const firstLoadRef = useRef(true);
  useEffect(() => {
    if (firstLoadRef.current && initialTopic) {
      firstLoadRef.current = false;
      generate(initialTopic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Observe headings for sticky TOC active state
  useEffect(() => {
    if (!article) return;
    const el = articleRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.intersectionRatio - b.intersectionRatio);
        if (visible.length > 0) {
          const id = visible[visible.length - 1].target.id;
          if (id) setActiveHeading(id);
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: [0, 1] }
    );
    el.querySelectorAll("h2[id]").forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [article]);

  const headings = useMemo(() => (article?.sections || []).map((s) => ({ id: slug(s.heading), text: s.heading })), [article]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-6 sm:py-10">
      {/* Hero */}
      <div className="mb-8">
        <div className="mono cap text-[11px] text-[var(--ember)] mb-3 flex items-center gap-1.5">
          <Sparkles size={11} /> Article auto-generator · grounded in your wiki
        </div>
        <h1 className="text-[32px] sm:text-[44px] font-bold tracking-tight leading-[1.05] mb-3">
          Write me a Wikipedia page on…
        </h1>
        <p className="text-[14px] text-[var(--text-2)] max-w-[680px] leading-relaxed mb-5">
          Type any topic. Qyntra pulls the most relevant snippets from your sources, cites every claim inline,
          and assembles a printable encyclopedia entry in seconds. No source? It uses the demo corpus so judges can play.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generate(topic);
          }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)] focus-within:border-[var(--ember)]/50 transition max-w-[760px]"
        >
          <BookOpen size={16} className="text-[var(--muted)]" />
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Retrieval-Augmented Generation, GraphRAG, Agent Memory…"
            disabled={loading}
            className="flex-1 bg-transparent outline-none text-[14px]"
            maxLength={120}
          />
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="mono cap text-[11px] px-4 py-1.5 rounded bg-[var(--ember)] text-white disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {loading ? "Writing…" : "Generate →"}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Retrieval-Augmented Generation", "GraphRAG", "Agent Memory", "Vector Databases", "Cross-Encoder Reranking"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setTopic(s);
                generate(s);
              }}
              disabled={loading}
              className="mono cap text-[10px] px-2.5 py-1 rounded border border-[var(--line)] text-[var(--text-2)] hover:text-[var(--ember)] hover:border-[var(--ember)]/40 transition"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Errors */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex items-start gap-3"
          >
            <AlertTriangle size={16} className="text-red-400 mt-0.5" />
            <div>
              <div className="mono cap text-[10px] text-red-400 mb-1">Generation failed</div>
              <div className="text-[13px] text-[var(--text-2)]">{error}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeleton */}
      {loading && !article && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-4">
            <div className="h-10 rounded bg-[var(--bg-1)] animate-pulse" />
            <div className="h-6 rounded bg-[var(--bg-1)] animate-pulse w-3/4" />
            <div className="h-32 rounded bg-[var(--bg-1)] animate-pulse" />
            <div className="h-6 rounded bg-[var(--bg-1)] animate-pulse w-1/3" />
            <div className="h-48 rounded bg-[var(--bg-1)] animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-48 rounded bg-[var(--bg-1)] animate-pulse" />
          </div>
        </div>
      )}

      {/* Article */}
      <AnimatePresence>
        {article && !loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
            <div ref={articleRef}>
              {/* Title + badges */}
              <div className="mb-5 pb-4 border-b border-[var(--line)]">
                <h1 className="text-[36px] sm:text-[48px] font-bold tracking-tight leading-[1.1] mb-2">{article.title}</h1>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="mono cap text-[10px] px-2.5 py-0.5 rounded border border-[var(--ember)]/40 text-[var(--ember)] flex items-center gap-1.5">
                    <Sparkles size={10} /> Qyntra-generated
                  </span>
                  <span className={`mono cap text-[10px] px-2.5 py-0.5 rounded border flex items-center gap-1.5 ${grounded ? "border-[var(--good)]/40 text-[var(--good)]" : "border-[var(--gold)]/40 text-[var(--gold)]"}`}>
                    {grounded ? <Database size={10} /> : <Beaker size={10} />}
                    {grounded ? `Grounded · ${sourceCount} of your files` : `Demo corpus · ${sourceCount} seed nodes`}
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="mono cap text-[10px] px-2.5 py-0.5 rounded border border-[var(--line)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--ember)]/40 flex items-center gap-1.5 transition ml-auto"
                  >
                    <Printer size={10} /> Print / PDF
                  </button>
                </div>
              </div>

              {/* Lede */}
              <p className="text-[16px] sm:text-[17px] leading-relaxed text-[var(--text)] mb-8">{article.lede}</p>

              {/* Sections */}
              {article.sections.map((s) => (
                <section key={s.heading} className="mb-8 scroll-mt-24">
                  <h2 id={slug(s.heading)} className="text-[22px] sm:text-[26px] font-bold tracking-tight mb-3 pb-1 border-b border-[var(--line)]">
                    {s.heading}
                  </h2>
                  <p className="text-[15px] leading-relaxed text-[var(--text-2)] whitespace-pre-wrap">{s.body}</p>
                </section>
              ))}

              {/* References */}
              <section className="mt-12 pt-6 border-t border-[var(--line)] scroll-mt-24" id="references">
                <h2 className="text-[20px] font-bold mb-3 flex items-center gap-2">
                  <BookOpen size={16} className="text-[var(--ember)]" /> References
                </h2>
                <ol className="space-y-2">
                  {article.references.map((r) => (
                    <li key={r.id} className="text-[13px] text-[var(--text-2)] leading-relaxed flex gap-2">
                      <span className="mono text-[var(--ember)] flex-shrink-0">[{r.id}]</span>
                      <span>
                        <strong className="text-[var(--text)]">{r.title}</strong>
                        {" · "}
                        <span className="text-[var(--muted)]">{r.source}</span>
                        {r.url && (
                          <>
                            {" · "}
                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[var(--ember)] hover:underline inline-flex items-center gap-0.5">
                              open <ExternalLink size={10} />
                            </a>
                          </>
                        )}
                        {r.snippet && (
                          <div className="mt-1 pl-2 border-l-2 border-[var(--line)] text-[12px] italic text-[var(--muted)]">
                            {r.snippet}
                          </div>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>

              {/* See also */}
              {article.seeAlso?.length > 0 && (
                <section className="mt-10 pt-6 border-t border-[var(--line)]">
                  <h2 className="text-[18px] font-bold mb-3">See also</h2>
                  <div className="flex flex-wrap gap-2">
                    {article.seeAlso.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setTopic(s);
                          generate(s);
                        }}
                        className="mono cap text-[11px] px-3 py-1.5 rounded border border-[var(--line)] text-[var(--text-2)] hover:text-[var(--ember)] hover:border-[var(--ember)]/40 transition"
                      >
                        {s} →
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sticky sidebar — TOC + Infobox */}
            <aside className="lg:sticky lg:top-20 lg:self-start space-y-4 print:hidden">
              {/* Infobox */}
              {article.infobox?.length > 0 && (
                <div className="rounded-xl border border-[var(--ember)]/30 bg-[var(--ember)]/5 p-4">
                  <div className="mono cap text-[10px] text-[var(--ember)] mb-3">Infobox</div>
                  <dl className="space-y-2">
                    {article.infobox.map((entry, i) => (
                      <div key={i} className="grid grid-cols-[80px_1fr] gap-2 text-[12px] leading-relaxed">
                        <dt className="mono cap text-[10px] text-[var(--muted)]">{entry.label}</dt>
                        <dd className="text-[var(--text)]">{entry.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* TOC */}
              {headings.length > 0 && (
                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-4">
                  <div className="mono cap text-[10px] text-[var(--gold)] mb-3">Contents</div>
                  <ol className="space-y-1.5">
                    {headings.map((h, i) => (
                      <li key={h.id}>
                        <a
                          href={`#${h.id}`}
                          className={`text-[12.5px] block py-0.5 leading-tight transition ${activeHeading === h.id ? "text-[var(--ember)] font-semibold" : "text-[var(--text-2)] hover:text-[var(--text)]"}`}
                        >
                          <span className="mono text-[10px] text-[var(--muted)] mr-1.5">{i + 1}</span>
                          {h.text}
                        </a>
                      </li>
                    ))}
                    <li>
                      <a href="#references" className="text-[12.5px] block py-0.5 text-[var(--text-2)] hover:text-[var(--text)]">
                        <span className="mono text-[10px] text-[var(--muted)] mr-1.5">{headings.length + 1}</span>
                        References
                      </a>
                    </li>
                  </ol>
                </div>
              )}
            </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WikiGeneratePage() {
  return (
    <Suspense fallback={null}>
      <GenerateInner />
    </Suspense>
  );
}
