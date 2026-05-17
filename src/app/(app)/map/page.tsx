"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NODES, EDGES, TYPE_COLOR, PREDICTIONS, type QNode } from "@/lib/data";
import { X } from "lucide-react";

export default function MapPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tRef = useRef({ x: 0, y: 0, z: 1 });
  const dragRef = useRef({ dragging: false, sx: 0, sy: 0, tx0: 0, ty0: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const selNode = useMemo(() => NODES.find((n) => n.id === selected) || null, [selected]);
  const predicted = useMemo(() => (selected ? (PREDICTIONS[selected] || []).map((p) => p.to) : []), [selected]);

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

    function worldXY(n: QNode, W: number, H: number) {
      return { x: (n.x - 0.5) * W * 1.4 + W * 0.5, y: (n.y - 0.5) * H * 1.3 + H * 0.5 };
    }
    function screenXY(wx: number, wy: number) {
      const t = tRef.current;
      return { x: wx * t.z + t.x, y: wy * t.z + t.y };
    }

    function passes(n: QNode) {
      return filter === "all" || n.type === filter;
    }

    function draw() {
      const r = canvas.getBoundingClientRect();
      const W = r.width;
      const H = r.height;
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.moveTo((i * W) / 40, 0);
        ctx.lineTo((i * W) / 40, H);
        ctx.stroke();
      }
      for (let i = 0; i < 25; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (i * H) / 25);
        ctx.lineTo(W, (i * H) / 25);
        ctx.stroke();
      }

      // Edges
      EDGES.forEach((e) => {
        const a = NODES.find((n) => n.id === e.from);
        const b = NODES.find((n) => n.id === e.to);
        if (!a || !b || !passes(a) || !passes(b)) return;
        const wa = worldXY(a, W, H);
        const wb = worldXY(b, W, H);
        const sa = screenXY(wa.x, wa.y);
        const sb = screenXY(wb.x, wb.y);
        const isPred = predicted.includes(e.to) || predicted.includes(e.from);
        ctx.strokeStyle = isPred ? "rgba(255,193,92,0.6)" : "rgba(255,255,255,0.10)";
        ctx.lineWidth = isPred ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.moveTo(sa.x, sa.y);
        ctx.lineTo(sb.x, sb.y);
        ctx.stroke();
      });

      // Nodes
      NODES.filter(passes).forEach((n) => {
        const w = worldXY(n, W, H);
        const s = screenXY(w.x, w.y);
        const baseR = n.size === "lg" ? 12 : n.size === "md" ? 9 : 7;
        const color = TYPE_COLOR[n.type];
        const isSel = selected === n.id;
        const isPred = predicted.includes(n.id);

        if (isPred || isSel) {
          ctx.beginPath();
          const haloR = baseR + 8 + Math.sin(frame * 0.05) * 3;
          const grad = ctx.createRadialGradient(s.x, s.y, baseR, s.x, s.y, haloR);
          grad.addColorStop(0, "rgba(255,193,92,0.4)");
          grad.addColorStop(1, "rgba(255,193,92,0)");
          ctx.fillStyle = grad;
          ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = color;
        ctx.shadowBlur = isSel ? 20 : 10;
        ctx.shadowColor = color;
        ctx.fillRect(s.x - baseR / 2, s.y - baseR / 2, baseR, baseR);
        ctx.shadowBlur = 0;

        if (n.size !== "sm" || hover === n.id) {
          ctx.fillStyle = isSel ? "#ffc15c" : "#f4f4f5";
          ctx.font = '12px "JetBrains Mono", monospace';
          ctx.textAlign = "left";
          ctx.fillText(n.label, s.x + baseR, s.y + 4);
        }
      });

      raf = requestAnimationFrame(draw);
    }

    function hitTest(mx: number, my: number) {
      const r = canvas.getBoundingClientRect();
      const W = r.width;
      const H = r.height;
      for (let i = NODES.length - 1; i >= 0; i--) {
        const n = NODES[i];
        if (!passes(n)) continue;
        const w = worldXY(n, W, H);
        const s = screenXY(w.x, w.y);
        const baseR = n.size === "lg" ? 14 : n.size === "md" ? 11 : 9;
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
      t.z = Math.max(0.4, Math.min(3, t.z));
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
  }, [selected, hover, filter, predicted]);

  return (
    <div ref={wrapRef} className="relative h-full bg-[#06070a]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab" />

      <div className="absolute top-5 left-5 flex gap-2 px-2 py-2 rounded-lg bg-[var(--bg-1)]/80 backdrop-blur border border-[var(--line-2)]">
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
            className="absolute top-5 right-5 w-[400px] max-h-[80vh] rounded-2xl border border-[var(--line-2)] bg-[var(--bg-1)]/95 backdrop-blur-xl overflow-y-auto"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="mono cap text-[10px]" style={{ color: TYPE_COLOR[selNode.type] }}>
                    {selNode.kind}
                  </div>
                  <h3 className="text-[20px] font-semibold mt-1">{selNode.label}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="size-7 rounded hover:bg-[var(--bg-2)] flex items-center justify-center">
                  <X size={14} />
                </button>
              </div>
              <p className="text-[13.5px] text-[var(--text-2)] leading-relaxed mb-4">{selNode.summary}</p>
              {selNode.source && <div className="mono cap text-[10px] text-[var(--muted)] mb-3">SOURCE · {selNode.source}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
