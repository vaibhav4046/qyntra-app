"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { Settings, Plug, LogOut, User, Beaker } from "lucide-react";
import { useProfileStore } from "@/lib/profile-store";

export function AvatarMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { demoMode, setDemoMode } = useProfileStore();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const email = user?.emailAddresses?.[0]?.emailAddress;
  const name = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.username || email;
  const initial = name?.[0]?.toUpperCase() || "U";

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="size-8 rounded-full bg-gradient-to-br from-[var(--ember)] to-[var(--gold)] flex items-center justify-center text-[11px] font-semibold text-white"
        aria-label="Account menu"
        title={email || ""}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-[240px] rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-3 border-b border-[var(--line)]">
            <div className="text-[13px] truncate">{name || "Workspace"}</div>
            <div className="mono cap text-[10px] text-[var(--muted)] truncate">{email}</div>
          </div>
          <div className="py-1">
            <Link
              href="/sources"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--text-2)] hover:bg-[var(--bg-1)] hover:text-[var(--text)]"
            >
              <Plug size={13} /> Sources
            </Link>
            <Link
              href="/onboarding"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--text-2)] hover:bg-[var(--bg-1)] hover:text-[var(--text)]"
            >
              <User size={13} /> Re-run onboarding
            </Link>
            <button
              onClick={() => { setDemoMode(!demoMode); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--text-2)] hover:bg-[var(--bg-1)] hover:text-[var(--text)] text-left"
            >
              <Beaker size={13} /> Demo mode: <strong className="text-[var(--gold)] ml-1">{demoMode ? "ON" : "OFF"}</strong>
            </button>
            <Link
              href="/forgot-password"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--text-2)] hover:bg-[var(--bg-1)] hover:text-[var(--text)]"
            >
              <Settings size={13} /> Account recovery
            </Link>
          </div>
          <div className="border-t border-[var(--line)] py-1">
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--bad)] hover:bg-[var(--bad)]/10 text-left"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
