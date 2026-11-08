import { Body, Box, Circle, Vec2Value } from "planck";
import type { CargoType, LevelData } from "../levels/types";
import type { Vehicle } from "./Vehicle";
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
  scoopRadius: 0.14,
  /** Seconds between two scoops melting. */
  meltStagger: 2.5,
  tank: { hw: 0.46, hh: 0.32, wall: 0.04 },
  /** Aquarium spills when tilted more than this (radians). */
  spillAngle: 1.0,
  bowlingRadius: 0.22,
  grandpa: { hw: 0.32, hh: 0.3 },
};

export const SCOOP_COLORS = ["#FF9EC7", "#B8F2C8", "#FFF3C4", "#9C6644", "#FFB6A3"];

const TANK_CATEGORY = 0x0002;
const WATER_CATEGORY = 0x0004;

export type LostReason = "ground" | "away" | "broken" | "melted" | "spilled";

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
  /** Ice cream: run time when this scoop melts. */
  meltAt?: number;
  /** Aquarium: the sloshing water inside the tank. */
  water?: Body;
}

export class CargoManager {
  readonly items: CargoItem[] = [];
  /** Items lost during the last update (for effects). */
  newlyLost: CargoItem[] = [];
  /** Eggs broken during the last update (for splatter effects). */
  newlyBroken: CargoItem[] = [];
  /** Grandpa got a hard bump (for a "Whoa!"). */
  newlyBumped: CargoItem[] = [];
  private toDestroy: CargoItem[] = [];

  constructor(
    private gw: GameWorld,
    private vehicle: Vehicle,
    level: LevelData,
  ) {
    for (const spec of level.cargo) {
      if (spec.type === "crate") this.spawnCrates(spec.count, spec.perRow);
      else if (spec.type === "egg") this.spawnEggs(spec.count);
      else if (spec.type === "cake") this.spawnCake(Math.min(spec.count, CARGO.cakeLayers.length));
      else if (spec.type === "icecream") this.spawnScoops(spec.count, level.meltTime ?? 40);
      else if (spec.type === "aquarium") this.spawnAquarium();
      else if (spec.type === "bowling") this.spawnBowling(spec.count);
      else this.spawnGrandpa();
    }
  }

  /** Seconds until the next scoop melts, or null if there is no ice cream left. */
  meltLeft(time: number): number | null {
    let next = Infinity;
    for (const i of this.items) if (i.type === "icecream" && !i.lost && i.meltAt !== undefined) next = Math.min(next, i.meltAt);
    return next === Infinity ? null : Math.max(0, next - time);
  }

  private spawnScoops(count: number, meltTime: number): void {
    const r = CARGO.scoopRadius;
    const n = Math.min(count, Math.floor(this.bedWidth() / (2 * r + 0.06)));
    const gap = (this.bedWidth() - n * 2 * r) / (n + 1);
    for (let i = 0; i < n; i++) {
      const lx = this.bed.left + gap + r + i * (2 * r + gap);
      const body = this.gw.world.createBody({
        type: "dynamic",
        position: this.localToWorld(lx, this.bed.floor + r + 0.01),
        angularDamping: 4,
      });
      body.createFixture(new Circle(r), { density: 0.9, friction: 1.1, restitution: 0 });
      this.add("icecream", body, r, r, i % SCOOP_COLORS.length);
      this.items[this.items.length - 1].meltAt = meltTime + i * CARGO.meltStagger;
    }
  }

  private spawnAquarium(): void {
    const { hw, hh, wall } = CARGO.tank;
    const cx = (this.bed.left + this.bed.right) / 2;
    const body = this.gw.world.createBody({ type: "dynamic", position: this.localToWorld(cx, this.bed.floor + hh + 0.01) });
    const opt = { density: 0.6, friction: 0.7, filterCategoryBits: TANK_CATEGORY };
    body.createFixture(new Box(hw, wall, { x: 0, y: -hh + wall }), opt);
    body.createFixture(new Box(wall, hh, { x: -hw + wall, y: 0 }), opt);
    body.createFixture(new Box(wall, hh, { x: hw - wall, y: 0 }), opt);
    this.add("aquarium", body, hw, hh);
    // The water: a heavy ball that only touches the tank and rolls around inside.
    const water = this.gw.world.createBody({
      type: "dynamic",
      position: this.localToWorld(cx, this.bed.floor + 0.3),
      linearDamping: 0.6,
    });
    water.createFixture(new Circle(0.2), {
      density: 2.5,
      friction: 0.05,
      restitution: 0.2,
      filterCategoryBits: WATER_CATEGORY,
      filterMaskBits: TANK_CATEGORY,
    });
    this.items[this.items.length - 1].water = water;
  }

