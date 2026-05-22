"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, Map, MessageSquare, BookOpen, Boxes } from "lucide-react";
import { useProfileStore } from "@/lib/profile-store";

const STEPS = [
  {
    icon: Sparkles,
    label: "Generate",
    href: "/wiki/generate?topic=Retrieval-Augmented%20Generation",
    pitch: "Auto-write a Wikipedia entry — cited from the demo corpus",
  },
  {
    icon: Boxes,
    label: "3D Galaxy",
    href: "/map-3d",
    pitch: "Spin the knowledge graph — drag to rotate, click any node",
  },
  {
    icon: MessageSquare,
    label: "Ask",
    href: "/ask?q=How%20does%20GraphRAG%20compare%20to%20vanilla%20RAG%3F",
    pitch: "Grounded chat — every answer cites your files",
  },
  {
    icon: BookOpen,
    label: "Wiki",
    href: "/wiki",
    pitch: "Your private encyclopedia — random page, categories, did-you-know",
  },
  {
    icon: Map,
    label: "Sources",
    href: "/sources",
    pitch: "Connect Drive, Gmail, Notion, GitHub. Auto-syncs every 5 min",
  },
];

const DISMISS_KEY = "qyntra:demo-banner-dismissed";

export function DemoBanner() {
  const { demoMode } = useProfileStore();
  const [dismissed, setDismissed] = useState(true); // hidden until we know LS state

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!demoMode || dismissed) return null;

  return (
    <div className="border-b border-[var(--ember)]/30 bg-gradient-to-r from-[var(--ember)]/10 via-[var(--gold)]/5 to-transparent">
      <div className="max-w-[1280px] mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <span className="mono cap text-[10px] px-2 py-0.5 rounded bg-[var(--ember)]/20 text-[var(--ember)] flex items-center gap-1.5 flex-shrink-0">
          <Sparkles size={10} /> Demo mode
        </span>
        <span className="text-[12px] text-[var(--text-2)] hidden sm:inline">
          Pre-seeded corpus. No signup. Try a surface:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={s.href}
                title={s.pitch}
                className="mono cap text-[10px] px-2 py-1 rounded border border-[var(--line)] text-[var(--text-2)] hover:text-[var(--ember)] hover:border-[var(--ember)]/40 transition inline-flex items-center gap-1.5"
              >
                <Icon size={11} />
                {s.label}
              </Link>
            );
          })}
        </div>
        <button
          onClick={() => {
            if (typeof window !== "undefined") localStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
          aria-label="Dismiss demo banner"
          className="ml-auto p-1 text-[var(--muted)] hover:text-[var(--text)] flex-shrink-0"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
