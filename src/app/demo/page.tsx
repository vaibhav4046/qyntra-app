"use client";

import { useEffect } from "react";
import HomePage from "@/app/(app)/home/page";
import { Shell } from "@/components/shell";
import { useProfileStore } from "@/lib/profile-store";

export default function DemoPage() {
  const { setDemoMode } = useProfileStore();

  useEffect(() => {
    setDemoMode(true);
    document.cookie = "qyntra_demo=1; path=/; max-age=86400; SameSite=Lax";
  }, [setDemoMode]);

  return (
    <Shell>
      <HomePage />
    </Shell>
  );
}
