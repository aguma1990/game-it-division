// Arcade kantor: tiga permainan singkat dengan karakter karyawan. Hadiahnya permata 💎.
import { drawChibi } from './chibi.js?v=4.3.5';
import { sfx } from './audio.js?v=4.3.5';

const W = 340, H = 440;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function frame(host, title, help) {
  host.innerHTML = `<div class="mg"><div class="mg-top"><b>${title}</b><span id="aScore">0</span></div><p class="mg-help">${help}</p>
    <canvas id="aCv" style="width:100%;max-width:340px;display:block;margin:0 auto;border-radius:18px;border:3px solid #b9e0c7;touch-action:none;background:#dff6ea"></canvas></div>`;
  const cv = host.querySelector('#aCv'), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  cv.width = W * dpr; cv.height = H * dpr; const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  return { cv, ctx, scoreEl: host.querySelector('#aScore') };
}
function loop(fn) {
  let last = performance.now(), raf = 0, stop = false;
  const f = now => { if (stop) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; fn(dt); raf = requestAnimationFrame(f); };
  raf = requestAnimationFrame(f);
  return () => { stop = true; cancelAnimationFrame(raf); };
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function banner(ctx, text, sub) {
  ctx.save(); ctx.fillStyle = 'rgba(14,50,38,0.78)'; rr(ctx, 40, 170, W - 80, 100, 18); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '900 24px ui-rounded, system-ui, sans-serif'; ctx.fillText(text, W / 2, 205);
  if (sub) { ctx.font = '700 13px ui-rounded, system-ui, sans-serif'; ctx.fillStyle = '#bff5d4'; ctx.fillText(sub, W / 2, 240); } ctx.restore();
}
function cloud(ctx, x, y, s) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(x, y, 14 * s, 0, 7); ctx.arc(x + 16 * s, y + 3, 11 * s, 0, 7); ctx.arc(x - 15 * s, y + 4, 10 * s, 0, 7); ctx.fill(); }

// ===== 1) Terbang Menembus Firewall (mini flappy) =====
export function playFlappy(host, { emp }) {
  return new Promise(resolve => {
    const { cv, ctx, scoreEl } = frame(host, '🐤 Terbang Menembus Firewall', 'Ketuk layar / tekan spasi untuk mengepak. Lewati celah firewall sejauh mungkin!');
    const X = 92, GAP = 138; let y = 210, vy = 0, t = 0, started = false, over = false, score = 0, spawn = 0, pipes = [], clouds = [[60, 70, 1], [220, 120, 0.8], [300, 50, 0.7]], shake = 0;
    const flap = () => { if (over) return; started = true; vy = -310; sfx('pop'); };
    const onKey = e => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); } };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); flap(); }); window.addEventListener('keydown', onKey);
    const finish = () => { if (over) return; over = true; sfx('lose'); shake = 0.3; setTimeout(() => { stop(); window.removeEventListener('keydown', onKey); resolve({ score, gems: clamp(Math.floor(score / 3), 0, 6), label: `${score} firewall terlewati` }); }, 1100); };
    const stop = loop(dt => {
      t += dt; shake = Math.max(0, shake - dt);
      if (started && !over) {
        vy += 900 * dt; y += vy * dt; spawn -= dt;
        if (spawn <= 0) { pipes.push({ x: W + 30, gy: 80 + Math.random() * (H - 200 - GAP), passed: false }); spawn = 1.5; }
        for (const p of pipes) {
          p.x -= 125 * dt;
          if (!p.passed && p.x + 54 < X - 12) { p.passed = true; score++; scoreEl.textContent = score; sfx('coin'); }
          if (X + 12 > p.x && X - 12 < p.x + 54 && (y - 26 < p.gy || y + 22 > p.gy + GAP)) finish();
        }
        pipes = pipes.filter(p => p.x > -70);
        if (y > H - 40 || y < 0) finish();
      } else if (!started) y = 210 + Math.sin(t * 3) * 8;
      for (const c of clouds) { c[0] -= 12 * dt; if (c[0] < -30) c[0] = W + 30; }
      // gambar
      ctx.save(); if (shake > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#e6f7ee'); ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, H + 20);
      for (const c of clouds) cloud(ctx, c[0], c[1], c[2]);
      for (const p of pipes) {
        for (const [yy, hh] of [[0, p.gy], [p.gy + GAP, H - p.gy - GAP]]) {
          const g = ctx.createLinearGradient(p.x, 0, p.x + 54, 0); g.addColorStop(0, '#2f8a5c'); g.addColorStop(0.5, '#6fd6a0'); g.addColorStop(1, '#2f8a5c'); ctx.fillStyle = g; ctx.fillRect(p.x, yy, 54, hh);
          ctx.strokeStyle = 'rgba(0,60,30,0.25)'; ctx.lineWidth = 1; for (let k = yy; k < yy + hh; k += 14) { ctx.beginPath(); ctx.moveTo(p.x, k); ctx.lineTo(p.x + 54, k); ctx.stroke(); }
        }
        ctx.fillStyle = '#1f6a45'; ctx.fillRect(p.x - 4, p.gy - 16, 62, 16); ctx.fillRect(p.x - 4, p.gy + GAP, 62, 16);
        ctx.font = '16px serif'; ctx.textAlign = 'center'; ctx.fillText('🔥', p.x + 27, p.gy - 2); ctx.fillText('🔥', p.x + 27, p.gy + GAP + 14);
      }
      ctx.fillStyle = '#7bbf6a'; ctx.fillRect(0, H - 22, W, 22); ctx.fillStyle = '#5ea34e'; ctx.fillRect(0, H - 22, W, 5);
      ctx.save(); ctx.translate(X, y + 24); ctx.rotate(clamp(vy / 700, -0.4, 0.5) * 0.6); ctx.translate(-X, -(y + 24));
      drawChibi(ctx, { x: X, y: y + 24, s: 0.72, look: emp.look, spec: emp.spec, pose: 'cheer', t, face: over ? 'stress' : 'excited', dir: 1 }); ctx.restore();
      ctx.restore();
      if (!started) banner(ctx, `Siap, ${emp.name.split(' ')[0]}?`, 'Ketuk untuk mulai terbang!');
      if (over) banner(ctx, score >= 3 ? '🎉 Mantap!' : '🥲 Nabrak!', `${score} firewall terlewati`);
    });
  });
}

