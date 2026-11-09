import { VIEW_H, VIEW_W } from "./Camera";

export interface Circle {
  x: number;
  y: number;
  r: number;
}

/** Big on-screen drive buttons (virtual 1280 × 720 coordinates). */
export const TOUCH_BRAKE: Circle = { x: 150, y: VIEW_H - 150, r: 88 };
export const TOUCH_GAS: Circle = { x: VIEW_W - 150, y: VIEW_H - 150, r: 88 };
/** Nitro button above the gas button. */
export const TOUCH_NITRO: Circle = { x: VIEW_W - 150, y: VIEW_H - 345, r: 56 };

interface PointerState {
  x: number;
  y: number;
  /** Pointer started on a UI button: does not count as driving. */
  ui: boolean;
}

const BLOCKED_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "PageUp", "PageDown", "Home", "End"]);

function inside(c: Circle, x: number, y: number, extra = 1.25): boolean {
  if (c === TOUCH_NITRO) extra = 1.1;
  return Math.hypot(x - c.x, y - c.y) <= c.r * extra;
}

/** Keyboard, touch and mouse. */
export class Input {
  private keys = new Set<string>();
  private pointers = new Map<number, PointerState>();
  /** Show the drive buttons (touch devices). */
  showTouch: boolean;
  /** Pointer pressed: return true if a UI button took it. */
  onPointerDown: (x: number, y: number) => boolean = () => false;
  onPointerUp: (x: number, y: number) => void = () => {};
  onPointerMove: (x: number, y: number) => void = () => {};
  /** Key pressed (not repeated). */
  onKey: (code: string) => void = () => {};
  /** Any user gesture (to unlock audio). */
  onGesture: () => void = () => {};

  constructor(
    private canvas: HTMLCanvasElement,
    private toVirtual: (clientX: number, clientY: number) => { x: number; y: number },
  ) {
    let coarse = false;
    try {
      coarse = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    } catch {
      coarse = false;
    }
    this.showTouch = coarse;

    window.addEventListener("keydown", (e) => {
      if (BLOCKED_KEYS.has(e.code)) e.preventDefault();
      this.onGesture();
      if (!e.repeat) this.onKey(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener("keyup", (e) => {
      if (BLOCKED_KEYS.has(e.code)) e.preventDefault();
      this.keys.delete(e.code);
    });
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.pointers.clear();
    });

    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.onGesture();
      // Any click or tap shows the on-screen drive buttons (mouse players need them too).
      this.showTouch = true;
      try {
        window.focus();
        canvas.focus({ preventScroll: true });
      } catch {
        /* ignore */
      }
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const p = this.toVirtual(e.clientX, e.clientY);
      const ui = this.onPointerDown(p.x, p.y);
      this.pointers.set(e.pointerId, { x: p.x, y: p.y, ui });
    });
    canvas.addEventListener("pointermove", (e) => {
      const p = this.toVirtual(e.clientX, e.clientY);
      const s = this.pointers.get(e.pointerId);
      if (s) {
        s.x = p.x;
        s.y = p.y;
      }
      this.onPointerMove(p.x, p.y);
    });
    const end = (e: PointerEvent): void => {
      const s = this.pointers.get(e.pointerId);
      if (!s) return;
      this.pointers.delete(e.pointerId);
      if (e.type === "pointerup") {
        const p = this.toVirtual(e.clientX, e.clientY);
        this.onPointerUp(p.x, p.y);
      }
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private pointerIn(c: Circle): boolean {
    for (const p of this.pointers.values()) if (!p.ui && inside(c, p.x, p.y)) return true;
    return false;
  }

  get gas(): boolean {
    // The nitro button also gives gas (one thumb can only press one button).
    return this.keys.has("ArrowRight") || this.keys.has("KeyD") || this.pointerIn(TOUCH_GAS) || this.pointerIn(TOUCH_NITRO);
  }

  get nitro(): boolean {
    return (
      this.keys.has("ArrowUp") ||
      this.keys.has("KeyW") ||
      this.keys.has("ShiftLeft") ||
      this.keys.has("ShiftRight") ||
      this.keys.has("Space") ||
      this.pointerIn(TOUCH_NITRO)
    );
  }

  get brake(): boolean {
    return this.keys.has("ArrowLeft") || this.keys.has("KeyA") || this.pointerIn(TOUCH_BRAKE);
  }

  /** Forget held pointers (e.g. after a menu opened). */
  releaseAll(): void {
    for (const p of this.pointers.values()) p.ui = true;
  }

  get element(): HTMLCanvasElement {
    return this.canvas;
  }
}
