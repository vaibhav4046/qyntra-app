"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

interface FileSystemDirectoryHandle {
  kind: "directory";
  name: string;
  values?(): AsyncIterableIterator<FileSystemHandle>;
  entries?(): AsyncIterableIterator<[string, FileSystemHandle]>;
  [Symbol.asyncIterator]?(): AsyncIterableIterator<[string, FileSystemHandle]>;
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

const SUPPORTED_EXTS = [
  ".txt", ".md", ".pdf", ".docx", ".doc", ".csv", ".json", ".xml",
  ".html", ".css", ".js", ".ts", ".jsx", ".tsx", ".py", ".sql",
  ".log", ".yaml", ".yml", ".ini", ".cfg", ".sh", ".rb", ".go",
  ".java", ".cpp", ".c", ".h", ".php", ".swift", ".rs", ".scala",
  ".kt", ".r", ".pl", ".lua", ".matlab", ".m", ".ps1", ".bat",
  ".cmd", ".asm", ".s", ".tex", ".bib", ".dockerfile", ".makefile",
  ".graphql", ".proto", ".thrift", ".toml",
];

function isSupported(name: string): boolean {
  const n = name.toLowerCase();
  return SUPPORTED_EXTS.some((ext) => n.endsWith(ext));
}

interface ScanResult {
  files: File[];
  skipped: string[];
  totalSeen: number;
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
  const [skippedFiles, setSkippedFiles] = useState<string[]>([]);
  const [totalSeen, setTotalSeen] = useState(0);
  const [showSkipped, setShowSkipped] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const abortRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUseNativePicker = typeof window !== "undefined" && !!window.showDirectoryPicker;

