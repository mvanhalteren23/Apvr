'use client';

let polyfillsInitialized = false;

export interface PicoBrowserDiagnostics {
  browserLabel: string;
  isFirefoxReality: boolean;
  geckoMajorVersion: number | null;
  hasNativeWebXR: boolean;
  hasLegacyWebVR: boolean;
  polyfillActive: boolean;
  isSecureContext: boolean;
}

function applyESRuntimePolyfills(): void {
  if (typeof window === 'undefined') return;

  // 1. Array.prototype.at & TypedArray.prototype.at (Added in Firefox 90; missing in GeckoView 77-81)
  if (!Array.prototype.at) {
    Object.defineProperty(Array.prototype, 'at', {
      value: function <T>(this: T[], index: number): T | undefined {
        const len = this.length;
        const k = index >= 0 ? index : len + index;
        return k >= 0 && k < len ? this[k] : undefined;
      },
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }

  const typedArrays = [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
  ];
  for (const TypedArr of typedArrays) {
    if (TypedArr && !TypedArr.prototype.at) {
      Object.defineProperty(TypedArr.prototype, 'at', {
        value: function (
          this: ArrayLike<number>,
          index: number
        ): number | undefined {
          const len = this.length;
          const k = index >= 0 ? index : len + index;
          return k >= 0 && k < len ? this[k] : undefined;
        },
        writable: true,
        enumerable: false,
        configurable: true,
      });
    }
  }

  // 2. Object.hasOwn (Added in Firefox 92; missing in GeckoView 77-81)
  const objCtor = Object as unknown as {
    hasOwn?: (o: object, p: PropertyKey) => boolean;
  };
  if (!objCtor.hasOwn) {
    objCtor.hasOwn = (obj: object, prop: PropertyKey): boolean =>
      Object.prototype.hasOwnProperty.call(obj, prop);
  }

  // 3. crypto.randomUUID (Added in Firefox 95; missing in GeckoView 77-81)
  if (
    typeof crypto !== 'undefined' &&
    typeof (crypto as unknown as { randomUUID?: () => string }).randomUUID !==
      'function'
  ) {
    (crypto as unknown as { randomUUID: () => string }).randomUUID = () => {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
      return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
        .slice(6, 8)
        .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
    };
  }

  // 4. structuredClone fallback (Added in Firefox 94; missing in GeckoView 77-81)
  if (typeof globalThis.structuredClone !== 'function') {
    (globalThis as unknown as { structuredClone: <T>(v: T) => T }).structuredClone =
      <T,>(value: T): T => {
        if (value === null || typeof value !== 'object') return value;
        return JSON.parse(JSON.stringify(value)) as T;
      };
  }
}

export function initFirefoxPicoPolyfills(): void {
  if (typeof window === 'undefined' || polyfillsInitialized) return;
  polyfillsInitialized = true;

  applyESRuntimePolyfills();

  // Bridge WebVR 1.1 -> WebXR on older Firefox Reality builds if navigator.xr is absent
  const nav = navigator as unknown as {
    xr?: XRSystem;
    getVRDisplays?: () => Promise<unknown[]>;
  };

  if (!nav.xr && typeof nav.getVRDisplays === 'function') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const WebXRPolyfillModule = require('webxr-polyfill');
      const PolyfillCtor =
        WebXRPolyfillModule?.default ?? WebXRPolyfillModule;
      if (typeof PolyfillCtor === 'function') {
        new PolyfillCtor({
          cardboard: false,
          webvr: true,
        });
      }
    } catch {
      // Ignore if polyfill cannot bind
    }
  }
}

export function detectPicoBrowserDiagnostics(): PicoBrowserDiagnostics {
  if (typeof window === 'undefined') {
    return {
      browserLabel: 'SSR',
      isFirefoxReality: false,
      geckoMajorVersion: null,
      hasNativeWebXR: false,
      hasLegacyWebVR: false,
      polyfillActive: false,
      isSecureContext: true,
    };
  }

  initFirefoxPicoPolyfills();

  const ua = navigator.userAgent || '';
  const nav = navigator as unknown as {
    xr?: XRSystem;
    getVRDisplays?: () => Promise<unknown[]>;
  };

  const isFirefoxReality =
    /FirefoxReality|Mobile VR|Wolvic|GeckoView|Firefox/i.test(ua);
  const rvMatch = ua.match(/rv:(\d+)\./i) || ua.match(/Firefox\/(\d+)\./i);
  const geckoMajorVersion = rvMatch ? parseInt(rvMatch[1], 10) : null;

  const hasNativeWebXR = Boolean(nav.xr);
  const hasLegacyWebVR = typeof nav.getVRDisplays === 'function';

  let browserLabel = 'Desktop / Standard Browser';
  if (/FirefoxReality/i.test(ua)) {
    browserLabel = `Firefox Reality (Gecko ${geckoMajorVersion ?? '10-12'})`;
  } else if (/Wolvic/i.test(ua)) {
    browserLabel = `Wolvic XR (Gecko ${geckoMajorVersion ?? '?'})`;
  } else if (/Firefox/i.test(ua)) {
    browserLabel = `Firefox / Gecko ${geckoMajorVersion ?? ''}`.trim();
  } else if (/Pico/i.test(ua)) {
    browserLabel = 'Pico Built-in Browser';
  }

  return {
    browserLabel,
    isFirefoxReality,
    geckoMajorVersion,
    hasNativeWebXR,
    hasLegacyWebVR,
    polyfillActive: hasLegacyWebVR && hasNativeWebXR,
    isSecureContext: window.isSecureContext,
  };
}

export function unlockWebAudioForVR(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => undefined);
    }
    const buffer = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(0);
    setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 200);
  } catch {
    // Ignore audio unlock errors
  }
}
