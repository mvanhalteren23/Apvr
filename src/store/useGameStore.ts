import { create } from 'zustand';
import {
  BotVoiceEvent,
  CardInstance,
  CardKeyword,
  CombatAnimationEvent,
  CreatureArchetype,
  GameMode,
  ManaColor,
  ManaPoolByColor,
  PlayerSeat,
  SynchronizedMatchState,
  TurnPhase,
} from '@/types/game';

interface CardTemplate {
  templateId: string;
  name: string;
  type: CardInstance['type'];
  archetype: CreatureArchetype;
  manaCost: number;
  manaColor: ManaColor;
  power: number;
  toughness: number;
  keywords: CardKeyword[];
  rulesText: string;
  accentHex: string;
}

export const CARD_TEMPLATES: Record<string, CardTemplate> = {
  LAND_CRIMSON: {
    templateId: 'land-crimson-caldera',
    name: 'Crimson Caldera',
    type: 'LAND',
    archetype: 'LAND',
    manaCost: 0,
    manaColor: 'CRIMSON',
    power: 0,
    toughness: 0,
    keywords: [],
    rulesText: 'Tap: Add +1 Crimson Mana.',
    accentHex: '#f43f5e',
  },
  LAND_AETHER: {
    templateId: 'land-aether-spire',
    name: 'Aether Spire',
    type: 'LAND',
    archetype: 'LAND',
    manaCost: 0,
    manaColor: 'AETHER',
    power: 0,
    toughness: 0,
    keywords: [],
    rulesText: 'Tap: Add +1 Aether Mana.',
    accentHex: '#00f0ff',
  },
  LAND_OBSIDIAN: {
    templateId: 'land-obsidian-crypt',
    name: 'Obsidian Crypt',
    type: 'LAND',
    archetype: 'LAND',
    manaCost: 0,
    manaColor: 'OBSIDIAN',
    power: 0,
    toughness: 0,
    keywords: [],
    rulesText: 'Tap: Add +1 Obsidian Mana.',
    accentHex: '#a855f7',
  },
  SPARK_STRIDER: {
    templateId: 'creature-spark-strider',
    name: 'Spark Goblin',
    type: 'CREATURE',
    archetype: 'GOBLIN',
    manaCost: 1,
    manaColor: 'CRIMSON',
    power: 2,
    toughness: 1,
    keywords: ['Haste'],
    rulesText: 'Haste. Strikes the turn it enters.',
    accentHex: '#f43f5e',
  },
  AETHER_SPRITE: {
    templateId: 'creature-aether-sprite',
    name: 'Zephyr Sprite',
    type: 'CREATURE',
    archetype: 'SPRITE',
    manaCost: 1,
    manaColor: 'AETHER',
    power: 1,
    toughness: 2,
    keywords: ['Flying'],
    rulesText: 'Flying. Soars above ground blockers.',
    accentHex: '#00f0ff',
  },
  VENOM_ELEMENTAL: {
    templateId: 'creature-venom-elemental',
    name: 'Blight Elemental',
    type: 'CREATURE',
    archetype: 'ELEMENTAL',
    manaCost: 2,
    manaColor: 'OBSIDIAN',
    power: 1,
    toughness: 3,
    keywords: ['Deathtouch'],
    rulesText: 'Deathtouch. Any damage destroys.',
    accentHex: '#a855f7',
  },
  SANCTUM_KNIGHT: {
    templateId: 'creature-sanctum-knight',
    name: 'Sanctum Knight',
    type: 'CREATURE',
    archetype: 'KNIGHT',
    manaCost: 2,
    manaColor: 'AETHER',
    power: 2,
    toughness: 2,
    keywords: ['Lifelink'],
    rulesText: 'Lifelink. Heals your Life on hit.',
    accentHex: '#38bdf8',
  },
  CHRONO_ELEMENTAL: {
    templateId: 'creature-chrono-elemental',
    name: 'Rift Elemental',
    type: 'CREATURE',
    archetype: 'ELEMENTAL',
    manaCost: 3,
    manaColor: 'AETHER',
    power: 3,
    toughness: 2,
    keywords: ['Flying', 'Haste'],
    rulesText: 'Flying, Haste. Temporal aerial striker.',
    accentHex: '#00f0ff',
  },
  // Phase 4 Articulated Hero #3: Obsidian Shade (Void Assassin - 3 Mana, 2/2, Deathtouch)
  OBSIDIAN_SHADE: {
    templateId: 'creature-obsidian-shade',
    name: 'Obsidian Shade',
    type: 'CREATURE',
    archetype: 'SHADE_HERO',
    manaCost: 3,
    manaColor: 'OBSIDIAN',
    power: 2,
    toughness: 2,
    keywords: ['Deathtouch'],
    rulesText: 'Hero • Deathtouch. Teleport shadow strike.',
    accentHex: '#c084fc',
  },
  // Phase 4 Articulated Hero #2: Aether Colossus (Golem - 4 Mana, 3/6, Lifelink)
  AETHER_COLOSSUS: {
    templateId: 'creature-aether-colossus',
    name: 'Aether Colossus',
    type: 'CREATURE',
    archetype: 'GOLEM_HERO',
    manaCost: 4,
    manaColor: 'AETHER',
    power: 3,
    toughness: 6,
    keywords: ['Lifelink'],
    rulesText: 'Hero • Lifelink. Runic shockwave slam.',
    accentHex: '#38bdf8',
  },
  // Phase 4 Articulated Hero #1: Crimson Hellkite (Dragon - 5 Mana, 5/4, Flying, Haste)
  CRIMSON_HELLKITE: {
    templateId: 'creature-crimson-hellkite',
    name: 'Crimson Hellkite',
    type: 'CREATURE',
    archetype: 'DRAGON_HERO',
    manaCost: 5,
    manaColor: 'CRIMSON',
    power: 5,
    toughness: 4,
    keywords: ['Flying', 'Haste'],
    rulesText: 'Hero • Flying, Haste. Dragonfire dive.',
    accentHex: '#fb7185',
  },
  AETHER_BOLT: {
    templateId: 'spell-aether-bolt',
    name: 'Aether Bolt',
    type: 'SPELL',
    archetype: 'SPELL',
    manaCost: 1,
    manaColor: 'CRIMSON',
    power: 3,
    toughness: 0,
    keywords: [],
    rulesText: 'Deal 3 damage to target creature or player.',
    accentHex: '#f43f5e',
  },
  VOID_SINGULARITY: {
    templateId: 'spell-void-singularity',
    name: 'Void Singularity',
    type: 'SPELL',
    archetype: 'SPELL',
    manaCost: 2,
    manaColor: 'OBSIDIAN',
    power: 4,
    toughness: 0,
    keywords: [],
    rulesText: 'Deal 4 damage to target creature or player.',
    accentHex: '#a855f7',
  },
};

