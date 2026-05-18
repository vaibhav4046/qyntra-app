"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Command, Sparkles, FileText, ArrowUpRight } from "lucide-react";

interface FileHit {
  id: string;
  title: string;
  source?: string;
  kind?: string;
  source_url?: string;
}

const AI_SUGGESTIONS = [
  "Summarize my last 7 days",
  "What contradicts my retrieval notes?",
  "Find files about Voyage 3",
  "Draft a Q4 OKR doc",
  "Which Notion pages mention AdmitOS?",
];

export function SearchPopover() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<FileHit[]>([]);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        (document.getElementById("global-search-input") as HTMLInputElement | null)?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click outside closes
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced file search
  useEffect(() => {
    if (!q.trim()) {
      setHits([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/files?limit=40`);
        if (!res.ok) return;
        const json = await res.json();
        const needle = q.toLowerCase();
        const all = (json.files || []) as FileHit[];
        const matched = all
          .filter((f) =>
            (f.title || "").toLowerCase().includes(needle) ||
            (f.source || "").toLowerCase().includes(needle) ||
            (f.kind || "").toLowerCase().includes(needle)
          )
          .slice(0, 8);
        setHits(matched);
      } catch {}
    }, 180);
    return () => clearTimeout(id);
  }, [q]);

  const filteredSuggestions = q.trim()
    ? AI_SUGGESTIONS.filter((s) => s.toLowerCase().includes(q.toLowerCase())).slice(0, 4)
    : AI_SUGGESTIONS.slice(0, 4);

  const total = hits.length + filteredSuggestions.length;

  function onSubmit() {
    const idx = active;
    if (idx < hits.length) {
      const hit = hits[idx];
      if (hit.source_url) window.open(hit.source_url, "_blank");
      else router.push("/files");
    } else {
      const sIdx = idx - hits.length;
      const text = filteredSuggestions[sIdx] || q;
      router.push(`/ask?q=${encodeURIComponent(text)}`);
    }
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(0, total - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-1)] border border-[var(--line)] focus-within:border-[var(--ember)]/50 transition">
        <Search size={14} className="text-[var(--muted)]" />
        <input
          id="global-search-input"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="ask, find, jump — Enter to go"
          className="bg-transparent flex-1 outline-none text-[13px] placeholder:text-[var(--muted)] min-w-0"
        />
        <kbd className="mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--line)] text-[var(--muted)]">
          <Command size={9} className="inline" /> K
        </kbd>
      </div>

      {open && (q || hits.length || filteredSuggestions.length) && (
        <div className="absolute top-full mt-1.5 left-0 right-0 rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] shadow-2xl z-50 max-h-[420px] overflow-y-auto">
          {hits.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 mono cap text-[9px] text-[var(--muted)]">FILES</div>
              {hits.map((h, i) => (
                <button
                  key={h.id}
                  onClick={() => { setActive(i); onSubmit(); }}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left ${active === i ? "bg-[var(--ember)]/10" : "hover:bg-[var(--bg-1)]"}`}
                >
                  <FileText size={12} className="text-[var(--ember)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate">{h.title}</div>
                    <div className="mono cap text-[9px] text-[var(--muted)]">{h.kind} · {h.source}</div>
                  </div>
                  {h.source_url && <ArrowUpRight size={12} className="text-[var(--muted)]" />}
                </button>
              ))}
            </>
          )}
          {filteredSuggestions.length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1 mono cap text-[9px] text-[var(--muted)] flex items-center gap-1.5">
                <Sparkles size={9} /> ASK QYNTRA
              </div>
              {filteredSuggestions.map((s, i) => {
                const idx = hits.length + i;
                return (
                  <button
                    key={s}
                    onClick={() => { setActive(idx); onSubmit(); }}
                    onMouseEnter={() => setActive(idx)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left ${active === idx ? "bg-[var(--ember)]/10" : "hover:bg-[var(--bg-1)]"}`}
                  >
                    <Sparkles size={12} className="text-[var(--gold)] flex-shrink-0" />
                    <span className="text-[13px] flex-1">{s}</span>
                    <kbd className="mono text-[9px] text-[var(--muted)]">↵</kbd>
                  </button>
                );
              })}
            </>
          )}
          <div className="px-3 py-2 border-t border-[var(--line)] flex items-center justify-between mono text-[9px] text-[var(--muted)]">
            <span>↑↓ navigate · ↵ open · Esc close</span>
            <span>{total} results</span>
          </div>
        </div>
      )}
    </div>
  );
}
