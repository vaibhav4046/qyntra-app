"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, Loader2 } from "lucide-react";
import { useProfileStore } from "@/lib/profile-store";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { demoMode } = useProfileStore();

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
        body: JSON.stringify({ messages: next, demoMode }),
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
            className="fixed bottom-6 right-6 z-50 w-[440px] h-[640px] max-h-[80vh] rounded-2xl border border-[var(--line-2)] bg-[var(--bg-1)] backdrop-blur-xl flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--line)] bg-[var(--bg)]/60">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-md bg-gradient-to-br from-[var(--ember)] to-[var(--gold)] flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold">Qyntra Chat</div>
                  <div className="mono cap text-[9px] text-[var(--good)]">GROQ · LLAMA 3.3 70B · LIVE</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="size-8 rounded hover:bg-[var(--bg-2)] flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
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
                        onClick={() => setInput(s)}
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
            </div>

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
              <div className="mono cap text-[9px] text-[var(--muted)] mt-1.5 px-1">
                ↵ send · grounded on your private corpus
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
