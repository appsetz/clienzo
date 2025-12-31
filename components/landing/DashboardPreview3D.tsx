"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";

export default function DashboardPreview3D() {
  const dashboardRef = useRef<Mesh>(null);
  const phone1Ref = useRef<Mesh>(null);
  const phone2Ref = useRef<Mesh>(null);
  const coinRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (dashboardRef.current) {
      dashboardRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
      dashboardRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.05;
    }
    if (phone1Ref.current) {
      phone1Ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (phone2Ref.current) {
      phone2Ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.1;
    }
    if (coinRef.current) {
      coinRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group>
      {/* Main Dashboard */}
      <mesh ref={dashboardRef} position={[0, 0, 0]}>
        <boxGeometry args={[3.5, 2.5, 0.1]} />
        <meshStandardMaterial color="#ffffff" opacity={0.95} transparent />
      </mesh>

      {/* Dashboard Screen */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[3.3, 2.3]} />
        <meshStandardMaterial color="#f8f9fa" />
      </mesh>

      {/* Stats Cards on Dashboard */}
      <mesh position={[-1, 0.8, 0.07]}>
        <boxGeometry args={[0.8, 0.4, 0.02]} />
        <meshStandardMaterial color="#9333ea" />
      </mesh>
      <mesh position={[0, 0.8, 0.07]}>
        <boxGeometry args={[0.8, 0.4, 0.02]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[1, 0.8, 0.07]}>
        <boxGeometry args={[0.8, 0.4, 0.02]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>

      {/* Phone 1 (Left) */}
      <mesh ref={phone1Ref} position={[-1.8, -0.3, 0.4]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.5, 0.9, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-1.8, -0.3, 0.425]} rotation={[0, 0.4, 0]}>
        <planeGeometry args={[0.45, 0.85]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Phone 2 (Right) */}
      <mesh ref={phone2Ref} position={[1.8, -0.3, 0.4]} rotation={[0, -0.4, 0]}>
        <boxGeometry args={[0.5, 0.9, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[1.8, -0.3, 0.425]} rotation={[0, -0.4, 0]}>
        <planeGeometry args={[0.45, 0.85]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Coins Stack */}
      <mesh ref={coinRef} position={[-1.5, -1.2, 0.5]}>
        <cylinderGeometry args={[0.35, 0.35, 0.15, 32]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-1.5, -1.1, 0.5]}>
        <cylinderGeometry args={[0.32, 0.32, 0.15, 32]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Icons */}
      <mesh position={[1.2, 1, 0.5]}>
        <boxGeometry args={[0.15, 0.15, 0.02]} />
        <meshStandardMaterial color="#9333ea" />
      </mesh>
      <mesh position={[-1.2, 1, 0.5]}>
        <torusGeometry args={[0.1, 0.03, 16, 100]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
    </group>
  );
}

