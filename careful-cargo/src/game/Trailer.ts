import { Body, Box, Circle, RevoluteJoint, WheelJoint } from "planck";
import type { Vehicle } from "./Vehicle";
import type { FixtureTag, GameWorld } from "./World";

/** Cargo bed of the trailer in trailer-local coordinates. */
export const TRAILER_BED = { left: -0.84, right: 0.84, floor: 0.12, wallTop: 0.42 };
export const TRAILER_WHEEL = { x: -0.15, y: -0.42, r: 0.36 };
/** Where the tongue meets the vehicle (trailer-local and chassis-local). */
const HITCH_TRAILER = { x: 1.42, y: -0.05 };
const HITCH_CAR = { x: -1.62, y: -0.12 };

/** Group shared by the vehicle and its trailer: they never collide with each other. */
export const VEHICLE_GROUP = -2;

/** A one-axle trailer hooked behind the vehicle. */
export class Trailer {
  readonly body: Body;
  readonly wheel: Body;
  readonly bed = TRAILER_BED;

  constructor(gw: GameWorld, vehicle: Vehicle) {
    const world = gw.world;
    const car: FixtureTag = { kind: "car" };
    const hitch = vehicle.chassis.getWorldPoint(HITCH_CAR);
    const pos = { x: hitch.x - HITCH_TRAILER.x, y: hitch.y - HITCH_TRAILER.y };
    this.body = world.createBody({ type: "dynamic", position: pos });
    const opt = { density: 1.0, friction: 0.6, userData: car, filterGroupIndex: VEHICLE_GROUP };
    this.body.createFixture(new Box(0.9, 0.12), opt);
    this.body.createFixture(new Box(0.05, 0.16, { x: -0.87, y: 0.26 }), opt);
    this.body.createFixture(new Box(0.05, 0.16, { x: 0.87, y: 0.26 }), opt);
    this.body.createFixture(new Box(0.26, 0.04, { x: 1.16, y: -0.05 }), opt);

    this.wheel = world.createBody({ type: "dynamic", position: { x: pos.x + TRAILER_WHEEL.x, y: pos.y + TRAILER_WHEEL.y } });
    this.wheel.createFixture(new Circle(TRAILER_WHEEL.r), {
      density: 0.8,
      friction: 0.9,
      userData: { kind: "wheel" } satisfies FixtureTag,
      filterGroupIndex: VEHICLE_GROUP,
    });
    world.createJoint(
      new WheelJoint(
        { enableMotor: true, motorSpeed: 0, maxMotorTorque: 0.2, frequencyHz: 4, dampingRatio: 0.7 },
        this.body,
        this.wheel,
        this.wheel.getPosition(),
        { x: 0, y: 1 },
      ),
    );
    world.createJoint(new RevoluteJoint({}, vehicle.chassis, this.body, hitch));
  }

  bedCenter(): { x: number; y: number } {
    return this.body.getWorldPoint({ x: 0, y: TRAILER_BED.floor + 0.3 });
  }
}
