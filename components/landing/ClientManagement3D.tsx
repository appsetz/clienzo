"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";

export default function ClientManagement3D() {
  const dashboardRef = useRef<Mesh>(null);
  const phoneRef = useRef<Mesh>(null);
  const clientIconRef = useRef<Mesh>(null);
  const coinRef = useRef<Mesh>(null);
  const documentRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (dashboardRef.current) {
      dashboardRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
      dashboardRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.05;
    }
    if (phoneRef.current) {
      phoneRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (clientIconRef.current) {
      clientIconRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
    if (coinRef.current) {
      coinRef.current.rotation.y += 0.01;
    }
    if (documentRef.current) {
      documentRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
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

      {/* Client Icon (Two People) */}
      <group ref={clientIconRef} position={[0, 0.3, 0.07]}>
        {/* Person 1 */}
        <mesh position={[-0.2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
          <meshStandardMaterial color="#9333ea" />
        </mesh>
        <mesh position={[-0.2, 0.25, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
        {/* Person 2 */}
        <mesh position={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
        <mesh position={[0.2, 0.25, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      </group>

      {/* Document with Target */}
      <mesh ref={documentRef} position={[-1.2, 0.8, 0.07]}>
        <boxGeometry args={[0.6, 0.8, 0.02]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-1.2, 0.8, 0.08]}>
        <circleGeometry args={[0.15, 32]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      {/* Phone */}
      <mesh ref={phoneRef} position={[1.8, -0.3, 0.4]} rotation={[0, -0.4, 0]}>
        <boxGeometry args={[0.5, 0.9, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[1.8, -0.3, 0.425]} rotation={[0, -0.4, 0]}>
        <planeGeometry args={[0.45, 0.85]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Phone Screen Content - Client List */}
      <mesh position={[1.8, -0.2, 0.426]} rotation={[0, -0.4, 0]}>
        <planeGeometry args={[0.4, 0.3]} />
        <meshStandardMaterial color="#f3f4f6" />
      </mesh>
      <mesh position={[1.8, -0.35, 0.426]} rotation={[0, -0.4, 0]}>
        <planeGeometry args={[0.4, 0.3]} />
        <meshStandardMaterial color="#f3f4f6" />
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
      <mesh position={[-1.5, -1.0, 0.5]}>
        <cylinderGeometry args={[0.29, 0.29, 0.15, 32]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

