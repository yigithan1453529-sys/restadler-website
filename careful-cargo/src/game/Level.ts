import { heightAt } from "../levels/terrain";
import type { LevelData } from "../levels/types";
import { CargoManager, CargoItem } from "./Cargo";
import { DriveInput, Vehicle } from "./Vehicle";
import { GameWorld, PHYSICS_STEP } from "./World";

export type FailReason = "allLost" | "flipped" | "fell";
export type RunState = "running" | "won" | "failed";

const FLIP_TIME = 1.5;
const ALL_LOST_DELAY = 0.7;
const START_X = 4;

/**
 * One attempt at a level: physics world, vehicle, cargo and the rules
 * (finish, stars, fail). Contains no drawing or DOM code.
 */
export class LevelRun {
  readonly gw: GameWorld;
  readonly vehicle: Vehicle;
  readonly cargo: CargoManager;
  readonly killY: number;
  state: RunState = "running";
  failReason: FailReason | null = null;
  time = 0;
  reachedCheckpoints: number[] = [];

  // Per-frame outputs for effects (cleared at the start of every update).
  lostThisFrame: CargoItem[] = [];
  brokenThisFrame: CargoItem[] = [];
  bumpedThisFrame: CargoItem[] = [];
  /** Set by the game on the first input; the clock (melting) only runs after that. */
  started = false;
  /** Strongest vehicle/ground impact this frame (impulse per kg). */
  impactThisFrame = 0;
  checkpointThisFrame: number | null = null;

  private flipTimer = 0;
  private allLostTimer = 0;

  constructor(readonly level: LevelData) {
    this.gw = new GameWorld(level);
    const y = heightAt(this.gw.terrain, START_X) + 1.05;
    this.vehicle = new Vehicle(this.gw, { x: START_X, y });
    this.cargo = new CargoManager(this.gw, this.vehicle, level);
    this.killY = level.killY ?? this.gw.minY - 6;
  }

  get stars(): number {
    const total = this.cargo.total;
    const ratio = total > 0 ? this.cargo.delivered / total : 0;
    if (ratio >= 1) return 3;
    if (ratio >= 0.6) return 2;
    if (ratio > 0) return 1;
    return 0;
  }

  update(dt: number, input: DriveInput): void {
    this.lostThisFrame = [];
    this.brokenThisFrame = [];
    this.bumpedThisFrame = [];
    this.impactThisFrame = 0;
    this.checkpointThisFrame = null;
    const active = this.state === "running";
    const controls: DriveInput = active ? input : { gas: false, brake: false };
    const carMass = this.vehicle.chassis.getMass();

    this.gw.advance(
      dt,
      () => this.vehicle.control(controls),
      () => {
        for (const ev of this.gw.events) {
          if (ev.type === "cargoGround") this.cargo.handleGround(ev.item);
          else if (ev.type === "cargoImpact") this.cargo.handleImpact(ev.item, ev.impulse);
          else if (ev.type === "carImpact") this.impactThisFrame = Math.max(this.impactThisFrame, ev.impulse / carMass);
        }
        this.gw.events.length = 0;
        this.cargo.afterStep(this.time);
        this.lostThisFrame.push(...this.cargo.newlyLost);
        this.brokenThisFrame.push(...this.cargo.newlyBroken);
        this.cargo.newlyLost.length = 0;
        this.cargo.newlyBroken.length = 0;
        this.bumpedThisFrame.push(...this.cargo.newlyBumped);
        this.cargo.newlyBumped.length = 0;
        if (this.state === "running") this.checkRules();
      },
    );
  }

  private checkRules(): void {
    if (this.started) this.time += PHYSICS_STEP;
    const pos = this.vehicle.position;

    for (const cx of this.level.checkpoints) {
      if (pos.x >= cx && !this.reachedCheckpoints.includes(cx)) {
        this.reachedCheckpoints.push(cx);
        this.checkpointThisFrame = cx;
      }
    }

    if (this.cargo.delivered === 0) {
      this.allLostTimer += PHYSICS_STEP;
      if (this.allLostTimer >= ALL_LOST_DELAY) return this.fail("allLost");
    }

    if (pos.y < this.killY) return this.fail("fell");

    if (this.vehicle.uprightness < 0 && this.gw.touchesGround(this.vehicle.chassis)) {
      this.flipTimer += PHYSICS_STEP;
      if (this.flipTimer >= FLIP_TIME) return this.fail("flipped");
    } else {
      this.flipTimer = 0;
    }

    if (pos.x >= this.level.finishX && this.cargo.delivered > 0) {
      this.state = "won";
    }
  }

  private fail(reason: FailReason): void {
    this.state = "failed";
    this.failReason = reason;
  }
}
