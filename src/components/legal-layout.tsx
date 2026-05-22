import Link from "next/link";
import { Logo } from "./logo";

interface Props {
  kicker: string;
  title: string;
  updated: string;
  children: React.ReactNode;
}

export function LegalLayout({ kicker, title, updated, children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--line)] sticky top-0 z-10 bg-[var(--bg)]/85 backdrop-blur">
        <div className="max-w-[920px] mx-auto flex items-center justify-between gap-4 px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={26} withGlow />
            <span className="mono cap text-[12px] font-semibold">QYNTRA</span>
          </Link>
          <nav className="flex items-center gap-2 mono cap text-[11px]">
            <Link className="text-[var(--text-2)] hover:text-[var(--text)] px-2.5 py-1.5" href="/privacy">Privacy</Link>
            <Link className="text-[var(--text-2)] hover:text-[var(--text)] px-2.5 py-1.5" href="/terms">Terms</Link>
            <Link className="text-[var(--text-2)] hover:text-[var(--text)] px-2.5 py-1.5" href="/pricing">Pricing</Link>
            <Link className="text-[var(--ember)] hover:text-[var(--text)] px-2.5 py-1.5" href="/home">Open app →</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-[760px] mx-auto px-5 py-12">
        <div className="mono cap text-[11px] text-[var(--ember)] mb-3">{kicker}</div>
        <h1 className="text-[36px] sm:text-[44px] font-bold tracking-tight leading-[1.1] mb-2">{title}</h1>
        <div className="mono cap text-[10px] text-[var(--muted)] mb-8">Last updated · {updated}</div>
        <div className="space-y-6 text-[14.5px] leading-relaxed text-[var(--text-2)] [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:text-[var(--text)] [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:tracking-tight [&_strong]:text-[var(--text)] [&_a]:text-[var(--ember)] [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1">
          {children}
        </div>
        <div className="mt-12 pt-6 border-t border-[var(--line)] text-[12px] text-[var(--muted)]">
          Questions? Email{" "}
          <a className="text-[var(--ember)] hover:underline" href="mailto:hello@qyntra.app">hello@qyntra.app</a> or open an
          issue on <a className="text-[var(--ember)] hover:underline" href="https://github.com/vaibhav4046/qyntra-app/issues" target="_blank" rel="noopener noreferrer">GitHub</a>.
        </div>
      </main>
    </div>
  );
}
