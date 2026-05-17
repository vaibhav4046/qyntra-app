"use client";

export function Logo({ size = 32, withGlow = false }: { size?: number; withGlow?: boolean }) {
  const width = size;
  const height = Math.round(size * (134 / 98));
  return (
    <div
      className={`relative inline-flex items-center justify-center ${withGlow ? "glow-ember" : ""}`}
      style={{ width, height }}
    >
      <img
        src="/logo.svg"
        alt="Qyntra"
        width={width}
        height={height}
        style={{ imageRendering: "pixelated", display: "block" }}
      />
    </div>
  );
}
