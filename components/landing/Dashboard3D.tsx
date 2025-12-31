"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";

export default function Dashboard3D() {
  const dashboardRef = useRef<Mesh>(null);
  const coinRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (dashboardRef.current) {
      dashboardRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      dashboardRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
    if (coinRef.current) {
      coinRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group>
      {/* Main Dashboard */}
      <mesh ref={dashboardRef} position={[0, 0, 0]}>
        <boxGeometry args={[3, 2, 0.1]} />
        <meshStandardMaterial color="#ffffff" opacity={0.9} transparent />
      </mesh>

      {/* Dashboard Screen */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[2.8, 1.8]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>

      {/* Coins */}
      <mesh ref={coinRef} position={[-1.5, -1, 0.5]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Phone */}
      <mesh position={[1.5, -0.5, 0.3]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.4, 0.7, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Progress Circle */}
      <mesh position={[-1, 1, 0.5]}>
        <torusGeometry args={[0.3, 0.05, 16, 100]} />
        <meshStandardMaterial color="#9333ea" />
      </mesh>
    </group>
  );
}

