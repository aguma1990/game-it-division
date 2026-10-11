// Gambar karakter chibi ala anime Jepang (prosedural, Canvas 2D).
// Koordinat lokal: (0,0) = telapak kaki, karakter menghadap ke depan, tinggi ±68.

import { SPECS } from './data.js';

const TAU = Math.PI * 2;
const INK = '#4a3350';

const rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export function shade(h, a) {
  const [r, g, b] = rgb(h);
  const f = c => Math.round(a < 0 ? c * (1 + a) : c + (255 - c) * a);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

const OUTFIT = {
  dir:  { main: '#1f2f5c', trim: '#d6343c', pants: '#1b2547', shoe: '#1c1c22' },
  ctrl: { main: '#f2f4f8', trim: '#2f6fd0', pants: '#2a3350', shoe: '#1c1c22' },
  dev:  { main: '#26282e', trim: '#4fb3ff', pants: '#2d3340', shoe: '#e8e8ee' },
  ops:  { main: '#27427f', trim: '#ffd35a', pants: '#222a45', shoe: '#1c1c22' },
  sec:  { main: '#232428', trim: '#3fc4b0', pants: '#202226', shoe: '#17171a' },
  dba:  { main: '#f2f4f8', trim: '#2f6fd0', pants: '#2a3350', shoe: '#1c1c22' },
  pm:   { main: '#f6f7fa', trim: '#7a5fd6', pants: '#2a3350', shoe: '#2b2b33' }
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); }
function star4(ctx, x, y, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2, rad = i % 2 ? r * 0.3 : r;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
export const heartPath = (ctx, x, y, s) => {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.7, y - s * 1.2, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
  ctx.closePath();
};

// ---------- GAYA BARU: chibi semi-realistis (garis tegas, shading lembut) ----------
const OL = '#2b1d1a';
function hairCols(look) { const c = look.hair || '#3a2418'; return { c, d: shade(c, -0.4), hi: shade(c, 0.38) }; }
const longStyle = st => st === 'long' || st === 'twin' || st === 'pony' || st === 'bun';

function backHair(ctx, look, t) {
  const { c } = hairCols(look); let st = look.style; if (look.female === false && (longStyle(st) || st === 'bob')) st = 'wavy';
  ctx.fillStyle = c; ctx.strokeStyle = OL; ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
  if (longStyle(st)) {
    ctx.beginPath(); ctx.moveTo(-23, -6); ctx.bezierCurveTo(-31, 8, -28, 26, -21, 40); ctx.quadraticCurveTo(-15, 45, -10, 38);
    ctx.quadraticCurveTo(0, 44, 10, 38); ctx.quadraticCurveTo(15, 45, 21, 40); ctx.bezierCurveTo(28, 26, 31, 8, 23, -6); ctx.bezierCurveTo(20, -27, -20, -27, -23, -6);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = shade(c, 0.3); ctx.globalAlpha = 0.5; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-20, 8); ctx.quadraticCurveTo(-24, 22, -17, 34); ctx.moveTo(20, 8); ctx.quadraticCurveTo(24, 22, 17, 34); ctx.stroke(); ctx.globalAlpha = 1;
  } else if (st === 'bob') {
    ctx.beginPath(); ctx.moveTo(-23, -4); ctx.bezierCurveTo(-30, 8, -27, 20, -19, 22); ctx.quadraticCurveTo(0, 26, 19, 22); ctx.bezierCurveTo(27, 20, 30, 8, 23, -4); ctx.bezierCurveTo(20, -27, -20, -27, -23, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else { ell(ctx, 0, -3, 22.5, 21); ctx.fill(); ctx.stroke(); }
}

function frontHair(ctx, look, t) {
  const { c, d, hi } = hairCols(look); let st = look.style; if (look.female === false && (longStyle(st) || st === 'bob')) st = 'wavy';
  ctx.lineJoin = 'round'; ctx.fillStyle = c; ctx.strokeStyle = OL; ctx.lineWidth = 1.5;
  const female = longStyle(st) || st === 'bob', sweep = st === 'side' ? -1 : 1;
  ctx.save(); if (!female) ctx.scale(sweep, 1);
  ctx.beginPath();
  ctx.moveTo(-21.5, 6);
  ctx.bezierCurveTo(-28, -5, -25, -18, -16, -23);
  ctx.bezierCurveTo(-13, -31, -3, -31, 1, -27.5);
  ctx.bezierCurveTo(5, -34, 15, -32, 18, -24);
  ctx.bezierCurveTo(27, -19, 28, -5, 21.5, 6);
  if (female) { // belah tengah
    ctx.bezierCurveTo(20, -1, 16, -8, 8, -13); ctx.bezierCurveTo(5, -14, 2, -15.5, 0, -16); ctx.bezierCurveTo(-2, -15.5, -5, -14, -8, -13);
    ctx.bezierCurveTo(-16, -8, -20, -1, -21.5, 6);
  } else { // poni menyapu
    ctx.bezierCurveTo(21, -1, 18, -7, 13, -10.5); ctx.bezierCurveTo(8, -5, 2, -8.5, -3, -11.5); ctx.bezierCurveTo(-10, -8, -16, -3, -21.5, 6);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // helai & kilau
  ctx.lineCap = 'round';
  ctx.strokeStyle = hi; ctx.globalAlpha = 0.65; ctx.lineWidth = 1.7;
  ctx.beginPath(); ctx.moveTo(-15, -19); ctx.quadraticCurveTo(-9, -26, -2, -24); ctx.moveTo(5, -27); ctx.quadraticCurveTo(12, -27, 16, -21); ctx.moveTo(-18, -8); ctx.quadraticCurveTo(-17, -14, -13, -17); ctx.stroke();
  ctx.strokeStyle = d; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-6, -22); ctx.quadraticCurveTo(-2, -17, -5, -12); ctx.moveTo(8, -22); ctx.quadraticCurveTo(10, -16, 6, -12); ctx.moveTo(-12, -16); ctx.quadraticCurveTo(-9, -12, -12, -8); ctx.stroke();
  ctx.globalAlpha = 1; ctx.restore();
  if (st === 'messy' || st === 'spiky' || st === 'short') { // jambul acak
    ctx.fillStyle = c; ctx.strokeStyle = OL; ctx.lineWidth = 1.3;
    for (const [x, a, h] of [[-8, -0.5, 9], [0, 0.1, 11], [8, 0.6, 9]]) { ctx.save(); ctx.translate(x, -27); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-5, 3); ctx.quadraticCurveTo(-2, -h, 5, -h + 3); ctx.quadraticCurveTo(3, -2, 5, 3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  }
  // rambut samping menutupi telinga
  ctx.fillStyle = c; ctx.strokeStyle = OL; ctx.lineWidth = 1.2;
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 20.5, -3); ctx.quadraticCurveTo(sd * 24, 6, sd * (female ? 22 : 20), female ? 14 : 8); ctx.quadraticCurveTo(sd * 17, 3, sd * 16, -4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
}

// ---------- WAJAH ----------
function eye(ctx, ex, ey, look, face, blink, sd) {
  const dark = '#1b0f0a';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (face === 'happy') { ctx.strokeStyle = dark; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(ex, ey + 2.4, 4.6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); return; }
  if (face === 'sleep' || blink) { ctx.strokeStyle = dark; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(ex, ey - 2, 4.6, Math.PI * 0.12, Math.PI * 0.88); ctx.stroke(); return; }
  if (face === 'stress') { ctx.strokeStyle = dark; ctx.lineWidth = 2.3; ctx.beginPath(); ctx.moveTo(ex - sd * 4, ey - 3.5); ctx.lineTo(ex + sd * 3.6, ey); ctx.lineTo(ex - sd * 4, ey + 3.5); ctx.stroke(); return; }
  const rx = 5.5, ry = face === 'tired' ? 4.6 : 6.7, cy = face === 'tired' ? ey + 1.2 : ey;
  ell(ctx, ex, cy, rx, ry); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.save(); ell(ctx, ex, cy, rx, ry); ctx.clip();
  const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry); g.addColorStop(0, '#1a0d08'); g.addColorStop(0.45, shade(look.eye || '#5a3320', -0.1)); g.addColorStop(1, shade(look.eye || '#5a3320', 0.5));
  ell(ctx, ex + 0.2, cy + 0.6, 4.5, ry - 0.2); ctx.fillStyle = g; ctx.fill();
  ell(ctx, ex + 0.2, cy + 0.4, 2.3, 3.3); ctx.fillStyle = '#120804'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex - 1.7, cy - 2.4, 2.1, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(ex + 1.9, cy + 2.6, 1.1, 0, TAU); ctx.fill();
  if (face === 'excited') { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(ex + 2.2, cy - 0.8, 0.9, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = dark; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ex, cy, rx + 0.2, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  if (look.female) { ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(ex + sd * (rx + 0.2), cy - 1); ctx.lineTo(ex + sd * (rx + 2.6), cy - 2.8); ctx.stroke(); }
  if (face === 'tired') { ctx.fillStyle = look.skin; ctx.beginPath(); ctx.ellipse(ex, ey - 2, rx + 0.8, 3.2, 0, Math.PI, TAU); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex - rx, ey + 0.4); ctx.lineTo(ex + rx, ey + 0.4); ctx.stroke(); }
}
function brow(ctx, ex, sd, look, face) {
  const by = -6.8, inner = -sd * 5.4, outer = sd * 5.4;
  let iy = 0, oy = 0, up = 0;
  if (face === 'focus') { iy = 1.6; oy = -0.6; } else if (face === 'stress') { iy = -2.2; oy = 1.4; } else if (face === 'tired') { iy = -0.6; oy = 0.8; } else if (face === 'happy' || face === 'excited') { up = -1.6; iy = -0.4; oy = -0.8; }
  ctx.strokeStyle = shade(look.hair || '#3a2418', -0.3); ctx.lineWidth = look.female ? 2.2 : 3.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ex + inner, by + iy + up); ctx.quadraticCurveTo(ex, by - 2 + up + (iy + oy) / 2, ex + outer, by + 0.8 + oy + up); ctx.stroke();
}
function drawFace(ctx, look, face, t, blink) {
  const ey = 4.2;
  for (const sd of [-1, 1]) { eye(ctx, sd * 8.2, ey, look, face, blink, sd); brow(ctx, sd * 8.2, sd, look, face); }
  ctx.fillStyle = look.female ? 'rgba(255,125,105,0.34)' : 'rgba(255,125,105,0.14)'; ell(ctx, -12.8, 10.5, 4.2, 2.5); ctx.fill(); ell(ctx, 12.8, 10.5, 4.2, 2.5); ctx.fill();
  ctx.strokeStyle = 'rgba(150,85,60,0.7)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-1.6, 9.8); ctx.quadraticCurveTo(0, 11.2, 1.6, 9.8); ctx.stroke();
  const mouth = '#7a2a22';
  switch (face) {
    case 'happy': case 'excited':
      ctx.beginPath(); ctx.moveTo(-5.6, 12.4); ctx.quadraticCurveTo(0, 13.4, 5.6, 12.4); ctx.quadraticCurveTo(4.4, 19.2, 0, 19.2); ctx.quadraticCurveTo(-4.4, 19.2, -5.6, 12.4); ctx.closePath();
      ctx.fillStyle = mouth; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.save(); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(-6, 12, 12, 3.4); ctx.fillStyle = '#e8837a'; ell(ctx, 0, 19, 3.6, 2.8); ctx.fill(); ctx.restore(); break;
    case 'sleep': ell(ctx, 0, 14, 1.6, 2); ctx.fillStyle = mouth; ctx.fill(); break;
    case 'stress': ctx.strokeStyle = OL; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(-4, 15); ctx.quadraticCurveTo(-2, 12.6, 0, 14.6); ctx.quadraticCurveTo(2, 12.6, 4, 15); ctx.stroke(); break;
    case 'tired': ctx.strokeStyle = OL; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(-3, 14); ctx.quadraticCurveTo(0, 15, 3, 14); ctx.stroke(); break;
    case 'focus': ctx.strokeStyle = OL; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(-3.4, 14); ctx.lineTo(3.4, 14); ctx.stroke(); break;
    case 'sip': ell(ctx, 0, 14, 2, 1.6); ctx.fillStyle = mouth; ctx.fill(); break;
    default: ctx.strokeStyle = OL; ctx.lineWidth = 1.9; ctx.beginPath(); ctx.moveTo(-5, 12.6); ctx.quadraticCurveTo(0, 17, 5, 12.6); ctx.stroke();
  }
  if (face === 'stress') { const d = (t * 1.2) % 1; ctx.fillStyle = 'rgba(130,200,255,0.95)'; ctx.strokeStyle = '#6fb2e8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(17, -4 + d * 4); ctx.quadraticCurveTo(21, 2 + d * 4, 17, 6 + d * 4); ctx.quadraticCurveTo(13, 2 + d * 4, 17, -4 + d * 4); ctx.fill(); ctx.stroke(); }
}

// ---------- AKSESORI ----------
function accessory(ctx, look, spec, t) {
  ctx.lineCap = 'round';
  if (spec === 'ctrl' || spec === 'dba') { // kacamata
    ctx.strokeStyle = '#25262b'; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(200,230,255,0.2)';
    for (const sd of [-1, 1]) { if (spec === 'ctrl') { ctx.beginPath(); ctx.arc(sd * 8.2, 4.2, 8, 0, TAU); } else { rr(ctx, sd * 8.2 - 8.4, -3, 16.8, 13.4, 4.6); } ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sd * 8.2 - 4, -0.6); ctx.lineTo(sd * 8.2 - 1.6, -2); ctx.stroke(); ctx.strokeStyle = '#25262b'; ctx.lineWidth = 2; }
    ctx.beginPath(); ctx.moveTo(-0.6, 3); ctx.lineTo(0.6, 3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-16.2, 3); ctx.lineTo(-20, 2); ctx.moveTo(16.2, 3); ctx.lineTo(20, 2); ctx.stroke();
  } else if (spec === 'ops') { // headset + mic
    ctx.strokeStyle = '#2a2d36'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.arc(0, -4, 22.5, Math.PI * 1.04, Math.PI * 1.96); ctx.stroke();
    for (const sd of [-1, 1]) { rr(ctx, sd * 21.5 - 3.5, -3, 7, 13, 3.4); ctx.fillStyle = '#323644'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = '#4a4f60'; rr(ctx, sd * 21.5 - 2, -1.4, 4, 10, 2); ctx.fill(); }
    ctx.strokeStyle = '#2a2d36'; ctx.lineWidth = 1.9; ctx.beginPath(); ctx.moveTo(-20.5, 10); ctx.quadraticCurveTo(-18, 20, -7, 17.5); ctx.stroke(); ell(ctx, -6, 17.4, 2.4, 1.9); ctx.fillStyle = '#2a2d36'; ctx.fill();
  }
}

// ---------- BADAN ----------
function drawBody(ctx, look, spec, pose, t) {
  const o = OUTFIT[spec] || OUTFIT.dev, skirt = look.skirt;
  ctx.lineWidth = 1.4; ctx.strokeStyle = OL; ctx.lineJoin = 'round';
  if (spec === 'dev') { // tudung hoodie di belakang leher
    ctx.fillStyle = shade(o.main, 0.06); ctx.beginPath(); ctx.ellipse(0, -35, 12.5, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  }
  rr(ctx, -11.5, -35, 23, 24, 8); ctx.fillStyle = o.main; ctx.fill(); ctx.stroke();
  switch (spec) {
    case 'dir': // jas + dasi merah
      ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.moveTo(-4.4, -35); ctx.lineTo(0, -23); ctx.lineTo(4.4, -35); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shade(o.main, -0.3); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-4.4, -35); ctx.lineTo(-8.5, -22); ctx.lineTo(-1, -17); ctx.moveTo(4.4, -35); ctx.lineTo(8.5, -22); ctx.lineTo(1, -17); ctx.stroke();
      ctx.fillStyle = '#d6343c'; ctx.beginPath(); ctx.moveTo(-1.8, -33); ctx.lineTo(1.8, -33); ctx.lineTo(1.2, -30.5); ctx.lineTo(2.6, -19); ctx.lineTo(0, -16.5); ctx.lineTo(-2.6, -19); ctx.lineTo(-1.2, -30.5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 0.9; ctx.stroke();
      ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.arc(6.5, -26, 1.3, 0, TAU); ctx.fill(); break;
    case 'ctrl': case 'dba': // kemeja putih + dasi biru
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#c9ced8'; ctx.lineWidth = 1; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 1, -35.5); ctx.lineTo(sd * 6.4, -34); ctx.lineTo(sd * 3, -29); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = o.trim; ctx.beginPath(); ctx.moveTo(-1.6, -33); ctx.lineTo(1.6, -33); ctx.lineTo(1, -30.6); ctx.lineTo(2.4, -19); ctx.lineTo(0, -16.5); ctx.lineTo(-2.4, -19); ctx.lineTo(-1, -30.6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 0.9; ctx.stroke();
      ctx.fillStyle = '#2a3350'; ctx.fillRect(-11.5, -14, 23, 3); break;
    case 'dev': // hoodie: tali & kantong & resleting
      ctx.strokeStyle = '#e8e8ee'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-3.4, -33.5); ctx.lineTo(-3.8, -25); ctx.moveTo(3.4, -33.5); ctx.lineTo(3.8, -25); ctx.stroke();
      ctx.strokeStyle = '#4a4e58'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -35); ctx.lineTo(0, -11); ctx.stroke();
      rr(ctx, -7.5, -21, 15, 8, 3.5); ctx.strokeStyle = '#4a4e58'; ctx.stroke();
      ctx.fillStyle = '#4fb3ff'; ctx.font = '700 5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('</>', 6, -27); break;
    case 'ops': // polo biru + tali ID
      ctx.fillStyle = '#e9edf5'; ctx.strokeStyle = '#aab2c4'; ctx.lineWidth = 1; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 1, -35.5); ctx.lineTo(sd * 6, -34.5); ctx.lineTo(sd * 4, -29.5); ctx.lineTo(0, -31); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.strokeStyle = '#ffd35a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-3.6, -33.5); ctx.lineTo(-1.5, -22); ctx.moveTo(3.6, -33.5); ctx.lineTo(1.5, -22); ctx.stroke();
      rr(ctx, -4.4, -22.4, 8.8, 10.4, 1.8); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#4fb3ff'; ctx.fillRect(-3.2, -21, 6.4, 2.6); ctx.fillStyle = '#c9ced8'; ctx.fillRect(-2.6, -16.8, 5.2, 1.2); break;
    case 'sec': // jaket taktis + perisai
      ctx.strokeStyle = '#4a4d55'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -35); ctx.lineTo(0, -11); ctx.stroke();
      ctx.fillStyle = '#34363d'; for (const sd of [-1, 1]) { rr(ctx, sd * 11.5 - 4, -36, 8, 4.4, 1.8); ctx.fill(); }
      ctx.fillStyle = '#3fc4b0'; ctx.strokeStyle = '#1b6e60'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, -28); ctx.lineTo(9, -28); ctx.lineTo(9, -23); ctx.quadraticCurveTo(6.5, -19.5, 4, -23); ctx.closePath(); ctx.fill(); ctx.stroke();
      rr(ctx, -8.5, -24, 5, 3, 1); ctx.fillStyle = '#5a5d66'; ctx.fill(); break;
    case 'pm': // blus putih + tali ID ungu
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#c9ced8'; ctx.lineWidth = 1; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 1, -35.5); ctx.lineTo(sd * 7, -34); ctx.lineTo(sd * 3.4, -27); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.strokeStyle = o.trim; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(-3.6, -33.5); ctx.lineTo(-1.5, -22); ctx.moveTo(3.6, -33.5); ctx.lineTo(1.5, -22); ctx.stroke();
      rr(ctx, -4, -22.4, 8, 9.6, 1.8); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = o.trim; ctx.fillRect(-2.8, -21, 5.6, 2.4); break;
  }
  if (skirt) { // rok
    ctx.fillStyle = o.pants; ctx.strokeStyle = OL; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(-11.5, -14); ctx.lineTo(11.5, -14); ctx.lineTo(16, -3); ctx.quadraticCurveTo(8, -1, 0, -3); ctx.quadraticCurveTo(-8, -1, -16, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}

function leg(ctx, look, spec, x, swing, sit) {
  const o = OUTFIT[spec] || OUTFIT.dev, fx = x + swing * 0.7, fy = -2.5 - Math.abs(swing) * 0.15, hy = look.skirt ? -6 : -13;
  ctx.lineCap = 'round';
  ctx.strokeStyle = OL; ctx.lineWidth = look.skirt ? 6.4 : 8.4; ctx.beginPath(); ctx.moveTo(x, hy); ctx.lineTo(fx, fy - 1); ctx.stroke();
  ctx.strokeStyle = look.skirt ? look.skin : o.pants; ctx.lineWidth = look.skirt ? 4.4 : 6.4; ctx.beginPath(); ctx.moveTo(x, hy); ctx.lineTo(fx, fy - 1); ctx.stroke();
  ell(ctx, fx + 0.8, fy + 0.3, 6.2, 3.8); ctx.fillStyle = o.shoe; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ell(ctx, fx + 0.2, fy - 0.8, 3, 1.1); ctx.fill();
}

function arm(ctx, look, spec, side, ang) {
  const o = OUTFIT[spec] || OUTFIT.dev, L = 13, sx = side * 12, sy = -31;
  const hx = sx + side * Math.sin(ang) * L, hy = sy + Math.cos(ang) * L;
  ctx.lineCap = 'round';
  ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.strokeStyle = shade(o.main, -0.04); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.fillStyle = look.skin; ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(hx, hy + 0.8, 3.7, 0, TAU); ctx.fill(); ctx.stroke();
  return [hx, hy];
}

// properti yang dipegang saat berdiri/berjalan (tablet / laptop)
function heldProp(ctx, spec, look, t) {
  ctx.save(); ctx.translate(-1, -19); ctx.rotate(-0.1);
  if (spec === 'dev' || spec === 'sec' || spec === 'dba') { // laptop terbuka
    rr(ctx, -12, -13, 24, 15, 2); ctx.fillStyle = '#3a4252'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
    rr(ctx, -10, -11, 20, 11, 1.5); ctx.fillStyle = '#1f2733'; ctx.fill();
    ctx.fillStyle = spec === 'dev' ? '#4fb3ff' : spec === 'sec' ? '#3fc4b0' : '#9fb0c8'; ctx.font = '700 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(spec === 'dev' ? '</>' : spec === 'sec' ? '⛨' : '≡', 0, -3.4);
    rr(ctx, -13.5, 2, 27, 3.4, 1.4); ctx.fillStyle = '#b8bec7'; ctx.fill(); ctx.stroke();
  } else { // tablet
    rr(ctx, -9, -13, 18, 14, 2.4); ctx.fillStyle = '#2b2f36'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
    const g = ctx.createLinearGradient(0, -12, 0, 0); g.addColorStop(0, '#5aa0e8'); g.addColorStop(1, '#2d5fa8'); rr(ctx, -7.4, -11.6, 14.8, 11, 1.4); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(3, -8); ctx.moveTo(-5, -5); ctx.lineTo(5, -5); ctx.stroke();
  }
  for (const [hx, hy] of [[-11, 1], [11, -3]]) { ctx.fillStyle = look.skin; ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(hx, hy, 3.5, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}

// ---------- API UTAMA ----------
export function drawChibi(ctx, o) {
  const { x, y, s = 1, look, spec = 'dev', pose = 'stand', t = 0, face = 'smile', dir = 1, held, shadow = true } = o;
  const blink = ((t + (o.phase || 0)) % 3.6) < 0.13;
  ctx.save();
  ctx.translate(x, y); ctx.scale(s * dir, s);
  ctx.lineJoin = 'round';

  let bob = 0, lw = 0, rw = 0, la = 0.18, ra = 0.18, tilt = 0, sit = false, hide = false;
  switch (pose) {
    case 'walk': { const ph = t * 12; bob = -Math.abs(Math.sin(ph)) * 2.4; lw = Math.sin(ph) * 6; rw = -lw; la = Math.sin(ph) * 0.7 + 0.1; ra = -Math.sin(ph) * 0.7 + 0.1; break; }
    case 'sit': case 'type': { bob = Math.sin(t * 2.4) * 0.5; sit = true; const k = pose === 'type' ? Math.sin(t * 13) * 0.14 : 0; la = -0.85 + k; ra = -0.85 - k; break; }
    case 'ttype': { bob = Math.sin(t * 2.4) * 0.5; const k = Math.sin(t * 13) * 0.14; la = -0.85 + k; ra = -0.85 - k; break; }
    case 'cheer': { bob = -Math.abs(Math.sin(t * 8)) * 4; la = 2.5 + Math.sin(t * 14) * 0.2; ra = 2.5 - Math.sin(t * 14) * 0.2; break; }
    case 'sleep': { bob = Math.sin(t * 1.6) * 0.8; sit = true; tilt = 0.14 + Math.sin(t * 1.6) * 0.03; la = 0.35; ra = 0.35; break; }
    case 'drink': { bob = Math.sin(t * 2) * 0.6; ra = -2.3; la = 0.25; break; }
    case 'game': { bob = Math.sin(t * 9) * 0.9; sit = true; tilt = Math.sin(t * 3) * 0.05; la = -1.0 + Math.sin(t * 15) * 0.08; ra = -1.0 - Math.sin(t * 15) * 0.08; break; }
    case 'bounce': { la = 2.2 + Math.sin(t * 10) * 0.4; ra = 2.2 - Math.sin(t * 10) * 0.4; break; }
    case 'ball': { sit = true; bob = Math.sin(t * 5) * 1.2; la = 2.0 + Math.sin(t * 8) * 0.5; ra = 2.0 - Math.sin(t * 8) * 0.5; break; }
    case 'wave': { bob = Math.sin(t * 2.4) * 0.8; ra = 2.5 + Math.sin(t * 9) * 0.5; break; }
    default: bob = Math.sin(t * 2.2 + (o.phase || 0)) * 0.9;
  }

  if (shadow) { ctx.fillStyle = 'rgba(80,40,90,0.14)'; ell(ctx, 0, 1, 14, 4); ctx.fill(); }
  ctx.translate(0, bob);
  const lookf = look;
  const hijab = look.hijab;

  // Rambut / hijab belakang
  ctx.save(); ctx.translate(0, -49); if (tilt) ctx.rotate(tilt);
  if (hijab) {
    ctx.fillStyle = look.hijabColor; ctx.strokeStyle = shade(look.hijabColor, -0.22); ctx.lineWidth = 1.5;
    ell(ctx, 0, 1, 23.5, 22.5); ctx.fill(); ctx.stroke();
  } else backHair(ctx, lookf, t);
  ctx.restore();

  // Kaki
  if (!sit) { leg(ctx, look, spec, -5.5, lw); leg(ctx, look, spec, 5.5, rw); }

  // Drape hijab di dada
  if (hijab) {
    ctx.fillStyle = look.hijabColor; ctx.strokeStyle = shade(look.hijabColor, -0.22); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-20, -44); ctx.quadraticCurveTo(-24, -26, -13, -18); ctx.lineTo(13, -18); ctx.quadraticCurveTo(24, -26, 20, -44); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  drawBody(ctx, look, spec, pose, t);
  if (hijab) { // hijab menutupi bahu sedikit (di atas torso)
    ctx.fillStyle = look.hijabColor; ctx.strokeStyle = shade(look.hijabColor, -0.22); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-17, -38); ctx.quadraticCurveTo(-18, -27, -9, -24); ctx.quadraticCurveTo(0, -20, 9, -24); ctx.quadraticCurveTo(18, -27, 17, -38); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // Lengan
  const lh = arm(ctx, look, spec, -1, la);
  const rh = arm(ctx, look, spec, 1, ra);
  if (!held && !sit && (pose === 'stand' || pose === 'walk' || pose === 'wave')) heldProp(ctx, spec, look, t);
  if (held === 'cup' && pose === 'drink') {
    ctx.save(); ctx.translate(rh[0], rh[1] - 2);
    rr(ctx, -4, -4, 8, 8, 2.5); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#d4a574'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#9b6240'; ctx.fillRect(-3, -3, 6, 2.2);
    ctx.restore();
  }
  if (held === 'pad') {
    ctx.save(); ctx.translate((lh[0] + rh[0]) / 2, (lh[1] + rh[1]) / 2 + 1); ctx.rotate(Math.sin(t * 15) * 0.05);
    rr(ctx, -9, -4.5, 18, 9, 4); ctx.fillStyle = '#4a4a7a'; ctx.fill(); ctx.strokeStyle = '#2a2a50'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#ff7a59'; ctx.beginPath(); ctx.arc(5, -0.5, 1.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6bd6ff'; ctx.beginPath(); ctx.arc(7, 1, 1.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-6.5, -0.8, 4, 1.5); ctx.fillRect(-5.2, -2, 1.5, 4);
    ctx.restore();
  }

  // Kepala
  ctx.save(); ctx.translate(0, -49); if (tilt) ctx.rotate(tilt);
  // leher & telinga
  ctx.fillStyle = look.skin; ctx.strokeStyle = OL; ctx.lineWidth = 1.2; rr(ctx, -3.6, 11, 7.2, 8, 3); ctx.fill(); ctx.stroke();
  if (!hijab) for (const sd of [-1, 1]) { ell(ctx, sd * 19.6, 4, 3.8, 4.8); ctx.fill(); ctx.stroke(); ell(ctx, sd * 19.8, 4.2, 1.6, 2.4); ctx.fillStyle = shade(look.skin, -0.12); ctx.fill(); ctx.fillStyle = look.skin; }
  const hg = ctx.createRadialGradient(-5, -5, 3, 0, 3, 21);
  hg.addColorStop(0, shade(look.skin, 0.28)); hg.addColorStop(0.7, look.skin); hg.addColorStop(1, shade(look.skin, -0.1));
  ctx.fillStyle = hg; ctx.strokeStyle = OL; ctx.lineWidth = 1.5;
  if (hijab) ell(ctx, 0, 2, 16, 16); else ell(ctx, 0, 1.5, 19.8, 18);
  ctx.fill(); ctx.stroke();
  drawFace(ctx, look, face, t, blink);
  if (hijab) { // bingkai hijab di depan wajah
    ctx.strokeStyle = look.hijabColor; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 2, 19.5, 19.5, 0, Math.PI * 0.98, Math.PI * 2.02); ctx.stroke();
    ctx.strokeStyle = shade(look.hijabColor, -0.22); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(0, 2, 16.4, 16.4, 0, Math.PI * 0.99, Math.PI * 2.01); ctx.stroke();
    ctx.fillStyle = look.hijabColor; ctx.beginPath(); ctx.ellipse(0, -14, 21, 9, 0, Math.PI, TAU); ctx.fill();
  } else frontHair(ctx, lookf, t);
  accessory(ctx, look, spec, t);
  ctx.restore();

  ctx.restore();
}

// Potret untuk kartu / avatar. Mengembalikan canvas.
const portraitCache = new Map();
export let portraitProvider = null;
export const setPortraitProvider = fn => { portraitProvider = fn; };
export function portrait(look, spec, face = 'smile', size = 96) {
  if (portraitProvider) { const u = portraitProvider(look, spec, face, size); if (u) return u; }
  const key = `${JSON.stringify(look)}|${spec}|${face}|${size}`;
  if (portraitCache.has(key)) return portraitCache.get(key);
  const dpr = 2, cv = document.createElement('canvas');
  cv.width = size * dpr; cv.height = size * dpr;
  const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const sc = size * 0.0128;
  drawChibi(c, { x: size / 2, y: size * 0.02 + 95 * sc, s: sc, look, spec, pose: 'stand', face, t: 1.3, shadow: false });
  const url = cv.toDataURL('image/png');
  portraitCache.set(key, url);
  return url;
}

// ---------- MOCHI, kucing maskot ----------
export function drawMochi(ctx, o) {
  const { x, y, s = 1, t = 0, dir = 1, mood = 'happy', walking = false, sit = false } = o;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  const bob = walking ? -Math.abs(Math.sin(t * 12)) * 2 : Math.sin(t * 2) * 0.6;
  ctx.fillStyle = 'rgba(80,40,90,0.14)'; ell(ctx, 0, 1, 15, 4); ctx.fill();
  ctx.translate(0, bob);
  // ekor
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-12, -9); ctx.quadraticCurveTo(-24, -12 + Math.sin(t * 4) * 5, -22, -26 + Math.sin(t * 4) * 5); ctx.stroke();
  ctx.strokeStyle = '#ffd9a8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-21.5, -22 + Math.sin(t * 4) * 4); ctx.lineTo(-22, -26 + Math.sin(t * 4) * 5); ctx.stroke();
  // badan mochi (bulat gembul)
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#d9cde6'; ctx.lineWidth = 1.6;
  ell(ctx, 0, -11, 15, 11); ctx.fill(); ctx.stroke();
  // kaki
  const lg = walking ? Math.sin(t * 12) * 3 : 0;
  for (const [px, off] of [[-8, lg], [8, -lg]]) { ell(ctx, px + off, -1.5, 4.5, 3); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); }
  // kepala
  const hy = -24;
  ctx.fillStyle = '#fff';
  for (const sd of [-1, 1]) { // telinga
    ctx.beginPath(); ctx.moveTo(sd * 5, hy - 8); ctx.lineTo(sd * 12, hy - 20); ctx.lineTo(sd * 16, hy - 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sd * 8, hy - 9); ctx.lineTo(sd * 12, hy - 16); ctx.lineTo(sd * 14, hy - 8); ctx.closePath(); ctx.fillStyle = '#ffd9b8'; ctx.fill(); ctx.fillStyle = '#fff';
  }
  ell(ctx, 0, hy, 17, 13.5); ctx.fill(); ctx.stroke();
  // bercak oranye
  ctx.fillStyle = '#ffcf99'; ctx.beginPath(); ctx.ellipse(8, hy - 8, 6, 4.5, 0.4, 0, TAU); ctx.fill();
  // wajah
  const blink = (t % 4) < 0.14;
  if (mood === 'happy' || blink) {
    ctx.strokeStyle = '#4a3350'; ctx.lineWidth = 1.9; ctx.lineCap = 'round';
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 7, hy + 1, 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  } else {
    for (const sd of [-1, 1]) { ell(ctx, sd * 7, hy, 2.6, 3.4); ctx.fillStyle = '#4a3350'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sd * 7 - 0.8, hy - 1.2, 1, 0, TAU); ctx.fill(); }
  }
  ctx.fillStyle = 'rgba(255,140,110,0.4)'; ell(ctx, -11, hy + 5, 3.2, 2); ctx.fill(); ell(ctx, 11, hy + 5, 3.2, 2); ctx.fill();
  ctx.fillStyle = '#e8836a'; ctx.beginPath(); ctx.moveTo(-1.6, hy + 4); ctx.lineTo(1.6, hy + 4); ctx.lineTo(0, hy + 5.6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8a4030'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-3.2, hy + 7); ctx.quadraticCurveTo(-1.6, hy + 9, 0, hy + 6); ctx.quadraticCurveTo(1.6, hy + 9, 3.2, hy + 7); ctx.stroke();
  // kumis
  ctx.strokeStyle = '#cbbfdc'; ctx.lineWidth = 0.9;
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 12, hy + 3); ctx.lineTo(sd * 20, hy + 1); ctx.moveTo(sd * 12, hy + 5); ctx.lineTo(sd * 20, hy + 6); ctx.stroke(); }
  // kalung lonceng
  ctx.fillStyle = '#3fb57a'; ctx.fillRect(-7, hy + 11, 14, 2.6);
  ctx.beginPath(); ctx.arc(0, hy + 15.5, 2.6, 0, TAU); ctx.fillStyle = '#ffd35a'; ctx.fill(); ctx.strokeStyle = '#d99a1e'; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.restore();
}

export { rr, ell, star4, OUTFIT };
