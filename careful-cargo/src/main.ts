import { VIEW_H, VIEW_W } from "./game/Camera";
import { Game } from "./game/Game";
import { Input } from "./game/Input";
import { t } from "./i18n";
import { poki } from "./platform/poki";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d", { alpha: false })!;
const rotateHint = document.getElementById("rotate");
if (rotateHint) rotateHint.textContent = t("rotate");

// Layout: biggest 16:9 area that fits the window, centered.
let cssW = VIEW_W;
let cssH = VIEW_H;
let offsetX = 0;
let offsetY = 0;
let scale = 1;

function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  cssW = Math.min(w, (h * 16) / 9);
  cssH = (cssW * 9) / 16;
  offsetX = (w - cssW) / 2;
  offsetY = (h - cssH) / 2;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.style.left = `${offsetX}px`;
  canvas.style.top = `${offsetY}px`;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  scale = canvas.width / VIEW_W;
}
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", resize);
resize();

const input = new Input(canvas, (clientX, clientY) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * VIEW_W,
    y: ((clientY - rect.top) / rect.height) * VIEW_H,
  };
});

void poki.init().then(() => poki.loadingFinished());
const game = new Game(ctx, input);

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  game.update(dt);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  game.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
