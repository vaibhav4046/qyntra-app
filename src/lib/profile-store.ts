import { create } from "zustand";

const LS_DEMO = "qyntra:demo-mode";
const LS_ONBOARDED = "qyntra:onboarded";

interface ProfileStore {
  demoMode: boolean;
  onboarded: boolean;
  hydrated: boolean;
  setDemoMode: (v: boolean) => void;
  setOnboarded: (v: boolean) => void;
  init: () => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  demoMode: true, // safe default until hydrated
  onboarded: false,
  hydrated: false,
  setDemoMode: (v) => {
    if (typeof window !== "undefined") localStorage.setItem(LS_DEMO, v ? "1" : "0");
    set({ demoMode: v });
    // Best-effort server persist
    fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo_mode: v }),
    }).catch(() => {});
  },
  setOnboarded: (v) => {
    if (typeof window !== "undefined") localStorage.setItem(LS_ONBOARDED, v ? "1" : "0");
    set({ onboarded: v });
  },
  init: async () => {
    if (typeof window === "undefined") return;
    // Optimistic from LS
    const lsDemo = localStorage.getItem(LS_DEMO);
    const lsOn = localStorage.getItem(LS_ONBOARDED);
    set({
      demoMode: lsDemo === "1" || lsDemo === null, // default ON if never set
      onboarded: lsOn === "1",
    });
    // Reconcile with server
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const json = await res.json();
        if (json.profile) {
          set({
            demoMode: !!json.demoMode,
            onboarded: !!json.onboarded,
            hydrated: true,
          });
          localStorage.setItem(LS_DEMO, json.demoMode ? "1" : "0");
          localStorage.setItem(LS_ONBOARDED, json.onboarded ? "1" : "0");
          return;
        }
      }
    } catch {}
    set({ hydrated: true });
  },
}));
