"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, Loader2, BrainCircuit, AlertCircle } from "lucide-react";
import { useProfileStore } from "@/lib/profile-store";
import { Logo } from "./logo";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{ input: number; output: number } | null>(null);
  const [corpusInfo, setCorpusInfo] = useState<{ files: number; chars: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { demoMode } = useProfileStore();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const updateTokenInfo = useCallback((inputTokens: number, outputTokens: number) => {
    setTokenInfo({ input: inputTokens, output: outputTokens });
  }, []);

  async function send() {
    if (!input.trim() || streaming) return;
    setError(null);
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
        body: JSON.stringify({ messages: next, demoMode }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages([...next, { role: "assistant", content: `[Error] ${err.error || res.statusText}` }]);
        setStreaming(false);
        return;
      }

      // Parse headers for token info
      const inputTokens = parseInt(res.headers.get("X-Input-Tokens") || "0", 10);
      const corpusFiles = parseInt(res.headers.get("X-Corpus-Files") || "0", 10);
      const corpusChars = parseInt(res.headers.get("X-Corpus-Chars") || "0", 10);
      if (corpusFiles) setCorpusInfo({ files: corpusFiles, chars: corpusChars });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let outputTokens = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const decoded = decoder.decode(value, { stream: true });
        acc += decoded;
        outputTokens += estimateTokens(decoded);
        setMessages([...next, { role: "assistant", content: acc }]);
      }
      updateTokenInfo(inputTokens, outputTokens);
    } catch (err) {
      setMessages([...next, { role: "assistant", content: `[Error] ${(err as Error).message}` }]);
      setError((err as Error).message);
    } finally {
      setStreaming(false);
    }
  }

  // Extract citation numbers like [1], [2] from the last assistant message
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const citations = lastAssistantMsg ? (lastAssistantMsg.content.match(/\[(\d+)\]/g) || []) : [];
  const uniqueCitations = Array.from(new Set(citations)).slice(0, 5);

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 size-14 rounded-full shimmer flex items-center justify-center text-white glow-ember shadow-2xl"
      >
        <MessageSquare size={22} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-50 w-[440px] h-[680px] max-h-[85vh] rounded-2xl border border-[var(--line-2)] bg-[var(--bg-1)] backdrop-blur-xl flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--line)] bg-[var(--bg)]/60">
              <div className="flex items-center gap-3">
                <Logo size={26} />
                <div>
                  <div className="text-[14px] font-semibold">Qyntra</div>
                  <div className="mono cap text-[9px] text-[var(--good)] flex items-center gap-1">
                    <BrainCircuit size={9} /> LLAMA 3.3 70B · LIVE
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="size-8 rounded hover:bg-[var(--bg-2)] flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {/* Corpus badge */}
            {corpusInfo && corpusInfo.files > 0 && (
              <div className="px-5 py-1.5 border-b border-[var(--line)] bg-[var(--ember)]/5 flex items-center gap-2">
                <Sparkles size={10} className="text-[var(--ember)]" />
                <span className="mono text-[10px] text-[var(--text-2)]">
                  Grounded on <strong className="text-[var(--ember)]">{corpusInfo.files}</strong> files ·{" "}
                  <strong className="text-[var(--ember)]">{corpusInfo.chars.toLocaleString()}</strong> chars
                </span>
              </div>
            )}

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ overscrollBehavior: "contain" }}>
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <div className="mono cap text-[10px] text-[var(--muted)] mb-3">SUGGESTED</div>
                  <div className="space-y-2">
                    {[
                      "Summarize my retrieval learnings this quarter",
                      "Which papers contradict my Voyage 3 claim?",
                      "Organize my files by project — propose a structure",
                      "What should I read next?",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); }}
                        className="block w-full text-left text-[13px] px-3 py-2 rounded border border-[var(--line)] hover:border-[var(--ember)]/40 hover:bg-[var(--bg-2)] transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-[var(--ember)] text-white rounded-br-md"
                      : "bg-[var(--bg-2)] border border-[var(--line)] rounded-bl-md whitespace-pre-wrap"
                  }`}>
                    {m.content || (streaming && i === messages.length - 1 ? <Loader2 size={14} className="animate-spin" /> : null)}
                  </div>
                </div>
              ))}

              {error && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-[var(--bad)]/10 border border-[var(--bad)]/30 text-[var(--bad)] text-[12px] flex items-center gap-2">
                    <AlertCircle size={12} />
                    {error}
                  </div>
                </div>
              )}
            </div>

            {/* Citations bar */}
            {uniqueCitations.length > 0 && !streaming && (
              <div className="px-5 py-1.5 border-t border-[var(--line)] flex items-center gap-2 overflow-x-auto">
                <span className="mono text-[9px] text-[var(--muted)] flex-shrink-0">CITED:</span>
                {uniqueCitations.map((c) => (
                  <span key={c} className="mono text-[9px] px-1.5 py-0.5 rounded bg-[var(--ember)]/10 text-[var(--ember)] border border-[var(--ember)]/20">
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-[var(--line)] p-3">
              <div className="flex items-center gap-2 bg-[var(--bg-2)] rounded-lg border border-[var(--line)] focus-within:border-[var(--ember)]/50 transition px-3 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder="Ask anything across your wiki…"
                  className="bg-transparent flex-1 outline-none text-[13px]"
                  disabled={streaming}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || streaming}
                  className="size-8 rounded bg-[var(--ember)] flex items-center justify-center disabled:opacity-40 hover:scale-105 transition"
                >
                  {streaming ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5 px-1">
                <div className="mono cap text-[9px] text-[var(--muted)]">
                  ↵ send · grounded on your private corpus
                </div>
                {tokenInfo && (
                  <div className="mono text-[9px] text-[var(--muted)]">
                    {tokenInfo.input + tokenInfo.output}t · {tokenInfo.output}out
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
