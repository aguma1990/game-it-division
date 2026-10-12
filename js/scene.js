// Scene Canvas isometrik: kamera (geser/zoom), karyawan, Mochi, partikel, gelembung, hit-test.
import { WORLD_W, WORLD_H, OX, SPECS, FACILITIES, DEPTS, deptOfSpec, fmtMoney, DEPT_KEYS, DESK_COSTS, DESK_MAX } from './data.js';
import { drawChibi, drawMochi, rr, ell, star4, heartPath } from './chibi.js';
import { deskXY, route, V_X, C1_Y, ENTRY, DIR_SEAT } from './game.js';
import * as I from './iso.js';

const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const font = I.font, P = I.P;
const S = 1.22;   // skala karakter

export class Scene {
  constructor(canvas, game) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.g = game;
    this.t = 0; this.parts = []; this.hits = []; this.onTap = () => {};
    this.vw = 400; this.vh = 600; this.dpr = 1; this.inset = { l: 0, r: 0, t: 0, b: 0 };
    this.cam = { x: 436, y: 300, z: 1 }; this.target = null; this.placed = false;
    this.mochi = { x: 6, y: C1_Y, dir: 1, path: [], wait: 2, walking: false };
    this.gift = null; this.giftT = 35 + Math.random() * 25; this.banner = null; this.nightFade = 0;
    this.petals = Array.from({ length: 8 }, () => ({ x: Math.random() * 900, y: Math.random() * 640, s: 3 + Math.random() * 3, v: 10 + Math.random() * 14, ph: Math.random() * 6 }));
    this.ptrs = new Map(); this.gesture = null;
    canvas.addEventListener('pointerdown', e => this.pdown(e));
    canvas.addEventListener('pointermove', e => this.pmove(e));
    canvas.addEventListener('pointerup', e => this.pup(e));
    canvas.addEventListener('pointercancel', e => { this.ptrs.delete(e.pointerId); });
    canvas.addEventListener('wheel', e => { e.preventDefault(); this.zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
    this.dir = { x: DIR_SEAT.x, y: DIR_SEAT.y, path: [], walking: false, flip: 1, act: null, init: false, greeted: new Set() };
    game.on('dir', a => { this.dir.act = { pose: a.pose || 'wave', text: a.text || '', face: a.face, t: 0, dur: a.dur || 2.2 }; });
    game.on('fx', f => this.onFx(f));
    game.on('popup', p => this.onPopup(p));
    game.on('banner', b => { this.banner = { text: b.text, sub: b.sub, t: 0 }; });
    game.on('newday', d => { this.dirEnter('Selamat pagi, semuanya! ☀️'); this.nightFade = 1; this.banner = { text: `Hari ke-${d.day}`, sub: `Gaji tim −${fmtMoney(d.salary)}`, t: 0 }; });
  }

  // ---------- Kamera ----------
  setQuality(q) { this.quality = q; this.resize(); }
  setInset(i) { this.inset = i; this.resize(); }
  get area() { const i = this.inset; return { x: i.l, y: i.t, w: Math.max(100, this.vw - i.l - i.r), h: Math.max(100, this.vh - i.t - i.b) }; }
  minZoom() { const a = this.area; return Math.min(a.w / (WORLD_W + 20), a.h / (WORLD_H + 10)); }
  resize() {
    const p = this.cv.parentElement; this.vw = p.clientWidth; this.vh = p.clientHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2) * (this.quality || 1);
    this.cv.style.width = this.vw + 'px'; this.cv.style.height = this.vh + 'px';
    this.cv.width = Math.round(this.vw * this.dpr); this.cv.height = Math.round(this.vh * this.dpr);
    const a = this.area, fit = this.minZoom();
    if (!this.placed) { // tampilan awal: tinggi pas, di tengah area meja
      this.cam.z = a.w >= 700 ? Math.max(fit, Math.min(Math.min(a.w / 1250, a.h / 780), 1.1)) : Math.max(fit, Math.min(a.w / 560, a.h / 760, 1.25)); this.cam.x = OX + 40; this.cam.y = 560; this.placed = true;
    }
    this.cam.z = Math.max(fit, this.cam.z); this.clamp();
  }
  clamp() {
    const a = this.area, z = this.cam.z, hw = a.w / 2 / z, hh = a.h / 2 / z, m = 30;
    const clampAxis = (v, half, size) => (half * 2 >= size + m * 2 ? size / 2 : Math.max(half - m, Math.min(size - half + m, v)));
    this.cam.x = clampAxis(this.cam.x, hw, WORLD_W); this.cam.y = clampAxis(this.cam.y, hh, WORLD_H);
  }
  center() { const a = this.area; return { x: a.x + a.w / 2, y: a.y + a.h / 2 }; }
  toWorld(cx, cy) { const r = this.cv.getBoundingClientRect(), c = this.center(), z = this.cam.z; return { x: (cx - r.left - c.x) / z + this.cam.x, y: (cy - r.top - c.y) / z + this.cam.y }; }
  zoomAt(cx, cy, k) {
    const before = this.toWorld(cx, cy), z0 = this.cam.z; this.cam.z = Math.max(this.minZoom(), Math.min(2.4, z0 * k));
    const r = this.cv.getBoundingClientRect(), c = this.center();
    this.cam.x = before.x - (cx - r.left - c.x) / this.cam.z; this.cam.y = before.y - (cy - r.top - c.y) / this.cam.z; this.clamp();
  }
  zoomBy(k) { const c = this.center(), r = this.cv.getBoundingClientRect(); this.zoomAt(r.left + c.x, r.top + c.y, k); }
  resetView() { this.placed = false; this.resize(); }
  focusGrid(gx, gy, z) { const [x, y] = P(gx, gy, 30); this.target = { x, y, z: z || Math.max(this.cam.z, 1.0) }; }

