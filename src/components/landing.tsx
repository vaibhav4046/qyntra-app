"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ConnIcon } from "./conn-icon";
import { CONNECTORS } from "@/lib/data";
import { ArrowRight, Network, Layers, Brain } from "lucide-react";
import { Logo } from "./logo";
import { SplitText, CycleText } from "./split-text";
import dynamic from "next/dynamic";

const PixelGlobe = dynamic(() => import("./pixel-globe").then((m) => m.PixelGlobe), { ssr: false });

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-[var(--text)] vgrid">
      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-30 flex items-center justify-between px-10 py-5 backdrop-blur-md border-b border-[var(--line)] bg-black/60"
      >
        <div className="flex items-center gap-4">
          <Logo size={32} withGlow />
          <span className="pixel text-[18px] font-semibold tracking-tight">Qyntra</span>
          <span className="pixel text-[12px] px-2.5 py-0.5 rounded border border-[var(--ember)]/30 text-[var(--ember)] bg-[var(--ember)]/5">
            private beta · wikithon &apos;26
          </span>
        </div>
        <div className="hidden md:flex items-center gap-9 pixel text-[14px] text-[var(--text-2)]">
          <a href="#how" className="hover:text-[var(--text)] transition">Why Qyntra</a>
          <a href="#showcase" className="hover:text-[var(--text)] transition">Workbench</a>
          <a href="#predict" className="hover:text-[var(--text)] transition">Predictions</a>
          <a href="#sources" className="hover:text-[var(--text)] transition">Sources</a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/signin"
            className="pixel text-[14px] px-4 py-2 rounded border border-[var(--line-2)] hover:bg-[var(--bg-1)] transition"
          >
            Log In
          </Link>
          <Link
            href="/signin?mode=signup"
            className="pixel text-[14px] px-4 py-2 rounded bg-white text-black hover:bg-[var(--gold)] transition"
          >
            Sign Up
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <section id="showcase" className="relative min-h-[92vh] overflow-hidden">
        <div className="relative z-10 max-w-[1400px] mx-auto px-10 pt-16 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="pixel text-[16px] text-[var(--ember)] leading-[1.4] mb-2"
            >
              Your files are now Qyntra memory.
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="pixel text-[15px] text-[var(--ember)]/80 mb-10"
            >
              Native connectors live: Drive, Notion, Slack, Gmail, GitHub, and more →
            </motion.div>

            <h1 className="pixel text-[36px] sm:text-[48px] md:text-[60px] lg:text-[72px] leading-[1.02] font-normal tracking-tight">
              <span className="block text-white">
                <SplitText text="Your" stagger={40} />{" "}
                <span className="text-[var(--ember)]"><SplitText text="own" delay={200} stagger={40} /></span>{" "}
                <SplitText text="Wikipedia." delay={400} stagger={40} />
              </span>
              <span className="block mt-3 text-white">
                <SplitText text="Your" delay={900} stagger={40} />{" "}
                <span className="text-[var(--ember)]">
                  <CycleText words={["memory.", "context.", "workspace.", "second brain."]} interval={2600} />
                </span>
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              className="pixel text-[18px] text-[var(--text-2)] max-w-[560px] leading-[1.55] mt-10"
            >
              A unified context layer to capture every file, note and conversation across your workspaces — and predict what you&apos;ll need next.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.1, duration: 0.6 }}
              className="mt-10 flex items-center gap-3"
            >
              <Link
                href="/signin"
                className="pixel text-[16px] px-6 py-3 bg-white text-black rounded hover:bg-[var(--gold)] transition"
              >
                Sign In
              </Link>
              <Link
                href="/signin?mode=signup"
                className="pixel text-[16px] px-6 py-3 bg-[var(--ember)] text-white rounded hover:bg-[var(--ember-2)] transition flex items-center gap-2"
              >
                Create Workspace <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>

          {/* Globe right side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-square w-full max-w-[640px] mx-auto lg:max-w-none"
          >
            <PixelGlobe />
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 h-px bg-[var(--ember)]/40 z-10" />
      </section>

      {/* Feature strip */}
      <section id="predict" className="relative bg-black py-6 border-t border-[var(--line)] overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-10 flex items-center justify-center gap-8 pixel text-[14px] text-[var(--text-2)] flex-wrap">
          <span className="text-white flex items-center gap-2">
            <span className="size-2 bg-[var(--ember)]" /> Predictive knowledge
          </span>
          <span className="text-[var(--line-2)]">|</span>
          <span className="flex items-center gap-2"><span className="size-2 bg-[var(--gold)]" /> Cited sources</span>
          <span className="text-[var(--line-2)]">|</span>
          <span className="flex items-center gap-2"><span className="size-2 bg-[var(--violet)]" /> 3D knowledge map</span>
          <span className="text-[var(--line-2)]">|</span>
          <span className="flex items-center gap-2"><span className="size-2 bg-[var(--teal)]" /> Local-first ingestion</span>
          <span className="text-[var(--line-2)]">|</span>
          <span className="flex items-center gap-2"><span className="size-2 bg-[var(--ember)]" /> Real-time sync</span>
          <span className="text-[var(--line-2)]">|</span>
          <span className="flex items-center gap-2"><span className="size-2 bg-white" /> Private by default</span>
        </div>
      </section>

      {/* How */}
      <section id="how" className="max-w-[1400px] mx-auto px-10 py-32 relative vgrid-tight">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 mb-16 items-end">
          <div>
            <div className="pixel text-[15px] text-[var(--ember)] mb-4">How it works · Three layers</div>
            <h2 className="pixel text-[56px] font-normal leading-[1.05] tracking-tight text-white">
              From scattered files
              <br />
              to a <span className="text-[var(--ember)]">living wiki.</span>
            </h2>
          </div>
          <p className="pixel text-[18px] text-[var(--text-2)] leading-[1.55]">
            You don&apos;t write the wiki. Qyntra watches what you read, write and save, extracts entities and claims, and compiles them into pages — automatically.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Layers, n: "01", t: "Collect", b: "Plug in every source you trust. Drive, Notion, LinkedIn, Gmail, Slack, GitHub, arXiv and your desktop. Local-first.", tags: ["DRIVE", "NOTION", "LINKEDIN", "GMAIL", "DESKTOP"] },
            { icon: Network, n: "02", t: "Connect", b: "A retrieval-augmented compiler extracts atomic facts, links them to entities, and rebuilds your wiki page-by-page.", tags: ["PAGES", "ENTITIES", "CLAIMS", "CITATIONS"] },
            { icon: Brain, n: "03", t: "Recall", b: "An interactive 3D galaxy for exploring, a chat for direct answers, and a predictive rail that surfaces what you'll need next.", tags: ["MAP", "ASK", "READ", "PREDICT"] },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              custom={i}
              className="group p-7 rounded border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--ember)]/40 transition relative overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 size-32 rounded-full bg-[var(--ember)]/10 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative">
                <div className="pixel text-[14px] text-[var(--ember)] mb-5 flex items-center gap-2">
                  <s.icon size={14} /> {s.n} · {s.t}
                </div>
                <h3 className="pixel text-[28px] font-normal mb-3 text-white">{s.t}</h3>
                <p className="pixel text-[15px] text-[var(--text-2)] leading-[1.5] mb-5">{s.b}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <span key={t} className="mono text-[10px] px-2 py-1 rounded border border-[var(--line)] text-[var(--text-2)]">{t}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sources */}
      <section id="sources" className="max-w-[1400px] mx-auto px-10 py-32">
        <div className="mb-12">
          <div className="pixel text-[15px] text-[var(--ember)] mb-4">Connectors · 8 sources</div>
          <h2 className="pixel text-[56px] font-normal leading-[1.05] tracking-tight text-white">
            Plug in everywhere you
            <br />
            <span className="text-[var(--ember)]">already remember.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-3">
          {CONNECTORS.map((c, i) => (
            <motion.div
              key={c.id}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="flex items-center gap-3 p-4 rounded border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--ember)]/40 hover:-translate-y-0.5 transition"
            >
              <ConnIcon kind={c.icon} size={28} />
              <div>
                <div className="pixel text-[16px] text-white">{c.name}</div>
                <div className="pixel text-[12px] text-[var(--muted)]">{c.on ? "SYNCED" : "OFFLINE"}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1400px] mx-auto px-10 py-32 text-center relative">
        <h2 className="pixel text-[36px] sm:text-[48px] md:text-[60px] lg:text-[72px] font-normal leading-[1.05] tracking-tight text-white">
          Stop forgetting what
          <br />
          you <span className="text-[var(--ember)]">
            <CycleText words={["already know.", "wrote yesterday.", "saved last week.", "promised someone."]} interval={2800} />
          </span>
        </h2>
        <p className="mt-6 pixel text-[20px] text-[var(--text-2)] max-w-[680px] mx-auto">
          One unified context layer. Predictive. Cited. Private. Built for the WikiThon.
        </p>
        <Link
          href="/signin"
          className="pixel text-[18px] px-9 py-4 rounded bg-[var(--ember)] text-white inline-flex items-center gap-2 hover:bg-[var(--ember-2)] mt-10 transition"
        >
          Enter your wiki <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="border-t border-[var(--line)] py-8 pixel text-[13px] text-[var(--muted)] text-center">
        Qyntra::Wiki © 2026 · Local-first · Powered by Hydra-DB
      </footer>
    </div>
  );
}
