"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Loader2, Check, AlertCircle, ArrowRight } from "lucide-react";

function MagicInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("fail");
      setMsg("No token in URL.");
      return;
    }
    setStatus("loading");
    (async () => {
      try {
        const csrfRes = await fetch("/api/auth/csrf", { credentials: "include" });
        const { csrfToken } = await csrfRes.json();
        const form = new URLSearchParams();
        form.set("csrfToken", csrfToken);
        form.set("token", token);
        form.set("callbackUrl", `${window.location.origin}/onboarding`);
        form.set("json", "true");
        const res = await fetch("/api/auth/callback/magic", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Auth-Return-Redirect": "1",
            Accept: "application/json",
          },
          body: form.toString(),
          credentials: "include",
          redirect: "manual",
        });
        if (!res.ok) {
          setStatus("fail");
          setMsg(`HTTP ${res.status}`);
          return;
        }
        const json = await res.json().catch(() => null);
        const destUrl: string | undefined = json?.url;
        console.log("[magic] callback response:", res.status, json);
        if (!destUrl) {
          setStatus("fail");
          setMsg("No redirect URL returned.");
          return;
        }
        let path = "/";
        try { path = new URL(destUrl).pathname; } catch {}
        if (path.startsWith("/signin") || /[?&]error=/.test(destUrl)) {
          setStatus("fail");
          setMsg(`Server rejected token. URL: ${destUrl}`);
          return;
        }
        setStatus("ok");
        window.location.href = destUrl;
      } catch (err) {
        setStatus("fail");
        setMsg((err as Error).message);
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-black text-white vgrid flex flex-col">
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[var(--line)]">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} withGlow />
          <span className="pixel text-[16px]">Qyntra</span>
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-[420px] w-full p-8 rounded-2xl border border-[var(--line-2)] bg-[var(--bg-1)] text-center">
          {status === "loading" && (
            <>
              <Loader2 size={28} className="animate-spin text-[var(--ember)] mx-auto mb-4" />
              <h1 className="pixel text-[22px] mb-2">Activating your workspace…</h1>
              <p className="pixel text-[12px] text-[var(--text-2)]">Verifying magic link</p>
            </>
          )}
          {status === "ok" && (
            <>
              <div className="size-12 rounded-full bg-[var(--good)]/15 border border-[var(--good)]/40 mx-auto flex items-center justify-center mb-4">
                <Check size={20} className="text-[var(--good)]" />
              </div>
              <h1 className="pixel text-[22px] mb-2">Signed in.</h1>
              <p className="pixel text-[12px] text-[var(--text-2)] mb-4">Loading your workspace…</p>
            </>
          )}
          {status === "fail" && (
            <>
              <div className="size-12 rounded-full bg-[var(--bad)]/15 border border-[var(--bad)]/40 mx-auto flex items-center justify-center mb-4">
                <AlertCircle size={20} className="text-[var(--bad)]" />
              </div>
              <h1 className="pixel text-[22px] mb-2">Link unusable</h1>
              <p className="pixel text-[12px] text-[var(--text-2)] mb-5">{msg}</p>
              <Link
                href="/signin?mode=signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[var(--ember)] text-white pixel text-[13px] hover:bg-[var(--ember-2)]"
              >
                Request a new link <ArrowRight size={13} />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MagicPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <MagicInner />
    </Suspense>
  );
}
