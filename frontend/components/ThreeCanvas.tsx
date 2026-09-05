"use client";

import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, MeshDistortMaterial, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function AnimatedGlobe() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.35;
      meshRef.current.rotation.x += delta * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
      <Sphere
        ref={meshRef}
        args={[1.6, 64, 64]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.08 : 1}
      >
        <MeshDistortMaterial
          color={hovered ? "#017E84" : "#714B67"}
          attach="material"
          distort={0.35}
          speed={2.2}
          roughness={0.2}
          metalness={0.7}
        />
      </Sphere>
    </Float>
  );
}

export default function ThreeCanvas() {
  return (
    <div className="relative w-full h-[220px] rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-[#3b1f33] to-slate-900 shadow-elevated border border-purple-900/30">
      <div className="absolute top-4 left-5 z-10 pointer-events-none">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">Live HR Operations Mesh</span>
        </div>
        <h3 className="text-lg font-bold text-white mt-1">Interactive 3D Organization Sphere</h3>
        <p className="text-xs text-slate-300 max-w-sm">Drag to inspect active organizational presence and real-time biometric network nodes.</p>
      </div>

      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <pointLight position={[-10, -10, -5]} color="#017E84" intensity={2} />
        <AnimatedGlobe />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
      </Canvas>
    </div>
  );
}
