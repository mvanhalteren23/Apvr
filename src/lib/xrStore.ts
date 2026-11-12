'use client';

import { createXRStore, type XRStoreOptions } from '@react-three/xr';
import {
  initFirefoxPicoPolyfills,
  unlockWebAudioForVR,
} from './firefoxPicoPolyfills';

initFirefoxPicoPolyfills();

export type PicoG2XRStoreConfig = XRStoreOptions & {
  defaultControllerProfileId?: string;
};

const picoG2StoreOptions: PicoG2XRStoreConfig = {
  defaultControllerProfileId: 'generic-trigger',
  hand: false,
  meshDetection: false,
  planeDetection: false,
  depthSensing: false,
  hitTest: false,
  domOverlay: false,
  foveation: 1,
  frameRate: 'high',
};

export const xrStore = createXRStore(picoG2StoreOptions);

export async function enterPicoVR(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  initFirefoxPicoPolyfills();
  unlockWebAudioForVR();

  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return {
      ok: false,
      reason: 'HTTPS is required for WebXR in Firefox Reality on Pico G2.',
    };
  }

  try {
    await xrStore.enterVR();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason:
        err instanceof Error
          ? err.message
          : 'WebXR immersive-vr session not available on this device.',
    };
  }
}
