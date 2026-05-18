import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white vgrid flex flex-col">
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[var(--line)]">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} withGlow />
          <span className="pixel text-[16px]">Qyntra</span>
        </Link>
        <Link href="/" className="pixel text-[12px] text-[var(--text-2)] hover:text-white">
          Return home →
        </Link>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="pixel text-[14px] text-[var(--ember)] mb-4">404 · MEMORY NOT FOUND</div>
        <h1 className="pixel text-[44px] sm:text-[64px] leading-[1.05] tracking-tight max-w-[800px]">
          This page doesn&apos;t exist
          <br />
          in your <span className="text-[var(--ember)]">wiki.</span>
        </h1>
        <p className="pixel text-[14px] sm:text-[16px] text-[var(--text-2)] mt-6 max-w-[520px] leading-relaxed">
          The link may be broken, or the file may have been moved. Try searching your wiki or jump back to your dashboard.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="pixel text-[14px] px-6 py-3 rounded bg-[var(--ember)] text-white hover:bg-[var(--ember-2)] transition"
          >
            ← Return home
          </Link>
          <Link
            href="/signin"
            className="pixel text-[14px] px-6 py-3 rounded border border-[var(--line-2)] text-white hover:bg-[var(--bg-1)] transition"
          >
            Try signing in →
          </Link>
          <Link
            href="/home"
            className="pixel text-[14px] px-6 py-3 rounded border border-[var(--line-2)] text-white hover:bg-[var(--bg-1)] transition"
          >
            Open dashboard
          </Link>
        </div>
      </div>

      <footer className="border-t border-[var(--line)] py-6 pixel text-[11px] text-[var(--muted)] text-center">
        Qyntra::Wiki · Local-first · Built for WikiThon &apos;26
      </footer>
    </div>
  );
}