// ===== 2) Lomba Lari Kantor =====
export function playRace(host, { emp, rivals }) {
  return new Promise(resolve => {
    const { cv, ctx, scoreEl } = frame(host, '🏃 Lomba Lari Kantor', 'Ketuk SECEPAT mungkin (atau tekan spasi) agar jagoanmu berlari paling depan!');
    const TOP = 70, LANE = 56, X0 = 34, X1 = 292, N = Math.min(5, rivals.length + 1);
    const boost = clamp(0.82 + 0.35 * (emp.energy / 100), 0.8, 1.2) * (emp.trait === 'rajin' ? 1.06 : emp.trait === 'begadang' ? 1.03 : 1) * (emp.quirk === 'lambat' ? 0.9 : 1);
    const runners = [{ emp, me: true, x: 0, v: 0, fin: 0 }, ...rivals.slice(0, N - 1).map(r => ({ emp: r, x: 0, v: 0, fin: 0, base: 5.2 + (r.skill / 100) * 3.4 + Math.random() * 0.6, ph: Math.random() * 6 }))];
    let t = 0, go = 0, started = false, over = false, place = 0, count = 3, cd = 0;
    const tap = () => { if (!started || over) return; const me = runners[0]; if (!me.fin) { me.v += 0.95 * boost; me.tapT = 0.12; } };
    const onKey = e => { if (e.code === 'Space') { e.preventDefault(); tap(); } };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); tap(); }); window.addEventListener('keydown', onKey);
    const finishAll = () => { if (over) return; over = true; const rank = runners[0].fin; sfx(rank <= 3 ? 'win' : 'lose'); setTimeout(() => { stop(); window.removeEventListener('keydown', onKey); resolve({ score: rank, gems: [0, 5, 3, 2, 1, 0][rank] || 0, label: `finis di posisi ${rank} dari ${N}` }); }, 1200); };
    const stop = loop(dt => {
      t += dt;
      if (!started) { cd += dt; const c = 3 - Math.floor(cd); if (c !== count && c > 0) { count = c; sfx('tap'); } if (cd >= 3) { started = true; go = 0.9; sfx('pop'); } }
      else if (!over) {
        go = Math.max(0, go - dt);
        for (const r of runners) {
          if (r.fin) continue;
          if (!r.me) { r.v += (r.base + Math.sin(t * 1.6 + r.ph) * 1.1 + (Math.sin(t * 0.7 + r.ph * 2) > 0.8 ? 1.6 : 0) - r.v) * Math.min(1, 2.2 * dt); }
          else { r.v -= r.v * 0.8 * dt; r.tapT = Math.max(0, (r.tapT || 0) - dt); }
          r.x += r.v * dt;
          if (r.x >= 100) { r.x = 100; r.fin = ++place; if (r.me) { sfx('coin'); scoreEl.textContent = '#' + r.fin; } }
        }
        if (runners[0].fin && (place >= 3 || runners.every(r => r.fin) || t > 40)) finishAll();
        if (t > 45) { for (const r of runners) if (!r.fin) r.fin = ++place; finishAll(); }
      }
      // gambar
      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#bfe8ff'); bg.addColorStop(0.3, '#e8f7ee'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#7bbf6a'; ctx.fillRect(0, TOP - 10, W, N * LANE + 24);
      for (let i = 0; i < N; i++) { ctx.fillStyle = i % 2 ? '#e9c98f' : '#f0d9a4'; ctx.fillRect(X0 - 14, TOP + i * LANE, X1 - X0 + 40, LANE - 3); }
      ctx.fillStyle = '#fff'; for (let k = 0; k < 8; k++) for (let j = 0; j < N * 4; j++) { ctx.fillStyle = (k + j) % 2 ? '#1f3a2e' : '#fff'; ctx.fillRect(X1 + 10 + k * 3.2, TOP + j * (LANE * N / (N * 4)), 3.2, LANE * N / (N * 4)); }
      ctx.fillStyle = '#17402f'; ctx.font = '900 12px ui-rounded, system-ui'; ctx.textAlign = 'center'; ctx.fillText('FINISH', X1 + 22, TOP - 16);
      const order = [...runners.keys()].sort((a, b) => runners[b].x - runners[a].x);
      for (const i of order) {
        const r = runners[i], x = X0 + (r.x / 100) * (X1 - X0), y = TOP + i * LANE + LANE - 12;
        if (r.me) { ctx.fillStyle = 'rgba(255,216,77,0.35)'; ctx.fillRect(X0 - 14, TOP + i * LANE, X1 - X0 + 40, LANE - 3); }
        drawChibi(ctx, { x, y, s: 0.62, look: r.emp.look, spec: r.emp.spec, pose: r.v > 0.6 && !r.fin ? 'walk' : r.fin ? 'cheer' : 'stand', t: r.x * 0.62 + (r.fin ? t : 0), face: r.fin ? 'happy' : 'excited', dir: 1 });
        ctx.font = '800 10px ui-rounded, system-ui'; ctx.textAlign = 'left'; ctx.fillStyle = r.me ? '#8a5a00' : '#1f3a2e'; ctx.fillText((r.me ? '⭐ ' : '') + r.emp.name.split(' ')[0], 6, TOP + i * LANE + 12);
        if (r.fin) { ctx.font = '900 16px ui-rounded, system-ui'; ctx.fillStyle = '#e0a100'; ctx.fillText('#' + r.fin, x + 14, y - 42); }
      }
      ctx.fillStyle = '#17402f'; rr(ctx, 20, 376, 300, 46, 14); ctx.fill();
      const me = runners[0]; ctx.fillStyle = '#7fffd4'; ctx.fillRect(30, 388, clamp(me.v / 11, 0, 1) * 280, 8); ctx.fillStyle = '#bff5d4'; ctx.font = '800 11px ui-rounded, system-ui'; ctx.textAlign = 'center'; ctx.fillText(started ? (go > 0 ? 'MULAI!' : 'KETUK TERUS! 👆') : 'Bersiap…', W / 2, 412);
      if (!started) banner(ctx, String(clamp(3 - Math.floor(cd), 1, 3)), 'Siap-siap berlari!');
      if (over) banner(ctx, me.fin <= 3 ? `🏅 Juara ${me.fin}!` : `Posisi ${me.fin}`, me.fin === 1 ? '+5 💎' : '');
    });
  });
}

