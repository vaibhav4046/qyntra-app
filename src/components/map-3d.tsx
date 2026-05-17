"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Stars, Line, Float } from "@react-three/drei";
import { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { NODES, EDGES, TYPE_COLOR, type QNode } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, RefreshCw, FileText } from "lucide-react";
import { ConnIcon } from "./conn-icon";

function nodePos(n: QNode): [number, number, number] {
  return [(n.x - 0.5) * 14, (n.y - 0.5) * -10, (n.z ?? 0) * 6];
}

function NodeMesh({ node, onClick, selected, predicted }: { node: QNode; onClick: () => void; selected: boolean; predicted: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const color = TYPE_COLOR[node.type];
  const baseSize = node.size === "lg" ? 0.7 : node.size === "md" ? 0.5 : 0.35;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      if (selected || predicted) {
        const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.08;
        meshRef.current.scale.setScalar(s);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
    if (ringRef.current && predicted) {
      ringRef.current.rotation.z += 0.02;
      const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
      ringRef.current.scale.setScalar(s);
    }
  });

  const pos = nodePos(node);
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group position={pos}>
        {predicted && (
          <mesh ref={ringRef}>
            <ringGeometry args={[baseSize * 1.4, baseSize * 1.6, 32]} />
            <meshBasicMaterial color="#ffc15c" side={THREE.DoubleSide} transparent opacity={0.5} />
          </mesh>
        )}
        <mesh
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { document.body.style.cursor = "auto"; }}
        >
          {node.type === "page" && <boxGeometry args={[baseSize, baseSize, baseSize]} />}
          {node.type === "doc" && <octahedronGeometry args={[baseSize * 0.8]} />}
          {node.type === "entity" && <sphereGeometry args={[baseSize * 0.7, 16, 16]} />}
          {node.type === "claim" && <tetrahedronGeometry args={[baseSize * 0.9]} />}
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={selected ? 1.2 : 0.5}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
        <Text
          position={[0, baseSize + 0.3, 0]}
          fontSize={0.22}
          color={selected ? "#ffc15c" : "#f4f4f5"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000"
        >
          {node.label}
        </Text>
      </group>
    </Float>
  );
}

function Edges({ predictedTargets }: { predictedTargets: string[] }) {
  return (
    <>
      {EDGES.map((e, i) => {
        const a = NODES.find((n) => n.id === e.from);
        const b = NODES.find((n) => n.id === e.to);
        if (!a || !b) return null;
        const isPred = predictedTargets.includes(e.to) || predictedTargets.includes(e.from);
        return (
          <Line
            key={i}
            points={[nodePos(a), nodePos(b)]}
            color={isPred ? "#ffc15c" : "#ff5b1f"}
            opacity={isPred ? 0.6 : 0.2}
            transparent
            lineWidth={isPred ? 2 : 1}
          />
        );
      })}
    </>
  );
}

function Scene({ selected, setSelected, predictedTargets }: { selected: string | null; setSelected: (id: string | null) => void; predictedTargets: string[] }) {
  return (
    <>
      <color attach="background" args={["#08090b"]} />
      <fog attach="fog" args={["#08090b", 15, 30]} />
      <Stars radius={50} depth={50} count={2000} factor={4} fade speed={1} />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ff5b1f" />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#a87bff" />
      <Edges predictedTargets={predictedTargets} />
      {NODES.map((n) => (
        <NodeMesh
          key={n.id}
          node={n}
          selected={selected === n.id}
          predicted={predictedTargets.includes(n.id)}
          onClick={() => setSelected(n.id)}
        />
      ))}
      <OrbitControls enablePan enableZoom enableRotate maxDistance={30} minDistance={3} />
    </>
  );
}

