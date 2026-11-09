import { Body, Polygon, Vec2Value, WheelJoint, Circle } from "planck";
import type { TextKey } from "../i18n";
import { PHYSICS_STEP, type FixtureTag, type GameWorld } from "./World";

type Pt = { x: number; y: number };

export type VehicleId =
  | "van"
  | "tractor"
  | "pickup"
  | "racer"
  | "police"
  | "policeVan"
  | "ambulance"
  | "fireTruck"
  | "lorry"
  | "superRed"
  | "superYellow";

/** Everything that makes one vehicle different. Forces in N, speeds in m/s. */
export interface VehicleSpec {
  id: VehicleId;
  name: TextKey;
  /** Price in the shop (coins). */
  price: number;
  color: string;
  rear: { x: number; y: number; r: number };
  front: { x: number; y: number; r: number };
  /** Cargo bed in chassis-local coordinates. */
  bed: { left: number; right: number; floor: number; wallTop: number };
  body: Pt[];
  rearWall: Pt[];
  cabin: Pt[];
  window: Pt[];
  driver: Pt;
  density: number;
  maxSpeed: number;
  driveForce: number;
  brakeForce: number;
  reverseSpeed: number;
  reverseForce: number;
  airTorque: number;
  springHz: number;
  /** Number of forward gears (automatic gearbox). */
  gears: number;
  /** Spring damping ratio (default 0.7). */
  damping?: number;
}

const BODY: Pt[] = [
  { x: -1.5, y: -0.2 },
  { x: 1.5, y: -0.2 },
  { x: 1.5, y: 0.2 },
  { x: -1.5, y: 0.2 },
];
const VAN_CABIN: Pt[] = [
  { x: 0.2, y: 0.2 },
  { x: 1.5, y: 0.2 },
  { x: 1.5, y: 0.55 },
  { x: 1.15, y: 0.62 },
  { x: 0.9, y: 1.05 },
  { x: 0.2, y: 1.05 },
];
const VAN_WINDOW: Pt[] = [
  { x: 0.32, y: 0.62 },
  { x: 1.04, y: 0.62 },
  { x: 0.84, y: 0.95 },
  { x: 0.32, y: 0.95 },
];

function wall(left: number, top: number): Pt[] {
  return [
    { x: -1.5, y: 0.2 },
    { x: left, y: 0.2 },
    { x: left, y: top },
    { x: -1.5, y: top },
  ];
}

