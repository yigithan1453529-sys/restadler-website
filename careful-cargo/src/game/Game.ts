import { t, type TextKey } from "../i18n";
import { getLevel, levels, worldPages } from "../levels";
import { poki } from "../platform/poki";
import { loadSave, saveLevelResult, saveMuted, saveVehicle, totalStars } from "../storage";
import { Button, drawButton, hitButton, sameButton } from "../ui/Button";
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
import { drawStar, outlinedText, plainText, roundRect } from "../ui/draw";
import { AudioFx } from "./Audio";
import { Camera, VIEW_W } from "./Camera";
import { Input } from "./Input";
import { LevelRun } from "./Level";
import { Particles } from "./Particles";
import { COLORS, drawVehiclePreview, Renderer } from "./Renderer";
import { THEMES } from "./themes";
import { getVehicleSpec, VEHICLES } from "./Vehicle";

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
  private stateBeforeLevels: GameState = "ready";
  private levelPage = 0;
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
  private unlockMessage: string | null = null;

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

    // Start in the furthest unlocked level (level 1 for new players).
    this.loadLevel(Math.min(save.unlocked, levels.length));
  }

  private isMenuState(): boolean {
    return this.state === "paused" || this.state === "won" || this.state === "failed" || this.state === "levels";
  }

  // ---------- state changes ----------

  loadLevel(id: number): void {
    this.levelId = id;
    this.unlockMessage = null;
    this.run = new LevelRun(getLevel(id), getVehicleSpec(loadSave().vehicle));
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
    this.setState(this.run.started ? "playing" : "ready");
    this.input.releaseAll();
  }

  private openLevels(): void {
    this.stateBeforeLevels = this.state;
    this.levelPage = Math.max(0, worldPages().findIndex((p) => p.levels.some((l) => l.id === this.levelId)));
    this.setState("levels");
  }

  private closeLevels(): void {
    // A different vehicle was chosen: restart the level with it.
    if (this.run.vehicle.spec.id !== getVehicleSpec(loadSave().vehicle).id) {
      this.loadLevel(this.levelId);
      return;
    }
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
      if (primary && (this.isMenuState() || this.state === "ready")) {
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
      const drive = this.state === "playing" ? { gas: this.input.gas, brake: this.input.brake } : { gas: false, brake: false };
      run.update(dt, drive);
      this.handleEffects(dt);
      if (this.state === "playing") this.checkRunEnd();
      const p = run.vehicle.position;
      if (this.state === "won") this.camera.follow(run.level.finishX - 1, p.y, 0, dt);
      else this.camera.follow(p.x, p.y, run.vehicle.speed, dt);
    }

    if (this.state === "playing" || this.state === "ready") {
      const wheelSpeed = Math.abs(run.vehicle.rearWheel.getAngularVelocity()) * run.vehicle.spec.rear.r;
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
  }

  private checkRunEnd(): void {
    const run = this.run;
    if (run.state === "won") {
      this.resultStars = run.stars;
      const before = totalStars();
      saveLevelResult(this.levelId, run.stars, levels.length);
      const after = totalStars();
      const unlocked = VEHICLES.find((v) => v.unlockStars > before && v.unlockStars <= after);
      if (unlocked) this.unlockMessage = t("unlock.vehicle", { name: t(unlocked.name) });
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
    if (s === "won" && this.stateTime > WIN_DELAY + 0.3) {
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
      const pages = worldPages();
      const page = pages[Math.min(this.levelPage, pages.length - 1)];
      const tileW = 180;
      const gap = 14;
      const n = page.levels.length;
      const startX = (VIEW_W - (n * tileW + (n - 1) * gap)) / 2;
      page.levels.forEach((level, i) => {
        const locked = level.id > save.unlocked;
        list.push({
          x: startX + i * (tileW + gap),
          y: 210,
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
      if (this.levelPage > 0)
        list.push({ x: VIEW_W / 2 - 330, y: 115, w: 70, h: 70, icon: "prev", action: () => this.levelPage-- });
      if (this.levelPage < pages.length - 1)
        list.push({ x: VIEW_W / 2 + 260, y: 115, w: 70, h: 70, icon: "next", action: () => this.levelPage++ });
      list.push({ x: VIEW_W - 100, y: 30, w: 70, h: 70, icon: "close", primary: false, action: () => this.closeLevels() });

      // vehicle picker
      const stars = totalStars();
      const chosen = getVehicleSpec(save.vehicle).id;
      const cardW = 220;
      const cardGap = 20;
      const cx0 = (VIEW_W - (VEHICLES.length * cardW + (VEHICLES.length - 1) * cardGap)) / 2;
      VEHICLES.forEach((spec, i) => {
        const locked = stars < spec.unlockStars;
        list.push({
          x: cx0 + i * (cardW + cardGap),
          y: 495,
          w: cardW,
          h: 190,
          disabled: locked,
          render: (c, b) => {
            roundRect(c, b.x, b.y + 6, b.w, b.h, 22);
            c.fillStyle = "rgba(45,45,45,0.35)";
            c.fill();
            roundRect(c, b.x, b.y, b.w, b.h, 22);
            c.fillStyle = locked ? "#D5D5D5" : spec.id === chosen ? "#FFE58A" : "#FFFFFF";
            c.fill();
            c.lineWidth = spec.id === chosen ? 5 : 3;
            c.strokeStyle = COLORS.outline;
            c.stroke();
            c.save();
            c.translate(b.x + b.w / 2, b.y + 68);
            c.scale(48, -48);
            if (locked) c.globalAlpha = 0.35;
            drawVehiclePreview(c, spec, 3 / 48);
            c.restore();
            plainText(c, t(spec.name), b.x + b.w / 2, b.y + 146, 22);
            if (locked) {
              drawStar(c, b.x + b.w / 2 - 28, b.y + 172, 12, true);
              plainText(c, String(spec.unlockStars), b.x + b.w / 2 + 6, b.y + 173, 20, COLORS.outline, "left");
            }
          },
          action: () => saveVehicle(spec.id),
        });
      });
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
      drawHud(ctx, t("hud.level", { n: this.levelId }), run.cargo.items, this.lostFlash, run.cargo.meltLeft(run.time), this.time);
      if (this.hint) {
        const alpha = this.hint.left === Infinity ? 1 : Math.min(1, this.hint.left * 2);
        drawHint(ctx, t(this.hint.text), alpha, this.time);
      }
      if (this.input.showTouch) drawTouchControls(ctx, this.input.gas, this.input.brake);
    } else if (s === "won" && this.stateTime > WIN_DELAY) {
      drawWinScreen(
        ctx,
        t("win.title"),
        t("win.delivered", { n: run.cargo.delivered, total: run.cargo.total }),
        this.resultStars,
        this.stateTime - WIN_DELAY,
        (i) => STAR_DELAY(i) - WIN_DELAY,
      );
      if (this.unlockMessage && this.stateTime > WIN_DELAY + 1.4) outlinedText(ctx, this.unlockMessage, VIEW_W / 2, 92, 34, "#3BCEAC");
    } else if (s === "failed") {
      drawFailScreen(ctx, t(FAIL_TEXT[run.failReason ?? "allLost"]), this.stateTime);
    } else if (s === "paused") {
      drawPauseScreen(ctx, t("pause.title"));
    } else if (s === "levels") {
      const pages = worldPages();
      const page = pages[Math.min(this.levelPage, pages.length - 1)];
      drawLevelSelectBackground(ctx, t("levels.title"), t(THEMES[page.world].name), this.levelPage, pages.length);
      drawStar(ctx, 52, 68, 22, true);
      outlinedText(ctx, `${totalStars()} / ${levels.length * 3}`, 84, 70, 30, "#FFFFFF", "left");
    }

    for (const b of this.buttons) drawButton(ctx, b, sameButton(b, this.hover), sameButton(b, this.pressed));
    this.particles.drawConfetti(ctx);
  }
}
