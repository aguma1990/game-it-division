// Penggambar dunia isometrik (kantor tampak dari atas): lantai, dinding, sekat kaca, furnitur, zona.
import { TW, TH, OX, OY, SPECS, DEPTS, DEPT_KEYS } from './data.js';
import { rr, ell, star4, shade } from './chibi.js';
import { deskXY, SERVER_ST, PLAY_SLOTS, V_X } from './game.js';

const TAU = Math.PI * 2;
export const FONT = 'ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", "Nunito", system-ui, sans-serif';
export const font = (w, s) => `${w} ${s}px ${FONT}`;
export const WH = 132;                                   // tinggi dinding
export const GWD = 21, GHT = 15;
const lerp = (a, b, t) => a + (b - a) * t;
export const P = (gx, gy, z = 0) => [OX + (gx - gy) * TW / 2, OY + (gx + gy) * TH / 2 - z];
export const unP = (sx, sy) => { const a = (sx - OX) / (TW / 2), b = (sy - OY) / (TH / 2); return { gx: (a + b) / 2, gy: (b - a) / 2 }; };

// ---------- helper dasar ----------
function poly(ctx, pts, fill, stroke, lw = 1) {
  ctx.beginPath(); pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
export function box(ctx, gx, gy, w, d, h, c, z = 0, o = {}) {
  const top = o.top || shade(c, 0.1), left = o.left || shade(c, -0.1), right = o.right || shade(c, -0.24), ln = o.line || 'rgba(0,40,20,0.22)';
  poly(ctx, [P(gx, gy + d, z + h), P(gx + w, gy + d, z + h), P(gx + w, gy + d, z), P(gx, gy + d, z)], left, ln, 0.8);
  poly(ctx, [P(gx + w, gy, z + h), P(gx + w, gy + d, z + h), P(gx + w, gy + d, z), P(gx + w, gy, z)], right, ln, 0.8);
  poly(ctx, [P(gx, gy, z + h), P(gx + w, gy, z + h), P(gx + w, gy + d, z + h), P(gx, gy + d, z + h)], top, ln, 0.8);
}
function onWallR(ctx, gx, z, fn) { const [x, y] = P(gx, 0, z); ctx.save(); ctx.translate(x, y); ctx.transform(1, 0.5, 0, 1, 0, 0); fn(ctx); ctx.restore(); }
function onWallL(ctx, gy, z, fn) { const [x, y] = P(0, gy, z); ctx.save(); ctx.translate(x, y); ctx.transform(1, -0.5, 0, 1, 0, 0); fn(ctx); ctx.restore(); }
function onFloor(ctx, gx, gy, z, fn) { const [x, y] = P(gx, gy, z); ctx.save(); ctx.translate(x, y); ctx.transform(32 / 40, 16 / 40, -32 / 40, 16 / 40, 0, 0); fn(ctx); ctx.restore(); }
function onPlaneY(ctx, gx, gy, z, fn) { const [x, y] = P(gx, gy, z); ctx.save(); ctx.translate(x, y); ctx.transform(1, 0.5, 0, 1, 0, 0); fn(ctx); ctx.restore(); }

function skyAt(hour) {
  const K = [[7.5, '#bfe8ff', '#eaf8ff'], [10.5, '#8fd3ff', '#e6f6ff'], [14, '#86cbff', '#f0fbff'], [17.2, '#ffb38a', '#ffe2c0']];
  hour = Math.max(K[0][0], Math.min(K[3][0], hour));
  const hx = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  for (let i = 0; i < 3; i++) if (hour <= K[i + 1][0]) { const t = (hour - K[i][0]) / (K[i + 1][0] - K[i][0]); const m = (a, b) => { const A = hx(a), B = hx(b); return `rgb(${A.map((v, j) => Math.round(lerp(v, B[j], t))).join(',')})`; }; return [m(K[i][1], K[i + 1][1]), m(K[i][2], K[i + 1][2])]; }
  return [K[3][1], K[3][2]];
}
export function tag(ctx, x, y, text, t, color = '#2fae6a') {
  const bob = Math.sin(t * 3 + x) * 2.5; ctx.save(); ctx.translate(x, y + bob);
  ctx.font = font(800, 11); const w = ctx.measureText(text).width + 20;
  rr(ctx, -w / 2, -12, w, 24, 12); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5, 12); ctx.lineTo(0, 18); ctx.lineTo(5, 12); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.fillStyle = '#1f3a2e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 0.5); ctx.restore();
}

// ---------- zona ----------
export const zoneAt = (gx, gy) => (gx >= 16 ? (gy < 10.3 ? 'boss' : 'garden') : gy < 5.2 ? (gx < 6.5 ? 'coffee' : 'ps') : gy < 10.3 ? (gx < V_X ? 'ctrl' : 'dev') : gx < V_X ? 'ops' : gx < 11.1 ? 'server' : 'play');

// Ruangan tumbuh mengikuti jumlah meja: semakin banyak karyawan, semakin lebar kantornya
export const roomEnd = (g, d) => { const n = g.s.deskCount[d]; return d === 'dev' ? 7.4 + 1.95 * n + 0.65 : 0.7 + 1.95 * n + 0.9; };
export const roomRects = g => ({
  ctrl: [0.3, 5.5, roomEnd(g, 'ctrl'), 10.0], dev: [7.0, 5.5, roomEnd(g, 'dev'), 10.0], ops: [0.3, 10.4, roomEnd(g, 'ops'), 15], server: [7.0, 10.4, 11.0, 15], play: [11.2, 10.4, 16, 15]
});
// apakah petak (cx,cy) sudah dibangun, atau masih lahan kosong
export function isBuilt(g, cx, cy) {
  if (cx >= 16) return cy < 10.3;                                          // sayap Ruang Kepala Divisi
  if (cy < 5.2) return true;
  if (cx >= 6 && cx < 7) return true;                                     // lorong tegak
  if (cy < 10.3) { if (cx < 6) return cx < roomEnd(g, 'ctrl') || cy < 7.0; return cx < roomEnd(g, 'dev'); }
  if (cx < 7) return cx < roomEnd(g, 'ops') || cy < 12.0;
  return true;                                                            // ruang server & taman bermain
}