export const VEHICLES: VehicleSpec[] = [
  {
    id: "van",
    name: "vehicle.van",
    price: 0,
    color: "#FF6B35",
    rear: { x: -1.0, y: -0.5, r: 0.45 },
    front: { x: 1.0, y: -0.5, r: 0.45 },
    bed: { left: -1.37, right: 0.2, floor: 0.2, wallTop: 0.45 },
    body: BODY,
    rearWall: wall(-1.37, 0.45),
    cabin: VAN_CABIN,
    window: VAN_WINDOW,
    driver: { x: 0.55, y: 0.76 },
    density: 1.5,
    maxSpeed: 16,
    driveForce: 20,
    brakeForce: 49,
    reverseSpeed: 5,
    reverseForce: 13,
    airTorque: 14,
    springHz: 4,
    gears: 4,
  },
  {
    // Slow but strong; big rear wheels soak up bumps.
    id: "tractor",
    name: "vehicle.tractor",
    price: 150,
    color: "#4CAF50",
    rear: { x: -0.95, y: -0.42, r: 0.62 },
    front: { x: 1.1, y: -0.62, r: 0.36 },
    bed: { left: -1.37, right: 0.2, floor: 0.2, wallTop: 0.5 },
    body: BODY,
    rearWall: wall(-1.37, 0.5),
    cabin: [
      { x: 0.2, y: 0.2 },
      { x: 1.5, y: 0.2 },
      { x: 1.5, y: 0.6 },
      { x: 0.95, y: 0.62 },
      { x: 0.95, y: 1.15 },
      { x: 0.2, y: 1.15 },
    ],
    window: [
      { x: 0.32, y: 0.66 },
      { x: 0.84, y: 0.66 },
      { x: 0.84, y: 1.04 },
      { x: 0.32, y: 1.04 },
    ],
    driver: { x: 0.55, y: 0.82 },
    density: 1.9,
    maxSpeed: 10.5,
    driveForce: 30,
    brakeForce: 60,
    reverseSpeed: 4,
    reverseForce: 18,
    airTorque: 16,
    springHz: 3,
    gears: 3,
  },
  {
    // Fast pickup with high side walls: cargo stays in much better.
    id: "pickup",
    name: "vehicle.pickup",
    price: 350,
    color: "#4D9DE0",
    rear: { x: -1.0, y: -0.5, r: 0.45 },
    front: { x: 1.0, y: -0.5, r: 0.45 },
    bed: { left: -1.37, right: 0.2, floor: 0.2, wallTop: 0.75 },
    body: BODY,
    rearWall: wall(-1.37, 0.75),
    cabin: VAN_CABIN,
    window: VAN_WINDOW,
    driver: { x: 0.55, y: 0.76 },
    density: 1.5,
    maxSpeed: 17.5,
    driveForce: 22,
    brakeForce: 52,
    reverseSpeed: 5,
    reverseForce: 13,
    airTorque: 14,
    springHz: 4,
    gears: 4,
  },
  {
    // Race truck: very fast and strong, but low walls: careful with the cargo!
    id: "racer",
    name: "vehicle.racer",
    price: 700,
    color: "#E63946",
    rear: { x: -1.0, y: -0.5, r: 0.48 },
    front: { x: 1.05, y: -0.5, r: 0.48 },
    bed: { left: -1.37, right: 0.1, floor: 0.2, wallTop: 0.42 },
    body: [
      { x: -1.55, y: -0.32 },
      { x: 1.6, y: -0.32 },
      { x: 1.6, y: 0.2 },
      { x: -1.55, y: 0.2 },
    ],
    rearWall: wall(-1.37, 0.42),
    cabin: [
      { x: 0.1, y: 0.2 },
      { x: 1.55, y: 0.2 },
      { x: 1.55, y: 0.6 },
      { x: 1.0, y: 0.66 },
      { x: 0.8, y: 1.1 },
      { x: 0.1, y: 1.1 },
    ],
    window: [
      { x: 0.22, y: 0.7 },
      { x: 0.92, y: 0.7 },
      { x: 0.74, y: 1.0 },
      { x: 0.22, y: 1.0 },
    ],
    driver: { x: 0.45, y: 0.8 },
    density: 1.6,
    maxSpeed: 21,
    driveForce: 26,
    brakeForce: 55,
    reverseSpeed: 5,
    reverseForce: 15,
    airTorque: 16,
    springHz: 4.5,
    gears: 5,
  },
  {
    // Police car: a quick sedan with an open trunk and a light bar.
    id: "police",
    name: "vehicle.police",
    price: 450,
    color: "#FFFFFF",
    rear: { x: -1.0, y: -0.5, r: 0.44 },
    front: { x: 1.05, y: -0.5, r: 0.44 },
    bed: { left: -1.37, right: 0.15, floor: 0.2, wallTop: 0.42 },
    body: BODY,
    rearWall: wall(-1.37, 0.42),
    cabin: [
      { x: 0.15, y: 0.2 },
      { x: 1.55, y: 0.2 },
      { x: 1.55, y: 0.5 },
      { x: 1.1, y: 0.58 },
      { x: 0.85, y: 0.98 },
      { x: 0.15, y: 0.98 },
    ],
    window: [
      { x: 0.27, y: 0.62 },
      { x: 1.0, y: 0.62 },
      { x: 0.8, y: 0.9 },
      { x: 0.27, y: 0.9 },
    ],
    driver: { x: 0.5, y: 0.74 },
    density: 1.4,
    maxSpeed: 19,
    driveForce: 23,
    brakeForce: 52,
    reverseSpeed: 5,
    reverseForce: 13,
    airTorque: 14,
    springHz: 4.5,
    gears: 5,
  },
  {
    // Police van: tall and steady, with high rear doors.
    id: "policeVan",
    name: "vehicle.policeVan",
    price: 500,
    color: "#2F5DA8",
    rear: { x: -1.0, y: -0.5, r: 0.45 },
    front: { x: 1.05, y: -0.5, r: 0.45 },
    bed: { left: -1.37, right: 0.2, floor: 0.2, wallTop: 0.62 },
    body: BODY,
    rearWall: wall(-1.37, 0.62),
    cabin: [
      { x: 0.2, y: 0.2 },
      { x: 1.55, y: 0.2 },
      { x: 1.55, y: 0.62 },
      { x: 1.25, y: 0.72 },
      { x: 1.1, y: 1.2 },
      { x: 0.2, y: 1.2 },
    ],
    window: [
      { x: 0.7, y: 0.74 },
      { x: 1.2, y: 0.74 },
      { x: 1.08, y: 1.1 },
      { x: 0.7, y: 1.1 },
    ],
    driver: { x: 0.92, y: 0.88 },
    density: 1.6,
    maxSpeed: 16,
    driveForce: 24,
    brakeForce: 55,
    reverseSpeed: 5,
    reverseForce: 15,
    airTorque: 15,
    springHz: 4,
    gears: 4,
  },
  {
    // Ambulance: a white box with a red cross.
    id: "ambulance",
    name: "vehicle.ambulance",
    price: 550,
    color: "#FFFFFF",
    rear: { x: -1.0, y: -0.5, r: 0.45 },
    front: { x: 1.05, y: -0.5, r: 0.45 },
    bed: { left: -1.37, right: 0.2, floor: 0.2, wallTop: 0.58 },
    body: BODY,
    rearWall: wall(-1.37, 0.58),
    cabin: [
      { x: 0.2, y: 0.2 },
      { x: 1.55, y: 0.2 },
      { x: 1.55, y: 0.6 },
      { x: 1.2, y: 0.68 },
      { x: 1.0, y: 1.15 },
      { x: 0.2, y: 1.15 },
    ],
    window: [
      { x: 0.62, y: 0.7 },
      { x: 1.12, y: 0.7 },
      { x: 0.98, y: 1.05 },
      { x: 0.62, y: 1.05 },
    ],
    driver: { x: 0.85, y: 0.84 },
    density: 1.5,
    maxSpeed: 17.5,
    driveForce: 23,
    brakeForce: 52,
    reverseSpeed: 5,
    reverseForce: 14,
    airTorque: 14,
    springHz: 4,
    gears: 4,
  },
  {
    // Fire truck: heavy and strong, with a ladder on top.
    id: "fireTruck",
    name: "vehicle.fireTruck",
    price: 650,
    color: "#E63946",
    rear: { x: -1.0, y: -0.48, r: 0.5 },
    front: { x: 1.05, y: -0.48, r: 0.5 },
    bed: { left: -1.37, right: 0.2, floor: 0.2, wallTop: 0.55 },
    body: BODY,
    rearWall: wall(-1.37, 0.55),
    cabin: [
      { x: 0.2, y: 0.2 },
      { x: 1.58, y: 0.2 },
      { x: 1.58, y: 1.1 },
      { x: 0.2, y: 1.1 },
    ],
    window: [
      { x: 0.95, y: 0.66 },
      { x: 1.48, y: 0.66 },
      { x: 1.48, y: 1.0 },
      { x: 0.95, y: 1.0 },
    ],
    driver: { x: 1.18, y: 0.8 },
    density: 1.9,
    maxSpeed: 15,
    driveForce: 31,
    brakeForce: 62,
    reverseSpeed: 4.5,
    reverseForce: 18,
    airTorque: 17,
    springHz: 3.6,
    gears: 5,
  },
  {
    // Lorry: a big cab-over truck, strongest of all but not fast.
    id: "lorry",
    name: "vehicle.lorry",
    price: 600,
    color: "#FFB627",
    rear: { x: -0.95, y: -0.45, r: 0.55 },
    front: { x: 1.05, y: -0.45, r: 0.55 },
    bed: { left: -1.37, right: 0.2, floor: 0.2, wallTop: 0.62 },
    body: BODY,
    rearWall: wall(-1.37, 0.62),
    cabin: [
      { x: 0.2, y: 0.2 },
      { x: 1.6, y: 0.2 },
      { x: 1.6, y: 1.25 },
      { x: 0.2, y: 1.25 },
    ],
    window: [
      { x: 0.9, y: 0.75 },
      { x: 1.5, y: 0.75 },
      { x: 1.5, y: 1.14 },
      { x: 0.9, y: 1.14 },
    ],
    driver: { x: 1.15, y: 0.9 },
    density: 2.1,
    maxSpeed: 14,
    driveForce: 35,
    brakeForce: 66,
    reverseSpeed: 4.5,
    reverseForce: 20,
    airTorque: 18,
    springHz: 3.4,
    gears: 5,
  },
  {
    // Red supercar: very fast, low walls, stiff sport suspension.
    id: "superRed",
    name: "vehicle.superRed",
    price: 1200,
    color: "#D62828",
    rear: { x: -1.0, y: -0.36, r: 0.43 },
    front: { x: 1.1, y: -0.36, r: 0.43 },
    bed: { left: -1.37, right: 0.1, floor: 0.2, wallTop: 0.38 },
    body: [
      { x: -1.55, y: -0.3 },
      { x: 1.62, y: -0.3 },
      { x: 1.78, y: -0.05 },
      { x: 1.7, y: 0.2 },
      { x: -1.55, y: 0.2 },
    ],
    rearWall: wall(-1.37, 0.38),
    cabin: [
      { x: 0.1, y: 0.2 },
      { x: 1.62, y: 0.2 },
      { x: 1.62, y: 0.36 },
      { x: 0.95, y: 0.52 },
      { x: 0.55, y: 0.78 },
      { x: 0.1, y: 0.76 },
    ],
    window: [
      { x: 0.22, y: 0.54 },
      { x: 0.85, y: 0.54 },
      { x: 0.53, y: 0.71 },
      { x: 0.22, y: 0.7 },
    ],
    driver: { x: 0.42, y: 0.6 },
    density: 1.35,
    maxSpeed: 25,
    driveForce: 28,
    brakeForce: 60,
    reverseSpeed: 5,
    reverseForce: 14,
    airTorque: 15,
    springHz: 5,
    gears: 5,
  },
  {
    // Yellow wedge supercar: the fastest vehicle in the game.
    id: "superYellow",
    name: "vehicle.superYellow",
    price: 1500,
    color: "#FFD60A",
    rear: { x: -1.0, y: -0.36, r: 0.43 },
    front: { x: 1.12, y: -0.36, r: 0.43 },
    bed: { left: -1.37, right: 0.1, floor: 0.2, wallTop: 0.36 },
    body: [
      { x: -1.55, y: -0.3 },
      { x: 1.62, y: -0.3 },
      { x: 1.78, y: -0.05 },
      { x: 1.7, y: 0.2 },
      { x: -1.55, y: 0.2 },
    ],
    rearWall: wall(-1.37, 0.36),
    cabin: [
      { x: 0.1, y: 0.2 },
      { x: 1.66, y: 0.2 },
      { x: 1.66, y: 0.3 },
      { x: 1.0, y: 0.47 },
      { x: 0.5, y: 0.74 },
      { x: 0.1, y: 0.7 },
    ],
    window: [
      { x: 0.22, y: 0.5 },
      { x: 0.9, y: 0.49 },
      { x: 0.48, y: 0.68 },
      { x: 0.22, y: 0.65 },
    ],
    driver: { x: 0.4, y: 0.57 },
    density: 1.35,
    maxSpeed: 27,
    driveForce: 30,
    brakeForce: 62,
    reverseSpeed: 5,
    reverseForce: 14,
    airTorque: 15,
    springHz: 5.2,
    gears: 5,
  },
];

