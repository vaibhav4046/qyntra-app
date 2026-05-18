"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Boxes, Network } from "lucide-react";
import { NODES as SEED_NODES, EDGES as SEED_EDGES, type QNode, type QEdge } from "@/lib/data";

const Map3D = dynamic(() => import("@/components/map-3d").then((m) => m.Map3D), { ssr: false });
const Graph2D = dynamic(() => import("@/components/graph-2d").then((m) => m.Graph2D), { ssr: false });

// Deterministic pseudo-random from string
function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function hashToPos(seed: string, source: string): [number, number, number] {
  const h = hashCode(seed + source);
  const sourceOffsets: Record<string, [number, number]> = {
    drive: [0.2, 0.2],
    notion: [0.8, 0.2],
    gmail: [0.2, 0.8],
    github: [0.5, 0.1],
    desktop: [0.5, 0.5],
    manual: [0.5, 0.5],
    arxiv: [0.9, 0.5],
    default: [0.5, 0.5],
  };
  const off = sourceOffsets[source] || sourceOffsets.default;
  // Jitter within region
  const jx = ((h % 1000) / 1000) * 0.35 - 0.175;
  const jy = ((h % 997) / 997) * 0.35 - 0.175;
  const jz = ((h % 991) / 991) * 0.6 - 0.3;
  return [off[0] + jx, off[1] + jy, jz];
}

function kindToType(kind: string): QNode["type"] {
  const k = kind.toUpperCase();
  if (k === "PAGE") return "page";
  if (k === "ENTITY") return "entity";
  if (k === "CLAIM") return "claim";
  return "doc";
}

function kindToSize(kind: string): QNode["size"] {
  const k = kind.toUpperCase();
  if (k === "PAGE" || k === "PDF") return "md";
  return "sm";
}

function buildNodesFromFiles(files: any[]): QNode[] {
  if (!files.length) return [];
  return files.map((f) => {
    const [x, y, z] = hashToPos(f.id || f.title, f.source || "desktop");
    return {
      id: f.id,
      type: kindToType(f.kind),
      label: f.title || "Untitled",
      size: kindToSize(f.kind),
      x,
      y,
      z,
      summary: f.summary || f.content?.slice(0, 200) || "No preview available.",
      source: f.source,
      sourceUrl: f.source_url,
      lastSync: f.last_modified ? new Date(f.last_modified).toLocaleDateString() : undefined,
      tags: f.tags || [],
      kind: f.kind || "DOC",
    };
  });
}

function buildEdgesFromNodes(nodes: QNode[]): QEdge[] {
  const edges: QEdge[] = [];
  const added = new Set<string>();
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      if (a.source && a.source === b.source) {
        const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
        if (!added.has(key)) {
          edges.push({ from: a.id, to: b.id, rel: "related" });
          added.add(key);
        }
      }
      // Share at least one tag
      if (a.tags && b.tags) {
        const shared = a.tags.filter((t) => b.tags?.includes(t));
        if (shared.length > 0) {
          const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
          if (!added.has(key)) {
            edges.push({ from: a.id, to: b.id, rel: "tagged" });
            added.add(key);
          }
        }
      }
    }
  }
  // Cap edges to keep performance healthy
  return edges.slice(0, 200);
}

export default function Map3DPage() {
  const [nodes, setNodes] = useState<QNode[] | undefined>(undefined);
  const [edges, setEdges] = useState<QEdge[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"galaxy" | "graph">("galaxy");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/files?limit=200");
        if (!res.ok) return;
        const json = await res.json();
        const files = (json.files || []) as any[];
        if (files.length > 0 && !cancelled) {
          const n = buildNodesFromFiles(files);
          const e = buildEdgesFromNodes(n);
          setNodes(n);
          setEdges(e);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const liveNodes = nodes && nodes.length ? nodes : SEED_NODES;
  const liveEdges = edges && edges.length ? edges : SEED_EDGES;

  return (
    <div className="h-full relative">
      <div className="absolute top-5 left-5 z-10 px-4 py-3 rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)]/80 backdrop-blur-md max-w-[320px]">
        <div className="mono cap text-[10px] text-[var(--gold)] mb-1">
          {view === "galaxy" ? "3D Galaxy · drag · scroll" : "Force graph · drag · scroll"}
        </div>
        <div className="text-[13px]">
          {nodes && nodes.length
            ? `${liveNodes.length} real nodes · ${liveEdges.length} edges`
            : "Sample wiki · sign in & sync to load yours"}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex gap-1 p-1 rounded-lg border border-[var(--line-2)] bg-[var(--bg-1)]/80 backdrop-blur-md">
        <button
          onClick={() => setView("galaxy")}
          className={`pixel text-[11px] px-3 py-1.5 rounded flex items-center gap-1.5 transition ${
            view === "galaxy"
              ? "bg-[var(--ember)] text-white"
              : "text-[var(--text-2)] hover:text-white"
          }`}
        >
          <Boxes size={12} /> Galaxy
        </button>
        <button
          onClick={() => setView("graph")}
          className={`pixel text-[11px] px-3 py-1.5 rounded flex items-center gap-1.5 transition ${
            view === "graph"
              ? "bg-[var(--ember)] text-white"
              : "text-[var(--text-2)] hover:text-white"
          }`}
        >
          <Network size={12} /> Graph
        </button>
      </div>

      {loading && (
        <div className="absolute bottom-5 right-5 z-10 px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg-1)]/80 backdrop-blur-md mono cap text-[10px] text-[var(--muted)]">
          Loading your data…
        </div>
      )}

      {view === "galaxy" ? (
        <Map3D customNodes={nodes} customEdges={edges} />
      ) : (
        <Graph2D nodes={liveNodes} edges={liveEdges} />
      )}
    </div>
  );
}
