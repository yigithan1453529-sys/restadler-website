import { t, type TextKey } from "../i18n";
import { getLevel, levels, worldPages } from "../levels";
import { drawIsland, drawMap, islandButtons, islandOf, mapButtons, type MapHost } from "../ui/WorldMap";
import { poki } from "../platform/poki";
import { addCoins, addOwnedPaint, addOwnedVehicle, loadSave, saveLevelResult, skipLevelSave, saveMuted, savePaint, saveRecord, saveVehicle, saveUpgrade, spendCoins, upgradeLevel, loadGhost, saveGhost, GHOST_STEP, type Ghost } from "../storage";
import {
  dailyButtons,
  drawDaily,
  drawHomeBadges,
  drawMissions,
  drawTrophies,
  missionButtons,
  trophyButtons,
  drawGarage,
  drawHome,
  drawRanking,
  drawShop,
  drawToast,
  garageButtons,
  homeButtons,
  rankingButtons,
  shopButtons,
  type MenuHost,
} from "../ui/Menus";
import { addStats, claimGift, claimMission, pendingGift, TROPHY_REWARD, type StatKey, type Trophy } from "../progress";
import { bestFriendRecord, displayName, formatTime, friendRanking, inviteFriend, receiveChallenge, rerollName } from "../social";
import { Button, drawButton, hitButton, sameButton } from "../ui/Button";
import { drawHint, drawHud, drawNitroGauge, drawPickedCoins, drawSpeedometer, drawTimer } from "../ui/Hud";
import {
  drawFailScreen,
  drawPauseScreen,
  drawWinScreen,
  PANEL,
} from "../ui/Screens";
import { drawTouchControls } from "../ui/TouchControls";
import { drawCoin, outlinedText } from "../ui/draw";
import { AudioFx } from "./Audio";
import { Camera, VIEW_W } from "./Camera";
import { Input } from "./Input";
import { LevelRun } from "./Level";
import { Particles } from "./Particles";
import { Renderer } from "./Renderer";
import { getPaint, PAINTS } from "./paints";
import { getVehicleSpec, MAX_UPGRADE, UPGRADE_PRICES, upgradedSpec, VEHICLES } from "./Vehicle";

/**
 * ready    – level loaded, waiting for the first input
 * playing  – driving
 * paused   – pause menu
 * won      – success screen
 * failed   – fail screen
 * levels   – world map with the islands
 * island   – one island with its 10 level stops
 * home     – start screen (Play, Levels, Garage, Shop)
 * garage   – choose vehicle and color
 * shop     – buy vehicles and colors with coins
 * ranking  – friends ranking and own records
 * missions – three daily missions
 * trophies – trophies (achievements)
 * daily    – the daily gift popup over the home screen
 */
export type GameState =
  | "ready"
  | "playing"
  | "paused"
  | "won"
  | "failed"
  | "levels"
  | "island"
  | "home"
  | "garage"
  | "shop"
  | "ranking"
  | "missions"
  | "trophies"
  | "daily";

const FAIL_TEXT: Record<string, TextKey> = {
  allLost: "fail.allLost",
  flipped: "fail.flipped",
  fell: "fail.fell",
};

const ISLAND_BONUS = 100;
const HARD_LANDING = 2.0; // impact per kg that counts as a hard landing
/** Seconds the camera shows the customer's reaction before the result panel opens. */
const WIN_DELAY = 1.4;
const STAR_DELAY = (i: number): number => WIN_DELAY + 0.45 + i * 0.35;

