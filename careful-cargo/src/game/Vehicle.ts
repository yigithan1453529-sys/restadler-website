import { Body, Box, Circle, Polygon, Vec2Value, WheelJoint } from "planck";
import type { FixtureTag, GameWorld } from "./World";

// Start values from the GDD; tune while testing.
export const VEHICLE = {
  wheelRadius: 0.45,
  wheelOffsetX: 1.0,
  wheelOffsetY: -0.5,
  springHz: 4,
  springDamping: 0.7,
  maxSpeed: 28, // wheel rad/s (≈ 12.6 m/s)
  driveTorque: 9,
  brakeTorque: 22,
  reverseSpeed: 11,
  reverseTorque: 6,
  rollingTorque: 0.35,
  airTorque: 14,
  maxAirSpin: 4,
  allWheelDrive: true,
};

/** Cargo bed in chassis-local coordinates (meters). */
export const BED = {
  left: -1.37, // inner face of the rear wall
  right: 0.2, // back of the cabin
  floor: 0.2,
  wallTop: 0.45, // low walls: 0.25 m
};

export interface DriveInput {
  gas: boolean;
  brake: boolean;
}

/** Shapes used for drawing (chassis-local). */
export const CHASSIS_SHAPES = {
  body: [
    { x: -1.5, y: -0.2 },
    { x: 1.5, y: -0.2 },
    { x: 1.5, y: 0.2 },
    { x: -1.5, y: 0.2 },
  ],
  rearWall: [
    { x: -1.5, y: 0.2 },
    { x: BED.left, y: 0.2 },
    { x: BED.left, y: BED.wallTop },
    { x: -1.5, y: BED.wallTop },
  ],
  cabin: [
    { x: BED.right, y: 0.2 },
    { x: 1.5, y: 0.2 },
    { x: 1.5, y: 0.55 },
    { x: 1.15, y: 0.62 },
    { x: 0.9, y: 1.05 },
    { x: BED.right, y: 1.05 },
  ],
};

export class Vehicle {
  readonly chassis: Body;
  readonly rearWheel: Body;
  readonly frontWheel: Body;
  readonly rearJoint: WheelJoint;
  readonly frontJoint: WheelJoint;
  onGround = false;
  /** True while the throttle is pressed (for dust and engine sound). */
  throttle = 0;

  constructor(private gw: GameWorld, position: Vec2Value) {
    const world = gw.world;
    const carTag: FixtureTag = { kind: "car" };
    const wheelTag: FixtureTag = { kind: "wheel" };

    this.chassis = world.createBody({ type: "dynamic", position });
    this.chassis.createFixture(new Box(1.5, 0.2), { density: 1.5, friction: 0.6, userData: carTag });
    this.chassis.createFixture(new Polygon(CHASSIS_SHAPES.rearWall), { density: 1, friction: 0.6, userData: carTag });
    this.chassis.createFixture(new Polygon(CHASSIS_SHAPES.cabin), { density: 0.8, friction: 0.6, userData: carTag });

    const mkWheel = (dx: number): Body => {
      const w = world.createBody({
        type: "dynamic",
        position: { x: position.x + dx, y: position.y + VEHICLE.wheelOffsetY },
      });
      w.createFixture(new Circle(VEHICLE.wheelRadius), { density: 1, friction: 1.0, userData: wheelTag });
      return w;
    };
    this.rearWheel = mkWheel(-VEHICLE.wheelOffsetX);
    this.frontWheel = mkWheel(VEHICLE.wheelOffsetX);

    const jointOpt = {
      enableMotor: true,
      motorSpeed: 0,
      maxMotorTorque: VEHICLE.rollingTorque,
      frequencyHz: VEHICLE.springHz,
      dampingRatio: VEHICLE.springDamping,
    };
    const axis = { x: 0, y: 1 };
    this.rearJoint = world.createJoint(
      new WheelJoint(jointOpt, this.chassis, this.rearWheel, this.rearWheel.getPosition(), axis),
    )!;
    this.frontJoint = world.createJoint(
      new WheelJoint(jointOpt, this.chassis, this.frontWheel, this.frontWheel.getPosition(), axis),
    )!;
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
    const rearGround = this.gw.touchesGround(this.rearWheel);
    const frontGround = this.gw.touchesGround(this.frontWheel);
    this.onGround = rearGround || frontGround;

    let speed = 0;
    let torque = VEHICLE.rollingTorque;
    this.throttle = 0;

    if (input.gas && !input.brake) {
      speed = -VEHICLE.maxSpeed; // negative angular velocity = clockwise = drive right
      torque = VEHICLE.driveTorque;
      this.throttle = 1;
    } else if (input.brake && !input.gas) {
      const wheelSpin = -this.rearWheel.getAngularVelocity() * VEHICLE.wheelRadius;
      if (wheelSpin > 0.4 || this.speed > 0.6) {
        speed = 0;
        torque = VEHICLE.brakeTorque;
      } else {
        speed = VEHICLE.reverseSpeed;
        torque = VEHICLE.reverseTorque;
        this.throttle = 0.6;
      }
    }

    this.rearJoint.setMotorSpeed(speed);
    this.rearJoint.setMaxMotorTorque(torque);
    const frontDriven = VEHICLE.allWheelDrive || (speed === 0 && torque === VEHICLE.brakeTorque);
    this.frontJoint.setMotorSpeed(speed);
    this.frontJoint.setMaxMotorTorque(frontDriven ? torque : VEHICLE.rollingTorque);

    // Mud slows the van down.
    if (this.onGround && this.gw.obstacles.surfaceAt(this.chassis.getPosition().x) === "mud") {
      const v = this.chassis.getLinearVelocity();
      const m = this.chassis.getMass() + this.rearWheel.getMass() + this.frontWheel.getMass();
      this.chassis.applyForceToCenter({ x: -v.x * m * 1.6, y: 0 }, true);
    }

    // Tilt in the air: right = nose down (clockwise), left = nose up.
    if (!this.onGround && input.gas !== input.brake) {
      const dir = input.gas ? -1 : 1;
      const spin = this.chassis.getAngularVelocity();
      if (spin * dir < VEHICLE.maxAirSpin) this.chassis.applyTorque(dir * VEHICLE.airTorque, true);
    }
  }

  /** "Up" component of the chassis: 1 = upright, -1 = upside down. */
  get uprightness(): number {
    return Math.cos(this.chassis.getAngle());
  }

  /** World position of the center of the cargo bed. */
  bedCenter(): Vec2Value {
    return this.chassis.getWorldPoint({ x: (BED.left + BED.right) / 2, y: BED.floor + 0.3 });
  }
}
