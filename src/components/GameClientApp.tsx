'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { insertCoin, onPlayerJoin, myPlayer } from 'playroomkit';
import {
  detectPicoBrowserDiagnostics,
  initFirefoxPicoPolyfills,
  PicoBrowserDiagnostics,
} from '@/lib/firefoxPicoPolyfills';
import { enterPicoVR } from '@/lib/xrStore';
import { PHASE_LABELS, useGameStore } from '@/store/useGameStore';
import { GameMode, PlayerSeat } from '@/types/game';

const ArenaScene = dynamic(() => import('@/components/ArenaScene'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-screen bg-[#060913] text-cyan-400 font-mono text-sm tracking-widest">
      INITIALIZING WEBGL2 &amp; PICO G2 3DOF SANCTUM...
    </div>
  ),
});

export interface GameClientAppProps {
  initialRoom?: string;
  initialMode?: GameMode;
  initialSeat?: PlayerSeat;
  autoLaunch?: boolean;
}

export const GameClientApp: React.FC<GameClientAppProps> = ({
  initialRoom,
  initialMode,
  initialSeat,
  autoLaunch = false,
}) => {
  const localSeat = useGameStore((s) => s.localSeat);
  const roomCode = useGameStore((s) => s.roomCode);
  const gameMode = useGameStore((s) => s.gameMode);
  const isLobbyEntered = useGameStore((s) => s.isLobbyEntered);
  const localMicStream = useGameStore((s) => s.localMicStream);
  const localMicLevel = useGameStore((s) => s.localMicLevel);
  const remoteVoiceLevel = useGameStore((s) => s.remoteVoiceLevel);
  const remotePeerConnected = useGameStore((s) => s.remotePeerConnected);
  const turnNumber = useGameStore((s) => s.turnNumber);
  const priorityPlayer = useGameStore((s) => s.priorityPlayer);
  const phase = useGameStore((s) => s.phase);
  const players = useGameStore((s) => s.players);
  const winner = useGameStore((s) => s.winner);

  const setLocalSeat = useGameStore((s) => s.setLocalSeat);
  const setRoomCode = useGameStore((s) => s.setRoomCode);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const spawnAIOpponent = useGameStore((s) => s.spawnAIOpponent);
  const setLobbyEntered = useGameStore((s) => s.setLobbyEntered);
  const setPlayroomConnected = useGameStore((s) => s.setPlayroomConnected);
  const setLocalMicStream = useGameStore((s) => s.setLocalMicStream);
  const setLocalMicLevel = useGameStore((s) => s.setLocalMicLevel);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const resetMatch = useGameStore((s) => s.resetMatch);

  const [micStatus, setMicStatus] = useState<'IDLE' | 'TESTING' | 'READY' | 'BLOCKED'>('IDLE');
  const [micError, setMicError] = useState<string | null>(null);
  const [xrSupported, setXrSupported] = useState<boolean>(false);
  const [vrNotice, setVrNotice] = useState<string | null>(null);
  const [joiningRoom, setJoiningRoom] = useState<boolean>(false);
  const [picoDiag, setPicoDiag] = useState<PicoBrowserDiagnostics | null>(null);

  const micRafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const autoLaunchedRef = useRef(false);

  // Initialize Firefox Reality (GeckoView 77-81) Polyfills & Detect WebXR Support
  useEffect(() => {
    initFirefoxPicoPolyfills();
    const diag = detectPicoBrowserDiagnostics();
    setPicoDiag(diag);

    if (typeof navigator !== 'undefined' && 'xr' in navigator && navigator.xr) {
      navigator.xr
        .isSessionSupported('immersive-vr')
        .then((supported) => setXrSupported(supported))
        .catch(() => setXrSupported(false));
    }
  }, []);

  // Apply short link props or query parameters (?r=A1&m=ai&s=2)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qRoom = initialRoom || params.get('r');
    const qMode =
      initialMode ||
      (params.get('m') === 'pvp'
        ? 'MULTIPLAYER'
        : params.get('m') === 'ai'
        ? 'SOLO_AI'
        : undefined);
    const qSeat =
      initialSeat || (params.get('s') === '2' ? 'P2' : undefined);

    if (qRoom) {
      setRoomCode(qRoom.toUpperCase().slice(0, 12));
    }
    if (qMode) {
      setGameMode(qMode);
    }
    if (qSeat) {
      setLocalSeat(qSeat);
    }

    if (autoLaunch && !autoLaunchedRef.current) {
      autoLaunchedRef.current = true;
      const targetMode = qMode ?? 'SOLO_AI';
      if (targetMode === 'SOLO_AI') {
        setLocalSeat('P1');
        spawnAIOpponent();
        setLobbyEntered(true);
      } else {
        handleJoinMatch(false, qRoom?.toUpperCase() || undefined, targetMode);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoom, initialMode, initialSeat, autoLaunch]);

  useEffect(() => {
    return () => {
      if (micRafRef.current) cancelAnimationFrame(micRafRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => undefined);
      }
    };
  }, []);

  const runPicoG2MicCheck = async () => {
    setMicStatus('TESTING');
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      setLocalMicStream(stream);
      setMicStatus('READY');

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const normalized = Math.min(100, Math.round((sum / dataArray.length / 110) * 100));
        setLocalMicLevel(normalized);
        micRafRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch (err) {
      setMicStatus('BLOCKED');
      setMicError(
        err instanceof Error
          ? err.message
          : 'Microphone access denied or unavailable.'
      );
    }
  };

  const handleJoinMatch = async (
    enterVRImmediately: boolean,
    overrideRoom?: string,
    overrideMode?: GameMode
  ) => {
    const activeMode = overrideMode ?? gameMode;
    const activeRoom = (overrideRoom ?? roomCode).trim().toUpperCase() || 'A1';
    setJoiningRoom(true);
    setVrNotice(null);

    try {
      if (activeMode === 'SOLO_AI') {
        setLocalSeat('P1');
        spawnAIOpponent();
      } else {
        await Promise.race([
          insertCoin({
            skipLobby: true,
            roomCode: activeRoom,
            maxPlayersPerRoom: 2,
          }),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);

        if (myPlayer()) {
          setPlayroomConnected(true);
          onPlayerJoin(() => {
            useGameStore.getState().setRemotePeerConnected(true);
          });
        }
      }
    } catch {
      // Seamless fallback to BroadcastChannel / AI Bot
    } finally {
      setJoiningRoom(false);
      setLobbyEntered(true);
      if (enterVRImmediately) {
        const res = await enterPicoVR();
        if (!res.ok && res.reason) {
          setVrNotice(res.reason);
        }
      }
    }
  };

  const handleEnterVRFromArena = async () => {
    setVrNotice(null);
    const res = await enterPicoVR();
    if (!res.ok && res.reason) {
      setVrNotice(res.reason);
    }
  };

  const hasLocalPriority = priorityPlayer === localSeat;

  let phaseActionText = 'Declare Attackers ->';
  if (winner) {
    phaseActionText = 'Reset Match';
  } else if (!hasLocalPriority) {
    phaseActionText = players.P2.isBot ? 'AI Bot Acting...' : `Waiting (${priorityPlayer})`;
  } else if (phase === 'DECLARE_ATTACKERS') {
    phaseActionText = 'Confirm Attackers';
  } else if (phase === 'DECLARE_BLOCKERS') {
    phaseActionText = 'Confirm Blocks';
  } else if (phase === 'COMBAT_RESOLUTION_AND_END') {
    phaseActionText = 'Resolve Combat';
  }

  if (isLobbyEntered) {
    return (
      <main className="relative w-full h-screen bg-[#060913] overflow-hidden">
        <ArenaScene />

        {/* Top Cross-Play & Telemetry Bar */}
        <header className="fixed top-0 left-0 right-0 z-20 flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-950/90 border-b border-cyan-500/30 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-bold tracking-wider text-cyan-400 uppercase">
              APVR
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-200 font-mono">
              {gameMode === 'SOLO_AI' ? 'SOLO AI' : `ROOM: ${roomCode}`}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono">
              {localSeat}: {players[localSeat].life} HP
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 text-slate-300 font-mono">
              <span>T{turnNumber}</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">
                {PHASE_LABELS[phase]}
              </span>
              <span>•</span>
              <span className="text-cyan-300">
                MANA: {players[localSeat].manaPool}
              </span>
            </div>

            {gameMode === 'MULTIPLAYER' && !players.P2.isBot && (
              <button
                type="button"
                onClick={spawnAIOpponent}
                className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400 text-emerald-300 font-semibold transition"
              >
                Spawn AI
              </button>
            )}

            {gameMode === 'MULTIPLAYER' && !players.P2.isBot && (
              <button
                type="button"
                onClick={() => setLocalSeat(localSeat === 'P1' ? 'P2' : 'P1')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-medium transition"
              >
                Seat {localSeat === 'P1' ? 'P2' : 'P1'}
              </button>
            )}

            <button
              type="button"
              disabled={!hasLocalPriority && !winner}
              onClick={() => {
                if (winner) {
                  resetMatch();
                } else {
                  advancePhase(localSeat);
                }
              }}
              className={`px-3 py-1 rounded border font-semibold transition ${
                hasLocalPriority || winner
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {phaseActionText}
            </button>

            <button
              type="button"
              onClick={handleEnterVRFromArena}
              className="px-3.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold tracking-wide shadow-sm transition"
            >
              Enter VR (Pico)
            </button>
          </div>
        </header>

        {vrNotice && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-lg bg-amber-950/95 border border-amber-400 text-amber-200 text-xs font-mono">
            {vrNotice}
          </div>
        )}

        {/* Bottom Controls & Spatial Voice Telemetry */}
        <footer className="fixed bottom-0 left-0 right-0 z-20 flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
          <div>
            <span className="text-cyan-400 font-semibold">PICO 3DOF:</span>{' '}
            Trigger / Click = Play &amp; Tap | Touchpad / Squeeze / Space = Next Phase
          </div>
          <div className="flex items-center gap-3">
            <span>
              PRIORITY: <strong className="text-amber-300">{priorityPlayer}</strong>
            </span>
            <span>
              VOICE:{' '}
              <strong className="text-emerald-400">
                {players.P2.isBot
                  ? `AI SYNTH (${Math.round(remoteVoiceLevel * 100)}%)`
                  : remotePeerConnected
                  ? `WEBRTC (${Math.round(remoteVoiceLevel * 100)}%)`
                  : 'STANDBY'}
              </strong>
            </span>
          </div>
        </footer>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#060913] text-slate-100 flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl p-5 md:p-7 space-y-5">
        {/* Title & Firefox Reality on Pico G2 Compatibility Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-2">
              <span>PICO G2 • FIREFOX REALITY (v10–v12 / GECKO 77–81)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              AETHERPLANES <span className="text-cyan-400">VR</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              3DoF WebXR Trading Card Game • ES2019 Downleveled + WebXR Polyfill
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end text-xs font-mono space-y-1">
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
              WebXR:{' '}
              <strong className={xrSupported ? 'text-emerald-400' : 'text-amber-400'}>
                {xrSupported ? 'IMMERSIVE-VR READY' : '3D / POLYFILL MODE'}
              </strong>
            </span>
            {picoDiag && (
              <span className="text-[11px] text-slate-400">
                {picoDiag.browserLabel}
                {!picoDiag.isSecureContext ? ' • NEEDS HTTPS FOR VR' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Short Link Quick Guide for Pico G2 Virtual Keyboard */}
        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div>
            <span className="text-cyan-300 font-bold">SHORT LINKS FOR PICO:</span>{' '}
            <span className="text-slate-300">
              <code className="text-amber-300">/s</code> = Instant Solo AI
            </span>{' '}
            •{' '}
            <span className="text-slate-300">
              <code className="text-amber-300">/a1</code> = Room A1 (P1)
            </span>{' '}
            •{' '}
            <span className="text-slate-300">
              <code className="text-amber-300">/a1-2</code> = Room A1 (P2)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Recommended subdomain: <code>apvr.vercel.app</code>
          </span>
        </div>

        {/* Step 1: Dual-Mode Toggle */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-cyan-400">
            1. Select Game Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                {
                  mode: 'SOLO_AI' as GameMode,
                  title: 'Solo vs. AI Planeswalker',
                  subtitle:
                    'Instant match vs. Archmage Aetherion (850ms steps + 3D AI Voice)',
                },
                {
                  mode: 'MULTIPLAYER' as GameMode,
                  title: '1v1 Online Multiplayer',
                  subtitle:
                    'PlayroomKit Room Sync + WebRTC Spatial Voice (with In-VR AI fallback)',
                },
              ] as const
            ).map((item) => {
              const active = gameMode === item.mode;
              return (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => setGameMode(item.mode)}
                  className={`p-3 rounded-xl border text-left transition ${
                    active
                      ? 'bg-cyan-950/85 border-cyan-400 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{item.title}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        active
                          ? 'bg-cyan-400 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {active ? 'ACTIVE' : 'SELECT'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {item.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Short Room Code & Seated 3DoF Rig */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-cyan-400">
              2. Short Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="A1"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-base focus:outline-none focus:border-cyan-400"
            />
            <p className="text-xs text-slate-400">
              Default <code>A1</code> for quick entry on the Pico G2 VR keyboard.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
              3. Seated 3DoF Camera Rig
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(['P1', 'P2'] as PlayerSeat[]).map((seat) => {
                const selected = localSeat === seat;
                const disabled = gameMode === 'SOLO_AI' && seat === 'P2';
                return (
                  <button
                    key={seat}
                    type="button"
                    disabled={disabled}
                    onClick={() => setLocalSeat(seat)}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      selected
                        ? 'bg-cyan-950/80 border-cyan-400 text-white'
                        : disabled
                        ? 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm">
                      {seat === 'P1'
                        ? 'P1 (South)'
                        : gameMode === 'SOLO_AI'
                        ? 'AI (North)'
                        : 'P2 (North)'}
                    </div>
                    <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                      {seat === 'P1' ? '[0, 1.65, 3.8]' : '[0, 1.65, -3.8]'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 4: Mic Check */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                4. Pico G2 Spatial Voice Check
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                AEC / NS / AGC enabled for open-speaker headsets
              </p>
            </div>

            <button
              type="button"
              onClick={runPicoG2MicCheck}
              className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400 text-emerald-300 text-xs font-bold uppercase tracking-wider transition"
            >
              {micStatus === 'READY' ? 'Mic Calibrated ✓' : 'Test Mic'}
            </button>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 transition-all duration-75"
              style={{ width: `${localMicStream ? Math.max(6, localMicLevel) : 0}%` }}
            />
          </div>

          {micError && (
            <p className="text-xs text-rose-400 font-mono">
              Note: {micError} (AI Synth &amp; receive-only spatial audio stay active.)
            </p>
          )}
        </div>

        {/* Enter VR / Launch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            disabled={joiningRoom}
            onClick={() => handleJoinMatch(true)}
            className="w-full py-3.5 px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-sm uppercase tracking-wider shadow-lg transition"
          >
            {joiningRoom
              ? 'Entering...'
              : `Enter VR (${gameMode === 'SOLO_AI' ? 'Solo AI' : `Room ${roomCode}`})`}
          </button>

          <button
            type="button"
            disabled={joiningRoom}
            onClick={() => handleJoinMatch(false)}
            className="w-full py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 font-bold text-sm uppercase tracking-wider transition"
          >
            Open 3D Arena (2D / Desktop)
          </button>
        </div>
      </div>
    </main>
  );
};
