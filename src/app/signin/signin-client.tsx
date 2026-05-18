"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { SplitText } from "@/components/split-text";
import { Logo } from "@/components/logo";
import { ConnIcon } from "@/components/conn-icon";
import { ArrowRight, Shield, Lock, Zap, ArrowLeft, AlertCircle, ExternalLink, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";

const ALL_PROVIDERS = [
  { id: "google", label: "Google", icon: "google", desc: "Sign in once. Drive + Gmail scopes included.", color: "#4285F4", env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
  { id: "notion", label: "Notion", icon: "notion", desc: "Sign in with your Notion workspace", color: "#ffffff", env: ["NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET", "NOTION_REDIRECT_URI"] },
  { id: "github", label: "GitHub", icon: "github", desc: "Repos, issues, gists", color: "#ffffff", env: ["GITHUB_ID", "GITHUB_SECRET"] },
];

export function SignInClient() {
  const params = useSearchParams();
  const mode = params.get("mode") === "signup" ? "signup" : "signin";
  const callbackUrl = params.get("callbackUrl") || "/onboarding";
  const { data: session } = useSession();
  const [configured, setConfigured] = useState<string[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((json) => {
        // Auth.js built-in format: { providerId: { id, name, type, ... } }
        // Custom format: { providers: [{ id, name }] }
        let ids: string[] = [];
        if (Array.isArray(json.providers)) {
          ids = json.providers.map((p: any) => p.id);
        } else if (typeof json === "object" && json !== null) {
          // Auth.js built-in format
          ids = Object.values(json).map((p: any) => p.id).filter(Boolean);
        }
        setConfigured(ids);
        setLoadingProviders(false);
      })
      .catch(() => setLoadingProviders(false));
  }, []);

  function handleSignIn(providerId: string) {
    // Auth.js v5 beta.31 client has a bug where signIn() redirects to
    // /api/auth/signin/{provider} via GET, but the server only accepts POST.
    // We manually POST a form to /api/auth/signin instead.
    fetch("/api/auth/csrf", { credentials: "include" })
      .then((r) => r.json())
      .then(({ csrfToken }) => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/api/auth/signin";
        form.style.display = "none";

        const providerInput = document.createElement("input");
        providerInput.type = "hidden";
        providerInput.name = "provider";
        providerInput.value = providerId;
        form.appendChild(providerInput);

        const callbackInput = document.createElement("input");
        callbackInput.type = "hidden";
        callbackInput.name = "callbackUrl";
        callbackInput.value = callbackUrl;
        form.appendChild(callbackInput);

        const csrfInput = document.createElement("input");
        csrfInput.type = "hidden";
        csrfInput.name = "csrfToken";
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);

        document.body.appendChild(form);
        form.submit();
      })
      .catch(() => {
        // Fallback: try the broken signIn() anyway
        signIn(providerId, { callbackUrl });
      });
  }

  // Show all providers — disable click on unconfigured ones (clearer than hiding)
  const availableProviders = ALL_PROVIDERS.map((p) => ({
    ...p,
    enabled: configured.includes(p.id),
  }));
  const anyConfigured = availableProviders.some((p) => p.enabled);
  const noProviders = !loadingProviders && !anyConfigured;

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
              : "Sign in to load your indexed files, claims and predictions. Workspace bound to your provider identity — only you can open it."}
          </p>

          <div className="space-y-4">
            <Feature icon={Shield} title="Workspace isolation" body="Each user gets a private workspace keyed to their OAuth identity. Sessions are JWT-signed and never shared." />
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
                {mode === "signup" ? "Pick how to start" : "Welcome back"}
              </h2>
              <p className="pixel text-[13px] text-[var(--text-2)] mb-6">
                Use OAuth for instant ingestion of that source. Or email + password and connect sources later.
              </p>

              <div className="space-y-2">
                {loadingProviders ? (
                  <div className="text-[13px] text-[var(--muted)] py-4">Loading providers…</div>
                ) : (
                  <>
                    {availableProviders.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => p.enabled && handleSignIn(p.id)}
                        disabled={!p.enabled}
                        title={p.enabled ? `Continue with ${p.label}` : `${p.label} OAuth not configured. Use email + password below.`}
                        className={`w-full p-4 rounded border transition flex items-center gap-3 text-left group ${
                          p.enabled
                            ? "border-[var(--line)] hover:border-[var(--ember)]/50 hover:bg-[var(--bg-2)] cursor-pointer"
                            : "border-[var(--line)] opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="size-10 rounded bg-[var(--bg-2)] flex items-center justify-center flex-shrink-0">
                          <ConnIcon kind={p.icon} size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] flex items-center gap-2">
                            Continue with {p.label}
                            {!p.enabled && (
                              <span className="pixel text-[9px] px-1.5 py-0.5 rounded bg-[var(--muted)]/20 text-[var(--muted)]">
                                SETUP
                              </span>
                            )}
                          </div>
                          <div className="pixel text-[11px] text-[var(--muted)]">{p.desc}</div>
                        </div>
                        <ArrowRight
                          size={14}
                          className={`text-[var(--muted)] ${p.enabled ? "group-hover:text-[var(--ember)]" : ""} transition`}
                        />
                      </button>
                    ))}
                    <Link
                      href="/demo"
                      className="w-full p-4 rounded border border-[var(--gold)]/45 bg-[var(--gold)]/5 hover:bg-[var(--gold)]/10 transition flex items-center gap-3 text-left group"
                    >
                      <div className="size-10 rounded bg-[var(--gold)]/15 flex items-center justify-center flex-shrink-0">
                        <Zap size={19} className="text-[var(--gold)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px]">Try Demo Workspace</div>
                        <div className="pixel text-[11px] text-[var(--muted)]">Judge-safe sample wiki. No OAuth required.</div>
                      </div>
                      <ArrowRight size={14} className="text-[var(--muted)] group-hover:text-[var(--gold)] transition" />
                    </Link>
                  </>
                )}
              </div>

              {noProviders ? (
                <div className="mt-6">
                  <SetupGuide configured={configured} />
                </div>
              ) : (
                <>
                  <EmailSignupForm mode={mode} />
                  <div className="mt-6 pt-6 border-t border-[var(--line)] flex flex-col gap-2">
                    <Link
                      href={mode === "signup" ? "/signin" : "/signin?mode=signup"}
                      className="pixel text-[13px] text-[var(--text-2)] hover:text-[var(--ember)]"
                    >
                      {mode === "signup" ? "Already have a workspace? Sign in →" : "No workspace yet? Create one →"}
                    </Link>
                    <Link
                      href="/forgot-password"
                      className="pixel text-[12px] text-[var(--muted)] hover:text-[var(--ember)]"
                    >
                      Can&apos;t access your workspace? →
                    </Link>
                  </div>
                  {configured.length < ALL_PROVIDERS.length && (
                    <div className="mt-6">
                      <SetupGuide configured={configured} />
                    </div>
                  )}
                </>
              )}

              <p className="pixel text-[10px] text-[var(--muted)] mt-6 leading-relaxed">
                By continuing you agree your provider identity is hashed into a workspace key. Qyntra never reads your password.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function SetupGuide({ configured }: { configured: string[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const allGuides = [
    {
      id: "google",
      name: "Google",
      link: "https://console.cloud.google.com/apis/credentials",
      steps: [
        "Go to Google Cloud Console → APIs & Services → Credentials",
        "Create OAuth 2.0 Client ID (Web application)",
        `Add redirect URI: ${baseUrl}/api/auth/callback/google`,
        "Copy Client ID and Client Secret to Vercel env vars",
      ],
      env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    },
    {
      id: "github",
      name: "GitHub",
      link: "https://github.com/settings/developers",
      steps: [
        "Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App",
        `Set Authorization callback URL: ${baseUrl}/api/auth/callback/github`,
        "Copy Client ID and Client Secret to Vercel env vars",
      ],
      env: ["GITHUB_ID", "GITHUB_SECRET"],
    },
    {
      id: "notion",
      name: "Notion",
      link: "https://www.notion.so/my-integrations",
      steps: [
        "Go to notion.so/my-integrations → New integration → Public integration",
        `Add redirect URI: ${baseUrl}/api/auth/callback/notion`,
        "Copy Client ID, Client Secret, and Redirect URI to Vercel env vars",
      ],
      env: ["NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET", "NOTION_REDIRECT_URI"],
    },
  ];

  const guides = allGuides.filter((g) => !configured.includes(g.id));

  return (
    <div className="space-y-3">
      <div className="p-3 rounded border border-[var(--gold)]/30 bg-[var(--gold)]/5 flex items-start gap-2">
        <AlertCircle size={14} className="text-[var(--gold)] mt-0.5 flex-shrink-0" />
        <div className="text-[12px] text-[var(--text-2)] leading-relaxed">
          {guides.length === 0
            ? "All sign-in providers are configured. If buttons still don't appear, redeploy the project."
            : "Some sign-in providers need configuration. Add the missing environment variables in your Vercel Dashboard → Project → Settings → Environment Variables, then redeploy."}
          {" "}
          <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[var(--ember)] hover:underline">
            Open Vercel Dashboard
          </a>
        </div>
      </div>

      {guides.map((g) => (
        <div key={g.name} className="p-3 rounded border border-[var(--line)] bg-[var(--bg-2)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ConnIcon kind={g.name.toLowerCase()} size={16} />
              <span className="text-[13px] font-medium">{g.name}</span>
            </div>
            <a href={g.link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[var(--ember)] hover:underline flex items-center gap-1">
              <ExternalLink size={10} /> Open console
            </a>
          </div>
          <ol className="list-decimal list-inside text-[11px] text-[var(--text-2)] space-y-1 mb-2">
            {g.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-1.5">
            {g.env.map((e) => (
              <button
                key={e}
                onClick={() => copy(e, e)}
                className="mono text-[10px] px-2 py-1 rounded border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--ember)]/40 flex items-center gap-1"
              >
                {copied === e ? <Check size={9} className="text-[var(--good)]" /> : <Copy size={9} />}
                {e}
              </button>
            ))}
          </div>
        </div>
      ))}
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
    <div className="mt-6 pt-6 border-t border-[var(--line)]">
      <div className="pixel text-[12px] text-[var(--gold)] mb-2">
        {isSignup ? "OR · CREATE ACCOUNT WITH EMAIL" : "OR · SIGN IN WITH EMAIL"}
      </div>
      <p className="pixel text-[11px] text-[var(--text-2)] mb-3 leading-relaxed">
        Passwordless. Enter your email — we generate a magic sign-in link instantly. No OAuth required.
      </p>
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
      </form>
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
    </div>
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
