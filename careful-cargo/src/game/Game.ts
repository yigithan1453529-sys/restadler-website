import { t, type TextKey } from "../i18n";
import { getLevel, levels } from "../levels";
import { poki } from "../platform/poki";
import { loadSave, saveLevelResult, saveMuted } from "../storage";
import { Button, drawButton, hitButton } from "../ui/Button";
import { drawHint, drawHud } from "../ui/Hud";
import {
  drawFailScreen,
  drawLevelSelectBackground,
  drawPauseScreen,
  drawWinScreen,
  levelTileRenderer,
  PANEL,
} from "../ui/Screens";
import { drawTouchControls } from "../ui/TouchControls";
import { AudioFx } from "./Audio";
import { Camera, VIEW_W } from "./Camera";
import { Input } from "./Input";
import { LevelRun } from "./Level";
import { Particles } from "./Particles";
import { Renderer } from "./Renderer";

/**
 * ready    – level loaded, waiting for the first input
 * playing  – driving
 * paused   – pause menu
 * won      – success screen
 * failed   – fail screen
 * levels   – level select (on top of the frozen level)
 */
export type GameState = "ready" | "playing" | "paused" | "won" | "failed" | "levels";

const FAIL_TEXT: Record<string, TextKey> = {
  allLost: "fail.allLost",
  flipped: "fail.flipped",
  fell: "fail.fell",
};

