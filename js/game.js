// Logika game (tanpa DOM): waktu, karyawan, tiket, fasilitas, ekonomi, misi.
import {
  SPECS, SPEC_KEYS, TRAITS, TRAIT_KEYS, RARITY, NAMES_F, NAMES_M, SURNAMES, HAIR_COLORS, EYE_COLORS, SKINS,
  HIJAB_COLORS, HAIR_STYLES, TASK_TEMPLATES, PRIORITY, FACILITIES, rollQuirk, DESK_COSTS, DESK_LEVELS, DESK_MAX, DEPTS, DEPT_KEYS, deptOfSpec, DECOR, xpNeeded, MISSIONS,
  fmtMoney, LUNCH_MENUS, DISHES, PARTY_OPTS, DIFFS, ECONS, SYSTEMS
} from './data.js';
import { EVENTS } from './events.js';

export const rnd = (a, b) => a + Math.random() * (b - a);
export const ri = (a, b) => Math.floor(rnd(a, b + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const r1 = v => Math.round(v * 10) / 10;
const r2 = v => Math.round(v * 100) / 100;

// ----- Tata letak isometrik (satuan petak) -----
// Baris belakang: Pantry & Lounge. Baris 1: ruang Pengendalian (kiri) & Pengembangan (kanan).
// Baris 2: ruang Operasional (kiri), Ruang Server, Taman Bermain. Lorong tegak di x = V_X.
export const V_X = 6.6, C1_Y = 5.0, C2_Y = 10.0;
// indeks meja = departemen*9 + baris*3 + kolom (maks 9 meja / departemen)
// baris 3 (meja 7-9) berada di Gedung Tambahan sisi selatan
export const DESK_POS = { ctrl: { x: [0.7, 2.65, 4.6], y: [6.8, 9.0, 16.8] }, dev: { x: [7.4, 9.35, 11.3], y: [6.8, 9.0, 16.8] }, ops: { x: [0.7, 2.65, 4.6], y: [11.5, 13.7, 16.8] } };
const OPS_ANNEX_X = [14.4, 16.35, 18.3];
export const deskXY = i => { const d = DEPT_KEYS[Math.floor(i / 9)], k = i % 9, row = Math.floor(k / 3); return { x: d === 'ops' && row === 2 ? OPS_ANNEX_X[k % 3] : DESK_POS[d].x[k % 3], y: DESK_POS[d].y[row] }; };
export const POOL_SLOTS = [[23.0, 3.4], [24.8, 3.4], [23.0, 5.0], [24.8, 5.0]];
export const MEET_SEATS = [[17.3, 11.7], [18.7, 11.7], [20.1, 11.7], [17.3, 14.4], [18.7, 14.4], [20.1, 14.4]];
export const SERVER_ST = [{ x: 7.9, y: 11.7 }, { x: 9.25, y: 11.7 }, { x: 10.6, y: 11.7 }];
export const PLAY_SLOTS = [[12.4, 11.6], [14.0, 11.6], [12.4, 13.0], [14.0, 13.0]];
export const ENTRY = { x: 6.6, y: 0.3 };            // pintu masuk/keluar di dinding belakang (ujung lorong tegak)
export const DIR_SEAT = { x: 18.7, y: 2.9 };
const HOURS_PER_SEC = 1 / 4.2;   // 4,2 detik nyata = 1 jam game (1x) → 1 hari ≈ 38 detik
const ACT_DUR = { lunch: 5.5, party: 10, gossip: 8, coffee: 3.6, snack: 4.2, ps: 10, play: 8, pool: 9, summon: 9 };
export const SCOLD_SPOT = { x: 19.3, y: 4.7 };
const SCOLD_LINES = {
  sp: ['Ini Surat Peringatan resmi untukmu.', 'Kinerjamu perlu diperbaiki segera.', 'Tolong baca & tanda tangani ya.', 'Kesempatan terakhir sebelum sanksi lanjut.'],
  marah: ['KERJAAN KOK BEGINI?! 😡', 'Berapa kali saya bilang?!', 'Deadline itu bukan saran!', 'Saya kecewa sama kamu!!', 'Mau jadi apa divisi ini?!', 'Kopi terus, kerja kapan?!'],
  tegur: ['Saya ingin bicara baik-baik.', 'Tolong lebih teliti ya.', 'Kita perlu perbaiki ini bersama.'],
  semangat: ['Kamu pasti bisa! 💪', 'Saya percaya sama kamu.', 'Istirahat cukup, lalu gas lagi!']
};
const PROJECT_PHASES = [['ctrl', 'Analisis & kontrol', 75, 6.5], ['dev', 'Pengembangan', 100, 8.5], ['ops', 'Implementasi', 80, 7]];
const TIME_SCALE = 0.62;         // memperlambat seluruh simulasi (1 hari ≈ 60 detik pada 1x)
const WALK = 2.6;                // petak per detik

export const deskPos = i => { const p = deskXY(i); return { x: p.x + 0.85, y: p.y - 0.5 }; };

export function spotFor(kind, idx, n) {
  switch (kind) {
    case 'coffee': return { x: 3.0 + idx * 1.0, y: 2.0, pose: 'drink' };
    case 'snack': return { x: 0.6 + idx * 0.9, y: 2.9, pose: 'drink' };
    case 'ps': return { x: 11.8 + (idx - (n - 1) / 2) * 1.0, y: 1.0, pose: 'game' };
    case 'play': return { x: PLAY_SLOTS[idx][0], y: PLAY_SLOTS[idx][1], pose: 'bounce' };
    case 'server': return { x: SERVER_ST[idx].x, y: SERVER_ST[idx].y, pose: 'type' };
    case 'meeting': return { x: MEET_SEATS[idx][0], y: MEET_SEATS[idx][1], pose: 'sit' };
    case 'pool': return { x: POOL_SLOTS[idx][0], y: POOL_SLOTS[idx][1], pose: 'ball' };
    case 'summon': return { x: SCOLD_SPOT.x, y: SCOLD_SPOT.y, pose: 'stand' };
  }
}
export const queueSpot = (kind, qi) => ({
  coffee: [{ x: 5.9, y: 2.8 }, { x: 5.3, y: 3.4 }, { x: 4.4, y: 3.3 }],
  snack: [{ x: 1.0, y: 3.7 }, { x: 2.0, y: 3.7 }, { x: 0.4, y: 3.7 }],
  ps: [{ x: 8.6, y: 2.0 }, { x: 8.2, y: 2.6 }, { x: 9.0, y: 2.8 }],
  play: [{ x: 11.8, y: 9.7 }, { x: 12.8, y: 9.7 }, { x: 13.8, y: 9.7 }],
  pool: [{ x: 22.2, y: 8.6 }, { x: 23.4, y: 8.8 }, { x: 24.6, y: 8.6 }]
}[kind][qi % 3]);

// Ruang Makan (perluasan pantry ke utara), Aula Pesta (sayap timur) & barisan penyambutan Direksi
export const DINE_SEATS = (() => { const a = []; for (let r = 0; r < 3; r++) for (const y of [-2.55, -1.65, -0.75]) for (let i = 0; i < 7; i++) a.push({ x: 0.95 + i * 0.7, y: y - 3 * r }); return a; })();   // 21 kursi per tingkat (maks 3 tingkat)
export const hallEnd = lvl => 10.4 + 5 * lvl;
const _hs = {};
export function hallSlots(lvl) {
  if (_hs[lvl]) return _hs[lvl];
  const rows = [0, 4, 7, 10][lvl] || 4, y0 = 12.0, y1 = hallEnd(lvl) - 1.4, all = [];
  for (let r = 0; r < rows; r++) for (let i = 0; i < 7; i++) all.push({ x: 22.3 + i * 0.8, y: rows > 1 ? y0 + (y1 - y0) * r / (rows - 1) : y0 });
  const N = all.length, out = []; for (let k = 0; k < N; k++) out.push(all[(k * 17) % N]);   // sebar merata agar tidak menumpuk di satu sisi
  return (_hs[lvl] = out);
}
export const GREET_SLOTS = (() => { const a = []; for (const y of [1.5, 2.1, 2.7, 3.3, 3.9, 4.5]) for (const x of [5.9, 7.4, 5.1, 8.2, 9.0]) a.push({ x, y }); return a; })();
const DINE_LANE = 5.75;

// Jalur jalan lewat lorong tegak (x = V_X) dan lorong datar, jadi tidak menembus meja/sekat
function toV(p) {
  if (p.y < 0) return [{ x: DINE_LANE, y: p.y }, { x: DINE_LANE, y: C1_Y }, { x: V_X, y: C1_Y }];                 // Ruang Makan
  if (p.x >= 21 && p.y > 10.4) return [{ x: 21.55, y: p.y }, { x: 21.55, y: C2_Y }, { x: V_X, y: C2_Y }];   // Ruang Aula
  if (p.x >= 21) return [{ x: p.x, y: C2_Y }, { x: V_X, y: C2_Y }];                       // area kolam renang (timur)
  if (p.y < 5.3) return [{ x: p.x, y: C1_Y }, { x: V_X, y: C1_Y }];                      // area belakang
  if (p.y >= 15.4 && p.x >= 13.7) return [{ x: 14.1, y: p.y }, { x: 14.1, y: 18.5 }, { x: V_X, y: 18.5 }];   // Gedung Tambahan Ops: lewat lorong selatan
  if (p.y >= 15.4) return [{ x: V_X, y: p.y }];                                            // Gedung Tambahan (selatan)
  if (p.y >= 10.4 && p.x >= 11.1) return [{ x: p.x, y: C2_Y }, { x: V_X, y: C2_Y }];      // taman bermain
  return [{ x: V_X, y: p.y }];                                                             // ruangan (jalan di lorong belakang meja)
}
export function route(sx, sy, tx, ty) {
  const same = (a, b) => Math.abs(a.x - b.x) < 0.05 && Math.abs(a.y - b.y) < 0.05;
  const a = toV({ x: sx, y: sy }), b = toV({ x: tx, y: ty }).reverse();
  const out = [...a, ...b, { x: tx, y: ty }];
  return out.filter((p, i) => !same(p, i ? out[i - 1] : { x: sx, y: sy }));
}

export function genLook(female) {
  const hijab = female && Math.random() < 0.28;
  return {
    female: !!female,
    hair: pick(HAIR_COLORS), style: female ? pick(['long', 'long', 'bob']) : pick(HAIR_STYLES), bangs: 0, eye: pick(EYE_COLORS), skin: pick(SKINS),
    skirt: female && Math.random() < 0.8, hijab, hijabColor: pick(HIJAB_COLORS), acc: 'none'
  };
}

function rollRarity(boost = 0) {
  const tot = Object.values(RARITY).reduce((s, r) => s + r.w, 0);
  let x = Math.random() * tot;
  const keys = Object.keys(RARITY);
  for (const k of keys) { x -= RARITY[k].w + (k === 'R' || k === 'SR' || k === 'SSR' ? boost : 0); if (x <= 0) return k; }
  return 'N';
}

let idCounter = Date.now() % 100000;
const nid = p => `${p}${(idCounter++).toString(36)}`;

export function makeEmployee(spec, rarity, usedNames = [], forceFemale) {
  rarity = rarity || rollRarity();
  const female = forceFemale === undefined ? Math.random() < 0.4 : forceFemale;
  let name, tries = 0;
  do { name = `${pick(female ? NAMES_F : NAMES_M)} ${pick(SURNAMES)}`; } while (usedNames.includes(name) && tries++ < 20);
  const R = RARITY[rarity];
  return {
    id: nid('E'), name, female, spec, rarity, trait: pick(TRAIT_KEYS), quirk: rollQuirk(), look: genLook(female),
    skill: ri(R.skill[0], R.skill[1]), lvl: 1, xp: 0, energy: ri(80, 100), stress: ri(5, 18), mood: ri(78, 92),
    salary: r1(R.salary * rnd(0.9, 1.15)), task: null, desk: 0, tasksDone: 0, wTasks: 0
  };
}

export class Game {
  constructor() { this.l = {}; this.s = null; this.blocking = false; this.lastSave = 0; }
  on(ev, fn) { (this.l[ev] ||= []).push(fn); }
  emit(ev, p) { (this.l[ev] || []).forEach(fn => fn(p)); }

  // ---------- Sesi ----------
  newGame({ name, bank, dirLook, diff }) {
    this.s = {
      v: 1, name: name || 'Direktur', bank: bank || 'Bank Sakura Nusantara', dirLook: dirLook || { hair: '#4a3f66', style: 'bob', bangs: 2, eye: '#5a7bff', skin: '#ffe3d0', skirt: true, acc: 'none' }, day: 1, hour: 8, speed: 1,
      money: 45, level: 1, xp: 0, security: 66, service: 76, risk: 22,
      deskCount: { ctrl: 1, dev: 1, ops: 1 }, deskV: 3, starterDone: false, projects: [], diff: DIFFS[diff] ? diff : 'normal', sys: {}, debuff: null, debt: 0, econ: null, surcharge: null, lunch: { day: 1, state: 'none', menu: null, cost: 0 }, fac: { dining: 1, hall: 0, coffee: 0, snack: 0, ps: 0, play: 0, pool: 0, server: 1 }, decor: {}, employees: [], tasks: [], candidates: [],
      missions: {}, stat: { assigned: 0, tasksDone: 0, cups: 0, psPlays: 0, playPlays: 0, hired: 0, mochi: 0, perfect: 0, mgWins: 0, events: 0, praise: 0, bestStreak: 0, approved: 0, rejected: 0, memos: 0 },
      week: { income: 0, expense: 0, tasks: 0 }, inbox: [], memos: [], coffeeStock: 30, snackStock: 24, firstReq: false, auto: false, autoBreak: true, sound: true, log: [], eventCool: 3, starDays: 0, bailouts: 0, ended: false
    };
    this.initRuntime();
    for (let i = 0; i < 3; i++) this.spawnTask(['dev', 'ops', 'ctrl'][i], 'mid');
    this.genCandidates();
    this.addLog('Selamat datang di ' + this.s.bank + '! ✨');
    this.checkMissions(true);
  }

  load(obj) {
    this.s = obj;
    // migrasi penampilan lama: pastikan ada penanda jenis kelamin & gaya rambut baru
    for (const e of [...(obj.employees || []), ...(obj.candidates || [])]) { if (e.look && e.look.female === undefined) e.look.female = !!e.female; }
    const hadCount = !!this.s.deskCount;
    if (!this.s.deskCount) { // save lama: bagi meja per departemen
      const dc = { ctrl: 1, dev: 1, ops: 1 }; this.s.deskCount = dc;
      for (const d of DEPT_KEYS) dc[d] = Math.min(DESK_MAX, Math.max(1, this.s.employees.filter(e => deptOfSpec(e.spec) === d).length));
      this.s.employees.forEach(e => { e.desk = -1; }); this.s.employees.forEach(e => { e.desk = this.freeDesk(e.spec); if (e.desk < 0) { dc[deptOfSpec(e.spec)] = Math.min(DESK_MAX, dc[deptOfSpec(e.spec)] + 1); e.desk = this.freeDesk(e.spec); } });
      delete this.s.desks;
    }
    if (hadCount && !this.s.deskV) { this.s.employees.forEach(e => { e.desk = Math.floor(e.desk / 3) * 6 + (e.desk % 3); }); this.s.deskV = 2; }   // skema meja v2
    if (hadCount && this.s.deskV === 2) this.s.employees.forEach(e => { e.desk = Math.floor(e.desk / 6) * 9 + (e.desk % 6); });   // skema meja v3 (9 per departemen)
    this.s.deskV = 3; if (!this.s.projects) this.s.projects = []; this.s.projects.forEach(p => { if (p.state === 'meeting') p.state = 'plan'; });
    if (this.s.fac.pool === undefined) this.s.fac.pool = 0;
    if (this.s.fac.hall === undefined) this.s.fac.hall = 0; if (!this.s.fac.dining) this.s.fac.dining = 1;
    if (!DIFFS[this.s.diff]) this.s.diff = 'normal'; if (this.s.debt === undefined) this.s.debt = 0; if (!this.s.sys) this.s.sys = {}; if (this.s.debuff === undefined) this.s.debuff = null; if (this.s.econ === undefined) this.s.econ = null; if (this.s.surcharge === undefined) this.s.surcharge = null;
    if (!this.s.lunch || this.s.lunch.day !== this.s.day) this.s.lunch = { day: this.s.day, state: 'none', menu: null, cost: 0 };
    else if (['asked', 'eating'].includes(this.s.lunch.state)) this.s.lunch.state = this.s.hour < 12 ? 'none' : 'done';
    if (this.s.starterDone === undefined) this.s.starterDone = true;
    for (const e of this.s.employees) if (e.quirk === undefined) e.quirk = rollQuirk();
    for (const k of ['approved', 'rejected', 'memos']) if (this.s.stat[k] === undefined) this.s.stat[k] = 0;
    if (!this.s.inbox) this.s.inbox = []; if (!this.s.memos) this.s.memos = []; if (this.s.coffeeStock === undefined) this.s.coffeeStock = 30; if (this.s.snackStock === undefined) this.s.snackStock = 24; if (this.s.fac.snack === undefined) this.s.fac.snack = 0; if (this.s.firstReq === undefined) this.s.firstReq = true;
    const d = { auto: false, autoBreak: true, sound: true, log: [], eventCool: 3, starDays: 0, bailouts: 0, ended: false };
    for (const k in d) if (this.s[k] === undefined) this.s[k] = d[k];
    this.initRuntime();
    this.s.tasks.forEach(t => { if (t.state === 'doing' && !this.emp(t.emp)) { t.state = 'new'; t.emp = null; } });
    this.s.employees.forEach(e => { if (e.task) { const t = this.task(e.task); if (!t || t.state !== 'doing') e.task = null; } });
    this.s.employees.forEach(e => { Object.assign(e, deskPos(e.desk)); this.goWork(e, true); });
    this.s.speed = Math.min(this.s.speed, 1);
    this.checkMissions(true);
  }

  initRuntime() {
    this.slots = { coffee: [], snack: [], ps: [], play: [], pool: [], server: [], meeting: [] };
    this.queue = { coffee: [], snack: [], ps: [], play: [], pool: [] };
    this.resizeSlots();
    this.s.employees.forEach(e => this.initEmpRuntime(e));
    this.scold = null; this.visit = null; this.party = null; this.autoT = 0; this.mochiLast = 0; this.pending = null; this.report = null;
  }
  initEmpRuntime(e) {
    Object.assign(e, { st: 'idle', ...deskPos(e.desk), path: [], step: null, goal: null, act: null, cool: rnd(4, 14), buff: 0, face: null, faceT: 0, say: null, sayT: 0, wslot: -1, flip: 1, hidden: false, onLeave: false, sickT: 0, claimBubble: null });
  }
  serialize() {
    const clean = JSON.parse(JSON.stringify(this.s, (k, v) => (['path', 'step', 'act', 'say', 'claimBubble', 'st', 'x', 'y', 'goal', 'hidden', 'onLeave'].includes(k) ? undefined : k === 'employees' ? v.filter(e => !e.leaving) : v)));
    return JSON.stringify(clean);
  }

  resizeSlots() {
    for (const k of ['coffee', 'snack', 'ps', 'play', 'pool', 'server', 'meeting']) {
      const n = this.capacity(k), a = this.slots[k];
      while (a.length < n) a.push(null);
    }
  }
  capacity(k) { if (k === 'meeting') return 6; const l = this.s.fac[k]; return l ? FACILITIES[k].levels[l - 1].slots : 0; }
  facInfo(k) { const l = this.s.fac[k]; return l ? FACILITIES[k].levels[l - 1] : null; }

  // ---------- Meja per departemen ----------
  totalDesks() { const c = this.s.deskCount; return c.ctrl + c.dev + c.ops; }
  deskOwned(i) { return (i % 9) < this.s.deskCount[DEPT_KEYS[Math.floor(i / 9)]]; }
  freeDesk(spec) {
    const d = deptOfSpec(spec), r = DEPT_KEYS.indexOf(d);
    for (let c = 0; c < this.s.deskCount[d]; c++) { const i = r * 9 + c; if (!this.s.employees.some(e => e.desk === i)) return i; }
    return -1;
  }
  deptFull(d) { return this.s.employees.filter(e => deptOfSpec(e.spec) === d).length >= this.s.deskCount[d]; }

  // ---------- Pencarian ----------
  emp(id) { return this.s.employees.find(e => e.id === id); }
  task(id) { return this.s.tasks.find(t => t.id === id); }
  get emps() { return this.s.employees.filter(e => !e.leaving); }
  avgMood() { const e = this.s.employees; return e.length ? e.reduce((a, b) => a + b.mood, 0) / e.length : 80; }
  score() { const s = this.s; return 0.3 * s.service + 0.25 * s.security + 0.25 * this.avgMood() + 0.2 * (100 - s.risk); }
  stars() { return clamp(Math.floor((this.score() - 30) / 12), 1, 5); }
  decorCount() { return Object.values(this.s.decor).filter(Boolean).length; }

  // ---------- Util ----------
  addLog(t) { this.s.log.unshift(`Hari ${this.s.day}: ${t}`); this.s.log.length = Math.min(this.s.log.length, 40); }
  toast(text, kind = 'info') { this.emit('toast', { text, kind }); }
  addMoney(v, kind) {
    this.s.money = Math.round((this.s.money + v) * 100) / 100;
    if (v > 0) this.s.week.income += v; else this.s.week.expense += -v;
    if (kind === 'quiet') return;
  }
  addStat(k, d) { this.s[k] = clamp(this.s[k] + d); }
  boost(k, a) { this.s[k] = clamp(this.s[k] + a * (1 - this.s[k] / 105)); }
  cut(k, a) { this.s[k] = clamp(this.s[k] - a * (0.25 + this.s[k] / 70)); }
  say(e, text, dur = 2.6) { e.say = text; e.sayT = dur; }
  face(e, f, dur = 2.5) { e.face = f; e.faceT = dur; }

  // ---------- XP / level ----------
  addXp(n) {
    const s = this.s; s.xp += n;
    while (s.xp >= xpNeeded(s.level)) {
      s.xp -= xpNeeded(s.level); s.level++;
      const bonus = 8 + s.level * 3; this.addMoney(bonus);
      const unlocks = [];
      for (const [k, f] of Object.entries(FACILITIES)) f.levels.forEach((l, i) => { if (l.lvl === s.level && i >= (s.fac[k] || 0) && !(k === 'server' && i === 0)) unlocks.push(`${f.emoji} ${l.name}`); });
      DESK_LEVELS.forEach((l, i) => { if (l === s.level && i >= 3) unlocks.push(`🪑 Meja kerja ke-${i + 1}`); });
      Object.values(DECOR).forEach(d => { if (d.lvl === s.level) unlocks.push(`${d.emoji} ${d.name}`); });
      this.addLog(`Naik level ${s.level}!`);
      this.emit('levelup', { level: s.level, bonus, unlocks });
      this.emit('sfx', 'levelup');
    }
  }

  // ---------- Tiket ----------
  spawnTask(spec, prio) {
    const s = this.s, team = [...new Set(s.employees.map(e => e.spec))];
    const live = SPEC_KEYS.filter(k => s.employees.some(e => deptOfSpec(e.spec) === deptOfSpec(k)));   // hanya bidang yang punya staf
    spec = spec || (team.length && Math.random() < 0.72 ? pick(team) : pick(live.length ? live : SPEC_KEYS));
    const tpl = pick(TASK_TEMPLATES.filter(t => t.spec === spec));
    if (!prio) { const x = Math.random() * 100; const hi = 16 + s.level * 2; prio = x < hi ? 'high' : x < hi + 26 ? 'low' : 'mid'; }
    const P = PRIORITY[prio], lv = s.level - 1;
    const t = {
      id: nid('T'), title: tpl.title, sub: tpl.sub, spec: tpl.spec, pri: prio, work: Math.round(tpl.work * (1 + lv * 0.03) * (prio === 'high' ? 1.1 : 1)),
      reward: r1(tpl.reward * P.mult * (1 + lv * 0.07)), xp: Math.round(tpl.xp * (prio === 'high' ? 1.3 : 1)), onsite: !!tpl.onsite, sec: tpl.sec || 0,
      deadline: s.day + P.days + ri(0, 2), state: 'new', progress: 0, emp: null, late: 0
    };
    s.tasks.push(t);
    return t;
  }
  activeTasks() { return this.s.tasks.filter(t => t.state === 'new' || t.state === 'doing').length; }

  // Tiket hanya bisa dikerjakan bidang (departemen) pemiliknya
  canDo(e, t) { return deptOfSpec(e.spec) === deptOfSpec(t.spec); }
  matchFactor(e, t) { return e.spec === t.spec ? 1 : this.canDo(e, t) ? 0.8 : 0; }
  // Beban kerja per bidang
  deptLoad(dk) {
    const s = this.s, staff = s.employees.filter(e => !e.leaving && deptOfSpec(e.spec) === dk);
    const ts = s.tasks.filter(t => t.state !== 'done' && deptOfSpec(t.spec) === dk);
    const idle = staff.filter(e => !e.task && e.st !== 'sick' && !e.hidden).length;
    const open = ts.length, late = ts.filter(t => t.late).length, n = staff.length, per = n ? open / n : open;
    const level = !n || per >= 2.6 || (late > 0 && idle === 0) ? 'high' : per >= 1.6 ? 'mid' : 'low';
    return { dept: dk, open, waiting: ts.filter(t => t.state === 'new').length, late, staff: n, idle, per, level, need: level === 'high' && s.deskCount[dk] < DESK_MAX };
  }
  loadAdvice() { return DEPT_KEYS.map(k => this.deptLoad(k)).filter(x => x.need); }
  checkLoad() {
    this.loadFlag ||= {};
    for (const k of DEPT_KEYS) {
      const L = this.deptLoad(k), was = !!this.loadFlag[k]; this.loadFlag[k] = L.need;
      if (L.need && !was) { this.toast(`📈 ${DEPTS[k].name} kebanjiran tiket (${L.open} tiket untuk ${L.staff} orang). Disarankan rekrut karyawan baru!`, 'warn'); this.emit('sfx', 'alert'); this.emit('change'); }
    }
  }
  betterCand(e) { const d = deptOfSpec(e.spec); return this.s.candidates.filter(c => deptOfSpec(c.spec) === d && c.skill >= e.skill + 12).sort((a, b) => b.skill - a.skill)[0] || null; }
  workRate(e, t) {
    const T = e.trait, base = (e.skill / 55) * 2.0 * (1 + (e.lvl - 1) * 0.05);
    const energyF = 0.45 + 0.55 * e.energy / 100, moodF = 0.65 + 0.35 * e.mood / 100;
    const stressF = e.stress > 70 ? 1 - 0.5 * (e.stress - 70) / 30 : 1;
    return base * (e.broken ? 0.5 : 1) * (e.deviceBonus || 1) * this.matchFactor(e, t) * energyF * moodF * stressF * (e.buff > 0 ? 1.2 : 1) * (T === 'rajin' ? 1.1 : 1) * (T === 'santai' ? 0.95 : 1)
      * (this.s.debuff && this.s.debuff.left > 0 ? this.s.debuff.mult : 1) * (e.quirk === 'lambat' ? 0.75 : 1) * (this.s.employees.some(x => x.act && x.act.kind === 'gossip' && x.act.arrived && x.act.mate === e.id) ? 0.5 : 1);
  }

  assign(taskId, empId) {
    const t = this.task(taskId), e = this.emp(empId);
    if (!t || !e || t.state !== 'new' || e.task || e.st === 'sick' || e.leaving || e.onLeave) return false;
    if (!this.canDo(e, t)) { this.toast(`Tiket ini milik bidang ${DEPTS[deptOfSpec(t.spec)].name} — ${e.name.split(' ')[0]} dari bidang lain tidak bisa mengerjakannya.`, 'warn'); return false; }
    t.state = 'doing'; t.emp = e.id; e.task = t.id; this.s.stat.assigned++;
    if (e.act && e.act.arrived) { /* biarkan selesai istirahat dulu */ } else { this.cancelActivity(e); this.goWork(e); }
    this.emit('sfx', 'pop'); this.say(e, 'Siap, Bos! 💪'); this.face(e, 'happy', 2);
    this.checkMissions();
    return true;
  }
  unassign(taskId) {
    const t = this.task(taskId); if (!t || t.state !== 'doing') return;
    const e = this.emp(t.emp); t.state = 'new'; t.emp = null;
    if (e) { e.task = null; this.releaseWork(e); if (!(e.act && e.act.arrived)) this.goWork(e); }
  }
  autoPick(e) {
    const c = this.s.tasks.filter(t => t.state === 'new' && this.canDo(e, t));
    if (!c.length) return null;
    c.sort((a, b) => (this.matchFactor(e, b) - this.matchFactor(e, a)) || (a.deadline - b.deadline));
    return c[0];
  }

  finishTask(t, e) {
    const q = (e.mood >= 70 && e.stress < 62 && Math.random() < (e.trait === 'teliti' ? 0.9 : 0.5)) ? 'perfect' : (e.stress >= 85 && e.trait !== 'teliti' && Math.random() < 0.4 * (1 - this.sysBonus('bug')) ? 'bug' : 'ok');
    t.state = 'done'; t.progress = t.work; t.q = q; t.claimT = 9; t.doneBy = e.id;
    e.fails = q === 'bug' ? (e.fails || 0) + 1 : e.quirk === 'lambat' && q !== 'perfect' ? (e.fails || 0) + 0.6 : Math.max(0, (e.fails || 0) - 0.5); this.checkSuggest();
    e.task = null; e.tasksDone++; e.wTasks++;
    this.releaseWork(e);
    e.claimBubble = t.id;
    this.face(e, q === 'bug' ? 'stress' : 'happy', 3);
    this.say(e, q === 'perfect' ? 'Sempurna! ✨' : q === 'bug' ? 'Ups, ada bug…' : 'Beres! ✔', 3);
    this.emit('sfx', 'done');
    this.goWork(e);
  }
  claimTask(id, tapped) {
    const t = this.task(id); if (!t || t.state !== 'done') return;
    const e = this.emp(t.doneBy), s = this.s;
    const qm = t.q === 'perfect' ? 1.25 : t.q === 'bug' ? 0.7 : 1;
    const money = r1(t.reward * qm * (tapped ? 1.1 : 1) * this.incomeMul());
    this.addMoney(money); s.week.tasks++; s.stat.tasksDone++;
    if (t.q === 'perfect') s.stat.perfect++;
    this.addXp(Math.round(t.xp * (t.q === 'perfect' ? 1.2 : 1)));
    if (e) { e.xp += t.xp; if (e.xp >= 60 * e.lvl) { e.xp -= 60 * e.lvl; e.lvl++; e.skill = Math.min(99, e.skill + 2); e.salary = r1(e.salary + 0.1); this.say(e, `Naik level ${e.lvl}! 🌟`, 3); this.emit('fx', { kind: 'stars', x: e.x, y: e.y }); } e.claimBubble = null; if (tapped) e.mood = clamp(e.mood + 3); }
    this.boost('service', t.pri === 'high' ? 1.4 : 0.8);
    this.cut('risk', 0.5); if (t.q === 'bug') s.risk = clamp(s.risk + 2.5);
    if (t.sec) { this.boost('security', t.sec); this.cut('risk', t.sec * 0.4); }
    if (t.spec === 'ctrl') { this.cut('risk', 0.7); this.boost('security', 0.6); }
    s.tasks = s.tasks.filter(x => x.id !== id);
    if (t.proj) this.projectTaskClaimed(t);
    if (t.sys) this.systemStepDone(t);
    this.emit('popup', { empId: t.doneBy, text: `+${fmtMoney(money)}`, kind: 'money' });
    this.emit('sfx', 'coin');
    this.checkMissions();
    this.emit('change');
  }

  // ---------- Gerak & jalur ----------
  setPath(e, x, y, goal) {
    e.step = null; e.path = route(e.x, e.y, x, y); e.goal = goal; e.st = 'walk';
  }
  goDeskPos(e) { return deskPos(e.desk); }
  atPos(e, d) { return Math.hypot(e.x - d.x, e.y - d.y) < 0.08 && !e.step; }
  goWork(e, silent) {
    const t = e.task ? this.task(e.task) : null;
    this.releaseWork(e);
    if (t && t.onsite) {
      const i = this.slots.server.indexOf(null);
      if (i >= 0) { this.slots.server[i] = e.id; e.wslot = i; const sp = spotFor('server', i); this.setPath(e, sp.x, sp.y, 'work'); return; }
    }
    const d = this.goDeskPos(e);
    if (this.atPos(e, d)) { e.st = e.task ? 'work' : 'idle'; e.goal = 'work'; return; }
    this.setPath(e, d.x, d.y, 'work');
  }
  releaseWork(e) { if (e.wslot >= 0) { if (this.slots.server[e.wslot] === e.id) this.slots.server[e.wslot] = null; e.wslot = -1; } }
  atServer(e) { return e.wslot >= 0; }

  cancelActivity(e) {
    if (e.act && e.act.slot !== undefined && this.slots[e.act.kind]) { if (this.slots[e.act.kind][e.act.slot] === e.id) this.slots[e.act.kind][e.act.slot] = null; }
    e.act = null;
    for (const k in this.queue) this.queue[k] = this.queue[k].filter(id => id !== e.id);
  }

  requestActivity(e, kind, forced) {
    if (e.st === 'sick' || e.st === 'enter' || e.leaving || e.onLeave) return false;
    if (e.act && e.act.kind === kind) return true;
    if (kind === 'nap') {
      this.cancelActivity(e); this.releaseWork(e);
      e.act = { kind: 'nap', t: 0, dur: 7, arrived: false };
      const d = this.goDeskPos(e);
      if (this.atPos(e, d)) { e.act.arrived = true; e.st = 'act'; e.goal = 'act'; } else this.setPath(e, d.x, d.y, 'act');
      return true;
    }
    if (!this.s.fac[kind]) { if (forced) this.toast('Belum punya fasilitas itu — beli di Toko ya! 🛍️', 'warn'); return false; }
    if (kind === 'coffee' && this.s.coffeeStock <= 0) { if (forced || Math.random() < 0.2) this.toast('☕ Biji kopi habis! Setujui pembelian stok di Inbox.', 'warn'); this.ensureRestock(); return false; }
    if (kind === 'snack' && this.s.snackStock <= 0) { if (forced || Math.random() < 0.2) this.toast('🍪 Snack habis! Setujui pembelian stok di Inbox.', 'warn'); this.ensureRestock(); return false; }
    this.cancelActivity(e); this.releaseWork(e);
    const n = this.capacity(kind), idx = this.slots[kind].indexOf(null);
    if (idx >= 0) {
      this.slots[kind][idx] = e.id;
      e.act = { kind, slot: idx, t: 0, dur: ACT_DUR[kind] || 8, arrived: false };
      const sp = spotFor(kind, idx, n); this.setPath(e, sp.x, sp.y, 'act');
      return true;
    }
    if (this.queue[kind].length < 3) {
      this.queue[kind].push(e.id);
      const q = queueSpot(kind, this.queue[kind].length - 1); this.setPath(e, q.x, q.y, 'queue');
      this.say(e, 'Antri dulu… 🥺');
      return true;
    }
    if (forced) this.toast('Antriannya penuh, sabar ya! 😵', 'warn');
    return false;
  }

  promoteQueues() {
    for (const kind of ['coffee', 'snack', 'ps', 'play', 'pool']) {
      const q = this.queue[kind];
      while (q.length) {
        const idx = this.slots[kind].indexOf(null); if (idx < 0) break;
        const id = q.shift(), e = this.emp(id); if (!e) continue;
        this.slots[kind][idx] = id;
        e.act = { kind, slot: idx, t: 0, dur: ACT_DUR[kind] || 8, arrived: false };
        const sp = spotFor(kind, idx, this.capacity(kind)); this.setPath(e, sp.x, sp.y, 'act');
      }
    }
  }

  arrive(e) {
    e.step = null; e.path = [];
    if (e.goal === 'leave') {
      if (e.onLeave) { e.onLeave = false; e.hidden = true; e.st = 'sick'; e.sickT = 18; e.goal = null; this.emit('sfx', 'tap'); return; }   // keluar lewat pintu untuk cuti
      this.removeEmp(e); return;
    }
    if (e.goal === 'work') { e.st = e.task ? 'work' : 'idle'; if (e.act) { e.act = null; } }
    else if (e.goal === 'act' && e.act) {
      e.st = 'act'; e.act.arrived = true;
      if (e.act.kind === 'ps') { this.say(e, pick(['Ayo main! 🎮', 'Player 2 siap!', 'GG ya~'])); }
      if (e.act.kind === 'play') this.say(e, pick(['Wheee~ 🛝', 'Yeay!', 'Lompat!']));
      if (e.act.kind === 'greet') this.say(e, pick(['Selamat datang, Pak/Bu Direksi! 🙇', 'Selamat pagi, Direksi! 🙏', 'Selamat datang! 🙇']), 3.5);
      if (e.act.kind === 'party') this.say(e, pick(['Pestaaa! 🥳', 'Yeay Go-Live! 🎉', 'Ayo joget! 💃']), 3);
      this.emit('sfx', e.act.kind === 'coffee' ? 'glug' : 'pop');
    } else if (e.goal === 'queue') e.st = 'queue';
    else e.st = e.task ? 'work' : 'idle';
  }

  endActivity(e) {
    const a = e.act, s = this.s; if (!a) return;
    if (a.kind === 'coffee') {
      const l = this.facInfo('coffee'), k = e.trait === 'kopi' ? 1.5 : 1;
      e.energy = clamp(e.energy + (l ? l.energy : 30) * k); e.buff = 28; e.stress = clamp(e.stress + 2.5); e.mood = clamp(e.mood + (e.trait === 'kopi' ? 9 : 3));
      s.stat.cups++; s.coffeeStock = Math.max(0, s.coffeeStock - 1); if (s.coffeeStock <= 5 && s.fac.coffee && !s.inbox.some(r => r.type === 'coffee')) this.genRequest('coffee'); this.say(e, pick(['Segar! ☕', 'Nyess~', 'Energi penuh!']), 2.5); this.face(e, 'happy', 3);
      this.emit('popup', { empId: e.id, text: '⚡ Energi!', kind: 'energy' });
    } else if (a.kind === 'snack') {
      const l = this.facInfo('snack'), k = e.trait === 'kopi' || e.trait === 'ceria' ? 1.3 : 1;
      e.energy = clamp(e.energy + (l ? l.energy : 10) * k); e.mood = clamp(e.mood + (l ? l.mood : 6) * k); e.stress = clamp(e.stress - 6);
      s.stat.snacks = (s.stat.snacks || 0) + 1; s.snackStock = Math.max(0, s.snackStock - 1);
      if (s.snackStock <= 4 && s.fac.snack && !s.inbox.some(r => r.type === 'snack')) this.genRequest('snack');
      this.say(e, pick(['Nyam nyam! 🍪', 'Enak~', 'Kulkasnya top!', 'Isi tenaga 🍫']), 2.5); this.face(e, 'happy', 3);
      this.emit('popup', { empId: e.id, text: '🍪 Yummy!', kind: 'energy' });
    } else if (a.kind === 'lunch') { this.applyLunch(e, this.lunchMenuOf(a.menu)); s.stat.lunches = (s.stat.lunches || 0) + 1; this.say(e, pick(['Kenyang! 😋', 'Enak banget~', 'Alhamdulillah 🙏', 'Siap lanjut kerja!']), 2.5); this.face(e, 'happy', 3);
    } else if (a.kind === 'party') { const o = PARTY_OPTS[a.pk] || PARTY_OPTS.small; e.mood = clamp(e.mood + o.mood * (a.mult || 1)); e.stress = clamp(e.stress - o.stress * (a.mult || 1)); e.xp += o.xp; this.say(e, 'Pestanya seru banget! 🥳', 3); this.face(e, 'happy', 4);
    } else if (a.kind === 'greet') { e.mood = clamp(e.mood + 2);
    } else if (a.kind === 'gossip') { e.fails = (e.fails || 0) + 0.5; s.stat.gossips = (s.stat.gossips || 0) + 1; this.say(e, 'Eh, balik kerja deh… 😅', 2.5); this.checkSuggest();
    } else if (a.kind === 'ps') { s.stat.psPlays++; this.say(e, pick(['Seru banget!', 'Menang! 🏆', 'Stres hilang~'])); this.face(e, 'happy', 3); }
    else if (a.kind === 'pool') { s.stat.poolSwims = (s.stat.poolSwims || 0) + 1; this.say(e, pick(['Segarnya! 💦', 'Byurr~ 🏊', 'Stres larut di air…'])); this.face(e, 'happy', 3); }
    else if (a.kind === 'play') { s.stat.playPlays++; this.say(e, pick(['Hepi hepi! 🌈', 'Capek tapi senang~'])); this.face(e, 'happy', 3); }
    else if (a.kind === 'nap') { this.say(e, 'Segar lagi! 😊'); }
    else if (a.kind === 'meeting') { e.xp += 15; this.say(e, 'Rapat selesai! 💪', 2.5); }
    else if (a.kind === 'summon') { this.endSummon(e); if (e.leaving) { this.cancelActivity(e); return; } }
    const pid = a.kind === 'meeting' ? a.proj : null;
    this.cancelActivity(e);
    e.cool = 16 + rnd(0, 8);
    this.goWork(e);
    if (pid) this.meetingDone(pid);
    this.checkMissions();
  }

  // ---------- Simulasi ----------
  update(dtReal) {
    const s = this.s; if (!s || s.ended || this.blocking || s.speed === 0) return;
    let dt = Math.min(dtReal, 0.25) * s.speed * TIME_SCALE;
    while (dt > 0 && !this.blocking) { const d = Math.min(0.2, dt); this.step(d); dt -= d; }
  }

  step(dt) {
    const s = this.s;
    s.hour += dt * HOURS_PER_SEC;
    for (const e of s.employees) this.updateEmp(e, dt);
    this.promoteQueues();
    // claim otomatis
    for (const t of s.tasks) if (t.state === 'done') { t.claimT -= dt; if (t.claimT <= 0) this.claimTask(t.id, false); }
    // autopilot
    this.autoT += dt;
    if (this.autoT >= 1) {
      this.autoT = 0;
      if (s.auto) for (const e of s.employees) if (!e.leaving && !e.task && e.st === 'idle' && e.energy > 25 && e.st !== 'sick') { const t = this.autoPick(e); if (t) this.assign(t.id, e.id); }
    }
    this.tickDaily(dt);
    // tiket tambahan di tengah hari
    if (s.hour >= 12 && !this._lunchSpawn) { this._lunchSpawn = true; if (Math.random() < 0.6 && this.activeTasks() < 3 + Math.floor(s.employees.length * 1.6)) { const t = this.spawnTask(); this.toast(`Tiket baru masuk: ${t.title}`, 'info'); this.emit('sfx', 'ding'); this.emit('change'); } }
    if (!s.firstReq && s.hour >= 9.5 && s.day === 1) { s.firstReq = true; this.genRequest('repair'); }
    if (s.hour >= 17) this.endDay();
  }

  updateEmp(e, dt) {
    const s = this.s;
    e.cool = Math.max(0, e.cool - dt); e.buff = Math.max(0, e.buff - dt);
    if (e.sayT > 0) { e.sayT -= dt; if (e.sayT <= 0) e.say = null; }
    if (e.faceT > 0) { e.faceT -= dt; if (e.faceT <= 0) e.face = null; }
    if (e.quirk === 'gosip' && (e.st === 'work' || e.st === 'idle') && !e.act && !this.blocking && !this.visit && !this.party && s.lunch.state !== 'eating') { e.gT = (e.gT === undefined ? rnd(12, 35) : e.gT) - dt; if (e.gT <= 0) { e.gT = rnd(35, 75); this.startGossip(e); } }
    // dekorasi menambah mood
    if (e.mood < 92) e.mood += this.decorCount() * 0.03 * dt;

    switch (e.st) {
      case 'walk': this.moveEmp(e, dt); e.energy = clamp(e.energy - 0.25 * dt); break;
      case 'queue': e.stress = clamp(e.stress + 0.15 * dt); break;
      case 'act': this.tickAct(e, dt); break;
      case 'sick':
        e.sickT -= dt; e.energy = clamp(e.energy + 3 * dt); e.stress = clamp(e.stress - 3.2 * dt);
        if (e.sickT <= 0 && e.stress < 55) { const back = e.hidden; e.hidden = false; e.st = 'idle'; this.say(e, back ? 'Saya kembali, Bos! 👋' : 'Sudah segar lagi!'); this.goWork(e); }
        break;
      case 'work': {
        const t = e.task ? this.task(e.task) : null;
        if (!t) { e.st = 'idle'; break; }
        t.progress += this.workRate(e, t) * dt;
        const T = e.trait, hi = t.pri === 'high';
        e.energy = clamp(e.energy - 1.15 * (T === 'begadang' ? 0.72 : 1) * dt);
        e.stress = clamp(e.stress + 0.55 * (hi ? 1.4 : 1) * (T === 'rajin' ? 1.25 : T === 'santai' ? 0.6 : 1) * dt);
        if (e.stress > 60 || e.energy < 25) e.mood = clamp(e.mood - 0.14 * dt); else e.mood = clamp(e.mood - 0.05 * dt);
        if (t.progress >= t.work) { this.finishTask(t, e); break; }
        if (e.stress >= 97) { this.burnout(e); break; }
        this.decideBreak(e);
        break;
      }
      case 'idle':
        e.energy = clamp(e.energy + 0.5 * dt); e.stress = clamp(e.stress - 0.25 * dt); e.mood = clamp(e.mood - 0.07 * dt);
        if (!e.say && Math.random() < 0.004) this.say(e, pick(['Menunggu tugas… 💤', 'Ada tiket nggak, Bos?', 'Scroll medsos dulu~']), 3);
        this.decideBreak(e);
        break;
    }
  }

  burnout(e) {
    this.cancelActivity(e); this.releaseWork(e);
    const t = e.task ? this.task(e.task) : null;
    if (t) { t.state = 'new'; t.emp = null; e.task = null; }
    e.st = 'sick'; e.sickT = 14; e.mood = clamp(e.mood - 10); e.act = null;
    const d = this.goDeskPos(e); e.x = d.x; e.y = d.y; e.step = null; e.path = [];
    this.say(e, 'Burnout… 😵', 4); this.face(e, 'sleep', 14);
    this.toast(`${e.name} kelelahan & butuh istirahat! Kasih fasilitas seru ya 🥺`, 'warn');
    this.emit('sfx', 'oops');
  }

  decideBreak(e) {
    const s = this.s; if (!s.autoBreak || e.cool > 0 || this.visit || this.party) return;
    let kind = null;
    if (e.energy < 28) kind = s.fac.coffee ? 'coffee' : (e.energy < 15 ? 'nap' : null);
    if (!kind && s.fac.snack && s.snackStock > 0 && (e.energy < 50 || e.mood < 60) && Math.random() < 0.5) kind = 'snack';
    if (!kind && e.stress > 66) kind = this.bestFun(e);
    if (!kind && e.mood < 52) kind = this.bestFun(e);
    if (!kind) return;
    if (!this.requestActivity(e, kind, false)) e.cool = 6;
  }
  bestFun(e) {
    const opts = []; const s = this.s;
    if (s.fac.ps) opts.push(['ps', e.trait === 'gamer' ? 3 : 1]);
    if (s.fac.play) opts.push(['play', e.trait === 'kucing' ? 3 : 1]);
    if (s.fac.pool) opts.push(['pool', e.trait === 'santai' ? 3 : 1.5]);
    if (!opts.length) return null;
    const tot = opts.reduce((a, b) => a + b[1], 0); let x = Math.random() * tot;
    for (const [k, w] of opts) { x -= w; if (x <= 0) return k; }
    return opts[0][0];
  }

  tickAct(e, dt) {
    const a = e.act; if (!a) { e.st = 'idle'; return; }
    a.t += dt;
    const s = this.s;
    if (a.kind === 'ps') {
      const l = this.facInfo('ps'), mates = this.slots.ps.filter(Boolean).length, co = mates >= 2 ? 1.25 : 1;
      const r = (l ? l.rate : 1) * (e.trait === 'gamer' ? 1.5 : 1) * co;
      e.stress = clamp(e.stress - 3.2 * r * dt); e.mood = clamp(e.mood + 1.9 * r * dt * (e.trait === 'ceria' ? 1.3 : 1)); e.energy = clamp(e.energy - 0.25 * dt);
      if (Math.random() < 0.006 && !e.say) this.say(e, pick(['Yosh!', 'Awas awas!', 'Kena kamu~', 'Combo! 🔥']), 2);
    } else if (a.kind === 'party') {
      if (a.arrived) { e.mood = clamp(e.mood + 0.8 * dt); e.stress = clamp(e.stress - 1.2 * dt); if (Math.random() < 0.01 && !e.say) this.say(e, pick(['Woohoo! 🎉', 'Seru banget!', 'Cheers! 🥤', 'Mau nambah kue!']), 2); }
    } else if (a.kind === 'lunch' || a.kind === 'greet') {
      /* diam menikmati / menyambut */
    } else if (a.kind === 'gossip') {
      if (a.arrived) { a.lt -= dt; if (a.lt <= 0) { a.lt = rnd(1.6, 2.8); const m = this.emp(a.mate); this.say(e, pick(['Katanya Bos mau…🤫', 'Masa sih?! 😲', 'Psst psst 🗣️', 'Eh tau nggak…', 'Serius?! hihi']), 2); if (m && !m.say) this.say(m, pick(['Hah? Beneran? 😮', 'Hmm iya sih…', 'Ssst, ada Bos!']), 1.8); } e.mood = clamp(e.mood + 0.6 * dt); }
    } else if (a.kind === 'summon') { this.tickSummon(e, dt);
    } else if (a.kind === 'pool') {
      const l = this.facInfo('pool'), r = (l ? l.rate : 1) * (e.trait === 'santai' ? 1.3 : 1);
      e.stress = clamp(e.stress - 3.6 * r * dt); e.mood = clamp(e.mood + 2.4 * r * dt); e.energy = clamp(e.energy + 0.6 * dt);
      if (Math.random() < 0.006 && !e.say) this.say(e, pick(['Byurr!', 'Segar~', 'Air hangat 😌']), 2);
    } else if (a.kind === 'play') {
      const l = this.facInfo('play'), r = (l ? l.rate : 1) * (e.trait === 'kucing' ? 1.2 : 1);
      e.stress = clamp(e.stress - 2.8 * r * dt); e.mood = clamp(e.mood + 2.3 * r * dt * (e.trait === 'ceria' ? 1.3 : 1)); e.energy = clamp(e.energy + 0.8 * dt);
      if (Math.random() < 0.006 && !e.say) this.say(e, pick(['Wiii~', 'Hehe!', 'Lagi lagi!']), 2);
    } else if (a.kind === 'nap') { e.energy = clamp(e.energy + 5 * dt); e.stress = clamp(e.stress - 0.8 * dt); }
    else if (a.kind === 'meeting') { e.mood = clamp(e.mood + 0.4 * dt); e.stress = clamp(e.stress - 0.2 * dt); if (Math.random() < 0.008 && !e.say) this.say(e, pick(['Setuju! 👍', 'Ada usul…', 'Noted! ✍️', 'Hmm menarik 🤔']), 2); }
    if (a.t >= a.dur) this.endActivity(e);
  }

  moveEmp(e, dt) {
    if (!e.step) e.step = e.path.shift();
    if (!e.step) { this.arrive(e); return; }
    const st = e.step, dx = st.x - e.x, dy = st.y - e.y, d = Math.hypot(dx, dy), m = WALK * dt;
    if (d <= m) { e.x = st.x; e.y = st.y; e.step = null; if (!e.path.length) this.arrive(e); }
    else { e.x += dx / d * m; e.y += dy / d * m; if (Math.abs(dx - dy) > 0.01) e.flip = dx - dy >= 0 ? 1 : -1; }
  }

  // ---------- Upgrade sistem & keamanan ----------
  sysEff(id) { const v = this.s.sys[id]; return v && v.state === 'active' ? v.eff : 0; }
  sysBonus(key) { let t = 0; for (const [id, v] of Object.entries(this.s.sys || {})) if (v.state === 'active' && SYSTEMS[id][key]) t += SYSTEMS[id][key] * v.eff; return t; }
  sysShield(evId) { let m = 1; for (const [id, v] of Object.entries(this.s.sys || {})) if (v.state === 'active') { const sh = SYSTEMS[id].shield && SYSTEMS[id].shield[evId]; if (sh) m *= 1 - sh * v.eff; } return m; }
  sysCanBuy(id) {
    const s = this.s, S = SYSTEMS[id]; if (!S) return { ok: false, why: 'tidak ada' };
    if (s.sys[id]) return { ok: false, why: s.sys[id].state === 'active' ? 'sudah aktif' : 'sedang dipasang' };
    if (s.level < S.lvl) return { ok: false, why: `butuh level ${S.lvl}` };
    if (S.req && S.req.server && s.fac.server < S.req.server) return { ok: false, why: `butuh server level ${S.req.server}` };
    if (S.req && S.req.sys && this.sysEff(S.req.sys) <= 0) return { ok: false, why: `butuh ${SYSTEMS[S.req.sys].name}` };
    const miss = [...new Set(S.steps.map(st => deptOfSpec(st[0])))].filter(dk => !s.employees.some(e => !e.leaving && deptOfSpec(e.spec) === dk));
    if (miss.length) return { ok: false, why: 'butuh staf bidang ' + miss.map(dk => DEPTS[dk].name).join(', ') };
    if (s.money < S.cost) return { ok: false, why: 'dana kurang', money: true };
    return { ok: true };
  }
  buySystem(id) {
    const s = this.s, S = SYSTEMS[id], c = this.sysCanBuy(id); if (!c.ok) { this.toast(`Belum bisa: ${c.why} 🔒`, 'warn'); return false; }
    this.addMoney(-S.cost); s.sys[id] = { state: 'install', step: 0, q: 2.5, eff: 1 };
    this.spawnSysTask(id); this.emit('dir', { pose: 'type', text: `📝 Memesan ${S.name}…`, dur: 2.4 }); this.emit('sfx', 'buy');
    this.toast(`🛠️ Pemasangan ${S.name} dimulai (−${fmtMoney(S.cost)}). Kerjakan tiketnya di tab Tugas!`, 'info'); this.addLog(`Mulai pasang ${S.name}.`); this.emit('change'); return true;
  }
  spawnSysTask(id) {
    const s = this.s, S = SYSTEMS[id], v = s.sys[id], [spec, title, work] = S.steps[v.step], lv = s.level - 1;
    s.tasks.push({ id: nid('T'), title: `${S.name}: ${title}`, sub: `Upgrade sistem · tahap ${v.step + 1}/${S.steps.length}`, spec, work: Math.round(work * (1 + lv * 0.03)), reward: 0, xp: 90, onsite: spec === 'ops', sec: 0, pri: 'high', deadline: s.day + 6, state: 'new', progress: 0, emp: null, late: 0, sys: id });
    this.emit('change');
  }
  systemStepDone(t) {
    const s = this.s, v = s.sys[t.sys], S = SYSTEMS[t.sys]; if (!v) return;
    const e = this.emp(t.doneBy);
    v.q += t.q === 'perfect' ? 0.8 : t.q === 'bug' ? -0.8 : 0.3; if (e && e.skill < 55) v.q -= 0.3; if (e && e.spec === t.spec) v.q += 0.1;
    v.step++;
    if (v.step < S.steps.length) { this.toast(`✅ Tahap ${v.step}/${S.steps.length} ${S.name} selesai. Tahap berikutnya masuk di Tugas.`, 'good'); this.spawnSysTask(t.sys); return; }
    v.state = 'ready'; const stars = v.q >= 3.6 ? 'sangat baik ⭐⭐⭐' : v.q >= 2.6 ? 'baik ⭐⭐' : 'kurang ⭐';
    this.addRequest({ type: 'sysgo', sys: t.sys, icon: S.emoji, from: null, sender: 'Tim Infrastruktur', title: `${S.name} siap diaktifkan?`, body: `Pemasangan selesai dengan kualitas ${stars} (${v.q.toFixed(1)}). Aktifkan langsung berisiko bila kualitas rendah. Uji penerimaan 2 hari menaikkan kualitas & menekan risiko.`, opts: [{ k: 'uat', label: 'Uji penerimaan dulu (2 hari)', cost: r1(4 * this.costMul()) }, { k: 'go', label: v.q < 2.6 ? '⚠️ Aktifkan langsung (berisiko)' : 'Aktifkan langsung', cost: 0 }], ttl: 4 });
  }
  systemStepFailed(t) {
    const s = this.s, v = s.sys[t.sys]; if (!v) return;
    v.q -= 0.8; this.toast(`⏰ Tahap pemasangan ${SYSTEMS[t.sys].name} terlambat — kualitas turun, tiket dibuat ulang`, 'warn'); this.spawnSysTask(t.sys);
  }
  systemActivate(id, k) {
    const s = this.s, v = s.sys[id], S = SYSTEMS[id]; if (!v) return;
    if (k === 'uat') { v.state = 'testing'; v.left = 2; v.q += 1.0; this.toast(`🧪 Uji penerimaan ${S.name} berjalan 2 hari…`, 'info'); return; }
    this.systemGoLive(id, 1);
  }
  systemGoLive(id, riskMul) {
    const s = this.s, v = s.sys[id], S = SYSTEMS[id], chance = Math.max(0, Math.min(0.7, 0.7 - 0.2 * v.q)) * riskMul;
    v.state = 'active';
    if (S.setServer) { s.fac.server = Math.max(s.fac.server, S.setServer); this.resizeSlots(); }
    if (Math.random() < chance) {
      v.eff = 0.55; this.addStat('service', -9); this.addStat('risk', 8); this.addMoney(-6 * this.costMul());
      this.penalize(`aktivasi ${S.name} bermasalah`, 4, 0.88, 6);
      this.toast(`💥 Aktivasi ${S.name} bermasalah! Misconfig menurunkan layanan & efektivitas sistem hanya 55%.`, 'bad');
    } else { v.eff = Math.min(1, 0.6 + 0.15 * v.q); this.toast(`✅ ${S.name} aktif${v.eff < 1 ? ` (efektivitas ${Math.round(v.eff * 100)}%)` : ' penuh'}!`, 'good'); this.emit('fx', { kind: 'confetti' }); }
    this.addXp(80); this.addLog(`${S.name} aktif.`); this.emit('change');
  }
  // Salah kelola → kinerja tim menurun beberapa hari
  penalize(why, days, mult, mood) {
    const s = this.s; s.debuff = { left: Math.max(days, s.debuff ? s.debuff.left : 0), mult: Math.min(mult, s.debuff && s.debuff.left > 0 ? s.debuff.mult : 1), why };
    s.employees.forEach(e => { e.mood = clamp(e.mood - (mood || 4)); e.stress = clamp(e.stress + 5); });
    this.emit('banner', { text: '⚠️ Kinerja Tim Menurun', sub: why }); this.addLog(`Kinerja turun: ${why}.`);
  }
  // ---------- Kesiapan proyek ----------
  projReadiness(p) {
    const s = this.s, items = [
      { ok: !(p.missing && p.missing.length), label: 'Kick-off melibatkan semua bidang' },
      { ok: p.q >= 2.5, label: `Kualitas pengerjaan ≥ 2,5 (sekarang ${p.q.toFixed(1)})` },
      { ok: !p.rushed, label: 'Proyek tidak dikebut' },
      { ok: !p.lateFlag, label: 'Tidak ada fase yang terlambat' },
      { ok: s.security >= 50 && s.risk <= 60, label: 'Keamanan ≥ 50 & risiko ≤ 60' }
    ], ok = items.filter(i => i.ok).length;
    return { items, ok, total: items.length, risk: (1 - ok / items.length) * 0.9 + (p.rushed ? 0.1 : 0) };
  }
  requestGoLive(p) {
    const rd = this.projReadiness(p), ready = rd.ok === rd.total;
    this.addRequest({ type: 'golive', proj: p.id, icon: '🚀', from: null, sender: 'Direksi', title: `Siap Go-Live? ${p.name}`,
      body: `Checklist kesiapan ${rd.ok}/${rd.total}: ${rd.items.map(i => (i.ok ? '✅ ' : '❌ ') + i.label).join(' · ')}. ${ready ? 'Semua siap — luncurkan!' : `Go-Live sekarang berisiko (~${Math.round(rd.risk * 100)}% bermasalah & kinerja tim turun). Sebaiknya tunda dan perbaiki dulu.`}`,
      opts: [{ k: 'go', label: ready ? 'Go-Live!' : '⚠️ Go-Live Nekat', cost: 0 }, { k: 'party', label: 'Syukuran + Go-Live', cost: 4 }, ...(this.s.fac.hall ? [{ k: 'hall', label: '🎊 Pesta di Aula + Go-Live', cost: 6 }] : []), { k: 'delay', label: 'Tunda & uji regresi (tiket tambahan)', cost: r1(2 * this.costMul()) }], ttl: 3 });
  }
  // ---------- Keuangan & kesulitan ----------
  diffInfo() { return DIFFS[this.s.diff] || DIFFS.normal; }
  econInfo() { const e = this.s.econ; return e && e.left > 0 ? ECONS[e.id] : null; }
  incomeMul() { const e = this.econInfo(); return this.diffInfo().income * (e ? e.reward : 1) * (1 + this.sysBonus('income')); }
  costMul() { return this.diffInfo().evt * (1 + 0.04 * (this.s.level - 1)); }
  salaryTotal() { return r1(this.s.employees.reduce((a, e) => a + e.salary, 0)); }
  overhead() {
    const s = this.s; let up = 0;
    for (const [k, l] of Object.entries(s.fac)) up += (l || 0) * (k === 'server' ? 0.35 : k === 'pool' || k === 'hall' ? 0.3 : k === 'dining' ? 0.2 : 0.15);
    const e = this.econInfo(), sur = s.surcharge && s.surcharge.left > 0 ? s.surcharge.amt : 0;
    const sy = Object.entries(s.sys || {}).reduce((a, [k, v]) => a + (v.state === 'active' ? SYSTEMS[k].upkeep : 0), 0);
    return r1(((1.0 + 0.25 * s.employees.length + 0.06 * this.totalDesks() + up + sy) * (1 + 0.02 * (s.level - 1))) * this.diffInfo().over * (e ? e.over : 1) + sur);
  }
  debtPay() { return Math.min(this.s.debt || 0, 2.5); }
  dailyCost() { return r1(this.salaryTotal() + this.overhead() + this.debtPay()); }
  runway() { const c = this.dailyCost(); return c > 0 ? Math.max(0, Math.floor(this.s.money / c)) : 99; }
  bankrupt(why) {
    const s = this.s; if (s.ended) return; s.ended = true;
    this.emit('sfx', 'lose'); this.addLog('BANGKRUT: ' + why);
    this.emit('gameover', { day: s.day, level: s.level, projects: s.stat.projects || 0, tasks: s.stat.tasksDone || 0, staff: s.employees.length, why, bank: s.bank });
  }
  // ---------- Hari ----------
  endDay() {
    const s = this.s, prevDay = s.day;
    this._lunchSpawn = false;
    // gaji
    const salary = r1(s.employees.reduce((a, e) => a + e.salary, 0)), over = this.overhead(), pay = this.debtPay();
    this.addMoney(-salary); this.addMoney(-over, 'quiet'); if (pay) { this.addMoney(-pay, 'quiet'); s.debt = r1(s.debt - pay); }
    let tax = 0; if (s.day % 7 === 0) { tax = r1(Math.max(1.5, Math.max(0, s.money) * 0.05) * this.diffInfo().over); this.addMoney(-tax, 'quiet'); this.toast(`🧾 Pajak & iuran regulator mingguan: −${fmtMoney(tax)}`, 'warn'); }
    if (s.surcharge) { s.surcharge.left--; if (s.surcharge.left <= 0) { s.surcharge = null; this.toast('📄 Kenaikan biaya vendor berakhir.', 'info'); } }
    this.toast(`📉 Biaya hari ini: gaji ${fmtMoney(salary)} + operasional ${fmtMoney(over)}${pay ? ` + cicilan ${fmtMoney(pay)}` : ''}${tax ? ` + pajak ${fmtMoney(tax)}` : ''}`, 'info');
    if (s.money < 0) {
      s.employees.forEach(e => e.mood = clamp(e.mood - 12));
      if (s.money < -15) {
        if (s.bailouts < this.diffInfo().bail) { s.bailouts++; s.money = r1(s.money + 25); s.debt = r1((s.debt || 0) + 32); s.risk = clamp(s.risk + 8); this.addStat('service', -6); this.toast('🏦 Pinjaman darurat Rp 25 jt dari kantor pusat (utang Rp 32 jt, dicicil Rp 2,5 jt/hari). Hati-hati! 😰', 'warn'); this.addLog('Pinjaman darurat dari kantor pusat.'); }
        else { this.bankrupt(`kas habis (${fmtMoney(s.money)}) dan tidak ada lagi dana darurat`); return; }
      }
    } else if (s.money < this.dailyCost() * 2) this.toast('⚠️ Kas tipis! Biaya harian hampir menghabiskan sisa dana.', 'warn');
    // kondisi ekonomi berganti
    if (s.econ) { s.econ.left--; if (s.econ.left <= 0) { s.econ = null; this.toast('🌤️ Kondisi ekonomi kembali normal.', 'info'); } }
    if (!s.econ && s.day >= 4 && Math.random() < 0.28) { const id = Math.random() < 0.18 ? 'boom' : pick(['resesi', 'inflasi']); s.econ = { id, left: ECONS[id].days }; this.toast(`${ECONS[id].emoji} ${ECONS[id].name}! ${ECONS[id].desc}`, id === 'boom' ? 'good' : 'bad'); this.emit('banner', { text: `${ECONS[id].emoji} ${ECONS[id].name}`, sub: ECONS[id].desc }); this.addLog(`Ekonomi: ${ECONS[id].name}.`); }
    // tenggat
    let overdue = 0;
    for (const t of [...s.tasks]) {
      if ((t.state === 'new' || t.state === 'doing') && s.day >= t.deadline) {
        if (t.late === 0) { if (t.proj) { const pp = this.s.projects.find(x => x.id === t.proj); if (pp) pp.lateFlag = true; } const le = this.emp(t.emp); if (le) le.fails = (le.fails || 0) + 1; t.late = 1; t.deadline = s.day + 1; this.addStat('service', -3); this.addStat('risk', 2.5); this.addMoney(-0.5, 'quiet'); overdue++; this.toast(`⏰ Tiket "${t.title}" telat!`, 'warn'); }
        else { // batal
          const e = this.emp(t.emp); if (e) { e.fails = (e.fails || 0) + 1.5; e.task = null; this.releaseWork(e); this.goWork(e); }
          s.tasks = s.tasks.filter(x => x.id !== t.id); this.addStat('service', -6); this.addStat('risk', 5); this.addMoney(-1.5); overdue++;
          if (t.proj) this.projectTaskFailed(t);
          if (t.sys) this.systemStepFailed(t);
          this.toast(`💔 Tiket "${t.title}" dibatalkan karena terlambat`, 'bad'); this.addLog('Tiket dibatalkan karena telat.');
        }
      }
    }
    this.checkSuggest(); this.checkLoad();
    // drift stat harian
    const sv = this.facInfo('server');
    this.addStat('security', -1.2); if (sv && sv.sec) this.boost('security', sv.sec * 1.5);
    { const ss = this.sysBonus('sec'), sr = this.sysBonus('risk'); if (ss) this.boost('security', ss * 1.5); if (sr) this.cut('risk', sr); }
    for (const [id, v] of Object.entries(s.sys)) if (v.state === 'testing') { v.left--; if (v.left <= 0) this.systemGoLive(id, 0.3); }
    if (s.debuff) { s.debuff.left--; if (s.debuff.left <= 0) { s.debuff = null; this.toast('💪 Kinerja tim pulih kembali.', 'good'); } }
    this.addStat('risk', (70 - s.security) * 0.05 + 0.9);
    if (!overdue && s.tasks.every(t => t.late === 0)) this.addStat('service', -0.5); else this.addStat('service', -1.8);
    if (this.sysBonus('svc')) this.boost('service', this.sysBonus('svc'));
    // proyek yang tak pernah di-kick-off sampai tenggat
    for (const p of [...s.projects]) if (p.state === 'plan' && s.day >= p.deadline) { s.projects = s.projects.filter(x => x.id !== p.id); this.addStat('service', -2); this.toast(`⌛ Proyek ${p.name} batal karena tak pernah di-kick-off`, 'bad'); this.addLog(`Proyek ${p.name} batal.`); }
    // permintaan yang tak diputuskan sampai tenggat
    for (const r of [...s.inbox]) if (s.day >= r.deadline) this.expireRequest(r);
    // hari baru
    s.day++; s.hour = 8; this.visit = null; this.party = null; s.lunch = { day: s.day, state: 'none', menu: null, cost: 0 };
    if (this.stars() >= 5) { s.starDays++; } else s.starDays = 0;
    // tiket baru
    const n = 1 + Math.floor(s.employees.length * 0.6) + (Math.random() < 0.4 ? 1 : 0);
    const cap = 3 + Math.floor(s.employees.length * 1.6);
    let added = 0;
    for (let i = 0; i < n && this.activeTasks() < cap; i++) { this.spawnTask(); added++; }
    this.genCandidates();
    if (s.day >= 2 && s.inbox.length < 4 && Math.random() < 0.62) this.genRequest();
    // harian karyawan: pulih sedikit tiap pagi
    s.employees.forEach(e => { e.energy = clamp(e.energy + 18); e.stress = clamp(e.stress - 8); });
    this.addLog(`Hari baru! Biaya −${fmtMoney(salary + over)}, ${added} tiket baru.`);
    this.emit('newday', { day: s.day, salary, added });
    this.emit('sfx', 'newday');
    this.checkMissions();
    // risiko tinggi → inspeksi
    if (s.risk >= 92) {
      s.risk = 58; this.addMoney(-12); this.addStat('service', -8);
      this.toast('🚨 Pemeriksaan OJK mendadak! Denda Rp 12 jt. Perkuat kontrol & keamanan!', 'bad'); this.addLog('Kena denda inspeksi OJK.');
    }
    // laporan mingguan
    if (prevDay % 7 === 0) this.makeReport(prevDay);
    // acak event
    s.eventCool--;
    if (!this.report && s.eventCool <= 0 && s.day >= 2) this.rollEvent();
    this.save();
    this.emit('change');
  }

  makeReport(prevDay) {
    const s = this.s, w = s.week;
    const mvp = [...s.employees].sort((a, b) => b.wTasks - a.wTasks)[0];
    const happy = [...s.employees].sort((a, b) => b.mood - a.mood)[0];
    this.report = { week: prevDay / 7, income: w.income, expense: w.expense, tasks: w.tasks, mvp: mvp && mvp.wTasks ? mvp.id : null, happy: happy ? happy.id : null, stars: this.stars() };
    s.week = { income: 0, expense: 0, tasks: 0 };
    s.employees.forEach(e => e.wTasks = 0);
    this.blocking = true;
    this.emit('report', this.report);
  }
  closeReport() { this.report = null; this.blocking = false; if (!this.pending && this.s.eventCool <= 0) this.rollEvent(); }

  // ---------- Event acak ----------
  rollEvent() {
    const s = this.s;
    const pool = EVENTS.filter(ev => ev.can(this));
    if (!pool.length) return;
    const p = 0.55 + s.risk / 250;
    if (Math.random() > p) { s.eventCool = 1; return; }
    const wt = ev => ev.weight(this) * this.sysShield(ev.id);
    const tot = pool.reduce((a, ev) => a + wt(ev), 0);
    let x = Math.random() * tot, chosen = pool[0];
    for (const ev of pool) { x -= wt(ev); if (x <= 0) { chosen = ev; break; } }
    s.eventCool = ri(2, 3);
    this.pending = chosen.build(this);
    this.blocking = true;
    this.emit('event', this.pending);
    this.emit('sfx', 'alert');
  }
  resolveEvent(idx, extra) {
    const ev = this.pending; if (!ev) return null;
    const ch = ev.choices[idx]; if (!ch) return null;
    if (ch.cost && this.s.money < ch.cost) { this.toast('Dana tidak cukup untuk pilihan ini 🥲', 'warn'); return null; }
    const res = ch.run(this, extra || {}) || { text: 'Selesai.', good: true };
    this.pending = null; this.blocking = false;
    this.s.stat.events++;
    this.addLog(`${ev.title} — ${res.text}`.slice(0, 90));
    this.checkMissions(); this.emit('change');
    return res;
  }

  // ---------- Rekrut ----------
  genCandidates() {
    const s = this.s, used = s.employees.map(e => e.name), list = [];
    const boost = Math.min(10, s.level);
    const needD = this.loadAdvice().map(x => x.dept);
    const specs = [...SPEC_KEYS].sort(() => Math.random() - 0.5).sort((a, b) => needD.includes(deptOfSpec(b)) - needD.includes(deptOfSpec(a)));
    const fem = [Math.random() < 0.4, Math.random() < 0.4, Math.random() < 0.4]; if (fem.every(Boolean)) fem[Math.floor(Math.random() * 3)] = false;   // minimal 1 cowok
    for (let i = 0; i < 3; i++) { const c = makeEmployee(specs[i], rollRarity(boost), used, fem[i]); c.cost = r1(c.salary * 6); list.push(c); used.push(c.name); }
    s.candidates = list; this.checkSuggest();
  }
  rerollCandidates() {
    const cost = 1.5; if (this.s.money < cost) { this.toast('Dana tidak cukup 🥲', 'warn'); return false; }
    this.addMoney(-cost); this.genCandidates(); this.emit('sfx', 'pop'); this.emit('change'); return true;
  }
  // Acak ulang penampilan (opsional ganti jenis kelamin) untuk karyawan atau calon karyawan
  regenLook(id, female) {
    const c = this.emp(id) || this.s.candidates.find(x => x.id === id); if (!c) return null;
    if (female !== undefined) c.female = !!female;
    c.look = genLook(c.female); this.emit('sfx', 'pop'); this.emit('change'); return c;
  }
  cleanName(n, fallback) { n = String(n || '').replace(/\s+/g, ' ').trim().slice(0, 14); return n || fallback; }
  rename(id, name) {
    const e = this.emp(id); if (!e) return false;
    e.name = this.cleanName(name, e.name); this.addLog(`Karyawan diberi nama ${e.name}.`); this.emit('sfx', 'pop'); this.emit('change'); return true;
  }
  // ---------- Tim awal: pilih & beri nama staf untuk tiap bidang ----------
  starterPool(dept, used = []) {
    const sp = DEPTS[dept].specs, fem = [Math.random() < 0.4, Math.random() < 0.4, Math.random() < 0.4]; if (fem.every(Boolean)) fem[Math.floor(Math.random() * 3)] = false;
    const specs = [sp[0], sp[1], sp[Math.random() < 0.5 ? 0 : 1]], out = [], names = [...used];
    specs.forEach((spec, i) => { const x = Math.random(), rar = x < 0.5 ? 'N' : x < 0.9 ? 'R' : 'SR'; const c = makeEmployee(spec, rar, names, fem[i]); names.push(c.name); out.push(c); });
    return out;
  }
  addStarter(c, name) {
    const s = this.s, e = JSON.parse(JSON.stringify(c)); delete e.cost;
    e.name = this.cleanName(name, c.name); e.desk = this.freeDesk(c.spec); if (e.desk < 0) return false;
    e.mood = 88; e.energy = 92; s.employees.push(e); this.initEmpRuntime(e);
    this.addLog(`${e.name} bergabung sebagai ${SPECS[e.spec].name}.`); this.emit('sfx', 'hire'); this.emit('change'); return true;
  }
  // Saran untuk Kepala Divisi: beri Surat Peringatan (SP) atau pecat, berdasarkan kinerja
  suggestFor(e) {
    if (!e || e.leaving) return null;
    const f = e.fails || 0, sp = e.sp || 0;
    if (sp >= 3 || (sp >= 2 && f >= 1)) return { kind: 'fire', why: sp >= 3 ? 'sudah menerima SP 3×' : 'SP 2× dan kinerja masih buruk' };
    if (f >= 2) return { kind: 'sp', why: e.quirk === 'gosip' ? 'suka bergosip & kerja tersendat' : e.quirk === 'lambat' ? 'lambat kerja' : 'sering telat / banyak bug' };
    const bc = this.betterCand(e), mates = this.s.employees.filter(x => !x.leaving && deptOfSpec(x.spec) === deptOfSpec(e.spec)).length;
    if (bc && mates > 1 && (this.perfLevel(e) === 'bad' || bc.skill >= e.skill + 18)) return { kind: 'fire', why: `ada kandidat lebih pro: ${bc.name} (skill ${bc.skill} vs ${e.skill})` };
    return null;
  }
  checkSuggest() {
    for (const e of this.s.employees) {
      if (e.leaving) continue;
      const sg = this.suggestFor(e), k = sg ? sg.kind : '';
      if ((e.suggK || '') !== k) { e.suggK = k; if (k) { this.toast(`💡 Saran: ${e.name} ${k === 'fire' ? 'sebaiknya dipecat' : 'perlu Surat Peringatan'} (${sg.why})`, 'warn'); this.emit('sfx', 'alert'); this.emit('change'); } }
    }
  }
  // ---------- Makan siang di Ruang Makan ----------
  lunchMenuOf(id) { return LUNCH_MENUS.find(m => m.id === id); }
  lunchDisc() { const l = this.facInfo('snack'); return l && l.disc ? l.disc : 0; }
  lunchDiners() { return this.s.employees.filter(e => !e.leaving && !e.hidden && !e.onLeave && e.st !== 'sick'); }
  lunchCost(id) { const m = this.lunchMenuOf(id); return m ? r2(this.lunchDiners().length * m.cost * (1 - this.lunchDisc())) : 0; }
  lunchDish() { return DISHES[this.s.day % DISHES.length]; }
  orderLunch(id) {
    const s = this.s, L = s.lunch, m = this.lunchMenuOf(id); if (!m || L.day !== s.day) return false;
    const c = this.lunchCost(id); if (c > s.money) { this.toast('Dana tidak cukup untuk menu itu 🥲', 'warn'); return false; }
    L.menu = id; L.state = 'ordered'; L.est = c;
    this.emit('dir', { pose: 'type', text: '📝 Memesan makan siang…', dur: 2 });
    this.toast(`🍽️ ${m.emoji} ${m.name} dipesan. Biaya ${fmtMoney(c)} dipotong saat jam makan siang (12:00).`, 'info'); this.emit('change'); return true;
  }
  applyLunch(e, m) { if (!m) return; e.energy = clamp(e.energy + m.energy); e.mood = clamp(e.mood + m.mood); e.stress = clamp(e.stress + m.stress); }
  startLunch() {
    const s = this.s, L = s.lunch, m = this.lunchMenuOf(L.menu); if (!m) { L.state = 'done'; return; }
    L.state = 'eating'; const list = this.lunchDiners(), cost = r2(list.length * m.cost * (1 - this.lunchDisc()));
    if (cost) { this.addMoney(-cost); s.stat.lunchSpent = r2((s.stat.lunchSpent || 0) + cost); }
    L.cost = cost; this.emit('sfx', 'ding');
    this.toast(`🍽️ Makan siang ${m.emoji} ${m.name}: −${fmtMoney(cost)} untuk ${list.length} karyawan`, 'info'); this.addLog(`Makan siang ${m.name} (−${fmtMoney(cost)}).`);
    let idx = 0;
    for (const e of list) {
      if (e.act && ['summon', 'meeting', 'greet', 'party'].includes(e.act.kind)) { this.applyLunch(e, m); continue; }
      if (idx >= 21 * (s.fac.dining || 1)) { this.applyLunch(e, m); this.say(e, 'Makan di meja 🍱', 2.5); continue; }
      this.cancelActivity(e); this.releaseWork(e);
      const sp = DINE_SEATS[idx++]; e.act = { kind: 'lunch', t: 0, dur: ACT_DUR.lunch, arrived: false, menu: m.id };
      this.setPath(e, sp.x, sp.y, 'act'); this.say(e, 'Makan siang! 🍽️', 2.5);
    }
    this.emit('change');
  }
  // ---------- Pesta di Aula ----------
  startParty(pk) {
    const s = this.s, o = PARTY_OPTS[pk]; if (!s.fac.hall || !o) return false;
    const mult = this.facInfo('hall').party || 1; this.party = { pk, t: 0 };
    let i = 0;
    for (const e of this.lunchDiners()) {
      if (e.act && ['summon', 'meeting'].includes(e.act.kind)) continue;
      this.cancelActivity(e); this.releaseWork(e);
      const hs = hallSlots(s.fac.hall), sp = hs[i++ % hs.length]; e.act = { kind: 'party', t: 0, dur: ACT_DUR.party, arrived: false, pk, mult };
      this.setPath(e, sp.x, sp.y, 'act');
    }
    s.stat.parties = (s.stat.parties || 0) + 1;
    this.emit('fx', { kind: 'confetti' }); this.emit('sfx', 'win'); this.emit('banner', { text: '🎊 PESTA!', sub: 'Semua karyawan menuju Ruang Aula' });
    this.toast('🎊 Pesta di Ruang Aula dimulai! Semua karyawan merayakan.', 'good'); this.addLog('Pesta di Ruang Aula.'); return true;
  }
  // ---------- Kunjungan Direksi ----------
  startVisit() {
    const s = this.s; if (this.visit || this.party || !s.employees.length) return false;
    const mk = i => ({ id: 'G' + i, look: { ...genLook(i === 1), acc: 'none' }, female: i === 1, x: ENTRY.x, y: ENTRY.y, path: [], flip: 1, walking: false, delay: i * 1.0, name: i === 1 ? 'Bu Direksi' : 'Pak Direksi' });
    this.visit = { phase: 'gather', t: 0, guests: [mk(0), mk(1)], released: false };
    for (const e of this.lunchDiners()) {
      if (e.act && ['summon', 'meeting'].includes(e.act.kind)) continue;
      this.cancelActivity(e); this.releaseWork(e);
    }
    let i = 0;
    for (const e of this.lunchDiners()) {
      if (e.act && ['summon', 'meeting'].includes(e.act.kind)) continue;
      const sp = GREET_SLOTS[i++ % GREET_SLOTS.length]; e.act = { kind: 'greet', t: 0, dur: 99999, arrived: false };
      this.setPath(e, sp.x, sp.y, 'act');
    }
    s.visits = (s.visits || 0) + 1;
    this.emit('sfx', 'alert'); this.emit('banner', { text: '🏛️ DIREKSI DATANG!', sub: 'Seluruh karyawan menyambut di dekat pintu' });
    this.emit('dir', { pose: 'wave', text: 'Direksi tiba! Ayo sambut! 🏛️', dur: 3.5 });
    this.toast('🏛️ Direksi datang berkunjung! Semua karyawan berbaris menyambut.', 'info'); this.addLog('Direksi berkunjung.'); return true;
  }
  moveGuest(gu, dt, v) {
    if (v.t < gu.delay || !gu.path.length) { gu.walking = false; return; }
    const st = gu.path[0], dx = st.x - gu.x, dy = st.y - gu.y, d = Math.hypot(dx, dy), sp = 1.9 * dt; gu.walking = true;
    if (d <= sp) { gu.x = st.x; gu.y = st.y; gu.path.shift(); } else { gu.x += dx / d * sp; gu.y += dy / d * sp; gu.flip = dx - dy >= 0 ? 1 : -1; }
  }
  releaseGreeters() { for (const e of this.s.employees) if (e.act && e.act.kind === 'greet') e.act.t = e.act.dur; }
  visitEvaluate() {
    const s = this.s, score = 0.4 * this.avgMood() / 100 + 0.3 * s.service / 100 + 0.3 * (1 - s.risk / 100);
    if (score >= 0.7) { const b = r1(4 + s.level * 0.6); this.addMoney(b); this.addXp(70); this.boost('service', 2); s.employees.forEach(e => { e.mood = clamp(e.mood + 4); this.say(e, 'Direksi puas! 😄', 3); });
      this.emit('banner', { text: '🏛️ Direksi Puas! ⭐', sub: `Apresiasi +${fmtMoney(b)}` }); this.emit('fx', { kind: 'confetti' }); this.emit('dir', { pose: 'cheer', text: 'Terima kasih, Direksi! 🙇', face: 'happy', dur: 3 }); this.toast(`🏛️ Direksi puas dengan kantor TI! Apresiasi ${fmtMoney(b)}.`, 'good'); }
    else if (score >= 0.55) { this.addMoney(2); this.addXp(30); this.emit('dir', { pose: 'wave', text: 'Terima kasih atas kunjungannya 🙏', dur: 3 }); this.toast('🏛️ Direksi cukup puas. Apresiasi Rp 2 jt.', 'info'); }
    else { this.addStat('risk', 3); this.addStat('service', -2); s.employees.forEach(e => { e.mood = clamp(e.mood - 5); }); this.emit('dir', { pose: 'wave', text: 'Kami akan perbaiki… 😓', face: 'stress', dur: 3 }); this.toast('🏛️ Direksi kurang puas (mood tim, layanan & risiko perlu dibenahi).', 'bad'); }
    this.addLog('Evaluasi Direksi selesai.');
  }
  tickVisit(dt) {
    const v = this.visit; if (!v) return; v.t += dt; const G = v.guests;
    if (v.phase === 'gather') {
      const gr = this.s.employees.filter(e => e.act && e.act.kind === 'greet'), ready = gr.filter(e => e.act.arrived).length;
      if (v.t >= 3 && (ready >= gr.length * 0.85 || v.t >= 10)) {
        v.phase = 'walk'; v.t = 0;
        const base = [{ x: 6.6, y: 1.0 }, { x: 6.6, y: C1_Y }, { x: 17.4, y: C1_Y }]; G[0].path = [...base, { x: 18.2, y: 4.3 }]; G[1].path = [...base, { x: 19.6, y: 4.3 }];
        this.emit('dir', { pose: 'wave', text: 'Selamat datang, Direksi! 🙏', dur: 3 });
      }
    } else if (v.phase === 'walk') {
      G.forEach(gu => this.moveGuest(gu, dt, v));
      if (!v.released && G.every(gu => gu.path.length <= 2)) { v.released = true; this.releaseGreeters(); }
      if (G.every(gu => !gu.path.length)) { v.phase = 'meet'; v.t = 0; if (!v.released) this.releaseGreeters(); this.emit('dir', { pose: 'wave', text: 'Silakan, Bapak/Ibu Direksi 🙏', dur: 3 }); }
    } else if (v.phase === 'meet') {
      if (v.t >= 11) { this.visitEvaluate(); v.phase = 'leave'; v.t = 0; const back = [{ x: 17.4, y: C1_Y }, { x: 6.6, y: C1_Y }, { x: ENTRY.x, y: ENTRY.y }]; G[0].path = back.map(p => ({ ...p })); G[1].path = back.map(p => ({ ...p })); }
    } else if (v.phase === 'leave') {
      G.forEach(gu => this.moveGuest(gu, dt, v));
      if (G.every(gu => !gu.path.length)) this.visit = null;
    }
  }
  // Pastikan permintaan isi ulang stok selalu muncul di Inbox (sekali per hari) saat stok menipis
  ensureRestock() {
    const s = this.s; s.restockDay = s.restockDay || {};
    for (const [k, fac, stock] of [['coffee', 'coffee', s.coffeeStock], ['snack', 'snack', s.snackStock]]) {
      if (s.fac[fac] && stock <= (k === 'snack' ? 4 : 5) && s.restockDay[k] !== s.day && !s.inbox.some(r => r.type === k) && s.employees.length) { s.restockDay[k] = s.day; this.genRequest(k); }
    }
  }
  tickDaily(dt) {
    const s = this.s, L = s.lunch;
    this._rsT = (this._rsT || 0) + dt; if (this._rsT > 3) { this._rsT = 0; this.ensureRestock(); }
    if (L.day !== s.day) { s.lunch = { day: s.day, state: 'none', menu: null, cost: 0 }; return; }
    if (this.party && !s.employees.some(e => e.act && e.act.kind === 'party')) this.party = null;
    if (this.visit) this.tickVisit(dt);
    // menu makan siang: tanya pemain pukul 10:30
    if (s.hour >= 10.5 && L.state === 'none' && s.employees.length) { L.state = 'asked'; this.emit('lunchmenu', {}); }
    if (s.hour >= 12 && L.state === 'asked') { L.state = 'done'; this.toast('🥪 Menu makan siang belum dipilih — karyawan bawa bekal sendiri.', 'warn'); }
    if (s.hour >= 12 && L.state === 'ordered' && !this.visit && !this.party) this.startLunch();
    if (L.state === 'eating' && !s.employees.some(e => e.act && e.act.kind === 'lunch')) L.state = 'done';
    // kunjungan Direksi: peluang acak tiap pagi
    if (s.vRoll !== s.day && s.hour >= 9.3) {
      s.vRoll = s.day;
      const p = s.day >= 8 && !s.visits ? 1 : s.day >= 4 ? 0.22 : 0;
      if (p && Math.random() < p && !this.visit && !this.party && !this.blocking) this.startVisit();
    }
  }
  perfLevel(e) { const f = e.fails || 0, sp = e.sp || 0; return f >= 2 || sp >= 2 ? 'bad' : f >= 1 || sp >= 1 || e.quirk ? 'warn' : 'good'; }
  // Perilaku: staf suka gosip meninggalkan meja & menghampiri rekan
  startGossip(e) {
    const mates = this.s.employees.filter(x => x !== e && !x.leaving && !x.hidden && !x.onLeave && (x.st === 'work' || x.st === 'idle') && !x.act);
    if (!mates.length) return false;
    const m = pick(mates); this.cancelActivity(e); this.releaseWork(e);
    e.act = { kind: 'gossip', t: 0, dur: ACT_DUR.gossip, arrived: false, mate: m.id, lt: 0 };
    const d = deskPos(m.desk); this.setPath(e, d.x + 0.8, d.y + 0.1, 'act'); this.say(e, 'Eh eh, sini deh… 🤫', 2.5); return true;
  }
  fireCost(e) { return r1(e.salary * 3); }
  fire(id) {
    const s = this.s, e = this.emp(id); if (!e || e.leaving) return false;
    if (s.employees.filter(x => !x.leaving).length <= 1) { this.toast('Minimal harus ada 1 karyawan di divisi 🥺', 'warn'); return false; }
    if (s.employees.filter(x => !x.leaving && deptOfSpec(x.spec) === deptOfSpec(e.spec)).length <= 1) { this.toast(`Bidang ${DEPTS[deptOfSpec(e.spec)].name} harus punya minimal 1 karyawan. Rekrut pengganti dulu 🥺`, 'warn'); return false; }
    const c = this.fireCost(e); if (s.money < c) { this.toast(`Dana pesangon kurang (${fmtMoney(c)}) 🥲`, 'warn'); return false; }
    this.addMoney(-c);
    const meetProj = e.act && e.act.kind === 'meeting' ? e.act.proj : null;
    this.cancelActivity(e); this.releaseWork(e); if (meetProj) this.meetingDone(meetProj);
    const t = e.task && this.task(e.task); if (t) { t.state = 'new'; t.emp = null; t.progress = Math.max(0, t.progress * 0.5); }
    e.task = null; e.claimBubble = null; e.leaving = true; e.desk = -1;
    for (const tk of s.tasks) if (tk.state === 'done' && tk.doneBy === e.id) tk.doneBy = null;
    s.inbox = s.inbox.filter(r => r.from !== e.id);
    s.employees.forEach(x => { if (x !== e) x.mood = clamp(x.mood - 4); });
    this.emit('dir', { pose: 'type', text: '📄 Menandatangani surat PHK…', face: 'stress', dur: 3 }); this.say(e, 'Terima kasih untuk semuanya… 😢', 4); this.face(e, 'sleep', 6);
    this.setPath(e, ENTRY.x, ENTRY.y, 'leave');
    s.stat.fired = (s.stat.fired || 0) + 1; this.addLog(`${e.name} dipecat (pesangon ${fmtMoney(c)}).`);
    this.toast(`🚪 ${e.name} meninggalkan kantor. Meja ${DEPTS[deptOfSpec(e.spec)].name} kosong.`, 'info'); this.emit('sfx', 'oops'); this.emit('change'); return true;
  }
  removeEmp(e) { if (this.scold && this.scold.id === e.id) this.scold = null; const s = this.s; this.cancelActivity(e); this.releaseWork(e); s.employees = s.employees.filter(x => x !== e); this.emit('change'); }
  hire(id, name, autoDesk) {
    const s = this.s, c = s.candidates.find(x => x.id === id); if (!c) return false;
    let di = this.freeDesk(c.spec);
    if (di < 0 && autoDesk) { const d = deptOfSpec(c.spec), dc = DESK_COSTS[this.totalDesks()] || 0; if (s.deskCount[d] < DESK_MAX && s.money >= dc + c.cost && this.buyDesk(d)) di = this.freeDesk(c.spec); }
    if (di < 0) { this.toast(`Meja ${DEPTS[deptOfSpec(c.spec)].name} penuh! Beli meja baru, atau pecat karyawan yang ada.`, 'warn'); return false; }
    if (s.money < c.cost) { this.toast('Dana tidak cukup untuk merekrut 🥲', 'warn'); return false; }
    const e = JSON.parse(JSON.stringify(c)); delete e.cost; e.desk = di; e.name = this.cleanName(name, c.name);
    this.addMoney(-c.cost); s.candidates = s.candidates.filter(x => x.id !== id);
    s.employees.push(e); this.initEmpRuntime(e); e.x = ENTRY.x; e.y = ENTRY.y; e.cool = 10;
    this.goWork(e); this.emit('dir', { pose: 'wave', text: `Selamat bergabung, ${e.name.split(' ')[0]}! 🌿`, face: 'happy', dur: 2.6 }); this.say(e, 'Salam kenal! 🌿', 4); this.face(e, 'happy', 4);
    s.stat.hired++; this.addLog(`${e.name} bergabung!`);
    this.emit('sfx', 'hire'); this.toast(`🎉 ${e.name} bergabung sebagai ${SPECS[e.spec].name}!`, 'good');
    this.checkMissions(); this.emit('change');
    return true;
  }
  trainCost(e) { return r1(3 + e.skill / 18); }
  train(id) {
    const e = this.emp(id); if (!e) return false;
    if (e.skill >= 99) { this.toast('Skill sudah maksimal! 🌟', 'warn'); return false; }
    const c = this.trainCost(e);
    if (this.s.money < c) { this.toast('Dana tidak cukup 🥲', 'warn'); return false; }
    this.addMoney(-c); e.skill = Math.min(99, e.skill + 2); e.energy = clamp(e.energy - 12); e.xp += 20;
    this.say(e, 'Ilmu baru! 📚', 3); this.face(e, 'happy', 3); this.emit('fx', { kind: 'stars', x: e.x, y: e.y }); this.emit('sfx', 'levelup2'); this.emit('change'); return true;
  }
  giveBonus(id) {
    const e = this.emp(id), c = 1; if (!e) return;
    if (this.s.money < c) { this.toast('Dana tidak cukup 🥲', 'warn'); return; }
    this.addMoney(-c); e.mood = clamp(e.mood + 22); e.stress = clamp(e.stress - 8); this.say(e, 'Terima kasih, Bos! 💚', 3); this.face(e, 'happy', 4);
    this.emit('fx', { kind: 'hearts', x: e.x, y: e.y }); this.emit('sfx', 'coin'); this.emit('change');
  }

  // ---------- Toko ----------
  nextFac(k) { const l = this.s.fac[k], f = FACILITIES[k]; return l < f.levels.length ? f.levels[l] : null; }
  buyFacility(k) {
    const s = this.s, nx = this.nextFac(k); if (!nx) return false;
    if (nx.viaSys) { this.toast('Upgrade server ini lewat menu Upgrade Sistem 🖥️', 'info'); return false; }
    if (s.level < nx.lvl) { this.toast(`Butuh level ${nx.lvl} dulu 🔒`, 'warn'); return false; }
    if (s.money < nx.cost) { this.toast('Dana belum cukup 🥲', 'warn'); return false; }
    this.addMoney(-nx.cost); s.fac[k]++; this.resizeSlots(); this.emit('dir', { pose: 'cheer', text: `${nx.name} terpasang! ✨`, face: 'happy', dur: 2.2 });
    this.addLog(`Beli ${nx.name}!`); this.emit('sfx', 'buy'); this.toast(`✨ ${nx.name} terpasang!`, 'good');
    this.emit('fx', { kind: 'confetti', buy: k }); this.checkMissions(); this.emit('change');
    return true;
  }
  buyDesk(dept) {
    const s = this.s; if (!DEPTS[dept] || s.deskCount[dept] >= DESK_MAX) return false;
    const tot = this.totalDesks(), cost = DESK_COSTS[tot], lv = DESK_LEVELS[tot];
    if (s.level < lv) { this.toast(`Butuh level ${lv} dulu 🔒`, 'warn'); return false; }
    if (s.money < cost) { this.toast('Dana belum cukup 🥲', 'warn'); return false; }
    this.addMoney(-cost); s.deskCount[dept]++; this.emit('sfx', 'buy'); this.toast(`🏗️ Kantor diperluas! Meja baru di ${DEPTS[dept].name}.`, 'good');
    this.emit('fx', { kind: 'confetti', buy: 'desk' }); this.checkMissions(); this.emit('change'); return true;
  }
  buyDecor(id) {
    const s = this.s, d = DECOR[id]; if (!d || s.decor[id]) return false;
    if (s.level < d.lvl) { this.toast(`Butuh level ${d.lvl} dulu 🔒`, 'warn'); return false; }
    if (s.money < d.cost) { this.toast('Dana belum cukup 🥲', 'warn'); return false; }
    this.addMoney(-d.cost); s.decor[id] = true; s.employees.forEach(e => e.mood = clamp(e.mood + 4));
    this.emit('sfx', 'buy'); this.toast(`${d.emoji} ${d.name} dipasang!`, 'good'); this.emit('fx', { kind: 'confetti', buy: id }); this.emit('change'); return true;
  }

  collectGift() {
    const s = this.s, r = Math.random();
    this.emit('sfx', 'coin');
    if (r < 0.35) { const m = Math.round((2 + Math.random() * 4) * 10) / 10; this.addMoney(m); return `Kado Mochi: uang saku +${fmtMoney(m)}! 💰`; }
    if (r < 0.6) { s.employees.forEach(e => { e.mood = clamp(e.mood + 12); e.stress = clamp(e.stress - 6); }); return 'Kado Mochi: camilan manis! Mood tim naik 🍬'; }
    if (r < 0.8) { s.employees.forEach(e => { e.buff = 45; e.energy = clamp(e.energy + 10); }); return 'Kado Mochi: kopi ajaib! Tim super semangat ☕✨'; }
    this.addXp(35); return 'Kado Mochi: buku catatan ajaib! +35 XP 📖';
  }

  petMochi() {
    const s = this.s, now = performance.now();
    s.stat.mochi++; this.emit('sfx', 'meow'); this.emit('fx', { kind: 'mochi-hearts' });
    if (now - this.mochiLast > 6000) {
      this.mochiLast = now;
      s.employees.forEach(e => { e.mood = clamp(e.mood + (e.trait === 'kucing' ? 5 : 1.5)); e.stress = clamp(e.stress - 1.5); });
      this.toast('Mochi ngeong~ Mood tim naik 💚', 'good');
    }
    this.checkMissions();
  }

  // ---------- Inbox: permintaan yang butuh persetujuan / memo ----------
  addRequest(r) {
    const s = this.s; r.id = nid('R'); r.day = s.day; r.deadline = s.day + (r.ttl || 3); s.inbox.push(r);
    const e = r.from && this.emp(r.from); if (e) { this.say(e, 'Bos, ada permintaan! 📨', 4); }
    this.toast(`📥 Permintaan baru: ${r.title}`, 'warn'); this.emit('sfx', 'ding'); this.addLog(`Permintaan: ${r.title}`); this.emit('change');
  }
  genRequest(kind) {
    const s = this.s, emps = s.employees; if (!emps.length) return;
    const kinds = [['repair', 3, () => emps.some(e => !e.broken)], ['leave', 2, () => emps.length >= 2], ['training', 2, () => emps.some(e => e.skill < 95)],
      ['memo', 2, () => s.day >= 3 && !s.inbox.some(r => r.type === 'memo')], ['project', 2.5, () => s.day >= 4 && !s.inbox.some(r => r.type === 'project')], ['coffee', 0, () => false], ['snack', 0, () => false], ['invest', 1.4, () => s.day >= 5 && s.money >= 18 && !s.inbox.some(r => r.type === 'invest')]];
    if (!kind) { const pool = kinds.filter(k => k[2]()); let x = Math.random() * pool.reduce((a, k) => a + k[1], 0); kind = pool[0][0]; for (const k of pool) { x -= k[1]; if (x <= 0) { kind = k[0]; break; } } }
    const e = pick(emps.filter(x => kind === 'repair' ? !x.broken : true)) || pick(emps);
    switch (kind) {
      case 'repair': e.broken = true; return this.addRequest({ type: 'repair', icon: '🔧', from: e.id, title: `Laptop ${e.name.split(' ')[0]} rusak`, body: `"Bos, laptop saya mati total dan kerjaan jadi lambat. Boleh diperbaiki atau diganti baru?"`, opts: [{ k: 'fix', label: 'Perbaiki', cost: r1(rnd(1.8, 3)) }, { k: 'new', label: 'Beli baru', cost: r1(rnd(6, 8)) }], ttl: 3 });
      case 'coffee': return this.addRequest({ type: 'coffee', icon: '☕', from: (emps.find(x => x.trait === 'kopi') || e).id, title: 'Stok biji kopi hampir habis', body: '"Mesin kopi tinggal beberapa cangkir lagi… tolong setujui pembelian biji kopi ya!"', opts: [{ k: 'buy', label: 'Beli stok', cost: 3 }, { k: 'premium', label: 'Biji premium', cost: 6 }], ttl: 3 });
      case 'invest': return this.addRequest({ type: 'invest', icon: '🎲', from: null, sender: 'Mitra Fintech', title: 'Tawaran Investasi Berisiko', body: 'Mitra fintech menawarkan patungan proyek startup. Untung besar kalau berhasil… tapi bisa hangus semua. Mau ambil risikonya?', opts: [{ k: 'small', label: 'Investasi Rp 8 jt (55% untung)', cost: 8 }, { k: 'big', label: 'Investasi Rp 20 jt (40% untung)', cost: 20 }], ttl: 2 });
      case 'snack': return this.addRequest({ type: 'snack', icon: '🍪', from: e.id, title: 'Stok snack hampir habis', body: '"Kulkas hampir kosong, Bos… boleh belanja cemilan lagi?"', opts: [{ k: 'buy', label: 'Belanja snack', cost: 2.5 }, { k: 'premium', label: 'Paket spesial', cost: 5 }], ttl: 3 });
      case 'leave': return this.addRequest({ type: 'leave', icon: '🏖️', from: e.id, title: `${e.name.split(' ')[0]} mengajukan cuti`, body: '"Boleh cuti sehari? Badan rasanya capek banget…" ', opts: [{ k: 'ok', label: 'Setujui cuti', cost: 0 }], ttl: 2 });
      case 'training': { const c = this.trainCost(e); return this.addRequest({ type: 'training', icon: '📚', from: e.id, title: `${e.name.split(' ')[0]} minta ikut pelatihan`, body: '"Ada kursus bagus untuk naik skill. Boleh ikut, Bos?"', opts: [{ k: 'ok', label: 'Setujui', cost: c }], ttl: 3 }); }
      case 'memo': return this.addRequest({ type: 'memo', icon: '📝', from: null, sender: 'Direksi', title: 'Direksi minta memo progres', body: 'Direksi meminta memo singkat tentang kondisi divisi TI minggu ini. Tulis memo untuk mereka.', memo: true, opts: [{ k: 'send', label: 'Buat memo', cost: 0 }], ttl: 2 });
      case 'project': { const P = pick([['Open Banking API', 'Klien fintech ingin terhubung ke bank kita lewat API terbuka.'], ['Migrasi Core Banking', 'Direksi ingin core banking dipindah ke platform baru.'], ['Aplikasi Nasabah Prioritas', 'Layanan khusus nasabah prioritas dengan fitur eksklusif.'], ['Dashboard Risiko Real-time', 'Divisi risiko butuh dashboard pemantauan real-time.']]);
        return this.addRequest({ type: 'project', icon: '📁', from: null, sender: 'Direksi', title: `Proyek baru: ${P[0]}`, body: `${P[1]} Butuh persetujuan & memo kick-off dari Kepala Divisi.`, memo: true, project: P[0], opts: [{ k: 'accept', label: 'Setujui proyek', cost: 0 }], ttl: 3 }); }
    }
  }
  memoTemplates(r) {
    if (r.type === 'project') return [`Memo kick-off: proyek ${r.project} resmi dimulai. Tim lintas departemen mohon berkoordinasi dan melaporkan progres tiap pekan.`, `Dengan ini proyek ${r.project} disetujui. Prioritaskan keamanan dan kualitas, serta jaga kesejahteraan tim selama pengerjaan.`];
    return ['Progres minggu ini: tiket selesai sesuai target, layanan stabil, keamanan terjaga, dan tim dalam kondisi baik.', 'Laporan singkat: risiko terkendali. Mohon dukungan anggaran untuk fasilitas tim agar produktivitas terus meningkat.'];
  }
  resolveRequest(id, action, optKey, memo, extra) {
    const s = this.s, r = s.inbox.find(x => x.id === id); if (!r) return false;
    const e = r.from ? this.emp(r.from) : null;
    if (action === 'reject') {
      s.inbox = s.inbox.filter(x => x.id !== id); s.stat.rejected++;
      if (r.type === 'leave' && e) { e.mood = clamp(e.mood - 8); this.say(e, 'Yah… oke deh 🥲', 3); }
      else if (r.type === 'training' && e) e.mood = clamp(e.mood - 4);
      else if (r.type === 'repair' && e) { this.say(e, 'Terpaksa pakai yang rusak… 😵', 3); e.mood = clamp(e.mood - 3); }
      else if (r.type === 'project') this.addStat('service', -1);
      else if (r.type === 'memo') { this.addStat('risk', 1.5); }
      this.emit('dir', { pose: 'wave', text: '❌ Ditolak', face: 'stress', dur: 1.8 });
      this.toast('Permintaan ditolak.', 'info'); this.emit('sfx', 'tap'); this.emit('change'); return true;
    }
    const opt = r.opts.find(o => o.k === optKey) || r.opts[0];
    if (opt.cost && s.money < opt.cost) { this.toast('Dana tidak cukup untuk menyetujui 🥲', 'warn'); return false; }
    if (r.memo) {
      if (!memo || String(memo.text || '').trim().length < 15) { this.toast('Memo terlalu pendek — tulis minimal 15 karakter ✍️', 'warn'); return false; }
      s.memos.unshift({ id: nid('M'), day: s.day, to: memo.to || 'Tim', subject: memo.subject || r.title, text: String(memo.text).trim().slice(0, 400), kind: r.type }); s.memos.length = Math.min(s.memos.length, 20); s.stat.memos++;
    }
    if (opt.cost) this.addMoney(-opt.cost);
    s.inbox = s.inbox.filter(x => x.id !== id); s.stat.approved++;
    this.emit('dir', r.memo ? { pose: 'type', text: '✍️ Menulis memo…', dur: 3 } : { pose: 'cheer', text: '✅ Disetujui!', face: 'happy', dur: 1.8 });
    switch (r.type) {
      case 'repair': if (e) { e.broken = false; if (opt.k === 'new') e.deviceBonus = 1.12; e.mood = clamp(e.mood + 8); this.say(e, opt.k === 'new' ? 'Laptop baru! Kencang! 💻✨' : 'Sudah normal lagi! 🔧', 3); this.face(e, 'happy', 3); } break;
      case 'coffee': s.coffeeStock += opt.k === 'premium' ? 45 : 40; if (opt.k === 'premium') s.employees.forEach(x => { x.mood = clamp(x.mood + 3); }); this.toast(`☕ Stok kopi terisi (${s.coffeeStock} cangkir)`, 'good'); break;
      case 'invest': { const big = opt.k === 'big', win = Math.random() < (big ? 0.4 : 0.55); if (win) { const back = r1(opt.cost * (big ? 2.6 : 1.9) * 1); this.addMoney(back); this.toast(`🎲 Investasi berhasil! Dana kembali ${fmtMoney(back)}.`, 'good'); this.emit('fx', { kind: 'confetti' }); } else this.toast(`💸 Investasi gagal… ${fmtMoney(opt.cost)} hangus.`, 'bad'); break; }
      case 'snack': s.snackStock += Math.round((opt.k === 'premium' ? 40 : 30) * ((this.facInfo('snack') || {}).stock || 1)); if (opt.k === 'premium') s.employees.forEach(x => { x.mood = clamp(x.mood + 3); }); this.toast(`🍪 Stok snack terisi (${s.snackStock} porsi)`, 'good'); break;
      case 'leave': if (e) { this.cancelActivity(e); this.releaseWork(e); const t = e.task && this.task(e.task); if (t) { t.state = 'new'; t.emp = null; e.task = null; } e.stress = clamp(e.stress - 30); e.mood = clamp(e.mood + 18); e.onLeave = true; this.say(e, 'Makasih, Bos! Cuti dulu 🏖️', 4); this.setPath(e, ENTRY.x, ENTRY.y, 'leave'); } break;
      case 'training': if (e) { e.skill = Math.min(99, e.skill + 3); e.xp += 30; e.mood = clamp(e.mood + 6); this.say(e, 'Ilmu baru! 📚', 3); this.emit('fx', { kind: 'stars', x: e.x, y: e.y }); } break;
      case 'memo': this.addMoney(3); this.boost('service', 2); this.cut('risk', 2); this.addXp(25); this.toast('📝 Memo diterima Direksi: bonus Rp 3 jt & layanan naik', 'good'); break;
      case 'projreview': this.projReviewDecision(r, opt.k); break;
      case 'projuat': this.projUatDecision(r, opt.k, extra); break;
      case 'golive': this.projGoLive(r, opt.k); break;
      case 'sysgo': this.systemActivate(r.sys, opt.k); break;
      case 'project': this.addProject(r.project); this.addXp(40); this.toast(`📁 Proyek ${r.project} disetujui! Adakan rapat kick-off di Ruang Meeting (tab Inbox).`, 'good'); break;
    }
    this.emit('sfx', 'hire'); this.addLog(`Disetujui: ${r.title}`); this.checkMissions(); this.emit('change'); return true;
  }
  expireRequest(r) {
    if (r.type === 'sysgo') { this.toast(`⌛ Aktivasi ${r.title} tidak diputuskan — diaktifkan tanpa uji`, 'warn'); return this.resolveRequest(r.id, 'approve', 'go'); }
    if (r.proj) {
      const k = { projreview: 'accept', projuat: r.variant === 'bug' ? 'delegate' : 'reject', golive: 'go' }[r.type];
      this.toast(`⌛ Keputusan "${r.title}" terlambat — tim memutuskan sendiri`, 'warn');
      const p = this.s.projects.find(x => x.id === r.proj); if (p) p.q -= 0.6;
      return this.resolveRequest(r.id, 'approve', k, null, { tier: 0 });
    }
    const s = this.s, e = r.from ? this.emp(r.from) : null; s.inbox = s.inbox.filter(x => x.id !== r.id);
    if (e) e.mood = clamp(e.mood - 6);
    if (r.type === 'memo') { this.addStat('risk', 2); this.addStat('service', -2); }
    if (r.type === 'project') this.addStat('service', -2);
    this.toast(`⌛ Permintaan "${r.title}" kedaluwarsa tanpa keputusan`, 'bad'); this.addLog(`Kedaluwarsa: ${r.title}`);
  }
  // ---------- Panggil staff ke ruang kepala divisi ----------
  summon(id, mode) {
    const e = this.emp(id); if (!e || e.leaving || e.onLeave || e.st === 'sick') { this.toast('Karyawan tidak bisa dipanggil sekarang 😵', 'warn'); return false; }
    if (this.scold) { this.toast('Masih ada staf yang sedang menghadap 🙏', 'warn'); return false; }
    this.cancelActivity(e); this.releaseWork(e);
    e.act = { kind: 'summon', t: 0, dur: ACT_DUR.summon, arrived: false, mode };
    this.scold = { id: e.id, mode, ready: false, lt: 0, li: 0, text: '', witness: false };
    this.setPath(e, SCOLD_SPOT.x, SCOLD_SPOT.y, 'act'); this.say(e, mode === 'marah' ? 'Aduh… dipanggil Bos 😰' : 'Baik, Bos…', 3.5); this.face(e, 'stress', 4);
    this.emit('sfx', 'ding'); this.toast(`📢 ${e.name} dipanggil ke ruang Kepala Divisi`, 'info'); this.emit('change'); return true;
  }
  tickSummon(e, dt) {
    const sc = this.scold; if (!sc || sc.id !== e.id) return;
    sc.ready = true; sc.lt -= dt;
    if (sc.lt <= 0) { const L = SCOLD_LINES[sc.mode]; sc.text = L[sc.li++ % L.length]; sc.lt = sc.mode === 'marah' ? 1.5 : 2.4; if (Math.random() < 0.5) this.say(e, pick(sc.mode === 'semangat' ? ['Siap, Bos! 🔥', 'Makasih…'] : ['Maaf, Bos…', 'Siap…', 'Iya, Bos 🥲']), 1.6); this.emit('sfx', sc.mode === 'marah' ? 'oops' : 'pop'); }
    const T = e.trait;
    if (sc.mode === 'marah') { e.stress = clamp(e.stress + 2.4 * (T === 'rajin' ? 1.5 : T === 'santai' ? 0.4 : 1) * dt); e.mood = clamp(e.mood - 1.6 * (T === 'santai' ? 0.4 : 1) * dt); if (!sc.witness) { sc.witness = true; this.s.employees.forEach(x => { if (x !== e) { x.mood = clamp(x.mood - 3); } }); } }
    else if (sc.mode === 'tegur' || sc.mode === 'sp') { e.stress = clamp(e.stress + 0.8 * dt); e.mood = clamp(e.mood - 0.4 * dt); }
    else { e.mood = clamp(e.mood + 1.8 * dt); e.stress = clamp(e.stress - 1.2 * dt); }
  }
  endSummon(e) {
    const sc = this.scold, s = this.s; if (!sc) return; const mode = sc.mode; this.scold = null;
    if (mode === 'marah') {
      s.stat.scolds = (s.stat.scolds || 0) + 1; e.buff = Math.max(e.buff, 45);
      if (e.mood < 30 && e.trait !== 'santai' && Math.random() < 0.3) { this.quitEmp(e, 'resign karena dimarahi terus 💔'); return; }
      this.say(e, 'Saya akan kerja lebih keras… 😢', 3); this.face(e, 'stress', 5);
      this.toast(`😡 ${e.name} jadi terpacu (45 dtk), tapi stres & mood terpengaruh.`, 'info');
    } else if (mode === 'sp') {
      e.sp = (e.sp || 0) + 1; e.fails = 0; e.buff = Math.max(e.buff, 40); e.mood = clamp(e.mood - 8); s.stat.sps = (s.stat.sps || 0) + 1;
      this.say(e, `Baik, Bos. SP-${e.sp} saya terima… 🙇`, 3.5); this.face(e, 'stress', 5);
      this.toast(`📄 ${e.name} menerima Surat Peringatan ke-${e.sp}.${e.sp >= 3 ? ' Pertimbangkan untuk memecatnya.' : ''}`, 'info'); this.addLog(`${e.name} menerima SP-${e.sp}.`); this.checkSuggest();
    } else if (mode === 'tegur') { e.buff = Math.max(e.buff, 35); this.say(e, 'Noted, Bos. Terima kasih.', 3); this.toast(`😐 ${e.name} jadi lebih fokus sementara.`, 'info'); }
    else { e.buff = Math.max(e.buff, 25); this.say(e, 'Siap! Saya semangat lagi! 🔥', 3); this.face(e, 'happy', 5); this.emit('fx', { kind: 'hearts', x: e.x, y: e.y }); this.toast(`🤗 ${e.name} bersemangat kembali!`, 'good'); }
  }
  quitEmp(e, why) {
    const s = this.s; this.cancelActivity(e); this.releaseWork(e);
    const t = e.task && this.task(e.task); if (t) { t.state = 'new'; t.emp = null; }
    e.task = null; e.leaving = true; e.desk = -1; s.inbox = s.inbox.filter(r => r.from !== e.id);
    s.employees.forEach(x => { if (x !== e) x.mood = clamp(x.mood - 6); });
    this.say(e, 'Saya… mengundurkan diri.', 4); this.face(e, 'sleep', 6); this.setPath(e, ENTRY.x, ENTRY.y, 'leave');
    this.addLog(`${e.name} ${why}`); this.toast(`💔 ${e.name} ${why}`, 'bad'); this.emit('sfx', 'lose'); this.emit('change');
  }

  // ---------- Proyek: disetujui → harus rapat kick-off di Ruang Meeting dulu ----------
  addProject(name) { const s = this.s; s.projects.push({ id: nid('P'), name, day: s.day, deadline: s.day + 4, state: 'plan', att: [], left: 0 }); this.addLog(`Proyek ${name} menunggu kick-off.`); }
  startKickoff(pid, attIds, scope) {
    const s = this.s, p = s.projects.find(x => x.id === pid); if (!p || p.state !== 'plan') return false;
    const att = attIds.map(id => this.emp(id)).filter(e => e && !e.leaving && e.st !== 'sick');
    if (att.length < 2) { this.toast('Pilih minimal 2 peserta rapat 👥', 'warn'); return false; }
    this.emit('dir', { pose: 'wave', text: 'Ayo rapat kick-off! 📋', face: 'happy', dur: 2.4 });
    p.state = 'meeting'; p.scope = scope; p.rushed = scope === 'fast'; p.missing = this.kickoffCheck(att.map(e => e.id)).missing; p.att = att.map(e => e.id); p.left = att.length;
    att.slice(0, 6).forEach((e, i) => {
      this.cancelActivity(e); this.releaseWork(e);
      this.slots.meeting[i] = e.id; e.act = { kind: 'meeting', slot: i, t: 0, dur: 14, arrived: false, proj: pid };
      const sp = spotFor('meeting', i); this.setPath(e, sp.x, sp.y, 'act'); this.say(e, 'Menuju ruang meeting 📋', 3);
    });
    p.left = Math.min(att.length, 6);
    this.toast(`📋 Rapat kick-off ${p.name} dimulai di Ruang Meeting`, 'info'); this.emit('sfx', 'ding'); this.emit('change'); return true;
  }
  meetingDone(pid) { const p = this.s.projects.find(x => x.id === pid); if (!p || p.state !== 'meeting') return; p.left--; if (p.left <= 0) this.finishKickoff(p); }
  // Cek kebutuhan rapat: tiap fase proyek butuh wakil dari bidangnya (Analisis→Pengendalian, Pengembangan→Pengembangan, Implementasi→Operasional)
  kickoffNeeds() { return PROJECT_PHASES.map(([spec, phase]) => ({ dept: deptOfSpec(spec), phase })); }
  kickoffCheck(ids) {
    const att = ids.map(id => this.emp(id)).filter(Boolean), have = new Set(att.map(e => deptOfSpec(e.spec)));
    const needs = this.kickoffNeeds().map(n => ({ ...n, ok: have.has(n.dept) }));
    return { needs, missing: needs.filter(n => !n.ok).map(n => n.dept), avgSkill: att.length ? att.reduce((a, e) => a + e.skill, 0) / att.length : 0, n: att.length };
  }
  kickoffAuto() { const ids = []; for (const d of DEPT_KEYS) { const best = this.s.employees.filter(e => !e.leaving && e.st !== 'sick' && !e.hidden && deptOfSpec(e.spec) === d).sort((a, b) => b.skill - a.skill)[0]; if (best) ids.push(best.id); } return ids; }
  finishKickoff(p) {
    const s = this.s, atts = p.att.map(id => this.emp(id)).filter(Boolean), depts = new Set(atts.map(e => deptOfSpec(e.spec))).size;
    const avgSkill = atts.length ? atts.reduce((a, e) => a + e.skill, 0) / atts.length : 50;
    const sc = { fast: { rw: 1.3, wk: 0.92, dl: 4, risk: 3 }, balanced: { rw: 1.0, wk: 1.0, dl: 6, risk: 0 }, safe: { rw: 0.92, wk: 1.0, dl: 8, risk: -2 } }[p.scope] || { rw: 1, wk: 1, dl: 6, risk: 0 };
    const cover = depts >= 3 ? 1.15 : depts === 2 ? 1.05 : 1, skillF = 0.95 + Math.min(0.15, (avgSkill - 55) / 300);
    const miss = (p.missing || []).length; if (miss) this.toast(`⚠️ Rapat tanpa wakil bidang ${(p.missing || []).map(d => DEPTS[d].name).join(', ')}: kualitas proyek turun & fase bidang itu lebih berat.`, 'warn');
    p.rw = sc.rw * cover * skillF; p.wk = sc.wk; p.dl = Math.max(3, Math.round(sc.dl * 0.7)); p.q = (depts >= 3 ? 1.5 : depts === 2 ? 0.7 : 0) + (avgSkill > 72 ? 0.6 : 0) - 0.5 * miss; p.phase = 0; p.state = 'run';
    if (sc.risk > 0) this.addStat('risk', sc.risk); else if (sc.risk < 0) this.cut('risk', -sc.risk);
    this.addXp(60); this.spawnPhase(p);
    this.toast(`✅ Kick-off selesai${cover > 1.1 ? ' dengan perencanaan sempurna ✨' : ''}! Fase 1 proyek ${p.name} dimulai.`, 'good');
    this.emit('sfx', 'win'); this.emit('change');
  }

  // ---------- Siklus proyek: Analisis → Review → Pengembangan → UAT → Implementasi → Go-Live ----------
  spawnPhase(p, extra) {
    const s = this.s, lv = s.level - 1, PH = PROJECT_PHASES[p.phase]; if (!PH && !extra) return;
    const [spec, phase, work, reward] = PH || PROJECT_PHASES[0];
    s.tasks.push({ id: nid('T'), title: `${p.name}: ${phase}`, sub: `Fase ${p.phase + 1}/3 · proyek besar`, spec, work: Math.round(work * p.wk * (1 + lv * 0.03) * ((p.missing || []).includes(deptOfSpec(spec)) ? 1.3 : 1)), reward: r1(reward * p.rw * (1 + lv * 0.07)), xp: 90, onsite: spec === 'ops', sec: 0, pri: 'high', deadline: s.day + p.dl, state: 'new', progress: 0, emp: null, late: 0, proj: p.id, ...extra });
    p.state = 'run'; this.emit('change');
  }
  projectTaskClaimed(t) {
    const p = this.s.projects.find(x => x.id === t.proj); if (!p) return;
    p.q += t.q === 'perfect' ? 0.8 : t.q === 'bug' ? -0.4 : 0.2;
    if (t.rev) { if (p.phase >= 3) { p.state = 'wait'; this.requestGoLive(p); } else this.spawnPhase(p); return; }                  // tiket revisi/perubahan selesai → lanjut ke fase berikut
    p.phase++; p.state = 'wait';
    if (p.phase === 1) this.addRequest({ type: 'projreview', proj: p.id, icon: '🔍', from: null, sender: 'Tim Proyek', title: `Review hasil analisis: ${p.name}`, body: 'Fase analisis & kontrol selesai. Terima hasilnya, atau minta revisi dulu supaya kualitas proyek lebih baik (butuh 1 tiket tambahan).', opts: [{ k: 'accept', label: 'Terima hasil', cost: 0 }, { k: 'revise', label: 'Minta revisi', cost: 0 }], ttl: 3 });
    else if (p.phase === 2) {
      const bug = Math.random() < 0.45;
      this.addRequest(bug
        ? { type: 'projuat', variant: 'bug', proj: p.id, icon: '🐞', from: null, sender: 'Tim QA', title: `Bug kritis saat UAT: ${p.name}`, body: 'Saat uji penerimaan, ditemukan bug kritis! Perbaiki sendiri dengan mini-game Patch Rush, atau serahkan ke tim (lebih aman tapi tambah satu tiket).', opts: [{ k: 'mg', label: 'Perbaiki sendiri', cost: 0, mg: true }, { k: 'delegate', label: 'Serahkan ke tim', cost: 0 }], ttl: 3 }
        : { type: 'projuat', variant: 'change', proj: p.id, icon: '🔁', from: null, sender: 'Klien', title: `Klien minta perubahan: ${p.name}`, body: 'Klien meminta fitur tambahan di menit terakhir. Terima (tambah tiket & hadiah, kualitas naik) atau tolak dengan sopan?', opts: [{ k: 'accept', label: 'Terima perubahan', cost: 0 }, { k: 'reject', label: 'Tolak sopan', cost: 0 }], ttl: 3 });
    } else if (p.phase >= 3) this.requestGoLive(p);
    this.emit('change');
  }
  projectTaskFailed(t) {
    const p = this.s.projects.find(x => x.id === t.proj); if (!p) return;
    p.q -= 0.8; p.lateFlag = true; this.penalize(`proyek ${p.name} molor`, 3, 0.93, 3); this.toast(`Fase proyek ${p.name} terlambat — tiket dibuat ulang`, 'warn');
    this.spawnPhase(p, t.rev ? { rev: true, title: t.title, spec: t.spec, work: t.work, reward: t.reward } : undefined);
  }
  projReviewDecision(r, k) {
    const p = this.s.projects.find(x => x.id === r.proj); if (!p) return;
    if (k === 'revise') { p.q += 0.8; this.spawnPhase(p, { title: `${p.name}: Revisi analisis`, sub: 'Revisi hasil review', work: 32, reward: 1.8, spec: 'ctrl', rev: true, xp: 40 }); this.toast('🔁 Revisi diminta: 1 tiket tambahan masuk', 'info'); }
    else this.spawnPhase(p);
  }
  projUatDecision(r, k, extra) {
    const p = this.s.projects.find(x => x.id === r.proj); if (!p) return;
    const lv = this.s.level - 1;
    if (r.variant === 'change') {
      if (k === 'accept') { p.q += 0.8; this.spawnPhase(p, { title: `${p.name}: Perubahan klien`, sub: 'Permintaan tambahan', work: 45, reward: r1(4 * p.rw * (1 + lv * 0.07)), spec: 'dev', rev: true, xp: 60 }); this.toast('✅ Perubahan klien diterima: tiket tambahan masuk, hadiah naik', 'good'); }
      else { p.q -= 0.4; this.spawnPhase(p); }
    } else if (k === 'mg') {
      const t = extra && typeof extra.tier === 'number' ? extra.tier : 0;
      p.q += t === 2 ? 1.0 : t === 1 ? 0.4 : -0.6; this.toast(t === 2 ? '🌟 Bug kritis ditumpas habis!' : t === 1 ? '👍 Bug kritis teratasi' : '😬 Bug lolos sebagian…', t ? 'good' : 'warn'); this.spawnPhase(p);
    } else { p.q += 0.2; this.spawnPhase(p, { title: `${p.name}: Perbaikan bug UAT`, sub: 'Diserahkan ke tim', work: 38, reward: 2.2, spec: 'dev', rev: true, xp: 45 }); }
  }
  projGoLive(r, k) {
    const s = this.s, p = s.projects.find(x => x.id === r.proj); if (!p) return;
    if (k === 'delay') { p.q += 0.9; p.rushed = false; this.spawnPhase(p, { title: `${p.name}: Uji regresi & pemantapan`, sub: 'Persiapan Go-Live', work: 50, reward: 2, spec: 'dev', rev: true, xp: 50 }); this.toast('🧪 Go-Live ditunda: tiket uji regresi masuk. Kualitas proyek naik.', 'info'); return; }
    const rd = this.projReadiness(p), incident = Math.random() < rd.risk;
    let hallParty = null;
    if (k === 'hall' && s.fac.hall) { hallParty = 'big'; p.q += 0.9; }
    else if (k === 'party' && s.fac.hall) { hallParty = 'small'; p.q += 0.6; }
    else if (k === 'party') { s.employees.forEach(e => { e.mood = clamp(e.mood + 15); e.stress = clamp(e.stress - 10); this.say(e, 'Syukuran! 🎉', 3); }); p.q += 0.6; }
    const q = Math.max(0, Math.min(5, p.q)), stars = q >= 4 ? 4 : q >= 3 ? 3 : q >= 1.8 ? 2 : 1;
    const bonus = r1((10 + q * 5 + s.level * 1.5) * this.incomeMul() * (incident ? 0.6 : 1));
    this.addMoney(bonus); this.addXp(Math.round(120 + q * 40)); this.boost('service', 3 + q); this.cut('risk', 1.5 + q * 0.5);
    s.stat.projects = (s.stat.projects || 0) + 1; s.projects = s.projects.filter(x => x.id !== p.id);
    const label = ['', '😅 Lumayan', '👍 Bagus', '🌟 Sangat bagus', '🏆 Luar biasa'][stars];
    s.employees.forEach(e => { this.face(e, 'happy', 6); if (!e.say) this.say(e, 'GO-LIVE! 🚀', 4); });
    this.emit('dir', { pose: 'cheer', text: 'GO-LIVE! 🎉', face: 'happy', dur: 3 }); this.emit('fx', { kind: 'confetti' }); this.emit('banner', { text: '🚀 GO-LIVE!', sub: `${p.name} · ${label} · +${fmtMoney(bonus)}` }); this.emit('sfx', 'levelup');
    this.toast(`🚀 ${p.name} resmi meluncur! ${label} — bonus ${fmtMoney(bonus)}`, 'good'); this.addLog(`Go-Live ${p.name} (${label}).`);
    if (incident) { this.addStat('service', -8); this.addStat('risk', 8); this.addMoney(-7 * this.costMul()); this.penalize(`Go-Live ${p.name} bermasalah (tidak siap)`, 5, 0.85, 7); this.toast(`💥 Go-Live ${p.name} bermasalah: bug produksi & rollback! Kinerja tim turun beberapa hari, biaya ${fmtMoney(7 * this.costMul())}.`, 'bad'); }
    if (hallParty) this.startParty(hallParty); else if (!s.fac.hall && !s.hallHint) { s.hallHint = true; this.toast('💡 Beli Ruang Aula di Toko untuk berpesta setelah proyek rilis!', 'info'); }
  }

  // ---------- Misi ----------
  missionValue(m) {
    const s = this.s, st = s.stat;
    switch (m.key) {
      case 'assigned': return st.assigned; case 'tasksDone': return st.tasksDone; case 'cups': return st.cups; case 'hired': return st.hired;
      case 'psPlays': return st.psPlays; case 'mochi': return st.mochi; case 'perfect': return st.perfect; case 'mgWins': return st.mgWins;
      case 'facCoffee': return s.fac.coffee; case 'facSnack': return s.fac.snack; case 'facPs': return s.fac.ps; case 'facPlay': return s.fac.play;
      case 'approved': return st.approved; case 'memos': return st.memos;
      case 'facPool': return s.fac.pool || 0; case 'scolds': return st.scolds || 0; case 'projects': return st.projects || 0;
      case 'level': return s.level; case 'team': return s.employees.length; case 'stars': return this.stars(); case 'day': return s.day;
    }
    return 0;
  }
  checkMissions(silent) {
    const s = this.s;
    for (const m of MISSIONS) {
      const ms = s.missions[m.id] || (s.missions[m.id] = { done: false, claimed: false });
      if (!ms.done && this.missionValue(m) >= m.need) { ms.done = true; if (!silent) { this.toast(`🎯 Misi selesai: ${m.title}`, 'good'); this.emit('sfx', 'mission'); this.emit('change'); } }
    }
  }
  claimMission(id) {
    const m = MISSIONS.find(x => x.id === id), ms = this.s.missions[id];
    if (!m || !ms || !ms.done || ms.claimed) return;
    ms.claimed = true; this.addMoney(m.money); if (m.xp) this.addXp(m.xp);
    this.emit('sfx', 'coin'); this.toast(`Hadiah misi: +${fmtMoney(m.money)}${m.xp ? ` · +${m.xp} XP` : ''}`, 'good'); this.emit('change');
  }

  save() { this.emit('save', this.serialize()); }
}
