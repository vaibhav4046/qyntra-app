"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Sparkles,
  Loader2,
  Globe,
  Database,
  Files as FilesIcon,
  Plus,
  Trash2,
  ChevronDown,
  Shield,
  Zap,
  MessageSquare,
  BrainCircuit,
  AlertCircle,
} from "lucide-react";
import { useProfileStore } from "@/lib/profile-store";
import { useChatStore } from "@/lib/chat-store";

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const SUGGESTIONS = [
  "Summarize what I've learned about retrieval this quarter",
  "What contradicts the Voyage 3 claim?",
  "Draft a GraphRAG comparison page",
  "What should I read next?",
  "Organize my Drive files by project",
  "Which GitHub issues need attention?",
];

export default function AskPage() {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<"DEEP" | "WEB">("DEEP");
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [seedConsumed, setSeedConsumed] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ input: number; output: number } | null>(null);
  const [corpusInfo, setCorpusInfo] = useState<{ files: number; chars: number } | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFollowingRef = useRef(true);
  const { demoMode, init: initProfile } = useProfileStore();
  const {
    conversations,
    activeId,
    permissionMode,
    init: initChats,
    newChat,
    selectChat,
    pushMessage,
    updateAssistant,
    deleteChat,
    setPermissionMode,
  } = useChatStore();

  useEffect(() => {
    initProfile();
    initChats();
  }, [initProfile, initChats]);

  // Auto-fire seeded query from /ask?q=
  useEffect(() => {
    if (typeof window === "undefined" || seedConsumed) return;
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("q");
    if (!q) return;
    setSeedConsumed(true);
    newChat();
    setInput(q);
    // clear ?q= so refresh doesn't re-fire
    window.history.replaceState({}, "", "/ask");
    setTimeout(() => {
      const ta = document.querySelector<HTMLTextAreaElement>('textarea');
      if (ta) {
        ta.value = q;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
      // Trigger send after a tick
      setTimeout(() => sendSeeded(q), 80);
    }, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedConsumed]);

  async function sendSeeded(userText: string) {
    if (streaming) return;
    setChatError(null);
    isFollowingRef.current = true;
    setShowScrollDown(false);
    setInput("");
    pushMessage({ role: "user", content: userText });
    pushMessage({ role: "assistant", content: "" });
    setStreaming(true);
    const history = [{ role: "user" as const, content: userText }];
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, demoMode }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        updateAssistant(`[Error] ${err.error || res.statusText}`);
        setStreaming(false);
        return;
      }
      // Read metadata headers
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
        updateAssistant(acc);
      }
      setTokenInfo({ input: inputTokens, output: outputTokens });
    } catch (err) {
      const msg = (err as Error).message;
      updateAssistant(`[Error] ${msg}`);
      setChatError(msg);
    } finally {
      setStreaming(false);
    }
  }

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );
  const messages = active?.messages || [];

  // Auto-scroll on new messages only if user is following (near bottom)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isFollowingRef.current) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distFromBottom < 120;
    isFollowingRef.current = nearBottom;
    setShowScrollDown(distFromBottom > 300);
  }

  function scrollToBottom() {
    const el = scrollRef.current;
    if (!el) return;
    isFollowingRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }

  async function send() {
    if (!input.trim() || streaming) return;
    setChatError(null);
    isFollowingRef.current = true; // Reset follow lock when user sends a message
    setShowScrollDown(false);
    const userText = input;
    setInput("");
    if (!activeId) newChat();
    pushMessage({ role: "user", content: userText });
    pushMessage({ role: "assistant", content: "" });
    setStreaming(true);

    let augmentedUserText = userText;
    // WEB mode: fetch live web context first, prepend to the question
    if (mode === "WEB") {
      try {
        updateAssistant("🌐 Searching the web…");
        const wsRes = await fetch("/api/web-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: userText }),
        });
        if (wsRes.ok) {
          const wsJson = await wsRes.json();
          const results: { title: string; url: string; snippet: string }[] = wsJson.results || [];
          const webContext = results
            .slice(0, 6)
            .map((r, i) => `[W${i + 1}] ${r.title} — ${r.snippet}\n${r.url}`)
            .join("\n\n");
          augmentedUserText = `${userText}\n\n--- LIVE WEB RESULTS (cite as [W1], [W2]) ---\n${webContext}`;
          updateAssistant("");
        }
      } catch {}
    } else if (mode === "DEEP") {
      // DEEP: ask LLM to outline a research plan first (in same request — we hint via system).
      augmentedUserText = `Run a DEEP research pass on the following. (1) Outline 3 sub-questions you need to answer. (2) Answer each sub-question grounded on the corpus with citations. (3) Synthesise.\n\nQuestion: ${userText}`;
    }

    const customApiKey = typeof window !== "undefined" ? localStorage.getItem("qyntra:custom-api-key") || "" : "";

    const history = [
      ...(active?.messages || []),
      { role: "user" as const, content: augmentedUserText },
    ];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customApiKey ? { "X-Qyntra-Api-Key": customApiKey } : {}),
        },
        body: JSON.stringify({ messages: history, demoMode, mode }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        updateAssistant(`[Error] ${err.error || res.statusText}`);
        setStreaming(false);
        return;
      }
      // Read metadata headers
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
        updateAssistant(acc);
      }
      setTokenInfo({ input: inputTokens, output: outputTokens });
    } catch (err) {
      const msg = (err as Error).message;
      updateAssistant(`[Error] ${msg}`);
      setChatError(msg);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="h-full min-h-0 grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] overflow-hidden">
      {/* Conversation history rail */}
      <aside className="hidden lg:flex flex-col min-h-0 border-r border-[var(--line)] bg-[var(--bg)] overflow-hidden">
        <div className="p-3 border-b border-[var(--line)]">
          <button
            onClick={() => newChat()}
            className="w-full px-3 py-2.5 rounded-md bg-[var(--ember)] text-white pixel text-[12px] flex items-center justify-center gap-2 hover:bg-[var(--ember-2)] transition"
          >
            <Plus size={13} /> New chat
          </button>
        </div>
        <div className="px-3 py-2 mono cap text-[10px] text-[var(--muted)]">
          Recent · {conversations.length}
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {conversations.length === 0 && (
            <div className="px-3 py-6 text-center pixel text-[11px] text-[var(--muted)]">
              No conversations yet.
              <br />
              Click <strong className="text-[var(--ember)]">New chat</strong> to start.
            </div>
          )}
          {conversations.map((c) => {
            const active = c.id === activeId;
            return (
              <div
                key={c.id}
                onClick={() => selectChat(c.id)}
                className={`group flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition ${
                  active
                    ? "bg-[var(--ember)]/10 border-l-2 border-[var(--ember)] text-[var(--ember)]"
                    : "hover:bg-[var(--bg-1)] text-[var(--text-2)] border-l-2 border-transparent"
                }`}
              >
                <MessageSquare size={13} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] truncate">{c.title || "Untitled"}</div>
                  <div className="mono text-[9px] text-[var(--muted)]">
                    {new Date(c.updatedAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-[var(--bad)] transition"
                  aria-label="Delete"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main chat */}
      <div className="flex flex-col min-w-0 min-h-0 h-full relative">
        <div className="flex-shrink-0 px-6 sm:px-10 py-5 border-b border-[var(--line)] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="mono cap text-[11px] text-[var(--ember)] mb-1 flex items-center gap-2 flex-wrap">
              Surface 02 · Ask your wiki
              {corpusInfo && corpusInfo.files > 0 && (
                <span className="text-[var(--gold)]">· {corpusInfo.files} sources</span>
              )}
              <span className="mono text-[10px] px-2 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--text-2)]">
                MODEL · GROQ LLAMA 3.3 70B
              </span>
              {tokenInfo && (
                <span className="mono text-[10px] px-2 py-0.5 rounded bg-[var(--ember)]/10 border border-[var(--ember)]/30 text-[var(--ember)]">
                  {tokenInfo.input + tokenInfo.output}t · {tokenInfo.input} in / {tokenInfo.output} out
                </span>
              )}
            </div>
            <h1 className="text-[22px] sm:text-[28px] font-bold tracking-tight truncate">
              {active?.title && active.messages.length > 0 ? active.title : "What do you want to remember today?"}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => newChat()}
              className="lg:hidden p-2 rounded border border-[var(--line)] hover:bg-[var(--bg-1)]"
              aria-label="New chat"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => setPermissionMode(permissionMode === "ask" ? "auto" : "ask")}
              className={`pixel text-[10px] px-3 py-2 rounded border flex items-center gap-1.5 transition ${
                permissionMode === "auto"
                  ? "bg-[var(--bad)]/10 text-[var(--bad)] border-[var(--bad)]/40"
                  : "bg-[var(--good)]/10 text-[var(--good)] border-[var(--good)]/40"
              }`}
              title={
                permissionMode === "auto"
                  ? "Auto-approve: agent acts without asking. Risky."
                  : "Ask first: agent confirms every write."
              }
            >
              {permissionMode === "auto" ? <Zap size={11} /> : <Shield size={11} />}
              {permissionMode === "auto" ? "BYPASS PERMS" : "ASK FIRST"}
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="chat-scroll flex-1 min-h-0 overflow-y-auto px-6 sm:px-10 py-8 space-y-6"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,91,31,0.6) rgba(255,255,255,0.04)",
            overscrollBehavior: "contain",
          }}
        >
          {messages.length === 0 && (
            <div className="max-w-[640px] mx-auto text-center py-12">
              <Sparkles className="mx-auto text-[var(--ember)] mb-4" size={28} />
              <div className="text-[15px] text-[var(--text-2)] mb-6">
                Grounded on your{" "}
                <strong className="text-[var(--text)]">Drive, Notion, Gmail, GitHub, Desktop</strong> ingestion.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[680px] w-full ${m.role === "user" ? "text-right" : ""}`}>
                <div className="mono cap text-[10px] text-[var(--muted)] mb-1.5">
                  {m.role === "user" ? "YOU" : "QYNTRA · ANSWER"}
                </div>
                <div
                  className={`text-[14.5px] leading-relaxed break-words ${
                    m.role === "user"
                      ? "inline-block px-5 py-3 rounded-2xl rounded-tr-md bg-[var(--ember)] text-white text-left"
                      : "px-5 py-4 rounded-2xl rounded-tl-md bg-[var(--bg-1)] border border-[var(--line)] whitespace-pre-wrap"
                  }`}
                >
                  {m.content ||
                    (streaming && i === messages.length - 1 ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : null)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scroll-to-bottom FAB */}
        {showScrollDown && (
          <button
            onClick={scrollToBottom}
            className="absolute right-6 bottom-[160px] size-10 rounded-full bg-[var(--ember)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--ember-2)] transition glow-ember z-10"
            aria-label="Scroll to bottom"
          >
            <ChevronDown size={18} />
          </button>
        )}

        <div className="flex-shrink-0 border-t border-[var(--line)] px-6 sm:px-10 py-4 sm:py-5 bg-[var(--bg)]/60 backdrop-blur-md">
          <div className="max-w-[860px] mx-auto">
            {chatError && (
              <div className="mb-2 px-3 py-2 rounded border border-[var(--bad)]/30 bg-[var(--bad)]/5 flex items-center gap-2 text-[11px] text-[var(--bad)]">
                <AlertCircle size={11} /> {chatError}
              </div>
            )}
            <div className="rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)] focus-within:border-[var(--ember)]/40 transition">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Ask anything across your wiki…"
                rows={2}
                className="w-full bg-transparent outline-none text-[15px] px-4 sm:px-5 py-3 sm:py-4 resize-none"
                disabled={streaming}
              />
              <div className="flex items-center justify-between px-3 pb-3 gap-2 flex-wrap">
                <div className="flex gap-1 flex-wrap items-center">
                  <button
                    onClick={() => setMode("DEEP")}
                    className={`mono cap text-[10px] px-2.5 py-1.5 rounded flex items-center gap-1.5 transition ${
                      mode === "DEEP"
                        ? "bg-[var(--ember)]/15 text-[var(--ember)] border border-[var(--ember)]/30"
                        : "text-[var(--muted)] border border-transparent"
                    }`}
                  >
                    <Database size={11} /> DEEP
                  </button>
                  <button
                    onClick={() => setMode("WEB")}
                    className={`mono cap text-[10px] px-2.5 py-1.5 rounded flex items-center gap-1.5 transition ${
                      mode === "WEB"
                        ? "bg-[var(--ember)]/15 text-[var(--ember)] border border-[var(--ember)]/30"
                        : "text-[var(--muted)] border border-transparent"
                    }`}
                  >
                    <Globe size={11} /> WEB
                  </button>
                  <span className="mono cap text-[10px] px-2.5 py-1.5 rounded text-[var(--muted)] flex items-center gap-1.5">
                    <FilesIcon size={11} /> SOURCES · ALL
                  </span>
                  {tokenInfo && (
                    <span className="mono text-[9px] text-[var(--muted)] px-2 py-1 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                      {tokenInfo.input + tokenInfo.output}t used
                    </span>
                  )}
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

      <aside className="hidden lg:flex flex-col border-l border-[var(--line)] bg-[var(--bg-1)] overflow-y-auto">
        <div className="p-6">
          <ModelSettings />
          {corpusInfo && corpusInfo.files > 0 ? (
            <>
              <div className="mono cap text-[11px] text-[var(--ember)] mb-4 flex items-center gap-2">
                <BrainCircuit size={12} /> Corpus Loaded
              </div>
              <div className="space-y-2 mb-4">
                <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
                  <div className="mono text-[9px] text-[var(--muted)] mb-1">FILES INDEXED</div>
                  <div className="text-[18px] font-bold text-[var(--ember)]">{corpusInfo.files}</div>
                </div>
                <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
                  <div className="mono text-[9px] text-[var(--muted)] mb-1">TOTAL CHARS</div>
                  <div className="text-[18px] font-bold text-[var(--gold)]">{corpusInfo.chars.toLocaleString()}</div>
                </div>
                {tokenInfo && (
                  <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
                    <div className="mono text-[9px] text-[var(--muted)] mb-1">TOKENS USED</div>
                    <div className="text-[18px] font-bold text-[var(--good)]">{tokenInfo.input + tokenInfo.output}</div>
                    <div className="mono text-[9px] text-[var(--muted)] mt-1">{tokenInfo.input} in · {tokenInfo.output} out</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
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
            </>
          )}

          <div className="mt-6 pt-6 border-t border-[var(--line)]">
            <div className="mono cap text-[11px] text-[var(--gold)] mb-3 flex items-center gap-2">
              <Shield size={11} /> Agent permissions
            </div>
            <p className="pixel text-[11px] text-[var(--text-2)] leading-relaxed mb-3">
              Qyntra can read & write your connected files. Pick how much it does on its own:
            </p>
            <div className="space-y-1.5">
              <button
                onClick={() => setPermissionMode("ask")}
                className={`w-full text-left p-2.5 rounded border transition ${
                  permissionMode === "ask"
                    ? "bg-[var(--good)]/10 border-[var(--good)]/40"
                    : "border-[var(--line)] hover:bg-[var(--bg-2)]"
                }`}
              >
                <div className="text-[12.5px] flex items-center gap-1.5">
                  <Shield size={11} className="text-[var(--good)]" /> Ask first (default)
                </div>
                <div className="pixel text-[10px] text-[var(--muted)] mt-0.5">
                  Confirm every write, delete, send.
                </div>
              </button>
              <button
                onClick={() => setPermissionMode("auto")}
                className={`w-full text-left p-2.5 rounded border transition ${
                  permissionMode === "auto"
                    ? "bg-[var(--bad)]/10 border-[var(--bad)]/40"
                    : "border-[var(--line)] hover:bg-[var(--bg-2)]"
                }`}
              >
                <div className="text-[12.5px] flex items-center gap-1.5">
                  <Zap size={11} className="text-[var(--bad)]" /> Auto-approve
                </div>
                <div className="pixel text-[10px] text-[var(--muted)] mt-0.5">
                  Agent acts without confirmation. Use carefully.
                </div>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ModelSettings() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setKey(localStorage.getItem("qyntra:custom-api-key") || "");
    }
  }, []);

  function save() {
    if (typeof window === "undefined") return;
    if (key.trim()) {
      localStorage.setItem("qyntra:custom-api-key", key.trim());
    } else {
      localStorage.removeItem("qyntra:custom-api-key");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="mb-5 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-[var(--bg)]/40 transition"
      >
        <div className="flex items-center gap-2">
          <span className="mono text-[10px] text-[var(--ember)]">MODEL</span>
          <span className="text-[12px]">Groq · Llama 3.3 70B</span>
        </div>
        <span className="mono text-[10px] text-[var(--muted)]">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div className="px-3 py-3 border-t border-[var(--line)] space-y-2">
          <div className="mono text-[10px] text-[var(--text-2)]">
            Use your own Groq API key (optional)
          </div>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="gsk_…"
            className="w-full px-2.5 py-1.5 text-[11px] mono rounded bg-[var(--bg)] border border-[var(--line)] focus:border-[var(--ember)]/40 outline-none"
          />
          <button
            onClick={save}
            className="w-full mono cap text-[10px] px-2.5 py-1.5 rounded bg-[var(--ember)] text-white hover:bg-[var(--ember-2)] transition"
          >
            {saved ? "✓ SAVED" : "SAVE KEY"}
          </button>
          <div className="mono text-[9px] text-[var(--muted)] leading-snug">
            Saved in your browser only. Sent as X-Qyntra-Api-Key header. Leave blank to use the server default.
          </div>
        </div>
      )}
    </div>
  );
}