// ---------- upgrades ----------

export type UpgradeKind = "engine" | "suspension" | "brakes" | "walls";
export const UPGRADE_KINDS: UpgradeKind[] = ["engine", "suspension", "brakes", "walls"];
export const MAX_UPGRADE = 3;
/** Coins for upgrade level 1, 2 and 3. */
export const UPGRADE_PRICES = [80, 160, 300];
export type UpgradeLevels = Partial<Record<UpgradeKind, number>>;

/**
 * A copy of the spec with the bought upgrades applied:
 * engine = faster and stronger, suspension = softer landings,
 * brakes = stronger brakes, walls = higher bed walls.
 */
export function upgradedSpec(spec: VehicleSpec, up: UpgradeLevels): VehicleSpec {
  const e = up.engine ?? 0;
  const su = up.suspension ?? 0;
  const b = up.brakes ?? 0;
  const w = up.walls ?? 0;
  const wallTop = spec.bed.wallTop + 0.06 * w;
  return {
    ...spec,
    maxSpeed: spec.maxSpeed * (1 + 0.07 * e),
    driveForce: spec.driveForce * (1 + 0.1 * e),
    brakeForce: spec.brakeForce * (1 + 0.15 * b),
    springHz: spec.springHz * (1 - 0.07 * su),
    damping: Math.min(1, (spec.damping ?? 0.7) + 0.07 * su),
    bed: { ...spec.bed, wallTop },
    rearWall: wall(spec.bed.left, wallTop),
  };
}

