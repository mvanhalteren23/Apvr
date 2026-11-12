'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { XR } from '@react-three/xr';
import * as THREE from 'three';
import { xrStore } from '@/lib/xrStore';
import { useGameStore } from '@/store/useGameStore';
import { useAIPlaneswalkerBot } from '@/systems/AIPlaneswalkerBot';
import { CombatChoreographer } from '@/systems/CombatChoreographer';
import { SpatialVoiceManager } from './SpatialVoiceManager';
import { PicoControllerRig } from './PicoControllerRig';
import { CardHandArc } from './CardHandArc';
import { BattlefieldGrid } from './BattlefieldGrid';
import { PhaseHUD } from './PhaseHUD';

// Defending Planeswalker Avatar Target Orbs at [0, 1.4, +/-3.2] with Floating 3D Life Counters
const PlaneswalkerTargetOrbs: React.FC = () => {
  const p1OrbRef = useRef<THREE.Mesh>(null);
  const p2OrbRef = useRef<THREE.Mesh>(null);

  const localSeat = useGameStore((s) => s.localSeat);
  const players = useGameStore((s) => s.players);
  const interactWithPlayerAvatar = useGameStore((s) => s.interactWithPlayerAvatar);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (p1OrbRef.current) {
      p1OrbRef.current.rotation.y = t * 1.2;
    }
    if (p2OrbRef.current) {
      p2OrbRef.current.rotation.y = -t * 1.2;
    }
  });

  return (
    <group name="planeswalker-target-orbs">
      {/* Player 1 Planeswalker Core Orb at [0, 1.4, 3.2] */}
      <group
        position={[0, 1.4, 3.2]}
        rotation={[0, localSeat === 'P1' ? 0 : Math.PI, 0]}
      >
        <mesh
          ref={p1OrbRef}
          userData={{
            interactableType: 'AVATAR',
            playerSeat: 'P1',
          }}
          onClick={(e) => {
            e.stopPropagation();
            interactWithPlayerAvatar('P1');
          }}
        >
          <octahedronGeometry args={[0.14, 0]} />
          <meshLambertMaterial
            color="#00f0ff"
            emissive="#083344"
            flatShading
          />
        </mesh>
        <Text
          position={[0, 0.22, 0]}
          fontSize={0.075}
          color="#00f0ff"
          anchorX="center"
          anchorY="middle"
        >
          {`P1 LIFE: ${players.P1.life} HP`}
        </Text>
      </group>

      {/* Player 2 / AI Bot Planeswalker Core Orb at [0, 1.4, -3.2] */}
      <group
        position={[0, 1.4, -3.2]}
        rotation={[0, localSeat === 'P1' ? 0 : Math.PI, 0]}
      >
        <mesh
          ref={p2OrbRef}
          userData={{
            interactableType: 'AVATAR',
            playerSeat: 'P2',
          }}
          onClick={(e) => {
            e.stopPropagation();
            interactWithPlayerAvatar('P2');
          }}
        >
          <octahedronGeometry args={[0.14, 0]} />
          <meshLambertMaterial
            color="#f43f5e"
            emissive="#4c0519"
            flatShading
          />
        </mesh>
        <Text
          position={[0, -0.22, 0]}
          fontSize={0.075}
          color="#fb7185"
          anchorX="center"
          anchorY="middle"
        >
          {`P2 LIFE: ${players.P2.life} HP`}
        </Text>
      </group>
    </group>
  );
};

const ArenaInterior: React.FC = () => {
  const interactableRootRef = useRef<THREE.Group>(null);

  // Activate the Single-Player AI Planeswalker Bot observer when gameMode === 'SOLO_AI'
  useAIPlaneswalkerBot();

  return (
    <>
      {/* 72 FPS Lightweight Lighting (Zero Real-Time Shadow Maps for Pico G2 Snapdragon 835) */}
      <ambientLight intensity={1.18} color="#e2e8f0" />
      <directionalLight position={[0, 6, 2]} intensity={0.95} color="#38bdf8" />
      <directionalLight position={[0, 4, -3]} intensity={0.68} color="#f5b041" />

      {/* Low-Poly Sanctum Sky Dome & Astral Horizon Ring */}
      <mesh>
        <sphereGeometry args={[18, 16, 12]} />
        <meshBasicMaterial color="#060913" side={THREE.BackSide} />
      </mesh>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.5, 11.5, 24]} />
        <meshBasicMaterial color="#0f172a" side={THREE.DoubleSide} />
      </mesh>

      {/* Main Obsidian Aether Battle Table */}
      <group position={[0, 0.4, 0]}>
        <mesh>
          <cylinderGeometry args={[2.55, 2.15, 0.78, 12]} />
          <meshLambertMaterial color="#0f172a" />
        </mesh>

        {/* Glowing Cyan Rim Border */}
        <mesh position={[0, 0.395, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.44, 2.54, 24]} />
          <meshBasicMaterial color="#00f0ff" side={THREE.DoubleSide} />
        </mesh>

        {/* Center Battlefield Divider Line */}
        <mesh position={[0, 0.398, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.4, 0.025]} />
          <meshBasicMaterial color="#f5b041" />
        </mesh>

        {/* Inner Arcane Summoning Circle */}
        <mesh position={[0, 0.397, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.92, 0.96, 24]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Interactive 3D Root Group Raycasted by Pico G2 3DoF Controller Laser & Desktop Mouse */}
      <group ref={interactableRootRef}>
        {/* Opponent Floating 3D Planeswalker Avatar + WebRTC / AI Synth PositionalAudio */}
        <SpatialVoiceManager />

        {/* Defending Planeswalker Avatar Orbs at [0, 1.4, +/-3.2] */}
        <PlaneswalkerTargetOrbs />

        {/* 4-Step Phase HUD, Mana Pool Crystal Counter & In-VR "Spawn AI Opponent" Button */}
        <PhaseHUD />

        {/* 6 Creature Slots + 6 Land Slots per Player + 3D Summoned Constructs */}
        <BattlefieldGrid />

        {/* Curved HUD Hand Tray at [0, 0.95, 2.7] & Bot Facedown Hand at [0, 1.3, -2.7] */}
        <CardHandArc />
      </group>

      {/* Phase 4 Sequential GSAP Combat Choreographer, QuadraticBezierLine Tethers & 12-Shard Death Shatters */}
      <CombatChoreographer />

      {/* Seated 3DoF Camera Rig + Pico G2 3DoF Controller Wand + Cyan Laser Raycaster */}
      <PicoControllerRig interactableRootRef={interactableRootRef} />
    </>
  );
};

export const ArenaScene: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-[#060913] overflow-hidden select-none">
      <Canvas
        shadows={false}
        dpr={[1, 1.25]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
        }}
        camera={{
          fov: 65,
          near: 0.1,
          far: 40,
          position: [0, 1.65, 3.8],
        }}
      >
        <XR store={xrStore}>
          <ArenaInterior />
        </XR>
      </Canvas>
    </div>
  );
};

export default ArenaScene;
