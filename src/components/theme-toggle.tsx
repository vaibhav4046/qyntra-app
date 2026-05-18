"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const LS_KEY = "qyntra:theme";
type Theme = "dark" | "light";

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", t);
}

export function ThemeToggle({ size = 14 }: { size?: number }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem(LS_KEY)) as Theme | null;
    const initial: Theme = saved === "light" || saved === "dark" ? saved : "dark";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function flip() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(LS_KEY, next);
    } catch {}
  }

  return (
    <button
      onClick={flip}
      className="p-1.5 rounded hover:bg-[var(--bg-1)] text-[var(--muted)] hover:text-[var(--text)] transition"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  );
}
