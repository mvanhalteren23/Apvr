'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { PHASE_LABELS, useGameStore } from '@/store/useGameStore';
import { PlayerSeat, TurnPhase } from '@/types/game';

const ORDERED_PHASES: TurnPhase[] = [
  'START_AND_MAIN_1',
  'DECLARE_ATTACKERS',
  'DECLARE_BLOCKERS',
  'COMBAT_RESOLUTION_AND_END',
];

export const PhaseHUD: React.FC = () => {
  const phaseCrystalRef = useRef<THREE.Mesh>(null);
  const manaCrimsonRef = useRef<THREE.Mesh>(null);
  const manaAetherRef = useRef<THREE.Mesh>(null);
  const manaObsidianRef = useRef<THREE.Mesh>(null);
  const spawnAiOrbRef = useRef<THREE.Mesh>(null);

  const localSeat = useGameStore((s) => s.localSeat);
  const gameMode = useGameStore((s) => s.gameMode);
  const turnNumber = useGameStore((s) => s.turnNumber);
  const activePlayer = useGameStore((s) => s.activePlayer);
  const priorityPlayer = useGameStore((s) => s.priorityPlayer);
  const phase = useGameStore((s) => s.phase);
  const players = useGameStore((s) => s.players);
  const combatLog = useGameStore((s) => s.combatLog);
  const winner = useGameStore((s) => s.winner);
  const hoveredObjectId = useGameStore((s) => s.hoveredObjectId);
  const remotePeerConnected = useGameStore((s) => s.remotePeerConnected);

  const setHoveredObjectId = useGameStore((s) => s.setHoveredObjectId);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const spawnAIOpponent = useGameStore((s) => s.spawnAIOpponent);
  const resetMatch = useGameStore((s) => s.resetMatch);

  const zSign = localSeat === 'P1' ? 1 : -1;
  const facingRotY = localSeat === 'P1' ? 0 : Math.PI;
  const opponentSeat: PlayerSeat = localSeat === 'P1' ? 'P2' : 'P1';
  const localPlayer = players[localSeat];
  const opponentPlayer = players[opponentSeat];

  const hasLocalPriority = priorityPlayer === localSeat;
  const isPhaseCrystalHovered = hoveredObjectId === 'phase-crystal-orb';
  const isSpawnAiHovered = hoveredObjectId === 'spawn-ai-opponent-btn';

  // Determine 3D button label based on the 4-Step Turn Structure
  let actionButtonText = 'ENTER ATTACK PHASE';
  if (winner) {
    actionButtonText = 'PLAY AGAIN (RESET)';
  } else if (!hasLocalPriority) {
    actionButtonText = players.P2.isBot
      ? 'AI PLANESWALKER THINKING...'
      : `WAITING FOR ${priorityPlayer}...`;
  } else if (phase === 'START_AND_MAIN_1') {
    actionButtonText = 'DECLARE ATTACKERS ->';
  } else if (phase === 'DECLARE_ATTACKERS') {
    actionButtonText = 'CONFIRM ATTACKERS [TRIGGER]';
  } else if (phase === 'DECLARE_BLOCKERS') {
    actionButtonText = 'CONFIRM BLOCKS [TRIGGER]';
  } else {
    actionButtonText = 'RESOLVE COMBAT & END';
  }

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (phaseCrystalRef.current) {
      phaseCrystalRef.current.rotation.y = t * 1.15;
      phaseCrystalRef.current.rotation.x = Math.sin(t * 2.0) * 0.22;
    }
    if (manaCrimsonRef.current) {
      manaCrimsonRef.current.rotation.y = t * 1.4;
    }
    if (manaAetherRef.current) {
      manaAetherRef.current.rotation.y = -t * 1.4;
    }
    if (manaObsidianRef.current) {
      manaObsidianRef.current.rotation.y = t * 1.1;
    }
    if (spawnAiOrbRef.current) {
      spawnAiOrbRef.current.rotation.y = t * 1.6;
      spawnAiOrbRef.current.position.y = 1.05 + Math.sin(t * 3.0) * 0.03;
    }
  });

  const showSpawnAIButton =
    gameMode === 'MULTIPLAYER' && !players.P2.isBot && !remotePeerConnected;

  return (
    <group name="phase-hud-3d">
      {/* 1. Floating 4-Step Turn & Telemetry Banner across the Sanctum */}
      <group
        position={[0, 2.28, -1.55 * zSign]}
        rotation={[0, facingRotY, 0]}
      >
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[3.35, 0.78]} />
          <meshBasicMaterial color="#090d16" transparent opacity={0.88} />
        </mesh>
        <mesh position={[0, 0, -0.025]}>
          <planeGeometry args={[3.4, 0.82]} />
          <meshBasicMaterial color={hasLocalPriority ? '#00f0ff' : '#f5b041'} />
        </mesh>

        {/* Top Header: Turn, Mode, Active & Priority Player */}
        <Text
          position={[0, 0.27, 0]}
          fontSize={0.082}
          color="#f5b041"
          anchorX="center"
          anchorY="middle"
        >
          {winner
            ? `VICTORY: ${winner} (${players[winner].displayName}) WINS!`
            : `TURN ${turnNumber} • ${
                gameMode === 'SOLO_AI' ? 'SOLO VS. AI BOT' : '1V1 MULTIPLAYER'
              } • ACTIVE: ${activePlayer} (PRIORITY: ${priorityPlayer})`}
        </Text>

        {/* 4-Step Phase Progress Pills */}
        {ORDERED_PHASES.map((p, idx) => {
          const isCurrent = phase === p;
          const xPos = (idx - 1.5) * 0.8;
          return (
            <group key={p} position={[xPos, 0.11, 0]}>
              <mesh>
                <planeGeometry args={[0.74, 0.12]} />
                <meshBasicMaterial
                  color={isCurrent ? '#00f0ff' : '#1e293b'}
                />
              </mesh>
              <Text
                position={[0, 0, 0.004]}
                fontSize={0.042}
                color={isCurrent ? '#090d16' : '#94a3b8'}
                anchorX="center"
                anchorY="middle"
              >
                {PHASE_LABELS[p]}
              </Text>
            </group>
          );
        })}

        {/* Player Life & Mana Summary Line */}
        <Text
          position={[0, -0.05, 0]}
          fontSize={0.072}
          color="#00f0ff"
          anchorX="center"
          anchorY="middle"
        >
          {`YOU (${localSeat}): ${localPlayer.life} HP | MANA: ${localPlayer.manaPool} (C:${localPlayer.manaColors.CRIMSON} A:${localPlayer.manaColors.AETHER} O:${localPlayer.manaColors.OBSIDIAN}) | OPPONENT (${opponentSeat}): ${opponentPlayer.life} HP`}
        </Text>

        {/* Latest Combat & Rules Log */}
        <Text
          position={[0, -0.22, 0]}
          fontSize={0.055}
          color="#e2e8f0"
          anchorX="center"
          anchorY="middle"
          maxWidth={3.15}
        >
          {combatLog[0] ?? 'Use Pico Trigger to Tap Lands, Play Cards, or Attack.'}
        </Text>
      </group>

      {/* 2. Interactive 3D Confirm Attackers / Confirm Blocks / Advance Phase Crystal */}
      <group
        position={[1.82 * zSign, 1.08, 0.72 * zSign]}
        rotation={[0, facingRotY, 0]}
      >
        <mesh
          ref={phaseCrystalRef}
          name="phase-crystal-orb"
          userData={{
            interactableType: 'PHASE_CRYSTAL',
            hoverId: 'phase-crystal-orb',
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (winner) {
              resetMatch();
            } else if (hasLocalPriority) {
              advancePhase(localSeat);
            }
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredObjectId('phase-crystal-orb');
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            if (hoveredObjectId === 'phase-crystal-orb') {
              setHoveredObjectId(null);
            }
          }}
        >
          <octahedronGeometry args={[0.17, 0]} />
          <meshLambertMaterial
            color={
              isPhaseCrystalHovered
                ? '#f5b041'
                : hasLocalPriority
                ? '#00f0ff'
                : '#475569'
            }
            emissive={
              isPhaseCrystalHovered
                ? '#78350f'
                : hasLocalPriority
                ? '#083344'
                : '#0f172a'
            }
            flatShading
          />
        </mesh>

        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 0.08, 8]} />
          <meshLambertMaterial color="#1e293b" />
        </mesh>

        <Text
          position={[0, 0.28, 0]}
          fontSize={0.058}
          color={hasLocalPriority ? '#f5b041' : '#94a3b8'}
          anchorX="center"
          anchorY="middle"
        >
          {actionButtonText}
        </Text>

        <Text
          position={[0, 0.2, 0]}
          fontSize={0.048}
          color="#00f0ff"
          anchorX="center"
          anchorY="middle"
        >
          {PHASE_LABELS[phase]}
        </Text>
      </group>

      {/* 3. Floating 3D Mana Pool Crystal Counter (Crimson, Aether, Obsidian) */}
      <group
        position={[-1.82 * zSign, 1.04, 0.72 * zSign]}
        rotation={[0, facingRotY, 0]}
      >
        <Text
          position={[0, 0.26, 0]}
          fontSize={0.056}
          color="#f8fafc"
          anchorX="center"
          anchorY="middle"
        >
          {`MANA POOL: ${localPlayer.manaPool}`}
        </Text>

        {/* Crimson Mana Crystal */}
        <group position={[-0.22, 0.06, 0]}>
          <mesh ref={manaCrimsonRef}>
            <octahedronGeometry args={[0.075, 0]} />
            <meshLambertMaterial
              color="#f43f5e"
              emissive="#881337"
              flatShading
            />
          </mesh>
          <Text
            position={[0, -0.13, 0]}
            fontSize={0.048}
            color="#fb7185"
            anchorX="center"
            anchorY="middle"
          >
            {`C:${localPlayer.manaColors.CRIMSON}`}
          </Text>
        </group>

        {/* Aether Mana Crystal */}
        <group position={[0, 0.06, 0]}>
          <mesh ref={manaAetherRef}>
            <octahedronGeometry args={[0.075, 0]} />
            <meshLambertMaterial
              color="#00f0ff"
              emissive="#083344"
              flatShading
            />
          </mesh>
          <Text
            position={[0, -0.13, 0]}
            fontSize={0.048}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
          >
            {`A:${localPlayer.manaColors.AETHER}`}
          </Text>
        </group>

        {/* Obsidian Mana Crystal */}
        <group position={[0.22, 0.06, 0]}>
          <mesh ref={manaObsidianRef}>
            <octahedronGeometry args={[0.075, 0]} />
            <meshLambertMaterial
              color="#a855f7"
              emissive="#3b0764"
              flatShading
            />
          </mesh>
          <Text
            position={[0, -0.13, 0]}
            fontSize={0.048}
            color="#c084fc"
            anchorX="center"
            anchorY="middle"
          >
            {`O:${localPlayer.manaColors.OBSIDIAN}`}
          </Text>
        </group>

        {/* Pedestal */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.28, 0.32, 0.06, 8]} />
          <meshLambertMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* 4. In-VR 3D "Spawn AI Opponent" Button on Table when waiting in Multiplayer mode */}
      {showSpawnAIButton && (
        <group
          position={[0, 0, 0]}
          rotation={[0, facingRotY, 0]}
        >
          <mesh
            ref={spawnAiOrbRef}
            position={[0, 1.05, 0]}
            name="spawn-ai-opponent-btn"
            userData={{
              interactableType: 'SPAWN_AI_BUTTON',
              hoverId: 'spawn-ai-opponent-btn',
            }}
            onClick={(e) => {
              e.stopPropagation();
              spawnAIOpponent();
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredObjectId('spawn-ai-opponent-btn');
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              if (hoveredObjectId === 'spawn-ai-opponent-btn') {
                setHoveredObjectId(null);
              }
            }}
          >
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshLambertMaterial
              color={isSpawnAiHovered ? '#10b981' : '#f5b041'}
              emissive={isSpawnAiHovered ? '#065f46' : '#78350f'}
              flatShading
            />
          </mesh>

          <Text
            position={[0, 1.36, 0]}
            fontSize={0.075}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
          >
            [ SPAWN AI OPPONENT ]
          </Text>

          <Text
            position={[0, 1.26, 0]}
            fontSize={0.05}
            color="#f8fafc"
            anchorX="center"
            anchorY="middle"
          >
            Point Laser &amp; Pull Trigger to Start Solo vs. AI Bot Immediately
          </Text>
        </group>
      )}
    </group>
  );
};
