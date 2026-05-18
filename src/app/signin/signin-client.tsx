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
  { id: "github", label: "GitHub", icon: "github", desc: "Repos, issues, gists", color: "#ffffff", env: ["GITHUB_ID", "GITHUB_SECRET"] },
  { id: "notion", label: "Notion", icon: "notion", desc: "Sign in with your Notion workspace", color: "#ffffff", env: ["NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET", "NOTION_REDIRECT_URI"] },
];

export function SignInClient() {
  const params = useSearchParams();
  const mode = params.get("mode") === "signup" ? "signup" : "signin";
  const callbackUrl = params.get("callbackUrl") || "/home";
  const { data: session } = useSession();
  const [configured, setConfigured] = useState<string[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((json) => {
        setConfigured((json.providers || []).map((p: any) => p.id));
        setLoadingProviders(false);
      })
      .catch(() => setLoadingProviders(false));
  }, []);

  function handleSignIn(providerId: string) {
    signIn(providerId, { callbackUrl });
  }

  const availableProviders = ALL_PROVIDERS.filter((p) => configured.includes(p.id));
  const noProviders = !loadingProviders && availableProviders.length === 0;

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
            <Feature icon={Lock} title="Local-first ingestion" body="Your tokens live in encrypted env. Files indexed in your own embedding store. Nothing leaves unless you sync." />
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
                {noProviders ? "SETUP REQUIRED" : mode === "signup" ? "STEP 01 · PICK YOUR IDENTITY" : "SIGN IN WITH"}
              </div>
              <h2 className="pixel text-[28px] mb-1">{noProviders ? "OAuth not configured" : mode === "signup" ? "Pick a provider" : "Welcome back"}</h2>
              <p className="pixel text-[13px] text-[var(--text-2)] mb-6">
                {noProviders
                  ? "Add your OAuth credentials in Vercel Environment Variables to enable sign-in."
                  : mode === "signup"
                  ? "Your OAuth identity is your workspace key. Pick one — you can connect the rest later."
                  : "Same provider you signed up with."}
              </p>

              {noProviders && <SetupGuide />}

              {!noProviders && (
                <div className="space-y-2">
                  {loadingProviders ? (
                    <div className="text-[13px] text-[var(--muted)] py-4">Loading providers…</div>
                  ) : (
                    availableProviders.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSignIn(p.id)}
                        className="w-full p-4 rounded border border-[var(--line)] hover:border-[var(--ember)]/50 hover:bg-[var(--bg-2)] transition flex items-center gap-3 text-left group"
                      >
                        <div className="size-10 rounded bg-[var(--bg-2)] flex items-center justify-center flex-shrink-0">
                          <ConnIcon kind={p.icon} size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px]">Continue with {p.label}</div>
                          <div className="pixel text-[11px] text-[var(--muted)]">{p.desc}</div>
                        </div>
                        <ArrowRight size={14} className="text-[var(--muted)] group-hover:text-[var(--ember)] transition" />
                      </button>
                    ))
                  )}
                </div>
              )}

              {!noProviders && (
                <div className="mt-6 pt-6 border-t border-[var(--line)] flex flex-col gap-2">
                  <Link
                    href={mode === "signup" ? "/signin" : "/signin?mode=signup"}
                    className="pixel text-[13px] text-[var(--text-2)] hover:text-[var(--ember)]"
                  >
                    {mode === "signup" ? "Already have a workspace? Sign in →" : "No workspace yet? Create one →"}
                  </Link>
                  {mode !== "signup" && (
                    <Link
                      href="/forgot-password"
                      className="pixel text-[12px] text-[var(--muted)] hover:text-[var(--ember)]"
                    >
                      Can&apos;t sign in?
                    </Link>
                  )}
                </div>
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

function SetupGuide() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const guides = [
    {
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

  return (
    <div className="space-y-3">
      <div className="p-3 rounded border border-[var(--gold)]/30 bg-[var(--gold)]/5 flex items-start gap-2">
        <AlertCircle size={14} className="text-[var(--gold)] mt-0.5 flex-shrink-0" />
        <div className="text-[12px] text-[var(--text-2)] leading-relaxed">
          No OAuth providers are configured yet. Add the environment variables below in your{" "}
          <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[var(--ember)] hover:underline">
            Vercel Dashboard → Project → Settings → Environment Variables
          </a>
          . The sign-in buttons will appear instantly after redeploy.
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
