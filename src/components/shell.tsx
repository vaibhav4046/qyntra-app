"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ConnIcon } from "./conn-icon";
import { useConnectorStore } from "@/lib/connector-store";
import { Home, Network, MessageSquare, BookOpen, FileText, Plug, Search, Command, Boxes, LogOut } from "lucide-react";
import { Logo } from "./logo";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

const ROUTES = [
  { href: "/home", label: "Dashboard", icon: Home, k: "1" },
  { href: "/map", label: "Knowledge Map", icon: Network, k: "2", badge: "NEW" },
  { href: "/map-3d", label: "3D Galaxy", icon: Boxes, k: "3", badge: "BETA" },
  { href: "/ask", label: "Ask", icon: MessageSquare, k: "4" },
  { href: "/read", label: "Read", icon: BookOpen, k: "5" },
  { href: "/files", label: "Files", icon: FileText, k: "6" },
  { href: "/sources", label: "Sources", icon: Plug, k: "7" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { connectors, init } = useConnectorStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { init(); }, [init]);

  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/ask`);
    }
  }, [searchQuery, router]);

  return (
    <div className="relative h-screen grid grid-rows-[56px_1fr] overflow-hidden text-[var(--text)]">
      {/* Topbar */}
      <header className="flex items-center justify-between px-5 border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={28} withGlow />
            <span className="mono cap text-[12px] font-semibold">QYNTRA::WIKI</span>
          </Link>
          <nav className="flex items-center gap-1 ml-3">
            {ROUTES.slice(0, 6).map((r) => {
              const active = pathname === r.href;
              return (
                <Link
                  key={r.href}
                  href={r.href}
                  className={`mono cap text-[11px] px-3 py-1.5 rounded-md transition flex items-center gap-2 ${
                    active
                      ? "bg-[var(--ember)]/15 text-[var(--ember)] border border-[var(--ember)]/30"
                      : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg-1)]"
                  }`}
                >
                  {r.label.split(" ")[0]}
                  <span className="mono text-[9px] opacity-50">{r.k}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 max-w-[520px] mx-8">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-1)] border border-[var(--line)] focus-within:border-[var(--ember)]/50 transition">
            <Search size={14} className="text-[var(--muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="ask, find, jump — press Enter to search"
              className="bg-transparent flex-1 outline-none text-[13px] placeholder:text-[var(--muted)]"
            />
            <kbd className="mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--line)] text-[var(--muted)]">
              <Command size={9} className="inline" /> K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="mono cap text-[10px] flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--line)]">
            <span className="size-1.5 rounded-full bg-[var(--good)] halo" /> SYNCED · 2M AGO
          </div>
          <div className="mono cap text-[10px] flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--ember)]/30 text-[var(--ember)]">
            <span className="size-1.5 rounded-full bg-[var(--ember)]" /> HYDRA · LIVE
          </div>
          {session?.user ? (
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-gradient-to-br from-[var(--ember)] to-[var(--gold)] flex items-center justify-center text-[11px] font-semibold" title={session.user.email || ""}>
                {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-1.5 rounded hover:bg-[var(--bg-1)] text-[var(--muted)] hover:text-[var(--text)] transition"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link href="/signin" className="size-8 rounded-full bg-gradient-to-br from-[var(--ember)] to-[var(--gold)] flex items-center justify-center text-[11px] font-semibold">
              ?
            </Link>
          )}
        </div>
      </header>

      {/* Main */}
      <div className="grid grid-cols-[240px_1fr] min-h-0">
        <aside className="border-r border-[var(--line)] bg-[var(--bg)] overflow-y-auto p-3">
          <div className="mono cap text-[10px] text-[var(--muted)] px-3 py-2">Workspace</div>
          {ROUTES.map((r) => {
            const active = pathname === r.href;
            return (
              <Link
                key={r.href}
                href={r.href}
                className={`flex items-center gap-3 px-3 py-2 rounded text-[13px] transition ${
                  active
                    ? "bg-[var(--ember)]/10 text-[var(--ember)] border-l-2 border-[var(--ember)]"
                    : "text-[var(--text-2)] hover:bg-[var(--bg-1)] hover:text-[var(--text)]"
                }`}
              >
                <r.icon size={15} />
                <span className="flex-1">{r.label}</span>
                {r.badge && (
                  <span className="mono text-[9px] px-1.5 py-0.5 rounded bg-[var(--ember)]/20 text-[var(--ember)]">
                    {r.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="mt-6 mono cap text-[10px] text-[var(--muted)] px-3 py-2 flex items-center justify-between">
            Sources <span>{connectors.filter((c) => c.on).length}</span>
          </div>
          {connectors.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-3 py-1.5 rounded text-[12px] text-[var(--text-2)] hover:bg-[var(--bg-1)] cursor-pointer">
              <ConnIcon kind={c.icon} size={14} />
              <span className="flex-1 truncate">{c.name}</span>
              <span className={`size-1.5 rounded-full ${c.on ? "bg-[var(--good)]" : "bg-[var(--muted)]"}`} />
            </div>
          ))}
        </aside>

        <main className="overflow-y-auto bg-[var(--bg)] h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
