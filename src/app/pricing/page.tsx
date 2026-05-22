import Link from "next/link";
import { Logo } from "@/components/logo";
import { Sparkles, Check, Zap } from "lucide-react";

export const metadata = {
  title: "Pricing",
  description: "Qyntra is free to use. Bring your own API key, or upgrade to Pro for managed inference and team sharing.",
};

interface Plan {
  name: string;
  tagline: string;
  price: string;
  per: string;
  cta: { label: string; href: string };
  features: string[];
  emphasis?: boolean;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    name: "Hobby",
    tagline: "For tinkerers + judges. Always free.",
    price: "£0",
    per: "forever",
    cta: { label: "Start free →", href: "/signin" },
    features: [
      "Bring your own Groq API key",
      "Unlimited wiki articles + chats",
      "3D galaxy view + 2D graph",
      "Up to 3 connected sources",
      "Demo workspace · no signup",
      "Manual sync",
    ],
  },
  {
    name: "Pro",
    tagline: "For knowledge workers who want it managed.",
    price: "£12",
    per: "per month",
    emphasis: true,
    badge: "Early access",
    cta: { label: "Join the waitlist", href: "https://github.com/vaibhav4046/qyntra-app/issues/new?title=Pro+waitlist" },
    features: [
      "Managed Groq + OpenAI inference, no BYO key",
      "Unlimited sources + scheduled 5-min sync",
      "Higher rate limits (60 articles/day, 600 chats/day)",
      "Image OCR via Groq vision",
      "Voice input + slash commands",
      "Priority support",
    ],
  },
  {
    name: "Studio",
    tagline: "For teams that share a memory.",
    price: "Contact",
    per: "annual",
    cta: { label: "Talk to us →", href: "mailto:hello@qyntra.app" },
    features: [
      "Everything in Pro",
      "Shared workspaces + role-based access",
      "Self-host on your own Vercel + Supabase",
      "Custom connectors (Confluence, Jira, S3…)",
      "Single sign-on + audit log",
      "Dedicated onboarding",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] sticky top-0 z-10 bg-[var(--bg)]/85 backdrop-blur">
        <div className="max-w-[1080px] mx-auto flex items-center justify-between gap-4 px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={26} withGlow />
            <span className="mono cap text-[12px] font-semibold">QYNTRA</span>
          </Link>
          <nav className="flex items-center gap-2 mono cap text-[11px]">
            <Link className="text-[var(--text-2)] hover:text-[var(--text)] px-2.5 py-1.5" href="/demo">Demo</Link>
            <Link className="text-[var(--text-2)] hover:text-[var(--text)] px-2.5 py-1.5" href="/privacy">Privacy</Link>
            <Link className="text-[var(--text-2)] hover:text-[var(--text)] px-2.5 py-1.5" href="/terms">Terms</Link>
            <Link className="text-[var(--ember)] hover:text-[var(--text)] px-2.5 py-1.5" href="/home">Open app →</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-5 py-12 sm:py-16">
        <div className="text-center mb-12">
          <div className="mono cap text-[11px] text-[var(--ember)] mb-3 flex items-center justify-center gap-1.5">
            <Sparkles size={11} /> Pricing
          </div>
          <h1 className="text-[36px] sm:text-[48px] font-bold tracking-tight leading-[1.05] mb-3">
            Free to start. Pay only when it gets serious.
          </h1>
          <p className="text-[15px] text-[var(--text-2)] max-w-[640px] mx-auto leading-relaxed">
            Qyntra is open source. Bring your own Groq key and run forever for free. Upgrade if you want it managed,
            on more devices, or shared with a team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                p.emphasis
                  ? "border-[var(--ember)]/50 bg-gradient-to-b from-[var(--ember)]/10 to-transparent shadow-[0_20px_60px_-30px_rgba(255,91,31,0.45)]"
                  : "border-[var(--line-2)] bg-[var(--bg-1)]"
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-6 mono cap text-[10px] px-2.5 py-0.5 rounded-full bg-[var(--ember)] text-white">
                  {p.badge}
                </div>
              )}
              <div className="mono cap text-[11px] text-[var(--ember)] mb-1">{p.name}</div>
              <div className="text-[14px] text-[var(--text-2)] leading-snug mb-4">{p.tagline}</div>
              <div className="flex items-baseline gap-1.5 mb-6">
                <span className="text-[36px] font-bold tracking-tight">{p.price}</span>
                <span className="mono cap text-[10px] text-[var(--muted)]">{p.per}</span>
              </div>
              <Link
                href={p.cta.href}
                className={`mono cap text-[11px] px-4 py-2.5 rounded text-center inline-block transition mb-6 ${
                  p.emphasis
                    ? "bg-[var(--ember)] text-white hover:bg-[var(--ember-2)]"
                    : "border border-[var(--line)] text-[var(--text)] hover:border-[var(--ember)]/40 hover:text-[var(--ember)]"
                }`}
              >
                {p.cta.label}
              </Link>
              <ul className="space-y-2 text-[13.5px] text-[var(--text-2)] leading-relaxed">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={13} className="text-[var(--ember)] flex-shrink-0 mt-1" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] p-6 sm:p-8 flex items-start gap-4">
          <div className="size-10 rounded-lg bg-[var(--ember)]/15 text-[var(--ember)] flex items-center justify-center flex-shrink-0">
            <Zap size={18} />
          </div>
          <div>
            <h2 className="text-[18px] font-semibold mb-1">Bringing your own API key</h2>
            <p className="text-[13.5px] text-[var(--text-2)] leading-relaxed">
              On the Chat page you can paste a Groq key (<code>gsk_…</code>). It is kept in your browser&apos;s local
              storage only and forwarded directly to Groq with each request, bypassing our managed inference. This is
              perfect for hackathon judges who want to test without giving us money — and is recommended for power
              users on the Hobby plan.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center text-[12px] text-[var(--muted)]">
          Wikithon ’26 Finalist · Built in Liverpool, UK · {new Date().getFullYear()}
        </div>
      </main>
    </div>
  );
}
