// Arcade kantor: tiga permainan singkat dengan karakter karyawan. Hadiahnya permata 💎.
import { drawChibi } from './chibi.js';
import { sfx } from './audio.js';

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

// ===== 3) Panjat Pinang =====
export function playPole(host, { emp, cheerers }) {
  return new Promise(resolve => {
    const { cv, ctx, scoreEl } = frame(host, '🎋 Panjat Pinang', 'Ketuk cepat agar jagoanmu memanjat! Batang licin bikin merosot — apalagi di bagian berminyak. Raih hadiah di puncak!');
    const BASE = 372, TOPY = 78, SPAN = BASE - TOPY, POLE = 170, LIMIT = 22;
    const greasy = [[26, 38], [58, 70], [84, 94]];
    const power = clamp(0.88 + 0.28 * (emp.energy / 100), 0.85, 1.15) * (emp.trait === 'rajin' ? 1.06 : 1);
    let h = 0, t = 0, left = LIMIT, started = false, over = false, tapT = 0, sweat = [], won = false, count = 0;
    const tap = () => { if (over) return; if (!started) return; h = clamp(h + 1.75 * power, 0, 100); tapT = 0.18; };
    const onKey = e => { if (e.code === 'Space') { e.preventDefault(); tap(); } };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); tap(); }); window.addEventListener('keydown', onKey);
    const end = () => { if (over) return; over = true; won = h >= 99.9; sfx(h >= 50 ? 'win' : 'lose'); const gems = won ? (left > 6 ? 6 : 5) : h >= 75 ? 3 : h >= 50 ? 2 : h >= 25 ? 1 : 0; setTimeout(() => { stop(); window.removeEventListener('keydown', onKey); resolve({ score: Math.round(h), gems, label: won ? 'sampai puncak!' : `memanjat ${Math.round(h)}%` }); }, 1200); };
    const stop = loop(dt => {
      t += dt; tapT = Math.max(0, tapT - dt);
      if (!started) { count += dt; if (count >= 2.2) { started = true; sfx('pop'); } }
      else if (!over) {
        left -= dt; const g = greasy.some(([a, b]) => h >= a && h <= b), slip = (3.6 + h * 0.085) * (g ? 1.9 : 1); h = clamp(h - slip * dt, 0, 100);
        scoreEl.textContent = Math.round(h) + '%'; if (tapT > 0 && Math.random() < 0.5) sweat.push({ x: POLE + 20, y: BASE - (h / 100) * SPAN - 50, vy: -30, life: 0.5 });
        if (h >= 99.9 || left <= 0) end();
      }
      sweat.forEach(s => { s.y += s.vy * dt; s.life -= dt; }); sweat = sweat.filter(s => s.life > 0);
      // gambar
      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#9fdcff'); bg.addColorStop(0.7, '#e8f7ee'); bg.addColorStop(1, '#bfe6a0'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      cloud(ctx, 60, 50, 1); cloud(ctx, 270, 90, 0.8);
      for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#ff7a59' : '#fff'; ctx.beginPath(); ctx.moveTo(20 + i * 40, 20); ctx.lineTo(40 + i * 40, 20); ctx.lineTo(30 + i * 40, 42); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#c9a36a'; ctx.fillRect(POLE - 9, TOPY, 18, SPAN + 6); ctx.fillStyle = '#a98250'; ctx.fillRect(POLE - 9, TOPY, 5, SPAN + 6);
      for (const [a, b] of greasy) { const ya = BASE - (b / 100) * SPAN, yb = BASE - (a / 100) * SPAN; const gg = ctx.createLinearGradient(POLE - 9, 0, POLE + 9, 0); gg.addColorStop(0, '#5a3a14'); gg.addColorStop(0.5, '#a87a3a'); gg.addColorStop(1, '#5a3a14'); ctx.fillStyle = gg; ctx.fillRect(POLE - 10, ya, 20, yb - ya); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(POLE - 4, ya + 3, 3, yb - ya - 6); }
      ctx.fillStyle = '#e5484d'; for (let k = 0; k < 6; k++) ctx.fillRect(POLE - 11, TOPY + 6 + k * 52, 22, 5);
      ctx.fillStyle = '#7bbf6a'; ctx.fillRect(0, BASE + 4, W, H - BASE); ctx.fillStyle = '#6c4a22'; ctx.fillRect(POLE - 22, BASE + 2, 44, 12);
      // hadiah di puncak
      ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.fillText('🎁', POLE - 26, TOPY - 6 + Math.sin(t * 4) * 2); ctx.fillText('🚲', POLE + 4, TOPY - 6 + Math.sin(t * 4 + 1) * 2); ctx.fillText('📺', POLE + 32, TOPY - 6 + Math.sin(t * 4 + 2) * 2);
      // penonton (karyawan lain)
      cheerers.slice(0, 2).forEach((c, i) => drawChibi(ctx, { x: i ? 292 : 48, y: BASE + 46, s: 0.62, look: c.look, spec: c.spec, pose: 'cheer', t: t + i, face: 'happy', dir: i ? -1 : 1 }));
      // pemain
      const py = BASE - (h / 100) * SPAN + 4;
      drawChibi(ctx, { x: POLE, y: py, s: 0.72, look: emp.look, spec: emp.spec, pose: over && !won ? 'stand' : won ? 'cheer' : 'walk', t: tapT > 0 ? t * 1.2 : 0, face: won ? 'happy' : h < 8 ? 'stress' : 'excited', dir: 1 });
      ctx.font = '12px serif'; ctx.textAlign = 'center'; sweat.forEach(s => { ctx.globalAlpha = s.life * 2; ctx.fillText('💦', s.x, s.y); }); ctx.globalAlpha = 1;
      // waktu & tinggi
      ctx.fillStyle = 'rgba(14,50,38,0.85)'; rr(ctx, 10, 52, 70, 22, 11); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '800 12px ui-rounded, system-ui'; ctx.textAlign = 'center'; ctx.fillText(`⏱ ${Math.max(0, left).toFixed(1)}s`, 45, 67);
      if (!started) banner(ctx, 'Siap memanjat!', 'Ketuk cepat & jangan berhenti');
      if (over) banner(ctx, won ? '🏆 SAMPAI PUNCAK!' : left <= 0 ? '⏰ Waktu habis' : 'Selesai', won ? 'Hadiah diraih!' : `Tinggi ${Math.round(h)}%`);
    });
  });
}