  const reset = useCallback(() => {
    setStep("idle");
    setFilesFound(0);
    setUploaded(0);
    setFailed(0);
    setError(null);
    setDirName("");
    setSkippedFiles([]);
    setTotalSeen(0);
    setShowSkipped(false);
    setUploadErrors([]);
    abortRef.current = false;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  async function scanDirectory(dirHandle: FileSystemDirectoryHandle): Promise<ScanResult> {
    const files: File[] = [];
    const skipped: string[] = [];
    let totalSeen = 0;
    const queue: FileSystemDirectoryHandle[] = [dirHandle];

    while (queue.length > 0 && !abortRef.current) {
      const current = queue.shift()!;
      try {
        // Try different iterator methods for compatibility
        let iterable: AsyncIterable<FileSystemHandle | [string, FileSystemHandle]> | undefined;
        if (current.values) {
          iterable = current.values() as AsyncIterable<FileSystemHandle>;
        } else if (current.entries) {
          iterable = current.entries() as AsyncIterable<[string, FileSystemHandle]>;
        } else if (Symbol.asyncIterator in current) {
          const iter = (current as any)[Symbol.asyncIterator];
          if (iter) iterable = iter() as AsyncIterable<[string, FileSystemHandle]>;
        }

        if (!iterable) continue;

        for await (const item of iterable) {
          if (abortRef.current) break;
          // Handle both values() and entries() / default iterator
          const entry: FileSystemHandle = Array.isArray(item) ? item[1] : item;
          
          if (entry.kind === "directory") {
            queue.push(entry as FileSystemDirectoryHandle);
          } else if (entry.kind === "file") {
            totalSeen++;
            if (isSupported(entry.name)) {
              try {
                const file = await (entry as FileSystemFileHandle).getFile();
                // Only include non-empty files
                if (file.size > 0) {
                  files.push(file);
                } else {
                  skipped.push(`${entry.name} (empty)`);
                }
              } catch (e) {
                skipped.push(`${entry.name} (unreadable)`);
              }
            } else {
              skipped.push(`${entry.name} (unsupported type)`);
            }
          }
        }
      } catch (e) {
        console.warn("[scanDirectory] error reading directory:", current.name, e);
      }
    }
    return { files, skipped, totalSeen };
  }

  async function uploadBatch(files: File[], onProgress: (ok: number, fail: number) => void) {
    const concurrency = 3;
    let ok = 0;
    let fail = 0;
    const errors: string[] = [];

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
            if (!res.ok) {
              const err = await res.json().catch(() => ({ error: "Upload failed" }));
              return { ok: false, error: `${file.name}: ${err.error || res.statusText}` };
            }
            return { ok: true, error: "" };
          } catch (e) {
            return { ok: false, error: `${file.name}: ${(e as Error).message}` };
          }
        })
      );
      ok += results.filter((r) => r.ok).length;
      fail += results.filter((r) => !r.ok).length;
      errors.push(...results.filter((r) => !r.ok).map((r) => r.error));
      onProgress(ok, fail);
    }
    return { ok, fail, errors };
  }

  async function startIngestion() {
    if (!window.showDirectoryPicker) {
      setError("Your browser doesn't support directory access. Try Chrome or Edge, or use the fallback file picker below.");
      setStep("error");
      return;
    }

    setStep("picker");
    try {
      const dirHandle = await window.showDirectoryPicker();
      setDirName(dirHandle.name);
      setStep("scanning");

      const { files, skipped, totalSeen } = await scanDirectory(dirHandle);
      setFilesFound(files.length);
      setSkippedFiles(skipped.slice(0, 50));
      setTotalSeen(totalSeen);

      if (files.length === 0) {
        setStep("done");
        onComplete?.(0);
        return;
      }

      setStep("uploading");
      const { ok, fail, errors } = await uploadBatch(files, (okCount, failCount) => {
        setUploaded(okCount);
        setFailed(failCount);
      });

      setUploadErrors(errors.slice(0, 10));
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

  // Fallback: use webkitdirectory file input
  async function handleFallbackFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    
    const allFiles = Array.from(fileList);
    const dirName = allFiles[0]?.webkitRelativePath?.split("/")[0] || "selected-folder";
    setDirName(dirName);
    setStep("scanning");

    const files: File[] = [];
    const skipped: string[] = [];
    
    for (const file of allFiles) {
      if (isSupported(file.name)) {
        files.push(file);
      } else {
        skipped.push(`${file.name} (unsupported type)`);
      }
    }

    setFilesFound(files.length);
    setSkippedFiles(skipped.slice(0, 50));
    setTotalSeen(allFiles.length);

    if (files.length === 0) {
      setStep("done");
      onComplete?.(0);
      return;
    }

    setStep("uploading");
    const { ok, fail, errors } = await uploadBatch(files, (okCount, failCount) => {
      setUploaded(okCount);
      setFailed(failCount);
    });

    setUploadErrors(errors.slice(0, 10));
    setStep("done");
    onComplete?.(ok);
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
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setStep("privacy")}
                className="pixel text-[12px] px-4 py-2 rounded bg-[var(--ember)] text-white hover:bg-[var(--ember-2)] flex items-center gap-2"
              >
                <Shield size={13} /> Start ingestion
              </button>
              {!canUseNativePicker && (
                <span className="text-[11px] text-[var(--gold)] flex items-center gap-1">
                  <AlertCircle size={12} /> Fallback mode available below
                </span>
              )}
            </div>
            
            {/* Fallback file picker for all browsers */}
            <div className="mt-4 pt-4 border-t border-[var(--line)]">
              <div className="text-[12px] text-[var(--text-2)] mb-2 flex items-center gap-1.5">
                <FolderOpen size={13} className="text-[var(--muted)]" />
                <span className="text-[var(--muted)]">Or use fallback folder picker (works in all browsers):</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                // @ts-ignore - webkitdirectory is a non-standard but widely supported attribute
                webkitdirectory=""
                directory=""
                multiple
                onChange={(e) => handleFallbackFiles(e.target.files)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="pixel text-[11px] px-4 py-2 rounded border border-[var(--line)] hover:border-[var(--ember)]/50 hover:bg-[var(--bg-2)] text-[var(--text-2)] flex items-center gap-2"
              >
                <FolderOpen size={12} /> Pick folder via file dialog
              </button>
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
              body: "Text is processed and indexed only after your explicit permission. Raw files are never shared publicly.",
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
            disabled={!canUseNativePicker}
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
        
        {!canUseNativePicker && (
          <div className="mt-3 text-[11px] text-[var(--gold)]">
            Your browser doesn't support the native folder picker. Use the fallback picker on the main card instead.
          </div>
        )}
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
              {step === "scanning" && `Found ${filesFound} supported files${totalSeen > 0 ? ` out of ${totalSeen} total` : ""}`}
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
          {step === "scanning" && "Looking for TXT, MD, PDF, DOCX, CSV, JSON, JS, TS, PY, SQL, HTML, CSS, and more…"}
          {step === "uploading" && "Parsing text and indexing into your private workspace"}
        </div>

        <button onClick={() => { abortRef.current = true; reset(); }} className="mt-3 text-[11px] text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1">
          <X size={11} /> Cancel
        </button>
      </div>
    );
  }

  // ─── DONE ────────────────────────────────────
  if (step === "done") {
    const hasFiles = uploaded > 0;
    const allFailed = !hasFiles && failed > 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border ${hasFiles ? "border-[var(--good)]/30 bg-[var(--good)]/5" : allFailed ? "border-[var(--bad)]/30 bg-[var(--bad)]/5" : "border-[var(--gold)]/30 bg-[var(--gold)]/5"} ${variant === "page" ? "p-6" : "p-5"}`}
      >
        <div className="flex items-start gap-4">
          <div className={`size-12 rounded-lg flex items-center justify-center flex-shrink-0 ${hasFiles ? "bg-[var(--good)]/15 border border-[var(--good)]/30" : allFailed ? "bg-[var(--bad)]/15 border border-[var(--bad)]/30" : "bg-[var(--gold)]/15 border border-[var(--gold)]/30"}`}>
            {hasFiles ? <CheckCircle size={22} className="text-[var(--good)]" /> : allFailed ? <AlertCircle size={22} className="text-[var(--bad)]" /> : <FileText size={22} className="text-[var(--gold)]" />}
          </div>
          <div className="flex-1">
            <div className="text-[16px] font-medium mb-1">
              {hasFiles ? `${uploaded} file${uploaded > 1 ? "s" : ""} ingested` : allFailed ? "All uploads failed" : "No matching files found"}
            </div>
            <p className="text-[13px] text-[var(--text-2)] leading-relaxed mb-4">
              {hasFiles
                ? `Your ${uploaded} file${uploaded > 1 ? "s" : ""} from "${dirName}" are now in your private workspace. Search, ask, and explore them in the galaxy.`
                : allFailed
                ? `${failed} files failed to upload. Check the error details below.`
                : `We didn't find any supported files in "${dirName}". ${totalSeen > 0 ? `Scanned ${totalSeen} total files. ` : ""}Supported types include TXT, MD, PDF, DOCX, CSV, JSON, JS, TS, PY, SQL, HTML, CSS, and many more.`}
            </p>
            
            {skippedFiles.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={() => setShowSkipped((s) => !s)}
                  className="text-[11px] text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 mb-1"
                >
                  {showSkipped ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  {skippedFiles.length} skipped files
                </button>
                {showSkipped && (
                  <div className="max-h-[120px] overflow-y-auto text-[10px] text-[var(--muted)] mono p-2 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                    {skippedFiles.map((s, i) => (
                      <div key={i}>{s}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {uploadErrors.length > 0 && (
              <div className="mb-3 p-2 rounded bg-[var(--bad)]/5 border border-[var(--bad)]/20">
                <div className="text-[10px] text-[var(--bad)] mono">
                  {uploadErrors.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3 flex-wrap">
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
              <input
                ref={fileInputRef}
                type="file"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                multiple
                onChange={(e) => { handleFallbackFiles(e.target.files); }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="pixel text-[11px] px-4 py-2 rounded border border-[var(--line)] hover:bg-[var(--bg-1)] text-[var(--text-2)] flex items-center gap-1.5"
              >
                <FolderOpen size={11} /> Use fallback picker
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
