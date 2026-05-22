"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { X, ChevronRight, ChevronLeft, Sparkles, Boxes, MessageSquare, BookOpen, Plug } from "lucide-react";
import { useProfileStore } from "@/lib/profile-store";

const STEPS = [
  {
    icon: Sparkles,
    title: "Generate any Wikipedia page",
    body: "Type a topic — Qyntra writes a cited encyclopedia entry from your files. Sticky TOC, infobox, references, print/PDF. The killer feature.",
    href: "/wiki/generate",
    cta: "Try Generate",
  },
  {
    icon: Boxes,
    title: "Spin the 3D galaxy",
    body: "Your knowledge graph rendered as a constellation. Drag to rotate, click any node to read the source, edges show predicted connections.",
    href: "/map-3d",
    cta: "Open 3D Galaxy",
  },
  {
    icon: MessageSquare,
    title: "Ask grounded in your wiki",
    body: "Voice input, slash commands (/summarize, /todo, /draft…), paste images for OCR. Every answer cites the file it came from.",
    href: "/ask",
    cta: "Open Chat",
  },
  {
    icon: BookOpen,
    title: "Browse your wiki",
    body: "Featured article of the day, Did You Know, On This Day, categories, random page — Wikipedia’s best ideas, made personal.",
    href: "/wiki",
    cta: "Open Wiki",
  },
  {
    icon: Plug,
    title: "Bring your sources online",
    body: "One click connects Drive, Gmail, Notion, GitHub. We auto-resync every five minutes with refreshed OAuth tokens.",
    href: "/sources",
    cta: "Connect a source",
  },
];

const STORAGE_KEY = "qyntra:tour-seen-v1";

export function OnboardingTour() {
  const { demoMode } = useProfileStore();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isAppRoute = pathname?.startsWith("/home") || pathname?.startsWith("/demo");
    if (!isAppRoute) return;
    if (sessionStorage.getItem("qyntra:tour-just-closed") === "1") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    // Slight delay so the route mounts first
    const t = setTimeout(() => setActive(true), 700);
    return () => clearTimeout(t);
  }, [pathname, demoMode]);

  function close(complete: boolean) {
    setActive(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("qyntra:tour-just-closed", "1");
      if (complete) localStorage.setItem(STORAGE_KEY, "1");
    }
  }

  if (!active) return null;
  const s = STEPS[step];
  const Icon = s.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key="tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => close(false)}
      >
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-[520px] w-full rounded-2xl border border-[var(--ember)]/40 bg-gradient-to-b from-[var(--bg-1)] to-[var(--bg)] p-6 sm:p-8 shadow-2xl"
        >
          <button
            aria-label="Skip tour"
            onClick={() => close(true)}
            className="absolute top-4 right-4 p-1.5 text-[var(--muted)] hover:text-[var(--text)]"
          >
            <X size={14} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="size-11 rounded-xl bg-[var(--ember)]/15 border border-[var(--ember)]/30 flex items-center justify-center text-[var(--ember)]">
              <Icon size={20} />
            </div>
            <div className="mono cap text-[10px] text-[var(--ember)]">
              Step {step + 1} of {STEPS.length} · Welcome to Qyntra
            </div>
          </div>

          <h2 className="text-[24px] font-bold tracking-tight leading-snug mb-2">{s.title}</h2>
          <p className="text-[14px] text-[var(--text-2)] leading-relaxed mb-6">{s.body}</p>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-[var(--ember)]" : "w-1.5 bg-[var(--line-2)]"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="mono cap text-[10px] px-3 py-1.5 rounded border border-[var(--line)] text-[var(--text-2)] disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft size={11} /> Back
              </button>
              <a
                href={s.href}
                onClick={() => close(true)}
                className="mono cap text-[10px] px-3 py-1.5 rounded border border-[var(--ember)]/40 text-[var(--ember)] hover:bg-[var(--ember)]/10"
              >
                {s.cta} →
              </a>
              {!isLast ? (
                <button
                  onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                  className="mono cap text-[10px] px-3 py-1.5 rounded bg-[var(--ember)] text-white flex items-center gap-1"
                >
                  Next <ChevronRight size={11} />
                </button>
              ) : (
                <button
                  onClick={() => close(true)}
                  className="mono cap text-[10px] px-3 py-1.5 rounded bg-[var(--ember)] text-white"
                >
                  Done
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => close(true)}
            className="mt-5 mono cap text-[10px] text-[var(--muted)] hover:text-[var(--text)] underline-offset-2 hover:underline"
          >
            Skip tour
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
