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

/** Simple loading screen while the Poki SDK starts. */
function drawLoading(progress: number): void {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, "#8FD3FF");
  g.addColorStop(1, "#E6F7FF");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.font = '900 84px "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = 16;
  ctx.strokeStyle = "#2D2D2D";
  ctx.strokeText("Careful Cargo", VIEW_W / 2, VIEW_H / 2 - 50);
  ctx.fillStyle = "#FFB627";
  ctx.fillText("Careful Cargo", VIEW_W / 2, VIEW_H / 2 - 50);
  const w = 420;
  const x = VIEW_W / 2 - w / 2;
  const y = VIEW_H / 2 + 50;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.strokeStyle = "#2D2D2D";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect?.(x, y, w, 28, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3BCEAC";
  ctx.beginPath();
  ctx.roundRect?.(x + 4, y + 4, Math.max(20, (w - 8) * progress), 20, 10);
  ctx.fill();
}

async function boot(): Promise<void> {
  let progress = 0.15;
  drawLoading(progress);
  const timer = window.setInterval(() => {
    progress = Math.min(0.9, progress + 0.08);
    drawLoading(progress);
  }, 100);
  await poki.init();
  window.clearInterval(timer);
  drawLoading(1);

  const game = new Game(ctx, input);
  poki.loadingFinished();

  let last = performance.now();
  const frame = (now: number): void => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    game.update(dt);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    game.draw();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
void boot();
