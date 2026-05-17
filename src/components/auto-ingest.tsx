"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  FolderOpen,
  Loader2,
  CheckCircle,
  FileText,
  AlertCircle,
  HardDrive,
  Lock,
  Eye,
  X,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

interface FileSystemDirectoryHandle {
  kind: "directory";
  name: string;
  values(): AsyncIterableIterator<FileSystemHandle>;
}

interface FileSystemFileHandle {
  kind: "file";
  name: string;
  getFile(): Promise<File>;
}

type FileSystemHandle = FileSystemDirectoryHandle | FileSystemFileHandle;

interface AutoIngestProps {
  onComplete?: (count: number) => void;
  variant?: "onboarding" | "page";
}

const SUPPORTED_EXTS = [".txt", ".md", ".pdf", ".docx", ".csv", ".json", ".xml", ".html", ".css", ".js", ".ts", ".py", ".sql"];

function isSupported(name: string): boolean {
  const n = name.toLowerCase();
  return SUPPORTED_EXTS.some((ext) => n.endsWith(ext));
}

export function AutoIngest({ onComplete, variant = "page" }: AutoIngestProps) {
  const [step, setStep] = useState<"idle" | "privacy" | "picker" | "scanning" | "uploading" | "done" | "error">(
    "idle"
  );
  const [filesFound, setFilesFound] = useState(0);
  const [uploaded, setUploaded] = useState(0);
  const [failed, setFailed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dirName, setDirName] = useState("");
  const abortRef = useRef(false);

  const isSupportedBrowser = typeof window !== "undefined" && !!window.showDirectoryPicker;

  const reset = useCallback(() => {
    setStep("idle");
    setFilesFound(0);
    setUploaded(0);
    setFailed(0);
    setError(null);
    setDirName("");
    abortRef.current = false;
  }, []);

  async function scanDirectory(dirHandle: FileSystemDirectoryHandle): Promise<File[]> {
    const files: File[] = [];
    const queue: FileSystemDirectoryHandle[] = [dirHandle];

    while (queue.length > 0 && !abortRef.current) {
      const current = queue.shift()!;
      for await (const entry of current.values()) {
        if (abortRef.current) break;
        if (entry.kind === "directory") {
          queue.push(entry as FileSystemDirectoryHandle);
        } else if (entry.kind === "file" && isSupported(entry.name)) {
          try {
            const file = await (entry as FileSystemFileHandle).getFile();
            files.push(file);
          } catch {
            // skip locked / unreadable files
          }
        }
      }
    }
    return files;
  }

  async function uploadBatch(files: File[], onProgress: (ok: number, fail: number) => void) {
    const concurrency = 5;
    let ok = 0;
    let fail = 0;

    for (let i = 0; i < files.length; i += concurrency) {
      if (abortRef.current) break;
      const chunk = files.slice(i, i + concurrency);
      const results = await Promise.all(
        chunk.map(async (file) => {
          try {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch("/api/files", {
              method: "POST",
              body: form,
            });
            return res.ok;
          } catch {
            return false;
          }
        })
      );
      ok += results.filter(Boolean).length;
      fail += results.filter((r) => !r).length;
      onProgress(ok, fail);
    }
    return { ok, fail };
  }

  async function startIngestion() {
    if (!window.showDirectoryPicker) {
      setError("Your browser doesn't support directory access. Try Chrome or Edge.");
      setStep("error");
      return;
    }

    setStep("picker");
    try {
      const dirHandle = await window.showDirectoryPicker();
      setDirName(dirHandle.name);
      setStep("scanning");

      const files = await scanDirectory(dirHandle);
      setFilesFound(files.length);

      if (files.length === 0) {
        setStep("done");
        onComplete?.(0);
        return;
      }

      setStep("uploading");
      const { ok, fail } = await uploadBatch(files, (okCount, failCount) => {
        setUploaded(okCount);
        setFailed(failCount);
      });

      setStep("done");
      onComplete?.(ok);
    } catch (err: any) {
      if (err.name === "AbortError") {
        reset();
        return;
      }
      setError(err.message || "Access denied or not supported");
      setStep("error");
    }
  }

  // ─── IDLE ─ ask to begin ─────────────────────
  if (step === "idle") {
    return (
      <div className={`rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)] ${variant === "page" ? "p-6" : "p-5"}`}>
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-lg bg-[var(--ember)]/10 border border-[var(--ember)]/30 flex items-center justify-center flex-shrink-0">
            <HardDrive size={22} className="text-[var(--ember)]" />
          </div>
          <div className="flex-1">
            <div className="text-[16px] font-medium mb-1">Autonomous Desktop Ingestion</div>
            <p className="text-[13px] text-[var(--text-2)] leading-relaxed mb-4">
              Grant one-time access to your Desktop or Documents folder. Qyntra scans, parses, and indexes every
              supported file automatically — no drag-and-drop required.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("privacy")}
                className="pixel text-[12px] px-4 py-2 rounded bg-[var(--ember)] text-white hover:bg-[var(--ember-2)] flex items-center gap-2"
              >
                <Shield size={13} /> Start ingestion
              </button>
              {!isSupportedBrowser && (
                <span className="text-[11px] text-[var(--bad)] flex items-center gap-1">
                  <AlertCircle size={12} /> Chrome/Edge required
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PRIVACY ─ permission card ───────────────
  if (step === "privacy") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 ${variant === "page" ? "p-6" : "p-5"}`}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="size-12 rounded-lg bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center flex-shrink-0">
            <Lock size={22} className="text-[var(--gold)]" />
          </div>
          <div>
            <div className="text-[16px] font-medium mb-1">Privacy Permission</div>
            <p className="text-[13px] text-[var(--text-2)] leading-relaxed">
              Before we read your local files, here's exactly what happens:
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          {[
            {
              icon: Eye,
              title: "We read",
              body: "File names & text content only. No images, videos, or binaries.",
            },
            {
              icon: Lock,
              title: "We store",
              body: "Text is saved to your private Supabase workspace. Encrypted at rest. RLS-protected.",
            },
            {
              icon: Shield,
              title: "You control",
              body: "You pick the folder. You can delete any file anytime. We never share data.",
            },
          ].map((item) => (
            <div key={item.title} className="p-3 rounded-lg border border-[var(--line)] bg-[var(--bg-1)]">
              <item.icon size={16} className="text-[var(--ember)] mb-2" />
              <div className="text-[13px] font-medium mb-1">{item.title}</div>
              <div className="text-[12px] text-[var(--text-2)] leading-relaxed">{item.body}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={startIngestion}
            disabled={!isSupportedBrowser}
            className="pixel text-[12px] px-5 py-2.5 rounded bg-[var(--ember)] text-white hover:bg-[var(--ember-2)] flex items-center gap-2 disabled:opacity-50"
          >
            <FolderOpen size={13} />
            Grant folder access
          </button>
          <button
            onClick={reset}
            className="pixel text-[12px] px-4 py-2.5 rounded border border-[var(--line)] hover:bg-[var(--bg-1)] text-[var(--text-2)]"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    );
  }

  // ─── PICKER / SCANNING / UPLOADING ─ progress ──
  if (step === "picker" || step === "scanning" || step === "uploading") {
    const progress =
      step === "uploading" && filesFound > 0
        ? Math.round(((uploaded + failed) / filesFound) * 100)
        : step === "scanning"
        ? undefined
        : 0;

    return (
      <div className={`rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)] ${variant === "page" ? "p-6" : "p-5"}`}>
        <div className="flex items-center gap-3 mb-4">
          <Loader2 size={20} className="animate-spin text-[var(--ember)]" />
          <div>
            <div className="text-[15px] font-medium">
              {step === "picker" && "Waiting for folder selection…"}
              {step === "scanning" && `Scanning "${dirName}"…`}
              {step === "uploading" && `Ingesting ${filesFound} files…`}
            </div>
            <div className="text-[12px] text-[var(--muted)]">
              {step === "scanning" && "Reading file names and filtering supported types"}
              {step === "uploading" && `${uploaded} uploaded · ${failed} failed · ${filesFound - uploaded - failed} remaining`}
            </div>
          </div>
        </div>

        {progress !== undefined && (
          <div className="h-2 bg-[var(--line)] rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-[var(--ember)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
          <FileText size={11} />
          {step === "scanning" && "Looking for TXT, MD, PDF, DOCX, CSV, JSON…"}
          {step === "uploading" && "Parsing text and saving to your private workspace"}
        </div>

        <button onClick={() => { abortRef.current = true; reset(); }} className="mt-3 text-[11px] text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1">
          <X size={11} /> Cancel
        </button>
      </div>
    );
  }

  // ─── DONE ────────────────────────────────────
  if (step === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border border-[var(--good)]/30 bg-[var(--good)]/5 ${variant === "page" ? "p-6" : "p-5"}`}
      >
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-lg bg-[var(--good)]/15 border border-[var(--good)]/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={22} className="text-[var(--good)]" />
          </div>
          <div className="flex-1">
            <div className="text-[16px] font-medium mb-1">
              {uploaded > 0 ? `${uploaded} files ingested` : "No matching files found"}
            </div>
            <p className="text-[13px] text-[var(--text-2)] leading-relaxed mb-4">
              {uploaded > 0
                ? `Your ${uploaded} file${uploaded > 1 ? "s" : ""} from "${dirName}" are now in your private workspace. Search, ask, and explore them in the galaxy.`
                : `We didn't find any supported files in "${dirName}". Supported: TXT, MD, PDF, DOCX, CSV, JSON.`}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                className="pixel text-[11px] px-4 py-2 rounded border border-[var(--line)] hover:bg-[var(--bg-1)] flex items-center gap-1.5"
              >
                <RefreshCw size={11} /> Ingest another folder
              </button>
              <button
                onClick={() => reset()}
                className="pixel text-[11px] px-4 py-2 rounded text-[var(--text-2)] hover:text-[var(--text)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── ERROR ───────────────────────────────────
  if (step === "error") {
    return (
      <div className={`rounded-xl border border-[var(--bad)]/30 bg-[var(--bad)]/5 ${variant === "page" ? "p-6" : "p-5"}`}>
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-lg bg-[var(--bad)]/15 border border-[var(--bad)]/30 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={22} className="text-[var(--bad)]" />
          </div>
          <div className="flex-1">
            <div className="text-[16px] font-medium mb-1">Ingestion failed</div>
            <p className="text-[13px] text-[var(--text-2)] leading-relaxed mb-4">{error}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                className="pixel text-[11px] px-4 py-2 rounded bg-[var(--ember)] text-white hover:bg-[var(--ember-2)] flex items-center gap-1.5"
              >
                <ArrowRight size={11} /> Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Small inline variant for Sources page card ───────────────────────────

export function AutoIngestButton({ onComplete }: { onComplete?: (count: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mono cap text-[10px] px-3 py-1.5 rounded border border-[var(--ember)]/40 text-[var(--ember)] hover:bg-[var(--ember)]/10 flex items-center gap-1.5"
      >
        <HardDrive size={11} /> Auto-ingest
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <AutoIngest
                variant="page"
                onComplete={(count) => {
                  onComplete?.(count);
                  setOpen(false);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
