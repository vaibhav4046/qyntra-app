"use client";

import dynamic from "next/dynamic";

const Map3D = dynamic(() => import("@/components/map-3d").then((m) => m.Map3D), { ssr: false });

export default function Map3DPage() {
  return (
    <div className="h-full relative">
      <div className="absolute top-5 left-5 z-10 px-4 py-3 rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)]/80 backdrop-blur-md">
        <div className="mono cap text-[10px] text-[var(--gold)] mb-1">3D Galaxy · Drag to orbit · Scroll to zoom</div>
        <div className="text-[13px]">Knowledge as a navigable galaxy</div>
      </div>
      <Map3D />
    </div>
  );
}
