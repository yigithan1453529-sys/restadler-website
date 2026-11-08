// Thin wrapper around the Poki SDK. Falls back to no-ops when the SDK is not
// loaded (local development, ad blockers): ads then resolve immediately and
// rewarded ads count as "not watched".

interface PokiSDKLike {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(beforeBreak?: () => void): Promise<void>;
  rewardedBreak(beforeBreak?: () => void): Promise<boolean>;
  shareableURL?(params: Record<string, string>): Promise<string>;
  getURLParam?(key: string): string | null | undefined;
}

declare global {
  interface Window {
    PokiSDK?: PokiSDKLike;
  }
}

let gameplayActive = false;
let ready = false;
let adRunning = false;

/** Called around every ad: pause the game and mute the sound. */
let onAdStart: () => void = () => {};
let onAdEnd: () => void = () => {};

function sdk(): PokiSDKLike | undefined {
  return typeof window !== "undefined" ? window.PokiSDK : undefined;
}

export const poki = {
  /** A link that opens the game with these parameters (on Poki: the game page). */
  async shareableURL(params: Record<string, string>): Promise<string> {
    try {
      const fn = sdk()?.shareableURL;
      if (fn) return await fn.call(sdk(), params);
    } catch {
      /* fall back to the current page */
    }
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url.toString();
  },
  /** Reads a parameter from the link the game was opened with. */
  getURLParam(key: string): string | null {
    try {
      const v = sdk()?.getURLParam?.(key);
      if (v) return v;
    } catch {
      /* ignore */
    }
    try {
      return new URLSearchParams(window.location.search).get(key);
    } catch {
      return null;
    }
  },
  async init(): Promise<void> {
    try {
      if (sdk()) {
        // Do not wait forever if the SDK hangs (e.g. blocked network).
        await Promise.race([sdk()!.init(), new Promise((r) => setTimeout(r, 4000))]);
        ready = true;
      }
    } catch {
      // Ad blocker or SDK missing: keep playing without it.
    }
  },
  /** True when the real Poki SDK is available (rewarded ads can be offered). */
  get available(): boolean {
    return ready && !!sdk();
  },
  setAdHandlers(start: () => void, end: () => void): void {
    onAdStart = start;
    onAdEnd = end;
  },
  /** Ad break when the player wants to continue (next level, retry after a fail). */
  async commercialBreak(): Promise<void> {
    const s = sdk();
    if (!ready || !s || adRunning) return;
    adRunning = true;
    try {
      await s.commercialBreak(() => onAdStart());
    } catch {
      /* no ad */
    } finally {
      adRunning = false;
      onAdEnd();
    }
  },
  /** Rewarded ad, only after a clear choice by the player. Resolves to true if it was watched. */
  async rewardedBreak(): Promise<boolean> {
    const s = sdk();
    if (!ready || !s || adRunning) return false;
    adRunning = true;
    try {
      return await s.rewardedBreak(() => onAdStart());
    } catch {
      return false;
    } finally {
      adRunning = false;
      onAdEnd();
    }
  },
  loadingFinished(): void {
    try {
      sdk()?.gameLoadingFinished();
    } catch {
      /* no-op */
    }
  },
  /** Never sends the same event twice in a row. */
  gameplayStart(): void {
    if (gameplayActive) return;
    gameplayActive = true;
    try {
      sdk()?.gameplayStart();
    } catch {
      /* no-op */
    }
  },
  gameplayStop(): void {
    if (!gameplayActive) return;
    gameplayActive = false;
    try {
      sdk()?.gameplayStop();
    } catch {
      /* no-op */
    }
  },
};