function createSeededRandom(seedString: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedString.length; i++) {
    h ^= seedString.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function () {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build30CardDeckForSeat(seat: PlayerSeat, seedKey: string): CardInstance[] {
  // Pre-seed 2 lands on the battlefield per player (slots 0 & 1) + 5 opening hand cards
  // including Hero units so 3D summoning and Hero combat animations can be experienced immediately!
  const deckComposition: CardTemplate[] = [
    // Indices 0..1: Starting Lands on Battlefield (Slots 0 and 1)
    CARD_TEMPLATES.LAND_CRIMSON,
    CARD_TEMPLATES.LAND_AETHER,
    // Indices 2..6: Opening Hand of 5 Cards (1 Land, 1 Fast Creature, 2 Hero Units, 1 Spell)
    CARD_TEMPLATES.LAND_OBSIDIAN,
    CARD_TEMPLATES.SPARK_STRIDER,
    CARD_TEMPLATES.OBSIDIAN_SHADE,
    CARD_TEMPLATES.AETHER_COLOSSUS,
    CARD_TEMPLATES.AETHER_BOLT,
    // Indices 7..29: Remaining 23 cards in the 30-card deck
    CARD_TEMPLATES.CRIMSON_HELLKITE,
    CARD_TEMPLATES.LAND_CRIMSON,
    CARD_TEMPLATES.LAND_AETHER,
    CARD_TEMPLATES.LAND_OBSIDIAN,
    CARD_TEMPLATES.LAND_CRIMSON,
    CARD_TEMPLATES.LAND_AETHER,
    CARD_TEMPLATES.LAND_OBSIDIAN,
    CARD_TEMPLATES.LAND_CRIMSON,
    CARD_TEMPLATES.LAND_AETHER,
    CARD_TEMPLATES.LAND_OBSIDIAN,
    CARD_TEMPLATES.SPARK_STRIDER,
    CARD_TEMPLATES.AETHER_SPRITE,
    CARD_TEMPLATES.AETHER_SPRITE,
    CARD_TEMPLATES.VENOM_ELEMENTAL,
    CARD_TEMPLATES.VENOM_ELEMENTAL,
    CARD_TEMPLATES.SANCTUM_KNIGHT,
    CARD_TEMPLATES.SANCTUM_KNIGHT,
    CARD_TEMPLATES.CHRONO_ELEMENTAL,
    CARD_TEMPLATES.OBSIDIAN_SHADE,
    CARD_TEMPLATES.AETHER_COLOSSUS,
    CARD_TEMPLATES.CRIMSON_HELLKITE,
    CARD_TEMPLATES.AETHER_BOLT,
    CARD_TEMPLATES.VOID_SINGULARITY,
  ];

  const rand = createSeededRandom(`${seedKey}-${seat}`);
  const fixedSeven = deckComposition.slice(0, 7);
  const libraryPool = [...deckComposition.slice(7)];

  for (let i = libraryPool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const temp = libraryPool[i];
    libraryPool[i] = libraryPool[j];
    libraryPool[j] = temp;
  }

  // Keep Crimson Hellkite near the top of the library so it is drawn on Turn 1/2
  const hellkiteIdx = libraryPool.findIndex(
    (c) => c.templateId === 'creature-crimson-hellkite'
  );
  if (hellkiteIdx > 0) {
    const [hk] = libraryPool.splice(hellkiteIdx, 1);
    libraryPool.unshift(hk);
  }

  const orderedTemplates = [...fixedSeven, ...libraryPool];

  return orderedTemplates.map((tpl, idx) => {
    const isStartingLand = idx < 2;
    const isOpeningHand = idx >= 2 && idx < 7;
    return {
      ...tpl,
      id: `${seat}-card-${idx}-${tpl.templateId}`,
      owner: seat,
      damageMarked: 0,
      deathtouchDamageReceived: false,
      zone: isStartingLand
        ? 'BATTLEFIELD_LAND'
        : isOpeningHand
        ? 'HAND'
        : 'LIBRARY',
      slotIndex: isStartingLand ? idx : null,
      tapped: false,
      summoningSick: !tpl.keywords.includes('Haste'),
      isAttacking: false,
      blockingAttackerId: null,
      summonedAt: null,
    };
  });
}

export const PHASE_LABELS: Record<TurnPhase, string> = {
  START_AND_MAIN_1: '1. START & MAIN PHASE',
  DECLARE_ATTACKERS: '2. DECLARE ATTACKERS',
  DECLARE_BLOCKERS: '3. DECLARE BLOCKERS',
  COMBAT_RESOLUTION_AND_END: '4. COMBAT & END STEP',
};

function findFirstOpenSlot(
  cards: CardInstance[],
  owner: PlayerSeat,
  zone: 'BATTLEFIELD_LAND' | 'BATTLEFIELD_CREATURE'
): number | null {
  const occupied = new Set(
    cards
      .filter((c) => c.owner === owner && c.zone === zone && c.slotIndex !== null)
      .map((c) => c.slotIndex as number)
  );
  for (let slot = 0; slot < 6; slot++) {
    if (!occupied.has(slot)) return slot;
  }
  return null;
}

function deductManaFromColors(
  colors: ManaPoolByColor,
  cost: number,
  preferredColor: ManaColor
): ManaPoolByColor {
  const next: ManaPoolByColor = { ...colors };
  let remaining = cost;

  const usePreferred = Math.min(next[preferredColor], remaining);
  next[preferredColor] -= usePreferred;
  remaining -= usePreferred;

  const order: ManaColor[] = ['CRIMSON', 'AETHER', 'OBSIDIAN'];
  for (const col of order) {
    if (remaining <= 0) break;
    const take = Math.min(next[col], remaining);
    next[col] -= take;
    remaining -= take;
  }
  return next;
}

export function createInitialMatchState(
  roomCode = 'A1',
  gameMode: GameMode = 'SOLO_AI'
): SynchronizedMatchState {
  const isSolo = gameMode === 'SOLO_AI';
  const allCards = [
    ...build30CardDeckForSeat('P1', roomCode),
    ...build30CardDeckForSeat('P2', roomCode),
  ];

  return {
    matchId: roomCode,
    gameMode,
    turnNumber: 1,
    activePlayer: 'P1',
    priorityPlayer: 'P1',
    phase: 'START_AND_MAIN_1',
    isCombatChoreographyPlaying: false,
    combatSequenceId: 0,
    players: {
      P1: {
        seat: 'P1',
        playroomPlayerId: null,
        displayName: 'Planeswalker Alpha (You)',
        isBot: false,
        life: 20,
        manaPool: 0,
        manaColors: { CRIMSON: 0, AETHER: 0, OBSIDIAN: 0 },
        maxLandsPerTurn: 1,
        landsPlayedThisTurn: 0,
        isConnected: true,
        micActive: false,
      },
      P2: {
        seat: 'P2',
        playroomPlayerId: null,
        displayName: isSolo
          ? 'Archmage Aetherion (AI Bot)'
          : 'Planeswalker Omega (P2)',
        isBot: isSolo,
        life: 20,
        manaPool: 0,
        manaColors: { CRIMSON: 0, AETHER: 0, OBSIDIAN: 0 },
        maxLandsPerTurn: 1,
        landsPlayedThisTurn: 0,
        isConnected: isSolo,
        micActive: isSolo,
      },
    },
    cards: allCards,
    selectedCardId: null,
    selectedBlockerId: null,
    lastCombatEvent: null,
    botVoiceEvent: isSolo
      ? {
          id: 'bot-intro',
          text: 'I am Archmage Aetherion. Behold the 3D legions of the Aetherplane!',
          mood: 'TAUNT',
          timestamp: Date.now(),
        }
      : null,
    combatLog: [
      isSolo
        ? 'Solo vs. AI Planeswalker ready. 30-card decks shuffled (5 cards in hand, 2 starting lands).'
        : '1v1 Multiplayer Sanctum ready. 30-card decks shuffled (5 cards in hand, 2 starting lands).',
      'Play a 3rd Land, tap Lands for Mana, and summon Obsidian Shade or Spark Goblin in 3D!',
    ],
    winner: null,
  };
}

export interface GameStore extends SynchronizedMatchState {
  localSeat: PlayerSeat;
  roomCode: string;
  isLobbyEntered: boolean;
  isPlayroomConnected: boolean;
  hoveredObjectId: string | null;
  localMicStream: MediaStream | null;
  localMicLevel: number;
  remoteVoiceLevel: number;
  remotePeerConnected: boolean;

  setLocalSeat: (seat: PlayerSeat) => void;
  setRoomCode: (code: string) => void;
  setGameMode: (mode: GameMode) => void;
  spawnAIOpponent: () => void;
  setLobbyEntered: (entered: boolean) => void;
  setPlayroomConnected: (connected: boolean) => void;
  setHoveredObjectId: (id: string | null) => void;
  setLocalMicStream: (stream: MediaStream | null) => void;
  setLocalMicLevel: (level: number) => void;
  setRemoteVoiceLevel: (level: number) => void;
  setRemotePeerConnected: (connected: boolean) => void;

  applyRemoteState: (snapshot: SynchronizedMatchState) => void;
  getSerializableState: () => SynchronizedMatchState;
  registerSyncPublisher: (publisher: (state: SynchronizedMatchState) => void) => void;

  playLandToSlot: (
    cardId: string,
    slotIndex?: number,
    actorSeat?: PlayerSeat
  ) => boolean;
  tapLandForMana: (cardId: string, actorSeat?: PlayerSeat) => boolean;
  summonCreatureToSlot: (
    cardId: string,
    slotIndex?: number,
    actorSeat?: PlayerSeat
  ) => boolean;
  castSpellOnTarget: (
    spellCardId: string,
    targetType: 'PLAYER' | 'CREATURE',
    targetId: string,
    actorSeat?: PlayerSeat
  ) => boolean;
  toggleAttacker: (cardId: string, actorSeat?: PlayerSeat) => boolean;
  assignBlocker: (
    blockerCardId: string,
    attackerCardId: string | null,
    actorSeat?: PlayerSeat
  ) => boolean;
  interactWithSlot: (
    zone: 'BATTLEFIELD_LAND' | 'BATTLEFIELD_CREATURE',
    slotIndex: number,
    actorSeat?: PlayerSeat
  ) => void;
  interactWithCard: (cardId: string, actorSeat?: PlayerSeat) => void;
  interactWithPlayerAvatar: (targetSeat: PlayerSeat, actorSeat?: PlayerSeat) => void;
  advancePhase: (actorSeat?: PlayerSeat) => void;

  // Phase 4 Live Combat Choreographer Mutators
  applyLiveCreatureDamage: (
    cardId: string,
    damage: number,
    hasDeathtouch: boolean,
    lifelinkOwner?: PlayerSeat,
    lifelinkAmount?: number
  ) => void;
  applyLivePlayerDamage: (
    targetSeat: PlayerSeat,
    damage: number,
    lifelinkOwner?: PlayerSeat,
    lifelinkAmount?: number,
    attackerName?: string
  ) => void;
  shatterCreatureToGraveyard: (cardId: string) => void;
  completeCombatChoreographyAndPassTurn: () => void;

  drawCard: (seat: PlayerSeat) => void;
  emitBotVoice: (text: string, mood: BotVoiceEvent['mood']) => void;
  resetMatch: () => void;
}

let externalStatePublisher: ((state: SynchronizedMatchState) => void) | null = null;

function extractSerializable(state: GameStore): SynchronizedMatchState {
  return {
    matchId: state.matchId,
    gameMode: state.gameMode,
    turnNumber: state.turnNumber,
    activePlayer: state.activePlayer,
    priorityPlayer: state.priorityPlayer,
    phase: state.phase,
    isCombatChoreographyPlaying: state.isCombatChoreographyPlaying,
    combatSequenceId: state.combatSequenceId,
    players: state.players,
    cards: state.cards,
    selectedCardId: state.selectedCardId,
    selectedBlockerId: state.selectedBlockerId,
    lastCombatEvent: state.lastCombatEvent,
    botVoiceEvent: state.botVoiceEvent,
    combatLog: state.combatLog,
    winner: state.winner,
  };
}

function broadcastSnapshot(get: () => GameStore) {
  if (externalStatePublisher) {
    externalStatePublisher(extractSerializable(get()));
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialMatchState('A1', 'SOLO_AI'),
  localSeat: 'P1',
  roomCode: 'A1',
  isLobbyEntered: false,
  isPlayroomConnected: false,
  hoveredObjectId: null,
  localMicStream: null,
  localMicLevel: 0,
  remoteVoiceLevel: 0,
  remotePeerConnected: false,

  setLocalSeat: (seat) => set({ localSeat: seat }),
  setRoomCode: (code) => set({ roomCode: code, matchId: code }),

  setGameMode: (mode) => {
    const fresh = createInitialMatchState(get().roomCode, mode);
    set({
      ...fresh,
      localSeat: mode === 'SOLO_AI' ? 'P1' : get().localSeat,
    });
  },

  spawnAIOpponent: () => {
    set((state) => ({
      gameMode: 'SOLO_AI',
      localSeat: 'P1',
      players: {
        ...state.players,
        P2: {
          ...state.players.P2,
          displayName: 'Archmage Aetherion (AI Bot)',
          isBot: true,
          isConnected: true,
          micActive: true,
        },
      },
      botVoiceEvent: {
        id: `bot-spawn-${Date.now()}`,
        text: 'Archmage Aetherion materializes across the table. Face my 3D constructs!',
        mood: 'TAUNT',
        timestamp: Date.now(),
      },
      combatLog: [
        'AI Planeswalker Bot spawned in Seat P2! Solo match active.',
        ...state.combatLog.slice(0, 7),
      ],
    }));
    broadcastSnapshot(get);
  },

  setLobbyEntered: (entered) => set({ isLobbyEntered: entered }),
  setPlayroomConnected: (connected) => set({ isPlayroomConnected: connected }),
  setHoveredObjectId: (id) => set({ hoveredObjectId: id }),
  setLocalMicStream: (stream) => set({ localMicStream: stream }),
  setLocalMicLevel: (level) => set({ localMicLevel: level }),
  setRemoteVoiceLevel: (level) => set({ remoteVoiceLevel: level }),
  setRemotePeerConnected: (connected) =>
    set((state) => {
      const oppSeat: PlayerSeat = state.localSeat === 'P1' ? 'P2' : 'P1';
      return {
        remotePeerConnected: connected,
        players: {
          ...state.players,
          [oppSeat]: {
            ...state.players[oppSeat],
            isConnected: connected || state.players[oppSeat].isBot,
            micActive: connected || state.players[oppSeat].isBot,
          },
        },
      };
    }),

  applyRemoteState: (snapshot) => {
    set({
      matchId: snapshot.matchId,
      gameMode: snapshot.gameMode,
      turnNumber: snapshot.turnNumber,
      activePlayer: snapshot.activePlayer,
      priorityPlayer: snapshot.priorityPlayer,
      phase: snapshot.phase,
      isCombatChoreographyPlaying: snapshot.isCombatChoreographyPlaying,
      combatSequenceId: snapshot.combatSequenceId,
      players: snapshot.players,
      cards: snapshot.cards,
      selectedCardId: snapshot.selectedCardId,
      selectedBlockerId: snapshot.selectedBlockerId,
      lastCombatEvent: snapshot.lastCombatEvent,
      botVoiceEvent: snapshot.botVoiceEvent,
      combatLog: snapshot.combatLog,
      winner: snapshot.winner,
    });
  },

  getSerializableState: () => extractSerializable(get()),

  registerSyncPublisher: (publisher) => {
    externalStatePublisher = publisher;
  },

  emitBotVoice: (text, mood) => {
    set({
      botVoiceEvent: {
        id: `bot-voice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text,
        mood,
        timestamp: Date.now(),
      },
    });
  },

  drawCard: (seat) => {
    set((state) => {
      if (state.isCombatChoreographyPlaying) return state;
      const libIndex = state.cards.findIndex(
        (c) => c.owner === seat && c.zone === 'LIBRARY'
      );
      if (libIndex === -1) return state;

      const updatedCards = [...state.cards];
      const drawn = {
        ...updatedCards[libIndex],
        zone: 'HAND' as const,
        slotIndex: null,
      };
      updatedCards[libIndex] = drawn;

      return {
        cards: updatedCards,
        combatLog: [
          `${seat} drew a card (${seat === state.localSeat ? drawn.name : 'Hidden Card'}).`,
          ...state.combatLog.slice(0, 7),
        ],
      };
    });
    broadcastSnapshot(get);
  },

  playLandToSlot: (cardId, requestedSlotIndex, actorSeat) => {
    const state = get();
    if (state.winner || state.isCombatChoreographyPlaying) return false;
    const seat = actorSeat ?? state.localSeat;

    if (state.activePlayer !== seat || state.phase !== 'START_AND_MAIN_1') {
      return false;
    }

    const card = state.cards.find((c) => c.id === cardId);
    if (!card || card.owner !== seat || card.zone !== 'HAND' || card.type !== 'LAND') {
      return false;
    }

    const player = state.players[seat];
    if (player.landsPlayedThisTurn >= player.maxLandsPerTurn) {
      set({
        combatLog: [
          `${seat}: Maximum 1 Land per turn already played.`,
          ...state.combatLog.slice(0, 7),
        ],
      });
      return false;
    }

    const targetSlot =
      requestedSlotIndex !== undefined
        ? requestedSlotIndex
        : findFirstOpenSlot(state.cards, seat, 'BATTLEFIELD_LAND');

    if (targetSlot === null || targetSlot < 0 || targetSlot >= 6) {
      return false;
    }

    const slotOccupied = state.cards.some(
      (c) =>
        c.owner === seat &&
        c.zone === 'BATTLEFIELD_LAND' &&
        c.slotIndex === targetSlot
    );
    const finalSlot = slotOccupied
      ? findFirstOpenSlot(state.cards, seat, 'BATTLEFIELD_LAND')
      : targetSlot;

    if (finalSlot === null) return false;

    const nowTs = Date.now();
    const updatedCards = state.cards.map((c) =>
      c.id === card.id
        ? {
            ...c,
            zone: 'BATTLEFIELD_LAND' as const,
            slotIndex: finalSlot,
            tapped: false,
            summonedAt: nowTs,
          }
        : c
    );

    set({
      cards: updatedCards,
      selectedCardId: null,
      players: {
        ...state.players,
        [seat]: {
          ...player,
          landsPlayedThisTurn: player.landsPlayedThisTurn + 1,
        },
      },
      combatLog: [
        `${seat} materialized Land ${card.name} in Slot #${finalSlot + 1}.`,
        ...state.combatLog.slice(0, 7),
      ],
    });
    broadcastSnapshot(get);
    return true;
  },

  tapLandForMana: (cardId, actorSeat) => {
    const state = get();
    if (state.winner || state.isCombatChoreographyPlaying) return false;
    const seat = actorSeat ?? state.localSeat;

    const card = state.cards.find((c) => c.id === cardId);
    if (
      !card ||
      card.owner !== seat ||
      card.zone !== 'BATTLEFIELD_LAND' ||
      card.tapped
    ) {
      return false;
    }

    const player = state.players[seat];
    const nextManaColors: ManaPoolByColor = {
      ...player.manaColors,
      [card.manaColor]: player.manaColors[card.manaColor] + 1,
    };
    const nextTotalMana = player.manaPool + 1;

    const updatedCards = state.cards.map((c) =>
      c.id === card.id ? { ...c, tapped: true } : c
    );

    set({
      cards: updatedCards,
      players: {
        ...state.players,
        [seat]: {
          ...player,
          manaPool: nextTotalMana,
          manaColors: nextManaColors,
        },
      },
      combatLog: [
        `${seat} tapped ${card.name} (+1 ${card.manaColor} Mana • Pool: ${nextTotalMana}).`,
        ...state.combatLog.slice(0, 7),
      ],
    });
    broadcastSnapshot(get);
    return true;
  },

  summonCreatureToSlot: (cardId, requestedSlotIndex, actorSeat) => {
    const state = get();
    if (state.winner || state.isCombatChoreographyPlaying) return false;
    const seat = actorSeat ?? state.localSeat;

    if (state.activePlayer !== seat || state.phase !== 'START_AND_MAIN_1') {
      return false;
    }

    const card = state.cards.find((c) => c.id === cardId);
    if (
      !card ||
      card.owner !== seat ||
      card.zone !== 'HAND' ||
      card.type !== 'CREATURE'
    ) {
      return false;
    }

    const player = state.players[seat];
    if (player.manaPool < card.manaCost) {
      set({
        combatLog: [
          `Insufficient Mana for ${card.name} (Cost: ${card.manaCost}, Pool: ${player.manaPool}). Tap Lands first!`,
          ...state.combatLog.slice(0, 7),
        ],
      });
      return false;
    }

    const openSlot =
      requestedSlotIndex !== undefined
        ? requestedSlotIndex
        : findFirstOpenSlot(state.cards, seat, 'BATTLEFIELD_CREATURE');

    if (openSlot === null || openSlot < 0 || openSlot >= 6) return false;

    const isOccupied = state.cards.some(
      (c) =>
        c.owner === seat &&
        c.zone === 'BATTLEFIELD_CREATURE' &&
        c.slotIndex === openSlot
    );
    const finalSlot = isOccupied
      ? findFirstOpenSlot(state.cards, seat, 'BATTLEFIELD_CREATURE')
      : openSlot;

    if (finalSlot === null) return false;

    const hasHaste = card.keywords.includes('Haste');
    const nowTs = Date.now();
    const updatedCards = state.cards.map((c) =>
      c.id === card.id
        ? {
            ...c,
            zone: 'BATTLEFIELD_CREATURE' as const,
            slotIndex: finalSlot,
            tapped: false,
            summoningSick: !hasHaste,
            damageMarked: 0,
            deathtouchDamageReceived: false,
            summonedAt: nowTs,
          }
        : c
    );

    const nextColors = deductManaFromColors(
      player.manaColors,
      card.manaCost,
      card.manaColor
    );

    const isBotSummon = seat === 'P2' && player.isBot;

    set({
      cards: updatedCards,
      selectedCardId: null,
      players: {
        ...state.players,
        [seat]: {
          ...player,
          manaPool: player.manaPool - card.manaCost,
          manaColors: nextColors,
        },
      },
      botVoiceEvent: isBotSummon
        ? {
            id: `bot-summon-${nowTs}`,
            text: `Arise from the runic portal, ${card.name}!`,
            mood: 'SUMMON',
            timestamp: nowTs,
          }
        : state.botVoiceEvent,
      combatLog: [
        `${seat} summoned 3D construct ${card.name} (${card.power}/${card.toughness}${
          card.keywords.length ? ` • ${card.keywords.join(', ')}` : ''
        }) in Slot #${finalSlot + 1}!`,
        ...state.combatLog.slice(0, 7),
      ],
    });
    broadcastSnapshot(get);
    return true;
  },

  castSpellOnTarget: (spellCardId, targetType, targetId, actorSeat) => {
    const state = get();
    if (state.winner || state.isCombatChoreographyPlaying) return false;
    const seat = actorSeat ?? state.localSeat;

    if (state.activePlayer !== seat || state.phase !== 'START_AND_MAIN_1') {
      return false;
    }

    const spell = state.cards.find((c) => c.id === spellCardId);
    if (
      !spell ||
      spell.owner !== seat ||
      spell.zone !== 'HAND' ||
      spell.type !== 'SPELL'
    ) {
      return false;
    }

    const player = state.players[seat];
    if (player.manaPool < spell.manaCost) {
      set({
        combatLog: [
          `Insufficient Mana for ${spell.name} (Cost: ${spell.manaCost}, Pool: ${player.manaPool}).`,
          ...state.combatLog.slice(0, 7),
        ],
      });
      return false;
    }

    const dmg = spell.power || 3;
    const nextColors = deductManaFromColors(
      player.manaColors,
      spell.manaCost,
      spell.manaColor
    );

    if (targetType === 'CREATURE') {
      const targetCard = state.cards.find((c) => c.id === targetId);
      if (!targetCard || targetCard.zone !== 'BATTLEFIELD_CREATURE') {
        return false;
      }

      const newDamage = targetCard.damageMarked + dmg;
      const destroyed = newDamage >= targetCard.toughness;

      const updatedCards = state.cards.map((c) => {
        if (c.id === spell.id) {
          return { ...c, zone: 'GRAVEYARD' as const, slotIndex: null };
        }
        if (c.id === targetCard.id) {
          return {
            ...c,
            damageMarked: newDamage,
            zone: destroyed ? ('GRAVEYARD' as const) : c.zone,
            slotIndex: destroyed ? null : c.slotIndex,
          };
        }
        return c;
      });

      const evt: CombatAnimationEvent = {
        id: `spell-evt-${Date.now()}`,
        attackerId: spell.id,
        targetType: 'CREATURE',
        targetId: targetCard.id,
        damage: dmg,
        timestamp: Date.now(),
      };

      set({
        cards: updatedCards,
        selectedCardId: null,
        lastCombatEvent: evt,
        botVoiceEvent:
          seat === 'P2' && player.isBot
            ? {
                id: `bot-spell-${Date.now()}`,
                text: `${spell.name} shatters your ${targetCard.name}!`,
                mood: 'ATTACK',
                timestamp: Date.now(),
              }
            : state.botVoiceEvent,
        players: {
          ...state.players,
          [seat]: {
            ...player,
            manaPool: player.manaPool - spell.manaCost,
            manaColors: nextColors,
          },
        },
        combatLog: [
          `${seat} cast ${spell.name} on ${targetCard.name} for ${dmg} damage${
            destroyed ? ' (Shattered to Graveyard!)' : ''
          }!`,
          ...state.combatLog.slice(0, 7),
        ],
      });
      broadcastSnapshot(get);
      return true;
    }

    const targetSeat = targetId as PlayerSeat;
    const targetPlayer = state.players[targetSeat];
    if (!targetPlayer) return false;

    const nextLife = Math.max(0, targetPlayer.life - dmg);
    const winner: PlayerSeat | null = nextLife <= 0 ? seat : null;

    const updatedCards = state.cards.map((c) =>
      c.id === spell.id ? { ...c, zone: 'GRAVEYARD' as const, slotIndex: null } : c
    );

    const evt: CombatAnimationEvent = {
      id: `spell-evt-${Date.now()}`,
      attackerId: spell.id,
      targetType: 'PLAYER',
      targetId: targetSeat,
      damage: dmg,
      timestamp: Date.now(),
    };

    set({
      cards: updatedCards,
      selectedCardId: null,
      lastCombatEvent: evt,
      winner,
      botVoiceEvent:
        seat === 'P2' && player.isBot
          ? {
              id: `bot-spell-face-${Date.now()}`,
              text: `Direct hit! ${spell.name} strikes you for ${dmg} damage!`,
              mood: 'ATTACK',
              timestamp: Date.now(),
            }
          : targetSeat === 'P2' && targetPlayer.isBot
          ? {
              id: `bot-hit-${Date.now()}`,
              text: `Argh! Your ${spell.name} breached my wards!`,
              mood: 'DAMAGE',
              timestamp: Date.now(),
            }
          : state.botVoiceEvent,
      players: {
        ...state.players,
        [seat]: {
          ...player,
          manaPool: player.manaPool - spell.manaCost,
          manaColors: nextColors,
        },
        [targetSeat]: {
          ...targetPlayer,
          life: nextLife,
        },
      },
      combatLog: [
        `${seat} cast ${spell.name} on ${targetSeat} for ${dmg} damage! (${targetSeat} Life: ${nextLife})`,
        ...state.combatLog.slice(0, 7),
      ],
    });
    broadcastSnapshot(get);
    return true;
  },

  toggleAttacker: (cardId, actorSeat) => {
    const state = get();
    if (state.winner || state.isCombatChoreographyPlaying) return false;
    const seat = actorSeat ?? state.localSeat;

    if (state.activePlayer !== seat || state.phase !== 'DECLARE_ATTACKERS') {
      return false;
    }

    const card = state.cards.find((c) => c.id === cardId);
    if (
      !card ||
      card.owner !== seat ||
      card.zone !== 'BATTLEFIELD_CREATURE'
    ) {
      return false;
    }

    const hasHaste = card.keywords.includes('Haste');
    if (card.summoningSick && !hasHaste) {
      set({
        combatLog: [
          `${card.name} has Summoning Sickness (no Haste) and cannot attack this turn.`,
          ...state.combatLog.slice(0, 7),
        ],
      });
      return false;
    }

    if (card.tapped && !card.isAttacking) {
      return false;
    }

    const nextAttacking = !card.isAttacking;
    const updatedCards = state.cards.map((c) =>
      c.id === card.id ? { ...c, isAttacking: nextAttacking } : c
    );

    set({
      cards: updatedCards,
      combatLog: [
        nextAttacking
          ? `${seat} marked ${card.name} (${card.power}/${card.toughness}) as [ATTACKING]!`
          : `${card.name} withdrawn from attack formation.`,
        ...state.combatLog.slice(0, 7),
      ],
    });
    broadcastSnapshot(get);
    return true;
  },

  assignBlocker: (blockerCardId, attackerCardId, actorSeat) => {
    const state = get();
    if (state.winner || state.isCombatChoreographyPlaying) return false;
    const defenderSeat: PlayerSeat = state.activePlayer === 'P1' ? 'P2' : 'P1';
    const seat = actorSeat ?? state.localSeat;

    if (state.phase !== 'DECLARE_BLOCKERS' || seat !== defenderSeat) {
      return false;
    }

    const blocker = state.cards.find((c) => c.id === blockerCardId);
    if (
      !blocker ||
      blocker.owner !== defenderSeat ||
      blocker.zone !== 'BATTLEFIELD_CREATURE' ||
      blocker.tapped
    ) {
      return false;
    }

    if (attackerCardId === null) {
      const updated = state.cards.map((c) =>
        c.id === blocker.id ? { ...c, blockingAttackerId: null } : c
      );
      set({
        cards: updated,
        selectedBlockerId: null,
        combatLog: [
          `${blocker.name} unassigned from blocking.`,
          ...state.combatLog.slice(0, 7),
        ],
      });
      broadcastSnapshot(get);
      return true;
    }

    const attacker = state.cards.find((c) => c.id === attackerCardId);
    if (
      !attacker ||
      attacker.zone !== 'BATTLEFIELD_CREATURE' ||
      !attacker.isAttacking
    ) {
      return false;
    }

    if (
      attacker.keywords.includes('Flying') &&
      !blocker.keywords.includes('Flying')
    ) {
      set({
        combatLog: [
          `Illegal Block: ${attacker.name} has Flying and can only be blocked by creatures with Flying!`,
          ...state.combatLog.slice(0, 7),
        ],
      });
      return false;
    }

    const updatedCards = state.cards.map((c) =>
      c.id === blocker.id ? { ...c, blockingAttackerId: attacker.id } : c
    );

    set({
      cards: updatedCards,
      selectedBlockerId: null,
      botVoiceEvent:
        defenderSeat === 'P2' && state.players.P2.isBot
          ? {
              id: `bot-block-${Date.now()}`,
              text: `${blocker.name} intercepts your ${attacker.name}!`,
              mood: 'BLOCK',
              timestamp: Date.now(),
            }
          : state.botVoiceEvent,
      combatLog: [
        `${defenderSeat} assigned ${blocker.name} (${blocker.power}/${blocker.toughness}) to block ${attacker.name} (${attacker.power}/${attacker.toughness})!`,
        ...state.combatLog.slice(0, 7),
      ],
    });
    broadcastSnapshot(get);
    return true;
  },

  interactWithSlot: (zone, slotIndex, actorSeat) => {
    const state = get();
    if (state.isCombatChoreographyPlaying) return;
    const seat = actorSeat ?? state.localSeat;
    if (!state.selectedCardId) return;

    const selected = state.cards.find((c) => c.id === state.selectedCardId);
    if (!selected || selected.owner !== seat || selected.zone !== 'HAND') return;

    if (zone === 'BATTLEFIELD_LAND' && selected.type === 'LAND') {
      get().playLandToSlot(selected.id, slotIndex, seat);
    } else if (zone === 'BATTLEFIELD_CREATURE' && selected.type === 'CREATURE') {
      get().summonCreatureToSlot(selected.id, slotIndex, seat);
    }
  },

  interactWithCard: (cardId, actorSeat) => {
    const state = get();
    if (state.winner || state.isCombatChoreographyPlaying) return;
    const seat = actorSeat ?? state.localSeat;
    const opponentSeat: PlayerSeat = seat === 'P1' ? 'P2' : 'P1';

    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;

    if (state.phase === 'DECLARE_BLOCKERS') {
      const defenderSeat: PlayerSeat = state.activePlayer === 'P1' ? 'P2' : 'P1';
      if (seat !== defenderSeat) return;

      if (card.owner === defenderSeat && card.zone === 'BATTLEFIELD_CREATURE') {
        if (card.tapped) {
          set({
            combatLog: [
              `Tapped creature ${card.name} cannot block.`,
              ...state.combatLog.slice(0, 7),
            ],
          });
          return;
        }
        if (card.blockingAttackerId) {
          get().assignBlocker(card.id, null, seat);
          return;
        }
        set({
          selectedBlockerId:
            state.selectedBlockerId === card.id ? null : card.id,
          combatLog: [
            `Blocker ${card.name} selected. Click an incoming [ATTACKING] creature to connect a 3D Block Tether!`,
            ...state.combatLog.slice(0, 7),
          ],
        });
        return;
      }

      if (
        card.owner !== defenderSeat &&
        card.zone === 'BATTLEFIELD_CREATURE' &&
        card.isAttacking &&
        state.selectedBlockerId
      ) {
        get().assignBlocker(state.selectedBlockerId, card.id, seat);
        return;
      }
      return;
    }

    if (state.phase === 'DECLARE_ATTACKERS') {
      if (card.owner === seat && card.zone === 'BATTLEFIELD_CREATURE') {
        get().toggleAttacker(card.id, seat);
      }
      return;
    }

    if (state.phase === 'START_AND_MAIN_1') {
      if (
        state.selectedCardId &&
        card.owner !== seat &&
        card.zone === 'BATTLEFIELD_CREATURE'
      ) {
        const selectedCard = state.cards.find(
          (c) => c.id === state.selectedCardId
        );
        if (selectedCard && selectedCard.type === 'SPELL') {
          get().castSpellOnTarget(selectedCard.id, 'CREATURE', card.id, seat);
          return;
        }
      }

      if (card.owner !== seat) {
        set({
          combatLog: [
            `Inspecting ${card.name} (${card.power}/${card.toughness}${
              card.keywords.length ? ` • ${card.keywords.join(', ')}` : ''
            }).`,
            ...state.combatLog.slice(0, 7),
          ],
        });
        return;
      }

      if (card.zone === 'BATTLEFIELD_LAND') {
        get().tapLandForMana(card.id, seat);
        return;
      }

      if (card.zone === 'HAND') {
        if (card.type === 'LAND') {
          const played = get().playLandToSlot(card.id, undefined, seat);
          if (!played) {
            set({ selectedCardId: card.id });
          }
          return;
        }

        if (card.type === 'CREATURE') {
          const player = state.players[seat];
          if (player.manaPool >= card.manaCost) {
            if (state.selectedCardId === card.id) {
              get().summonCreatureToSlot(card.id, undefined, seat);
            } else {
              set({
                selectedCardId: card.id,
                combatLog: [
                  `Selected ${card.name}. Click a highlighted green Creature Slot (or click card again) to summon its 3D model!`,
                  ...state.combatLog.slice(0, 7),
                ],
              });
            }
          } else {
            set({
              selectedCardId: card.id,
              combatLog: [
                `${card.name} costs ${card.manaCost} Mana (Pool: ${player.manaPool}). Tap Lands first!`,
                ...state.combatLog.slice(0, 7),
              ],
            });
          }
          return;
        }

        if (card.type === 'SPELL') {
          const player = state.players[seat];
          if (player.manaPool < card.manaCost) {
            set({
              combatLog: [
                `${card.name} requires ${card.manaCost} Mana (Pool: ${player.manaPool}). Tap Lands first!`,
                ...state.combatLog.slice(0, 7),
              ],
            });
            return;
          }
          if (state.selectedCardId === card.id) {
            get().castSpellOnTarget(card.id, 'PLAYER', opponentSeat, seat);
            return;
          }
          set({
            selectedCardId: card.id,
            combatLog: [
              `Targeting ${card.name}: Click an enemy Creature, Opponent Avatar, or click ${card.name} again to blast Opponent!`,
              ...state.combatLog.slice(0, 7),
            ],
          });
        }
      }
    }
  },

  interactWithPlayerAvatar: (targetSeat, actorSeat) => {
    const state = get();
    if (state.winner || state.isCombatChoreographyPlaying) return;
    const seat = actorSeat ?? state.localSeat;
    if (!state.selectedCardId) return;

    const selected = state.cards.find((c) => c.id === state.selectedCardId);
    if (selected && selected.owner === seat && selected.type === 'SPELL') {
      get().castSpellOnTarget(selected.id, 'PLAYER', targetSeat, seat);
    }
  },

  applyLiveCreatureDamage: (
    cardId,
    damage,
    hasDeathtouch,
    lifelinkOwner,
    lifelinkAmount = 0
  ) => {
    set((state) => {
      const updatedCards = state.cards.map((c) => {
        if (c.id !== cardId) return c;
        return {
          ...c,
          damageMarked: c.damageMarked + damage,
          deathtouchDamageReceived:
            c.deathtouchDamageReceived || (hasDeathtouch && damage > 0),
        };
      });

      const updatedPlayers = { ...state.players };
      if (lifelinkOwner && lifelinkAmount > 0) {
        updatedPlayers[lifelinkOwner] = {
          ...updatedPlayers[lifelinkOwner],
          life: updatedPlayers[lifelinkOwner].life + lifelinkAmount,
        };
      }

      return {
        cards: updatedCards,
        players: updatedPlayers,
      };
    });
    broadcastSnapshot(get);
  },

  applyLivePlayerDamage: (
    targetSeat,
    damage,
    lifelinkOwner,
    lifelinkAmount = 0,
    attackerName = 'Attacker'
  ) => {
    set((state) => {
      const targetPlayer = state.players[targetSeat];
      const nextTargetLife = Math.max(0, targetPlayer.life - damage);
      const updatedPlayers = {
        ...state.players,
        [targetSeat]: {
          ...targetPlayer,
          life: nextTargetLife,
        },
      };

      if (lifelinkOwner && lifelinkAmount > 0) {
        updatedPlayers[lifelinkOwner] = {
          ...updatedPlayers[lifelinkOwner],
          life: updatedPlayers[lifelinkOwner].life + lifelinkAmount,
        };
      }

      const winner: PlayerSeat | null =
        nextTargetLife <= 0
          ? targetSeat === 'P1'
            ? 'P2'
            : 'P1'
          : state.winner;

      const isBotDamaged = targetSeat === 'P2' && targetPlayer.isBot && damage > 0;

      return {
        players: updatedPlayers,
        winner,
        botVoiceEvent: isBotDamaged
          ? {
              id: `bot-dmg-${Date.now()}`,
              text: `Ugh! Your ${attackerName} struck my Planeswalker core for ${damage} damage!`,
              mood: 'DAMAGE',
              timestamp: Date.now(),
            }
          : state.botVoiceEvent,
        combatLog: [
          `${attackerName} struck ${targetSeat} directly for ${damage} damage! (${targetSeat} Life: ${nextTargetLife})`,
          ...state.combatLog.slice(0, 7),
        ],
      };
    });
    broadcastSnapshot(get);
  },

  shatterCreatureToGraveyard: (cardId) => {
    set((state) => {
      const target = state.cards.find((c) => c.id === cardId);
      const updatedCards = state.cards.map((c) =>
        c.id === cardId
          ? {
              ...c,
              zone: 'GRAVEYARD' as const,
              slotIndex: null,
              tapped: false,
              isAttacking: false,
              blockingAttackerId: null,
              damageMarked: 0,
              deathtouchDamageReceived: false,
            }
          : c
      );

      return {
        cards: updatedCards,
        combatLog: target
          ? [
              `${target.name} shattered into shards and entered ${target.owner}'s Graveyard!`,
              ...state.combatLog.slice(0, 7),
            ]
          : state.combatLog,
      };
    });
    broadcastSnapshot(get);
  },

  completeCombatChoreographyAndPassTurn: () => {
    const state = get();
    if (state.winner) {
      set({ isCombatChoreographyPlaying: false });
      broadcastSnapshot(get);
      return;
    }

    const currentActive = state.activePlayer;
    const nextActive: PlayerSeat = currentActive === 'P1' ? 'P2' : 'P1';
    const nextTurn = state.turnNumber + 1;
    let drawnCardName: string | null = null;

    const updatedCards = state.cards.map((c) => {
      // Ensure any remaining lethal creature is moved to graveyard
      if (
        c.zone === 'BATTLEFIELD_CREATURE' &&
        (c.damageMarked >= c.toughness || c.deathtouchDamageReceived)
      ) {
        return {
          ...c,
          zone: 'GRAVEYARD' as const,
          slotIndex: null,
          tapped: false,
          isAttacking: false,
          blockingAttackerId: null,
          damageMarked: 0,
          deathtouchDamageReceived: false,
        };
      }

      if (c.owner === nextActive && c.zone === 'LIBRARY' && !drawnCardName) {
        drawnCardName = c.name;
        return {
          ...c,
          zone: 'HAND' as const,
          slotIndex: null,
          tapped: false,
          summoningSick: !c.keywords.includes('Haste'),
        };
      }

      if (c.owner === nextActive) {
        return {
          ...c,
          tapped: false,
          summoningSick: false,
          isAttacking: false,
          blockingAttackerId: null,
          damageMarked: 0,
          deathtouchDamageReceived: false,
        };
      }

      return {
        ...c,
        isAttacking: false,
        blockingAttackerId: null,
        damageMarked: 0,
        deathtouchDamageReceived: false,
      };
    });

    set({
      turnNumber: nextTurn,
      activePlayer: nextActive,
      priorityPlayer: nextActive,
      phase: 'START_AND_MAIN_1',
      isCombatChoreographyPlaying: false,
      selectedCardId: null,
      selectedBlockerId: null,
      cards: updatedCards,
      players: {
        ...state.players,
        P1: {
          ...state.players.P1,
          manaPool: 0,
          manaColors: { CRIMSON: 0, AETHER: 0, OBSIDIAN: 0 },
          landsPlayedThisTurn: 0,
        },
        P2: {
          ...state.players.P2,
          manaPool: 0,
          manaColors: { CRIMSON: 0, AETHER: 0, OBSIDIAN: 0 },
          landsPlayedThisTurn: 0,
        },
      },
      combatLog: [
        `Turn ${nextTurn}: ${nextActive} untaps all permanents & draws a card. Main Phase 1 begins.`,
        ...state.combatLog.slice(0, 7),
      ],
    });
    broadcastSnapshot(get);
  },

  advancePhase: () => {
    const state = get();
    if (state.winner || state.isCombatChoreographyPlaying) return;

    const currentActive = state.activePlayer;
    const defenderSeat: PlayerSeat = currentActive === 'P1' ? 'P2' : 'P1';

    if (state.phase === 'START_AND_MAIN_1') {
      set({
        phase: 'DECLARE_ATTACKERS',
        priorityPlayer: currentActive,
        selectedCardId: null,
        combatLog: [
          `${currentActive} entered DECLARE ATTACKERS. Click untapped 3D creatures to attack, then Confirm Attackers.`,
          ...state.combatLog.slice(0, 7),
        ],
      });
      broadcastSnapshot(get);
      return;
    }

    if (state.phase === 'DECLARE_ATTACKERS') {
      const attackers = state.cards.filter(
        (c) =>
          c.owner === currentActive &&
          c.zone === 'BATTLEFIELD_CREATURE' &&
          c.isAttacking
      );

      if (attackers.length === 0) {
        get().completeCombatChoreographyAndPassTurn();
        return;
      }

      const updatedCards = state.cards.map((c) =>
        c.owner === currentActive &&
        c.zone === 'BATTLEFIELD_CREATURE' &&
        c.isAttacking
          ? { ...c, tapped: true }
          : c
      );

      set({
        cards: updatedCards,
        phase: 'DECLARE_BLOCKERS',
        priorityPlayer: defenderSeat,
        selectedCardId: null,
        selectedBlockerId: null,
        botVoiceEvent:
          currentActive === 'P2' && state.players.P2.isBot
            ? {
                id: `bot-atk-${Date.now()}`,
                text: `My ${attackers.map((a) => a.name).join(' and ')} charge forward! Declare your blockers!`,
                mood: 'ATTACK',
                timestamp: Date.now(),
              }
            : state.botVoiceEvent,
        combatLog: [
          `${currentActive} confirmed ${attackers.length} attacker(s)! Priority shifts to ${defenderSeat} (DECLARE BLOCKERS).`,
          ...state.combatLog.slice(0, 7),
        ],
      });
      broadcastSnapshot(get);
      return;
    }

    if (state.phase === 'DECLARE_BLOCKERS') {
      // Lock turn progression and trigger the sequential 3D Combat Choreographer timeline!
      set({
        phase: 'COMBAT_RESOLUTION_AND_END',
        priorityPlayer: currentActive,
        isCombatChoreographyPlaying: true,
        combatSequenceId: state.combatSequenceId + 1,
        selectedBlockerId: null,
        combatLog: [
          `Blocks locked! Executing 3D Combat Choreography...`,
          ...state.combatLog.slice(0, 7),
        ],
      });
      broadcastSnapshot(get);
    }
  },

  resetMatch: () => {
    const fresh = createInitialMatchState(get().roomCode, get().gameMode);
    set({
      ...fresh,
    });
    broadcastSnapshot(get);
  },
}));
