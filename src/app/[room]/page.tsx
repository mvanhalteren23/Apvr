import { GameClientApp } from '@/components/GameClientApp';

interface ShortRoomPageProps {
  params: {
    room: string;
  };
}

export default function ShortRoomPage({ params }: ShortRoomPageProps) {
  const rawSlug = decodeURIComponent(params.room || 'a1').trim();
  const normalized = rawSlug.toLowerCase();

  // /s -> Instant Solo vs. AI Planeswalker Bot
  if (normalized === 's' || normalized === 'solo' || normalized === 'ai') {
    return (
      <GameClientApp
        initialRoom="A1"
        initialMode="SOLO_AI"
        initialSeat="P1"
        autoLaunch={true}
      />
    );
  }

  // /a1-2 -> Join Room A1 as Player 2; /a1 -> Join Room A1 as Player 1
  const isPlayerTwo = normalized.endsWith('-2');
  const roomCode = (
    isPlayerTwo ? normalized.slice(0, -2) : normalized
  ).toUpperCase() || 'A1';

  return (
    <GameClientApp
      initialRoom={roomCode}
      initialMode="MULTIPLAYER"
      initialSeat={isPlayerTwo ? 'P2' : 'P1'}
      autoLaunch={true}
    />
  );
}