export function getVehicleSpec(id: string): VehicleSpec {
  return VEHICLES.find((v) => v.id === id) ?? VEHICLES[0];
}

const ROLLING_FORCE = 0.8;
const MAX_AIR_SPIN = 4;

export interface DriveInput {
  gas: boolean;
  brake: boolean;
  nitro?: boolean;
}

export const NITRO = {
  /** Seconds a full tank lasts. */
  burn: 1.6,
  /** Seconds to refill from empty. */
  refill: 6,
  speedBoost: 1.35,
  forceBoost: 1.6,
};

/** Share of the top speed reached at the end of each gear (gear 1..n). */
export function gearTop(spec: VehicleSpec, gear: number): number {
  return spec.maxSpeed * Math.pow(gear / spec.gears, 0.8);
}

/** Pulling force in a gear: strong in first gear, weaker in top gear. */
function gearForce(spec: VehicleSpec, gear: number): number {
  const k = spec.gears > 1 ? (gear - 1) / (spec.gears - 1) : 0;
  return spec.driveForce * (1.35 - 0.45 * k);
}

const SHIFT_TIME = 0.1;

export class Vehicle {
  readonly chassis: Body;
  readonly rearWheel: Body;
  readonly frontWheel: Body;
  readonly rearJoint: WheelJoint;
  readonly frontJoint: WheelJoint;
  onGround = false;
  /** 0..1 while driving (for dust and engine sound). */
  throttle = 0;
  /** Current gear: 1..spec.gears, 0 = reverse. */
  gear = 1;
  /** Engine speed 0..1 within the current gear (for the sound and the rev counter). */
  rpm = 0;
  /** Set for one step when the gearbox shifts up (for sound and exhaust puff). */
  shiftedUp = false;
  /** Nitro tank 0..1 and whether it burns right now. */
  nitro = 1;
  nitroActive = false;
  /** Set for one step when nitro is fired (for sound and statistics). */
  nitroFired = false;
  private shiftTimer = 0;