  // ---------- Input ----------
  pdown(e) {
    try { this.cv.setPointerCapture(e.pointerId); } catch { /* abaikan */ }
    this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    this.target = null;
    if (this.ptrs.size === 1) this.gesture = { moved: false, pinch: false };
    else { const [a, b] = [...this.ptrs.values()]; this.gesture = { moved: true, pinch: true, d: Math.hypot(a.x - b.x, a.y - b.y) }; }
  }
  pmove(e) {
    const p = this.ptrs.get(e.pointerId);
    if (!p) { const w = this.toWorld(e.clientX, e.clientY); this.cv.style.cursor = this.hitTest(w) ? 'pointer' : 'grab'; return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (this.gesture && this.gesture.pinch && this.ptrs.size >= 2) {
      p.x = e.clientX; p.y = e.clientY; const [a, b] = [...this.ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      this.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / this.gesture.d); this.gesture.d = d; return;
    }
    if (this.gesture && !this.gesture.moved && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 7) this.gesture.moved = true;
    if (this.gesture && this.gesture.moved) { this.cam.x -= dx / this.cam.z; this.cam.y -= dy / this.cam.z; this.clamp(); this.cv.style.cursor = 'grabbing'; }
    p.x = e.clientX; p.y = e.clientY;
  }
  pup(e) {
    const had = this.ptrs.has(e.pointerId); this.ptrs.delete(e.pointerId);
    const gst = this.gesture; if (this.ptrs.size === 0) this.gesture = null;
    if (!had || !gst || gst.moved || gst.pinch) return;
    const w = this.toWorld(e.clientX, e.clientY);
    let h = this.hitTest(w);
    if (!h) { const { gx, gy } = I.unP(w.x, w.y); h = this.zoneHit(gx, gy); }
    if (h) this.onTap(h);
  }
  hitTest(p) {
    let best = null;
    for (const h of this.hits) if (p.x >= h.x0 && p.x <= h.x1 && p.y >= h.y0 && p.y <= h.y1 && (!best || h.pri >= best.pri)) best = h;
    return best;
  }
  zoneHit(gx, gy) {
    const s = this.g.s;
    for (let i = 0; i < 27; i++) { if (this.g.deskOwned(i) || i % 9 !== s.deskCount[DEPT_KEYS[Math.floor(i / 9)]]) continue; const { x, y } = deskXY(i); if (gx >= x - 0.1 && gx <= x + 1.8 && gy >= y - 0.1 && gy <= y + 1.0) return { type: 'desk', dept: DEPT_KEYS[Math.floor(i / 9)] }; }
    if (gx < 0 || gy < 0 || gx > 28 || gy > 22) return null;
    return { type: 'room', kind: I.zoneAt(gx, gy) };
  }

  // ---------- Efek ----------
  worldPos(x, y, z = 46) { const [px, py] = P(x, y, z); return { x: px, y: py }; }
  spawn(p) { this.parts.push({ life: 1, max: 1, vx: 0, vy: 0, g: 0, size: 1, rot: 0, ...p }); }
  onFx(f) {
    if (f.kind === 'hearts' || f.kind === 'mochi-hearts') {
      const w = f.kind === 'mochi-hearts' ? this.worldPos(this.mochi.x, this.mochi.y, 30) : this.worldPos(f.x, f.y, 70);
      for (let i = 0; i < 6; i++) this.spawn({ kind: 'heart', x: w.x + (Math.random() - 0.5) * 24, y: w.y - 10, vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 30, max: 1.3, size: 0.8 + Math.random() * 0.6 });
    } else if (f.kind === 'stars') {
      const w = this.worldPos(f.x, f.y, 70);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; this.spawn({ kind: 'star', x: w.x, y: w.y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 20, g: 80, max: 0.9, size: 1 }); }
    } else if (f.kind === 'confetti') {
      const w = { x: this.cam.x, y: this.cam.y - 60 };
      for (let i = 0; i < 44; i++) this.spawn({ kind: 'confetti', x: w.x + (Math.random() - 0.5) * 300, y: w.y + Math.random() * 40, vx: (Math.random() - 0.5) * 170, vy: -120 - Math.random() * 160, g: 260, max: 1.6, size: 1, c: ['#3fbf7f', '#ffd84d', '#5ab8f5', '#ff7a59', '#8f8cf2'][i % 5], rot: Math.random() * 6 });
    }
  }
  onPopup(p) { const e = this.g.emp(p.empId); if (!e) return; const w = this.worldPos(e.x, e.y, 90); this.spawn({ kind: 'text', text: p.text, x: w.x, y: w.y, vy: -26, max: 1.8, color: p.kind === 'money' ? '#1f9a5a' : '#e0821f' }); }

