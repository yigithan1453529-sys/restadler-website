// Renders promo/thumbnail-animated-1080.mp4 frames. Usage: start "npx vite --port 5199", then
// "node promo/make-animated-thumbnail.cjs <frames-dir>" and encode with
// ffmpeg -framerate 50 -i <frames-dir>/f%04d.png -c:v libx264 -pix_fmt yuv420p -an promo/thumbnail-animated-1080.mp4
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1080 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5199/');
  await p.waitForTimeout(900);
  await p.evaluate(async () => {
    const R = await import('/src/game/Renderer.ts');
    const V = await import('/src/game/Vehicle.ts');
    const C = await import('/src/game/Characters.ts');
    const S = await import('/src/game/SkyTraffic.ts');
    document.body.style.margin = '0';
    document.body.innerHTML = '<canvas id=c width=1080 height=1080></canvas>';
    const ctx = document.getElementById('c').getContext('2d');
    const spec = V.getVehicleSpec('van');
    const SC = 115;
    const g = (x) => 870 - Math.exp(-((x - 430) ** 2) / 22000) * 140;
    // van path: drive up the hill, fly, land on the right
    const path = (t) => {
      // drive in, jump, then brake and stop in front of the customer
      const x = t < 3.2 ? -260 + t * 300 : 700 + (1 - Math.exp(-(t - 3.2) * 3)) * 26;
      let y = g(x) - 1.0 * SC, a = 0;
      if (x > 420 && x < 700) {
        const k = (x - 420) / 280;
        const y0 = g(420) - SC, y1 = g(700) - SC;
        y = y0 + (y1 - y0) * k - Math.sin(Math.PI * k) * 150;
        a = 0.25 * Math.cos(Math.PI * k) * -1 + 0.05; // nose up, then down
      } else {
        const dx = 4;
        a = -Math.atan2(g(x + dx) - g(x - dx), 2 * dx) * 0.9;
      }
      return { x, y, a, air: x > 420 && x < 700 };
    };
    const coins = [[480, 560], [540, 515], [600, 505], [660, 525]];
    window.renderFrame = (t) => {
      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, 1080);
      sky.addColorStop(0, '#5EC2FF'); sky.addColorStop(1, '#D8F2FF');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, 1080, 1080);
      const sg = ctx.createRadialGradient(860, 170, 10, 860, 170, 260);
      sg.addColorStop(0, 'rgba(255,245,200,0.95)'); sg.addColorStop(1, 'rgba(255,245,200,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, 1080, 1080);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      for (const [x0, y, s] of [[120, 150, 1.3], [600, 110, 1], [330, 300, 0.8]]) {
        const x = ((x0 - t * 25 * s) % 1300 + 1300) % 1300 - 150;
        ctx.beginPath(); ctx.arc(x, y, 40 * s, 0, 7); ctx.arc(x + 45 * s, y - 18 * s, 50 * s, 0, 7); ctx.arc(x + 95 * s, y, 38 * s, 0, 7); ctx.rect(x, y, 95 * s, 36 * s); ctx.fill();
      }
      // a balloon drifting
      ctx.save(); ctx.translate(180 + t * 18, 330 + Math.sin(t * 1.5) * 10);
      ctx.scale(1.2, 1.2);
      // reuse sky traffic balloon by drawing one lane only at a fixed time is awkward; simple balloon:
      ctx.beginPath(); ctx.moveTo(0, 38); ctx.bezierCurveTo(-46, 10, -50, -46, 0, -50); ctx.bezierCurveTo(50, -46, 46, 10, 0, 38); ctx.closePath();
      ctx.fillStyle = '#FF6B35'; ctx.fill(); ctx.save(); ctx.clip();
      ['#FFD23F', '#3BCEAC', '#FFD23F'].forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse((k - 1) * 22, -6, 8, 50, 0, 0, 7); ctx.fill(); });
      ctx.restore(); ctx.lineWidth = 3; ctx.strokeStyle = '#2D2D2D'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-24, 30); ctx.lineTo(-11, 62); ctx.moveTo(24, 30); ctx.lineTo(11, 62); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#B07A45'; ctx.fillRect(-13, 60, 26, 20); ctx.lineWidth = 3; ctx.strokeRect(-13, 60, 26, 20);
      ctx.restore();
      // hills
      ctx.fillStyle = '#B9EB93';
      ctx.beginPath(); ctx.moveTo(0, 1080);
      for (let x = 0; x <= 1080; x += 16) ctx.lineTo(x, 650 - Math.sin(x * 0.006 + t * 0.15) * 80 - Math.sin(x * 0.017 + 1) * 30);
      ctx.lineTo(1080, 1080); ctx.fill();
      // ground
      ctx.beginPath(); ctx.moveTo(0, 1080);
      for (let x = 0; x <= 1080; x += 8) ctx.lineTo(x, g(x));
      ctx.lineTo(1080, 1080); ctx.closePath(); ctx.fillStyle = '#8B5A2B'; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.beginPath(); for (let x = 0; x <= 1080; x += 8) ctx.lineTo(x, g(x));
      ctx.strokeStyle = '#5BC236'; ctx.lineWidth = 50; ctx.stroke(); ctx.restore();
      ctx.beginPath(); for (let x = 0; x <= 1080; x += 8) ctx.lineTo(x, g(x));
      ctx.strokeStyle = '#2D2D2D'; ctx.lineWidth = 6; ctx.stroke();
      // customer: waves, then cheers when the van has landed
      const v = path(t);
      ctx.save(); ctx.translate(968, g(968)); ctx.scale(95, -95);
      C.drawCustomer(ctx, 'kid', 0, 0, v.x > 690 ? 'cheer' : 'wave', t, 5 / 95); ctx.restore();
      // coins over the hill, picked up by the van
      for (const [cx, cy] of coins) {
        if (v.x > cx - 40) continue;
        const sx = Math.max(0.15, Math.abs(Math.cos(t * 4 + cx)));
        ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, 1);
        ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fillStyle = '#FFC93C'; ctx.fill();
        ctx.lineWidth = 5 / sx; ctx.strokeStyle = '#2D2D2D'; ctx.stroke(); ctx.restore();
      }
      // the van
      ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(-v.a); ctx.scale(SC, -SC);
      const lw = 5 / SC;
      const spin = -(v.x / SC) / 0.45;
      R.drawWheel(ctx, spec.rear.x, spec.rear.y + (v.air ? -0.08 : 0), spec.rear.r, spin, lw);
      R.drawWheel(ctx, spec.front.x, spec.front.y + (v.air ? -0.08 : 0), spec.front.r, spin, lw);
      // crates hop a little in the air
      const hop = v.air ? Math.sin(Math.PI * (v.x - 420) / 280) * 0.35 : 0;
      [-1.1, -0.62, -0.14].forEach((cx, k) => {
        ctx.save(); ctx.translate(cx, 0.42 + hop * (0.6 + k * 0.25)); ctx.rotate(hop * (k - 1) * 0.6);
        R.drawCargoShape(ctx, 'crate', 0.21, 0.21, 0, lw, true, false); ctx.restore();
      });
      R.drawChassis(ctx, spec, lw, spec.color, t);
      ctx.restore();
      // dust when it lands
      if (t > 3.15 && t < 3.9) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        const k = (t - 3.15) / 0.75;
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(v.x - 130 - i * 22 * k, g(v.x - 100) - 10 - i * 6 * k, 18 * (1 - k * 0.6), 0, 7); ctx.fill(); }
      }
    };
  });
  const N = 250; // 5 s at 50 fps
  for (let i = 0; i < N; i++) {
    const data = await p.evaluate((t) => { window.renderFrame(t); return document.getElementById('c').toDataURL('image/png'); }, i / 50);
    fs.writeFileSync(`${process.argv[2]}/f${String(i).padStart(4, '0')}.png`, Buffer.from(data.split(',')[1], 'base64'));
  }
  console.log(errs);
  await b.close();
})();
