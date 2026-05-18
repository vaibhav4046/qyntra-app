"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { NODES, PREDICTIONS } from "@/lib/data";
import { Sparkles, ArrowRight, Check } from "lucide-react";

const ARTICLE_TEMPLATES: Record<string, { kind: string; deck: string; body: { h?: string; ps: string[]; concepts?: string[] }[] }> = {
  rag: {
    kind: "TECHNIQUE · SYNTHESIZED",
    deck: "A pattern catalogue for retrieval-augmented generation, distilled from your notes, papers and side conversations.",
    body: [
      { h: "What it is, in your words", ps: ["Retrieval-augmented generation is the architectural choice to let the model not know things. Instead of stuffing knowledge into weights, you keep it in a store, retrieve the relevant fragment per query, and ground the model on it.", "You first wrote about this in Aug 14's standup, framing it as memory as a feature, not a bug."], concepts: ["weights", "Aug 14 standup"] },
      { h: "The three layers", ps: ["Retrieval does a sparse pass (BM25), a dense pass (vector search), unifies via reciprocal rank fusion, then reranks with a cross-encoder.", "Augmentation uses HyDE for short queries; query decomposition for multi-hop; and a small reranker tuned on your own clickthrough data."], concepts: ["BM25", "cross-encoder", "HyDE", "vector search"] },
    ],
  },
  graphRag: {
    kind: "PAPER · arXiv",
    deck: "Microsoft research on knowledge-graph-guided generation — entity-anchored retrieval that cuts hallucinations.",
    body: [
      { h: "Why graphs", ps: ["GraphRAG anchors retrieval on extracted entities and their relationships rather than chunked text alone. On multi-hop questions over community-level concepts, it reportedly cuts unsupported claims by 38%.", "The Microsoft Research group released a reference implementation in 2024."], concepts: ["entities", "Microsoft Research", "community-level"] },
    ],
  },
};