  // ---------- Update ----------
  pickMochiGoal() {
    const m = this.mochi, r = Math.random();
    const goal = r < 0.35 ? { x: 1 + Math.random() * 14, y: C1_Y } : r < 0.5 ? { x: 3.2, y: 2.8 } : r < 0.65 ? { x: 10, y: 2.9 } : r < 0.75 ? { x: 13, y: 3.3 } : r < 0.9 ? { x: V_X, y: 6 + Math.random() * 8 } : { x: 9 + Math.random() * 3, y: 9.2 };
    m.path = route(m.x, m.y, goal.x, goal.y);
  }
  // Direktur datang lewat pintu, menyapa staf, lalu duduk di ruangannya
  dirEnter(text) {
    const d = this.dir; d.x = ENTRY.x; d.y = ENTRY.y; d.greeted.clear(); d.walking = true;
    d.path = [...route(ENTRY.x, ENTRY.y, 17.5, DIR_SEAT.y), { x: DIR_SEAT.x, y: DIR_SEAT.y }];
    d.act = { pose: 'wave', text, t: 0, dur: 2.6 };
  }
  updateDir(dt) {
    const d = this.dir, g = this.g, s = g.s;
    if (!d.init) { d.init = true; this.dirEnter(`Selamat datang di ${s.bank}! 🌿`); }
    if (d.act) { d.act.t += dt; if (d.act.t > d.act.dur) d.act = null; }
    if (d.walking) {
      const st = d.path[0];
      if (!st) { d.walking = false; d.x = DIR_SEAT.x; d.y = DIR_SEAT.y; }
      else {
        const dx = st.x - d.x, dy = st.y - d.y, dist = Math.hypot(dx, dy), sp = 2.4 * dt;
        if (dist <= sp) { d.x = st.x; d.y = st.y; d.path.shift(); } else { d.x += dx / dist * sp; d.y += dy / dist * sp; d.flip = dx - dy >= 0 ? 1 : -1; }
        for (const e of s.employees) {
          if (e.hidden || e.leaving || d.greeted.has(e.id) || Math.hypot(e.x - d.x, e.y - d.y) > 2.8) continue;
          d.greeted.add(e.id); if (!e.say) g.say(e, ['Selamat pagi, Bos! 🙇', 'Pagi, Bos~', 'Halo, Direktur! 👋'][Math.floor(Math.random() * 3)], 2.4);
        }
      }
    }
    const near = (x, y) => Math.hypot(x - ENTRY.x, y - ENTRY.y) < 2.2;
    const busy = (d.walking && near(d.x, d.y)) || s.employees.some(e => !e.hidden && e.st === 'walk' && near(e.x, e.y));
    g.doorOpen = (g.doorOpen || 0) + ((busy ? 1 : 0) - (g.doorOpen || 0)) * (1 - Math.exp(-dt * 8));
  }
  updateMochi(dt) {
    const m = this.mochi;
    if (!m.path.length) { m.walking = false; m.wait -= dt; if (m.wait <= 0) { this.pickMochiGoal(); m.wait = 2 + Math.random() * 5; } return; }
    const st = m.path[0], dx = st.x - m.x, dy = st.y - m.y, d = Math.hypot(dx, dy), sp = 1.3 * dt;
    m.walking = true;
    if (d <= sp) { m.x = st.x; m.y = st.y; m.path.shift(); } else { m.x += dx / d * sp; m.y += dy / d * sp; m.dir = dx - dy >= 0 ? 1 : -1; }
  }
  frame(dt) {
    const g = this.g, s = g.s; if (!s) return;
    const anim = s.speed === 0 || g.blocking ? 0.15 : 1 + 0.25 * (s.speed - 1);
    this.t += dt * anim;
    this.updateMochi(dt); this.updateDir(dt);
    if (this.target) {
      const k = 1 - Math.exp(-dt * 6); this.cam.x = lerp(this.cam.x, this.target.x, k); this.cam.y = lerp(this.cam.y, this.target.y, k); this.cam.z = lerp(this.cam.z, this.target.z, k); this.clamp();
      if (Math.abs(this.cam.x - this.target.x) < 1 && Math.abs(this.cam.y - this.target.y) < 1) this.target = null;
    }
    if (!g.blocking && s.speed > 0) {
      this.giftT -= dt;
      if (this.giftT <= 0 && !this.gift) { const r = Math.random(); this.gift = r < 0.5 ? { x: 1 + Math.random() * 14, y: C1_Y, life: 16 } : { x: V_X, y: 6 + Math.random() * 8, life: 16 }; this.giftT = 55 + Math.random() * 55; }
    }
    if (this.gift) { this.gift.life -= dt; if (this.gift.life <= 0) this.gift = null; }
    for (const p of this.parts) { p.life -= dt / p.max; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const p of this.petals) { p.y += p.v * dt; p.x += Math.sin(this.t * 1.2 + p.ph) * 12 * dt + 6 * dt; if (p.y > 650) { p.y = -10; p.x = Math.random() * 900; } if (p.x > 900) p.x = -10; }
    if (this.nightFade > 0) this.nightFade = Math.max(0, this.nightFade - dt * 0.9);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > 2.4) this.banner = null; }
    this._spT = (this._spT || 0) + dt;
    if (this._spT > 0.5 && s.speed > 0 && !g.blocking) {
      this._spT = 0;
      for (const e of s.employees) {
        const w = this.worldPos(e.x, e.y, 70);
        if (e.hidden) continue;
        if (e.st === 'sick' || (e.st === 'act' && e.act && e.act.kind === 'nap')) this.spawn({ kind: 'zzz', x: w.x + 12, y: w.y - 20, vx: 8, vy: -14, max: 1.8 });
        else if (e.st === 'act' && e.act && e.act.kind === 'ps') this.spawn({ kind: 'note', x: w.x + (Math.random() - 0.5) * 20, y: w.y - 28, vx: 6, vy: -22, max: 1.4 });
        else if (e.st === 'act' && e.act && e.act.kind === 'pool') this.spawn({ kind: 'spark', x: w.x + (Math.random() - 0.5) * 34, y: w.y + 10, vy: -16, max: 0.8 });
        else if (e.st === 'act' && e.act && e.act.kind === 'play') this.spawn({ kind: 'star', x: w.x + (Math.random() - 0.5) * 30, y: w.y - 20, vx: (Math.random() - 0.5) * 20, vy: -26, g: 30, max: 1, size: 0.7 });
        else if (e.buff > 0 && e.st === 'work') this.spawn({ kind: 'spark', x: w.x + (Math.random() - 0.5) * 22, y: w.y - 10 + (Math.random() - 0.5) * 20, vy: -10, max: 0.8 });
      }
    }
  }

  // ---------- Gambar ----------
  seatLift(e) {
    const s = this.g.s;
    if (e.st === 'act' && e.act) {
      if (e.act.kind === 'ps') return 16;
      if (e.act.kind === 'play') return s.fac.play === 1 ? -4 : Math.abs(Math.sin(this.t * 7 + e.desk)) * 16;
      if (e.act.kind === 'nap' || e.act.kind === 'meeting') return 18;
      if (e.act.kind === 'pool') return -9;
    }
    if ((e.st === 'work' || e.st === 'idle' || e.st === 'sick') && e.wslot < 0) return 18;
    return 0;
  }
  draw() {
    const g = this.g, s = g.s, ctx = this.ctx; if (!s) return;
    const t = this.t, hour = s.hour, dpr = this.dpr, c = this.center(), z = this.cam.z;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, this.vw, this.vh);
    // latar
    const bg = ctx.createRadialGradient(c.x, c.y, 40, c.x, c.y, Math.max(this.vw, this.vh) * 0.75); bg.addColorStop(0, '#3f8f68'); bg.addColorStop(1, '#17402f');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, this.vw, this.vh);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let y = 0; y < this.vh; y += 28) for (let x = (y / 28 % 2) * 14; x < this.vw; x += 28) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill(); }
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (c.x - this.cam.x * z), dpr * (c.y - this.cam.y * z));
    this.hits = [];
    const using = { coffee: g.slots.coffee.some(Boolean), ps: g.slots.ps.filter(Boolean).length, play: g.slots.play.some(Boolean), server: g.slots.server.some(Boolean) };
    // bayangan gedung
    const [bx, by] = P(10.5, 7.5, -18); ctx.fillStyle = 'rgba(0,30,15,0.28)'; ell(ctx, bx, by + 34, 700, 180); ctx.fill();
    I.drawFloor(ctx, g, t); I.drawWalls(ctx, g, t, hour, using);
    const items = []; const push = (d, fn) => items.push({ d, fn });
    I.collectProps(g, t, hour, using, push);
    for (const e of s.employees) push(e.x + e.y + 0.02, ctx2 => this.drawEmp(ctx2, e, t));
    for (const e of s.employees) if (e.st === 'act' && e.act && e.act.kind === 'pool') push(e.x + e.y + 0.4, ctx2 => { const [wx, wy] = P(e.x, e.y, 0); ctx2.fillStyle = 'rgba(70,170,230,0.62)'; ell(ctx2, wx, wy - 2, 27, 12); ctx2.fill(); ctx2.strokeStyle = 'rgba(255,255,255,0.8)'; ctx2.lineWidth = 1.6; ell(ctx2, wx, wy - 2, 27 + Math.sin(t * 4) * 2, 12 + Math.sin(t * 4)); ctx2.stroke(); });
    push(this.dir.walking ? this.dir.x + this.dir.y + 0.02 : 18.7 + 2.9 + 0.02, ctx2 => this.drawDirector(ctx2, t));
    const m = this.mochi; push(m.x + m.y, ctx2 => { const [x, y] = P(m.x, m.y); drawMochi(ctx2, { x, y, s: 1.1, t, dir: m.dir, walking: m.walking }); this.hits.push({ type: 'mochi', x0: x - 24, x1: x + 24, y0: y - 52, y1: y + 6, pri: 5 }); });
    if (s.fac.play === 1) g.slots.play.forEach(id => { const e = id && g.emp(id); if (e && e.st === 'act') push(e.x + e.y + 0.5, ctx2 => I.ballsFront(ctx2, e.x, e.y, t)); });
    items.sort((a, b) => a.d - b.d); for (const it of items) it.fn(ctx);
    if (this.gift) this.drawGift(ctx, t);
    this.drawTags(ctx, t); this.drawNames(ctx);
    for (const e of s.employees) this.drawBubbles(ctx, e, t);
    this.drawScold(ctx, t); this.drawDirBubble(ctx, t);
    this.drawParts(ctx, t);
    for (const p of this.petals) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(this.t + p.ph); ctx.fillStyle = 'rgba(200,255,200,0.7)'; ell(ctx, 0, 0, p.s, p.s * 0.55); ctx.fill(); ctx.restore(); }
    // overlay layar
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const eve = Math.max(0, (hour - 15) / 2); if (eve > 0) { ctx.fillStyle = `rgba(255,150,70,${0.1 * eve})`; ctx.fillRect(0, 0, this.vw, this.vh); }
    if (this.nightFade > 0) { ctx.fillStyle = `rgba(10,30,50,${Math.min(0.62, this.nightFade * 0.62)})`; ctx.fillRect(0, 0, this.vw, this.vh); }
    if (this.banner) {
      const b = this.banner, a = Math.min(1, b.t * 3, (2.4 - b.t) * 2), sc = 0.8 + 0.2 * Math.min(1, b.t * 4);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(c.x, c.y - 40); ctx.scale(sc, sc);
      rr(ctx, -130, -34, 260, 68, 18); ctx.fillStyle = 'rgba(14,50,38,0.92)'; ctx.fill(); ctx.strokeStyle = '#5fe39a'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = font(900, 26); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`🌿 ${b.text}`, 0, -8);
      ctx.fillStyle = '#a8e6c4'; ctx.font = font(700, 12); ctx.fillText(b.sub, 0, 17); ctx.restore();
    }
    if (s.speed === 0 && !g.blocking) { const a = this.area; ctx.fillStyle = 'rgba(8,40,25,0.18)'; ctx.fillRect(0, 0, this.vw, this.vh); ctx.fillStyle = '#fff'; ctx.font = font(900, 16); ctx.textAlign = 'center'; ctx.fillText('⏸ JEDA', a.x + a.w / 2, a.y + a.h - 14); }
  }

  drawDirector(ctx, t) {
    const s = this.g.s, d = this.dir, walking = d.walking, [px, py] = walking ? P(d.x, d.y, 0) : P(18.7, 2.9, 18), writing = Math.sin(t * 0.35) > -0.2, act = d.act;
    const sc = this.g.scold, mad = sc && sc.ready && sc.mode === 'marah', talk = sc && sc.ready;
    const mood = this.g.avgMood(), face = act && act.face ? act.face : mad ? 'stress' : talk && sc.mode === 'semangat' ? 'happy' : this.g.s.risk > 70 ? 'stress' : mood > 70 ? 'happy' : 'smile';
    this.hits.push({ type: 'boss', x0: px - 26, x1: px + 26, y0: py - 88, y1: py + 8, pri: 9 });
    const jx = mad ? Math.sin(t * 45) * 1.6 : 0;
    drawChibi(ctx, { x: px + jx, y: py, s: S, look: s.dirLook, spec: 'dir', pose: walking ? 'walk' : act ? act.pose : mad ? 'cheer' : talk ? 'wave' : writing ? 'type' : 'sit', t, face, dir: walking ? d.flip : 1, phase: 0.5 });
  }
  // label nama di bawah tiap karakter (tetap terbaca walau sedang berjalan)
  nameTag(ctx, px, py, name, color) {
    ctx.save(); ctx.font = font(800, 10); const w = ctx.measureText(name).width + 18;
    rr(ctx, px - w / 2, py, w, 15, 7.5); ctx.fillStyle = 'rgba(255,255,255,0.93)'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(px - w / 2 + 8, py + 7.5, 3, 0, TAU); ctx.fillStyle = color; ctx.fill();
    ctx.fillStyle = '#1f3a2e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(name, px + 4, py + 8); ctx.restore();
  }
  drawNames(ctx) {
    const g = this.g, s = g.s, d = this.dir;
    for (const e of s.employees) {
      if (e.hidden) continue;
      const [px, py] = P(e.x, e.y, this.seatLift(e)); this.nameTag(ctx, px, py + 9, e.name.split(' ')[0], DEPTS[deptOfSpec(e.spec)].color);
    }
    const [dx, dy] = d.walking ? P(d.x, d.y, 0) : P(18.7, 2.9, 18); this.nameTag(ctx, dx, dy + 9, `${s.name.split(' ')[0]} (Direktur)`, '#d6343c');
  }
  drawDirBubble(ctx, t) {
    const d = this.dir, a = d.act, sc = this.g.scold; if (!a || !a.text || (sc && sc.ready && sc.text)) return;
    const [px, py] = d.walking ? P(d.x, d.y, 0) : P(18.7, 2.9, 18), al = Math.min(1, a.t * 4, (a.dur - a.t) * 3), pop = 0.85 + 0.15 * Math.min(1, a.t * 5);
    ctx.save(); ctx.globalAlpha = Math.max(0, al); ctx.font = font(900, 12); const w = Math.min(260, ctx.measureText(a.text).width + 24);
    ctx.translate(px, py - 102); ctx.scale(pop, pop); rr(ctx, -w / 2, -14, w, 28, 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#2fae6a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, 14); ctx.lineTo(0, 22); ctx.lineTo(6, 14); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.fillStyle = '#1f3a2e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a.text, 0, 1); ctx.restore();
  }

  drawEmp(ctx, e, t) {
    if (e.hidden) return;
    const s = this.g.s, lift = this.seatLift(e), [px, py] = P(e.x, e.y, lift);
    let pose = 'stand', held = null, face = 'smile', dir = 1;
    const low = e.energy < 25, hi = e.stress > 75;
    switch (e.st) {
      case 'walk': pose = 'walk'; dir = e.flip || 1; face = hi ? 'stress' : 'smile'; break;
      case 'queue': pose = 'stand'; face = low ? 'tired' : 'smile'; break;
      case 'sick': pose = 'sleep'; face = 'sleep'; break;
      case 'act': {
        const k = e.act && e.act.kind;
        if (k === 'coffee') { pose = 'drink'; held = 'cup'; face = 'happy'; }
        else if (k === 'gossip') { pose = 'stand'; face = 'happy'; }
        else if (k === 'snack') { pose = 'drink'; held = 'snack'; face = 'happy'; }
        else if (k === 'ps') { pose = 'game'; held = 'pad'; face = 'excited'; }
        else if (k === 'play') { pose = s.fac.play === 1 ? 'ball' : 'bounce'; face = 'happy'; }
        else if (k === 'nap') { pose = 'sleep'; face = 'sleep'; }
        else if (k === 'pool') { pose = 'ball'; face = 'happy'; }
        else if (k === 'summon') { pose = 'stand'; face = this.g.scold && this.g.scold.mode === 'semangat' ? 'happy' : 'stress'; }
        else if (k === 'meeting') { pose = 'sit'; face = Math.sin(t * 1.3 + e.desk) > 0.4 ? 'happy' : 'smile'; }
        break;
      }
      case 'work': pose = e.wslot >= 0 ? 'ttype' : 'type'; face = hi ? 'stress' : low ? 'tired' : 'focus'; break;
      case 'idle': pose = 'sit'; face = low ? 'tired' : 'smile'; break;
    }
    if (e.face) face = e.face;
    this.hits.push({ type: 'emp', id: e.id, x0: px - 26, x1: px + 26, y0: py - 88, y1: py + 8, pri: 10 });
    drawChibi(ctx, { x: px, y: py, s: S, look: e.look, spec: e.spec, pose, t, face, dir, held, phase: e.desk * 1.7 });
    if (e.suggK) { ctx.font = '16px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e.suggK === 'fire' ? '🚪' : '⚠️', px + 24, py - 78 + Math.sin(t * 4 + e.desk) * 2); }
    if (e.rarity === 'SSR' || e.rarity === 'SR') { const a = (t * 2 + e.desk) % TAU; star4(ctx, px + Math.cos(a) * 26, py - 44 + Math.sin(a * 1.3) * 22, 3, e.rarity === 'SSR' ? '#ffd84d' : '#c9b8ff'); }
  }

  // gelembung ucapan Kepala Divisi saat memanggil / memarahi staf
  drawScold(ctx, t) {
    const sc = this.g.scold; if (!sc || !sc.ready || !sc.text) return;
    const [px, py] = P(18.7, 2.9, 18), top = py - 96 - 6, mad = sc.mode === 'marah';
    ctx.save(); ctx.font = font(900, mad ? 13 : 11.5); const w = Math.min(240, ctx.measureText(sc.text).width + 22), x = px + (mad ? Math.sin(t * 40) * 1.5 : 0);
    ctx.translate(x, top); rr(ctx, -w / 2, -14, w, 28, 14); ctx.fillStyle = mad ? '#fff1f1' : '#fff'; ctx.fill(); ctx.strokeStyle = mad ? '#e5484d' : '#2fae6a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, 14); ctx.lineTo(0, 22); ctx.lineTo(6, 14); ctx.fillStyle = mad ? '#fff1f1' : '#fff'; ctx.fill();
    ctx.fillStyle = mad ? '#b3202a' : '#1f3a2e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sc.text, 0, 1);
    if (mad) { ctx.font = '16px serif'; ctx.fillText('💢', w / 2 - 2, -16 + Math.sin(t * 12) * 2); ctx.fillText('💢', -w / 2 + 2, -16 + Math.cos(t * 11) * 2); }
    ctx.restore();
  }

  drawBubbles(ctx, e, t) {
    if (e.hidden) return;
    const lift = this.seatLift(e), [px, py] = P(e.x, e.y, lift), top = py - 86, x = px;
    ctx.save();
    if (e.claimBubble) {
      const y = top - 12 + Math.sin(t * 6) * 3; ctx.translate(x, y);
      rr(ctx, -30, -12, 60, 24, 12); ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-5, 12); ctx.lineTo(0, 18); ctx.lineTo(5, 12); ctx.fillStyle = '#ffd84d'; ctx.fill();
      ctx.fillStyle = '#6a4a00'; ctx.font = font(900, 11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⭐ Klaim!', 0, 0.5);
      ctx.restore(); this.hits.push({ type: 'claim', id: e.claimBubble, x0: x - 32, x1: x + 32, y0: y - 14, y1: y + 20, pri: 20 }); return;
    }
    if (e.say) {
      ctx.font = font(800, 11); const w = ctx.measureText(e.say).width + 16, y = top - 10;
      ctx.translate(x, y); rr(ctx, -w / 2, -11, w, 22, 11); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#b4dcc4'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, 10); ctx.lineTo(0, 16); ctx.lineTo(4, 10); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.fillStyle = '#1f3a2e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e.say, 0, 0.5); ctx.restore(); return;
    }
    const hasReq = this.g.s.inbox.some(r => r.from === e.id);
    if (hasReq) { ctx.translate(x, top - 8 + Math.sin(t * 5) * 3); rr(ctx, -14, -11, 28, 22, 11); ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText('📨', 0, 1); ctx.restore(); this.hits.push({ type: 'emp', id: e.id, x0: x - 18, x1: x + 18, y0: top - 22, y1: top + 6, pri: 15 }); return; }
    const tk = e.task ? this.g.task(e.task) : null;
    if (tk && e.st === 'work') {
      const sp = SPECS[tk.spec], pct = Math.min(1, tk.progress / tk.work); ctx.translate(x, top - 8);
      rr(ctx, -26, -8, 52, 16, 8); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = sp.color; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(-16, 0, 9, 0, TAU); ctx.fillStyle = sp.color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = '10px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(sp.emoji, -16, 0.5);
      rr(ctx, -5, -3, 26, 6, 3); ctx.fillStyle = '#e1eee6'; ctx.fill(); if (pct > 0.02) { rr(ctx, -5, -3, Math.max(5, 26 * pct), 6, 3); ctx.fillStyle = sp.color; ctx.fill(); }
    } else if (!e.task && e.st === 'idle') { ctx.translate(x, top - 6 + Math.sin(t * 3 + e.desk) * 2); ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.fillText('💤', 0, 0); }
    else if (e.st === 'queue') { ctx.translate(x, top - 6); ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.fillText('⏳', 0, 0); }
    ctx.restore();
    if (e.st !== 'act' && e.st !== 'sick') {
      ctx.save(); ctx.font = '12px serif'; ctx.textAlign = 'center';
      if (e.broken) { ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 4); ctx.fillText('🔧', x - 28, py - 62); ctx.globalAlpha = 1; }
      if (e.energy < 22) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); ctx.fillText('🪫', x + 26, py - 62); }
      else if (e.stress > 78) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); ctx.fillText('💢', x + 26, py - 62); }
      ctx.restore();
    }
  }

  drawGift(ctx, t) {
    const gf = this.gift, [px, py0] = P(gf.x, gf.y), py = py0 - Math.abs(Math.sin(t * 4)) * 10;
    if (gf.life < 4 && Math.sin(t * 20) > 0.3) return;
    ctx.save(); ctx.translate(px, py);
    ctx.fillStyle = 'rgba(0,40,20,0.2)'; ell(ctx, 0, 4 + Math.abs(Math.sin(t * 4)) * 10, 13, 4); ctx.fill();
    rr(ctx, -12, -22, 24, 22, 5); ctx.fillStyle = '#3fbf7f'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#ffd84d'; ctx.fillRect(-2, -22, 4, 22); ctx.fillRect(-12, -13, 24, 4);
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -22); ctx.quadraticCurveTo(sd * 12, -34, sd * 9, -22); ctx.fillStyle = '#ffd84d'; ctx.fill(); }
    star4(ctx, 14, -28 + Math.sin(t * 5) * 2, 4, '#ffd84d'); star4(ctx, -15, -12 + Math.cos(t * 4) * 2, 3, '#fff6a8');
    ctx.restore();
    this.hits.push({ type: 'gift', x: gf.x, y: gf.y, x0: px - 24, x1: px + 24, y0: py - 48, y1: py + 10, pri: 30 });
  }

  drawTags(ctx, t) {
    const g = this.g, s = g.s;
    const tagFor = (k, gx, gy, z) => {
      const nx = g.nextFac(k), lv = s.fac[k]; if (lv !== 0 || !nx) return;
      const lock = s.level < nx.lvl, [x, y] = P(gx, gy, z), txt = lock ? `🔒 Lv.${nx.lvl}` : `${FACILITIES[k].emoji} Beli! ${fmtMoney(nx.cost)}`;
      I.tag(ctx, x, y, txt, t, lock ? '#8fa89a' : '#2fae6a'); ctx.font = font(800, 11); const w = ctx.measureText(txt).width + 20;
      this.hits.push({ type: 'room', kind: k, x0: x - w / 2, x1: x + w / 2, y0: y - 16, y1: y + 20, pri: 6 });
    };
    if (s.fac.coffee && s.coffeeStock <= 0) { const [cx, cy] = P(2.0, 0.6, 118); I.tag(ctx, cx, cy, '☕ Stok habis! → Inbox', t, '#e5484d'); this.hits.push({ type: 'room', kind: 'inbox', x0: cx - 70, x1: cx + 70, y0: cy - 16, y1: cy + 20, pri: 7 }); }
    tagFor('pool', 24.0, 4.2, 70);
    tagFor('coffee', 2.0, 0.6, 108); tagFor('snack', 0.65, 1.95, 104);
    if (s.fac.snack && s.snackStock <= 0) { const [cx, cy] = P(0.65, 1.95, 124); I.tag(ctx, cx, cy, '🍪 Snack habis! → Inbox', t, '#e5484d'); this.hits.push({ type: 'room', kind: 'inbox', x0: cx - 70, x1: cx + 70, y0: cy - 16, y1: cy + 20, pri: 7 }); } tagFor('ps', 12.0, 0.2, 140); tagFor('play', 13.4, 12.4, 40);
    DEPT_KEYS.forEach(d => {
      const n = s.deskCount[d]; if (n >= DESK_MAX || !g.deptFull(d)) return;
      const sp = I.expandSpot(g, d), [x, y] = P(sp.x, sp.y, 62), txt = `🏗️ +Meja Rp ${DESK_COSTS[g.totalDesks()]} jt`;
      I.tag(ctx, x, y - 14, txt, t, '#8fa89a'); ctx.font = font(800, 11); const w = ctx.measureText(txt).width + 20;
      this.hits.push({ type: 'desk', dept: d, x0: x - w / 2, x1: x + w / 2, y0: y - 32, y1: y + 6, pri: 6 });
    });
    const plan = s.projects.filter(p => p.state === 'plan').length;
    if (plan) { const [mx, my] = P(18.6, 12.9, 70); I.tag(ctx, mx, my, `📋 Kick-off menunggu (${plan})`, t, '#e0a000'); ctx.font = font(800, 11); const w = ctx.measureText(`📋 Kick-off menunggu (${plan})`).width + 20; this.hits.push({ type: 'room', kind: 'meet', x0: mx - w / 2, x1: mx + w / 2, y0: my - 16, y1: my + 20, pri: 7 }); }
  }

  drawParts(ctx, t) {
    for (const p of this.parts) {
      const a = Math.max(0, Math.min(1, p.life * 2));
      ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y);
      switch (p.kind) {
        case 'heart': ctx.scale(p.size, p.size); heartPath(ctx, 0, 0, 5); ctx.fillStyle = '#ff6b6b'; ctx.fill(); break;
        case 'star': ctx.scale(p.size, p.size); star4(ctx, 0, 0, 6, '#ffd84d'); break;
        case 'spark': star4(ctx, 0, 0, 3.5, '#fff6a8'); break;
        case 'zzz': ctx.font = font(900, 12 + (1 - p.life) * 6); ctx.fillStyle = '#4f7a65'; ctx.textAlign = 'center'; ctx.fillText('z', 0, 0); break;
        case 'note': ctx.font = font(900, 13); ctx.fillStyle = '#2f9a6a'; ctx.textAlign = 'center'; ctx.fillText('♪', 0, 0); break;
        case 'text': ctx.font = font(900, 14); ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.strokeText(p.text, 0, 0); ctx.fillStyle = p.color; ctx.fillText(p.text, 0, 0); break;
        case 'confetti': ctx.rotate(p.rot + (1 - p.life) * 8); ctx.fillStyle = p.c; ctx.fillRect(-3, -2, 6, 4); break;
      }
      ctx.restore();
    }
  }
}
