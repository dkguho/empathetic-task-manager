'use client';
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, OrbitControls, ContactShadows, RoundedBox } from '@react-three/drei';

function RealisticBonsaiTree({ growthStage, hydration, sunlight, mood, position = [-0.55, -0.75, -0.2] }) {
  const canopyRef = useRef();
  const isWilting = hydration < 45 || mood === 'wilting';

  // Foliage color shifts smoothly based on hydration & sunlight
  const leafColor = isWilting ? '#d97706' : sunlight > 75 ? '#10b981' : '#34d399';
  const blossomColor = isWilting ? '#fda4af' : '#f472b6';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (canopyRef.current) {
      // Gentle wind sway in the tree branches
      canopyRef.current.rotation.z = Math.sin(t * 1.2) * 0.04 - (isWilting ? 0.08 : 0);
      canopyRef.current.rotation.x = Math.cos(t * 0.9) * 0.03;
    }
  });

  const treeScale = 0.78 + growthStage * 0.09;

  // Sakura blossoms that appear as the user levels up the tree
  const blossomPositions = useMemo(() => {
    const count = growthStage * 5;
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 * 2.4;
      const radius = 0.45 + (i % 3) * 0.22;
      return [
        Math.cos(angle) * radius,
        1.25 + Math.sin(i * 1.7) * 0.35,
        Math.sin(angle) * radius
      ];
    });
  }, [growthStage]);

  return (
    <group position={position} scale={treeScale}>
      {/* Sculpted Organic Tree Trunk & Main Branches */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.22, 1.05, 16]} />
        <meshStandardMaterial color="#5c4033" roughness={0.85} />
      </mesh>
      <mesh position={[-0.22, 0.92, 0.05]} rotation={[0, 0, 0.55]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.65, 12]} />
        <meshStandardMaterial color="#5c4033" roughness={0.85} />
      </mesh>
      <mesh position={[0.24, 0.88, -0.05]} rotation={[0, 0, -0.5]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.6, 12]} />
        <meshStandardMaterial color="#5c4033" roughness={0.85} />
      </mesh>

      {/* Swaying Lush Foliage Canopy & Blossoms */}
      <group ref={canopyRef}>
        <mesh position={[0, 1.35, 0]} castShadow>
          <dodecahedronGeometry args={[0.62, 2]} />
          <meshStandardMaterial color={leafColor} roughness={0.55} />
        </mesh>
        <mesh position={[-0.42, 1.18, 0.12]} castShadow>
          <dodecahedronGeometry args={[0.45, 2]} />
          <meshStandardMaterial color={leafColor} roughness={0.6} />
        </mesh>
        <mesh position={[0.44, 1.15, -0.1]} castShadow>
          <dodecahedronGeometry args={[0.42, 2]} />
          <meshStandardMaterial color={leafColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.68, 0.08]} castShadow>
          <dodecahedronGeometry args={[0.38, 2]} />
          <meshStandardMaterial color="#6ee7b7" roughness={0.5} />
        </mesh>

        {/* Glowing Pink Sakura Blossoms */}
        {blossomPositions.map((pos, idx) => (
          <mesh key={idx} position={pos}>
            <octahedronGeometry args={[0.075, 0]} />
            <meshStandardMaterial
              color={blossomColor}
              emissive={blossomColor}
              emissiveIntensity={0.45}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function RealisticCatCompanion({ mood, catHunger, catAffection, lastActionEffect, position = [0.52, -0.68, 0.25] }) {
  const bodyRef = useRef();
  const headRef = useRef();
  const tailRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();

  const isSleeping = mood === 'sleeping';
  const isHungry = catHunger < 45;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Realistic breathing chest expansion
    if (bodyRef.current) {
      const breathe = 1 + Math.sin(t * (isSleeping ? 1.5 : 3.2)) * 0.035;
      bodyRef.current.scale.set(breathe, breathe, breathe);
      if (lastActionEffect === 'play' || lastActionEffect === 'feed' || lastActionEffect === 'celebrate') {
        bodyRef.current.position.y = Math.abs(Math.sin(t * 8)) * 0.18;
      } else {
        bodyRef.current.position.y = 0;
      }
    }

    // Curious head tilt & nod
    if (headRef.current) {
      headRef.current.rotation.z = isSleeping ? 0.25 : Math.sin(t * 1.4) * 0.08;
      headRef.current.rotation.y = isSleeping ? -0.2 : Math.cos(t * 0.9) * 0.14;
      headRef.current.position.y = isHungry ? 0.56 : 0.62;
    }

    // Expressive swaying cat tail
    if (tailRef.current) {
      const wagSpeed = catAffection > 75 ? 4.5 : 2.0;
      tailRef.current.rotation.z = Math.sin(t * wagSpeed) * 0.35;
    }

    // Periodic natural eye blinking
    if (leftEyeRef.current && rightEyeRef.current) {
      const isBlinking = isSleeping || Math.sin(t * 2.8) > 0.96;
      const eyeScaleY = isBlinking ? 0.12 : 1;
      leftEyeRef.current.scale.y = eyeScaleY;
      rightEyeRef.current.scale.y = eyeScaleY;
    }
  });

  return (
    <group position={position} rotation={[0, -0.35, 0]}>
      <group ref={bodyRef}>
        {/* Plump Cream/Calico Cat Body */}
        <mesh position={[0, 0.26, 0]} castShadow>
          <sphereGeometry args={[0.34, 32, 32]} />
          <meshStandardMaterial color="#fff7ed" roughness={0.45} />
        </mesh>

        {/* Warm Caramel Calico Patch on Back */}
        <mesh position={[0.12, 0.34, -0.1]} castShadow>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color="#fdba74" roughness={0.5} />
        </mesh>

        {/* Front Paws */}
        <mesh position={[-0.14, 0.04, 0.24]} castShadow>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        <mesh position={[0.14, 0.04, 0.24]} castShadow>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>

        {/* Cat Head Group */}
        <group ref={headRef} position={[0, 0.62, 0.12]}>
          <mesh castShadow>
            <sphereGeometry args={[0.29, 32, 32]} />
            <meshStandardMaterial color="#fff7ed" roughness={0.4} />
          </mesh>

          {/* Left & Right Pointed Cat Ears */}
          <mesh position={[-0.19, 0.24, 0]} rotation={[0, 0, 0.35]} castShadow>
            <coneGeometry args={[0.11, 0.24, 16]} />
            <meshStandardMaterial color="#fdba74" roughness={0.5} />
          </mesh>
          <mesh position={[-0.18, 0.23, 0.04]} rotation={[0, 0, 0.35]}>
            <coneGeometry args={[0.06, 0.15, 12]} />
            <meshStandardMaterial color="#fda4af" />
          </mesh>

          <mesh position={[0.19, 0.24, 0]} rotation={[0, 0, -0.35]} castShadow>
            <coneGeometry args={[0.11, 0.24, 16]} />
            <meshStandardMaterial color="#fdba74" roughness={0.5} />
          </mesh>
          <mesh position={[0.18, 0.23, 0.04]} rotation={[0, 0, -0.35]}>
            <coneGeometry args={[0.06, 0.15, 12]} />
            <meshStandardMaterial color="#fda4af" />
          </mesh>

          {/* Expressive Glossy Eyes */}
          <mesh ref={leftEyeRef} position={[-0.1, 0.03, 0.25]}>
            <sphereGeometry args={[0.048, 16, 16]} />
            <meshStandardMaterial color="#1e1e2d" roughness={0.1} metalness={0.2} />
          </mesh>
          <mesh ref={rightEyeRef} position={[0.1, 0.03, 0.25]}>
            <sphereGeometry args={[0.048, 16, 16]} />
            <meshStandardMaterial color="#1e1e2d" roughness={0.1} metalness={0.2} />
          </mesh>

          {/* Cute Pink Nose & Rosy Cheeks */}
          <mesh position={[0, -0.03, 0.28]}>
            <sphereGeometry args={[0.03, 12, 12]} />
            <meshStandardMaterial color="#fb7185" />
          </mesh>
          <mesh position={[-0.16, -0.04, 0.22]}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshStandardMaterial color="#fda4af" transparent opacity={0.65} />
          </mesh>
          <mesh position={[0.16, -0.04, 0.22]}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshStandardMaterial color="#fda4af" transparent opacity={0.65} />
          </mesh>
        </group>

        {/* Swaying Tail */}
        <group ref={tailRef} position={[0, 0.2, -0.3]}>
          <mesh position={[0, 0.18, -0.12]} rotation={[-0.6, 0, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.055, 0.48, 12]} />
            <meshStandardMaterial color="#fdba74" roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function SpiritCompanion3D({ companion }) {
  const {
    activeMode = 'both',
    mood = 'happy',
    growthStage = 2,
    treeHydration = 75,
    treeSunlight = 80,
    catHunger = 70,
    catAffection = 80,
    lastActionEffect = null
  } = companion || {};

  // Particle color changes depending on care action (Water = Blue, Sun = Gold, Love/Feed = Pink)
  const effectColor =
    lastActionEffect === 'water'
      ? '#38bdf8'
      : lastActionEffect === 'sun'
      ? '#fbbf24'
      : lastActionEffect === 'play' || lastActionEffect === 'feed'
      ? '#f472b6'
      : '#a7f3d0';

  return (
    <div className="relative w-full h-[270px] rounded-3xl overflow-hidden bg-gradient-to-b from-sky-100/70 via-purple-50/50 to-emerald-50/60 border border-white shadow-inner">
      <Canvas shadows camera={{ position: [0, 0.6, 3.8], fov: 42 }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 6, 4]} intensity={1.4} castShadow />
        <pointLight position={[-3, 2, 2]} intensity={0.8} color="#fbc2eb" />
        <pointLight position={[3, 3, -2]} intensity={0.9} color="#fde68a" />

        <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.18}>
          {/* Floating Mossy Sanctuary Island */}
          <group position={[0, -0.82, 0]}>
            <RoundedBox args={[2.5, 0.22, 1.8]} radius={0.1} smoothness={4} receiveShadow>
              <meshStandardMaterial color="#6ee7b7" roughness={0.75} />
            </RoundedBox>
            <RoundedBox position={[0, -0.16, 0]} args={[2.2, 0.18, 1.5]} radius={0.08} smoothness={4}>
              <meshStandardMaterial color="#8d6e63" roughness={0.9} />
            </RoundedBox>
          </group>

          {/* Render Tree, Cat, or Both */}
          {(activeMode === 'both' || activeMode === 'tree') && (
            <RealisticBonsaiTree
              growthStage={growthStage}
              hydration={treeHydration}
              sunlight={treeSunlight}
              mood={mood}
              position={activeMode === 'tree' ? [0, -0.75, 0] : [-0.48, -0.75, -0.1]}
            />
          )}

          {(activeMode === 'both' || activeMode === 'cat') && (
            <RealisticCatCompanion
              mood={mood}
              catHunger={catHunger}
              catAffection={catAffection}
              lastActionEffect={lastActionEffect}
              position={activeMode === 'cat' ? [0, -0.68, 0.1] : [0.52, -0.68, 0.2]}
            />
          )}
        </Float>

        <Sparkles
          count={lastActionEffect ? 65 : 28}
          scale={3.4}
          size={lastActionEffect ? 4 : 2.2}
          speed={lastActionEffect ? 1.8 : 0.5}
          color={effectColor}
        />

        <ContactShadows position={[0, -1.05, 0]} opacity={0.35} scale={5} blur={2.2} far={4} />
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2.1} minPolarAngle={Math.PI / 3} />
      </Canvas>

      {/* Top Overlay Badge */}
      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/85 backdrop-blur-md border border-white text-[11px] font-extrabold text-[#1e1e2d] shadow-sm flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Lv.{growthStage} Sanctuary</span>
      </div>

      <div className="absolute bottom-2 right-3 text-[10px] font-bold text-[#646477] bg-white/60 px-2.5 py-0.5 rounded-full">
        Drag to rotate 3D ↻
      </div>
    </div>
  );
}