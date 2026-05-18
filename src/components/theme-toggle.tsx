"use client";

import { Moon } from "lucide-react";

export function ThemeToggle({ size = 14 }: { size?: number }) {
  return (
    <span
      className="p-1.5 rounded text-[var(--muted)] inline-flex"
      aria-label="Dark mode locked"
      title="Qyntra uses dark mode only"
    >
      <Moon size={size} />
    </span>
  );
}
