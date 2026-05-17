"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { Logo } from "@/components/logo";
import { ConnIcon } from "@/components/conn-icon";
import { SplitText } from "@/components/split-text";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  SkipForward,
  Sparkles,
  Shield,
  Download,
  Monitor,
  ExternalLink,
  Loader2,
  UploadCloud,
  FilePlus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

type StepId = "welcome" | "linkedin" | "slack" | "notion" | "desktop" | "review";

interface Step {
  id: StepId;
  title: string;
  subtitle: string;
}

const STEPS: Step[] = [
  { id: "welcome", title: "Welcome to Qyntra", subtitle: "5 quick steps · skip anytime" },
  { id: "linkedin", title: "Connect LinkedIn", subtitle: "Profile, posts, network" },
  { id: "slack", title: "Connect Slack", subtitle: "Channels and messages" },
  { id: "notion", title: "Connect Notion", subtitle: "Workspaces, pages, docs" },
  { id: "desktop", title: "Connect Desktop", subtitle: "Local files indexed privately" },
  { id: "review", title: "You're ready", subtitle: "Enter your workspace" },
];

const LS_ONBOARDED = "qyntra:onboarded";
const LS_DEMO = "qyntra:demo-mode";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [idx, setIdx] = useState(0);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin?callbackUrl=/onboarding");
  }, [status, router]);

  const step = STEPS[idx];
  const progress = ((idx + 1) / STEPS.length) * 100;

  function next() { setIdx((i) => Math.min(i + 1, STEPS.length - 1)); }
  function back() { setIdx((i) => Math.max(i - 1, 0)); }

  function markConnected(id: string) { setConnected((c) => ({ ...c, [id]: true })); }

  async function finish(demoMode: boolean) {
    setSaving(true);
    try {
      localStorage.setItem(LS_ONBOARDED, "1");
      localStorage.setItem(LS_DEMO, demoMode ? "1" : "0");
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarded: true, demo_mode: demoMode }),
      });
    } catch {}
    router.replace("/home");
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--ember)]" size={28} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white vgrid overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-[var(--line)] bg-black/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Logo size={28} withGlow />
          <span className="pixel text-[16px]">Qyntra</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="pixel text-[12px] text-[var(--muted)] hidden sm:inline">
            Step {idx + 1} of {STEPS.length}
          </span>
          <button
            onClick={() => finish(true)}
            disabled={saving}
            className="pixel text-[12px] text-[var(--text-2)] hover:text-[var(--ember)] flex items-center gap-1.5"
          >
            <SkipForward size={13} /> Skip — see demo
          </button>
        </div>
      </nav>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--line)] overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--ember)] to-[var(--gold)]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Stepper */}
      <div className="px-6 py-4 border-b border-[var(--line)] flex gap-1.5 overflow-x-auto">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => i < idx && setIdx(i)}
            disabled={i > idx}
            className={`pixel text-[10px] px-2.5 py-1 rounded transition flex-shrink-0 flex items-center gap-1.5 ${
              i === idx
                ? "bg-[var(--ember)]/15 text-[var(--ember)] border border-[var(--ember)]/30"
                : i < idx
                ? "text-[var(--good)] border border-[var(--good)]/30 bg-[var(--good)]/5"
                : "text-[var(--muted)] border border-[var(--line)]"
            }`}
          >
            {i < idx && <Check size={10} />}
            {String(i + 1).padStart(2, "0")} · {s.title}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="max-w-[760px] mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pixel text-[12px] text-[var(--ember)] mb-3">
              {step.subtitle}
            </div>
            <h1 className="pixel text-[44px] sm:text-[56px] leading-[1.05] mb-3">
              <SplitText text={step.title} stagger={28} />
            </h1>

            {step.id === "welcome" && <WelcomeStep email={session?.user?.email || ""} />}
            {step.id === "linkedin" && <ProviderStep id="linkedin" name="LinkedIn" desc="Index your profile, posts, and network. Read-only." authProvider="linkedin" connected={!!connected.linkedin} onConnected={() => markConnected("linkedin")} />}
            {step.id === "slack" && <ProviderStep id="slack" name="Slack" desc="Channels you choose. Threads, files, links." authProvider="slack" connected={!!connected.slack} onConnected={() => markConnected("slack")} />}
            {step.id === "notion" && <ProviderStep id="notion" name="Notion" desc="Pages, databases, comments. Public integration." authProvider="notion" connected={!!connected.notion} onConnected={() => markConnected("notion")} />}
            {step.id === "desktop" && <DesktopStep connected={!!connected.desktop} onConnected={() => markConnected("desktop")} />}
            {step.id === "review" && <ReviewStep connected={connected} />}

            {/* Footer controls */}
            <div className="mt-12 flex items-center justify-between gap-3">
              <button
                onClick={back}
                disabled={idx === 0}
                className="pixel text-[13px] px-4 py-2.5 rounded border border-[var(--line)] hover:bg-[var(--bg-1)] flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={13} /> Back
              </button>
              <div className="flex items-center gap-2">
                {idx < STEPS.length - 1 && (
                  <button
                    onClick={() => finish(true)}
                    className="pixel text-[12px] px-4 py-2.5 rounded text-[var(--text-2)] hover:text-white"
                  >
                    Skip rest →
                  </button>
                )}
                {idx < STEPS.length - 1 ? (
                  <button
                    onClick={next}
                    className="pixel text-[13px] px-5 py-2.5 rounded bg-[var(--ember)] text-white hover:bg-[var(--ember-2)] flex items-center gap-2"
                  >
                    Next <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    onClick={() => finish(false)}
                    disabled={saving}
                    className="pixel text-[13px] px-5 py-2.5 rounded bg-[var(--ember)] text-white hover:bg-[var(--ember-2)] flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Enter workspace
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function WelcomeStep({ email }: { email: string }) {
  return (
    <>
      <p className="pixel text-[16px] text-[var(--text-2)] leading-[1.55] mb-8 max-w-[560px]">
        Signed in as <span className="text-[var(--ember)]">{email}</span>. We&apos;ll walk you through 4 connectors. You can skip any of them — your workspace will just stay smaller.
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: Shield, title: "Private workspace", body: "Only you can read your data. RLS-enforced." },
          { icon: Sparkles, title: "Predictive recall", body: "Each connector trains your next-page predictions." },
          { icon: Check, title: "Skip safely", body: "Demo mode preloads sample data so you can explore." },
        ].map((f, i) => (
          <div key={i} className="p-4 rounded border border-[var(--line)] bg-[var(--bg-1)]">
            <f.icon size={16} className="text-[var(--ember)] mb-2" />
            <div className="pixel text-[14px] mb-1">{f.title}</div>
            <div className="pixel text-[12px] text-[var(--text-2)] leading-relaxed">{f.body}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function ProviderStep({
  id,
  name,
  desc,
  authProvider,
  connected,
  onConnected,
}: {
  id: string;
  name: string;
  desc: string;
  authProvider: string;
  connected: boolean;
  onConnected: () => void;
}) {
  function handleConnect() {
    // Hand-off to NextAuth; on return, the provider entry is already linked
    signIn(authProvider, { callbackUrl: "/onboarding" });
    onConnected();
  }

  return (
    <div>
      <p className="pixel text-[15px] text-[var(--text-2)] leading-[1.55] mb-8 max-w-[560px]">
        {desc}
      </p>
      <div className="p-6 rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)] flex items-center gap-5">
        <div className="size-16 rounded-lg bg-[var(--bg-2)] flex items-center justify-center flex-shrink-0">
          <ConnIcon kind={id} size={36} />
        </div>
        <div className="flex-1">
          <div className="pixel text-[18px] mb-1">{name}</div>
          <div className="pixel text-[12px] text-[var(--muted)]">
            {connected ? "Connected · syncing every 5m" : "OAuth read-only. Disconnect anytime."}
          </div>
        </div>
        {connected ? (
          <span className="pixel text-[12px] text-[var(--good)] flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--good)]/30 bg-[var(--good)]/10">
            <Check size={12} /> Connected
          </span>
        ) : (
          <button
            onClick={handleConnect}
            className="pixel text-[13px] px-4 py-2.5 rounded bg-[var(--ember)] text-white hover:bg-[var(--ember-2)] flex items-center gap-2"
          >
            Connect <ExternalLink size={12} />
          </button>
        )}
      </div>

      <div className="mt-6 p-4 rounded border border-dashed border-[var(--line)] text-[12.5px] text-[var(--text-2)] leading-relaxed">
        <strong className="text-white">What we read:</strong> public profile, posts, and items you explicitly share with this integration. We never write.
      </div>
    </div>
  );
}

function DesktopStep({ connected, onConnected }: { connected: boolean; onConnected: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setUploadMsg({ type: "ok", text: `${ok} file${ok > 1 ? "s" : ""} ingested.` });
      onConnected();
    } else {
      setUploadMsg({ type: "err", text: `${ok} uploaded, ${fail} failed.` });
      if (ok > 0) onConnected();
    }
    setTimeout(() => setUploadMsg(null), 5000);
  }

  return (
    <>
      <p className="pixel text-[15px] text-[var(--text-2)] leading-[1.55] mb-6 max-w-[560px]">
        Upload files directly from your desktop. They are parsed on the server and stored as text-only in your private workspace.
      </p>

      <div className="space-y-3">
        {/* Live upload card */}
        <div className="p-5 rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)]">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded bg-[var(--ember)]/15 border border-[var(--ember)]/30 flex items-center justify-center flex-shrink-0">
              <Monitor size={20} className="text-[var(--ember)]" />
            </div>
            <div className="flex-1">
              <div className="pixel text-[16px] mb-1">Desktop ingestion</div>
              <p className="pixel text-[12.5px] text-[var(--text-2)] leading-relaxed mb-3">
                Drag & drop or select files below. Supports TXT, MD, PDF, DOCX, CSV, JSON. Parsed server-side, text-only storage.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.pdf,.docx,.csv,.json"
                className="hidden"
                onChange={(e) => uploadFiles(e.target.files)}
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="pixel text-[11px] px-3 py-1.5 rounded bg-[var(--ember)] text-white hover:bg-[var(--ember-2)] flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={11} className="animate-spin" /> : <UploadCloud size={11} />}
                  {uploading ? "Ingesting…" : "Select files"}
                </button>
                {connected && (
                  <span className="pixel text-[11px] text-[var(--good)] flex items-center gap-1">
                    <Check size={11} /> Desktop connected
                  </span>
                )}
              </div>

              {uploadMsg && (
                <div className={`mt-3 p-2 rounded border flex items-center gap-2 text-[12px] ${uploadMsg.type === "ok" ? "border-[var(--good)]/30 bg-[var(--good)]/10 text-[var(--good)]" : "border-[var(--bad)]/30 bg-[var(--bad)]/10 text-[var(--bad)]"}`}>
                  {uploadMsg.type === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {uploadMsg.text}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alternative link to files page */}
        <div className="p-5 rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)]">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center flex-shrink-0">
              <FilePlus size={20} className="text-[var(--gold)]" />
            </div>
            <div className="flex-1">
              <div className="pixel text-[16px] mb-1">Manage all files</div>
              <p className="pixel text-[12.5px] text-[var(--text-2)] leading-relaxed mb-3">
                Want to upload more later, browse existing files, or delete items? Head to the Files page anytime.
              </p>
              <Link
                href="/files"
                className="pixel text-[11px] px-3 py-1.5 rounded border border-[var(--ember)]/40 text-[var(--ember)] hover:bg-[var(--ember)]/10 inline-flex items-center gap-1.5"
              >
                Open Files →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ReviewStep({ connected }: { connected: Record<string, boolean> }) {
  const count = Object.values(connected).filter(Boolean).length;
  return (
    <>
      <p className="pixel text-[16px] text-[var(--text-2)] leading-[1.55] mb-8 max-w-[560px]">
        {count > 0
          ? `${count} connector${count > 1 ? "s" : ""} linked. Background sync will run automatically every 5 minutes.`
          : "No connectors linked yet. You can jump in and demo the app, or come back to /sources to add them anytime."}
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-5 rounded-xl border border-[var(--ember)]/40 bg-[var(--ember)]/5">
          <div className="pixel text-[12px] text-[var(--ember)] mb-1">CLEAN WORKSPACE</div>
          <div className="pixel text-[20px] mb-2">Start empty</div>
          <p className="pixel text-[12px] text-[var(--text-2)] leading-relaxed">
            Files, claims, predictions all zeroed. Populates as your connectors sync.
          </p>
        </div>
        <div className="p-5 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/5">
          <div className="pixel text-[12px] text-[var(--gold)] mb-1">DEMO LOADED</div>
          <div className="pixel text-[20px] mb-2">Try with sample data</div>
          <p className="pixel text-[12px] text-[var(--text-2)] leading-relaxed">
            Toggle &quot;Demo mode&quot; on the dashboard top bar anytime.
          </p>
        </div>
      </div>
    </>
  );
}
