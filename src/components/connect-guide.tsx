"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConnIcon } from "./conn-icon";
import { ExternalLink, ChevronDown, ChevronUp, BookOpen } from "lucide-react";

interface Step {
  text: string;
  url?: string;
  urlLabel?: string;
}

interface Guide {
  id: string;
  name: string;
  icon: string;
  difficulty: "easy" | "medium" | "advanced";
  time: string;
  steps: Step[];
}

const GUIDES: Guide[] = [
  {
    id: "notion",
    name: "Notion",
    icon: "notion",
    difficulty: "easy",
    time: "~3 min",
    steps: [
      { text: "Go to Notion integration settings", url: "https://www.notion.so/my-integrations", urlLabel: "Open Notion integrations" },
      { text: 'Click "New Integration" → Type: Public · Capabilities: Read content' },
      { text: "Copy Client ID and Client Secret" },
      { text: 'Add Redirect URI: <your-domain>/api/auth/callback/notion' },
      { text: "Paste Client ID + Secret into Vercel → Project → Settings → Environment Variables: NOTION_CLIENT_ID, NOTION_CLIENT_SECRET" },
      { text: "Click OAUTH button below — done" },
    ],
  },
  {
    id: "google",
    name: "Google (Drive + Gmail)",
    icon: "drive",
    difficulty: "medium",
    time: "~6 min",
    steps: [
      { text: "Open Google Cloud Console", url: "https://console.cloud.google.com", urlLabel: "Google Cloud Console" },
      { text: "Create a project → APIs & Services → Enable APIs: Drive, Gmail" },
      { text: "OAuth consent screen: External, fill app info" },
      { text: "Credentials → Create OAuth 2.0 Client ID → Web application" },
      { text: "Authorized redirect URI: <your-domain>/api/auth/callback/google" },
      { text: "Copy Client ID + Client Secret → paste in Vercel env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET" },
      { text: "Sign in below — Drive + Gmail unlock together" },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    icon: "slack",
    difficulty: "medium",
    time: "~4 min",
    steps: [
      { text: "Open Slack API apps", url: "https://api.slack.com/apps", urlLabel: "Slack API apps" },
      { text: "Create New App → From scratch → pick workspace" },
      { text: "OAuth & Permissions → Add scopes: channels:read, channels:history, users:read" },
      { text: "Add Redirect URL: <your-domain>/api/auth/callback/slack" },
      { text: "Basic Information → App Credentials → copy Client ID + Client Secret" },
      { text: "Paste in Vercel env: SLACK_CLIENT_ID, SLACK_CLIENT_SECRET" },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    icon: "github",
    difficulty: "easy",
    time: "~2 min",
    steps: [
      { text: "Open GitHub developer settings", url: "https://github.com/settings/developers", urlLabel: "GitHub OAuth Apps" },
      { text: "New OAuth App → Application name: Qyntra" },
      { text: "Homepage URL: <your-domain> · Callback URL: <your-domain>/api/auth/callback/github" },
      { text: "Generate client secret · copy Client ID + Secret" },
      { text: "Paste in Vercel env: GITHUB_ID, GITHUB_SECRET" },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "linkedin",
    difficulty: "medium",
    time: "~5 min",
    steps: [
      { text: "Open LinkedIn Developers", url: "https://www.linkedin.com/developers/apps", urlLabel: "LinkedIn Apps" },
      { text: "Create app → fill org info" },
      { text: "Auth tab → Add redirect URL: <your-domain>/api/auth/callback/linkedin" },
      { text: "Request scopes: r_liteprofile, r_emailaddress" },
      { text: "Copy Client ID + Client Secret → paste in Vercel env: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET" },
    ],
  },
];

export function ConnectGuide() {
  const [open, setOpen] = useState<string | null>("notion");

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden">
      <div className="p-6 border-b border-[var(--line)]">
        <div className="pixel text-[12px] text-[var(--ember)] mb-1.5 flex items-center gap-2">
          <BookOpen size={12} /> How to connect
        </div>
        <h2 className="pixel text-[24px]">Hook up each source in &lt; 5 minutes</h2>
        <p className="pixel text-[13px] text-[var(--text-2)] mt-2">
          Each provider needs an OAuth app registered once. Then click OAUTH on the source card to sign in. Tokens stored in Vercel env (encrypted).
        </p>
      </div>

      <div className="divide-y divide-[var(--line)]">
        {GUIDES.map((g) => {
          const isOpen = open === g.id;
          return (
            <div key={g.id}>
              <button
                onClick={() => setOpen(isOpen ? null : g.id)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[var(--bg-2)] transition text-left"
              >
                <div className="size-10 rounded bg-[var(--bg-2)] flex items-center justify-center">
                  <ConnIcon kind={g.icon} size={20} />
                </div>
                <div className="flex-1">
                  <div className="pixel text-[15px]">{g.name}</div>
                  <div className="pixel text-[11px] text-[var(--muted)] flex gap-3 mt-0.5">
                    <span>
                      <span className={
                        g.difficulty === "easy" ? "text-[var(--good)]" :
                        g.difficulty === "medium" ? "text-[var(--gold)]" :
                        "text-[var(--ember)]"
                      }>● </span>
                      {g.difficulty.toUpperCase()}
                    </span>
                    <span>· {g.time}</span>
                    <span>· {g.steps.length} steps</span>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-[var(--muted)]" /> : <ChevronDown size={16} className="text-[var(--muted)]" />}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden bg-black/40"
                  >
                    <ol className="px-6 py-4 space-y-3">
                      {g.steps.map((s, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex gap-3"
                        >
                          <span className="pixel text-[13px] text-[var(--ember)] w-6 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                          <div className="flex-1">
                            <div className="pixel text-[13.5px] leading-relaxed">{s.text}</div>
                            {s.url && (
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1.5 inline-flex items-center gap-1.5 pixel text-[12px] text-[var(--ember)] hover:underline"
                              >
                                {s.urlLabel || s.url} <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        </motion.li>
                      ))}
                    </ol>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
