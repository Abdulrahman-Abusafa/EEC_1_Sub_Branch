"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Html } from "@react-three/drei";
import { Color, Mesh } from "three";
import { Zap } from "lucide-react";
import * as THREE from "three";

function AnimatedSphere({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);

  // Smooth rotation logic
  useFrame((state) => {
    if (!meshRef.current || !glowRef.current) return;

    const time = state.clock.getElapsedTime();

    // Rotate towards mouse (interpolated for smoothness)
    // Target rotation based on mouse position
    const targetRotX = -mouseY * 0.5; // Up/down
    const targetRotY = mouseX * 0.5; // Left/right

    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotX, 0.1);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, 0.1);
    
    // Add subtle ambient breathing/floating
    meshRef.current.position.y = Math.sin(time * 0.5) * 0.1;

    // Glow mesh follows but slightly delayed or different scale
    glowRef.current.rotation.x = meshRef.current.rotation.x;
    glowRef.current.rotation.y = meshRef.current.rotation.y;
    glowRef.current.position.y = meshRef.current.position.y;
  });

  const materialColor = useMemo(() => new Color("#000000"), []);
  const emissiveColor = useMemo(() => new Color("#06b6d4"), []);

  return (
    <group>
        {/* Main Sphere (Metallic/Glassy) */}
        <Sphere ref={meshRef} args={[1.5, 64, 64]}>
            <meshPhysicalMaterial
                color={materialColor}
                roughness={0.2}
                metalness={0.8}
                clearcoat={1}
                clearcoatRoughness={0.1}
                emissive={emissiveColor}
                emissiveIntensity={0.2}
            />
             {/* HTML Overlay that sits ON the sphere surface - The "Eye" */}
             <Html 
                position={[0, 0, 1.6]} 
                transform 
                occlude
                style={{ 
                    width: '100px', 
                    height: '100px', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    pointerEvents: 'none'
                }}
            >
                <div className="w-24 h-24 flex items-center justify-center">
                    <Zap className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
                </div>
            </Html>
        </Sphere>

        {/* Outer Glow Halo (Billboarding or larger sphere with inverted normals or transparent) */}
         <Sphere ref={glowRef} args={[1.6, 64, 64]}>
             <meshBasicMaterial 
                color="#06b6d4" 
                transparent 
                opacity={0.1}
                side={THREE.BackSide} /* Correctly reference THREE constants */
             />
         </Sphere>
    </group>
  );
}

export function HeroSphere({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
        <AnimatedSphere mouseX={mouseX} mouseY={mouseY} />
      </Canvas>
    </div>
  );
}