// ===== 3) Balap Mobil (geser kiri-kanan, hindari lalu lintas) =====
export function playCar(host, { emp }) {
  return new Promise(resolve => {
    const { cv, ctx, scoreEl } = frame(host, '🏎️ Balap Mobil', 'Geser jari / mouse ke kiri-kanan (atau tombol ← →) untuk menghindari mobil & kerucut. Bertahan 45 detik! Punya 2 nyawa ❤️.');
    const ROAD_L = 50, ROAD_R = 290, LANES = 4, LW = (ROAD_R - ROAD_L) / LANES, CW = 30, CH = 52, CY = 360, DUR = 45;
    const laneX = i => ROAD_L + LW * (i + 0.5);
    let x = laneX(1.5), target = x, t = 0, started = false, over = false, hearts = 2, inv = 0, scroll = 0, spawn = 0.8, cars = [], trees = [], dist = 0, left = 0, right = 0, shake = 0, count = 0, finished = false;
    for (let i = 0; i < 6; i++) trees.push({ x: Math.random() < 0.5 ? 14 + Math.random() * 26 : 300 + Math.random() * 28, y: i * 80, s: 0.8 + Math.random() * 0.5 });
    // Satu ketukan = pindah SATU lajur (pelan); geser jari = bergeser relatif mengikuti jari
    const lo = ROAD_L + CW / 2 + 2, hi = ROAD_R - CW / 2 - 2; let lastX = null, moved = 0, downX = 0;
    const px = e => { const b = cv.getBoundingClientRect(); return (e.clientX - b.left) / b.width * W; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId); lastX = px(e); downX = lastX; moved = 0; });
    cv.addEventListener('pointermove', e => { if (lastX === null) return; const cx = px(e), d = cx - lastX; lastX = cx; moved += Math.abs(d); target = clamp(target + d * 0.8, lo, hi); });
    const up = () => { if (lastX === null) return; if (moved < 8) { target = clamp(target + (downX < x ? -LW : LW), lo, hi); } lastX = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { lastX = null; });
    const kd = e => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') { left = 1; e.preventDefault(); } if (e.code === 'ArrowRight' || e.code === 'KeyD') { right = 1; e.preventDefault(); } };
    const ku = e => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') left = 0; if (e.code === 'ArrowRight' || e.code === 'KeyD') right = 0; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const finish = () => { if (over) return; over = true; finished = t >= DUR; sfx(finished || t > 16 ? 'win' : 'lose'); const gems = clamp(Math.floor(t / 8), 0, 5) + (finished ? 1 : 0); const m = Math.round(dist / 10); setTimeout(() => { stop(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); resolve({ score: m, gems, label: finished ? `finis ${m} m tanpa kalah!` : `melaju ${m} m` }); }, 1200); };
    const carColors = ['#e5484d', '#5ab8f5', '#ffd84d', '#8f8cf2', '#ff9f43', '#3fbf7f'];
    const speedNow = () => 155 + Math.min(1, t / DUR) * 110;          // sedang: 155 → 265 px/dtk
    const spawnRow = () => {
      const cnt = t < 14 ? 1 : t < 28 ? (Math.random() < 0.45 ? 2 : 1) : (Math.random() < 0.5 ? 2 : Math.random() < 0.25 ? 3 : 1);
      const lanes = [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, Math.min(cnt, 3));
      for (const l of lanes) cars.push({ x: laneX(l) + (Math.random() - 0.5) * 8, y: -70, kind: Math.random() < 0.28 ? 'cone' : 'car', c: carColors[Math.floor(Math.random() * carColors.length)], sp: Math.random() * 40 - 10 });
    };
    const drawCar = (x, y, color, me) => {
      ctx.save(); ctx.translate(x, y); ctx.fillStyle = 'rgba(0,0,0,0.22)'; rr(ctx, -CW / 2 + 3, -CH / 2 + 5, CW, CH, 8); ctx.fill();
      ctx.fillStyle = color; rr(ctx, -CW / 2, -CH / 2, CW, CH, 8); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(190,235,255,0.9)'; rr(ctx, -CW / 2 + 4, -CH / 2 + 11, CW - 8, 12, 4); ctx.fill(); rr(ctx, -CW / 2 + 5, CH / 2 - 17, CW - 10, 8, 3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(-CW / 2 + 3, -CH / 2 + 2, 6, 4); ctx.fillRect(CW / 2 - 9, -CH / 2 + 2, 6, 4);
      ctx.fillStyle = '#ff5a5a'; ctx.fillRect(-CW / 2 + 3, CH / 2 - 5, 6, 3); ctx.fillRect(CW / 2 - 9, CH / 2 - 5, 6, 3); ctx.restore();
    };
    const stop = loop(dt => {
      t += dt; shake = Math.max(0, shake - dt); inv = Math.max(0, inv - dt);
      if (!started) { count += dt; if (count >= 2) { started = true; sfx('pop'); } t = 0; }
      else if (!over) {
        const sp = speedNow(); scroll = (scroll + sp * dt) % 60; dist += sp * dt; scoreEl.textContent = Math.round(dist / 10) + ' m';
        if (left || right) target = clamp(target + (right - left) * 85 * dt, ROAD_L + CW / 2 + 2, ROAD_R - CW / 2 - 2);
        const dx = target - x, mv = 85 * dt; x += Math.abs(dx) <= mv ? dx : Math.sign(dx) * mv;
        spawn -= dt; if (spawn <= 0) { spawnRow(); spawn = Math.max(0.5, 0.95 - t / DUR * 0.4) * (190 / sp) * 1.15; }
        for (const c of cars) c.y += sp * (c.kind === 'cone' ? 1 : 0.62) * dt;   // mobil lain melaju lebih lambat dari kita, kerucut diam
        for (const c of cars) {
          if (inv > 0 || c.hit) continue; const hw = c.kind === 'cone' ? 8 : CW / 2 - 3, hh = c.kind === 'cone' ? 8 : CH / 2 - 4;
          if (Math.abs(c.x - x) < hw + CW / 2 - 5 && Math.abs(c.y - CY) < hh + CH / 2 - 6) { c.hit = true; hearts--; inv = 1.6; shake = 0.3; sfx('bad'); if (hearts <= 0) { finish(); break; } }
        }
        cars = cars.filter(c => c.y < H + 80);
        if (t >= DUR) finish();
      }
      trees.forEach(tr => { tr.y += (started ? speedNow() : 120) * dt; if (tr.y > H + 40) { tr.y = -40; tr.x = Math.random() < 0.5 ? 14 + Math.random() * 26 : 300 + Math.random() * 28; } });
      // gambar
      ctx.save(); if (shake > 0) ctx.translate((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7);
      ctx.fillStyle = '#7bbf6a'; ctx.fillRect(-10, -10, W + 20, H + 20); ctx.fillStyle = '#6fb25f'; for (let k = -1; k < 9; k++) ctx.fillRect(-10, k * 60 + scroll - 30, W + 20, 30);
      ctx.fillStyle = '#4a4f5a'; ctx.fillRect(ROAD_L, -10, ROAD_R - ROAD_L, H + 20); ctx.fillStyle = '#e9e9ee'; ctx.fillRect(ROAD_L - 4, -10, 4, H + 20); ctx.fillRect(ROAD_R, -10, 4, H + 20);
      ctx.fillStyle = '#d9d9e2'; for (let l = 1; l < LANES; l++) for (let k = -1; k < 9; k++) ctx.fillRect(ROAD_L + l * LW - 2, k * 60 + scroll - 20, 4, 28);
      trees.forEach(tr => { ctx.font = `${26 * tr.s}px serif`; ctx.textAlign = 'center'; ctx.fillText('🌲', tr.x, tr.y); });
      if (started && t > DUR - 6) { const fy = 30 + (t - (DUR - 6)) / 6 * 300; for (let k = 0; k < 12; k++) { ctx.fillStyle = k % 2 ? '#1f3a2e' : '#fff'; ctx.fillRect(ROAD_L + k * 20, fy, 20, 10); ctx.fillStyle = k % 2 ? '#fff' : '#1f3a2e'; ctx.fillRect(ROAD_L + k * 20, fy + 10, 20, 10); } }
      for (const c of cars) { if (c.kind === 'cone') { ctx.fillStyle = '#ff7a29'; ctx.beginPath(); ctx.moveTo(c.x, c.y - 12); ctx.lineTo(c.x + 10, c.y + 10); ctx.lineTo(c.x - 10, c.y + 10); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(c.x - 6, c.y, 12, 4); } else drawCar(c.x, c.y, c.c, false); }
      if (inv <= 0 || Math.floor(t * 14) % 2) { drawCar(x, CY, '#2fae6a', true); drawChibi(ctx, { x, y: CY + 12, s: 0.34, look: emp.look, spec: emp.spec, pose: 'stand', t, face: hearts < 2 ? 'stress' : 'excited', dir: 1, shadow: false }); }
      ctx.restore();
      ctx.font = '16px serif'; ctx.textAlign = 'left'; ctx.fillText('❤️'.repeat(Math.max(0, hearts)) + '🖤'.repeat(2 - Math.max(0, hearts)), 8, 22);
      ctx.fillStyle = 'rgba(14,50,38,0.85)'; rr(ctx, W - 92, 8, 84, 22, 11); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '800 12px ui-rounded, system-ui'; ctx.textAlign = 'center'; ctx.fillText(`⏱ ${Math.max(0, DUR - t).toFixed(0)}s`, W - 50, 23);
      if (!started) banner(ctx, `Siap, ${emp.name.split(' ')[0]}?`, 'Geser kiri-kanan untuk menyetir!');
      if (over) banner(ctx, finished ? '🏁 FINIS!' : '💥 Tabrakan!', `${Math.round(dist / 10)} m`);
    });
  });
}