// ---------- LANTAI ----------
const FLOORS = {
  coffee: ['#f1ead6', '#e7dfc6'], ps: ['#d8b98a', '#cfae7d'], server: ['#5f7c78', '#56726e'],
  play: ['#9bdc8a', '#ffe27a', '#8fd3ff', '#c8f0a0'], ctrl: ['#8fd3c8', '#84c9bd'], dev: ['#8fd1a6', '#85c79c'], ops: ['#c4d98f', '#b9cf84'], corr: ['#dfe9e1', '#d5e2da'], lot: ['#86c47a', '#7cbc72'], boss: ['#b98f5e', '#b08756']
};
export function drawFloor(ctx, g, t) {
  const s = g.s;
  for (let gy = 0; gy < GHT; gy++) for (let gx = 0; gx < GWD; gx++) {
    const cx = gx + 0.5, cy = gy + 0.5;
    let z = zoneAt(cx, cy);
    if ((cy > 4.0 && cy < 5.0) || (cx > 6.0 && cx < 7.0 && cy >= 5.0)) z = 'corr';
    if (!isBuilt(g, cx, cy)) z = 'lot';
    const c = FLOORS[z], col = z === 'play' ? c[(gx + gy) % 4] : c[(gx + gy) % 2];
    poly(ctx, [P(gx, gy), P(gx + 1, gy), P(gx + 1, gy + 1), P(gx, gy + 1)], col, 'rgba(0,50,30,0.10)', 0.8);
  }
  // tebal lantai
  poly(ctx, [P(0, GHT), P(GWD, GHT), P(GWD, GHT, -18), P(0, GHT, -18)], '#b9c8be', 'rgba(0,40,20,0.3)');
  poly(ctx, [P(GWD, 0), P(GWD, GHT), P(GWD, GHT, -18), P(GWD, 0, -18)], '#9fb2a5', 'rgba(0,40,20,0.3)');
  // karpet lounge
  poly(ctx, [P(9.0, 1.8), P(14.6, 1.8), P(14.6, 3.7), P(9.0, 3.7)], '#4fae7c', 'rgba(255,255,255,0.5)', 2);
  poly(ctx, [P(9.2, 2.0), P(14.4, 2.0), P(14.4, 3.5), P(9.2, 3.5)], null, 'rgba(255,255,255,0.35)', 1.2);
  // karpet Ruang Kepala Divisi
  poly(ctx, [P(17.0, 1.9), P(20.7, 1.9), P(20.7, 6.4), P(17.0, 6.4)], '#2d6a4f', 'rgba(255,255,255,0.55)', 2);
  poly(ctx, [P(17.2, 2.1), P(20.5, 2.1), P(20.5, 6.2), P(17.2, 6.2)], null, 'rgba(255,216,77,0.7)', 1.4);
  onFloor(ctx, 16.3, 9.85, 0, c => { c.fillStyle = 'rgba(70,40,10,0.6)'; c.font = font(900, 10.5); c.textBaseline = 'middle'; c.fillText('RUANG KEPALA DIVISI', 0, 0); });
  // tepi & label tiap ruangan
  const ROOMS = roomRects(g);
  for (const k of ['ctrl', 'dev', 'ops', 'server']) {
    const [x0, y0, x1, y1] = ROOMS[k], col = k === 'server' ? '#7fffd4' : DEPTS[k].color;
    poly(ctx, [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], null, 'rgba(255,255,255,0.55)', 2);
    poly(ctx, [P(x0, y1 - 0.14), P(x1, y1 - 0.14), P(x1, y1), P(x0, y1)], col, null);
    onFloor(ctx, x0 + 0.25, y1 - 0.3, 0, c => { c.fillStyle = 'rgba(10,70,45,0.6)'; c.font = font(900, 10.5); c.textBaseline = 'middle'; c.fillText((k === 'server' ? 'RUANG SERVER' : DEPTS[k].name).toUpperCase(), 0, 0); });
  }
  // taman bermain
  const lv = s.fac.play;
  if (lv === 0) { const pa = [P(11.9, 10.9), P(15.0, 10.9), P(15.0, 14.1), P(11.9, 14.1)]; poly(ctx, pa, 'rgba(255,255,255,0.15)'); ctx.setLineDash([6, 5]); poly(ctx, pa, null, 'rgba(255,255,255,0.8)', 2); ctx.setLineDash([]); onFloor(ctx, 13.1, 12.8, 0, c => { c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = font(900, 46); c.textBaseline = 'middle'; c.fillText('?', 0, 0); }); }
  else if (lv === 1) { // kolam bola
    poly(ctx, [P(11.9, 10.9), P(15.0, 10.9), P(15.0, 14.1), P(11.9, 14.1)], '#79c9e8', '#ffffff', 3);
    for (let i = 0; i < 52; i++) { const bx = 12.05 + ((i * 0.37) % 2.8), by = 11.05 + ((i * 0.61) % 2.9), [x, y] = P(bx, by, 4 + Math.sin(t * 3 + i) * 0.8); ctx.fillStyle = ['#ff7a59', '#ffd84d', '#3fbf7f', '#5ab8f5', '#8f8cf2', '#ffffff'][i % 6]; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 2, 0, TAU); ctx.fill(); }
  } else {
    PLAY_SLOTS.slice(0, g.capacity('play')).forEach(([sx, sy]) => { const [x, y] = P(sx, sy, 0); ell(ctx, x, y, 24, 12); ctx.fillStyle = '#3d8bd6'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ell(ctx, x, y - 1, 17, 8); ctx.fillStyle = '#1f4a8a'; ctx.fill(); });
  }
  onFloor(ctx, 14.4, 4.55, 0, c => { c.fillStyle = 'rgba(20,80,50,0.4)'; c.font = font(900, 9); c.fillText('MASUK ➜', 0, 0); });
}