export class Game {
  state: GameState = "ready";
  private run!: LevelRun;
  private levelId = 1;
  private camera = new Camera();
  private particles = new Particles();
  private renderer: Renderer;
  private audio: AudioFx;
  private time = 0;
  private stateTime = 0;
  /** Island shown in the island view. */
  private levelPage = 0;
  private mapHost: MapHost;
  private buttons: Button[] = [];
  private hover: Button | null = null;
  private pressed: Button | null = null;
  private hint: { text: TextKey; left: number } | null = null;
  private hintsShown = new Set<number>();
  private lostFlash = new Map<number, number>();
  private impactCooldown = 0;
  private bumpCooldown = 0;
  private dustTimer = 0;
  private starsPopped = 0;
  private resultStars = 0;
  private coinsEarned = 0;
  /** Best run of this level, replayed as a see-through vehicle. */
  private ghost: Ghost | null = null;
  private ghostRecording: number[] = [];
  private statsAfterWin: Partial<Record<StatKey, number>> = {};
  private coinsDoubled = false;
  private adRunning = false;
  private failCount = new Map<number, number>();
  private shopTab: "vehicles" | "paints" = "vehicles";
  private rankingTab: "friends" | "records" = "friends";
  private newRecord = false;
  private rival: string | null = null;
  private rivalBeat = false;
  private toast: { text: string; good: boolean; left: number } | null = null;
  private host: MenuHost;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private input: Input,
  ) {
    this.renderer = new Renderer(ctx);
    const self = this;
    this.host = {
      get levelId() {
        return self.levelId;
      },
      get muted() {
        return self.audio.muted;
      },
      get time() {
        return self.time;
      },
      get shopTab() {
        return self.shopTab;
      },
      get rankingTab() {
        return self.rankingTab;
      },
      openRanking: (tab) => {
        if (tab) this.rankingTab = tab;
        this.setState("ranking");
      },
      invite: () => {
        void inviteFriend().then((msg) => (this.toast = { text: msg, good: true, left: 2.5 }));
      },
      rerollName: () => rerollName(),
      openMissions: () => this.setState("missions"),
      openTrophies: () => {
        this.setState("trophies");
        this.trophyToasts(addStats({}));
      },
      claimMission: (id) => {
        if (claimMission(id)) {
          this.audio.coin(true);
          this.particles.confettiBurst(VIEW_W);
        }
      },
      claimGift: () => {
        const coins = claimGift();
        if (coins > 0) {
          this.audio.success();
          this.particles.confettiBurst(VIEW_W);
          this.toast = { text: `+${coins}`, good: true, left: 2 };
        }
        this.setState("home");
      },
      play: () => this.loadLevel(this.levelId),
      openLevels: () => this.openLevels(),
      openGarage: () => this.setState("garage"),
      openShop: (tab) => {
        if (tab) this.shopTab = tab;
        this.setState("shop");
      },
      goHome: () => this.goHome(),
      toggleMute: () => this.toggleMute(),
      selectVehicle: (id) => saveVehicle(id),
      selectPaint: (id) => savePaint(loadSave().vehicle, id),
      buyVehicle: (id) => this.buy(VEHICLES.find((v) => v.id === id)?.price ?? Infinity, () => {
        addOwnedVehicle(id);
        saveVehicle(id);
      }),
      buyUpgrade: (kind) => {
        const veh = loadSave().vehicle;
        const level = upgradeLevel(veh, kind);
        if (level >= MAX_UPGRADE) return;
        this.buy(UPGRADE_PRICES[level], () => saveUpgrade(veh, kind, level + 1));
      },
      buyPaint: (id) => this.buy(PAINTS.find((p) => p.id === id)?.price ?? Infinity, () => {
        addOwnedPaint(id);
        savePaint(loadSave().vehicle, id);
      }),
    };
    const save = loadSave();
    this.audio = new AudioFx(save.muted);

    input.onGesture = () => this.audio.unlock();
    input.onKey = (code) => this.onKey(code);
    input.onPointerDown = (x, y) => {
      const b = hitButton(this.buttons, x, y);
      this.pressed = b;
      return b !== null || this.isMenuState();
    };
    input.onPointerUp = (x, y) => {
      const b = hitButton(this.buttons, x, y);
      if (b && sameButton(b, this.pressed) && !b.disabled) {
        this.audio.click();
        b.action();
      }
      this.pressed = null;
    };
    input.onPointerMove = (x, y) => {
      this.hover = hitButton(this.buttons, x, y);
    };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (this.state === "playing" || this.state === "ready") this.pause();
        this.audio.setSuspended(true);
      } else if (this.state !== "paused") {
        this.audio.setSuspended(false);
      }
    });

    this.mapHost = {
      get levelId() {
        return self.levelId;
      },
      get time() {
        return self.time;
      },
      openIsland: (i) => this.openIsland(i),
      openMap: () => this.openLevels(),
      goHome: () => this.goHome(),
      playLevel: (id) => this.loadLevel(id),
    };

    // Ads: pause the game and mute the sound while an ad runs.
    poki.setAdHandlers(
      () => {
        this.adRunning = true;
        this.audio.setSuspended(true);
      },
      () => {
        this.adRunning = false;
        if (this.state !== "paused") this.audio.setSuspended(false);
      },
    );

    // Prepare the furthest unlocked level. Brand-new players start driving right
    // away (level 1, no menu); everybody else starts on the home screen.
    this.loadLevel(Math.min(save.unlocked, levels.length));
    const isNewPlayer = Object.keys(save.stars).length === 0 && save.coins === 0;
    if (!isNewPlayer) this.goHome();
    // Opened with a friend's challenge link?
    const friend = receiveChallenge();
    if (friend) {
      this.toast = { text: t("challenge.new", { name: displayName(friend) }), good: true, left: 4 };
      this.rankingTab = "friends";
    }
  }

  private goHome(): void {
    // The daily gift pops up over the home screen once a day.
    this.setState(pendingGift() ? "daily" : "home");
    this.input.releaseAll();
  }

  /** Where the ghost is right now (interpolated), or null. */
  private ghostPose(): { x: number; y: number; angle: number; vehicle: string } | null {
    const g = this.ghost;
    const run = this.run;
    if (!g || !run.started || run.state !== "running" || g.samples.length < 6) return null;
    const f = run.time / GHOST_STEP;
    const i = Math.floor(f);
    const n = g.samples.length / 3;
    if (i >= n - 1) return null;
    const k = f - i;
    const at = (j: number, o: number): number => g.samples[j * 3 + o];
    return {
      x: at(i, 0) + (at(i + 1, 0) - at(i, 0)) * k,
      y: at(i, 1) + (at(i + 1, 1) - at(i, 1)) * k,
      angle: at(i, 2) + (at(i + 1, 2) - at(i, 2)) * k,
      vehicle: g.vehicle,
    };
  }

  /** Shows a message for every newly unlocked trophy (one after another). */
  private trophyToasts(fresh: Trophy[]): void {
    fresh.forEach((tr, i) => {
      window.setTimeout(() => {
        this.toast = { text: t("trophy.unlocked", { name: t(tr.name), n: TROPHY_REWARD }), good: true, left: 3 };
        this.audio.coin(true);
      }, 1800 + i * 3200);
    });
  }

  /** Pays with coins and runs `give` on success; shows a short message either way. */
  private buy(price: number, give: () => void): void {
    if (spendCoins(price)) {
      give();
      this.trophyToasts(addStats({ purchases: 1 }));
      this.audio.success();
      this.particles.confettiBurst(VIEW_W);
      this.toast = { text: t("shop.bought"), good: true, left: 1.6 };
    } else {
      this.audio.oops();
      this.toast = { text: t("shop.noCoins"), good: false, left: 1.6 };
    }
  }

  private isMenuState(): boolean {
    return ["paused", "won", "failed", "levels", "island", "home", "garage", "shop", "ranking", "missions", "trophies", "daily"].includes(
      this.state,
    );
  }

  // ---------- state changes ----------

  loadLevel(id: number): void {
    this.levelId = id;
    const save = loadSave();
    const spec = upgradedSpec(getVehicleSpec(save.vehicle), save.upgrades[save.vehicle] ?? {});
    this.beginRun(new LevelRun(getLevel(id), spec));
  }

  /** Shared setup for a fresh attempt or a continue from a checkpoint. */
  private beginRun(run: LevelRun): void {
    this.run = run;
    this.ghostRecording = [];
    this.ghost = run.resumed ? null : loadGhost(run.level.id);
    this.coinsEarned = 0;
    this.coinsDoubled = false;
    this.particles.clear();
    this.lostFlash.clear();
    this.hintsShown.clear();
    this.hint = null;
    this.starsPopped = 0;
    this.impactCooldown = 0.5;
    const p = this.run.vehicle.position;
    this.camera.snap(p.x, p.y);
    for (const [i, h] of this.run.level.hints.entries()) {
      if (h.x <= p.x) {
        this.hint = { text: h.text, left: Infinity };
        this.hintsShown.add(i);
      }
    }
    this.setState("ready");
    this.input.releaseAll();
    this.audio.stopEngine();
  }

  private setState(s: GameState): void {
    this.state = s;
    this.stateTime = 0;
    this.hover = null;
    if (s === "playing") {
      poki.gameplayStart();
      this.audio.startEngine();
    } else {
      poki.gameplayStop();
    }
    if (s !== "playing" && s !== "ready") this.audio.stopEngine();
    if (s === "paused") this.audio.setSuspended(true);
    else this.audio.setSuspended(false);
  }

  /** First input or the Start button: the delivery begins. */
  private start(): void {
    if (this.state !== "ready") return;
    this.run.started = true;
    this.setState("playing");
    if (this.hint && this.hint.left === Infinity) this.hint.left = 2.5;
  }

  restart(): void {
    this.loadLevel(this.levelId);
  }

  /** Runs `then` after a Poki ad break (the player wants to keep playing). */
  private afterCommercial(then: () => void): void {
    if (this.adRunning) return;
    this.buttons = [];
    void poki.commercialBreak().then(then);
  }

  /** Offers a rewarded ad; `reward` only runs if the ad was watched. */
  private rewarded(reward: () => void): void {
    if (this.adRunning) return;
    void poki.rewardedBreak().then((ok) => {
      if (ok) reward();
      else this.toast = { text: t("ad.notWatched"), good: false, left: 2 };
    });
  }

  private nextLevel(): void {
    this.afterCommercial(() => {
      const pages = worldPages();
      const island = islandOf(this.levelId, pages);
      const lastOnIsland = pages[island].levels[pages[island].levels.length - 1].id === this.levelId;
      if (lastOnIsland || this.levelId >= levels.length) {
        // Island done: show the map with the next island.
        this.levelId = Math.min(this.levelId + 1, levels.length);
        this.loadLevel(this.levelId);
        this.openLevels();
      } else {
        this.loadLevel(this.levelId + 1);
      }
    });
  }

  /** Retry after a fail: an ad break may come first. */
  private retryAfterFail(): void {
    this.afterCommercial(() => this.restart());
  }

  private continueFromCheckpoint(): void {
    const prev = this.run;
    const cp = Math.max(...prev.reachedCheckpoints);
    this.rewarded(() => {
      this.beginRun(new LevelRun(prev.level, prev.vehicle.spec, { x: cp + 2, from: prev }));
    });
  }

  private skipLevel(): void {
    this.rewarded(() => {
      skipLevelSave(this.levelId, levels.length);
      this.failCount.delete(this.levelId);
      this.loadLevel(Math.min(this.levelId + 1, levels.length));
    });
  }

  private doubleCoins(): void {
    this.rewarded(() => {
      addCoins(this.coinsEarned);
      this.coinsEarned *= 2;
      this.coinsDoubled = true;
      this.audio.pop(2);
    });
  }

  private pause(): void {
    if (this.state === "playing" || this.state === "ready") this.setState("paused");
  }

  private resume(): void {
    if (this.state !== "paused") return;
    // Back to "ready" if the player never started driving.
    this.setState(this.run.started ? "playing" : "ready");
    this.input.releaseAll();
  }

  /** World map with the islands. */
  private openLevels(): void {
    this.levelPage = islandOf(this.levelId, worldPages());
    this.setState("levels");
  }

  private openIsland(index: number): void {
    this.levelPage = Math.max(0, Math.min(index, worldPages().length - 1));
    this.setState("island");
  }

  private toggleMute(): void {
    this.audio.setMuted(!this.audio.muted);
    saveMuted(this.audio.muted);
  }

  private onKey(code: string): void {
    if (code === "KeyR") {
      if (this.state === "failed") this.retryAfterFail();
      else if (["ready", "playing", "paused", "won"].includes(this.state)) this.restart();
      return;
    }
    if (code === "Escape" && ["garage", "shop", "ranking", "missions", "trophies"].includes(this.state)) {
      this.goHome();
      return;
    }
    if (code === "Escape" || code === "KeyP") {
      if (this.state === "playing" || this.state === "ready") this.pause();
      else if (this.state === "paused") this.resume();
      else if (this.state === "levels") this.goHome();
      else if (this.state === "island") this.openLevels();
      return;
    }
    if (code === "Enter" || code === "Space" || code === "NumpadEnter") {
      const primary = this.buttons.find((b) => b.primary);
      if (primary && (this.isMenuState() || this.state === "ready") && !["shop", "ranking", "missions"].includes(this.state)) {
        this.audio.click();
        primary.action();
      }
    }
  }

  // ---------- update ----------

  update(dt: number): void {
    this.time += dt;
    this.stateTime += dt;
    const run = this.run;

    if (this.state === "ready" && (this.input.gas || this.input.brake)) this.start();

    const simulate = this.state === "ready" || this.state === "playing" || this.state === "won" || this.state === "failed";
    if (simulate) {
      const drive =
        this.state === "playing"
          ? { gas: this.input.gas, brake: this.input.brake, nitro: this.input.nitro }
          : { gas: false, brake: false };
      run.update(dt, drive);
      this.handleEffects(dt);
      if (this.state === "playing") {
        // record this run for a future ghost
        while (run.started && this.ghostRecording.length / 3 <= run.time / GHOST_STEP) {
          const c = run.vehicle.chassis;
          const p = c.getPosition();
          this.ghostRecording.push(Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100, Math.round(c.getAngle() * 100) / 100);
        }
        this.checkRunEnd();
      }
      const p = run.vehicle.position;
      if (this.state === "won") this.camera.follow(run.level.finishX - 1, p.y, 0, dt);
      else this.camera.follow(p.x, p.y, run.vehicle.speed, dt);
    }

    if (this.state === "playing" || this.state === "ready") {
      const v = run.vehicle;
      this.audio.updateEngine(v.rpm, v.gear, v.throttle);
      this.updateHints(dt);
    }

    if (this.state === "won") {
      while (this.starsPopped < this.resultStars && this.stateTime > STAR_DELAY(this.starsPopped)) {
        this.audio.pop(this.starsPopped);
        this.starsPopped++;
        if (this.starsPopped === 3) this.particles.confettiBurst(VIEW_W);
      }
    }

    for (const [id, v] of this.lostFlash) {
      if (v <= dt * 2) this.lostFlash.delete(id);
      else this.lostFlash.set(id, v - dt * 2);
    }
    if (this.toast) {
      this.toast.left -= dt;
      if (this.toast.left <= 0) this.toast = null;
    }
    if (this.state !== "paused") this.particles.update(dt);
    this.buttons = this.buildButtons();
  }

  private handleEffects(dt: number): void {
    const run = this.run;
    const v = run.vehicle;

    for (const item of run.brokenThisFrame) {
      const at = item.brokenAt ?? v.position;
      this.particles.splat(at.x, at.y);
      this.audio.crack();
    }
    for (const item of run.lostThisFrame) {
      const at = item.brokenAt ?? item.body?.getPosition() ?? v.position;
      const text = item.lostReason === "melted" ? t("melted") : item.lostReason === "spilled" ? t("spilled") : t("oops");
      this.particles.text(text, at.x, at.y + 0.6);
      this.lostFlash.set(item.id, 1);
      if (item.lostReason === "melted") this.particles.splat(at.x, at.y, "#FF9EC7");
      if (item.lostReason === "spilled") this.particles.splat(at.x, at.y + 0.3, "#7FD3FF");
      if (item.lostReason !== "broken") this.audio.oops();
    }
    this.bumpCooldown -= dt;
    for (const item of run.bumpedThisFrame) {
      if (this.bumpCooldown > 0 || !item.body) continue;
      const at = item.body.getPosition();
      this.particles.text(t("whoa"), at.x, at.y + 1.0);
      this.audio.whoa();
      this.bumpCooldown = 1.2;
    }

    this.impactCooldown -= dt;
    if (run.impactThisFrame > HARD_LANDING && this.impactCooldown <= 0) {
      const strength = Math.min(1, (run.impactThisFrame - HARD_LANDING) / 5);
      this.camera.shake(strength);
      this.audio.thump(strength);
      this.impactCooldown = 0.3;
      const rw = v.rearWheel.getPosition();
      const fw = v.frontWheel.getPosition();
      this.particles.dust(rw.x, rw.y - 0.4, 0, 3);
      this.particles.dust(fw.x, fw.y - 0.4, 0, 3);
    }

    // dust when pulling away
    if (v.onGround && v.throttle > 0 && Math.abs(v.speed) < 5) {
      this.dustTimer -= dt;
      if (this.dustTimer <= 0) {
        this.dustTimer = 0.04;
        const rw = v.rearWheel.getPosition();
        this.particles.dust(rw.x, rw.y - 0.4, Math.sign(v.speed || 1), 1);
      }
    }

    if (run.checkpointThisFrame !== null) this.audio.checkpoint();

    // Coins and the bonus star
    for (const p of run.pickedThisFrame) {
      this.particles.splat(p.x, p.y, "#FFD23F");
      this.audio.coin(p.kind === "star");
      if (p.kind === "star") this.particles.text("+10", p.x, p.y + 0.8);
    }

    // Nitro fired: whoosh, count it for missions and trophies.
    if (run.nitroThisFrame) {
      this.audio.nitro();
      this.camera.shake(0.15);
      this.trophyToasts(addStats({ nitroUsed: 1 }));
    }

    // Gear change: blip and a little exhaust puff.
    if (run.shiftedThisFrame) {
      this.audio.shift();
      const back = v.chassis.getWorldPoint({ x: -1.55, y: -0.1 });
      this.particles.dust(back.x, back.y, 1, 4);
    }
  }

  private checkRunEnd(): void {
    const run = this.run;
    if (run.state === "won") {
      this.resultStars = run.stars;
      const { firstClear } = saveLevelResult(this.levelId, run.stars, levels.length);
      // Coins: 10 per star, 20 extra the first time a level is finished,
      // 100 extra the first time an island finale is finished.
      const pages = worldPages();
      const isl = pages[islandOf(this.levelId, pages)];
      const islandFinale = isl.levels[isl.levels.length - 1].id === this.levelId;
      this.coinsEarned = run.stars * 10 + (firstClear ? 20 : 0) + (firstClear && islandFinale ? ISLAND_BONUS : 0) + run.pickedValue;
      if (firstClear && islandFinale) this.toast = { text: t("island.complete", { n: ISLAND_BONUS }), good: true, left: 4 };
      const kept = run.cargo.items.filter((i) => !i.lost);
      this.statsAfterWin = {
        levelsWon: 1,
        threeStars: run.stars === 3 ? 1 : 0,
        cratesDelivered: kept.filter((i) => i.type === "crate").length,
        eggsDelivered: kept.filter((i) => i.type === "egg").length,
        cargoDelivered: kept.length,
        coinsPicked: run.pickups.filter((p) => p.taken && p.kind === "coin").length,
        starsPicked: run.pickups.some((p) => p.taken && p.kind === "star") ? 1 : 0,
        finalesWon: firstClear && islandFinale ? 1 : 0,
      };
      addCoins(this.coinsEarned);
      this.newRecord = saveRecord(this.levelId, run.stars, run.time);
      if (this.newRecord && !run.resumed) saveGhost(this.levelId, { vehicle: run.vehicle.spec.id, samples: this.ghostRecording });
      this.trophyToasts(addStats({ ...this.statsAfterWin, recordsSet: this.newRecord ? 1 : 0 }));
      const friend = bestFriendRecord(this.levelId);
      this.rival = null;
      if (friend) {
        const beat = run.stars > friend.rec.s || (run.stars === friend.rec.s && run.time < friend.rec.t);
        this.rivalBeat = beat;
        this.rival = beat
          ? t("win.beat", { name: friend.name, time: formatTime(friend.rec.t) })
          : t("win.behind", { name: friend.name, time: formatTime(friend.rec.t) });
      }
      this.failCount.delete(this.levelId);
      this.setState("won");
      this.audio.success();
    } else if (run.state === "failed") {
      this.failCount.set(this.levelId, (this.failCount.get(this.levelId) ?? 0) + 1);
      this.setState("failed");
      this.audio.fail();
    }
  }

  private updateHints(dt: number): void {
    const x = this.run.vehicle.position.x;
    for (const [i, h] of this.run.level.hints.entries()) {
      if (!this.hintsShown.has(i) && x >= h.x) {
        this.hintsShown.add(i);
        this.hint = { text: h.text, left: 3.5 };
      }
    }
    if (this.hint && this.hint.left !== Infinity) {
      this.hint.left -= dt;
      if (this.hint.left <= 0) this.hint = null;
    }
  }

  // ---------- buttons ----------

  private buildButtons(): Button[] {
    const list: Button[] = [];
    const s = this.state;
    if (s === "ready") {
      list.push({
        x: VIEW_W / 2 - 160,
        y: 250,
        w: 320,
        h: 110,
        label: t("btn.start"),
        icon: "play",
        primary: true,
        action: () => this.start(),
      });
    }
    if (s === "ready" || s === "playing") {
      const size = 68;
      const y = 14;
      list.push(
        { x: 202, y, w: size, h: size, icon: "home", action: () => this.goHome() },
        { x: VIEW_W - 20 - size * 3 - 24, y, w: size, h: size, icon: "restart", action: () => this.restart() },
        { x: VIEW_W - 20 - size * 2 - 12, y, w: size, h: size, icon: "pause", action: () => this.pause() },
        {
          x: VIEW_W - 20 - size,
          y,
          w: size,
          h: size,
          icon: this.audio.muted ? "soundOff" : "soundOn",
          action: () => this.toggleMute(),
        },
      );
    }
    const cx = PANEL.x + PANEL.w / 2;
    const bottom = PANEL.y + PANEL.h;
    if (this.adRunning) return list;
    if (s === "won" && this.stateTime > WIN_DELAY + 0.3 && this.coinsEarned > 0 && !this.coinsDoubled && poki.available) {
      list.push({ x: PANEL.x + PANEL.w - 150, y: PANEL.y + 82, w: 130, h: 52, label: "×2", icon: "ad", action: () => this.doubleCoins() });
    }
    if (s === "won" && this.stateTime > WIN_DELAY + 0.3) {
      const last = this.levelId >= levels.length;
      list.push(
        { x: cx - 120, y: bottom - 150, w: 240, h: 88, label: last ? t("btn.levels") : t("btn.next"), icon: last ? "menu" : "next", primary: true, action: () => this.nextLevel() },
        { x: PANEL.x + 36, y: bottom - 138, w: 136, h: 64, label: t("btn.retry"), action: () => this.restart() },
        { x: PANEL.x + PANEL.w - 172, y: bottom - 138, w: 136, h: 64, label: t("btn.home"), action: () => this.goHome() },
      );
    } else if (s === "failed" && this.stateTime > 0.3) {
      list.push(
        { x: cx - 140, y: bottom - 200, w: 280, h: 92, label: t("btn.retry"), icon: "restart", primary: true, action: () => this.retryAfterFail() },
        { x: cx - 80, y: bottom - 90, w: 160, h: 60, label: t("btn.home"), action: () => this.goHome() },
      );
      // Rewarded ads, clearly marked: continue from a checkpoint / skip a hard level.
      const offers: Button[] = [];
      // Continue only makes sense with some cargo left.
      if (poki.available && this.run.reachedCheckpoints.length > 0 && this.run.cargo.delivered > 0) {
        offers.push({ x: 0, y: bottom - 300, w: 270, h: 70, label: t("btn.continue"), icon: "ad", action: () => this.continueFromCheckpoint() });
      }
      if (poki.available && (this.failCount.get(this.levelId) ?? 0) >= 3 && this.levelId < levels.length) {
        offers.push({ x: 0, y: bottom - 300, w: 270, h: 70, label: t("btn.skip"), icon: "ad", action: () => this.skipLevel() });
      }
      const total = offers.length * 270 + (offers.length - 1) * 20;
      offers.forEach((b, i) => {
        b.x = cx - total / 2 + i * 290;
        list.push(b);
      });
    } else if (s === "paused") {
      list.push(
        { x: cx - 140, y: bottom - 220, w: 280, h: 92, label: t("btn.resume"), icon: "play", primary: true, action: () => this.resume() },
        { x: PANEL.x + 60, y: bottom - 105, w: 220, h: 64, label: t("btn.retry"), action: () => this.restart() },
        { x: PANEL.x + PANEL.w - 280, y: bottom - 105, w: 220, h: 64, label: t("btn.home"), action: () => this.goHome() },
        { x: PANEL.x + PANEL.w - 84, y: PANEL.y + 20, w: 64, h: 64, icon: this.audio.muted ? "soundOff" : "soundOn", action: () => this.toggleMute() },
      );
    } else if (s === "levels") {
      list.push(...mapButtons(this.mapHost, worldPages(), loadSave()));
    } else if (s === "island") {
      const pages = worldPages();
      const i = Math.min(this.levelPage, pages.length - 1);
      list.push(...islandButtons(this.mapHost, pages[i], i, pages.length, loadSave()));
    } else if (s === "home") {
      list.push(...homeButtons(this.host));
    } else if (s === "garage") {
      list.push(...garageButtons(this.host));
    } else if (s === "shop") {
      list.push(...shopButtons(this.host));
    } else if (s === "ranking") {
      list.push(...rankingButtons(this.host));
    } else if (s === "missions") {
      list.push(...missionButtons(this.host));
    } else if (s === "trophies") {
      list.push(...trophyButtons(this.host));
    } else if (s === "daily") {
      list.push(...dailyButtons(this.host));
    }
    return list;
  }

  // ---------- drawing ----------

  draw(): void {
    const ctx = this.ctx;
    const run = this.run;
    const paint = getPaint(loadSave().paint[run.vehicle.spec.id]).color;
    if (this.state === "levels" || this.state === "island") {
      // The map covers the whole screen: no need to draw the level behind it.
      const save = loadSave();
      const pages = worldPages();
      const mapPaint = getPaint(save.paint[save.vehicle]).color;
      if (this.state === "levels") drawMap(ctx, this.time, pages, save, islandOf(this.levelId, pages), mapPaint);
      else drawIsland(ctx, this.time, pages[Math.min(this.levelPage, pages.length - 1)], save, this.levelId, mapPaint);
      for (const b of this.buttons) if (!b.render) drawButton(ctx, b, sameButton(b, this.hover), sameButton(b, this.pressed));
      drawToast(ctx, this.toast);
      this.particles.drawConfetti(ctx);
      return;
    }
    this.renderer.draw(run, this.camera, this.particles, this.time, paint, this.ghostPose());

    const s = this.state;
    if (s === "ready" || s === "playing") {
      drawHud(ctx, t("hud.level", { n: this.levelId }), run.cargo.items, this.lostFlash, run.cargo.meltLeft(run.time), this.time);
      drawTimer(ctx, formatTime(run.time));
      drawPickedCoins(ctx, run.pickedValue);
      drawSpeedometer(ctx, Math.abs(run.vehicle.speed) * 3.6, run.vehicle.gear, run.vehicle.rpm, run.vehicle.spec.maxSpeed * 3.6);
      if (this.hint) {
        const alpha = this.hint.left === Infinity ? 1 : Math.min(1, this.hint.left * 2);
        drawHint(ctx, t(this.hint.text), alpha, this.time);
      }
      if (this.input.showTouch) drawTouchControls(ctx, this.input.gas, this.input.brake, this.input.nitro, run.vehicle.nitro);
      drawNitroGauge(ctx, run.vehicle.nitro, run.vehicle.nitroActive);
    } else if (s === "won" && this.stateTime > WIN_DELAY) {
      drawWinScreen(
        ctx,
        t("win.title"),
        `${t("win.delivered", { n: run.cargo.delivered, total: run.cargo.total })}  ·  ${formatTime(run.time)}`,
        this.resultStars,
        this.stateTime - WIN_DELAY,
        (i) => STAR_DELAY(i) - WIN_DELAY,
      );
      if (this.stateTime > WIN_DELAY + 1.6) {
        const line = this.rival ?? (this.newRecord ? t("win.newRecord") : null);
        if (line) outlinedText(ctx, line, VIEW_W / 2, PANEL.y + PANEL.h - 32, 24, this.rival && !this.rivalBeat ? "#FFB627" : "#3BCEAC");
      }
      if (this.coinsEarned > 0 && this.stateTime > WIN_DELAY + 0.3) {
        drawCoin(ctx, PANEL.x + PANEL.w - 120, PANEL.y + 52, 20);
        outlinedText(ctx, `+${this.coinsEarned}`, PANEL.x + PANEL.w - 92, PANEL.y + 54, 30, "#FFD23F", "left");
      }
    } else if (s === "failed") {
      drawFailScreen(ctx, t(FAIL_TEXT[run.failReason ?? "allLost"]), this.stateTime);
    } else if (s === "paused") {
      drawPauseScreen(ctx, t("pause.title"));
    } else if (s === "home" || s === "daily") {
      drawHome(ctx, this.host);
      if (s === "daily") drawDaily(ctx, this.time);
    } else if (s === "garage") {
      drawGarage(ctx);
    } else if (s === "shop") {
      drawShop(ctx);
    } else if (s === "ranking") {
      drawRanking(ctx, this.host, friendRanking(), levels.length);
    } else if (s === "missions") {
      drawMissions(ctx);
    } else if (s === "trophies") {
      drawTrophies(ctx);
    }

    for (const b of this.buttons) drawButton(ctx, b, sameButton(b, this.hover), sameButton(b, this.pressed));
    if (s === "home") drawHomeBadges(ctx);
    drawToast(ctx, this.toast);
    this.particles.drawConfetti(ctx);
  }
}
