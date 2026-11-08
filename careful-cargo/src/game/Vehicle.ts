import { Body, Polygon, Vec2Value, WheelJoint, Circle } from "planck";
import type { TextKey } from "../i18n";
import type { FixtureTag, GameWorld } from "./World";

type Pt = { x: number; y: number };

export type VehicleId = "van" | "tractor" | "pickup" | "racer";

/** Everything that makes one vehicle different. Forces in N, speeds in m/s. */
export interface VehicleSpec {
  id: VehicleId;
  name: TextKey;
  /** Total stars needed to unlock. */
  unlockStars: number;
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
    unlockStars: 0,
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
    maxSpeed: 12.6,
    driveForce: 20,
    brakeForce: 49,
    reverseSpeed: 5,
    reverseForce: 13,
    airTorque: 14,
    springHz: 4,
  },
  {
    // Slow but strong; big rear wheels soak up bumps.
    id: "tractor",
    name: "vehicle.tractor",
    unlockStars: 15,
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
    maxSpeed: 9,
    driveForce: 30,
    brakeForce: 60,
    reverseSpeed: 4,
    reverseForce: 18,
    airTorque: 16,
    springHz: 3,
  },
  {
    // Fast pickup with high side walls: cargo stays in much better.
    id: "pickup",
    name: "vehicle.pickup",
    unlockStars: 35,
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
    maxSpeed: 13.5,
    driveForce: 22,
    brakeForce: 52,
    reverseSpeed: 5,
    reverseForce: 13,
    airTorque: 14,
    springHz: 4,
  },
  {
    // Race truck: very fast and strong, but low walls: careful with the cargo!
    id: "racer",
    name: "vehicle.racer",
    unlockStars: 50,
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
    maxSpeed: 15,
    driveForce: 26,
    brakeForce: 55,
    reverseSpeed: 5,
    reverseForce: 15,
    airTorque: 16,
    springHz: 4.5,
  },
];

export function getVehicleSpec(id: string): VehicleSpec {
  return VEHICLES.find((v) => v.id === id) ?? VEHICLES[0];
}

const ROLLING_FORCE = 0.8;
const MAX_AIR_SPIN = 4;

export interface DriveInput {
  gas: boolean;
  brake: boolean;
}

export class Vehicle {
  readonly chassis: Body;
  readonly rearWheel: Body;
  readonly frontWheel: Body;
  readonly rearJoint: WheelJoint;
  readonly frontJoint: WheelJoint;
  onGround = false;
  /** 0..1 while driving (for dust and engine sound). */
  throttle = 0;

  constructor(
    private gw: GameWorld,
    position: Vec2Value,
    readonly spec: VehicleSpec = VEHICLES[0],
  ) {
    const world = gw.world;
    const carTag: FixtureTag = { kind: "car" };
    const wheelTag: FixtureTag = { kind: "wheel" };

    this.chassis = world.createBody({ type: "dynamic", position });
    this.chassis.createFixture(new Polygon(spec.body), { density: spec.density, friction: 0.6, userData: carTag });
    this.chassis.createFixture(new Polygon(spec.rearWall), { density: 1, friction: 0.6, userData: carTag });
    this.chassis.createFixture(new Polygon(spec.cabin), { density: 0.8, friction: 0.6, userData: carTag });

    const mkWheel = (w: { x: number; y: number; r: number }): Body => {
      const b = world.createBody({ type: "dynamic", position: { x: position.x + w.x, y: position.y + w.y } });
      b.createFixture(new Circle(w.r), { density: 1, friction: 1.0, userData: wheelTag });
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
            dampingRatio: 0.7,
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

    if (input.gas && !input.brake) {
      speed = s.maxSpeed;
      force = s.driveForce;
      this.throttle = 1;
    } else if (input.brake && !input.gas) {
      const wheelSpin = -this.rearWheel.getAngularVelocity() * s.rear.r;
      if (wheelSpin > 0.4 || this.speed > 0.6) {
        speed = 0;
        force = s.brakeForce;
      } else {
        speed = -s.reverseSpeed;
        force = s.reverseForce;
        this.throttle = 0.6;
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
