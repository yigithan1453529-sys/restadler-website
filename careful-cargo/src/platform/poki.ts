// Thin wrapper around the Poki SDK. Falls back to no-ops when the SDK is not
// loaded (local development). Ads (commercialBreak / rewardedBreak) will be
// wired up in milestone 2.

interface PokiSDKLike {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  shareableURL?(params: Record<string, string>): Promise<string>;
  getURLParam?(key: string): string | null | undefined;
}

declare global {
  interface Window {
    PokiSDK?: PokiSDKLike;
  }
}

let gameplayActive = false;

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
      await sdk()?.init();
    } catch {
      // Ad blocker or SDK missing: keep playing without it.
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
