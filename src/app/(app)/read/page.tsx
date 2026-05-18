"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfileStore } from "@/lib/profile-store";
import {
  Search,
  X,
  RefreshCw,
  FileText,
  ChevronLeft,
  ExternalLink,
  Tag,
  Clock,
  AlertCircle,
} from "lucide-react";

interface UFile {
  id: string;
  source: string;
  source_url?: string;
  kind: string;
  title: string;
  summary?: string;
  content?: string;
  tags?: string[];
  last_modified?: string;
  created_at?: string;
}

export default function ReadPage() {
  const [files, setFiles] = useState<UFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<UFile | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const { demoMode, init } = useProfileStore();

  useEffect(() => {
    init();
  }, [init]);

  const loadFiles = useCallback(async () => {
    // Real files always win over demoMode flag
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/files");
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to load" }));
        setError(err.error || "Failed to load files");
        return;
      }
      const json = await res.json();
      setFiles(json.files || []);
    } catch {
      setError("Network error loading files");
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const filtered = files.filter((f) => {
    if (filter !== "all" && f.kind !== filter) return false;
    if (q.trim()) {
      const needle = q.toLowerCase().trim();
      const hay = [f.title, f.summary, f.kind, f.source, ...(f.tags || [])].join(" ").toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  async function openFile(file: UFile) {
    setSelectedFile(file);
    setFileContent(null);
    setContentLoading(true);
    try {
      const res = await fetch(`/api/files?id=${file.id}`);
      if (!res.ok) {
        setFileContent("[Error loading content]");
        return;
      }
      const json = await res.json();
      const content = json.file?.content || json.file?.summary || "[No content available]";
      setFileContent(content);
    } catch {
      setFileContent("[Error loading content]");
    } finally {
      setContentLoading(false);
    }
  }

  // Demo mode: show placeholder
  if (demoMode) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <FileText size={40} className="mx-auto text-[var(--muted)] mb-4" />
          <div className="text-[18px] font-semibold mb-2">Read Mode</div>
          <div className="text-[13px] text-[var(--text-2)] mb-4">
            In demo mode, sample articles are shown. Connect a source and disable demo mode to read your real files here.
          </div>
          <button
            onClick={() => useProfileStore.getState().setDemoMode(false)}
            className="mono cap text-[11px] px-4 py-2 rounded bg-[var(--ember)] text-white hover:bg-[var(--ember-2)]"
          >
            Exit Demo Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[380px_1fr] overflow-hidden">
      {/* File list sidebar */}
      <aside className="border-r border-[var(--line)] bg-[var(--bg)] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[var(--line)]">
          <div className="mono cap text-[11px] text-[var(--ember)] mb-2">Surface 04 · Read</div>
          <h1 className="text-[18px] font-bold tracking-tight">Your Knowledge</h1>
          <div className="mono cap text-[10px] text-[var(--muted)] mt-1">
            {files.length} files · {filtered.length} shown
          </div>
        </div>

        <div className="p-3 border-b border-[var(--line)] space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--bg-1)] border border-[var(--line)] focus-within:border-[var(--ember)]/40">
            <Search size={14} className="text-[var(--muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search files…"
              className="flex-1 bg-transparent outline-none text-[13px]"
            />
            {q && (
              <button onClick={() => setQ("")} className="text-[var(--muted)] hover:text-[var(--text)]">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {["all", "PAGE", "DOC", "PDF", "EMAIL", "THREAD"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`mono cap text-[9px] px-2 py-1 rounded transition flex-shrink-0 ${
                  filter === f ? "bg-[var(--ember)]/15 text-[var(--ember)] border border-[var(--ember)]/30" : "border border-[var(--line)] text-[var(--text-2)]"
                }`}
              >
                {f === "all" ? "ALL" : f + "S"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && files.length === 0 && (
            <div className="p-8 text-center text-[var(--muted)] text-[13px]">Loading files…</div>
          )}

          {error && (
            <div className="p-4 m-3 rounded border border-[var(--bad)]/30 bg-[var(--bad)]/5 text-[var(--bad)] text-[12px] flex items-center gap-2">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          {!loading && files.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-[15px] mb-2">No files yet.</div>
              <div className="text-[12px] text-[var(--text-2)] mb-4">
                Connect a source or upload files to start reading.
              </div>
            </div>
          )}

          {filtered.map((f) => (
            <button
              key={f.id}
              onClick={() => openFile(f)}
              className={`w-full text-left px-4 py-3 border-b border-[var(--line)] hover:bg-[var(--bg-1)] transition ${
                selectedFile?.id === f.id ? "bg-[var(--ember)]/5 border-l-2 border-l-[var(--ember)]" : "border-l-2 border-l-transparent"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="mono cap text-[9px] text-[var(--ember)]">{f.kind}</div>
                <div className="mono cap text-[9px] text-[var(--muted)]">{f.source}</div>
              </div>
              <div className="text-[13px] font-medium truncate mb-1">{f.title}</div>
              {f.summary && (
                <div className="text-[11px] text-[var(--text-2)] line-clamp-2 mb-1.5">{f.summary}</div>
              )}
              <div className="flex items-center gap-2">
                {f.tags?.slice(0, 3).map((t) => (
                  <span key={t} className="mono text-[8px] px-1 py-0.5 rounded bg-[var(--bg-2)] text-[var(--muted)]">
                    #{t}
                  </span>
                ))}
                {f.last_modified && (
                  <span className="mono text-[8px] text-[var(--muted)] flex items-center gap-0.5 ml-auto">
                    <Clock size={8} /> {new Date(f.last_modified).toLocaleDateString()}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-[var(--line)]">
          <button
            onClick={loadFiles}
            disabled={loading}
            className="w-full mono cap text-[10px] px-3 py-2 rounded border border-[var(--line)] text-[var(--text-2)] hover:bg-[var(--bg-1)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            {loading ? "REFRESHING…" : "REFRESH FILES"}
          </button>
        </div>
      </aside>

      {/* Content viewer */}
      <main className="flex-1 overflow-y-auto bg-[var(--bg-1)]">
        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div
              key={selectedFile.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="max-w-[800px] mx-auto px-6 sm:px-10 py-8"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="mono cap text-[10px] text-[var(--ember)] mb-1 flex items-center gap-2">
                    <FileText size={10} /> {selectedFile.kind} · {selectedFile.source}
                  </div>
                  <h1 className="text-[24px] sm:text-[32px] font-bold tracking-tight leading-tight">{selectedFile.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                  {selectedFile.source_url && (
                    <a
                      href={selectedFile.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono text-[10px] px-3 py-1.5 rounded border border-[var(--line)] text-[var(--text-2)] hover:bg-[var(--bg-2)] flex items-center gap-1"
                    >
                      Open <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>

              {/* Metadata bar */}
              <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-[var(--line)]">
                {selectedFile.tags?.map((t) => (
                  <span key={t} className="mono text-[9px] px-2 py-1 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--muted)] flex items-center gap-1">
                    <Tag size={8} /> {t}
                  </span>
                ))}
                {selectedFile.last_modified && (
                  <span className="mono text-[9px] text-[var(--muted)] flex items-center gap-1">
                    <Clock size={9} /> Last modified {new Date(selectedFile.last_modified).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Content */}
              {contentLoading ? (
                <div className="py-12 text-center text-[var(--muted)] text-[13px]">Loading content…</div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-[var(--text-2)] bg-transparent p-0 border-0">
                    {fileContent || selectedFile.summary || "[No content available]"}
                  </pre>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center max-w-sm px-6">
                <FileText size={48} className="mx-auto text-[var(--line-2)] mb-4" />
                <div className="text-[16px] font-medium mb-2">Select a file to read</div>
                <div className="text-[13px] text-[var(--text-2)]">
                  Choose from your ingested knowledge on the left. Files from Drive, Notion, Gmail, GitHub, and desktop uploads appear here.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
