"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  X,
  Sparkles,
  Boxes,
  MessageSquare,
  BookOpen,
  Plug,
  Award,
  Zap,
  Rocket,
} from "lucide-react";

interface Slide {
  kicker: string;
  title: string | React.ReactNode;
  body: string | React.ReactNode;
  visual?: React.ReactNode;
  cta?: { label: string; href: string };
  accent: string;
}

const SLIDES: Slide[] = [
  {
    kicker: "Wikithon ’26 · Finalist",
    accent: "var(--ember)",
    title: (
      <>
        Your own <span style={{ color: "var(--ember)" }}>Wikipedia.</span>
        <br />
        Your own memory.
      </>
    ),
    body:
      "Qyntra compiles every file, note and conversation from your Notion, Drive, Gmail, GitHub and desktop into one private encyclopedia — cited, traversable, predictive.",
    visual: <Award size={48} className="text-[var(--ember)]" />,
    cta: { label: "Open the live demo →", href: "/demo" },
  },
  {
    kicker: "The problem",
    accent: "var(--gold)",
    title: "Your knowledge is scattered. Search isn't memory.",
    body:
      "You've written about RAG fifteen times across Notion, Drive, Gmail threads, GitHub PR comments and your laptop. Search returns 47 hits. None of them connect. None of them cite each other. And you forget you wrote them.",
  },
  {
    kicker: "The product",
    accent: "var(--ember)",
    title: "Qyntra · one private wiki, compiled from everywhere.",
    body:
      "Connect a source in one click. We ingest, embed and cluster it. Every fact becomes a node. Every node knows where it came from. Ask any question, get a cited answer. Type any topic, get a printable Wikipedia entry.",
    visual: <BookOpen size={48} className="text-[var(--ember)]" />,
  },
  {
    kicker: "Killer feature",
    accent: "var(--gold)",
    title: "Write me a Wikipedia page on…",
    body:
      "Type a topic. We rank the relevant snippets from your wiki, ask Groq Llama 3.3 70B for a structured article (lede, infobox, sections, references, see-also), render it Wikipedia-style with sticky TOC. Every claim cites the file. One-click print to PDF.",
    visual: <Sparkles size={48} className="text-[var(--gold)]" />,
    cta: { label: "Generate one now →", href: "/wiki/generate?topic=GraphRAG" },
  },
  {
    kicker: "The galaxy",
    accent: "var(--violet)",
    title: "Your memory, rendered as a constellation.",
    body:
      "Three.js + Fibonacci sphere layout. Type clusters become organised constellations instead of a hairball. Drag to rotate, click any node to read the source, predicted edges glow in gold.",
    visual: <Boxes size={48} className="text-[var(--violet)]" />,
    cta: { label: "Spin the 3D galaxy →", href: "/map-3d" },
  },
  {
    kicker: "Multimodal chat",
    accent: "var(--teal)",
    title: "Voice. Slash. OCR. Cited.",
    body:
      "Web Speech for voice. Five slash commands (/summarize /todo /draft /compare /timeline). Paste any screenshot — Groq Llama 3.2 vision extracts the text. Every answer cites the file it came from.",
    visual: <MessageSquare size={48} className="text-[var(--teal)]" />,
    cta: { label: "Open Chat →", href: "/ask" },
  },
  {
    kicker: "The stack",
    accent: "var(--ember)",
    title: "Next.js 16 · Auth.js v5 · Supabase RLS · Groq · Vercel",
    body: (
      <>
        <div className="grid grid-cols-2 gap-2 text-[13.5px] leading-relaxed">
          <span>· Next 16 App Router · React 19</span>
          <span>· Auth.js v5 + Google/Notion/GitHub/Magic-link</span>
          <span>· Supabase Postgres + Row-Level Security</span>
          <span>· Groq Llama 3.3 70B + Vision 11B</span>
          <span>· Three.js + react-three-fiber + Drei</span>
          <span>· PWA · offline shell · 5-min auto-sync</span>
          <span>· Error boundaries · OAuth refresh-heal</span>
          <span>· Edge OG cards · sticky TOC · print/PDF</span>
        </div>
      </>
    ),
    visual: <Zap size={48} className="text-[var(--ember)]" />,
  },
  {
    kicker: "Built solo, in a day",
    accent: "var(--gold)",
    title: "From idea to finalist between two exams.",
    body:
      "Shut my notes at 11 PM. Shipped Qyntra by 11:58. Made the Wikithon ’26 finalists. Then iterated — voice, slash, OCR, PWA, OG cards, pricing, privacy, terms, onboarding tour, demo workspace, killer Generate feature, 3D galaxy. Pair-programmed with OpenCode Go + Claude Opus.",
  },
  {
    kicker: "Try it",
    accent: "var(--ember)",
    title: "qyntra-app.vercel.app",
    body:
      "/demo — no signup. /wiki/generate — type any topic. /map-3d — spin the galaxy. /ask — voice + slash + OCR. Sign in with Google to pull your own files in.",
    visual: <Rocket size={48} className="text-[var(--ember)]" />,
    cta: { label: "Open the demo →", href: "/demo" },
  },
];