export default function ReadPage() {
  const [current, setCurrent] = useState("rag");
  const [trail, setTrail] = useState(["rag"]);
  const [visited, setVisited] = useState<Set<string>>(new Set(["rag"]));

  const article = ARTICLE_TEMPLATES[current] || ARTICLE_TEMPLATES.rag;
  const node = NODES.find((n) => n.id === current);
  const preds = PREDICTIONS[current] || [];
  const goldNext = preds[0];

  function nav(id: string) {
    setCurrent(id);
    setTrail((t) => [...t, id]);
    setVisited((v) => new Set([...v, id]));
  }

  if (!node) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_320px] h-full overflow-hidden">
      {/* Trail */}
      <aside className="border-r border-[var(--line)] bg-[var(--bg)] p-5 overflow-y-auto">
        <div className="mono cap text-[10px] text-[var(--muted)] mb-3">Exploration · {trail.length} hops</div>
        {trail.map((id, i) => {
          const n = NODES.find((x) => x.id === id);
          if (!n) return null;
          const isCurrent = i === trail.length - 1;
          return (
            <button
              key={i}
              onClick={() => nav(id)}
              className={`w-full text-left p-2.5 rounded mb-1 transition ${
                isCurrent ? "bg-[var(--ember)]/15 border border-[var(--ember)]/30" : "border border-transparent hover:bg-[var(--bg-1)]"
              }`}
            >
              <div className="mono cap text-[9px] text-[var(--muted)] mb-0.5">{String(i + 1).padStart(2, "0")}</div>
              <div className="text-[13px]">{n.label}</div>
            </button>
          );
        })}
        <div className="mt-6 p-3 rounded border border-[var(--gold)]/30 bg-[var(--gold)]/5">
          <div className="mono cap text-[10px] text-[var(--gold)] mb-1.5 flex items-center gap-1">
            <Sparkles size={10} /> TIP
          </div>
          <div className="text-[11.5px] text-[var(--text-2)] leading-snug">
            Every <span className="underline decoration-dotted">linked concept</span> opens a new page. The <strong className="text-[var(--gold)]">gold</strong> one is predicted next — press <kbd className="mono text-[9px] px-1 py-0.5 rounded border border-[var(--line)]">TAB</kbd> to jump.
          </div>
        </div>
      </aside>

      {/* Article */}
      <article className="overflow-y-auto px-4 sm:px-10 py-8 min-w-0 break-words">
        <div className="max-w-[720px] mx-auto">
          <div className="mono cap text-[10px] text-[var(--ember)] mb-3">{article.kind}</div>
          <motion.h1
            key={current}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[44px] font-bold tracking-tight leading-[1.05] mb-5"
          >
            {node.label}
          </motion.h1>
          <p className="text-[16px] text-[var(--text-2)] leading-relaxed mb-6">{article.deck}</p>
          <div className="flex gap-4 mb-8 mono cap text-[10px] text-[var(--muted)] pb-4 border-b border-[var(--line)]">
            <span><strong className="text-[var(--ember)]">7</strong> SOURCES</span>
            <span><strong className="text-[var(--gold)]">23</strong> CLAIMS</span>
            <span><strong className="text-[var(--violet)]">11</strong> ENTITIES</span>
            <span className="ml-auto">COMPILED FROM YOUR NOTES</span>
          </div>

          {article.body.map((sec, i) => (
            <motion.section
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="mb-8"
            >
              {sec.h && <h2 className="text-[22px] font-semibold mb-4">{sec.h}</h2>}
              {sec.ps.map((p, j) => (
                <p key={j} className="text-[15px] leading-[1.75] text-[var(--text-2)] mb-4">
                  {sec.concepts ? renderWithConcepts(p, sec.concepts, nav, visited, goldNext?.to) : p}
                </p>
              ))}
            </motion.section>
          ))}
        </div>
      </article>

      {/* Predicted */}
      <aside className="border-l border-[var(--line)] bg-[var(--bg-1)] p-5 overflow-y-auto">
        <div className="mono cap text-[10px] text-[var(--gold)] mb-3 flex items-center gap-1.5">
          <Sparkles size={11} /> Predicted Next
        </div>
        {preds.slice(0, 1).map((p) => {
          const n = NODES.find((x) => x.id === p.to);
          if (!n) return null;
          return (
            <button
              key={p.to}
              onClick={() => nav(p.to)}
              className="w-full text-left p-4 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/5 hover:bg-[var(--gold)]/10 transition mb-2"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="mono cap text-[9px] text-[var(--gold)]">⌁ {Math.round(p.conf * 100)}% MATCH</div>
                <kbd className="mono text-[9px] px-1.5 py-0.5 rounded border border-[var(--gold)]/40 text-[var(--gold)]">TAB</kbd>
              </div>
              <div className="text-[14px] font-medium">{n.label}</div>
              <div className="text-[11px] text-[var(--text-2)] mt-1">{p.reason}</div>
            </button>
          );
        })}
        <div className="mono cap text-[10px] text-[var(--muted)] mt-4 mb-2">ALSO CONNECTED</div>
        {preds.slice(1).map((p) => {
          const n = NODES.find((x) => x.id === p.to);
          if (!n) return null;
          return (
            <button
              key={p.to}
              onClick={() => nav(p.to)}
              className="w-full text-left p-3 rounded border border-[var(--line)] hover:border-[var(--ember)]/40 transition mb-1.5 flex items-start gap-2"
            >
              {visited.has(p.to) ? <Check size={10} className="mt-1 text-[var(--good)]" /> : <ArrowRight size={10} className="mt-1 text-[var(--muted)]" />}
              <div className="flex-1">
                <div className="mono text-[9px] text-[var(--muted)]">{Math.round(p.conf * 100)}% · {visited.has(p.to) ? "VISITED" : "UNVISITED"}</div>
                <div className="text-[12.5px]">{n.label}</div>
              </div>
            </button>
          );
        })}
      </aside>
    </div>
  );
}

function renderWithConcepts(
  text: string,
  concepts: string[],
  onClick: (id: string) => void,
  visited: Set<string>,
  goldId?: string
) {
  type Frag = string | React.ReactElement;
  let result: Frag[] = [text];
  concepts.forEach((c) => {
    const node = NODES.find((n) => n.label.toLowerCase().includes(c.toLowerCase()) || n.id === c) || { id: c, label: c };
    const isGold = node.id === goldId;
    const isVisited = visited.has(node.id);
    const next: Frag[] = [];
    result.forEach((chunk) => {
      if (typeof chunk !== "string") {
        next.push(chunk);
        return;
      }
      const parts = chunk.split(new RegExp(`(${c})`, "i"));
      parts.forEach((p, i) => {
        if (p.toLowerCase() === c.toLowerCase()) {
          next.push(
            <button
              key={`${i}-${c}-${Math.random()}`}
              onClick={() => onClick(node.id)}
              className={`underline decoration-dotted underline-offset-4 transition ${
                isGold ? "text-[var(--gold)] font-medium" : isVisited ? "text-[var(--good)]" : "text-[var(--ember)] hover:text-[var(--gold)]"
              }`}
            >
              {p}
              {isVisited && <Check size={10} className="inline ml-0.5" />}
            </button>
          );
        } else if (p) next.push(p);
      });
    });
    result = next;
  });
  return <>{result.map((r, i) => typeof r === "string" ? <span key={i}>{r}</span> : r)}</>;
}
