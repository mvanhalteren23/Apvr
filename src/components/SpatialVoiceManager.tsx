'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { RPC, myPlayer } from 'playroomkit';
import { useGameStore } from '@/store/useGameStore';
import {
  PlayerSeat,
  SynchronizedMatchState,
  WebRTCSignalPayload,
} from '@/types/game';

const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const SpatialVoiceManager: React.FC = () => {
  const { camera } = useThree();

  const localSeat = useGameStore((s) => s.localSeat);
  const roomCode = useGameStore((s) => s.roomCode);
  const gameMode = useGameStore((s) => s.gameMode);
  const isPlayroomConnected = useGameStore((s) => s.isPlayroomConnected);
  const localMicStream = useGameStore((s) => s.localMicStream);
  const botVoiceEvent = useGameStore((s) => s.botVoiceEvent);
  const opponentSeat: PlayerSeat = localSeat === 'P1' ? 'P2' : 'P1';
  const avatarHoverId = `avatar-${opponentSeat}`;
  const isHovered = useGameStore((s) => s.hoveredObjectId === avatarHoverId);

  const setLocalMicStream = useGameStore((s) => s.setLocalMicStream);
  const setRemoteVoiceLevel = useGameStore((s) => s.setRemoteVoiceLevel);
  const setRemotePeerConnected = useGameStore((s) => s.setRemotePeerConnected);
  const applyRemoteState = useGameStore((s) => s.applyRemoteState);
  const registerSyncPublisher = useGameStore((s) => s.registerSyncPublisher);
  const interactWithPlayerAvatar = useGameStore((s) => s.interactWithPlayerAvatar);
  const setHoveredObjectId = useGameStore((s) => s.setHoveredObjectId);

  const opponentState = useGameStore((s) => s.players[opponentSeat]);
  const isOpponentBot = opponentState.isBot || gameMode === 'SOLO_AI';

  // Opponent Avatar canonical position across the table: [0, 1.6, -3.8] for Player 1
  const opponentPosition: [number, number, number] =
    localSeat === 'P1' ? [0, 1.6, -3.8] : [0, 1.6, 3.8];
  const opponentRotationY = localSeat === 'P1' ? 0 : Math.PI;

  const avatarGroupRef = useRef<THREE.Group>(null);
  const headMeshRef = useRef<THREE.Mesh>(null);
  const glowRingOuterRef = useRef<THREE.Mesh>(null);
  const glowRingInnerRef = useRef<THREE.Mesh>(null);

  const audioListenerRef = useRef<THREE.AudioListener | null>(null);
  const positionalAudioRef = useRef<THREE.PositionalAudio | null>(null);
  const botSynthBusGainRef = useRef<GainNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array | null>(null);
  const synthSpeechEndTimeRef = useRef<number>(0);
  const lastReportedVoiceLevelRef = useRef<number>(0);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const [voiceConnected, setVoiceConnected] = useState(false);

  // 1. Attach Three.js AudioListener to active XR/Desktop camera and PositionalAudio to Opponent Avatar Head at [0, 1.6, -3.8]
  useEffect(() => {
    const listener = new THREE.AudioListener();
    camera.add(listener);
    audioListenerRef.current = listener;

    const posAudio = new THREE.PositionalAudio(listener);
    posAudio.setRefDistance(1.8);
    posAudio.setMaxDistance(14.0);
    posAudio.setRolloffFactor(1.35);
    posAudio.setDistanceModel('inverse');
    posAudio.setDirectionalCone(190, 260, 0.35);
    positionalAudioRef.current = posAudio;

    const currentHeadMesh = headMeshRef.current;
    if (currentHeadMesh) {
      currentHeadMesh.add(posAudio);
    }

    return () => {
      if (currentHeadMesh && positionalAudioRef.current) {
        currentHeadMesh.remove(positionalAudioRef.current);
      }
      camera.remove(listener);
    };
  }, [camera]);

  // 2. Capture local microphone with strict Pico G2 open-speaker acoustic constraints
  useEffect(() => {
    let cancelled = false;

    async function ensurePicoMicrophoneStream() {
      if (localMicStream && localMicStream.active) {
        return;
      }
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        if (!cancelled) {
          setLocalMicStream(stream);
        }
      } catch {
        // Continues in receive-only / AI Synth mode if hardware mic is absent
      }
    }

    ensurePicoMicrophoneStream();

    return () => {
      cancelled = true;
    };
  }, [localMicStream, setLocalMicStream]);

  // 3A. AI Bot Procedural Web Audio API Synthesizer + speechSynthesis Emitter attached to 3D PositionalAudio at [0, 1.6, -3.8]
  useEffect(() => {
    if (!isOpponentBot) return;

    setVoiceConnected(true);
    setRemotePeerConnected(true);

    if (!botVoiceEvent) return;

    const listener = audioListenerRef.current;
    const posAudio = positionalAudioRef.current;
    if (!listener || !posAudio) return;

    const audioCtx = listener.context;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => undefined);
    }

    // Ensure a persistent bus GainNode + AnalyserNode are attached once for the 3D PositionalAudio node
    if (!botSynthBusGainRef.current || !remoteAnalyserRef.current) {
      const busGain = audioCtx.createGain();
      busGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;
      busGain.connect(analyser);
      try {
        posAudio.setNodeSource(busGain as unknown as AudioNode);
      } catch {
        // Ignore if node source already bound
      }
      botSynthBusGainRef.current = busGain;
      remoteAnalyserRef.current = analyser;
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    }

    const busGain = botSynthBusGainRef.current;
    const now = audioCtx.currentTime;
    const wordCount = Math.max(3, botVoiceEvent.text.split(' ').length);
    const durationSec = Math.min(3.0, wordCount * 0.24);
    synthSpeechEndTimeRef.current = performance.now() + durationSec * 1000;

    // Build procedural Web Audio API formant voice synthesizer routed through the persistent 3D PositionalAudio bus
    try {
      const carrierOsc = audioCtx.createOscillator();
      const subOsc = audioCtx.createOscillator();
      const formantFilter = audioCtx.createBiquadFilter();
      const synthGain = audioCtx.createGain();

      const baseFreq =
        botVoiceEvent.mood === 'ATTACK'
          ? 145
          : botVoiceEvent.mood === 'DAMAGE'
          ? 110
          : botVoiceEvent.mood === 'BLOCK'
          ? 165
          : 130;

      carrierOsc.type = 'sawtooth';
      carrierOsc.frequency.setValueAtTime(baseFreq, now);

      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(baseFreq * 1.5, now);

      formantFilter.type = 'bandpass';
      formantFilter.frequency.setValueAtTime(680, now);
      formantFilter.Q.setValueAtTime(3.2, now);

      synthGain.gain.setValueAtTime(0.001, now);

      // Modulate syllabic cadence across the utterance duration
      const syllables = Math.min(10, wordCount * 2);
      const stepDur = durationSec / syllables;
      for (let i = 0; i < syllables; i++) {
        const tStart = now + i * stepDur;
        const tPeak = tStart + stepDur * 0.45;
        const pitchMod = baseFreq + ((i * 23) % 45) - 15;
        carrierOsc.frequency.linearRampToValueAtTime(pitchMod, tPeak);
        formantFilter.frequency.linearRampToValueAtTime(
          520 + ((i * 190) % 680),
          tPeak
        );
        synthGain.gain.linearRampToValueAtTime(0.16, tPeak);
        synthGain.gain.linearRampToValueAtTime(0.02, tStart + stepDur * 0.92);
      }

      synthGain.gain.linearRampToValueAtTime(0.0001, now + durationSec);

      carrierOsc.connect(formantFilter);
      subOsc.connect(formantFilter);
      formantFilter.connect(synthGain);
      synthGain.connect(busGain);

      carrierOsc.start(now);
      subOsc.start(now);
      carrierOsc.stop(now + durationSec + 0.05);
      subOsc.stop(now + durationSec + 0.05);
    } catch {
      // Fallback if Web Audio context has not yet received a user gesture
    }

    // Trigger browser speechSynthesis utterance alongside the 3D positional formant synth
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(botVoiceEvent.text);
        utterance.pitch = 0.78;
        utterance.rate = 1.04;
        utterance.volume = 0.9;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore if speechSynthesis is restricted on headless browser
      }
    }
  }, [isOpponentBot, botVoiceEvent, setRemotePeerConnected]);

  // 3B. 1v1 Online Multiplayer WebRTC Peer Connection + PlayroomKit RPC.register / RPC.call
  useEffect(() => {
    if (isOpponentBot) {
      return;
    }

    let isMounted = true;

    const sendSignal = (payload: WebRTCSignalPayload) => {
      if (isPlayroomConnected) {
        try {
          RPC.call('WEBRTC_SIGNAL', payload, RPC.Mode.OTHERS);
        } catch {
          // Fallback to BroadcastChannel if Playroom RPC is not yet active
        }
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          kind: 'WEBRTC_SIGNAL',
          payload,
        });
      }
    };

    const attachRemoteStreamToPositionalAudio = (remoteStream: MediaStream) => {
      const listener = audioListenerRef.current;
      const posAudio = positionalAudioRef.current;
      if (!listener || !posAudio) return;

      const audioCtx = listener.context;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => undefined);
      }

      const hiddenAudioEl = document.createElement('audio');
      hiddenAudioEl.srcObject = remoteStream;
      hiddenAudioEl.muted = true;
      hiddenAudioEl.playsInline = true;
      hiddenAudioEl.play().catch(() => undefined);

      try {
        posAudio.setMediaStreamSource(remoteStream);
      } catch {
        // Stream already attached
      }

      const sourceNode = audioCtx.createMediaStreamSource(remoteStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.78;
      sourceNode.connect(analyser);

      remoteAnalyserRef.current = analyser;
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);

      if (isMounted) {
        setVoiceConnected(true);
        setRemotePeerConnected(true);
      }
    };

    const createOrGetPeerConnection = (): RTCPeerConnection => {
      if (peerConnectionRef.current) {
        return peerConnectionRef.current;
      }

      const pc = new RTCPeerConnection(RTC_CONFIGURATION);
      peerConnectionRef.current = pc;

      if (localMicStream) {
        localMicStream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, localMicStream);
        });
      } else {
        pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const selfId = myPlayer()?.id ?? `local-${localSeat}`;
          sendSignal({
            senderPlayroomId: selfId,
            senderSeat: localSeat,
            targetSeat: opponentSeat,
            type: 'ICE_CANDIDATE',
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) {
          attachRemoteStreamToPositionalAudio(stream);
        } else {
          const inboundStream = new MediaStream([event.track]);
          attachRemoteStreamToPositionalAudio(inboundStream);
        }
      };

      pc.onconnectionstatechange = () => {
        if (!isMounted) return;
        const connected =
          pc.connectionState === 'connected' ||
          pc.iceConnectionState === 'connected';
        setVoiceConnected(connected);
        setRemotePeerConnected(connected);
      };

      return pc;
    };

    const handleIncomingSignal = async (payload: WebRTCSignalPayload) => {
      if (!payload || payload.senderSeat === localSeat) return;

      const pc = createOrGetPeerConnection();
      const selfId = myPlayer()?.id ?? `local-${localSeat}`;

      try {
        if (payload.type === 'PING_READY') {
          setRemotePeerConnected(true);
          if (localSeat === 'P1') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal({
              senderPlayroomId: selfId,
              senderSeat: localSeat,
              targetSeat: opponentSeat,
              type: 'OFFER',
              sdp: pc.localDescription ?? offer,
            });
          }
          const snapshot = useGameStore.getState().getSerializableState();
          if (isPlayroomConnected) {
            try {
              RPC.call('MATCH_STATE_SYNC', snapshot, RPC.Mode.OTHERS);
            } catch {
              // ignore
            }
          }
          if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({
              kind: 'MATCH_STATE_SYNC',
              payload: snapshot,
            });
          }
          return;
        }

        if (payload.type === 'OFFER' && payload.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          while (pendingCandidatesRef.current.length > 0) {
            const cand = pendingCandidatesRef.current.shift();
            if (cand) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
          }
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal({
            senderPlayroomId: selfId,
            senderSeat: localSeat,
            targetSeat: opponentSeat,
            type: 'ANSWER',
            sdp: pc.localDescription ?? answer,
          });
          return;
        }

        if (payload.type === 'ANSWER' && payload.sdp) {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            while (pendingCandidatesRef.current.length > 0) {
              const cand = pendingCandidatesRef.current.shift();
              if (cand) {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              }
            }
          }
          return;
        }

        if (payload.type === 'ICE_CANDIDATE' && payload.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else {
            pendingCandidatesRef.current.push(payload.candidate);
          }
        }
      } catch {
        // Ignore transient signaling glare
      }
    };

    try {
      RPC.register('WEBRTC_SIGNAL', async (data: WebRTCSignalPayload) => {
        await handleIncomingSignal(data);
      });
      RPC.register('MATCH_STATE_SYNC', async (snapshot: SynchronizedMatchState) => {
        if (snapshot) {
          applyRemoteState(snapshot);
        }
      });
    } catch {
      // RPC activates once Playroom insertCoin completes
    }

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(`aetherplanes-room-${roomCode}`);
      broadcastChannelRef.current = bc;
      bc.onmessage = (event) => {
        const msg = event.data;
        if (!msg) return;
        if (msg.kind === 'WEBRTC_SIGNAL') {
          handleIncomingSignal(msg.payload);
        } else if (msg.kind === 'MATCH_STATE_SYNC') {
          applyRemoteState(msg.payload);
        }
      };
    }

    registerSyncPublisher((snapshot: SynchronizedMatchState) => {
      if (isPlayroomConnected) {
        try {
          RPC.call('MATCH_STATE_SYNC', snapshot, RPC.Mode.OTHERS);
        } catch {
          // ignore
        }
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          kind: 'MATCH_STATE_SYNC',
          payload: snapshot,
        });
      }
    });

    createOrGetPeerConnection();
    const selfId = myPlayer()?.id ?? `local-${localSeat}`;
    sendSignal({
      senderPlayroomId: selfId,
      senderSeat: localSeat,
      targetSeat: opponentSeat,
      type: 'PING_READY',
    });

    return () => {
      isMounted = false;
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [
    isOpponentBot,
    localSeat,
    opponentSeat,
    roomCode,
    isPlayroomConnected,
    localMicStream,
    applyRemoteState,
    registerSyncPublisher,
    setRemotePeerConnected,
  ]);

  // 4. Real-time 72 FPS Audio-Reactive Avatar Scale & Glow Ring Animation Loop
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    let normalizedVoiceEnergy = 0;

    if (remoteAnalyserRef.current && frequencyDataRef.current) {
      remoteAnalyserRef.current.getByteFrequencyData(
        frequencyDataRef.current as Uint8Array<ArrayBuffer>
      );
      let sum = 0;
      const binCount = frequencyDataRef.current.length;
      for (let i = 0; i < binCount; i++) {
        sum += frequencyDataRef.current[i];
      }
      const avg = sum / binCount;
      normalizedVoiceEnergy = Math.min(1, avg / 85);
    }

    // Ensure procedural envelope pulse also animates smoothly if Web Audio is awaiting gesture
    if (isOpponentBot && performance.now() < synthSpeechEndTimeRef.current) {
      const proceduralPulse =
        Math.abs(Math.sin(elapsed * 14.0)) * 0.65 +
        Math.abs(Math.cos(elapsed * 9.0)) * 0.35;
      normalizedVoiceEnergy = Math.max(normalizedVoiceEnergy, proceduralPulse);
    }

    const quantizedEnergy = Math.round(normalizedVoiceEnergy * 20) / 20;
    if (
      Math.abs(quantizedEnergy - lastReportedVoiceLevelRef.current) >= 0.05 ||
      (quantizedEnergy === 0 && lastReportedVoiceLevelRef.current !== 0)
    ) {
      lastReportedVoiceLevelRef.current = quantizedEnergy;
      setRemoteVoiceLevel(quantizedEnergy);
    }

    if (avatarGroupRef.current) {
      avatarGroupRef.current.position.y =
        opponentPosition[1] + Math.sin(elapsed * 2.2) * 0.04;
    }

    if (headMeshRef.current) {
      const pulseScale = 1 + normalizedVoiceEnergy * 0.32;
      headMeshRef.current.scale.setScalar(pulseScale);
      headMeshRef.current.rotation.y = elapsed * 0.45;
    }

    if (glowRingOuterRef.current) {
      const ringScale =
        1 + normalizedVoiceEnergy * 0.9 + Math.sin(elapsed * 4) * 0.03;
      glowRingOuterRef.current.scale.set(ringScale, ringScale, 1);
      const mat = glowRingOuterRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + normalizedVoiceEnergy * 0.65;
    }

    if (glowRingInnerRef.current) {
      const innerScale = 1 + normalizedVoiceEnergy * 0.48;
      glowRingInnerRef.current.scale.set(innerScale, innerScale, 1);
      glowRingInnerRef.current.rotation.z = -elapsed * 0.85;
    }
  });

  return (
    <group
      ref={avatarGroupRef}
      position={opponentPosition}
      rotation={[0, opponentRotationY, 0]}
    >
      {/* Opponent Floating 3D Planeswalker Avatar Head Mesh (PositionalAudio parent at [0, 1.6, -3.8]) */}
      <mesh
        ref={headMeshRef}
        name={avatarHoverId}
        userData={{
          interactableType: 'AVATAR',
          playerSeat: opponentSeat,
        }}
        onClick={(e) => {
          e.stopPropagation();
          interactWithPlayerAvatar(opponentSeat);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredObjectId(avatarHoverId);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (useGameStore.getState().hoveredObjectId === avatarHoverId) {
            setHoveredObjectId(null);
          }
        }}
      >
        <icosahedronGeometry args={[0.26, 1]} />
        <meshLambertMaterial
          color={
            isHovered
              ? '#ff4d6d'
              : isOpponentBot
              ? '#c084fc'
              : '#00f0ff'
          }
          emissive={
            isHovered
              ? '#881337'
              : isOpponentBot
              ? '#3b0764'
              : '#083344'
          }
          flatShading
        />
      </mesh>

      {/* Planeswalker Crown / Visor Crest */}
      <mesh position={[0, 0.22, 0.14]}>
        <coneGeometry args={[0.14, 0.28, 4]} />
        <meshBasicMaterial color="#f5b041" />
      </mesh>

      {/* Inner Audio-Reactive Runic Halo */}
      <mesh ref={glowRingInnerRef} position={[0, 0, -0.05]}>
        <ringGeometry args={[0.31, 0.35, 24]} />
        <meshBasicMaterial
          color="#f5b041"
          side={THREE.DoubleSide}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Outer Audio-Reactive Voice Pulse Ring */}
      <mesh ref={glowRingOuterRef} position={[0, 0, -0.08]}>
        <ringGeometry args={[0.38, 0.46, 32]} />
        <meshBasicMaterial
          color={
            isOpponentBot
              ? '#c084fc'
              : voiceConnected
              ? '#00f0ff'
              : '#94a3b8'
          }
          side={THREE.DoubleSide}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Opponent Nameplate & Life Total Badge */}
      <Text
        position={[0, 0.56, 0]}
        fontSize={0.105}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
      >
        {`${opponentState.displayName} • ${opponentState.life} HP`}
      </Text>

      <Text
        position={[0, 0.43, 0]}
        fontSize={0.062}
        color={
          isOpponentBot
            ? '#c084fc'
            : voiceConnected
            ? '#00f0ff'
            : '#f5b041'
        }
        anchorX="center"
        anchorY="middle"
      >
        {isOpponentBot
          ? botVoiceEvent
            ? `"${botVoiceEvent.text}"`
            : 'AI SYNTHESIZER READY (3D POSITIONAL)'
          : voiceConnected
          ? 'SPATIAL WEBRTC VOICE ACTIVE'
          : 'SPATIAL VOICE STANDBY (AWAITING PEER)'}
      </Text>
    </group>
  );
};