export function Map3D() {
  const [selected, setSelected] = useState<string | null>("rag");
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 100);
    return () => clearTimeout(t);
  }, []);
  const selNode = useMemo(() => NODES.find((n) => n.id === selected) || null, [selected]);
  const predictedTargets = useMemo(() => {
    if (!selected) return [];
    const directEdges = EDGES.filter((e) => e.from === selected || e.to === selected);
    return directEdges.map((e) => (e.from === selected ? e.to : e.from)).slice(0, 4);
  }, [selected]);

  return (
    <div className="h-full relative">
      <Canvas camera={{ position: [8, 4, 12], fov: 50 }}>
        <Scene selected={selected} setSelected={setSelected} predictedTargets={predictedTargets} />
      </Canvas>

      {/* Legend */}
      <div className="absolute bottom-5 left-5 flex gap-2">
        {Object.entries(TYPE_COLOR).map(([k, c]) => (
          <div key={k} className="mono cap text-[10px] px-2.5 py-1.5 rounded border border-[var(--line)] bg-[var(--bg-1)]/80 backdrop-blur flex items-center gap-1.5">
            <span className="size-2 rounded-sm" style={{ background: c }} /> {k}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="absolute top-5 right-5 px-4 py-3 rounded-xl border border-[var(--line-2)] bg-[var(--bg-1)]/80 backdrop-blur-md">
        <div className="mono cap text-[10px] text-[var(--muted)] mb-1">EXPLORED THIS SESSION</div>
        <div className="text-[28px] font-bold">
          {selected ? 64 : 12}<span className="mono text-[14px] text-[var(--muted)]">/100</span>
        </div>
        <div className="flex gap-3 mt-1 mono cap text-[10px]">
          <span><span className="text-[var(--muted)]">NODES</span> {NODES.length}</span>
          <span><span className="text-[var(--muted)]">EDGES</span> {EDGES.length}</span>
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selNode && (
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
            className="absolute top-5 right-5 mt-24 w-[420px] max-h-[80vh] rounded-2xl border border-[var(--line-2)] bg-[var(--bg-1)]/95 backdrop-blur-xl overflow-y-auto"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="pixel text-[11px] mb-1" style={{ color: TYPE_COLOR[selNode.type] }}>
                    {selNode.kind}{selNode.source ? ` · ${selNode.source.toUpperCase()}` : ""}
                  </div>
                  <h3 className="text-[22px] font-semibold leading-tight">{selNode.label}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="size-7 rounded hover:bg-[var(--bg-2)] flex items-center justify-center">
                  <X size={14} />
                </button>
              </div>
              <p className="text-[13.5px] text-[var(--text-2)] leading-relaxed mb-4">{selNode.summary}</p>

              {selNode.preview && (
                <div className="mb-4 p-3 rounded border border-[var(--line)] bg-[var(--bg-2)]">
                  <div className="pixel text-[10px] text-[var(--muted)] mb-1.5 flex items-center gap-1.5">
                    <FileText size={10} /> PREVIEW
                  </div>
                  <div className="text-[12.5px] text-[var(--text-2)] leading-relaxed whitespace-pre-line line-clamp-6">
                    {selNode.preview}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mb-4">
                {selNode.source && (
                  <div className="p-2.5 rounded border border-[var(--line)]">
                    <div className="pixel text-[9px] text-[var(--muted)] mb-1">SOURCE</div>
                    <div className="flex items-center gap-1.5 text-[12px]">
                      <ConnIcon kind={selNode.source.toLowerCase()} size={14} />
                      {selNode.source}
                    </div>
                  </div>
                )}
                {selNode.lastSync && (
                  <div className="p-2.5 rounded border border-[var(--line)]">
                    <div className="pixel text-[9px] text-[var(--muted)] mb-1">LAST SYNC</div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[var(--good)]">
                      <RefreshCw size={11} /> {selNode.lastSync}
                    </div>
                  </div>
                )}
              </div>

              {selNode.sourceUrl && (
                <a
                  href={selNode.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mb-4 px-4 py-2.5 rounded bg-[var(--ember)] text-white flex items-center justify-center gap-2 hover:bg-[var(--ember-2)] transition pixel text-[12px]"
                >
                  Open in {selNode.source} <ExternalLink size={13} />
                </a>
              )}

              {selNode.tags && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selNode.tags.map((t) => (
                    <span key={t} className="pixel text-[11px] px-2 py-0.5 rounded border border-[var(--line)] text-[var(--text-2)]">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div className="pixel text-[11px] text-[var(--gold)] mb-2">CONNECTED · {predictedTargets.length} NODES</div>
              <div className="space-y-1">
                {predictedTargets.map((id) => {
                  const n = NODES.find((x) => x.id === id);
                  if (!n) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelected(id)}
                      className="w-full text-left p-2.5 rounded border border-[var(--line)] hover:border-[var(--ember)]/40 transition flex items-center gap-2"
                    >
                      <span className="size-2 rounded-sm" style={{ background: TYPE_COLOR[n.type] }} />
                      <span className="text-[12.5px] flex-1">{n.label}</span>
                      {n.source && <ConnIcon kind={n.source.toLowerCase()} size={12} />}
                      <span className="pixel text-[10px] text-[var(--muted)]">{n.kind}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
