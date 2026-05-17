"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FILES_SEED, CONNECTORS } from "@/lib/data";
import { Search, Grid3x3, List, Plus, RefreshCw } from "lucide-react";

type ViewMode = "grid" | "list" | "3d";

export default function FilesPage() {
  const [view, setView] = useState<ViewMode>("grid");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [files, setFiles] = useState(FILES_SEED);
  const [loading, setLoading] = useState(false);

  async function syncReal() {
    setLoading(true);
    try {
      const res = await fetch("/api/connectors/drive");
      const data = await res.json();
      if (data.files?.length) {
        type DriveFile = { id: string; mimeType: string; name: string; modifiedTime: string };
        const real = data.files.map((f: DriveFile) => ({
          id: f.id,
          kind: f.mimeType.includes("document") ? "DOC" : f.mimeType.includes("spreadsheet") ? "SHEET" : "FILE",
          title: f.name,
          sub: new Date(f.modifiedTime).toLocaleDateString(),
          tags: ["drive"],
          source: "Drive",
        }));
        setFiles([...real, ...FILES_SEED]);
      }
    } catch {}
    setLoading(false);
  }

  const filtered = files.filter((f) => {
    if (filter !== "all" && f.kind !== filter) return false;
    if (q && !f.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="mono cap text-[11px] text-[var(--ember)] mb-2">Surface 03 · All your files, organized</div>
          <h1 className="text-[36px] font-bold tracking-tight">Every file in one searchable home.</h1>
        </div>
        <button
          onClick={syncReal}
          disabled={loading}
          className="mono cap text-[11px] px-4 py-2.5 rounded-md border border-[var(--ember)]/40 text-[var(--ember)] hover:bg-[var(--ember)]/10 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {loading ? "SYNCING…" : "SYNC FROM DRIVE"}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 max-w-md flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--bg-1)] border border-[var(--line)] focus-within:border-[var(--ember)]/40">
          <Search size={14} className="text-[var(--muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search files…"
            className="flex-1 bg-transparent outline-none text-[13px]"
          />
        </div>
        <div className="flex gap-1">
          {["all", "PAGE", "DOC", "ENTITY", "CLAIM"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`mono cap text-[10px] px-3 py-2 rounded transition ${
                filter === f ? "bg-[var(--ember)]/15 text-[var(--ember)] border border-[var(--ember)]/30" : "border border-[var(--line)] text-[var(--text-2)]"
              }`}
            >
              {f === "all" ? "ALL" : f === "ENTITY" ? "ENTITIES" : f + "S"}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          <button onClick={() => setView("grid")} className={`p-2 rounded ${view === "grid" ? "bg-[var(--bg-2)] text-[var(--ember)]" : "text-[var(--muted)]"}`}>
            <Grid3x3 size={15} />
          </button>
          <button onClick={() => setView("list")} className={`p-2 rounded ${view === "list" ? "bg-[var(--bg-2)] text-[var(--ember)]" : "text-[var(--muted)]"}`}>
            <List size={15} />
          </button>
        </div>
      </div>

      <div className="mb-4 mono cap text-[11px] text-[var(--muted)]">
        {filtered.length} · {filter === "all" ? "ALL" : filter === "ENTITY" ? "ENTITIES" : filter + "S"} · Local-first, encrypted at rest
      </div>

      {view === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((f, i) => (
            <motion.div
              key={f.id + i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              whileHover={{ y: -3 }}
              className="p-5 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--ember)]/30 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="mono cap text-[9px] text-[var(--ember)]">◆ {f.kind}</div>
                <div className="mono cap text-[9px] text-[var(--muted)]">{f.source}</div>
              </div>
              <h3 className="text-[14px] font-medium mb-2 line-clamp-2">{f.title}</h3>
              <p className="text-[12px] text-[var(--text-2)] line-clamp-2 mb-3">{f.sub}</p>
              <div className="flex gap-1.5 flex-wrap">
                {f.tags?.map((t) => (
                  <span key={t} className="mono text-[9px] px-1.5 py-0.5 rounded border border-[var(--line)] text-[var(--muted)]">
                    #{t}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden">
          {filtered.map((f, i) => (
            <motion.div
              key={f.id + i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-4 px-5 py-3 border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg-2)] cursor-pointer"
            >
              <div className="mono cap text-[10px] text-[var(--ember)] w-16">{f.kind}</div>
              <div className="flex-1">
                <div className="text-[14px]">{f.title}</div>
                <div className="text-[12px] text-[var(--muted)] line-clamp-1">{f.sub}</div>
              </div>
              <div className="mono cap text-[10px] text-[var(--muted)]">{f.source}</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
