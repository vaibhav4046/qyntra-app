"use client";

import { useRef, useEffect } from "react";

interface Branch {
  x: number; y: number;
  angle: number;
  length: number;
  depth: number;
  width: number;
}

export function PixelTree({ density = 1, className }: { density?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let frame = 0;
    const PX = 5; // pixel cell size — HydraDB tree is chunky pixels
    const palette = ["#3a0e02", "#8a2710", "#d9421a", "#ff5b1f", "#ff8a3f", "#ffc15c", "#ffe9b3", "#ffffff"];

    const points = new Map<string, { intensity: number; phase: number }>();
    const sparkles: { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string }[] = [];

    function size() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildTree();
    }

    function plotBranch(x0: number, y0: number, angle: number, length: number, depth: number, widthAtBase: number) {
      const steps = Math.max(20, length / PX);
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const x = x0 + Math.cos(angle) * length * t;
        const y = y0 + Math.sin(angle) * length * t;
        const w = widthAtBase * (1 - t * 0.7);
        for (let dx = -w; dx <= w; dx += 1) {
          for (let dy = -w * 0.6; dy <= w * 0.6; dy += 1) {
            if (dx * dx + dy * dy * 1.8 <= w * w) {
              const px = Math.floor((x + dx * PX) / PX) * PX;
              const py = Math.floor((y + dy * PX) / PX) * PX;
              const key = `${px},${py}`;
              const intensity = 0.4 + Math.random() * 0.6 - depth * 0.1;
              const existing = points.get(key);
              if (!existing || existing.intensity < intensity) {
                points.set(key, { intensity, phase: Math.random() * Math.PI * 2 });
              }
            }
          }
        }
      }

      if (depth < 4 && length > 30) {
        const branches = depth === 0 ? 3 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < branches; i++) {
          const tipX = x0 + Math.cos(angle) * length;
          const tipY = y0 + Math.sin(angle) * length;
          const spread = depth === 0 ? Math.PI * 0.6 : Math.PI * 0.5;
          const newAngle = angle + (Math.random() - 0.5) * spread;
          const newLength = length * (0.55 + Math.random() * 0.25);
          plotBranch(tipX, tipY, newAngle, newLength, depth + 1, widthAtBase * 0.65);
        }
      }
    }

    function buildTree() {
      points.clear();
      const r = canvas.getBoundingClientRect();
      const W = r.width;
      const H = r.height;
      const baseX = W * 0.5;
      const baseY = H * 0.95;
      const trunkLen = H * 0.32;
      plotBranch(baseX, baseY, -Math.PI / 2, trunkLen, 0, 3.5 * density);
    }

    function spawnSparkle() {
      const keys = Array.from(points.keys());
      if (!keys.length) return;
      const k = keys[Math.floor(Math.random() * keys.length)];
      const [x, y] = k.split(",").map(Number);
      sparkles.push({
        x, y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        life: 0,
        max: 30 + Math.random() * 40,
        col: palette[6 + Math.floor(Math.random() * 2)],
      });
    }

    function draw() {
      const r = canvas.getBoundingClientRect();
      const W = r.width;
      const H = r.height;
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Vertical grid
      ctx.strokeStyle = "rgba(255,91,31,0.04)";
      ctx.lineWidth = 1;
      const colStep = 56;
      for (let x = 0; x <= W; x += colStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      // Tree pixels
      points.forEach((p, k) => {
        const [x, y] = k.split(",").map(Number);
        const pulse = 0.5 + Math.sin(frame * 0.04 + p.phase) * 0.5;
        const lit = Math.min(1, p.intensity + pulse * 0.3);
        const idx = Math.min(palette.length - 1, Math.floor(lit * palette.length));
        ctx.fillStyle = palette[idx];
        ctx.fillRect(x, y, PX - 0.5, PX - 0.5);
      });

      // Sparkles — bright pixels traveling
      if (frame % 3 === 0 && sparkles.length < 80) spawnSparkle();
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
        const alpha = 1 - s.life / s.max;
        if (s.life >= s.max) {
          sparkles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = s.col;
        ctx.globalAlpha = alpha;
        ctx.fillRect(Math.floor(s.x / PX) * PX, Math.floor(s.y / PX) * PX, PX, PX);
        // Glow
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillRect(Math.floor(s.x / PX) * PX - PX, Math.floor(s.y / PX) * PX - PX, PX * 3, PX * 3);
        ctx.globalAlpha = 1;
      }

      // Horizontal accent line near base
      ctx.strokeStyle = "rgba(255,91,31,0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.95 + 4);
      ctx.lineTo(W, H * 0.95 + 4);
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    size();
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [density]);

  return <canvas ref={canvasRef} className={`block w-full h-full ${className || ""}`} />;
}