// ---------- DINDING ----------
function windowW(ctx, u, v, w, h, hour, t) {
  const [a, b] = skyAt(hour); const gr = ctx.createLinearGradient(0, v, 0, v + h); gr.addColorStop(0, a); gr.addColorStop(1, b);
  rr(ctx, u, v, w, h, 4); ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(u + w / 2, v); ctx.lineTo(u + w / 2, v + h); ctx.moveTo(u, v + h / 2); ctx.lineTo(u + w, v + h / 2); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; const cx = u + ((t * 6) % (w + 20)) - 10; ctx.beginPath(); ctx.arc(cx, v + h * 0.3, 6, 0, TAU); ctx.arc(cx + 7, v + h * 0.3 + 2, 5, 0, TAU); ctx.fill();
}
function banner(c, u, v, w, text, color = '#245a40') {
  rr(c, u, v, w, 18, 6); c.fillStyle = color; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = '#fff'; c.font = font(900, 9.5); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, u + w / 2, v + 9.5);
}
export function drawWalls(ctx, g, t, hour, using) {
  const s = g.s, W = GWD, H = GHT;
  poly(ctx, [P(0, 0, 0), P(0, H, 0), P(0, H, WH), P(0, 0, WH)], '#d4e8da', null);
  poly(ctx, [P(0, 0, 0), P(W, 0, 0), P(W, 0, WH), P(0, 0, WH)], '#e6f3ea', null);
  poly(ctx, [P(0, 0, 0), P(0, H, 0), P(0, H, 30), P(0, 0, 30)], '#5fb585', null);
  poly(ctx, [P(0, 0, 0), P(W, 0, 0), P(W, 0, 30), P(0, 0, 30)], '#6cc592', null);
  poly(ctx, [P(0, 0, 30), P(0, H, 30), P(0, H, 33), P(0, 0, 33)], '#f4fbf6', null);
  poly(ctx, [P(0, 0, 30), P(W, 0, 30), P(W, 0, 33), P(0, 0, 33)], '#f4fbf6', null);
  poly(ctx, [P(0, 0, WH), P(W, 0, WH), P(W, 0, WH + 7), P(0, 0, WH + 7)], '#2c6b4d', null);
  poly(ctx, [P(0, 0, WH), P(0, H, WH), P(0, H, WH + 7), P(0, 0, WH + 7)], '#245a40', null);
  poly(ctx, [P(0, 0, WH + 7), P(W, 0, WH + 7), P(W + 0.25, -0.25, WH + 7), P(-0.25, -0.25, WH + 7)], '#3b8a64', null);
  ctx.strokeStyle = 'rgba(0,60,30,0.07)'; ctx.lineWidth = 1;
  for (let gx = 1; gx < W; gx++) { const a = P(gx, 0, 33), b = P(gx, 0, WH); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  for (let gy = 1; gy < H; gy++) { const a = P(0, gy, 33), b = P(0, gy, WH); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }

  // ----- dinding kanan (gy=0): pantry + lounge -----
  onWallR(ctx, 0, 0, c => {
    for (let i = 0; i < 4; i++) { rr(c, 12 + i * 29, -108, 27, 36, 4); c.fillStyle = i % 2 ? '#8fd3ab' : '#a8e0be'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#fff'; c.fillRect(i % 2 ? 16 + i * 29 : 31 + i * 29, -92, 3, 8); }
    rr(c, 136, -112, 50, 56, 5); c.fillStyle = '#1f3d33'; c.fill(); c.strokeStyle = '#d9b27a'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = font(800, 9); c.fillText('☕ MENU', 161, -100);
    c.font = font(600, 7); c.fillStyle = '#a8e0be'; c.fillText('Kopi Tubruk', 161, -86); c.fillText('Latte Neko', 161, -76); c.fillText('Teh Hijau', 161, -66);
    banner(c, 14, -128, 80, 'PANTRY & KOPI', '#2c8a5c'); banner(c, 240, -128, 90, 'LOUNGE & GAME', '#2c8a5c');
    windowW(c, 224, -112, 46, 50, hour, t);
    c.save(); c.shadowColor = '#5affc0'; c.shadowBlur = s.fac.ps ? 10 + Math.sin(t * 5) * 3 : 0; c.fillStyle = s.fac.ps ? '#7dffd0' : '#9bb8aa'; c.font = font(900, 10); c.fillText('GAME ON!', 295, -90); c.restore();
    // TV (gx 10.6..13.3)
    const lvl = s.fac.ps, tx = 339, ty = -118, tw = 86, th = 52;
    rr(c, tx, ty, tw, th, 5); c.fillStyle = '#17231f'; c.fill();
    c.save(); rr(c, tx + 4, ty + 4, tw - 8, th - 8, 3); c.clip();
    if (!lvl) { c.fillStyle = '#0e1713'; c.fillRect(tx, ty, tw, th); c.fillStyle = 'rgba(160,220,190,0.6)'; c.font = font(900, 24); c.fillText('?', tx + tw / 2, ty + th / 2); }
    else {
      const playing = using.ps > 0; const gr = c.createLinearGradient(0, ty, 0, ty + th); gr.addColorStop(0, playing ? '#6fd6ff' : '#7fd0a8'); gr.addColorStop(1, '#e3ffe9'); c.fillStyle = gr; c.fillRect(tx, ty, tw, th);
      c.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { const cx = tx + ((t * (playing ? 36 : 10) + i * 36) % (tw + 24)) - 12; c.fillRect(cx, ty + 10 + i * 8, 14, 5); c.fillRect(cx + 3, ty + 6 + i * 8, 7, 5); }
      c.fillStyle = '#3d9a5b'; c.fillRect(tx, ty + th - 12, tw, 12);
      const jy = playing ? Math.abs(Math.sin(t * 6)) * 14 : Math.abs(Math.sin(t * 2)) * 4;
      c.fillStyle = '#ff7a59'; c.fillRect(tx + 24, ty + th - 24 - jy, 9, 12); c.fillStyle = '#fff'; c.fillRect(tx + 26, ty + th - 22 - jy, 2, 2); c.fillRect(tx + 30, ty + th - 22 - jy, 2, 2);
      c.fillStyle = '#ffd84d'; c.beginPath(); c.arc(tx + tw - 20, ty + 16 + Math.sin(t * 4) * 3, 4, 0, TAU); c.fill();
    }
    c.restore(); rr(c, tx, ty, tw, th, 5); c.strokeStyle = lvl ? '#5affc0' : '#4a5a52'; c.lineWidth = 2; c.stroke();
    rr(c, 448, -112, 34, 50, 3); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#2c8a5c'; c.lineWidth = 3; c.stroke();
    if (s.decor.poster) { const pg = c.createLinearGradient(448, -112, 482, -62); pg.addColorStop(0, '#8fe3b0'); pg.addColorStop(1, '#5ab8f5'); c.fillStyle = pg; c.fillRect(452, -108, 26, 36); star4(c, 465, -92, 9, '#fff'); c.fillStyle = '#1f6a45'; c.font = font(900, 7); c.fillText('IDOL☆', 465, -68); }
    else { c.fillStyle = '#2c8a5c'; c.font = font(900, 7); c.fillText('LEVEL', 465, -92); c.fillText('UP!', 465, -82); star4(c, 465, -104, 6, '#ffd84d'); }
  });
  // ----- dinding kanan: Ruang Kepala Divisi (gx 16..21) -----
  onWallR(ctx, 0, 0, c => {
    banner(c, 16.4 * 32, -128, 170, 'RUANG KEPALA DIVISI', '#7a5a1f');
    windowW(c, 17.0 * 32, -112, 56, 52, hour, t);
    rr(c, 19.4 * 32, -110, 44, 54, 3); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#7a5a1f'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#2c8a5c'; c.font = font(900, 8); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('VISI', 19.4 * 32 + 22, -98); c.fillText('2030', 19.4 * 32 + 22, -88); star4(c, 19.4 * 32 + 22, -72, 8, '#ffd84d');
    rr(c, 20.5 * 32, -104, 30, 40, 3); c.fillStyle = '#eaf6ee'; c.fill(); c.strokeStyle = '#7a5a1f'; c.lineWidth = 2.4; c.stroke(); c.fillStyle = '#1f6a45'; c.font = font(900, 6.5); c.fillText('SERTIFIKAT', 20.5 * 32 + 15, -90); c.fillRect(20.5 * 32 + 6, -84, 18, 2); c.fillRect(20.5 * 32 + 6, -78, 18, 2); c.fillStyle = '#ffd84d'; c.beginPath(); c.arc(20.5 * 32 + 15, -70, 4, 0, TAU); c.fill();
  });
  // ----- dinding kiri (gx=0): u = (15 - gy) * 32 -----
  const U = gy => (H - gy) * 32;
  onWallL(ctx, H, 0, c => {
    windowW(c, U(2.6), -112, 52, 50, hour, t);
    const ck = U(4.2) + 20; c.fillStyle = '#fff'; c.strokeStyle = '#2c8a5c'; c.lineWidth = 3; c.beginPath(); c.arc(ck, -92, 14, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = '#1f3a2e'; c.lineCap = 'round'; c.lineWidth = 2; const hh = (hour % 12) / 12 * TAU - Math.PI / 2, mm = (hour % 1) * TAU - Math.PI / 2;
    c.beginPath(); c.moveTo(ck, -92); c.lineTo(ck + Math.cos(hh) * 7, -92 + Math.sin(hh) * 7); c.stroke(); c.lineWidth = 1.4; c.beginPath(); c.moveTo(ck, -92); c.lineTo(ck + Math.cos(mm) * 10, -92 + Math.sin(mm) * 10); c.stroke();
    if (s.decor.neon) { c.save(); c.shadowColor = '#7dffd0'; c.shadowBlur = 12 + Math.sin(t * 4) * 3; star4(c, U(4.6), -76, 13, '#7dffd0'); c.restore(); }
    // ruang Pengendalian (gy 5.5..10): papan, jendela
    banner(c, U(9.9), -126, 124, 'PENGENDALIAN SISTEM', '#2a7f8e');
    c.textAlign = 'center'; c.font = font(600, 7.5); c.fillStyle = '#2a7f8e'; c.fillText('Governance, Risk & Compliance', U(9.9) + 62, -102);
    windowW(c, U(8.8), -92, 46, 44, hour, t);
    // papan statistik kontrol
    rr(c, U(7.1), -96, 56, 36, 4); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#2a7f8e'; c.lineWidth = 2; c.stroke();
    c.strokeStyle = '#2a7f8e'; c.lineWidth = 2; c.beginPath(); c.moveTo(U(7.1) + 8, -68); c.lineTo(U(7.1) + 20, -80); c.lineTo(U(7.1) + 32, -74); c.lineTo(U(7.1) + 46, -88); c.stroke();
    // ruang Operasional (gy 10.4..15)
    banner(c, U(14.8), -126, 150, 'OPERASIONAL & INFRASTRUKTUR', '#8a8a2a');
    c.fillStyle = '#6d6d1f'; c.font = font(600, 7.5); c.fillText('Operations & Infrastructure', U(14.8) + 75, -102);
    windowW(c, U(13.3), -92, 46, 44, hour, t);
    const danger = s.risk > 70; rr(c, U(11.7), -92, 76, 20, 6); c.fillStyle = '#10231d'; c.fill(); c.strokeStyle = danger ? '#ff5a6e' : '#7fffd4'; c.lineWidth = 2; c.stroke();
    c.fillStyle = danger ? '#ff8a9a' : '#7fffd4'; c.font = font(800, 8.5); c.textBaseline = 'middle'; c.fillText(danger ? '⚠ WASPADA ⚠' : 'SEMUA AMAN ✔', U(11.7) + 38, -81.5);
  });
}

// ---------- PROPS (disortir bersama karakter) ----------
function plantAt(ctx, gx, gy, sc = 1) {
  const [x, y] = P(gx, gy); ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.fillStyle = 'rgba(0,40,20,0.2)'; ell(ctx, 0, 2, 14, 6); ctx.fill();
  poly(ctx, [[-9, -16], [9, -16], [6, 0], [-6, 0]], '#e9efe9', '#9fb2a5', 1.2);
  ctx.fillStyle = '#3d9a5b'; for (const [dx, dy, r] of [[-9, -26, -0.7], [9, -27, 0.7], [0, -34, 0], [-4, -22, -0.3], [5, -23, 0.3]]) { ctx.save(); ctx.translate(dx, dy); ctx.rotate(r); ell(ctx, 0, 0, 6, 12); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = '#6fcf8a'; ctx.beginPath(); ctx.ellipse(0, -30, 4, 8, 0.2, 0, TAU); ctx.fill();
  ctx.restore();
}
// sekat kaca per segmen (agar urutan kedalamannya benar). Sumbu 'x': sepanjang gx pada gy tetap; 'y': sepanjang gy pada gx tetap
function glassSeg(ctx, axis, fixed, a0, a1, h = 50) {
  const A = axis === 'x' ? (u, z) => P(u, fixed, z) : (u, z) => P(fixed, u, z);
  poly(ctx, [A(a0, h), A(a1, h), A(a1, 0), A(a0, 0)], 'rgba(205,245,228,0.28)', null);
  ctx.strokeStyle = 'rgba(70,150,115,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...A(a0, h)); ctx.lineTo(...A(a1, h)); ctx.stroke();
  ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(...A(a0, h)); ctx.lineTo(...A(a0, 0)); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; poly(ctx, [A(a0 + (a1 - a0) * 0.15, h - 4), A(a0 + (a1 - a0) * 0.45, h - 4), A(a0 + (a1 - a0) * 0.3, 8), A(a0, 8)].slice(0, 4), 'rgba(255,255,255,0.18)', null);
}
function partition(push, axis, fixed, a0, a1, gaps = []) {
  for (let u = a0; u < a1 - 0.01; u += 1) {
    const e = Math.min(u + 1, a1);
    if (gaps.some(([g0, g1]) => (u + e) / 2 > g0 && (u + e) / 2 < g1)) continue;
    push((axis === 'x' ? (u + e) / 2 + fixed : fixed + (u + e) / 2) - 0.7, ctx => glassSeg(ctx, axis, fixed, u, e));
  }
}
// papan nama ruangan yang berdiri di atas sekat belakang
function roomSign(ctx, gx0, gy, w, name, sub, color) {
  const [x, y] = P(gx0, gy, 50); ctx.save(); ctx.translate(x, y); ctx.transform(1, 0.5, 0, 1, 0, 0);
  const wpx = w * 32; rr(ctx, 0, -30, wpx, 28, 6); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = font(900, 11.5); ctx.fillText(name, wpx / 2, -19); ctx.font = font(600, 7.5); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(sub, wpx / 2, -8); ctx.restore();
}
function rack(ctx, gx, gy, t, danger, i) {
  box(ctx, gx, gy, 0.95, 0.86, 80, '#3c4858', 0, { top: '#56637a' });
  for (let r = 0; r < 6; r++) {
    const z0 = 8 + r * 11, a = P(gx + 0.1, gy + 0.86, z0 + 8), b = P(gx + 0.85, gy + 0.86, z0 + 8), c0 = P(gx + 0.1, gy + 0.86, z0), d0 = P(gx + 0.85, gy + 0.86, z0);
    poly(ctx, [a, b, d0, c0], '#222d3a', null);
    const on = Math.sin(t * 3 + i * 2 + r * 1.7) > -0.2;
    ctx.fillStyle = danger ? (Math.sin(t * 8 + r) > 0 ? '#ff5a6e' : '#7a2a3a') : (on ? ['#7fffd4', '#7ad7ff', '#ffe27a'][(i + r) % 3] : '#2d6a5a');
    for (let k = 0; k < 2; k++) { const p = P(gx + 0.22 + k * 0.14, gy + 0.86, z0 + 4); ctx.beginPath(); ctx.arc(p[0], p[1], 1.8, 0, TAU); ctx.fill(); }
  }
}
function deskDraw(ctx, g, i, t) {
  const { x: gx, y: gy } = deskXY(i), emp = g.emps.find(e => e.desk === i), working = emp && emp.st === 'work' && emp.wslot < 0, col3 = emp ? SPECS[emp.spec].color : '#a8c4b4';
  box(ctx, gx, gy, 1.7, 0.9, 24, '#d9ad78', 0, { top: '#e8c597' });
  const a = P(gx + 0.4, gy + 0.9, 4), b = P(gx + 1.3, gy + 0.9, 4), c2 = P(gx + 1.3, gy + 0.9, 18), d2 = P(gx + 0.4, gy + 0.9, 18); poly(ctx, [a, b, c2, d2], null, 'rgba(90,50,10,0.35)', 1);
  ctx.save(); if (working) { ctx.shadowColor = col3; ctx.shadowBlur = 12 + Math.sin(t * 6 + i) * 4; }
  box(ctx, gx + 0.52, gy + 0.3, 0.66, 0.07, 22, '#f2f6f3', 24, { top: '#ffffff', line: working ? col3 : 'rgba(0,40,20,0.3)' }); ctx.restore();
  const st = P(gx + 0.85, gy + 0.37, 36); ctx.fillStyle = col3; ell(ctx, st[0], st[1], 5, 4.4); ctx.fill();
  ctx.beginPath(); ctx.moveTo(st[0] - 5, st[1] - 2); ctx.lineTo(st[0] - 4, st[1] - 8); ctx.lineTo(st[0] - 1, st[1] - 4); ctx.moveTo(st[0] + 5, st[1] - 2); ctx.lineTo(st[0] + 4, st[1] - 8); ctx.lineTo(st[0] + 1, st[1] - 4); ctx.fill();
  box(ctx, gx + 1.35, gy + 0.3, 0.16, 0.16, 8, '#ffffff', 24);
  const pl = P(gx + 0.25, gy + 0.45, 24); ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(['🧸', '🐰', '🐱', '🍀', '🌿', '🐧', '🍵', '🦊', '🐼'][(i * 5 + 1) % 9], pl[0], pl[1]);
  if (emp) { const nm = P(gx + 0.85, gy + 0.9, 8); rr(ctx, nm[0] - 24, nm[1] - 6, 48, 11, 5); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = col3; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#1f3a2e'; ctx.font = font(800, 7.5); ctx.textBaseline = 'middle'; ctx.fillText(emp.name.split(' ')[0], nm[0], nm[1] - 0.3); }
}

export function collectProps(g, t, hour, using, push) {
  const s = g.s, danger = s.risk > 70;
  // --- sekat kaca & papan nama ruangan ---
  const RC = roomRects(g);
  partition(push, 'x', 5.5, 0.3, RC.ctrl[2]); partition(push, 'x', 5.5, 7.0, RC.dev[2]);
  partition(push, 'y', 7.0, 5.5, 10.0, [[6.0, 6.9]]);
  partition(push, 'x', 10.4, 0.3, RC.ops[2]); partition(push, 'x', 10.4, 7.0, 11.0);
  partition(push, 'y', 7.0, 10.4, 15, [[11.2, 13.2]]);
  push(7.0 + 5.5 + 1, ctx => roomSign(ctx, 7.3, 5.5, Math.min(5.8, RC.dev[2] - 7.4), 'PENGEMBANGAN SISTEM', 'System Development', 'rgba(30,125,80,0.92)'));
  push(7.0 + 10.4 + 1, ctx => roomSign(ctx, 7.3, 10.4, 3.5, 'RUANG SERVER', 'Data Center', 'rgba(55,70,90,0.92)'));

  // --- Ruang Kepala Divisi ---
  partition(push, 'y', 16.0, 0.3, 10.0, [[4.2, 5.8]]);
  push(18.6 + 2.3, ctx => { // kursi eksekutif
    const [x, y] = P(18.7, 2.7, 0); ctx.fillStyle = 'rgba(0,40,20,0.2)'; ell(ctx, x, y + 2, 17, 7); ctx.fill();
    box(ctx, 18.35, 2.3, 0.7, 0.16, 60, '#25332f', 8); ell(ctx, x, y - 10, 15, 7); ctx.fillStyle = '#34463f'; ctx.fill(); ctx.strokeStyle = 'rgba(0,40,20,0.4)'; ctx.lineWidth = 1; ctx.stroke();
  });
  push(17.4 + 3.2 + 1.8, ctx => { // meja eksekutif
    box(ctx, 17.4, 3.2, 2.6, 1.0, 26, '#7a4f2a', 0, { top: '#9a6a3c' });
    for (const gx of [17.7, 19.4]) { const a = P(gx, 4.2, 4), b = P(gx + 0.7, 4.2, 4), c2 = P(gx + 0.7, 4.2, 20), d2 = P(gx, 4.2, 20); poly(ctx, [a, b, c2, d2], null, 'rgba(255,230,180,0.5)', 1); }
    box(ctx, 18.4, 3.5, 0.66, 0.07, 22, '#f2f6f3', 26, { top: '#fff' });
    const st = P(18.73, 3.57, 38); ctx.fillStyle = '#2f6fd0'; ell(ctx, st[0], st[1], 5, 4.4); ctx.fill();
    box(ctx, 17.6, 3.55, 0.5, 0.35, 4, '#fff', 26); box(ctx, 19.4, 3.6, 0.2, 0.2, 8, '#fff', 26);
    const nm = P(18.7, 4.2, 12); rr(ctx, nm[0] - 38, nm[1] - 6, 76, 12, 5); ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.strokeStyle = '#a07a10'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#5a4300'; ctx.font = font(900, 7.5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(('KEPALA DIVISI').slice(0, 14), nm[0], nm[1] + 0.2);
  });
  push(-2, ctx => { // rak buku & trofi di dinding belakang
    box(ctx, 16.4, 0.15, 2.4, 0.55, 88, '#6b4a2a', 0, { top: '#8a6338' });
    const cols = ['#e05a4f', '#4fb3ff', '#ffd84d', '#3fbf7f', '#8f8cf2', '#f2a640'];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) { const gx = 16.5 + i * 0.25, z0 = 8 + r * 24, a = P(gx, 0.7, z0 + 18 - (i % 3) * 2), b = P(gx + 0.19, 0.7, z0 + 18 - (i % 3) * 2), c2 = P(gx + 0.19, 0.7, z0), d2 = P(gx, 0.7, z0); poly(ctx, [a, b, c2, d2], cols[(i + r * 2) % 6], 'rgba(0,0,0,0.25)', 0.6); }
    const stars = g.stars(); ctx.font = '12px serif'; ctx.textAlign = 'center'; for (let i = 0; i < stars; i++) { const p = P(16.7 + i * 0.45, 0.4, 91); ctx.fillText('🏆', p[0], p[1]); }
    box(ctx, 19.2, 0.15, 1.6, 0.55, 54, '#6b4a2a', 0, { top: '#8a6338' });
    const gl = P(19.6, 0.45, 62); ctx.fillStyle = '#4fb3ff'; ctx.beginPath(); ctx.arc(gl[0], gl[1], 9, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2f6fd0'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#3fbf7f'; ctx.beginPath(); ctx.arc(gl[0] - 2, gl[1] - 1, 3.5, 0, TAU); ctx.fill();
  });
  push(16.4 + 6.4 + 2.4, ctx => { // sofa tamu
    box(ctx, 16.2, 6.4, 0.3, 2.4, 46, '#2d6a4f', 0, { top: '#3a8a66' }); box(ctx, 16.5, 6.4, 0.8, 2.4, 18, '#3a8a66', 0, { top: '#4fa57e' });
    ctx.strokeStyle = 'rgba(0,50,30,0.35)'; ctx.lineWidth = 1.2; for (const gy of [7.2, 8.0]) { const a = P(16.5, gy, 18), b = P(17.3, gy, 18); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  });
  push(17.8 + 7.0 + 0.6, ctx => box(ctx, 17.8, 6.9, 0.9, 0.9, 12, '#d7b98a', 0, { top: '#e8cfa6' }));
  [[18.2, 5.0], [19.8, 5.0]].forEach(([gx, gy]) => push(gx + gy + 0.4, ctx => { box(ctx, gx, gy, 0.6, 0.6, 14, '#4a5a52', 0, { top: '#5c7068' }); box(ctx, gx, gy + 0.5, 0.6, 0.1, 40, '#4a5a52', 0); }));
  [[20.6, 1.2], [16.6, 9.5], [20.6, 9.4]].forEach(([gx, gy]) => push(gx + gy, ctx => plantAt(ctx, gx, gy, 1.2)));
  // --- meja kerja tiga departemen ---
  for (let i = 0; i < 9; i++) {
    const { x: gx, y: gy } = deskXY(i), col = i % 3, dept = DEPT_KEYS[Math.floor(i / 3)];
    if (!g.deskOwned(i)) {
      if (col !== s.deskCount[dept]) continue;
      push(gx + gy + 1.2, ctx => {
        ctx.save(); ctx.setLineDash([6, 5]); poly(ctx, [P(gx, gy), P(gx + 1.7, gy), P(gx + 1.7, gy + 0.9), P(gx, gy + 0.9)], 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.9)', 2.2); ctx.restore();
        const [x, y] = P(gx + 0.85, gy + 0.45); ctx.fillStyle = '#fff'; ctx.font = font(900, 24); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+', x, y - 2);
        ctx.font = font(800, 9); ctx.fillText('🪑 Meja', x, y + 14);
      });
      continue;
    }
    const ex = gx + 0.85, ey = gy - 0.5;
    push(ex + ey - 0.2, ctx => {
      const [x, y] = P(ex, ey, 0);
      ctx.fillStyle = 'rgba(0,40,20,0.18)'; ell(ctx, x, y + 2, 16, 7); ctx.fill();
      ctx.strokeStyle = '#3c4858'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 9); ctx.stroke();
      const c3 = [DEPTS.ctrl.color, DEPTS.dev.color, DEPTS.ops.color][Math.floor(i / 3)];
      box(ctx, ex - 0.34, ey - 0.42, 0.68, 0.14, 40, c3, 8);
      ell(ctx, x, y - 10, 15, 7); ctx.fillStyle = shade(c3, 0.12); ctx.fill(); ctx.strokeStyle = 'rgba(0,40,20,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    });
    push(gx + gy + 1.35, ctx => deskDraw(ctx, g, i, t));
  }
  // meja rapat bundar di ruang Pengembangan
  push(8.9 + 9.0 + 0.3, ctx => { const [x, y] = P(8.9, 9.0); ctx.fillStyle = 'rgba(0,40,20,0.2)'; ell(ctx, x, y + 2, 50, 22); ctx.fill(); ctx.strokeStyle = '#a8b8b0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 14); ctx.stroke(); ell(ctx, x, y - 16, 44, 21); ctx.fillStyle = '#d9ad78'; ctx.fill(); ctx.strokeStyle = '#b88a55'; ctx.lineWidth = 2; ctx.stroke(); ell(ctx, x, y - 18, 36, 16); ctx.fillStyle = '#e8c597'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 10, y - 26, 14, 8); ctx.fillStyle = '#3fa56f'; ctx.fillRect(x + 8, y - 26, 8, 6); });

  // --- ruang server ---
  [0, 1, 2].forEach(i => push(7.3 + i * 1.05 + 10.55, ctx => rack(ctx, 7.3 + i * 1.05, 10.55, t, danger, i)));
  if (s.fac.server >= 2) push(10.5 + 11.0, ctx => { box(ctx, 10.5, 10.55, 0.45, 0.45, 34, '#f1f5f2', 0, { top: '#ffffff' }); const [x, y] = P(10.72, 10.9, 34); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#9fb2a5'; ctx.lineWidth = 1.2; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sd * 3, y); ctx.lineTo(x + sd * 6, y - 7); ctx.lineTo(x + sd * 9, y); ctx.fill(); ctx.stroke(); } ctx.font = font(900, 9); ctx.textAlign = 'center'; ctx.fillStyle = '#e0a000'; ctx.fillText('⚡', x, y + 10); });
  if (s.fac.server >= 3) push(8.5 + 14.6, ctx => { box(ctx, 7.3, 14.3, 1.8, 0.5, 18, '#e8f6ff', 0, { top: '#ffffff' }); const [x, y] = P(8.2, 14.55, 18); ctx.fillStyle = '#4a93e0'; ctx.font = font(900, 9); ctx.textAlign = 'center'; ctx.fillText('❄ AC', x, y - 2); });
  for (let i = 0; i < g.capacity('server'); i++) {
    const st = SERVER_ST[i];
    push(st.x + 12.4 + 0.6, ctx => {
      box(ctx, st.x - 0.55, 12.0, 1.1, 0.8, 24, '#4b6360', 0, { top: '#5c7a76' });
      const busy = using.server && g.slots.server[i];
      ctx.save(); if (busy) { ctx.shadowColor = '#7fffd4'; ctx.shadowBlur = 10; }
      box(ctx, st.x - 0.3, 12.15, 0.6, 0.07, 22, '#1d2a27', 24, { top: '#2b3a36', line: busy ? '#7fffd4' : '#5c7a76' }); ctx.restore();
      ctx.strokeStyle = busy ? '#7fffd4' : '#3d5f58'; ctx.lineWidth = 1.5; for (let r = 0; r < 3; r++) { const p1 = P(st.x - 0.2, 12.22, 30 + r * 4), p2 = P(st.x - 0.2 + 0.1 + ((t * 0.5 + r * 0.13 + i * 0.07) % 0.3), 12.22, 30 + r * 4); ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.stroke(); }
    });
  }
  // --- pantry ---
  push(-1, ctx => {   // counter menempel di dinding belakang → selalu di belakang karakter
    box(ctx, 0.8, 0.14, 4.6, 0.92, 36, '#f1ebd9', 0, { top: '#9bd8b3', right: '#cfc8b0' });
    for (let k = 0; k < 5; k++) { const a = P(0.95 + k * 0.9, 1.06, 5), b = P(1.65 + k * 0.9, 1.06, 5), c2 = P(1.65 + k * 0.9, 1.06, 28), d2 = P(0.95 + k * 0.9, 1.06, 28); poly(ctx, [a, b, c2, d2], null, 'rgba(90,70,30,0.35)', 1); const kn = P(1.3 + k * 0.9, 1.06, 24); ctx.fillStyle = '#3fa56f'; ctx.beginPath(); ctx.arc(kn[0], kn[1], 2, 0, TAU); ctx.fill(); }
    [[4.0, '#8fd3ab'], [4.35, '#ffe9a8'], [4.7, '#cfe6ff']].forEach(([gx2, c2]) => box(ctx, gx2, 0.45, 0.2, 0.2, 9, c2, 36));
  });
  push(0.2 + 1.5, ctx => box(ctx, 0.2, 1.5, 0.9, 0.9, 78, '#e3ece8', 0, { top: '#f6fbf8' }));
  push(0.2, ctx => { box(ctx, 5.5, 0.25, 0.55, 0.55, 56, '#bfe6f2', 0, { top: '#e1f5fb' }); const [x, y] = P(5.78, 0.8, 38); ctx.fillStyle = '#4a93e0'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, TAU); ctx.fill(); });
  const cl = s.fac.coffee;
  push(-0.5, ctx => {   // mesin kopi di atas counter
    const z = 36;
    if (cl === 0) { ctx.save(); ctx.setLineDash([5, 4]); poly(ctx, [P(1.5, 0.3, z), P(2.4, 0.3, z), P(2.4, 0.9, z), P(1.5, 0.9, z)], 'rgba(255,255,255,0.3)', 'rgba(60,110,80,0.8)', 2); ctx.restore(); const [x, y] = P(1.95, 0.6, z + 18); ctx.fillStyle = 'rgba(40,90,60,0.7)'; ctx.font = font(900, 26); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', x, y); }
    else if (cl === 1) { box(ctx, 1.5, 0.3, 0.8, 0.5, 8, '#59636b', z); const [x, y] = P(1.9, 0.6, z + 22); ctx.fillStyle = '#3fa56f'; ell(ctx, x, y, 14, 15); ctx.fill(); ctx.strokeStyle = '#2c7a52'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 10, y - 2); ctx.quadraticCurveTo(x + 22, y - 8, x + 20, y - 16); ctx.lineWidth = 5; ctx.strokeStyle = '#3fa56f'; ctx.stroke(); ctx.fillStyle = '#ffd84d'; ctx.beginPath(); ctx.arc(x, y - 15, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#1f3a2e'; ctx.beginPath(); ctx.arc(x - 5, y, 1.6, 0, TAU); ctx.arc(x + 4, y, 1.6, 0, TAU); ctx.fill(); }
    else if (cl === 2) { box(ctx, 1.4, 0.26, 1.0, 0.64, 46, '#f4f6f5', z, { top: '#3fa56f' }); const a = P(1.55, 0.9, z + 24), b = P(2.25, 0.9, z + 24), c2 = P(2.25, 0.9, z + 8), d2 = P(1.55, 0.9, z + 8); poly(ctx, [a, b, c2, d2], '#2b3a36', null); [['#7fe0a3', 1.7], ['#ffe27a', 1.9], ['#8fd3ff', 2.1]].forEach(([cc, gx2]) => { const p = P(gx2, 0.9, z + 36); ctx.fillStyle = cc; ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, TAU); ctx.fill(); }); const cup = P(1.9, 0.78, z + 8); rr(ctx, cup[0] - 5, cup[1] - 8, 10, 9, 2.5); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 1.2; ctx.stroke(); }
    else {
      box(ctx, 1.2, 0.22, 1.4, 0.72, 34, '#dff3e6', z, { top: '#bfe6cd' });
      box(ctx, 1.45, 0.3, 0.9, 0.58, 28, '#f6fbf8', z + 34, { top: '#ffffff' });
      const a = P(1.58, 0.88, z + 60), b = P(2.22, 0.88, z + 60), c2 = P(2.22, 0.88, z + 38), d2 = P(1.58, 0.88, z + 38); poly(ctx, [a, b, c2, d2], '#10231d', '#3fa56f', 1.5);
      const e1 = P(1.78, 0.88, z + 52), e2 = P(2.02, 0.88, z + 52); ctx.strokeStyle = '#7fffd4'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; for (const p of [e1, e2]) { ctx.beginPath(); ctx.arc(p[0], p[1], 3.2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } const mo = P(1.9, 0.88, z + 44); ctx.beginPath(); ctx.arc(mo[0], mo[1] - 1, 2.4, 0.2, Math.PI - 0.2); ctx.stroke();
      for (const sd of [0, 1]) { const q = P(sd ? 2.2 : 1.55, 0.4, z + 62); poly(ctx, [[q[0] - 5, q[1] + 2], [q[0] + (sd ? 3 : -3), q[1] - 9], [q[0] + 5, q[1] + 2]], '#3fa56f', null); }
      const an = P(1.9, 0.6, z + 62); ctx.strokeStyle = '#3fa56f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(an[0], an[1]); ctx.lineTo(an[0], an[1] - 10); ctx.stroke(); ctx.fillStyle = Math.sin(t * 5) > 0 ? '#ffd84d' : '#fff'; ctx.beginPath(); ctx.arc(an[0], an[1] - 11, 3, 0, TAU); ctx.fill();
      const arm = Math.sin(t * 2) * 3, h = P(2.75, 0.55, z + 12 + arm); ctx.strokeStyle = '#8fd3ab'; ctx.lineWidth = 5; ctx.beginPath(); const sh = P(2.6, 0.55, z + 18); ctx.moveTo(sh[0], sh[1]); ctx.lineTo(h[0], h[1]); ctx.stroke(); rr(ctx, h[0] - 5, h[1] - 8, 10, 9, 2.5); ctx.fillStyle = '#fff'; ctx.fill();
    }
    if (cl > 0 && using.coffee) { const sp = P(1.95, 0.6, z + (cl === 1 ? 40 : 58)); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let k = 0; k < 3; k++) { const o = (t * 1.2 + k * 0.33) % 1; ctx.globalAlpha = 1 - o; ctx.beginPath(); ctx.moveTo(sp[0] - 6 + k * 6, sp[1] - o * 22); ctx.quadraticCurveTo(sp[0] - 10 + k * 6 + Math.sin(t * 3 + k) * 4, sp[1] - o * 22 - 8, sp[0] - 6 + k * 6, sp[1] - o * 22 - 16); ctx.stroke(); } ctx.globalAlpha = 1; }
  });
  // --- lounge (sofa x 9.4..14.2) ---
  push(-6, ctx => { box(ctx, 9.4, 0.14, 4.8, 0.46, 52, '#3fa56f', 0, { top: '#58bb85' }); box(ctx, 9.26, 0.14, 0.2, 1.4, 36, '#3fa56f', 0, { top: '#58bb85' }); });
  push(-5, ctx => { box(ctx, 9.6, 0.6, 4.4, 0.86, 16, '#58bb85', 0, { top: '#74cf9d' }); ctx.strokeStyle = 'rgba(0,70,40,0.35)'; ctx.lineWidth = 1.2; for (const gx2 of [10.5, 11.4, 12.3, 13.2]) { const a = P(gx2, 0.6, 16), b = P(gx2, 1.46, 16); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); } });
  push(14.2 + 1.4 + 0.3, ctx => box(ctx, 14.2, 0.14, 0.24, 1.4, 36, '#3fa56f', 0, { top: '#58bb85' }));
  push(-3, ctx => {
    box(ctx, 7.7, 0.25, 1.0, 0.7, 22, '#e9efe9', 0, { top: '#ffffff' });
    if (s.fac.ps) { box(ctx, 7.95, 0.4, 0.5, 0.36, 7, '#ffffff', 22, { top: '#fafffb', line: '#5ab8f5' }); const l = P(8.05, 0.76, 26); ctx.fillStyle = Math.sin(t * 3) > -0.4 ? '#5ab8f5' : '#cfeaff'; ctx.beginPath(); ctx.arc(l[0], l[1], 2, 0, TAU); ctx.fill(); }
  });
  push(11.2 + 2.5 + 0.9, ctx => box(ctx, 11.2, 2.5, 1.4, 0.7, 14, '#d7b98a', 0, { top: '#e8cfa6' }));
  if (s.decor.beanbag) push(8.6 + 2.8 + 0.3, ctx => { const [x, y] = P(8.7, 2.9); ctx.fillStyle = 'rgba(0,40,20,0.18)'; ell(ctx, x, y + 2, 22, 9); ctx.fill(); ell(ctx, x, y - 12, 20, 16); ctx.fillStyle = '#5ab8f5'; ctx.fill(); ctx.strokeStyle = '#3d8bd6'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 5, y - 16, 2, 0, TAU); ctx.arc(x + 5, y - 16, 2, 0, TAU); ctx.fill(); });
  if (s.decor.aquarium) push(15.2 + 0.6, ctx => { box(ctx, 14.9, 0.2, 0.9, 0.6, 38, '#d9e6e0', 0); const a = P(14.95, 0.8, 70), b = P(15.75, 0.8, 70), c2 = P(15.75, 0.8, 40), d2 = P(14.95, 0.8, 40); poly(ctx, [a, b, c2, d2], 'rgba(130,210,245,0.85)', '#fff', 2); for (let k = 0; k < 2; k++) { const gx2 = 15.05 + ((Math.sin(t * (0.8 + k * 0.3) + k * 2) + 1) / 2) * 0.6, p = P(gx2, 0.8, 52 + k * 9); ctx.fillStyle = k ? '#ffb86b' : '#ff7a59'; ell(ctx, p[0], p[1], 5, 3); ctx.fill(); } });
  lotMarkers(g, t, push);
  // --- tanaman ---
  // taman luar di sebelah ruang kepala divisi
  [[17.5, 12.5], [19.6, 11.5], [20.5, 14.0], [18.0, 14.3]].forEach(([gx, gy]) => push(gx + gy, ctx => { const [x, y] = P(gx, gy); ctx.fillStyle = 'rgba(0,50,20,0.2)'; ell(ctx, x, y + 2, 22, 8); ctx.fill(); ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - 3, y - 26, 6, 26); ctx.fillStyle = '#2f9a5a'; ell(ctx, x, y - 36, 22, 20); ctx.fill(); ctx.fillStyle = '#3fbf7f'; ell(ctx, x - 6, y - 40, 12, 11); ctx.fill(); }));
  [[0.55, 4.5], [6.4, 4.6], [15.4, 4.5], [6.5, 14.6], [15.4, 14.7]].forEach(([gx, gy]) => push(gx + gy, ctx => plantAt(ctx, gx, gy, 1)));
  if (s.decor.plant) [[6.25, 1.0], [0.6, 9.5], [15.3, 9.4], [11.1, 14.7]].forEach(([gx, gy]) => push(gx + gy, ctx => plantAt(ctx, gx, gy, 1.3)));
  // --- taman bermain ---
  if (s.fac.play >= 2) push(11.4 + 14.0 + 1.0, ctx => {
    box(ctx, 11.4, 14.0, 0.8, 0.8, 46, '#ffd84d', 0, { top: '#ffe98a' });
    const a = P(12.2, 14.15, 46), b = P(12.2, 14.65, 46), c2 = P(14.2, 14.65, 2), d2 = P(14.2, 14.15, 2); poly(ctx, [a, b, c2, d2], '#5ab8f5', '#fff', 2);
    ctx.strokeStyle = '#3d8bd6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...P(12.2, 14.15, 46)); ctx.lineTo(...P(14.2, 14.15, 2)); ctx.stroke();
  });
  if (s.fac.play >= 3) push(14.6 + 14.4, ctx => {
    box(ctx, 14.3, 13.6, 1.4, 1.2, 40, '#f5efd2', 0, { top: '#fff9de' });
    box(ctx, 14.1, 13.4, 0.5, 0.5, 66, '#a8e0be', 0, { top: '#3fa56f' }); box(ctx, 15.5, 13.4, 0.5, 0.5, 66, '#a8e0be', 0, { top: '#3fa56f' });
    const f = P(14.35, 13.65, 74); ctx.strokeStyle = '#4a3350'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(f[0], f[1]); ctx.lineTo(f[0], f[1] - 14); ctx.stroke(); poly(ctx, [[f[0], f[1] - 14], [f[0] + 11, f[1] - 10], [f[0], f[1] - 6]], '#ff7a59', null);
  });
  if (s.fac.play >= 1) push(12 + 10.5, ctx => onPlaneY(ctx, 12.0, 10.5, 0, c => { ['#ff7a59', '#ffb340', '#ffe27a', '#6fcf8a', '#5ab8f5', '#8f8cf2'].forEach((cc, i) => { c.strokeStyle = cc; c.lineWidth = 5; c.beginPath(); c.arc(48, 0, 46 - i * 5, Math.PI, 0); c.stroke(); }); }));
}

export function ballsFront(ctx, sx, sy, t) {
  for (let i = 0; i < 4; i++) { const [x, y] = P(sx + (i - 1.5) * 0.28, sy + 0.45, 5 + Math.sin(t * 5 + i) * 1.5); ctx.fillStyle = ['#ff7a59', '#ffd84d', '#3fbf7f', '#5ab8f5'][i]; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 2.2, 0, TAU); ctx.fill(); }
}

// penanda lahan kosong (patok konstruksi) di sisi ruangan yang bisa diperluas
export function lotMarkers(g, t, push) {
  for (const [d, y] of [['ctrl', 8.4], ['dev', 8.4], ['ops', 13.2]]) {
    if (g.s.deskCount[d] >= 3) continue;
    const x = roomEnd(g, d) + (d === 'dev' ? 0.9 : 0.5);
    push(x + y, ctx => { const [px, py] = P(x, y); ctx.fillStyle = 'rgba(0,50,20,0.18)'; ell(ctx, px, py + 2, 16, 6); ctx.fill(); ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText('🚧', px, py - 2); });
  }
}
export { poly, onWallR, onWallL, onFloor, plantAt };
