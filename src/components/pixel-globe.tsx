"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";

const RADIUS = 2.2;
const DOT_COUNT = 1100;

function fibonacciSphere(n: number, radius: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts.push([Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius]);
  }
  return pts;
}

function PixelDots() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => fibonacciSphere(DOT_COUNT, RADIUS), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const palette = useMemo(
    () => [
      new THREE.Color("#3a0e02"),
      new THREE.Color("#8a2710"),
      new THREE.Color("#d9421a"),
      new THREE.Color("#ff5b1f"),
      new THREE.Color("#ff8a3f"),
      new THREE.Color("#ffc15c"),
      new THREE.Color("#ffe9b3"),
      new THREE.Color("#ffffff"),
    ],
    []
  );
  const phases = useMemo(() => positions.map(() => Math.random() * Math.PI * 2), [positions]);

  useEffect(() => {
    const mesh = meshRef.current!;
    positions.forEach((p, i) => {
      dummy.position.set(p[0], p[1], p[2]);
      const normal = new THREE.Vector3(p[0], p[1], p[2]).normalize();
      dummy.lookAt(normal.clone().multiplyScalar(2));
      dummy.scale.setScalar(0.85);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, palette[3]);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [positions, dummy, palette]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    positions.forEach((p, i) => {
      const phase = phases[i];
      const pulse = 0.5 + Math.sin(t * 1.5 + phase) * 0.5;
      // Some dots far brighter sometimes (sparkles)
      const sparkle = Math.sin(t * 0.7 + phase * 3.1) > 0.985 ? 2 : 0;
      const idx = Math.min(palette.length - 1, Math.floor((0.45 + pulse * 0.4 + sparkle) * palette.length * 0.55));
      mesh.setColorAt(i, palette[idx]);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, DOT_COUNT]}>
      <boxGeometry args={[0.05, 0.05, 0.05]} />
      <meshBasicMaterial />
    </instancedMesh>
  );
}

function Wireframe() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.04;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[RADIUS * 1.02, 24, 24]} />
      <meshBasicMaterial color="#ff5b1f" wireframe transparent opacity={0.12} />
    </mesh>
  );
}

const LABELED_NODES = [
  { label: "RAG Pipelines", pos: [0, 1, 1.8] as [number, number, number], color: "#ff5b1f", big: true },
  { label: "GraphRAG", pos: [1.6, 0.5, -1.2] as [number, number, number], color: "#ff5b1f" },
  { label: "Drive", pos: [-1.8, 0.3, 0.8] as [number, number, number], color: "#4cd5c8" },
  { label: "Notion", pos: [1.2, 1.5, 0.4] as [number, number, number], color: "#ffffff" },
  { label: "Gmail", pos: [-0.5, -1.8, 0.8] as [number, number, number], color: "#ffc15c" },
  { label: "Voyage 3", pos: [0.6, -1.2, -1.6] as [number, number, number], color: "#a87bff" },
  { label: "GitHub", pos: [-1.5, -0.8, -1.0] as [number, number, number], color: "#ffffff" },
  { label: "Slack", pos: [0.4, 1.9, -0.5] as [number, number, number], color: "#ffc15c" },
];

function FileNodes({ onHover }: { onHover: (i: number | null) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.05;
  });
  return (
    <group ref={groupRef}>
      {LABELED_NODES.map((n, i) => (
        <group key={i} position={n.pos}>
          {n.big && (
            <mesh>
              <ringGeometry args={[0.22, 0.26, 24]} />
              <meshBasicMaterial color="#ffc15c" side={THREE.DoubleSide} transparent opacity={0.5} />
            </mesh>
          )}
          <mesh
            onPointerOver={(e) => { e.stopPropagation(); onHover(i); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { onHover(null); document.body.style.cursor = "auto"; }}
          >
            <boxGeometry args={[0.16, 0.16, 0.16]} />
            <meshStandardMaterial color={n.color} emissive={n.color} emissiveIntensity={1.4} />
          </mesh>
          <Html
            position={[0.18, 0.1, 0]}
            transform
            distanceFactor={4}
            occlude={false}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <div
              style={{
                fontFamily: "Pixelify Sans, VT323, monospace",
                fontSize: n.big ? 18 : 14,
                color: "#fff",
                background: "rgba(8,9,11,0.85)",
                padding: "2px 8px",
                border: `1px solid ${n.color}`,
                whiteSpace: "nowrap",
                imageRendering: "pixelated",
              }}
            >
              {n.label}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function OrbitRings() {
  const refs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
  useFrame((_, delta) => {
    if (refs[0].current) refs[0].current.rotation.z += delta * 0.06;
    if (refs[1].current) refs[1].current.rotation.x += delta * 0.04;
    if (refs[2].current) refs[2].current.rotation.y += delta * 0.05;
  });
  return (
    <>
      <mesh ref={refs[0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RADIUS * 1.4, RADIUS * 1.42, 64]} />
        <meshBasicMaterial color="#ff5b1f" side={THREE.DoubleSide} transparent opacity={0.25} />
      </mesh>
      <mesh ref={refs[1]} rotation={[0, Math.PI / 4, 0]}>
        <ringGeometry args={[RADIUS * 1.6, RADIUS * 1.62, 64]} />
        <meshBasicMaterial color="#ffc15c" side={THREE.DoubleSide} transparent opacity={0.2} />
      </mesh>
      <mesh ref={refs[2]} rotation={[Math.PI / 3, Math.PI / 6, 0]}>
        <ringGeometry args={[RADIUS * 1.8, RADIUS * 1.82, 64]} />
        <meshBasicMaterial color="#a87bff" side={THREE.DoubleSide} transparent opacity={0.18} />
      </mesh>
    </>
  );
}

export function PixelGlobe() {
  const [hovered, setHovered] = useState<number | null>(null);
  useEffect(() => {
    const ts = [50, 200, 600, 1500].map((d) => setTimeout(() => window.dispatchEvent(new Event("resize")), d));
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,91,31,0.4),transparent_55%)] blur-3xl pointer-events-none" />
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#ff5b1f" />
        <pointLight position={[-5, -3, -5]} intensity={0.8} color="#a87bff" />
        <pointLight position={[0, 0, 4]} intensity={0.5} color="#ffc15c" />
        <PixelDots />
        <Wireframe />
        <FileNodes onHover={setHovered} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.6}
          rotateSpeed={0.7}
        />
      </Canvas>

      {/* HUD overlay */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="pixel text-[12px] text-[var(--good)]">
          LIVE · DRAG TO ROTATE
        </div>
      </div>
      <div className="absolute top-4 right-4 pointer-events-none pixel text-[11px] text-[var(--text-2)]">
        QYNTRA · MEMORY GLOBE
      </div>
      {hovered !== null && (
        <div className="absolute bottom-4 left-4 px-3 py-2 rounded border border-[var(--ember)]/40 bg-black/80 backdrop-blur pixel text-[12px] pointer-events-none">
          <div className="text-[var(--ember)]">FILE · HOVERED</div>
          <div className="text-white text-[16px]">{LABELED_NODES[hovered].label}</div>
        </div>
      )}
      <div className="absolute bottom-4 right-4 pixel text-[11px] text-[var(--muted)] pointer-events-none">
        {DOT_COUNT} memory points · 8 sources
      </div>
    </div>
  );
}
