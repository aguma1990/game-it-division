// Mini-game "Patch Rush": tap bug lucu secepat mungkin, hindari data nasabah!
import { sfx } from './audio.js?v=4.3.7';

const DURATION = 12;
const KINDS = [
  { e: '🐛', pts: 1, w: 60, life: 1.7 },
  { e: '🦠', pts: 2, w: 16, life: 1.2 },
  { e: '🐞', pts: 1, w: 12, life: 1.5 },
  { e: '☕', pts: 0, w: 5, life: 1.8, time: 1.5 },
  { e: '🔒', pts: -2, w: 14, life: 1.8, bad: true }
];

export function playPatchRush(host, { title = 'Patch Rush!' } = {}) {
  return new Promise(resolve => {
    host.innerHTML = `
      <div class="mg">
        <div class="mg-top"><b>${title}</b><span id="mgScore">0</span></div>
        <div class="mg-time"><i id="mgTime"></i></div>
        <p class="mg-help">Tap 🐛 🦠 🐞 sebelum kabur! Jangan sentuh 🔒 (data nasabah). ☕ = tambah waktu.</p>
        <div class="mg-arena" id="mgArena"><div class="mg-ready" id="mgReady">Siap?</div></div>
      </div>`;
    const arena = host.querySelector('#mgArena'), scoreEl = host.querySelector('#mgScore'), timeEl = host.querySelector('#mgTime'), ready = host.querySelector('#mgReady');
    let score = 0, left = DURATION, spawnT = 0, running = false, done = false, last = performance.now(), combo = 0, raf = 0;
    const items = new Set();
    const totalW = KINDS.reduce((a, k) => a + k.w, 0);
    const pickKind = () => { let x = Math.random() * totalW; for (const k of KINDS) { x -= k.w; if (x <= 0) return k; } return KINDS[0]; };

    function spawn() {
      const k = pickKind(), el = document.createElement('button');
      el.className = 'mg-item' + (k.bad ? ' bad' : ''); el.textContent = k.e;
      const x = 12 + Math.random() * 76, y = 12 + Math.random() * 74;
      el.style.left = x + '%'; el.style.top = y + '%';
      el.style.animationDuration = (k.life * 0.9) + 's';
      const it = { el, k, life: k.life };
      el.addEventListener('pointerdown', ev => {
        ev.preventDefault(); if (!running || !items.has(it)) return;
        items.delete(it);
        if (k.bad) { score = Math.max(0, score + k.pts); combo = 0; sfx('bad'); pop(el, '-2', '#ff5a6e'); }
        else { combo++; const bonus = combo >= 6 ? 1 : 0; score += k.pts + bonus; if (k.time) left = Math.min(DURATION + 3, left + k.time); sfx('squish'); pop(el, k.time ? `+${k.time}s` : `+${k.pts + bonus}`, '#2fae6a'); }
        el.remove(); scoreEl.textContent = score;
      });
      arena.appendChild(el); items.add(it);
    }
    function pop(el, txt, color) {
      const p = document.createElement('div'); p.className = 'mg-pop'; p.textContent = txt; p.style.color = color; p.style.left = el.style.left; p.style.top = el.style.top;
      arena.appendChild(p); setTimeout(() => p.remove(), 700);
    }
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (running) {
        left -= dt; spawnT -= dt;
        if (spawnT <= 0) { spawn(); spawnT = 0.38 + Math.random() * 0.25; }
        for (const it of [...items]) { it.life -= dt; if (it.life <= 0) { items.delete(it); if (!it.k.bad) combo = 0; it.el.remove(); } }
        timeEl.style.width = Math.max(0, left / DURATION * 100) + '%';
        if (left <= 0) finish();
      }
      if (!done) raf = requestAnimationFrame(loop);
    }
    function finish() {
      if (done) return; done = true; running = false; cancelAnimationFrame(raf);
      const tier = score >= 20 ? 2 : score >= 10 ? 1 : 0;
      sfx(tier ? 'win' : 'lose');
      arena.innerHTML = `<div class="mg-ready big">${tier === 2 ? '🌟 SEMPURNA!' : tier === 1 ? '👍 Lumayan!' : '🥲 Yah…'}<small>Skor: ${score}</small></div>`;
      setTimeout(() => resolve({ score, tier }), 1100);
    }
    // hitung mundur
    let c = 3; ready.textContent = '3';
    const iv = setInterval(() => { c--; if (c > 0) { ready.textContent = String(c); sfx('tap'); } else { clearInterval(iv); ready.remove(); running = true; last = performance.now(); sfx('pop'); } }, 650);
    raf = requestAnimationFrame(loop);
  });
}
