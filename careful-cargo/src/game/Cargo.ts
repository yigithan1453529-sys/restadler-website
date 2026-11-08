import { Body, Box, Circle, Vec2Value } from "planck";
import type { CargoType, LevelData } from "../levels/types";
import { BED, Vehicle } from "./Vehicle";
import type { FixtureTag, GameWorld } from "./World";

export const CARGO = {
  crateSize: 0.42,
  eggRadius: 0.12,
  /** Egg breaks when the contact impulse divided by its mass exceeds this (≈ m/s). */
  eggBreakSpeed: 3.6,
  cakeLayers: [
    { w: 0.84, h: 0.28 },
    { w: 0.64, h: 0.26 },
    { w: 0.46, h: 0.24 },
  ],
  maxDistance: 3,
};

export type LostReason = "ground" | "away" | "broken";

export interface CargoItem {
  id: number;
  type: CargoType;
  body: Body | null; // null after an egg broke
  lost: boolean;
  lostReason?: LostReason;
  /** Box half-size or circle radius for drawing. */
  hw: number;
  hh: number;
  /** Cake layer index (0 = bottom). */
  layer: number;
  /** Where an egg broke (for the splatter). */
  brokenAt?: Vec2Value;
}

export class CargoManager {
  readonly items: CargoItem[] = [];
  /** Items lost during the last update (for effects). */
  newlyLost: CargoItem[] = [];
  /** Eggs broken during the last update (for splatter effects). */
  newlyBroken: CargoItem[] = [];
  private toDestroy: CargoItem[] = [];

  constructor(
    private gw: GameWorld,
    private vehicle: Vehicle,
    level: LevelData,
  ) {
    for (const spec of level.cargo) {
      if (spec.type === "crate") this.spawnCrates(spec.count);
      else if (spec.type === "egg") this.spawnEggs(spec.count);
      else this.spawnCake(Math.min(spec.count, CARGO.cakeLayers.length));
    }
  }

  get total(): number {
    return this.items.length;
  }

  get lostCount(): number {
    return this.items.filter((i) => i.lost).length;
  }

  get delivered(): number {
    return this.total - this.lostCount;
  }

  private bedWidth(): number {
    return BED.right - BED.left;
  }

  private localToWorld(x: number, y: number): Vec2Value {
    return this.vehicle.chassis.getWorldPoint({ x, y });
  }

  private add(type: CargoType, body: Body, hw: number, hh: number, layer = 0): void {
    const item: CargoItem = { id: this.items.length, type, body, lost: false, hw, hh, layer };
    const tag: FixtureTag = { kind: "cargo", item };
    for (let f = body.getFixtureList(); f; f = f.getNext()) f.setUserData(tag);
    this.items.push(item);
  }

  private spawnCrates(count: number): void {
    const s = CARGO.crateSize;
    const perRow = Math.max(1, Math.floor(this.bedWidth() / (s + 0.06)));
    let placed = 0;
    let row = 0;
    while (placed < count) {
      const n = Math.min(perRow, count - placed);
      const gap = (this.bedWidth() - n * s) / (n + 1);
      for (let i = 0; i < n; i++) {
        const lx = BED.left + gap + s / 2 + i * (s + gap);
        const ly = BED.floor + s / 2 + 0.01 + row * (s + 0.01);
        const body = this.gw.world.createBody({ type: "dynamic", position: this.localToWorld(lx, ly) });
        body.createFixture(new Box(s / 2, s / 2), { density: 1, friction: 0.55, restitution: 0.05 });
        this.add("crate", body, s / 2, s / 2);
      }
      placed += n;
      row++;
    }
  }

  private spawnEggs(count: number): void {
    const r = CARGO.eggRadius;
    const perRow = Math.max(1, Math.floor(this.bedWidth() / (2 * r + 0.04)));
    let placed = 0;
    let row = 0;
    while (placed < count) {
      const n = Math.min(perRow, count - placed);
      const gap = (this.bedWidth() - n * 2 * r) / (n + 1);
      for (let i = 0; i < n; i++) {
        const lx = BED.left + gap + r + i * (2 * r + gap) + row * r;
        const ly = BED.floor + r + 0.01 + row * 2 * r;
        const body = this.gw.world.createBody({
          type: "dynamic",
          position: this.localToWorld(lx, ly),
          angularDamping: 1.5,
        });
        body.createFixture(new Circle(r), { density: 1, friction: 0.5, restitution: 0.15 });
        this.add("egg", body, r, r);
      }
      placed += n;
      row++;
    }
  }

  private spawnCake(layers: number): void {
    const cx = (BED.left + BED.right) / 2;
    let y = BED.floor + 0.005;
    for (let i = 0; i < layers; i++) {
      const { w, h } = CARGO.cakeLayers[i];
      const body = this.gw.world.createBody({ type: "dynamic", position: this.localToWorld(cx, y + h / 2) });
      body.createFixture(new Box(w / 2, h / 2), { density: 0.9, friction: 1.3, restitution: 0 });
      this.add("cake", body, w / 2, h / 2, i);
      y += h + 0.005;
    }
  }

  private markLost(item: CargoItem, reason: LostReason): void {
    if (item.lost) return;
    item.lost = true;
    item.lostReason = reason;
    this.newlyLost.push(item);
  }

  /** Handles contact events. Call after every physics step. */
  handleGround(item: CargoItem): void {
    this.markLost(item, "ground");
  }

  handleImpact(item: CargoItem, impulse: number): void {
    if (item.type !== "egg" || !item.body || item.lostReason === "broken") return;
    const speed = impulse / item.body.getMass();
    if (speed > CARGO.eggBreakSpeed) {
      if (!item.lost) this.newlyLost.push(item);
      item.lost = true;
      item.lostReason = "broken";
      const p = item.body.getPosition();
      item.brokenAt = { x: p.x, y: p.y };
      this.newlyBroken.push(item);
      this.toDestroy.push(item);
    }
  }

  /** Distance check and removal of broken eggs. Call after every physics step. */
  afterStep(): void {
    for (const item of this.toDestroy) {
      if (item.body) {
        this.gw.world.destroyBody(item.body);
        item.body = null;
      }
    }
    this.toDestroy.length = 0;

    const bed = this.vehicle.bedCenter();
    for (const item of this.items) {
      if (item.lost || !item.body) continue;
      const p = item.body.getPosition();
      if (Math.hypot(p.x - bed.x, p.y - bed.y) > CARGO.maxDistance) this.markLost(item, "away");
    }
  }
}
