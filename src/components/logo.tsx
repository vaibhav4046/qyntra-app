"use client";

import Image from "next/image";

export function Logo({ size = 40, withGlow = false }: { size?: number; withGlow?: boolean }) {
  // Image is 770:990 (≈ 0.78 aspect). Render box matches that ratio so the
  // character fills the frame without dead transparent padding on the sides.
  const height = size;
  const width = Math.round(size * (770 / 990));
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
        style={{ display: "block", objectFit: "contain", width: "100%", height: "100%" }}
        priority
        unoptimized
      />
    </div>
  );
}
