"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ConnIcon } from "./conn-icon";
import { useConnectorStore } from "@/lib/connector-store";
import type { QConnector } from "@/lib/data";
import { Home, MessageSquare, BookOpen, FileText, Plug, Search, Boxes, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { SearchPopover } from "./search-popover";
import { AvatarMenu } from "./avatar-menu";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";

const ROUTES = [
  { href: "/home", label: "Dashboard", icon: Home, k: "1" },
  { href: "/map-3d", label: "3D Galaxy", icon: Boxes, k: "2", badge: "BETA" },
  { href: "/ask", label: "Ask", icon: MessageSquare, k: "3" },
  { href: "/read", label: "Read", icon: BookOpen, k: "4" },
  { href: "/files", label: "Files", icon: FileText, k: "5" },
  { href: "/sources", label: "Sources", icon: Plug, k: "6" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { connectors, init } = useConnectorStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => { init(); }, [init]);
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/ask`);
      setSearchOpen(false);
    }
  }, [searchQuery, router]);

  return (
    <div className="relative h-[100dvh] grid grid-rows-[56px_1fr] overflow-hidden text-[var(--text)]">
      {/* Topbar */}
      <header className="flex items-center justify-between gap-2 px-3 sm:px-5 border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-2 sm:gap-5 min-w-0">
          {/* Mobile hamburger */}
          <button
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-2 -ml-2 text-[var(--text-2)] hover:text-[var(--text)]"
          >
            <Menu size={18} />
          </button>
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <Logo size={32} withGlow />
            <span className="mono cap text-[12px] font-semibold hidden sm:inline">QYNTRA::WIKI</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 ml-3">
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

        {/* Search: desktop inline (with results popover), mobile collapsible */}
        <div className="hidden md:block flex-1 max-w-[520px] mx-4">
          <SearchPopover />
        </div>
        <button
          onClick={() => setSearchOpen((o) => !o)}
          className="md:hidden p-2 text-[var(--text-2)]"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="mono cap text-[10px] hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--line)]">
            <span className="size-1.5 rounded-full bg-[var(--ember)]" /> MEMORY READY
          </div>
          <div className="mono cap text-[10px] hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--ember)]/30 text-[var(--ember)]">
            <span className="size-1.5 rounded-full bg-[var(--ember)]" /> HYDRA
          </div>
          {isSignedIn ? (
            <AvatarMenu />
          ) : (
            <Link href="/signin" className="size-8 rounded-full bg-gradient-to-br from-[var(--ember)] to-[var(--gold)] flex items-center justify-center text-[11px] font-semibold">
              ?
            </Link>
          )}
        </div>
      </header>

      {/* Mobile search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="md:hidden absolute top-[56px] left-0 right-0 z-30 px-3 py-2 bg-[var(--bg)] border-b border-[var(--line)]"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--bg-1)] border border-[var(--ember)]/40">
              <Search size={14} className="text-[var(--muted)]" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="ask, find, jump — Enter"
                className="bg-transparent flex-1 outline-none text-[14px] placeholder:text-[var(--muted)]"
              />
              <button onClick={() => setSearchOpen(false)} className="text-[var(--muted)] p-1"><X size={14} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-0 relative">
        {/* Desktop sidebar */}
        <aside className="hidden md:block border-r border-[var(--line)] bg-[var(--bg)] overflow-y-auto p-3">
          <SidebarBody connectors={connectors} pathname={pathname} />
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-30"
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
                className="md:hidden fixed top-0 bottom-0 left-0 w-[260px] bg-[var(--bg)] border-r border-[var(--line)] z-40 overflow-y-auto"
              >
                <div className="flex items-center justify-between p-3 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2">
                    <Logo size={22} />
                    <span className="mono cap text-[12px] font-semibold">QYNTRA</span>
                  </div>
                  <button onClick={() => setDrawerOpen(false)} className="p-1.5 text-[var(--muted)]" aria-label="Close menu">
                    <X size={16} />
                  </button>
                </div>
                <div className="p-3">
                  <SidebarBody connectors={connectors} pathname={pathname} />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="overflow-y-auto bg-[var(--bg)] h-full min-w-0">
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

function SidebarBody({ connectors, pathname }: { connectors: QConnector[]; pathname: string }) {
  return (
    <>
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
        <Link
          key={c.id}
          href={`/sources?connector=${c.id}`}
          className="flex items-center gap-3 px-3 py-1.5 rounded text-[12px] text-[var(--text-2)] hover:bg-[var(--bg-1)] hover:text-[var(--text)] cursor-pointer transition"
        >
          <ConnIcon kind={c.icon} size={14} />
          <span className="flex-1 truncate">{c.name}</span>
          <span className={`size-1.5 rounded-full ${c.on ? "bg-[var(--good)]" : "bg-[var(--muted)]"}`} />
        </Link>
      ))}
    </>
  );
}
