'use client';

import React, { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { CardInstance, PlayerSeat } from '@/types/game';
import { Card3D } from './Card3D';

export const CardHandArc: React.FC = () => {
  const cards = useGameStore((s) => s.cards);
  const localSeat = useGameStore((s) => s.localSeat);

  const opponentSeat: PlayerSeat = localSeat === 'P1' ? 'P2' : 'P1';

  // Local player's curved HUD Hand Tray centered at [0, 0.95, 2.7] (or [0, 0.95, -2.7] if seated at P2)
  const localHandLayout = useMemo(() => {
    const zSign = localSeat === 'P1' ? 1 : -1;
    const facingRotY = localSeat === 'P1' ? 0 : Math.PI;
    const handCards = cards.filter(
      (c) => c.owner === localSeat && c.zone === 'HAND'
    );

    const count = handCards.length;
    const arcRadius = 2.15;
    const angleStep = Math.min(0.16, 0.85 / Math.max(1, count));

    return handCards.map((card: CardInstance, idx: number) => {
      const offsetIdx = idx - (count - 1) / 2;
      const theta = offsetIdx * angleStep;

      const x = Math.sin(theta) * arcRadius * zSign;
      const y = 0.95 - (1 - Math.cos(theta)) * 0.45;
      const z = (2.7 - (1 - Math.cos(theta)) * 0.35) * zSign;

      // Tilted ergonomically toward the seated 3DoF camera rig at [0, 1.65, 3.8]
      const tiltX = localSeat === 'P1' ? -0.46 : 0.46;
      const fanZ = -theta * 0.65 * zSign;

      return {
        card,
        position: [x, y, z] as [number, number, number],
        rotation: [tiltX, facingRotY, fanZ] as [number, number, number],
      };
    });
  }, [cards, localSeat]);

  // Opponent / AI Bot's facedown 3D hand hovering across the table at [0, 1.3, -2.7]
  const opponentHandLayout = useMemo(() => {
    const zSign = opponentSeat === 'P1' ? 1 : -1;
    const facingRotY = opponentSeat === 'P1' ? 0 : Math.PI;
    const oppCards = cards.filter(
      (c) => c.owner === opponentSeat && c.zone === 'HAND'
    );

    const count = oppCards.length;
    return oppCards.map((card: CardInstance, idx: number) => {
      const offsetIdx = idx - (count - 1) / 2;
      const x = offsetIdx * 0.32 * zSign;
      const y = 1.3 - Math.abs(offsetIdx) * 0.015;
      const z = 2.7 * zSign;
      const fanZ = offsetIdx * 0.04 * zSign;

      return {
        card,
        position: [x, y, z] as [number, number, number],
        rotation: [0.15 * zSign, facingRotY, fanZ] as [number, number, number],
      };
    });
  }, [cards, opponentSeat]);

  return (
    <group name="card-hand-arcs">
      {/* Local Player Curved HUD Hand Tray: Hover scales 1.35x and elevates +0.15m Y */}
      {localHandLayout.map(({ card, position, rotation }) => (
        <Card3D
          key={card.id}
          card={card}
          targetPosition={position}
          targetRotation={rotation}
          localSeat={localSeat}
          faceDown={false}
          hoverScale={1.35}
          hoverLiftY={0.15}
        />
      ))}

      {/* Opponent / AI Bot Facedown Hand Arc at [0, 1.3, -2.7] */}
      {opponentHandLayout.map(({ card, position, rotation }) => (
        <Card3D
          key={card.id}
          card={card}
          targetPosition={position}
          targetRotation={rotation}
          localSeat={localSeat}
          faceDown={true}
          hoverScale={1.0}
          hoverLiftY={0}
        />
      ))}
    </group>
  );
};
