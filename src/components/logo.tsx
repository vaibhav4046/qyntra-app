"use client";

import Image from "next/image";

export function Logo({ size = 36, withGlow = false }: { size?: number; withGlow?: boolean }) {
  // Square render box — image is contained inside, no overflow
  const width = size;
  const height = size;
  return (
    <div
      className={`logo-wrap relative inline-flex items-center justify-center ${withGlow ? "glow-ember" : ""}`}
      style={{ width, height, background: "transparent" }}
    >
      <Image
        src="/logo.png"
        alt="Qyntra"
        width={width}
        height={height}
        style={{ imageRendering: "pixelated", display: "block", objectFit: "contain", width: "100%", height: "100%" }}
        priority
        unoptimized
      />
    </div>
  );
}
