"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
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
  ExternalLink,
  Loader2,
  AlertCircle,
  Cloud,
} from "lucide-react";
import { AutoIngest } from "@/components/auto-ingest";

type StepId = "welcome" | "cloud" | "desktop" | "review";

interface Step {
  id: StepId;
  title: string;
  subtitle: string;
}

interface AutoResult {
  provider: string;
  label: string;
  inserted?: number;
  error?: string;
}

const STEPS: Step[] = [
  { id: "welcome", title: "Welcome to Qyntra", subtitle: "Consent first - ingest after approval" },
  { id: "cloud", title: "Approve cloud ingest", subtitle: "OAuth source from this sign-in" },
  { id: "desktop", title: "Approve desktop ingest", subtitle: "Local files stay user-selected" },
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
  const [alreadyOnboarded, setAlreadyOnboarded] = useState(false);

  useEffect(() => {
    setAlreadyOnboarded(localStorage.getItem(LS_ONBOARDED) === "1");
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin?callbackUrl=/onboarding");
  }, [status, router]);

  const step = STEPS[idx];
  const progress = ((idx + 1) / STEPS.length) * 100;

  function next() {
    setIdx((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function back() {
    setIdx((i) => Math.max(i - 1, 0));
  }

  function markConnected(id: string) {
    setConnected((c) => ({ ...c, [id]: true }));
  }

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
            <SkipForward size={13} /> Skip - see demo
          </button>
        </div>
      </nav>

      <div className="h-1 bg-[var(--line)] overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--ember)] to-[var(--gold)]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

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
            {String(i + 1).padStart(2, "0")} - {s.title}
          </button>
        ))}
      </div>

      {alreadyOnboarded && (
        <div className="max-w-[760px] mx-auto px-6 pt-6">
          <div className="p-3 rounded border border-[var(--good)]/30 bg-[var(--good)]/5 flex items-center justify-between">
            <span className="pixel text-[12px] text-[var(--good)]">
              Already onboarded.
            </span>
            <button
              onClick={() => finish(false)}
              className="pixel text-[12px] px-3 py-1.5 rounded bg-[var(--ember)] text-white hover:bg-[var(--ember-2)]"
            >
              Enter workspace →
            </button>
          </div>
        </div>
      )}

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
            {step.id === "cloud" && (
              <CloudStep
                provider={session?.provider}
                connected={!!connected.cloud}
                onConnected={() => markConnected("cloud")}
              />
            )}
            {step.id === "desktop" && (
              <DesktopStep
                connected={!!connected.desktop}
                onConnected={() => markConnected("desktop")}
              />
            )}
            {step.id === "review" && <ReviewStep connected={connected} />}

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
                    onClick={next}
                    className="pixel text-[12px] px-4 py-2.5 rounded text-[var(--text-2)] hover:text-white"
                  >
                    Skip this step
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
        Signed in as <span className="text-[var(--ember)]">{email}</span>. Qyntra can ingest from the provider you approved and from folders you explicitly select.
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: Shield, title: "Private workspace", body: "Only your session can read your indexed data." },
          { icon: Sparkles, title: "Auto ingest", body: "Cloud sync starts only after this consent step." },
          { icon: Check, title: "Skip safely", body: "You can connect or ingest more from Sources later." },
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

