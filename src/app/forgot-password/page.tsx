"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { ArrowLeft, ArrowRight, Mail, Check, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSent(true);
  }

  return (
    <div className="relative min-h-screen bg-black text-white vgrid overflow-hidden">
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[var(--line)] bg-black/60 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} withGlow />
          <span className="pixel text-[16px]">Qyntra</span>
        </Link>
        <Link href="/signin" className="pixel text-[13px] text-[var(--text-2)] hover:text-white flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </nav>

      <div className="flex items-center justify-center min-h-[calc(100vh-69px)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[460px] p-8 rounded-2xl border border-[var(--line-2)] bg-[var(--bg-1)]"
        >
          <div className="size-12 rounded-lg bg-[var(--ember)]/15 border border-[var(--ember)]/30 flex items-center justify-center mb-5">
            <KeyRound size={20} className="text-[var(--ember)]" />
          </div>
          <div className="pixel text-[12px] text-[var(--ember)] mb-2">Reset access</div>
          <h1 className="pixel text-[32px] leading-tight mb-3">Forgot your way in?</h1>
          <p className="pixel text-[13.5px] text-[var(--text-2)] leading-relaxed mb-6">
            Qyntra uses OAuth — there&apos;s no password to reset. Pick the provider you signed up with and we&apos;ll get you back in.
          </p>

          {!sent ? (
            <>
              <form onSubmit={submit} className="space-y-3">
                <label className="block pixel text-[11px] text-[var(--muted)]">Email you used (for our records)</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded border border-[var(--line)] bg-[var(--bg-2)] focus-within:border-[var(--ember)]/50">
                  <Mail size={14} className="text-[var(--muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-transparent flex-1 outline-none text-[14px]"
                    autoFocus
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!email.includes("@")}
                  className="w-full px-5 py-3 rounded bg-[var(--ember)] text-white pixel text-[14px] hover:bg-[var(--ember-2)] transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send recovery link <ArrowRight size={14} />
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-[var(--line)] space-y-2">
                <div className="pixel text-[11px] text-[var(--muted)] mb-2">Or sign in directly with provider:</div>
                <Link href="/signin" className="block w-full px-4 py-2.5 rounded border border-[var(--line)] pixel text-[13px] hover:bg-[var(--bg-2)] text-center transition">
                  Back to OAuth sign-in →
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="size-14 rounded-full bg-[var(--good)]/15 border border-[var(--good)]/30 flex items-center justify-center mx-auto mb-4">
                <Check size={24} className="text-[var(--good)]" />
              </div>
              <h2 className="pixel text-[20px] mb-2">Check your inbox</h2>
              <p className="pixel text-[13px] text-[var(--text-2)] mb-6 leading-relaxed">
                If <span className="text-[var(--ember)]">{email}</span> matches a workspace we&apos;ll send a sign-in link within 60s. Check spam too.
              </p>
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-[var(--line-2)] pixel text-[13px] hover:bg-[var(--bg-2)] transition"
              >
                Back to sign in
              </Link>
            </div>
          )}

          <div className="mt-6 text-center pixel text-[10px] text-[var(--muted)]">
            Need a hand? Email security@qyntra.com
          </div>
        </motion.div>
      </div>
    </div>
  );
}
