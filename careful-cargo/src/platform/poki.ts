// Thin wrapper around the Poki SDK. Falls back to no-ops when the SDK is not
// loaded (local development). Ads (commercialBreak / rewardedBreak) will be
// wired up in milestone 2.

interface PokiSDKLike {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
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