const HARD_LANDING = 2.0; // impact per kg that counts as a hard landing
const STAR_DELAY = (i: number): number => 0.45 + i * 0.35;

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
  private stateBeforeLevels: GameState = "ready";
  private buttons: Button[] = [];
  private hover: Button | null = null;
  private pressed: Button | null = null;
  private hint: { text: TextKey; left: number } | null = null;
  private hintsShown = new Set<number>();
  private lostFlash = new Map<number, number>();
  private impactCooldown = 0;
  private dustTimer = 0;
  private starsPopped = 0;
  private resultStars = 0;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private input: Input,
  ) {
    this.renderer = new Renderer(ctx);
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
      if (b && b === this.pressed && !b.disabled) {
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

    // Start in the furthest unlocked level (level 1 for new players).
    this.loadLevel(Math.min(save.unlocked, levels.length));
  }

  private isMenuState(): boolean {
    return this.state === "paused" || this.state === "won" || this.state === "failed" || this.state === "levels";
  }

  // ---------- state changes ----------

  loadLevel(id: number): void {
    this.levelId = id;
    this.run = new LevelRun(getLevel(id));
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

  restart(): void {
    this.loadLevel(this.levelId);
  }

  private nextLevel(): void {
    if (this.levelId < levels.length) this.loadLevel(this.levelId + 1);
    else this.openLevels();
  }

  private pause(): void {
    if (this.state === "playing" || this.state === "ready") this.setState("paused");
  }

  private resume(): void {
    if (this.state !== "paused") return;
    // Back to "ready" if the player never started driving.
    this.setState(this.run.time > 0 ? "playing" : "ready");
    this.input.releaseAll();
  }

  private openLevels(): void {
    this.stateBeforeLevels = this.state;
    this.setState("levels");
  }

  private closeLevels(): void {
    const back = this.stateBeforeLevels;
    this.setState(back === "playing" || back === "ready" ? "paused" : back);
  }

  private toggleMute(): void {
    this.audio.setMuted(!this.audio.muted);
    saveMuted(this.audio.muted);
  }

  private onKey(code: string): void {
    if (code === "KeyR") {
      if (this.state !== "levels") this.restart();
      return;
    }
    if (code === "Escape" || code === "KeyP") {
      if (this.state === "playing" || this.state === "ready") this.pause();
      else if (this.state === "paused") this.resume();
      else if (this.state === "levels") this.closeLevels();
      return;
    }
    if (code === "Enter" || code === "Space" || code === "NumpadEnter") {
      const primary = this.buttons.find((b) => b.primary);
      if (primary && this.isMenuState()) {
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

    if (this.state === "ready" && (this.input.gas || this.input.brake)) {
      this.setState("playing");
      if (this.hint && this.hint.left === Infinity) this.hint.left = 2.5;
    }

    const simulate = this.state === "ready" || this.state === "playing" || this.state === "won" || this.state === "failed";
    if (simulate) {
      const drive = this.state === "playing" ? { gas: this.input.gas, brake: this.input.brake } : { gas: false, brake: false };
      run.update(dt, drive);
      this.handleEffects(dt);
      if (this.state === "playing") this.checkRunEnd();
      const p = run.vehicle.position;
      this.camera.follow(p.x, p.y, run.vehicle.speed, dt);
    }

    if (this.state === "playing" || this.state === "ready") {
      const wheelSpeed = Math.abs(run.vehicle.rearWheel.getAngularVelocity()) * 0.45;
      this.audio.updateEngine(wheelSpeed, run.vehicle.throttle);
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
    if (this.state !== "paused" && this.state !== "levels") this.particles.update(dt);
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
      const at = item.body?.getPosition() ?? item.brokenAt ?? v.position;
      this.particles.text(t("oops"), at.x, at.y + 0.6);
      this.lostFlash.set(item.id, 1);
      if (item.lostReason !== "broken") this.audio.oops();
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
  }

  private checkRunEnd(): void {
    const run = this.run;
    if (run.state === "won") {
      this.resultStars = run.stars;
      saveLevelResult(this.levelId, run.stars, levels.length);
      this.setState("won");
      this.audio.success();
    } else if (run.state === "failed") {
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
    if (s === "ready" || s === "playing") {
      const size = 68;
      const y = 14;
      list.push(
        { x: 202, y, w: size, h: size, icon: "menu", action: () => this.openLevels() },
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
    if (s === "won" && this.stateTime > 0.3) {
      const last = this.levelId >= levels.length;
      list.push(
        { x: cx - 120, y: bottom - 150, w: 240, h: 88, label: last ? t("btn.levels") : t("btn.next"), icon: last ? "menu" : "next", primary: true, action: () => this.nextLevel() },
        { x: PANEL.x + 36, y: bottom - 138, w: 136, h: 64, label: t("btn.retry"), action: () => this.restart() },
        { x: PANEL.x + PANEL.w - 172, y: bottom - 138, w: 136, h: 64, label: t("btn.levels"), action: () => this.openLevels() },
      );
    } else if (s === "failed" && this.stateTime > 0.3) {
      list.push(
        { x: cx - 140, y: bottom - 200, w: 280, h: 92, label: t("btn.retry"), icon: "restart", primary: true, action: () => this.restart() },
        { x: cx - 80, y: bottom - 90, w: 160, h: 60, label: t("btn.levels"), action: () => this.openLevels() },
      );
    } else if (s === "paused") {
      list.push(
        { x: cx - 140, y: bottom - 220, w: 280, h: 92, label: t("btn.resume"), icon: "play", primary: true, action: () => this.resume() },
        { x: PANEL.x + 60, y: bottom - 105, w: 220, h: 64, label: t("btn.retry"), action: () => this.restart() },
        { x: PANEL.x + PANEL.w - 280, y: bottom - 105, w: 220, h: 64, label: t("btn.levels"), action: () => this.openLevels() },
        { x: PANEL.x + PANEL.w - 84, y: PANEL.y + 20, w: 64, h: 64, icon: this.audio.muted ? "soundOff" : "soundOn", action: () => this.toggleMute() },
      );
    } else if (s === "levels") {
      const save = loadSave();
      const tileW = 196;
      const gap = 22;
      const startX = (VIEW_W - (levels.length * tileW + (levels.length - 1) * gap)) / 2;
      levels.forEach((level, i) => {
        const locked = level.id > save.unlocked;
        list.push({
          x: startX + i * (tileW + gap),
          y: 240,
          w: tileW,
          h: 220,
          disabled: locked,
          render: levelTileRenderer({
            number: level.id,
            name: t(level.name),
            stars: save.stars[level.id] ?? 0,
            locked,
            current: level.id === this.levelId,
          }),
          action: () => this.loadLevel(level.id),
        });
      });
      list.push({ x: VIEW_W - 100, y: 30, w: 70, h: 70, icon: "close", primary: false, action: () => this.closeLevels() });
    }
    return list;
  }

  // ---------- drawing ----------

  draw(): void {
    const ctx = this.ctx;
    const run = this.run;
    this.renderer.draw(run, this.camera, this.particles, this.time);

    const s = this.state;
    if (s === "ready" || s === "playing") {
      drawHud(ctx, t("hud.level", { n: this.levelId }), run.cargo.items, this.lostFlash);
      if (this.hint) {
        const alpha = this.hint.left === Infinity ? 1 : Math.min(1, this.hint.left * 2);
        drawHint(ctx, t(this.hint.text), alpha, this.time);
      }
      if (this.input.showTouch) drawTouchControls(ctx, this.input.gas, this.input.brake);
    } else if (s === "won") {
      drawWinScreen(
        ctx,
        t("win.title"),
        t("win.delivered", { n: run.cargo.delivered, total: run.cargo.total }),
        this.resultStars,
        this.stateTime,
        STAR_DELAY,
      );
    } else if (s === "failed") {
      drawFailScreen(ctx, t(FAIL_TEXT[run.failReason ?? "allLost"]), this.stateTime);
    } else if (s === "paused") {
      drawPauseScreen(ctx, t("pause.title"));
    } else if (s === "levels") {
      drawLevelSelectBackground(ctx, t("levels.title"));
    }

    for (const b of this.buttons) drawButton(ctx, b, b === this.hover, b === this.pressed);
    this.particles.drawConfetti(ctx);
  }
}