const AUTO_MS = 7500;

export default function PitchPage() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTO_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setIndex((i) => (i + 1) % SLIDES.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
      } else if (e.key === "p" || e.key === "P") {
        setPaused((p) => !p);
      } else if (e.key === "Escape") {
        window.location.href = "/";
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const slide = SLIDES[index];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] relative overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] z-10">
        <Link href="/" className="mono cap text-[11px] text-[var(--text-2)] hover:text-[var(--text)] flex items-center gap-2">
          <X size={12} /> Close pitch
        </Link>
        <div className="mono cap text-[10px] text-[var(--muted)]">
          Qyntra · Wikithon ’26 Pitch · Slide {index + 1}/{SLIDES.length}
        </div>
        <div className="flex items-center gap-3 mono cap text-[10px] text-[var(--text-2)]">
          <button onClick={() => setPaused((p) => !p)} className="flex items-center gap-1 hover:text-[var(--text)]" aria-label={paused ? "Play" : "Pause"}>
            {paused ? <Play size={11} /> : <Pause size={11} />}
            {paused ? "Play" : "Pause"}
          </button>
          <span className="hidden sm:inline">← / → · P pause · Esc close</span>
        </div>
      </header>

      {/* Slide stage */}
      <main className="flex-1 flex items-center justify-center px-6 py-10 sm:py-16 relative">
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-colors duration-700"
          style={{
            background: `radial-gradient(circle at 78% 30%, ${slide.accent}33, transparent 55%), radial-gradient(circle at 12% 75%, ${slide.accent}22, transparent 55%)`,
          }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.99 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.55 }}
            className="relative z-10 max-w-[920px] w-full text-center"
          >
            {slide.visual && (
              <div className="mb-6 flex justify-center">
                <div
                  className="size-20 rounded-2xl border flex items-center justify-center"
                  style={{ borderColor: `${slide.accent}55`, background: `${slide.accent}11` }}
                >
                  {slide.visual}
                </div>
              </div>
            )}
            <div className="mono cap text-[11px] mb-4" style={{ color: slide.accent }}>
              {slide.kicker}
            </div>
            <h1 className="text-[36px] sm:text-[64px] font-bold tracking-tight leading-[1.04] mb-6">{slide.title}</h1>
            <div className="text-[15px] sm:text-[18px] text-[var(--text-2)] leading-relaxed max-w-[760px] mx-auto">
              {slide.body}
            </div>
            {slide.cta && (
              <div className="mt-8">
                <Link
                  href={slide.cta.href}
                  className="mono cap text-[12px] px-5 py-3 rounded text-white inline-flex items-center gap-2 transition shadow-[0_18px_40px_-12px_rgba(255,91,31,0.55)]"
                  style={{ background: slide.accent }}
                >
                  {slide.cta.label}
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer controls */}
      <footer className="px-6 py-5 border-t border-[var(--line)] flex items-center justify-between gap-4 z-10">
        <button
          onClick={() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
          className="mono cap text-[11px] px-3 py-2 rounded border border-[var(--line)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--ember)]/40 flex items-center gap-1.5"
        >
          <ChevronLeft size={12} /> Prev
        </button>
        <div className="flex gap-1.5 flex-wrap justify-center">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-8" : "w-1.5"}`}
              style={{ background: i === index ? slide.accent : "var(--line-2)" }}
            />
          ))}
        </div>
        <button
          onClick={() => setIndex((i) => (i + 1) % SLIDES.length)}
          className="mono cap text-[11px] px-3 py-2 rounded text-white flex items-center gap-1.5"
          style={{ background: slide.accent }}
        >
          Next <ChevronRight size={12} />
        </button>
      </footer>

      {/* Bottom corner CTA */}
      <Link
        href="/demo"
        className="hidden sm:inline-flex absolute bottom-20 right-6 z-20 mono cap text-[10px] px-3 py-2 rounded-full border border-[var(--ember)]/40 bg-[var(--bg-1)]/80 backdrop-blur text-[var(--ember)] items-center gap-1.5 hover:bg-[var(--ember)]/10"
      >
        <Plug size={11} /> Skip to live demo
      </Link>
    </div>
  );
}
