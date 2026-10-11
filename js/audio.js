// Efek suara imut dari WebAudio (tanpa file audio, jadi tetap ringan & offline).
let ctx = null, on = true;
export const setSound = v => { on = !!v; };
export const isSound = () => on;

function ac() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function tone(freq, dur, type = 'sine', vol = 0.12, delay = 0, slideTo) {
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
}
const seq = (notes, step = 0.09, type = 'triangle', vol = 0.12, dur = 0.16) => notes.forEach((n, i) => tone(n, dur, type, vol, i * step));

const N = { c5: 523, d5: 587, e5: 659, g5: 784, a5: 880, c6: 1047, e6: 1319, g4: 392, e4: 330, c4: 262 };

export function sfx(name) {
  if (!on) return;
  switch (name) {
    case 'tap': tone(700, 0.06, 'triangle', 0.08); break;
    case 'pop': tone(520, 0.1, 'sine', 0.1, 0, 880); break;
    case 'coin': seq([N.e6, 1568], 0.07, 'square', 0.05, 0.12); break;
    case 'done': seq([N.c5, N.e5, N.g5], 0.07, 'triangle', 0.11); break;
    case 'glug': tone(300, 0.12, 'sine', 0.1, 0, 180); tone(360, 0.1, 'sine', 0.08, 0.13, 220); break;
    case 'ding': tone(1200, 0.35, 'sine', 0.07); tone(1800, 0.3, 'sine', 0.04, 0.02); break;
    case 'buy': seq([N.g5, N.c6, N.e6], 0.07, 'triangle', 0.12); tone(2093, 0.3, 'sine', 0.05, 0.22); break;
    case 'hire': seq([N.c5, N.e5, N.g5, N.c6], 0.08, 'triangle', 0.12); break;
    case 'levelup': seq([N.c5, N.e5, N.g5, N.c6, N.e6, 1568], 0.09, 'triangle', 0.12, 0.22); break;
    case 'levelup2': seq([N.e5, N.a5, N.c6], 0.07, 'triangle', 0.1); break;
    case 'mission': seq([N.g5, N.e6], 0.1, 'triangle', 0.1); break;
    case 'alert': tone(880, 0.12, 'square', 0.06); tone(660, 0.12, 'square', 0.06, 0.14); tone(880, 0.12, 'square', 0.06, 0.28); break;
    case 'oops': tone(300, 0.25, 'sawtooth', 0.07, 0, 150); break;
    case 'newday': seq([N.g4, N.c5, N.e5], 0.13, 'sine', 0.09, 0.3); break;
    case 'meow': tone(900, 0.12, 'sawtooth', 0.04, 0, 1250); tone(1250, 0.2, 'sawtooth', 0.04, 0.1, 700); break;
    case 'win': seq([N.c5, N.e5, N.g5, N.c6, N.g5, N.c6], 0.08, 'triangle', 0.12); break;
    case 'lose': seq([N.e5, N.d5, N.c5], 0.14, 'sine', 0.1, 0.25); break;
    case 'squish': tone(420, 0.09, 'square', 0.06, 0, 160); break;
    case 'bad': tone(200, 0.2, 'square', 0.07, 0, 120); break;
  }
}
