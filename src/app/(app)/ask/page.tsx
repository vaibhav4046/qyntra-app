"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Loader2, Globe, Database, Files as FilesIcon } from "lucide-react";

interface Msg { role: "user" | "assistant"; content: string; }

const SUGGESTIONS = [
  "Summarize what I've learned about retrieval this quarter",
  "What contradicts the Voyage 3 claim?",
  "Draft a GraphRAG comparison page",
  "What should I read next?",
  "Organize my Drive files by project",
  "Which slack threads are unread but important?",
];

export default function AskPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<"DEEP" | "WEB">("DEEP");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: input };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages([...next, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages([...next, { role: "assistant", content: `[Error] ${err.error || res.statusText}` }]);
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: acc }]);
      }
    } catch (err) {
      setMessages([...next, { role: "assistant", content: `[Error] ${(err as Error).message}` }]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="h-full grid grid-cols-[1fr_320px] overflow-hidden">
      <div className="flex flex-col">
        <div className="px-10 py-6 border-b border-[var(--line)]">
          <div className="mono cap text-[11px] text-[var(--ember)] mb-2">Surface 02 · Ask your wiki</div>
          <h1 className="text-[28px] font-bold tracking-tight">What do you want to remember today?</h1>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="max-w-[640px] mx-auto text-center py-12">
              <Sparkles className="mx-auto text-[var(--ember)] mb-4" size={28} />
              <div className="text-[15px] text-[var(--text-2)] mb-6">
                Grounded on <strong className="text-[var(--text)]">142 sources</strong>, <strong className="text-[var(--text)]">86 entities</strong>, <strong className="text-[var(--text)]">219 claims</strong> from your private corpus.
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-left text-[13px] px-4 py-3 rounded-lg border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--ember)]/40 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[680px] ${m.role === "user" ? "text-right" : ""}`}>
                <div className="mono cap text-[10px] text-[var(--muted)] mb-1.5">
                  {m.role === "user" ? "YOU" : "QYNTRA · ANSWER"}
                </div>
                <div className={`text-[14.5px] leading-relaxed ${
                  m.role === "user"
                    ? "inline-block px-5 py-3 rounded-2xl rounded-tr-md bg-[var(--ember)] text-white"
                    : "px-5 py-4 rounded-2xl rounded-tl-md bg-[var(--bg-1)] border border-[var(--line)] whitespace-pre-wrap"
                }`}>
                  {m.content || (streaming && i === messages.length - 1 ? <Loader2 size={14} className="animate-spin" /> : null)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-[var(--line)] px-10 py-5 bg-[var(--bg)]/60 backdrop-blur-md">
          <div className="max-w-[860px] mx-auto">
            <div className="rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)] focus-within:border-[var(--ember)]/40 transition">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Ask anything across your wiki…"
                rows={2}
                className="w-full bg-transparent outline-none text-[15px] px-5 py-4 resize-none"
                disabled={streaming}
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex gap-1">
                  <button
                    onClick={() => setMode("DEEP")}
                    className={`mono cap text-[10px] px-2.5 py-1.5 rounded flex items-center gap-1.5 transition ${
                      mode === "DEEP" ? "bg-[var(--ember)]/15 text-[var(--ember)] border border-[var(--ember)]/30" : "text-[var(--muted)] border border-transparent"
                    }`}
                  >
                    <Database size={11} /> DEEP
                  </button>
                  <button
                    onClick={() => setMode("WEB")}
                    className={`mono cap text-[10px] px-2.5 py-1.5 rounded flex items-center gap-1.5 transition ${
                      mode === "WEB" ? "bg-[var(--ember)]/15 text-[var(--ember)] border border-[var(--ember)]/30" : "text-[var(--muted)] border border-transparent"
                    }`}
                  >
                    <Globe size={11} /> WEB
                  </button>
                  <span className="mono cap text-[10px] px-2.5 py-1.5 rounded text-[var(--muted)] flex items-center gap-1.5">
                    <FilesIcon size={11} /> SOURCES · ALL
                  </span>
                </div>
                <button
                  onClick={send}
                  disabled={!input.trim() || streaming}
                  className="shimmer mono cap text-[11px] font-semibold px-4 py-2 rounded text-white flex items-center gap-2 disabled:opacity-40 glow-ember"
                >
                  {streaming ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  ASK
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="border-l border-[var(--line)] bg-[var(--bg-1)] p-6 overflow-y-auto">
        <div className="mono cap text-[11px] text-[var(--ember)] mb-4 flex items-center gap-2">
          <Sparkles size={12} /> Predicted Follow-ups
        </div>
        <div className="space-y-2">
          {[
            { conf: 92, q: "Compare cost: hybrid retrieval at scale" },
            { conf: 81, q: "Which legal corpus did Voyage win on?" },
            { conf: 74, q: 'Draft the "GraphRAG vs RAG" page' },
            { conf: 66, q: "What's contradictory in my retrieval notes?" },
          ].map((p) => (
            <button
              key={p.q}
              onClick={() => setInput(p.q)}
              className="w-full text-left p-3 rounded-lg border border-[var(--line)] hover:border-[var(--ember)]/40 hover:bg-[var(--bg-2)] transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="mono text-[9px] text-[var(--gold)]">{p.conf}% MATCH</div>
                <div className="mono text-[9px] text-[var(--muted)] group-hover:text-[var(--ember)]">↵</div>
              </div>
              <div className="text-[12.5px]">{p.q}</div>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
