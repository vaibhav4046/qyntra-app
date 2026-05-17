"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Text, Stars, Line, Float, Billboard } from "@react-three/drei";
import { useRef, useState, useMemo, useEffect, Suspense } from "react";
import * as THREE from "three";

// Soldier sprite shared across nodes
function useSoldierTexture() {
  return useLoader(THREE.TextureLoader, "/logo.png");
}
import { NODES, EDGES, TYPE_COLOR, type QNode, type QEdge } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, RefreshCw, FileText } from "lucide-react";
import { ConnIcon } from "./conn-icon";

function nodePos(n: QNode): [number, number, number] {
  return [(n.x - 0.5) * 14, (n.y - 0.5) * -10, (n.z ?? 0) * 6];
}

function NodeMesh({ node, onClick, selected, predicted, soldier }: { node: QNode; onClick: () => void; selected: boolean; predicted: boolean; soldier: THREE.Texture }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const padRef = useRef<THREE.Mesh>(null);
  const color = TYPE_COLOR[node.type];
  const baseSize = node.size === "lg" ? 0.7 : node.size === "md" ? 0.5 : 0.35;
  const spriteH = baseSize * 2.4;
  const spriteW = spriteH * (98 / 134);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      if (selected || predicted) {
        const s = 1 + Math.sin(t * 3) * 0.08;
        meshRef.current.scale.setScalar(s);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
    if (ringRef.current && predicted) {
      ringRef.current.rotation.z += 0.02;
      const s = 1 + Math.sin(t * 2) * 0.15;
      ringRef.current.scale.setScalar(s);
    }
    if (padRef.current) {
      const mat = padRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.25 + Math.sin(t * 2 + node.x * 7) * 0.15;
    }
  });

  const pos = nodePos(node);
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group position={pos}>
        {/* Neon ground pad (Contra arcade vibe) */}
        <mesh ref={padRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -baseSize - 0.15, 0]}>
          <ringGeometry args={[baseSize * 0.6, baseSize * 1.4, 24]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.35} />
        </mesh>
        {/* Pad inner glow disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -baseSize - 0.14, 0]}>
          <circleGeometry args={[baseSize * 0.55, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.08} />
        </mesh>

        {predicted && (
          <mesh ref={ringRef}>
            <ringGeometry args={[baseSize * 1.4, baseSize * 1.6, 32]} />
            <meshBasicMaterial color="#ffc15c" side={THREE.DoubleSide} transparent opacity={0.5} />
          </mesh>
        )}
        {/* Type-shape mesh (smaller, behind soldier) */}
        <mesh
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { document.body.style.cursor = "auto"; }}
        >
          {node.type === "page" && <boxGeometry args={[baseSize * 0.6, baseSize * 0.6, baseSize * 0.6]} />}
          {node.type === "doc" && <octahedronGeometry args={[baseSize * 0.5]} />}
          {node.type === "entity" && <sphereGeometry args={[baseSize * 0.45, 16, 16]} />}
          {node.type === "claim" && <tetrahedronGeometry args={[baseSize * 0.55]} />}
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={selected ? 1.6 : 0.7}
            metalness={0.5}
            roughness={0.3}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Contra soldier billboard sprite */}
        <Billboard follow position={[0, 0.05, 0]}>
          <mesh
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { document.body.style.cursor = "auto"; }}
          >
            <planeGeometry args={[spriteW, spriteH]} />
            <meshBasicMaterial
              map={soldier}
              transparent
              alphaTest={0.1}
              color={selected ? "#ffc15c" : predicted ? "#ffe9b3" : "#ffffff"}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </Billboard>

        <Text
          position={[0, spriteH * 0.65, 0]}
          fontSize={0.2}
          color={selected ? "#ffc15c" : "#f4f4f5"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#000"
        >
          {node.label}
        </Text>
      </group>
    </Float>
  );
}

