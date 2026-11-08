import { Body, Box, Polygon, RevoluteJoint } from "planck";
import { heightAt } from "../levels/terrain";
import type { LevelObject } from "../levels/types";
import type { FixtureTag, GameWorld } from "./World";

const GROUND: FixtureTag = { kind: "ground" };
const CEILING: FixtureTag = { kind: "ceiling" };

export const LIFT = { speed: 1.6, wait: 2.4 };

export interface BridgeObj {
  type: "bridge";
  planks: Body[];
  hw: number;
  anchors: [{ x: number; y: number }, { x: number; y: number }];
}
export interface TunnelObj {
  type: "tunnel";
  x0: number;
  x1: number;
  y: number; // ceiling bottom
}
export interface SeesawObj {
  type: "seesaw";
  plank: Body;
  hw: number;
  pivot: { x: number; y: number; ground: number };
}
export interface LiftObj {
  type: "lift";
  body: Body;
  hw: number;
  x0: number;
  x1: number;
  bottom: number;
  top: number;
}
export type ObstacleObj = BridgeObj | TunnelObj | SeesawObj | LiftObj;

/** Builds the physics bodies for a level's obstacles and moves the lifts. */
export class Obstacles {
  readonly items: ObstacleObj[] = [];
  readonly surfaces: { type: "ice" | "mud"; x0: number; x1: number }[] = [];
  private time = 0;

  constructor(
    private gw: GameWorld,
    objects: LevelObject[],
  ) {
    for (const o of objects) {
      if (o.type === "bridge") this.addBridge(o.x0, o.x1);
      else if (o.type === "tunnel") this.addTunnel(o.x0, o.x1, o.height);
      else if (o.type === "seesaw") this.addSeesaw(o.x, o.length, o.pivotHeight);
      else if (o.type === "lift") this.addLift(o.x0, o.x1, o.bottom, o.top);
      else this.surfaces.push({ type: o.type, x0: o.x0, x1: o.x1 });
    }
  }

  private ground(x: number): number {
    return heightAt(this.gw.terrain, x);
  }

  private addBridge(x0: number, x1: number): void {
    const world = this.gw.world;
    const a = { x: x0, y: this.ground(x0 - 0.05) };
    const b = { x: x1, y: this.ground(x1 + 0.05) };
    const span = Math.hypot(b.x - a.x, b.y - a.y);
    const count = Math.max(3, Math.ceil(span / 0.8));
    // a little longer than the gap so the bridge sags and wobbles
    const hw = (span * 1.03) / count / 2;
    const planks: Body[] = [];
    let prev: Body = this.gw.ground;
    let prevAnchor = a;
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const body = world.createBody({
        type: "dynamic",
        position: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - 0.1 },
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        angularDamping: 0.5,
        linearDamping: 0.2,
      });
      body.createFixture(new Box(hw - 0.015, 0.1), { density: 1.2, friction: 0.9, userData: GROUND });
      world.createJoint(new RevoluteJoint({}, prev, body, prevAnchor));
      prev = body;
      prevAnchor = body.getWorldPoint({ x: hw, y: 0.1 });
      planks.push(body);
    }
    world.createJoint(new RevoluteJoint({}, prev, this.gw.ground, b));
    this.items.push({ type: "bridge", planks, hw, anchors: [a, b] });
  }

  private addTunnel(x0: number, x1: number, height: number): void {
    const y = Math.max(this.ground(x0), this.ground(x1), this.ground((x0 + x1) / 2)) + height;
    const body = this.gw.world.createBody({ type: "static" });
    body.createFixture(
      new Polygon([
        { x: x0, y },
        { x: x1, y },
        { x: x1, y: y + 12 },
        { x: x0, y: y + 12 },
      ]),
      { friction: 0.6, userData: CEILING },
    );
    this.items.push({ type: "tunnel", x0, x1, y });
  }

  private addSeesaw(x: number, length: number, pivotHeight: number): void {
    const world = this.gw.world;
    const g = this.ground(x);
    const pivot = { x, y: g + pivotHeight, ground: g };
    const stand = world.createBody({ type: "static" });
    stand.createFixture(
      new Polygon([
        { x: x - 0.6, y: g - 0.2 },
        { x: x + 0.6, y: g - 0.2 },
        { x, y: pivot.y - 0.05 },
      ]),
      { friction: 0.5, userData: GROUND },
    );
    const hw = length / 2;
    const limit = Math.asin(Math.min(0.95, pivotHeight / hw));
    const plank = world.createBody({ type: "dynamic", position: { x, y: pivot.y }, angle: limit, angularDamping: 4 });
    plank.createFixture(new Box(hw, 0.12), { density: 0.8, friction: 0.9, userData: GROUND });
    world.createJoint(
      new RevoluteJoint({ enableLimit: true, lowerAngle: -limit, upperAngle: limit }, stand, plank, { x, y: pivot.y }),
    );
    this.items.push({ type: "seesaw", plank, hw, pivot });
  }

  private addLift(x0: number, x1: number, bottom: number, top: number): void {
    const hw = (x1 - x0) / 2 - 0.06;
    const body = this.gw.world.createBody({ type: "kinematic", position: { x: (x0 + x1) / 2, y: bottom - 0.15 } });
    body.createFixture(new Box(hw, 0.15), { friction: 0.9, userData: GROUND });
    this.items.push({ type: "lift", body, hw, x0, x1, bottom, top });
  }

  /** Lift height (top surface) at time t: wait at the bottom, rise, wait at the top, sink. */
  static liftHeight(o: { bottom: number; top: number }, t: number): number {
    const travel = (o.top - o.bottom) / LIFT.speed;
    const cycle = 2 * (LIFT.wait + travel);
    const p = t % cycle;
    if (p < LIFT.wait) return o.bottom;
    if (p < LIFT.wait + travel) return o.bottom + (p - LIFT.wait) * LIFT.speed;
    if (p < 2 * LIFT.wait + travel) return o.top;
    return o.top - (p - 2 * LIFT.wait - travel) * LIFT.speed;
  }

  /** Called before every physics step. */
  beforeStep(dt: number): void {
    this.time += dt;
    for (const o of this.items) {
      if (o.type !== "lift") continue;
      const target = Obstacles.liftHeight(o, this.time + dt) - 0.15;
      const y = o.body.getPosition().y;
      o.body.setLinearVelocity({ x: 0, y: (target - y) / dt });
    }
  }

  surfaceAt(x: number): "ice" | "mud" | null {
    for (const s of this.surfaces) if (x >= s.x0 && x <= s.x1) return s.type;
    return null;
  }
}