function CloudStep({
  provider,
  connected,
  onConnected,
}: {
  provider?: string;
  connected: boolean;
  onConnected: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AutoResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const details = getCloudDetails(provider);

  async function approve() {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch("/api/ingest/auto", { method: "POST" });
      const json = await res.json();
      setResults(json.results || []);
      if (!res.ok || !json.ok) {
        setError(json.error || "Auto-ingest failed");
        return;
      }
      onConnected();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="pixel text-[15px] text-[var(--text-2)] leading-[1.55] mb-8 max-w-[560px]">
        {details.description}
      </p>
      <div className="p-6 rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)] flex items-center gap-5">
        <div className="size-16 rounded-lg bg-[var(--bg-2)] flex items-center justify-center flex-shrink-0">
          {details.icon ? <ConnIcon kind={details.icon} size={36} /> : <Cloud size={30} className="text-[var(--ember)]" />}
        </div>
        <div className="flex-1">
          <div className="pixel text-[18px] mb-1">{details.title}</div>
          <div className="pixel text-[12px] text-[var(--muted)]">
            {connected ? "Approved and synced" : "Requires your explicit approval."}
          </div>
        </div>
        {connected ? (
          <span className="pixel text-[12px] text-[var(--good)] flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--good)]/30 bg-[var(--good)]/10">
            <Check size={12} /> Synced
          </span>
        ) : (
          <button
            onClick={approve}
            disabled={loading || !details.supported}
            className="pixel text-[13px] px-4 py-2.5 rounded bg-[var(--ember)] text-white hover:bg-[var(--ember-2)] flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
            Allow ingest
          </button>
        )}
      </div>

      <div className="mt-6 p-4 rounded border border-dashed border-[var(--line)] text-[12.5px] text-[var(--text-2)] leading-relaxed">
        <strong className="text-white">What we read:</strong> {details.reads}
      </div>

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((result) => (
            <div
              key={result.provider}
              className={`p-3 rounded border text-[12px] ${
                result.error
                  ? "border-[var(--bad)]/30 bg-[var(--bad)]/5 text-[var(--bad)]"
                  : "border-[var(--good)]/30 bg-[var(--good)]/5 text-[var(--good)]"
              }`}
            >
              {result.error
                ? `${result.label}: ${result.error}`
                : `${result.label}: ${result.inserted || 0} items ingested`}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded border border-[var(--bad)]/30 bg-[var(--bad)]/5 flex items-start gap-2 text-[12px] text-[var(--bad)]">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}

function getCloudDetails(provider?: string) {
  if (provider === "google") {
    return {
      supported: true,
      icon: "drive",
      title: "Google Drive + Gmail",
      description: "Approve once to ingest your recent Drive files and inbox metadata from the Google account used for sign-in.",
      reads: "Drive file names, links, modified times, Gmail senders, subjects, dates, and snippets. Qyntra never sends mail or edits files.",
    };
  }
  if (provider === "github") {
    return {
      supported: true,
      icon: "github",
      title: "GitHub",
      description: "Approve once to ingest repositories, gists, issues, pull requests, and starred repositories available to this OAuth token.",
      reads: "Repository metadata, gist metadata, issue and pull request titles and bodies, starred repository metadata. Qyntra never writes to GitHub.",
    };
  }
  if (provider === "notion") {
    return {
      supported: true,
      icon: "notion",
      title: "Notion",
      description: "Approve once to ingest pages shared with your Notion integration.",
      reads: "Page titles, URLs, and last edited times from pages available to the integration. Qyntra never edits Notion.",
    };
  }
  return {
    supported: false,
    icon: "",
    title: "No cloud source available",
    description: "This sign-in provider does not expose a supported Qyntra ingestion source.",
    reads: "Nothing is read unless you sign in with Google, GitHub, or Notion, or select a local folder in the desktop step.",
  };
}

function DesktopStep({ connected, onConnected }: { connected: boolean; onConnected: () => void }) {
  return (
    <>
      <p className="pixel text-[15px] text-[var(--text-2)] leading-[1.55] mb-6 max-w-[560px]">
        Browser security blocks silent desktop reads. Pick the folder you want Qyntra to scan, and it will recursively ingest supported text files from that folder.
      </p>

      <AutoIngest
        variant="onboarding"
        onComplete={(count) => {
          if (count > 0) onConnected();
        }}
      />

      {connected && (
        <div className="mt-4 p-3 rounded border border-[var(--good)]/30 bg-[var(--good)]/10 flex items-center gap-2 text-[12px] text-[var(--good)]">
          <Check size={14} /> Desktop ingestion connected
        </div>
      )}

      <div className="mt-4 p-5 rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)]">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center flex-shrink-0">
            <ExternalLink size={20} className="text-[var(--gold)]" />
          </div>
          <div className="flex-1">
            <div className="pixel text-[16px] mb-1">Manage all files</div>
            <p className="pixel text-[12.5px] text-[var(--text-2)] leading-relaxed mb-3">
              Browse, search, or ingest more folders anytime from the Files page.
            </p>
            <Link
              href="/files"
              className="pixel text-[11px] px-3 py-1.5 rounded border border-[var(--ember)]/40 text-[var(--ember)] hover:bg-[var(--ember)]/10 inline-flex items-center gap-1.5"
            >
              Open Files <ArrowRight size={11} />
            </Link>
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
          ? `${count} ingest path${count > 1 ? "s" : ""} approved. Background sync will keep OAuth sources current.`
          : "No ingest paths approved yet. You can enter the workspace now and connect sources later."}
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-5 rounded-xl border border-[var(--ember)]/40 bg-[var(--ember)]/5">
          <div className="pixel text-[12px] text-[var(--ember)] mb-1">CLEAN WORKSPACE</div>
          <div className="pixel text-[20px] mb-2">Start empty</div>
          <p className="pixel text-[12px] text-[var(--text-2)] leading-relaxed">
            Files, claims, and predictions populate as ingestion completes.
          </p>
        </div>
        <div className="p-5 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/5">
          <div className="pixel text-[12px] text-[var(--gold)] mb-1">DEMO LOADED</div>
          <div className="pixel text-[20px] mb-2">Try with sample data</div>
          <p className="pixel text-[12px] text-[var(--text-2)] leading-relaxed">
            Toggle demo mode on the dashboard top bar anytime.
          </p>
        </div>
      </div>
    </>
  );
}
