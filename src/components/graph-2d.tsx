"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TYPE_COLOR, type QNode, type QEdge } from "@/lib/data";
import { X, ExternalLink } from "lucide-react";

interface Props {
  nodes: QNode[];
  edges: QEdge[];
}

export function Graph2D({ nodes, edges }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tRef = useRef({ x: 0, y: 0, z: 1 });
  const dragRef = useRef({ dragging: false, sx: 0, sy: 0, tx0: 0, ty0: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const selNode = useMemo(() => nodes.find((n) => n.id === selected) || null, [nodes, selected]);
  const visibleNodes = useMemo(
    () => (filter === "all" ? nodes : nodes.filter((n) => n.type === filter)),
    [nodes, filter]
  );

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let frame = 0;

    function size() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Pre-compute uniform world positions for the node set. For many nodes,
    // we cluster by type — each type gets its own sector of the canvas
    // so the graph reads as organised constellations.
    const positions = new Map<string, { x: number; y: number }>();
    const clusterCentres = new Map<string, { cx: number; cy: number; r: number; color: string }>();
    function recomputePositions(W: number, H: number) {
      positions.clear();
      clusterCentres.clear();
      const n = nodes.length;
      if (n <= 12) {
        for (const node of nodes) {
          positions.set(node.id, {
            x: (node.x - 0.5) * W * 1.4 + W * 0.5,
            y: (node.y - 0.5) * H * 1.3 + H * 0.5,
          });
        }
        return;
      }
      const byType: Record<string, QNode[]> = {};
      for (const node of nodes) (byType[node.type] ||= []).push(node);
      const types = Object.keys(byType);
      const cx = W * 0.5;
      const cy = H * 0.5;
      const mainR = Math.min(W, H) * 0.32;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      types.forEach((type, ti) => {
        const angle = (ti / types.length) * Math.PI * 2 - Math.PI / 2;
        const clusterCx = cx + Math.cos(angle) * mainR;
        const clusterCy = cy + Math.sin(angle) * mainR;
        const group = byType[type];
        const clusterR = Math.max(40, Math.min(W, H) * 0.13);
        clusterCentres.set(type, { cx: clusterCx, cy: clusterCy, r: clusterR + 30, color: TYPE_COLOR[type as keyof typeof TYPE_COLOR] });
        group.forEach((node, gi) => {
          // Phyllotaxis within cluster — clean spacing
          const r = clusterR * Math.sqrt(gi / Math.max(1, group.length - 1));
          const a = gi * goldenAngle;
          positions.set(node.id, {
            x: clusterCx + Math.cos(a) * r,
            y: clusterCy + Math.sin(a) * r,
          });
        });
      });
    }

    function worldXY(n: QNode) {
      return positions.get(n.id) || { x: 0, y: 0 };
    }
    function screenXY(wx: number, wy: number) {
      const t = tRef.current;
      return { x: wx * t.z + t.x, y: wy * t.z + t.y };
    }

    function draw() {
      const r = canvas.getBoundingClientRect();
      const W = r.width;
      const H = r.height;
      if (positions.size !== nodes.length) recomputePositions(W, H);
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Radial vignette — sleeker than a flat grid
      const vignette = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.1, W * 0.5, H * 0.5, Math.max(W, H) * 0.85);
      vignette.addColorStop(0, "rgba(255,91,31,0.03)");
      vignette.addColorStop(0.6, "rgba(168,123,255,0.012)");
      vignette.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      // Cluster halos (soft glow behind each type cluster)
      clusterCentres.forEach(({ cx, cy, r: cr, color }) => {
        const ss = screenXY(cx, cy);
        const screenR = cr * tRef.current.z;
        const halo = ctx.createRadialGradient(ss.x, ss.y, screenR * 0.1, ss.x, ss.y, screenR);
        halo.addColorStop(0, `${color}26`);
        halo.addColorStop(0.6, `${color}0a`);
        halo.addColorStop(1, `${color}00`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, screenR, 0, Math.PI * 2);
        ctx.fill();
      });

      // Edges — curved bezier with a control point pulled toward the canvas centre
      const cxScreen = W * 0.5;
      const cyScreen = H * 0.5;
      edges.forEach((e) => {
        const a = nodes.find((n) => n.id === e.from);
        const b = nodes.find((n) => n.id === e.to);
        if (!a || !b) return;
        if (filter !== "all" && a.type !== filter && b.type !== filter) return;
        const wa = worldXY(a);
        const wb = worldXY(b);
        const sa = screenXY(wa.x, wa.y);
        const sb = screenXY(wb.x, wb.y);
        const isSel = selected && (e.from === selected || e.to === selected);
        const hasSel = !!selected;
        // Hide non-selected edges when something is selected — cleaner reading.
        if (hasSel && !isSel) return;
        const dx = sb.x - sa.x;
        const dy = sb.y - sa.y;
        const mx = (sa.x + sb.x) / 2;
        const my = (sa.y + sb.y) / 2;
        // Control point: pull midpoint toward canvas centre for bow-in feel
        const toCenter = { x: cxScreen - mx, y: cyScreen - my };
        const cp = { x: mx + toCenter.x * 0.18, y: my + toCenter.y * 0.18 };
        const grad = ctx.createLinearGradient(sa.x, sa.y, sb.x, sb.y);
        const baseColor = isSel ? "255,193,92" : "255,91,31";
        const alphaA = isSel ? 0.95 : nodes.length > 14 ? 0.08 : 0.18;
        const alphaB = isSel ? 0.5 : nodes.length > 14 ? 0.04 : 0.1;
        grad.addColorStop(0, `rgba(${baseColor},${alphaA})`);
        grad.addColorStop(1, `rgba(${baseColor},${alphaB})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = isSel ? 2 : 0.7;
        ctx.beginPath();
        ctx.moveTo(sa.x, sa.y);
        ctx.quadraticCurveTo(cp.x, cp.y, sb.x, sb.y);
        ctx.stroke();
        // Suppress unused vars in TS strict mode
        void dx; void dy;
      });

      // Nodes
      visibleNodes.forEach((n) => {
        const w = worldXY(n);
        const s = screenXY(w.x, w.y);
        const baseR = n.size === "lg" ? 14 : n.size === "md" ? 10 : 7;
        const color = TYPE_COLOR[n.type];
        const isSel = selected === n.id;
        const isHover = hover === n.id;

        if (isSel || isHover) {
          ctx.beginPath();
          const haloR = baseR + 8 + Math.sin(frame * 0.05) * 3;
          const grad = ctx.createRadialGradient(s.x, s.y, baseR, s.x, s.y, haloR);
          grad.addColorStop(0, `${color}88`);
          grad.addColorStop(1, `${color}00`);
          ctx.fillStyle = grad;
          ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = color;
        ctx.shadowBlur = isSel ? 20 : 8;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, baseR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Only label hovered/selected nodes (and large nodes when nodes are sparse)
        const sparse = visibleNodes.length <= 14;
        if (isHover || isSel || (sparse && n.size === "lg")) {
          ctx.fillStyle = isSel ? "#ffc15c" : "#f4f4f5";
          ctx.font = '12px "JetBrains Mono", monospace';
          ctx.textAlign = "left";
          // Background pill behind label for readability
          const text = n.label;
          const metrics = ctx.measureText(text);
          const tx = s.x + baseR + 6;
          const ty = s.y + 4;
          ctx.fillStyle = "rgba(0,0,0,0.7)";
          ctx.fillRect(tx - 4, ty - 11, metrics.width + 8, 16);
          ctx.fillStyle = isSel ? "#ffc15c" : "#f4f4f5";
          ctx.fillText(text, tx, ty);
        }
      });

      raf = requestAnimationFrame(draw);
    }

    function hitTest(mx: number, my: number) {
      const r = canvas.getBoundingClientRect();
      const W = r.width;
      const H = r.height;
      for (let i = visibleNodes.length - 1; i >= 0; i--) {
        const n = visibleNodes[i];
        const w = worldXY(n);
        const s = screenXY(w.x, w.y);
        const baseR = n.size === "lg" ? 16 : n.size === "md" ? 12 : 9;
        if (Math.abs(mx - s.x) <= baseR && Math.abs(my - s.y) <= baseR) return n.id;
      }
      return null;
    }

    function onMove(e: MouseEvent) {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      if (dragRef.current.dragging) {
        const t = tRef.current;
        t.x = dragRef.current.tx0 + (mx - dragRef.current.sx);
        t.y = dragRef.current.ty0 + (my - dragRef.current.sy);
        return;
      }
      const id = hitTest(mx, my);
      setHover(id);
      canvas.style.cursor = id ? "pointer" : "grab";
    }
    function onDown(e: MouseEvent) {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const id = hitTest(mx, my);
      if (id) {
        setSelected(id);
        return;
      }
      dragRef.current = { dragging: true, sx: mx, sy: my, tx0: tRef.current.x, ty0: tRef.current.y };
      canvas.style.cursor = "grabbing";
    }
    function onUp() {
      dragRef.current.dragging = false;
      canvas.style.cursor = "grab";
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const t = tRef.current;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      t.x = mx - (mx - t.x) * factor;
      t.y = my - (my - t.y) * factor;
      t.z *= factor;
      t.z = Math.max(0.3, Math.min(3.5, t.z));
    }

    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    size();
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [nodes, edges, selected, hover, filter, visibleNodes]);

  return (
    <div ref={wrapRef} className="relative h-full bg-[#06070a]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab" />

      <div className="absolute bottom-5 left-5 flex gap-2 px-2 py-2 rounded-lg bg-[var(--bg-1)]/80 backdrop-blur border border-[var(--line-2)]">
        {[
          { k: "all", l: "ALL" },
          { k: "page", l: "PAGES", c: "var(--ember)" },
          { k: "doc", l: "DOCS", c: "var(--gold)" },
          { k: "entity", l: "ENTITIES", c: "var(--violet)" },
          { k: "claim", l: "CLAIMS", c: "var(--teal)" },
        ].map((b) => (
          <button
            key={b.k}
            onClick={() => setFilter(b.k)}
            className={`mono cap text-[10px] px-3 py-1.5 rounded transition flex items-center gap-1.5 ${
              filter === b.k ? "bg-[var(--ember)]/15 text-[var(--ember)]" : "text-[var(--text-2)] hover:text-[var(--text)]"
            }`}
          >
            {b.c && <span className="size-1.5 rounded-sm" style={{ background: b.c }} />}
            {b.l}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selNode && (
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
            className="absolute inset-x-0 bottom-0 sm:inset-x-auto sm:top-20 sm:right-5 sm:bottom-auto sm:w-[400px] max-h-[70vh] sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl border border-[var(--line-2)] bg-[var(--bg-1)]/95 backdrop-blur-xl overflow-y-auto"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="pixel text-[11px]" style={{ color: TYPE_COLOR[selNode.type] }}>
                    {selNode.kind}{selNode.source ? ` · ${selNode.source.toUpperCase()}` : ""}
                  </div>
                  <h3 className="text-[20px] font-semibold leading-tight mt-1">{selNode.label}</h3>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="size-7 rounded hover:bg-[var(--bg-2)] flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-[13px] text-[var(--text-2)] leading-relaxed mb-4">{selNode.summary}</p>
              {selNode.sourceUrl && (
                <a
                  href={selNode.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-2.5 rounded bg-[var(--ember)] text-white flex items-center justify-center gap-2 hover:bg-[var(--ember-2)] transition pixel text-[12px]"
                >
                  Open in {selNode.source} <ExternalLink size={13} />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