  private spawnBowling(count: number): void {
    const r = CARGO.bowlingRadius;
    for (let i = 0; i < Math.min(count, 2); i++) {
      const lx = this.bed.left + 0.35 + i * 0.6;
      const body = this.gw.world.createBody({ type: "dynamic", position: this.localToWorld(lx, this.bed.floor + r + 0.01) });
      body.createFixture(new Circle(r), { density: 5, friction: 0.4, restitution: 0.05 });
      this.add("bowling", body, r, r);
    }
  }

  private spawnGrandpa(): void {
    const { hw, hh } = CARGO.grandpa;
    const cx = (this.bed.left + this.bed.right) / 2;
    const body = this.gw.world.createBody({ type: "dynamic", position: this.localToWorld(cx, this.bed.floor + hh + 0.01) });
    body.createFixture(new Box(hw, hh), { density: 0.8, friction: 0.9, restitution: 0.05 });
    this.add("grandpa", body, hw, hh);
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

  private get bed(): Vehicle["spec"]["bed"] {
    return this.vehicle.spec.bed;
  }

  private bedWidth(): number {
    return this.bed.right - this.bed.left;
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

  private spawnCrates(count: number, maxPerRow?: number): void {
    const s = CARGO.crateSize;
    const fit = Math.max(1, Math.floor(this.bedWidth() / (s + 0.06)));
    const perRow = Math.min(fit, maxPerRow ?? fit);
    let placed = 0;
    let row = 0;
    while (placed < count) {
      const n = Math.min(perRow, count - placed);
      const gap = (this.bedWidth() - n * s) / (n + 1);
      for (let i = 0; i < n; i++) {
        const lx = this.bed.left + gap + s / 2 + i * (s + gap);
        const ly = this.bed.floor + s / 2 + 0.01 + row * (s + 0.01);
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
        const lx = this.bed.left + gap + r + i * (2 * r + gap) + row * r;
        const ly = this.bed.floor + r + 0.01 + row * 2 * r;
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
    const cx = (this.bed.left + this.bed.right) / 2;
    let y = this.bed.floor + 0.005;
    for (let i = 0; i < layers; i++) {
      const { w, h } = CARGO.cakeLayers[i];
      const body = this.gw.world.createBody({ type: "dynamic", position: this.localToWorld(cx, y + h / 2) });
      body.createFixture(new Box(w / 2, h / 2), { density: 0.9, friction: 1.3, restitution: 0 });
      this.add("cake", body, w / 2, h / 2, i);
      y += h + 0.005;
    }
  }

  /** Marks items as already lost and removes them (continuing from a checkpoint). */
  removeLost(ids: number[], reasons: LostReason[]): void {
    ids.forEach((id, k) => {
      const item = this.items[id];
      if (!item) return;
      item.lost = true;
      item.lostReason = reasons[k];
      if (item.body) this.gw.world.destroyBody(item.body);
      if (item.water) this.gw.world.destroyBody(item.water);
      item.body = null;
      item.water = undefined;
      item.meltAt = undefined;
    });
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
    if (item.type === "grandpa" && item.body && !item.lost && impulse / item.body.getMass() > 1.0) {
      this.newlyBumped.push(item);
      return;
    }
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

  /** Distance, melting and spilling checks. Call after every physics step. */
  afterStep(time: number): void {
    for (const item of this.items) {
      if (!item.body) continue;
      if (item.type === "icecream" && item.meltAt !== undefined && time >= item.meltAt) {
        const p = item.body.getPosition();
        item.brokenAt = { x: p.x, y: p.y };
        if (!item.lost) this.markLost(item, "melted");
        item.lostReason = "melted";
        this.toDestroy.push(item);
        item.meltAt = undefined;
      } else if (item.type === "aquarium" && !item.lost) {
        const a = item.body.getAngle();
        const tilt = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
        if (tilt > CARGO.spillAngle) this.markLost(item, "spilled");
      }
    }

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