  constructor(
    private gw: GameWorld,
    position: Vec2Value,
    readonly spec: VehicleSpec = VEHICLES[0],
  ) {
    const world = gw.world;
    const carTag: FixtureTag = { kind: "car" };
    const wheelTag: FixtureTag = { kind: "wheel" };

    this.chassis = world.createBody({ type: "dynamic", position });
    const group = -2; // same group as a trailer: they never collide with each other
    this.chassis.createFixture(new Polygon(spec.body), { density: spec.density, friction: 0.6, userData: carTag, filterGroupIndex: group });
    this.chassis.createFixture(new Polygon(spec.rearWall), { density: 1, friction: 0.6, userData: carTag, filterGroupIndex: group });
    this.chassis.createFixture(new Polygon(spec.cabin), { density: 0.8, friction: 0.6, userData: carTag, filterGroupIndex: group });

    const mkWheel = (w: { x: number; y: number; r: number }): Body => {
      const b = world.createBody({ type: "dynamic", position: { x: position.x + w.x, y: position.y + w.y } });
      b.createFixture(new Circle(w.r), { density: 1, friction: 1.0, userData: wheelTag, filterGroupIndex: group });
      return b;
    };
    this.rearWheel = mkWheel(spec.rear);
    this.frontWheel = mkWheel(spec.front);

    const axis = { x: 0, y: 1 };
    const mkJoint = (wheel: Body, r: number): WheelJoint =>
      world.createJoint(
        new WheelJoint(
          {
            enableMotor: true,
            motorSpeed: 0,
            maxMotorTorque: ROLLING_FORCE * r,
            frequencyHz: spec.springHz,
            dampingRatio: spec.damping ?? 0.7,
          },
          this.chassis,
          wheel,
          wheel.getPosition(),
          axis,
        ),
      )!;
    this.rearJoint = mkJoint(this.rearWheel, spec.rear.r);
    this.frontJoint = mkJoint(this.frontWheel, spec.front.r);
  }

  /** Forward speed in m/s (positive = to the right). */
  get speed(): number {
    return this.chassis.getLinearVelocity().x;
  }

  get position(): Vec2Value {
    return this.chassis.getPosition();
  }

