'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { XROrigin } from '@react-three/xr';
import * as THREE from 'three';
import { useGameStore } from '@/store/useGameStore';
import { PlayerSeat } from '@/types/game';

interface PicoControllerRigProps {
  interactableRootRef: React.RefObject<THREE.Group | null>;
}

const MAX_LASER_DISTANCE = 8.0;

export const PicoControllerRig: React.FC<PicoControllerRigProps> = ({
  interactableRootRef,
}) => {
  const { camera, gl, pointer } = useThree();

  const localSeat = useGameStore((s) => s.localSeat);
  const priorityPlayer = useGameStore((s) => s.priorityPlayer);
  const winner = useGameStore((s) => s.winner);
  const hoveredObjectId = useGameStore((s) => s.hoveredObjectId);
  const setHoveredObjectId = useGameStore((s) => s.setHoveredObjectId);
  const interactWithCard = useGameStore((s) => s.interactWithCard);
  const interactWithSlot = useGameStore((s) => s.interactWithSlot);
  const interactWithPlayerAvatar = useGameStore((s) => s.interactWithPlayerAvatar);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const spawnAIOpponent = useGameStore((s) => s.spawnAIOpponent);
  const drawCard = useGameStore((s) => s.drawCard);
  const resetMatch = useGameStore((s) => s.resetMatch);

  // Seated 3DoF Camera Rig Coordinates:
  // Player 1 locked at [0, 1.65, 3.8] facing [0, 0.8, 0]
  // Player 2 locked at [0, 1.65, -3.8] facing [0, 0.8, 0]
  const rigPosition = useMemo<[number, number, number]>(
    () => (localSeat === 'P1' ? [0, 1.65, 3.8] : [0, 1.65, -3.8]),
    [localSeat]
  );

  const rigRotationY = localSeat === 'P1' ? 0 : Math.PI;

  const wandGroupRef = useRef<THREE.Group>(null);
  const laserBeamMeshRef = useRef<THREE.Mesh>(null);
  const reticleMeshRef = useRef<THREE.Mesh>(null);

  const raycasterRef = useRef(new THREE.Raycaster());
  const rayOriginWorld = useRef(new THREE.Vector3());
  const rayDirectionWorld = useRef(new THREE.Vector3(0, 0, -1));
  const tempQuat = useRef(new THREE.Quaternion());
  const tempMatrix = useRef(new THREE.Matrix4());
  const hitTargetRef = useRef<THREE.Object3D | null>(null);
  const touchpadPressedLastFrame = useRef<boolean>(false);

  useEffect(() => {
    camera.position.set(rigPosition[0], rigPosition[1], rigPosition[2]);
    camera.lookAt(0, 0.8, 0);
    camera.updateProjectionMatrix();
  }, [camera, rigPosition]);

  const executeLaserHitAction = () => {
    let node: THREE.Object3D | null = hitTargetRef.current;
    while (node && !node.userData?.interactableType) {
      node = node.parent;
    }
    if (!node || !node.userData) return;

    const { interactableType, cardId, playerSeat, zone, slotIndex } =
      node.userData;
    if (interactableType === 'CARD' && typeof cardId === 'string') {
      interactWithCard(cardId, localSeat);
    } else if (
      interactableType === 'BATTLEFIELD_SLOT' &&
      zone &&
      typeof slotIndex === 'number'
    ) {
      interactWithSlot(zone, slotIndex, localSeat);
    } else if (interactableType === 'PHASE_CRYSTAL') {
      if (winner) {
        resetMatch();
      } else if (priorityPlayer === localSeat) {
        advancePhase(localSeat);
      }
    } else if (interactableType === 'SPAWN_AI_BUTTON') {
      spawnAIOpponent();
    } else if (interactableType === 'AVATAR' && playerSeat) {
      interactWithPlayerAvatar(playerSeat as PlayerSeat, localSeat);
    } else if (interactableType === 'LIBRARY_DECK') {
      if (winner) {
        resetMatch();
      } else {
        drawCard(localSeat);
      }
    }
  };

  useEffect(() => {
    const handleSelectStart = () => {
      executeLaserHitAction();
    };

    const handleSqueezeStart = () => {
      if (priorityPlayer === localSeat) {
        advancePhase(localSeat);
      }
    };

    const onSessionStart = () => {
      const session = gl.xr.getSession();
      if (!session) return;
      session.addEventListener('selectstart', handleSelectStart);
      session.addEventListener('squeezestart', handleSqueezeStart);
    };

    gl.xr.addEventListener('sessionstart', onSessionStart);

    const existingSession = gl.xr.getSession();
    if (existingSession) {
      existingSession.addEventListener('selectstart', handleSelectStart);
      existingSession.addEventListener('squeezestart', handleSqueezeStart);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        if (priorityPlayer === localSeat) {
          advancePhase(localSeat);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      gl.xr.removeEventListener('sessionstart', onSessionStart);
      const activeSession = gl.xr.getSession();
      if (activeSession) {
        activeSession.removeEventListener('selectstart', handleSelectStart);
        activeSession.removeEventListener('squeezestart', handleSqueezeStart);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  useFrame((state) => {
    const wand = wandGroupRef.current;
    const laserBeam = laserBeamMeshRef.current;
    const reticle = reticleMeshRef.current;
    if (!wand || !laserBeam || !reticle) return;

    const isPresentingVR = gl.xr.isPresenting;
    const session = gl.xr.getSession();
    const zSign = localSeat === 'P1' ? 1 : -1;

    wand.position.set(0.26 * zSign, 1.32, 3.35 * zSign);

    if (isPresentingVR && session) {
      const xrController = gl.xr.getController(0);
      if (xrController) {
        xrController.getWorldQuaternion(tempQuat.current);
        xrController.getWorldPosition(rayOriginWorld.current);

        if (rayOriginWorld.current.lengthSq() > 0.01) {
          wand.position.copy(rayOriginWorld.current);
        }
        wand.quaternion.copy(tempQuat.current);
      }

      for (const source of session.inputSources) {
        if (source.gamepad && source.gamepad.buttons.length > 1) {
          const touchpadBtn =
            source.gamepad.buttons[2] ?? source.gamepad.buttons[1];
          const isPressed = Boolean(touchpadBtn && touchpadBtn.pressed);
          if (
            isPressed &&
            !touchpadPressedLastFrame.current &&
            priorityPlayer === localSeat
          ) {
            advancePhase(localSeat);
          }
          touchpadPressedLastFrame.current = isPressed;
        }
      }
    } else {
      state.camera.position.set(rigPosition[0], rigPosition[1], rigPosition[2]);
      state.camera.lookAt(0, 0.8, 0);

      raycasterRef.current.setFromCamera(pointer, state.camera);
      const targetPoint = new THREE.Vector3()
        .copy(raycasterRef.current.ray.origin)
        .addScaledVector(raycasterRef.current.ray.direction, 3.8);

      tempMatrix.current.lookAt(
        wand.position,
        targetPoint,
        new THREE.Vector3(0, 1, 0)
      );
      wand.quaternion.setFromRotationMatrix(tempMatrix.current);
    }

    wand.updateMatrixWorld();
    rayOriginWorld.current.set(0, 0, -0.14).applyMatrix4(wand.matrixWorld);
    rayDirectionWorld.current
      .set(0, 0, -1)
      .applyQuaternion(wand.quaternion)
      .normalize();

    raycasterRef.current.set(rayOriginWorld.current, rayDirectionWorld.current);
    raycasterRef.current.near = 0.05;
    raycasterRef.current.far = MAX_LASER_DISTANCE;

    let hitDistance = MAX_LASER_DISTANCE;
    let foundInteractive: THREE.Object3D | null = null;
    let foundHoverId: string | null = null;

    if (interactableRootRef.current) {
      const intersections = raycasterRef.current.intersectObjects(
        interactableRootRef.current.children,
        true
      );

      for (const hit of intersections) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && !curr.userData?.interactableType) {
          curr = curr.parent;
        }
        if (curr && curr.userData?.interactableType) {
          hitDistance = hit.distance;
          foundInteractive = curr;
          foundHoverId =
            curr.userData.cardId ??
            curr.userData.hoverId ??
            curr.name ??
            null;
          break;
        }
      }
    }

    hitTargetRef.current = foundInteractive;

    if (isPresentingVR && foundHoverId !== hoveredObjectId) {
      setHoveredObjectId(foundHoverId);
    }

    laserBeam.scale.set(1, hitDistance, 1);
    laserBeam.position.set(0, 0, -0.14 - hitDistance * 0.5);

    reticle.position.set(0, 0, -0.14 - hitDistance + 0.01);
    reticle.visible = Boolean(foundInteractive);
  });

  return (
    <>
      <XROrigin
        position={[rigPosition[0], rigPosition[1] - 1.65, rigPosition[2]]}
        rotation={[0, rigRotationY, 0]}
      />

      <group ref={wandGroupRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.022, 0.16, 10]} />
          <meshLambertMaterial color="#1e293b" />
        </mesh>

        <mesh position={[0, 0.019, -0.025]} rotation={[-0.2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.005, 12]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>

        <mesh position={[0, 0, -0.09]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.018, 0.03, 10]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>

        <mesh ref={laserBeamMeshRef} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.0022, 0.0022, 1, 6]} />
          <meshBasicMaterial
            color="#00f0ff"
            transparent
            opacity={0.88}
          />
        </mesh>

        <mesh ref={reticleMeshRef} visible={false}>
          <sphereGeometry args={[0.02, 10, 10]} />
          <meshBasicMaterial color="#f5b041" />
        </mesh>
      </group>
    </>
  );
};
