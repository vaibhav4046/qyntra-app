"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls, Sphere, Float } from "@react-three/drei";
import { ConnIcon } from "./conn-icon";

// Distribute N points on sphere via Fibonacci lattice
function fibonacciSphere(n: number, radius = 2.4) {
  const points: [number, number, number][] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    points.push([Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius]);
  }
  return points;
}

const FILE_LABELS = [
  "RAG", "Notion", "Drive", "Gmail", "Standup", "Resume", "Q4 Roadmap",
  "GraphRAG", "Embeddings", "Vector DB", "HyDE", "BM25", "GitHub",
  "Inbox", "Hackathon", "Voyage 3", "pgvector", "Pinecone", "Cross-Encoder",
  "ArXiv", "Microsoft", "Memory", "Agent", "MRR", "WikiThon", "Reranking",
  "Hybrid", "Dense", "Sparse", "Compile", "Predict", "Cite",
];

const TYPE_COLORS = ["#ff5b1f", "#ffc15c", "#a87bff", "#4cd5c8"];

function Globe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const points = useMemo(() => fibonacciSphere(FILE_LABELS.length, 2.4), []);

  useFrame((state, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.05;
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.05;
  });

  return (
    <group>
      {/* Core orb */}
      <Sphere args={[1.8, 64, 64]}>
        <meshStandardMaterial
          color="#08090b"
          emissive="#ff5b1f"
          emissiveIntensity={0.15}
          metalness={0.6}
          roughness={0.35}
          transparent
          opacity={0.6}
        />
      </Sphere>

      {/* Wireframe */}
      <Sphere args={[1.82, 24, 24]}>
        <meshBasicMaterial color="#ff5b1f" wireframe transparent opacity={0.15} />
      </Sphere>

      {/* Inner glow shell */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2.0, 32, 32]} />
        <meshBasicMaterial color="#ff5b1f" transparent opacity={0.05} />
      </mesh>

      {/* File nodes orbiting on surface */}
      <group ref={groupRef}>
        {points.map((p, i) => {
          const color = TYPE_COLORS[i % TYPE_COLORS.length];
          const label = FILE_LABELS[i];
          return (
            <Float key={i} speed={2} floatIntensity={0.3} rotationIntensity={0.2}>
              <group position={p}>
                <mesh>
                  <boxGeometry args={[0.12, 0.12, 0.12]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={1.2}
                  />
                </mesh>
                {/* Label drawn as Html-like via point lookat. Skip Text for perf — keep dots. */}
              </group>
            </Float>
          );
        })}
      </group>

      {/* Edges from center to a few points (data flows in) */}
      {points.slice(0, 12).map((p, i) => (
        <line key={i}>
          <bufferGeometry
            attach="geometry"
            onUpdate={(self) => {
              self.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(...p)]);
            }}
          />
          <lineBasicMaterial color="#ff5b1f" transparent opacity={0.18} />
        </line>
      ))}

      {/* Light particles */}
      {Array.from({ length: 80 }).map((_, i) => {
        const angle = (i / 80) * Math.PI * 2;
        const r = 3 + Math.sin(i) * 0.5;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, Math.sin(i * 0.3) * 1.5, Math.sin(angle) * r]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#ffc15c" transparent opacity={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

export function GlobeHero() {
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full aspect-square max-w-[560px] mx-auto">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,91,31,0.35),transparent_55%)] blur-2xl" />
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#ff5b1f" />
        <pointLight position={[-5, -3, -5]} intensity={0.8} color="#a87bff" />
        <pointLight position={[0, 0, 3]} intensity={0.6} color="#ffc15c" />
        <Globe />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>

      {/* Floating chips */}
      <div className="absolute top-[10%] right-[5%] px-3 py-2 rounded-lg border border-[var(--gold)]/40 bg-[var(--bg)]/80 backdrop-blur-md text-left max-w-[200px]">
        <div className="mono cap text-[9px] text-[var(--gold)] flex items-center gap-1.5">
          ⌁ PREDICTED NEXT
        </div>
        <div className="text-[12px] font-medium mt-0.5">GraphRAG · 92%</div>
      </div>
      <div className="absolute bottom-[8%] left-[2%] px-3 py-2 rounded-lg border border-[var(--teal)]/40 bg-[var(--bg)]/80 backdrop-blur-md max-w-[220px]">
        <div className="mono cap text-[9px] text-[var(--teal)]">+ NEW MEMORY</div>
        <div className="text-[12px] mt-0.5">Voyage 3 wins on legal text</div>
      </div>
      <div className="absolute top-[40%] left-[-2%] px-3 py-2 rounded-lg border border-[var(--violet)]/40 bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="mono cap text-[9px] text-[var(--violet)]">YOUR CONTEXT</div>
        <div className="flex gap-1 mt-1">
          <ConnIcon kind="drive" size={14} />
          <ConnIcon kind="notion" size={14} />
          <ConnIcon kind="gmail" size={14} />
          <ConnIcon kind="desktop" size={14} />
          <ConnIcon kind="github" size={14} />
        </div>
      </div>
    </div>
  );
}
