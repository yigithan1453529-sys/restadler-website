import { Body, Chain, Contact, ContactImpulse, Edge, Fixture, World as PlanckWorld } from "planck";
import { buildTerrain } from "../levels/terrain";
import type { LevelData } from "../levels/types";
import type { CargoItem } from "./Cargo";
import { Obstacles } from "./Obstacles";

export const PHYSICS_STEP = 1 / 60;
export const GRAVITY = 10;

/** Data attached to every fixture so contacts can be identified. */
export type FixtureTag =
  | { kind: "ground" }
  | { kind: "ceiling" }
  | { kind: "car" }
  | { kind: "wheel" }
  | { kind: "cargo"; item: CargoItem };

export type WorldEvent =
  | { type: "cargoGround"; item: CargoItem }
  | { type: "cargoImpact"; item: CargoItem; impulse: number }
  | { type: "carImpact"; impulse: number };

function tagOf(f: Fixture): FixtureTag | null {
  return (f.getUserData() as FixtureTag | null) ?? null;
}

/** planck world with terrain, fixed time step and contact events. */
export class GameWorld {
  readonly world: PlanckWorld;
  readonly terrain: { x: number; y: number }[];
  readonly ground: Body;
  readonly minY: number;
  readonly maxY: number;
  readonly obstacles: Obstacles;
  events: WorldEvent[] = [];
  /** Simulated time in seconds. */
  time = 0;
  private accumulator = 0;

  constructor(level: LevelData) {
    this.world = new PlanckWorld({ gravity: { x: 0, y: -GRAVITY } });
    this.terrain = buildTerrain(level.terrain);
    this.minY = Math.min(...this.terrain.map((p) => p.y));
    this.maxY = Math.max(...this.terrain.map((p) => p.y));

    this.ground = this.world.createBody({ type: "static" });
    const groundOpt = { friction: 0.9, userData: { kind: "ground" } satisfies FixtureTag };
    this.ground.createFixture(new Chain(this.terrain, false), groundOpt);

    // Walls at both ends so nothing leaves the level sideways.
    const first = this.terrain[0];
    const last = this.terrain[this.terrain.length - 1];
    this.ground.createFixture(new Edge({ x: first.x, y: first.y - 1 }, { x: first.x, y: first.y + 30 }), groundOpt);
    this.ground.createFixture(new Edge({ x: last.x, y: last.y - 1 }, { x: last.x, y: last.y + 30 }), groundOpt);

    this.obstacles = new Obstacles(this, level.objects ?? []);

    this.world.on("begin-contact", (c: Contact) => this.onBegin(c));
    this.world.on("pre-solve", (c: Contact) => this.onPreSolve(c));
    this.world.on("post-solve", (c: Contact, imp: ContactImpulse) => this.onPostSolve(c, imp));
  }

  private onBegin(c: Contact): void {
    const a = tagOf(c.getFixtureA());
    const b = tagOf(c.getFixtureB());
    if (!a || !b) return;
    if (a.kind === "ground" && b.kind === "cargo") this.events.push({ type: "cargoGround", item: b.item });
    else if (b.kind === "ground" && a.kind === "cargo") this.events.push({ type: "cargoGround", item: a.item });
  }

  /** Ice and mud: change the friction of contacts on those ground parts. */
  private onPreSolve(c: Contact): void {
    if (this.obstacles.surfaces.length === 0) return;
    const a = tagOf(c.getFixtureA());
    const b = tagOf(c.getFixtureB());
    if (a?.kind !== "ground" && b?.kind !== "ground") return;
    const wm = c.getWorldManifold(null);
    const p = wm?.points[0];
    if (!p) return;
    const surface = this.obstacles.surfaceAt(p.x);
    if (surface === "ice") c.setFriction(0.03);
    else if (surface === "mud") c.setFriction(0.45);
  }

  private onPostSolve(c: Contact, imp: ContactImpulse): void {
    const a = tagOf(c.getFixtureA());
    const b = tagOf(c.getFixtureB());
    if (!a || !b) return;
    const impulses = imp.normalImpulses;
    let sum = 0;
    for (let i = 0; i < c.getManifold().pointCount; i++) sum += impulses[i] ?? 0;
    if (sum <= 0) return;
    if (a.kind === "cargo") this.events.push({ type: "cargoImpact", item: a.item, impulse: sum });
    if (b.kind === "cargo") this.events.push({ type: "cargoImpact", item: b.item, impulse: sum });
    const carHitsGround =
      (a.kind === "ground" && (b.kind === "wheel" || b.kind === "car")) ||
      (b.kind === "ground" && (a.kind === "wheel" || a.kind === "car"));
    if (carHitsGround) this.events.push({ type: "carImpact", impulse: sum });
  }

  /**
   * Advances the simulation by real time dt using a fixed step.
   * `beforeStep` runs before every physics step (controls), `afterStep` after it.
   */
  advance(dt: number, beforeStep: () => void, afterStep: () => void): void {
    this.accumulator += Math.min(dt, 0.1);
    while (this.accumulator >= PHYSICS_STEP) {
      beforeStep();
      this.obstacles.beforeStep(PHYSICS_STEP);
      this.world.step(PHYSICS_STEP, 8, 3);
      this.time += PHYSICS_STEP;
      afterStep();
      this.accumulator -= PHYSICS_STEP;
    }
  }

  /** Returns true if the body touches the ground fixture right now. */
  touchesGround(body: Body): boolean {
    for (let ce = body.getContactList(); ce; ce = ce.next) {
      const c = ce.contact;
      if (!c.isTouching()) continue;
      const a = tagOf(c.getFixtureA());
      const b = tagOf(c.getFixtureB());
      if (a?.kind === "ground" || b?.kind === "ground") return true;
    }
    return false;
  }
}
