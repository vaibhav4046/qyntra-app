"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { SplitText } from "@/components/split-text";
import { Logo } from "@/components/logo";
import { ArrowLeft, Shield, Lock, Zap } from "lucide-react";

export default function SignInPage() {
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
            Welcome back, soldier
          </motion.div>
          <h1 className="pixel text-[36px] sm:text-[48px] lg:text-[64px] leading-[1.05] tracking-tight mb-6">
            <SplitText text="Open your" stagger={35} />
            <br />
            <span className="text-[var(--ember)]">
              <SplitText text="memory." delay={500} stagger={35} />
            </span>
          </h1>
          <p className="pixel text-[14px] sm:text-[16px] text-[var(--text-2)] leading-relaxed max-w-[520px] mb-10">
            Sign in to load your indexed files, claims and predictions. Workspace bound to your identity — only you can open it.
          </p>

          <div className="space-y-4">
            <Feature icon={Shield} title="Workspace isolation" body="Each user gets a private workspace keyed to their OAuth identity." />
            <Feature icon={Lock} title="Consent-gated ingestion" body="Qyntra reads cloud sources only after OAuth approval." />
            <Feature icon={Zap} title="Real-time sync" body="Connect a source once. Qyntra polls for updates every 5m." />
          </div>
        </div>

        {/* Right: Clerk SignIn */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="border-l border-[var(--line)] bg-[var(--bg-1)] p-6 sm:p-10 flex flex-col justify-center"
        >
          <SignIn routing="path" path="/signin" fallbackRedirectUrl="/onboarding" signUpUrl="/signin" />
        </motion.div>
      </div>
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