  /** Called before every physics step. */
  control(input: DriveInput): void {
    const s = this.spec;
    this.onGround = this.gw.touchesGround(this.rearWheel) || this.gw.touchesGround(this.frontWheel);

    // Linear target speed (m/s) and force (N); converted per wheel below.
    let speed = 0;
    let force = ROLLING_FORCE;
    this.throttle = 0;
    this.shiftedUp = false;
    const v = Math.max(0, -this.rearWheel.getAngularVelocity() * s.rear.r);

    // Automatic gearbox: shift up near the end of a gear, down when slow.
    if (this.gear < 1) this.gear = 1;
    if (this.shiftTimer > 0) this.shiftTimer -= PHYSICS_STEP;
    if (input.gas && this.gear < s.gears && v > gearTop(s, this.gear) * 0.94 && this.shiftTimer <= 0) {
      this.gear++;
      this.shiftTimer = SHIFT_TIME;
      this.shiftedUp = true;
    }
    while (this.gear > 1 && v < gearTop(s, this.gear - 1) * 0.72) this.gear--;
    this.rpm = Math.min(1, Math.max(0.12, v / gearTop(s, this.gear)));

    // Nitro: needs gas and some charge to start; burns until empty or released.
    this.nitroFired = false;
    const wantNitro = !!input.nitro && input.gas && !input.brake;
    if (wantNitro && !this.nitroActive && this.nitro > 0.25) {
      this.nitroActive = true;
      this.nitroFired = true;
    }
    if (!wantNitro || this.nitro <= 0) this.nitroActive = false;
    if (this.nitroActive) this.nitro = Math.max(0, this.nitro - PHYSICS_STEP / NITRO.burn);
    else this.nitro = Math.min(1, this.nitro + PHYSICS_STEP / NITRO.refill);

    if (input.gas && !input.brake) {
      speed = gearTop(s, this.gear) * 1.02 * (this.nitroActive ? NITRO.speedBoost : 1);
      // Less pull for a moment while shifting (a soft clutch, no hard jerk).
      force = gearForce(s, this.gear) * (this.shiftTimer > 0 ? 0.55 : 1) * (this.nitroActive ? NITRO.forceBoost : 1);
      this.throttle = this.shiftTimer > 0 ? 0.5 : 1;
    } else if (input.brake && !input.gas) {
      const wheelSpin = -this.rearWheel.getAngularVelocity() * s.rear.r;
      if (wheelSpin > 0.4 || this.speed > 0.6) {
        speed = 0;
        force = s.brakeForce;
      } else {
        speed = -s.reverseSpeed;
        force = s.reverseForce;
        this.throttle = 0.6;
        this.gear = 0;
        this.rpm = Math.min(1, Math.abs(this.speed) / s.reverseSpeed);
      }
    }

    // Negative angular velocity = clockwise = drive to the right. All-wheel drive.
    this.rearJoint.setMotorSpeed(-speed / s.rear.r);
    this.rearJoint.setMaxMotorTorque(force * s.rear.r);
    this.frontJoint.setMotorSpeed(-speed / s.front.r);
    this.frontJoint.setMaxMotorTorque(force * s.front.r);

    // Mud slows the vehicle down.
    if (this.onGround && this.gw.obstacles.surfaceAt(this.chassis.getPosition().x) === "mud") {
      const v = this.chassis.getLinearVelocity();
      const m = this.chassis.getMass() + this.rearWheel.getMass() + this.frontWheel.getMass();
      this.chassis.applyForceToCenter({ x: -v.x * m * 1.6, y: 0 }, true);
    }

    // Tilt in the air: right = nose down (clockwise), left = nose up.
    if (!this.onGround && input.gas !== input.brake) {
      const dir = input.gas ? -1 : 1;
      const spin = this.chassis.getAngularVelocity();
      if (spin * dir < MAX_AIR_SPIN) this.chassis.applyTorque(dir * s.airTorque, true);
    }
  }

  /** "Up" component of the chassis: 1 = upright, -1 = upside down. */
  get uprightness(): number {
    return Math.cos(this.chassis.getAngle());
  }

  /** World position of the center of the cargo bed. */
  bedCenter(): Vec2Value {
    const b = this.spec.bed;
    return this.chassis.getWorldPoint({ x: (b.left + b.right) / 2, y: b.floor + 0.3 });
  }
}