function Edges({ predictedTargets, edges, nodes }: { predictedTargets: string[]; edges: QEdge[]; nodes: QNode[] }) {
  return (
    <>
      {edges.map((e, i) => {
        const a = nodes.find((n) => n.id === e.from);
        const b = nodes.find((n) => n.id === e.to);
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

interface SceneProps {
  selected: string | null;
  setSelected: (id: string | null) => void;
  predictedTargets: string[];
  nodes?: QNode[];
  edges?: QEdge[];
}

function Scene({ selected, setSelected, predictedTargets, nodes: propNodes, edges: propEdges }: SceneProps) {
  const soldier = useSoldierTexture();
  useEffect(() => {
    soldier.magFilter = THREE.NearestFilter;
    soldier.minFilter = THREE.NearestFilter;
    soldier.colorSpace = THREE.SRGBColorSpace;
    soldier.needsUpdate = true;
  }, [soldier]);

  const nodes = propNodes || NODES;
  const edges = propEdges || EDGES;

  return (
    <>
      <color attach="background" args={["#040506"]} />
      <fog attach="fog" args={["#040506", 18, 38]} />
      <Stars radius={60} depth={60} count={3500} factor={5} fade speed={0.8} />
      {/* Distant nebula spheres */}
      <mesh position={[20, 8, -20]}>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial color="#ff5b1f" transparent opacity={0.06} />
      </mesh>
      <mesh position={[-22, -6, -18]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color="#a87bff" transparent opacity={0.05} />
      </mesh>
      <ambientLight intensity={0.35} />
      <pointLight position={[10, 10, 10]} intensity={1.6} color="#ff5b1f" />
      <pointLight position={[-10, -10, -10]} intensity={0.9} color="#a87bff" />
      <pointLight position={[0, 0, 5]} intensity={0.6} color="#ffc15c" />
      <Edges predictedTargets={predictedTargets} edges={edges} nodes={nodes} />
      {nodes.map((n) => (
        <NodeMesh
          key={n.id}
          node={n}
          soldier={soldier}
          selected={selected === n.id}
          predicted={predictedTargets.includes(n.id)}
          onClick={() => setSelected(n.id)}
        />
      ))}
      <OrbitControls enablePan enableZoom enableRotate maxDistance={30} minDistance={3} />
    </>
  );
}

interface Map3DProps {
  customNodes?: QNode[];
  customEdges?: QEdge[];
}

export function Map3D({ customNodes, customEdges }: Map3DProps = {}) {
  const nodes = customNodes || NODES;
  const edges = customEdges || EDGES;
  const [selected, setSelected] = useState<string | null>(nodes[0]?.id ?? null);
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 100);
    return () => clearTimeout(t);
  }, []);
  const selNode = useMemo(() => nodes.find((n) => n.id === selected) || null, [nodes, selected]);
  const predictedTargets = useMemo(() => {
    if (!selected) return [];
    const directEdges = edges.filter((e) => e.from === selected || e.to === selected);
    return directEdges.map((e) => (e.from === selected ? e.to : e.from)).slice(0, 4);
  }, [edges, selected]);

  return (
    <div className="h-full relative">
      <Canvas camera={{ position: [8, 4, 12], fov: 50 }}>
        <Suspense fallback={null}>
          <Scene selected={selected} setSelected={setSelected} predictedTargets={predictedTargets} nodes={customNodes} edges={customEdges} />
        </Suspense>
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
          <span><span className="text-[var(--muted)]">NODES</span> {nodes.length}</span>
          <span><span className="text-[var(--muted)]">EDGES</span> {edges.length}</span>
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
            className="absolute inset-x-0 bottom-0 sm:inset-x-auto sm:top-5 sm:right-5 sm:bottom-auto sm:mt-24 sm:w-[420px] max-h-[70vh] sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl border border-[var(--line-2)] bg-[var(--bg-1)]/95 backdrop-blur-xl overflow-y-auto"
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
                  const n = nodes.find((x) => x.id === id);
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
