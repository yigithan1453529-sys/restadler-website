export const VIEW_W = 1280;
export const VIEW_H = 720;
export const BASE_ZOOM = 40; // pixels per meter at 1280 × 720

/** Follows the vehicle with a look-ahead in driving direction. */
export class Camera {
  x = 0;
  y = 0;
  zoom = BASE_ZOOM;
  shakeX = 0;
  shakeY = 0;
  private lookAhead = 0;
  private shakeTime = 0;
  private shakeStrength = 0;

  snap(x: number, y: number): void {
    this.lookAhead = 4;
    this.x = x + this.lookAhead;
    this.y = y + 2.2;
    this.zoom = BASE_ZOOM;
    this.shakeTime = 0;
    this.shakeX = this.shakeY = 0;
  }

  follow(tx: number, ty: number, vx: number, dt: number): void {
    const targetAhead = Math.max(-3, Math.min(10, 4 + vx * 0.35));
    this.lookAhead += (targetAhead - this.lookAhead) * Math.min(1, dt * 1.5);
    const k = Math.min(1, dt * 5);
    this.x += (tx + this.lookAhead - this.x) * k;
    this.y += (ty + 2.2 - this.y) * Math.min(1, dt * 3.5);

    // Zoom out with speed so fast cars still see what is coming.
    const speedFactor = Math.min(1, Math.abs(vx) / 20);
    const targetZoom = BASE_ZOOM * (1 - 0.3 * speedFactor);
    this.zoom += (targetZoom - this.zoom) * Math.min(1, dt * 1.2);

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const s = this.shakeStrength * Math.max(0, this.shakeTime / 0.35);
      this.shakeX = (Math.random() * 2 - 1) * s;
      this.shakeY = (Math.random() * 2 - 1) * s;
    } else {
      this.shakeX = this.shakeY = 0;
    }
  }

  /** strength 0..1 */
  shake(strength: number): void {
    this.shakeStrength = Math.max(this.shakeStrength * (this.shakeTime > 0 ? 1 : 0), 4 + 10 * strength);
    this.shakeTime = 0.35;
  }

  toScreenX(x: number): number {
    return (x - this.x) * this.zoom + VIEW_W / 2 + this.shakeX;
  }

  toScreenY(y: number): number {
    return VIEW_H / 2 - (y - this.y) * this.zoom + this.shakeY;
  }

  /** Visible world range in x (with margin). */
  visibleX(margin = 2): [number, number] {
    const half = VIEW_W / 2 / this.zoom;
    return [this.x - half - margin, this.x + half + margin];
  }

  /** Puts world coordinates (meters, y up) onto the context. */
  applyWorld(ctx: CanvasRenderingContext2D): void {
    ctx.translate(VIEW_W / 2 + this.shakeX, VIEW_H / 2 + this.shakeY);
    ctx.scale(this.zoom, -this.zoom);
    ctx.translate(-this.x, -this.y);
  }
}
