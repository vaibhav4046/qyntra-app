"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FILES_SEED } from "@/lib/data";
import {
  Search,
  Grid3x3,
  List,
  RefreshCw,
  X,
  ExternalLink,
  UploadCloud,
  FilePlus,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useProfileStore } from "@/lib/profile-store";

interface UFile {
  id: string;
  source: string;
  source_url?: string;
  kind: string;
  title: string;
  summary?: string;
  tags?: string[];
  last_modified?: string;
  created_at?: string;
}

interface SeedFile {
  id: string;
  source: string;
  kind: string;
  title: string;
  sub?: string;
  tags?: string[];
  source_url?: string;
}

type ViewMode = "grid" | "list";

export default function FilesPage() {
  const [view, setView] = useState<ViewMode>("grid");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [realFiles, setRealFiles] = useState<UFile[]>([]);
  const [loading, setLoading] = useState(false);
  const { demoMode, init } = useProfileStore();

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    init();
  }, [init]);

  const loadFiles = useCallback(async () => {
    if (demoMode) return;
    setLoading(true);
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        const json = await res.json();
        setRealFiles(json.files || []);
      }
    } catch {}
    setLoading(false);
  }, [demoMode]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const files: (UFile | SeedFile)[] = demoMode ? (FILES_SEED as SeedFile[]) : realFiles;

  function summaryOf(f: UFile | SeedFile): string {
    if ("summary" in f && f.summary) return f.summary;
    if ("sub" in f && f.sub) return f.sub;
    if ("last_modified" in f && f.last_modified) return new Date(f.last_modified).toLocaleDateString();
    return "";
  }

  const filtered = files.filter((f) => {
    if (filter !== "all" && f.kind !== filter) return false;
    if (q.trim()) {
      const needle = q.toLowerCase().trim();
      const hay = [f.title, summaryOf(f), f.kind, f.source, ...(f.tags || [])].join(" ").toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadMsg(null);
    let ok = 0;
    let fail = 0;
    for (const file of Array.from(fileList)) {
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/files", { method: "POST", body: form });
        if (res.ok) ok++;
        else fail++;
      } catch {
        fail++;
      }
    }
    setUploading(false);
    if (fail === 0) {
      setUploadMsg({ type: "ok", text: `${ok} file${ok > 1 ? "s" : ""} uploaded successfully.` });
    } else {
      setUploadMsg({ type: "err", text: `${ok} uploaded, ${fail} failed.` });
    }
    loadFiles();
    setTimeout(() => setUploadMsg(null), 4000);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    uploadFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  const desktopFiles = realFiles.filter((f) => f.source === "desktop" || f.source === "manual");

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <div className="mono cap text-[11px] text-[var(--ember)] mb-2">Surface 03 · All your files, organized</div>
          <h1 className="text-[26px] sm:text-[36px] font-bold tracking-tight leading-tight">Every file in one searchable home.</h1>
          <div className="mono cap text-[10px] text-[var(--muted)] mt-1">
            {demoMode ? "DEMO MODE · sample data" : `LIVE · ${realFiles.length} files in your workspace · ${desktopFiles.length} from desktop`}
          </div>
        </div>
        <button
          onClick={loadFiles}
          disabled={loading || demoMode}
          className="mono cap text-[11px] px-4 py-2.5 rounded-md border border-[var(--ember)]/40 text-[var(--ember)] hover:bg-[var(--ember)]/10 flex items-center gap-2 disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {loading ? "REFRESHING…" : demoMode ? "DEMO MODE" : "REFRESH"}
        </button>
      </div>

      {/* Upload zone */}
      {!demoMode && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mb-6 p-6 rounded-xl border-2 border-dashed transition relative overflow-hidden ${
            isDragging
              ? "border-[var(--ember)] bg-[var(--ember)]/10"
              : "border-[var(--line-2)] bg-[var(--bg-1)] hover:border-[var(--ember)]/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.pdf,.docx,.csv,.json"
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="size-12 rounded-full bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center flex-shrink-0">
              {uploading ? <Loader2 size={20} className="animate-spin text-[var(--ember)]" /> : <UploadCloud size={20} className="text-[var(--ember)]" />}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-[14px] font-medium mb-1">
                {uploading ? "Uploading files…" : "Drag & drop files here, or click to browse"}
              </div>
              <div className="mono cap text-[11px] text-[var(--muted)]">
                Supports TXT, MD, PDF, DOCX, CSV, JSON. Parsed locally, uploaded as text only.
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mono cap text-[11px] px-4 py-2 rounded bg-[var(--ember)] text-white hover:bg-[var(--ember-2)] flex items-center gap-2 disabled:opacity-50"
            >
              <FilePlus size={13} /> Select files
            </button>
          </div>

          {uploadMsg && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-2.5 rounded border flex items-center gap-2 text-[12px] ${
                uploadMsg.type === "ok"
                  ? "border-[var(--good)]/30 bg-[var(--good)]/10 text-[var(--good)]"
                  : "border-[var(--bad)]/30 bg-[var(--bad)]/10 text-[var(--bad)]"
              }`}
            >
              {uploadMsg.type === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {uploadMsg.text}
            </motion.div>
          )}
        </div>
      )}

      {!demoMode && realFiles.length === 0 && !loading && (
        <div className="p-8 mb-6 rounded-xl border border-dashed border-[var(--ember)]/30 bg-[var(--ember)]/5 text-center">
          <div className="text-[18px] mb-2">Your workspace is empty.</div>
          <div className="mono cap text-[11px] text-[var(--text-2)] mb-4">
            Connect a source to start indexing your files.
          </div>
          <Link
            href="/sources"
            className="mono cap text-[11px] px-5 py-2.5 rounded-md bg-[var(--ember)] text-white inline-flex items-center gap-2 hover:bg-[var(--ember-2)]"
          >
            → Connect a source
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1 sm:max-w-md flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--bg-1)] border border-[var(--line)] focus-within:border-[var(--ember)]/40">
          <Search size={14} className="text-[var(--muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, tags, source…"
            className="flex-1 bg-transparent outline-none text-[13px]"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-[var(--muted)] hover:text-[var(--text)]" aria-label="Clear">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {["all", "PAGE", "DOC", "ENTITY", "CLAIM", "PDF", "EMAIL", "THREAD"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`mono cap text-[10px] px-3 py-2 rounded transition flex-shrink-0 ${
                filter === f ? "bg-[var(--ember)]/15 text-[var(--ember)] border border-[var(--ember)]/30" : "border border-[var(--line)] text-[var(--text-2)]"
              }`}
            >
              {f === "all" ? "ALL" : f === "ENTITY" ? "ENTITIES" : f + "S"}
            </button>
          ))}
        </div>
        <div className="flex gap-1 sm:ml-auto">
          <button onClick={() => setView("grid")} className={`p-2 rounded ${view === "grid" ? "bg-[var(--bg-2)] text-[var(--ember)]" : "text-[var(--muted)]"}`}>
            <Grid3x3 size={15} />
          </button>
          <button onClick={() => setView("list")} className={`p-2 rounded ${view === "list" ? "bg-[var(--bg-2)] text-[var(--ember)]" : "text-[var(--muted)]"}`}>
            <List size={15} />
          </button>
        </div>
      </div>

      <div className="mb-4 mono cap text-[11px] text-[var(--muted)]">
        {filtered.length} {q ? "matches" : "items"} · {filter === "all" ? "ALL" : filter === "ENTITY" ? "ENTITIES" : filter + "S"}
        {q && <span className="text-[var(--ember)]"> · &quot;{q}&quot;</span>}
        {" · "}Local-first, encrypted at rest
      </div>

      {filtered.length === 0 && (demoMode || realFiles.length > 0) && (
        <div className="p-12 rounded-xl border border-dashed border-[var(--line-2)] text-center">
          <div className="text-[15px] mb-1">No files match.</div>
          <div className="mono cap text-[11px] text-[var(--muted)]">Adjust search or filter.</div>
        </div>
      )}

      {filtered.length > 0 && view === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((f, i) => (
            <motion.div
              key={f.id + i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              whileHover={{ y: -3 }}
              className="p-5 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--ember)]/30 transition group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="mono cap text-[9px] text-[var(--ember)]">◆ {f.kind}</div>
                <div className="mono cap text-[9px] text-[var(--muted)]">{f.source}</div>
              </div>
              <h3 className="text-[14px] font-medium mb-2 line-clamp-2">{f.title}</h3>
              <p className="text-[12px] text-[var(--text-2)] line-clamp-2 mb-3">{summaryOf(f)}</p>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {f.tags?.map((t) => (
                  <span key={t} className="mono text-[9px] px-1.5 py-0.5 rounded border border-[var(--line)] text-[var(--muted)]">
                    #{t}
                  </span>
                ))}
              </div>
              {f.source_url && (
                <a
                  href={f.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono text-[10px] text-[var(--ember)] flex items-center gap-1 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open in {f.source} <ExternalLink size={10} />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {filtered.length > 0 && view === "list" && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden">
          {filtered.map((f, i) => (
            <motion.div
              key={f.id + i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              className="flex items-center gap-4 px-5 py-3 border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg-2)]"
            >
              <div className="mono cap text-[10px] text-[var(--ember)] w-16 flex-shrink-0">{f.kind}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] truncate">{f.title}</div>
                <div className="text-[12px] text-[var(--muted)] line-clamp-1">{summaryOf(f)}</div>
              </div>
              <div className="mono cap text-[10px] text-[var(--muted)]">{f.source}</div>
              {f.source_url && (
                <a href={f.source_url} target="_blank" rel="noopener noreferrer" className="text-[var(--ember)]" aria-label="Open">
                  <ExternalLink size={13} />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
