"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { SplitText } from "@/components/split-text";
import { Logo } from "@/components/logo";
import { ArrowRight, Shield, Lock, Zap, ArrowLeft } from "lucide-react";
import { useState } from "react";

export function SignInClient() {
  const params = useSearchParams();
  const mode = params.get("mode") === "signup" ? "signup" : "signin";
  const callbackUrl = params.get("callbackUrl") || "/onboarding";
  const { data: session } = useSession();

  return (
    <div className="relative min-h-screen bg-black text-white vgrid overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[var(--line)] bg-black/60 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} withGlow />
          <span className="pixel text-[16px]">Qyntra</span>
        </Link>
        <Link href="/" className="pixel text-[13px] text-[var(--text-2)] hover:text-white flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back
        </Link>
      </nav>

      <div className="grid lg:grid-cols-[1fr_440px] min-h-[calc(100vh-69px)]">
        {/* Left: pitch */}
        <div className="px-6 sm:px-12 py-10 sm:py-16 flex flex-col justify-center max-w-[720px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="pixel text-[14px] text-[var(--ember)] mb-3"
          >
            {mode === "signup" ? "Create your private workspace" : "Welcome back, soldier"}
          </motion.div>
          <h1 className="pixel text-[36px] sm:text-[48px] lg:text-[64px] leading-[1.05] tracking-tight mb-6">
            <SplitText text={mode === "signup" ? "Spin up your" : "Open your"} stagger={35} />
            <br />
            <span className="text-[var(--ember)]">
              <SplitText text={mode === "signup" ? "own wiki." : "memory."} delay={500} stagger={35} />
            </span>
          </h1>
          <p className="pixel text-[14px] sm:text-[16px] text-[var(--text-2)] leading-relaxed max-w-[520px] mb-10">
            {mode === "signup"
              ? "One sign-in spins up a private workspace bound to your identity. Your files stay yours. No team can see them. No admin can read them."
              : "Sign in to load your indexed files, claims and predictions. Workspace bound to your email identity — only you can open it."}
          </p>

          <div className="space-y-4">
            <Feature icon={Shield} title="Workspace isolation" body="Each user gets a private workspace keyed to their identity. Sessions are JWT-signed and never shared." />
            <Feature icon={Lock} title="Consent-gated ingestion" body="Qyntra reads cloud sources only after OAuth approval, and local folders only after browser folder permission." />
            <Feature icon={Zap} title="Real-time sync" body="Connect a source once. Qyntra polls for updates every 5m. New file → new page → new prediction." />
          </div>
        </div>

        {/* Right: auth card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="border-l border-[var(--line)] bg-[var(--bg-1)] p-6 sm:p-10 flex flex-col justify-center"
        >
          {session?.user ? (
            <div>
              <div className="pixel text-[12px] text-[var(--good)] mb-3">SIGNED IN AS</div>
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-full bg-gradient-to-br from-[var(--ember)] to-[var(--gold)] flex items-center justify-center pixel text-[14px]">
                  {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="text-[15px]">{session.user.name || session.user.email}</div>
                  <div className="pixel text-[11px] text-[var(--muted)]">{session.user.email}</div>
                </div>
              </div>
              <Link
                href={callbackUrl}
                className="block w-full px-5 py-3 rounded bg-[var(--ember)] text-white pixel text-[15px] hover:bg-[var(--ember-2)] transition text-center flex items-center justify-center gap-2"
              >
                Enter your workspace <ArrowRight size={15} />
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full mt-2 px-5 py-3 rounded border border-[var(--line-2)] pixel text-[13px] hover:bg-[var(--bg-2)] transition"
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <div className="pixel text-[12px] text-[var(--ember)] mb-2">
                {mode === "signup" ? "CREATE WORKSPACE" : "SIGN IN"}
              </div>
              <h2 className="pixel text-[28px] mb-1">
                {mode === "signup" ? "Get started" : "Welcome back"}
              </h2>
              <p className="pixel text-[13px] text-[var(--text-2)] mb-6">
                Passwordless sign-in via magic link. Enter your email and we send you an instant sign-in link.
              </p>

              <EmailSignupForm mode={mode} />
              <div className="mt-6 pt-6 border-t border-[var(--line)] flex flex-col gap-2">
                <Link
                  href="/demo"
                  className="pixel text-[13px] text-[var(--gold)] hover:text-[var(--gold)]/80 flex items-center gap-2"
                >
                  <Zap size={13} /> Try Demo Workspace (no sign-in)
                </Link>
                <Link
                  href={mode === "signup" ? "/signin" : "/signin?mode=signup"}
                  className="pixel text-[13px] text-[var(--text-2)] hover:text-[var(--ember)]"
                >
                  {mode === "signup" ? "Already have a workspace? Sign in →" : "No workspace yet? Create one →"}
                </Link>
              </div>

              <p className="pixel text-[10px] text-[var(--muted)] mt-6 leading-relaxed">
                By continuing you agree to our Terms and Privacy Policy. Qyntra never reads your password.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AuthResult {
  ok?: boolean;
  msg: string;
  magicLink?: string;
  emailed?: boolean;
}

function EmailSignupForm({ mode }: { mode: "signin" | "signup" }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(mode === "signin");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AuthResult | null>(null);
  const isSignup = mode === "signup";

  const valid = EMAIL_RE.test(email.trim()) && accepted;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const body = { email: email.trim(), name: name.trim() };
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok && json.magicLink) {
        setResult({ ok: true, msg: "Signing you in…", magicLink: json.magicLink, emailed: json.emailed });
        window.location.href = json.magicLink;
      } else if (res.ok) {
        setResult({ ok: true, msg: json.message || "Done.", magicLink: json.magicLink });
      } else {
        setResult({ ok: false, msg: json.error || (isSignup ? "Sign-up failed." : "Sign-in failed.") });
      }
    } catch (err) {
      setResult({ ok: false, msg: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {isSignup && (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full px-3 py-2.5 rounded border border-[var(--line)] bg-[var(--bg-2)] text-[13px] outline-none focus:border-[var(--ember)]/50"
          autoComplete="name"
        />
      )}
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full px-3 py-2.5 rounded border border-[var(--line)] bg-[var(--bg-2)] text-[13px] outline-none focus:border-[var(--ember)]/50"
        autoComplete="email"
      />
      {isSignup && (
        <label className="flex items-start gap-2 pixel text-[11px] text-[var(--text-2)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 accent-[var(--ember)]"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-[var(--ember)] hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[var(--ember)] hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
      )}
      <button
        type="submit"
        disabled={!valid || busy}
        className="w-full px-4 py-2.5 rounded bg-[var(--ember)] text-white pixel text-[13px] hover:bg-[var(--ember-2)] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {busy ? "Working…" : isSignup ? "Create account & enter workspace" : "Email me a sign-in link"}
        <ArrowRight size={13} />
      </button>
      {result && (
        <div
          className={`mt-3 p-3 rounded border text-[11.5px] pixel ${
            result.ok
              ? "border-[var(--good)]/40 bg-[var(--good)]/10 text-[var(--good)]"
              : "border-[var(--bad)]/40 bg-[var(--bad)]/10 text-[var(--bad)]"
          }`}
        >
          <div className="mb-2">{result.msg}</div>
          {result.magicLink && (
            <a
              href={result.magicLink}
              className="block w-full px-3 py-2.5 rounded bg-[var(--ember)] text-white pixel text-[12px] hover:bg-[var(--ember-2)] transition text-center"
            >
              {result.emailed ? "Open my workspace (sent to your inbox too)" : "Open my workspace →"}
            </a>
          )}
        </div>
      )}
    </form>
  );
}

function Feature({ icon: Icon, title, body }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="size-9 rounded bg-[var(--ember)]/10 border border-[var(--ember)]/30 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-[var(--ember)]" />
      </div>
      <div>
        <div className="pixel text-[15px] mb-0.5">{title}</div>
        <div className="pixel text-[12.5px] text-[var(--text-2)] leading-relaxed">{body}</div>
      </div>
    </div>
  );
}
