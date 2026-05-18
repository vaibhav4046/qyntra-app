import { create } from "zustand";
import { CONNECTORS, type QConnector } from "@/lib/data";

const LS_KEY = "qyntra:connectors:v2";

function loadFromLS(): QConnector[] {
  if (typeof window === "undefined") return CONNECTORS;
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const map = JSON.parse(saved) as { id: string; on: boolean; count: number }[];
      const byId = Object.fromEntries(map.map((m) => [m.id, m]));
      return CONNECTORS.map((x) => (byId[x.id] ? { ...x, ...byId[x.id] } : x));
    }
  } catch {}
  return CONNECTORS;
}

function persistToLS(conns: QConnector[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(conns.map((c) => ({ id: c.id, on: c.on, count: c.count }))));
}

interface ConnectorStore {
  connectors: QConnector[];
  syncing: Record<string, boolean>;
  init: () => void;
  toggle: (c: QConnector) => void;
}

export const useConnectorStore = create<ConnectorStore>((set, get) => ({
  connectors: CONNECTORS,
  syncing: {},
  init: () => {
    set({ connectors: loadFromLS() });
  },
  toggle: (c: QConnector) => {
    const next = get().connectors.map((x) => (x.id === c.id ? { ...x, on: !x.on } : x));
    set({ connectors: next });
    persistToLS(next);
  },
}));
