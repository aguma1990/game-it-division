// Logika game (tanpa DOM): waktu, karyawan, tiket, fasilitas, ekonomi, misi.
import {
  SPECS, SPEC_KEYS, TRAITS, TRAIT_KEYS, RARITY, NAMES_F, NAMES_M, SURNAMES, HAIR_COLORS, EYE_COLORS, SKINS,
  HIJAB_COLORS, HAIR_STYLES, TASK_TEMPLATES, PRIORITY, FACILITIES, DESK_COSTS, DESK_LEVELS, DESK_MAX, DEPTS, DEPT_KEYS, deptOfSpec, DECOR, xpNeeded, MISSIONS,
  fmtMoney
} from './data.js';
import { EVENTS } from './events.js';

export const rnd = (a, b) => a + Math.random() * (b - a);
export const ri = (a, b) => Math.floor(rnd(a, b + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const r1 = v => Math.round(v * 10) / 10;

// ----- Tata letak isometrik (satuan petak) -----
// Baris belakang: Pantry & Lounge. Baris 1: ruang Pengendalian (kiri) & Pengembangan (kanan).
// Baris 2: ruang Operasional (kiri), Ruang Server, Taman Bermain. Lorong tegak di x = V_X.
export const V_X = 6.6, C1_Y = 5.0, C2_Y = 10.0;
export const DESK_POS = { ctrl: { x: [0.7, 2.65, 4.6], y: 6.8 }, dev: { x: [7.4, 9.35, 11.3], y: 6.8 }, ops: { x: [0.7, 2.65, 4.6], y: 11.5 } };
export const deskXY = i => { const d = DEPT_KEYS[Math.floor(i / 3)]; return { x: DESK_POS[d].x[i % 3], y: DESK_POS[d].y }; };
export const SERVER_ST = [{ x: 7.9, y: 11.7 }, { x: 9.25, y: 11.7 }, { x: 10.6, y: 11.7 }];
export const PLAY_SLOTS = [[12.4, 11.6], [14.0, 11.6], [12.4, 13.0], [14.0, 13.0]];
export const ENTRY = { x: 15.5, y: C1_Y };
const HOURS_PER_SEC = 1 / 4.2;   // 4,2 detik nyata = 1 jam game (1x) → 1 hari ≈ 38 detik
const TIME_SCALE = 0.62;         // memperlambat seluruh simulasi (1 hari ≈ 60 detik pada 1x)
const WALK = 2.6;                // petak per detik

export const deskPos = i => { const p = deskXY(i); return { x: p.x + 0.85, y: p.y - 0.5 }; };

export function spotFor(kind, idx, n) {
  switch (kind) {
    case 'coffee': return { x: 3.0 + idx * 1.0, y: 2.0, pose: 'drink' };
    case 'ps': return { x: 11.8 + (idx - (n - 1) / 2) * 1.0, y: 1.0, pose: 'game' };
    case 'play': return { x: PLAY_SLOTS[idx][0], y: PLAY_SLOTS[idx][1], pose: 'bounce' };
    case 'server': return { x: SERVER_ST[idx].x, y: SERVER_ST[idx].y, pose: 'type' };
  }
}
export const queueSpot = (kind, qi) => ({
  coffee: [{ x: 5.9, y: 2.8 }, { x: 5.3, y: 3.4 }, { x: 4.4, y: 3.3 }],
  ps: [{ x: 8.6, y: 2.0 }, { x: 8.2, y: 2.6 }, { x: 9.0, y: 2.8 }],
  play: [{ x: 11.8, y: 9.7 }, { x: 12.8, y: 9.7 }, { x: 13.8, y: 9.7 }]
}[kind][qi % 3]);

// Jalur jalan lewat lorong tegak (x = V_X) dan lorong datar, jadi tidak menembus meja/sekat
function toV(p) {
  if (p.y < 5.3) return [{ x: p.x, y: C1_Y }, { x: V_X, y: C1_Y }];                      // area belakang
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
    id: nid('E'), name, female, spec, rarity, trait: pick(TRAIT_KEYS), look: genLook(female),
    skill: ri(R.skill[0], R.skill[1]), lvl: 1, xp: 0, energy: ri(80, 100), stress: ri(5, 18), mood: ri(78, 92),
    salary: r1(R.salary * rnd(0.9, 1.15)), task: null, desk: 0, tasksDone: 0, wTasks: 0
  };
}

export class Game {
  constructor() { this.l = {}; this.s = null; this.blocking = false; this.lastSave = 0; }
  on(ev, fn) { (this.l[ev] ||= []).push(fn); }
  emit(ev, p) { (this.l[ev] || []).forEach(fn => fn(p)); }

  // ---------- Sesi ----------
  newGame({ name, bank, dirLook }) {
    this.s = {
      v: 1, name: name || 'Direktur', bank: bank || 'Bank Sakura Nusantara', dirLook: dirLook || { hair: '#4a3f66', style: 'bob', bangs: 2, eye: '#5a7bff', skin: '#ffe3d0', skirt: true, acc: 'none' }, day: 1, hour: 8, speed: 1,
      money: 45, level: 1, xp: 0, security: 66, service: 76, risk: 22,
      deskCount: { ctrl: 1, dev: 1, ops: 1 }, fac: { coffee: 0, ps: 0, play: 0, server: 1 }, decor: {}, employees: [], tasks: [], candidates: [],
      missions: {}, stat: { assigned: 0, tasksDone: 0, cups: 0, psPlays: 0, playPlays: 0, hired: 0, mochi: 0, perfect: 0, mgWins: 0, events: 0, praise: 0, bestStreak: 0, approved: 0, rejected: 0, memos: 0 },
      week: { income: 0, expense: 0, tasks: 0 }, inbox: [], memos: [], coffeeStock: 30, firstReq: false, auto: false, autoBreak: true, sound: true, log: [], eventCool: 3, starDays: 0, bailouts: 0, ended: false
    };
    const used = [];
    [['dev', 'R', false], ['ops', 'N', false], ['ctrl', 'R', true]].forEach(([sp, rar, fem], i) => {
      const e = makeEmployee(sp, rar, used, fem); used.push(e.name); e.mood = 88; e.energy = 92; e.desk = this.freeDesk(sp); this.s.employees.push(e);
    });
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
    if (!this.s.deskCount) { // save lama: bagi meja per departemen
      const dc = { ctrl: 1, dev: 1, ops: 1 }; this.s.deskCount = dc;
      for (const d of DEPT_KEYS) dc[d] = Math.min(DESK_MAX, Math.max(1, this.s.employees.filter(e => deptOfSpec(e.spec) === d).length));
      this.s.employees.forEach(e => { e.desk = -1; }); this.s.employees.forEach(e => { e.desk = this.freeDesk(e.spec); if (e.desk < 0) { dc[deptOfSpec(e.spec)] = Math.min(DESK_MAX, dc[deptOfSpec(e.spec)] + 1); e.desk = this.freeDesk(e.spec); } });
      delete this.s.desks;
    }
    for (const k of ['approved', 'rejected', 'memos']) if (this.s.stat[k] === undefined) this.s.stat[k] = 0;
    if (!this.s.inbox) this.s.inbox = []; if (!this.s.memos) this.s.memos = []; if (this.s.coffeeStock === undefined) this.s.coffeeStock = 30; if (this.s.firstReq === undefined) this.s.firstReq = true;
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
    this.slots = { coffee: [], ps: [], play: [], server: [] };
    this.queue = { coffee: [], ps: [], play: [] };
    this.resizeSlots();
    this.s.employees.forEach(e => this.initEmpRuntime(e));
    this.autoT = 0; this.mochiLast = 0; this.pending = null; this.report = null;
  }
  initEmpRuntime(e) {
    Object.assign(e, { st: 'idle', ...deskPos(e.desk), path: [], step: null, goal: null, act: null, cool: rnd(4, 14), buff: 0, face: null, faceT: 0, say: null, sayT: 0, wslot: -1, flip: 1, sickT: 0, claimBubble: null });
  }
  serialize() {
    const clean = JSON.parse(JSON.stringify(this.s, (k, v) => (['path', 'step', 'act', 'say', 'claimBubble', 'st', 'x', 'y', 'goal'].includes(k) ? undefined : k === 'employees' ? v.filter(e => !e.leaving) : v)));
    return JSON.stringify(clean);
  }

  resizeSlots() {
    for (const k of ['coffee', 'ps', 'play', 'server']) {
      const n = this.capacity(k), a = this.slots[k];
      while (a.length < n) a.push(null);
    }
  }
  capacity(k) { const l = this.s.fac[k]; return l ? FACILITIES[k].levels[l - 1].slots : 0; }
  facInfo(k) { const l = this.s.fac[k]; return l ? FACILITIES[k].levels[l - 1] : null; }

  // ---------- Meja per departemen ----------
  totalDesks() { const c = this.s.deskCount; return c.ctrl + c.dev + c.ops; }
  deskOwned(i) { return (i % 3) < this.s.deskCount[DEPT_KEYS[Math.floor(i / 3)]]; }
  freeDesk(spec) {
    const d = deptOfSpec(spec), r = DEPT_KEYS.indexOf(d);
    for (let c = 0; c < this.s.deskCount[d]; c++) { const i = r * 3 + c; if (!this.s.employees.some(e => e.desk === i)) return i; }
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
    spec = spec || (team.length && Math.random() < 0.72 ? pick(team) : pick(SPEC_KEYS));
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

  matchFactor(e, t) { return e.spec === t.spec ? 1 : 0.5; }
  workRate(e, t) {
    const T = e.trait, base = (e.skill / 55) * 2.0 * (1 + (e.lvl - 1) * 0.05);
    const energyF = 0.45 + 0.55 * e.energy / 100, moodF = 0.65 + 0.35 * e.mood / 100;
    const stressF = e.stress > 70 ? 1 - 0.5 * (e.stress - 70) / 30 : 1;
    return base * (e.broken ? 0.5 : 1) * (e.deviceBonus || 1) * this.matchFactor(e, t) * energyF * moodF * stressF * (e.buff > 0 ? 1.2 : 1) * (T === 'rajin' ? 1.1 : 1) * (T === 'santai' ? 0.95 : 1);
  }

  assign(taskId, empId) {
    const t = this.task(taskId), e = this.emp(empId);
    if (!t || !e || t.state !== 'new' || e.task || e.st === 'sick' || e.leaving) return false;
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
    const c = this.s.tasks.filter(t => t.state === 'new');
    if (!c.length) return null;
    c.sort((a, b) => (this.matchFactor(e, b) - this.matchFactor(e, a)) || (a.deadline - b.deadline));
    return c[0];
  }

  finishTask(t, e) {
    const q = (e.mood >= 70 && e.stress < 62 && Math.random() < (e.trait === 'teliti' ? 0.9 : 0.5)) ? 'perfect' : (e.stress >= 85 && e.trait !== 'teliti' && Math.random() < 0.4 ? 'bug' : 'ok');
    t.state = 'done'; t.progress = t.work; t.q = q; t.claimT = 9; t.doneBy = e.id;
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
    const money = r1(t.reward * qm * (tapped ? 1.1 : 1));
    this.addMoney(money); s.week.tasks++; s.stat.tasksDone++;
    if (t.q === 'perfect') s.stat.perfect++;
    this.addXp(Math.round(t.xp * (t.q === 'perfect' ? 1.2 : 1)));
    if (e) { e.xp += t.xp; if (e.xp >= 60 * e.lvl) { e.xp -= 60 * e.lvl; e.lvl++; e.skill = Math.min(99, e.skill + 2); e.salary = r1(e.salary + 0.1); this.say(e, `Naik level ${e.lvl}! 🌟`, 3); this.emit('fx', { kind: 'stars', x: e.x, y: e.y }); } e.claimBubble = null; if (tapped) e.mood = clamp(e.mood + 3); }
    this.boost('service', t.pri === 'high' ? 1.4 : 0.8);
    this.cut('risk', 0.5); if (t.q === 'bug') s.risk = clamp(s.risk + 2.5);
    if (t.sec) { this.boost('security', t.sec); this.cut('risk', t.sec * 0.4); }
    if (t.spec === 'ctrl') { this.cut('risk', 0.7); this.boost('security', 0.6); }
    s.tasks = s.tasks.filter(x => x.id !== id);
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
    if (e.st === 'sick' || e.st === 'enter' || e.leaving) return false;
    if (e.act && e.act.kind === kind) return true;
    if (kind === 'nap') {
      this.cancelActivity(e); this.releaseWork(e);
      e.act = { kind: 'nap', t: 0, dur: 7, arrived: false };
      const d = this.goDeskPos(e);
      if (this.atPos(e, d)) { e.act.arrived = true; e.st = 'act'; e.goal = 'act'; } else this.setPath(e, d.x, d.y, 'act');
      return true;
    }
    if (!this.s.fac[kind]) { if (forced) this.toast('Belum punya fasilitas itu — beli di Toko ya! 🛍️', 'warn'); return false; }
    if (kind === 'coffee' && this.s.coffeeStock <= 0) { if (forced || Math.random() < 0.2) this.toast('☕ Biji kopi habis! Setujui pembelian stok di Inbox.', 'warn'); return false; }
    this.cancelActivity(e); this.releaseWork(e);
    const n = this.capacity(kind), idx = this.slots[kind].indexOf(null);
    if (idx >= 0) {
      this.slots[kind][idx] = e.id;
      e.act = { kind, slot: idx, t: 0, dur: kind === 'coffee' ? 3.6 : kind === 'ps' ? 10 : 8, arrived: false };
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
    for (const kind of ['coffee', 'ps', 'play']) {
      const q = this.queue[kind];
      while (q.length) {
        const idx = this.slots[kind].indexOf(null); if (idx < 0) break;
        const id = q.shift(), e = this.emp(id); if (!e) continue;
        this.slots[kind][idx] = id;
        e.act = { kind, slot: idx, t: 0, dur: kind === 'coffee' ? 3.6 : kind === 'ps' ? 10 : 8, arrived: false };
        const sp = spotFor(kind, idx, this.capacity(kind)); this.setPath(e, sp.x, sp.y, 'act');
      }
    }
  }

  arrive(e) {
    e.step = null; e.path = [];
    if (e.goal === 'leave') { this.removeEmp(e); return; }
    if (e.goal === 'work') { e.st = e.task ? 'work' : 'idle'; if (e.act) { e.act = null; } }
    else if (e.goal === 'act' && e.act) {
      e.st = 'act'; e.act.arrived = true;
      if (e.act.kind === 'ps') { this.say(e, pick(['Ayo main! 🎮', 'Player 2 siap!', 'GG ya~'])); }
      if (e.act.kind === 'play') this.say(e, pick(['Wheee~ 🛝', 'Yeay!', 'Lompat!']));
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
    } else if (a.kind === 'ps') { s.stat.psPlays++; this.say(e, pick(['Seru banget!', 'Menang! 🏆', 'Stres hilang~'])); this.face(e, 'happy', 3); }
    else if (a.kind === 'play') { s.stat.playPlays++; this.say(e, pick(['Hepi hepi! 🌈', 'Capek tapi senang~'])); this.face(e, 'happy', 3); }
    else if (a.kind === 'nap') { this.say(e, 'Segar lagi! 😊'); }
    this.cancelActivity(e);
    e.cool = 16 + rnd(0, 8);
    this.goWork(e);
    this.checkMissions();
  }

  // ---------- Simulasi ----------
  update(dtReal) {
    const s = this.s; if (!s || this.blocking || s.speed === 0) return;
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
    // dekorasi menambah mood
    if (e.mood < 92) e.mood += this.decorCount() * 0.03 * dt;

    switch (e.st) {
      case 'walk': this.moveEmp(e, dt); e.energy = clamp(e.energy - 0.25 * dt); break;
      case 'queue': e.stress = clamp(e.stress + 0.15 * dt); break;
      case 'act': this.tickAct(e, dt); break;
      case 'sick':
        e.sickT -= dt; e.energy = clamp(e.energy + 3 * dt); e.stress = clamp(e.stress - 3.2 * dt);
        if (e.sickT <= 0 && e.stress < 55) { e.st = 'idle'; this.say(e, 'Sudah segar lagi!'); this.goWork(e); }
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
    const s = this.s; if (!s.autoBreak || e.cool > 0) return;
    let kind = null;
    if (e.energy < 28) kind = s.fac.coffee ? 'coffee' : (e.energy < 15 ? 'nap' : null);
    if (!kind && e.stress > 66) kind = this.bestFun(e);
    if (!kind && e.mood < 52) kind = this.bestFun(e);
    if (!kind) return;
    if (!this.requestActivity(e, kind, false)) e.cool = 6;
  }
  bestFun(e) {
    const opts = []; const s = this.s;
    if (s.fac.ps) opts.push(['ps', e.trait === 'gamer' ? 3 : 1]);
    if (s.fac.play) opts.push(['play', e.trait === 'kucing' ? 3 : 1]);
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
    } else if (a.kind === 'play') {
      const l = this.facInfo('play'), r = (l ? l.rate : 1) * (e.trait === 'kucing' ? 1.2 : 1);
      e.stress = clamp(e.stress - 2.8 * r * dt); e.mood = clamp(e.mood + 2.3 * r * dt * (e.trait === 'ceria' ? 1.3 : 1)); e.energy = clamp(e.energy + 0.8 * dt);
      if (Math.random() < 0.006 && !e.say) this.say(e, pick(['Wiii~', 'Hehe!', 'Lagi lagi!']), 2);
    } else if (a.kind === 'nap') { e.energy = clamp(e.energy + 5 * dt); e.stress = clamp(e.stress - 0.8 * dt); }
    if (a.t >= a.dur) this.endActivity(e);
  }

  moveEmp(e, dt) {
    if (!e.step) e.step = e.path.shift();
    if (!e.step) { this.arrive(e); return; }
    const st = e.step, dx = st.x - e.x, dy = st.y - e.y, d = Math.hypot(dx, dy), m = WALK * dt;
    if (d <= m) { e.x = st.x; e.y = st.y; e.step = null; if (!e.path.length) this.arrive(e); }
    else { e.x += dx / d * m; e.y += dy / d * m; if (Math.abs(dx - dy) > 0.01) e.flip = dx - dy >= 0 ? 1 : -1; }
  }

  // ---------- Hari ----------
  endDay() {
    const s = this.s, prevDay = s.day;
    this._lunchSpawn = false;
    // gaji
    const salary = r1(s.employees.reduce((a, e) => a + e.salary, 0));
    this.addMoney(-salary);
    if (s.money < 0) {
      s.employees.forEach(e => e.mood = clamp(e.mood - 12));
      if (s.money < -15) { s.bailouts++; s.money = 20; s.risk = clamp(s.risk + 8); this.toast('Kantor pusat memberi dana darurat Rp 20 jt… hati-hati ya! 😰', 'warn'); this.addLog('Dana darurat dari kantor pusat.'); }
    }
    // tenggat
    let overdue = 0;
    for (const t of [...s.tasks]) {
      if ((t.state === 'new' || t.state === 'doing') && s.day >= t.deadline) {
        if (t.late === 0) { t.late = 1; t.deadline = s.day + 1; this.addStat('service', -3); this.addStat('risk', 2.5); this.addMoney(-0.5, 'quiet'); overdue++; this.toast(`⏰ Tiket "${t.title}" telat!`, 'warn'); }
        else { // batal
          const e = this.emp(t.emp); if (e) { e.task = null; this.releaseWork(e); this.goWork(e); }
          s.tasks = s.tasks.filter(x => x.id !== t.id); this.addStat('service', -6); this.addStat('risk', 5); this.addMoney(-1.5); overdue++;
          this.toast(`💔 Tiket "${t.title}" dibatalkan karena terlambat`, 'bad'); this.addLog('Tiket dibatalkan karena telat.');
        }
      }
    }
    // drift stat harian
    const sv = this.facInfo('server');
    this.addStat('security', -1.2); if (sv && sv.sec) this.boost('security', sv.sec * 1.5);
    this.addStat('risk', (70 - s.security) * 0.05 + 0.9);
    if (!overdue && s.tasks.every(t => t.late === 0)) this.addStat('service', -0.5); else this.addStat('service', -1.8);
    // permintaan yang tak diputuskan sampai tenggat
    for (const r of [...s.inbox]) if (s.day >= r.deadline) this.expireRequest(r);
    // hari baru
    s.day++; s.hour = 8;
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
    this.addLog(`Hari baru! Gaji tim −${fmtMoney(salary)}, ${added} tiket baru.`);
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
    const tot = pool.reduce((a, ev) => a + ev.weight(this), 0);
    let x = Math.random() * tot, chosen = pool[0];
    for (const ev of pool) { x -= ev.weight(this); if (x <= 0) { chosen = ev; break; } }
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
    const specs = [...SPEC_KEYS].sort(() => Math.random() - 0.5);
    const fem = [Math.random() < 0.4, Math.random() < 0.4, Math.random() < 0.4]; if (fem.every(Boolean)) fem[Math.floor(Math.random() * 3)] = false;   // minimal 1 cowok
    for (let i = 0; i < 3; i++) { const c = makeEmployee(specs[i], rollRarity(boost), used, fem[i]); c.cost = r1(c.salary * 6); list.push(c); used.push(c.name); }
    s.candidates = list;
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
  fireCost(e) { return r1(e.salary * 3); }
  fire(id) {
    const s = this.s, e = this.emp(id); if (!e || e.leaving) return false;
    if (s.employees.filter(x => !x.leaving).length <= 1) { this.toast('Minimal harus ada 1 karyawan di divisi 🥺', 'warn'); return false; }
    const c = this.fireCost(e); if (s.money < c) { this.toast(`Dana pesangon kurang (${fmtMoney(c)}) 🥲`, 'warn'); return false; }
    this.addMoney(-c);
    this.cancelActivity(e); this.releaseWork(e);
    const t = e.task && this.task(e.task); if (t) { t.state = 'new'; t.emp = null; t.progress = Math.max(0, t.progress * 0.5); }
    e.task = null; e.claimBubble = null; e.leaving = true; e.desk = -1;
    for (const tk of s.tasks) if (tk.state === 'done' && tk.doneBy === e.id) tk.doneBy = null;
    s.inbox = s.inbox.filter(r => r.from !== e.id);
    s.employees.forEach(x => { if (x !== e) x.mood = clamp(x.mood - 4); });
    this.say(e, 'Terima kasih untuk semuanya… 😢', 4); this.face(e, 'sleep', 6);
    this.setPath(e, ENTRY.x, ENTRY.y, 'leave');
    s.stat.fired = (s.stat.fired || 0) + 1; this.addLog(`${e.name} dipecat (pesangon ${fmtMoney(c)}).`);
    this.toast(`🚪 ${e.name} meninggalkan kantor. Meja ${DEPTS[deptOfSpec(e.spec)].name} kosong.`, 'info'); this.emit('sfx', 'oops'); this.emit('change'); return true;
  }
  removeEmp(e) { const s = this.s; this.cancelActivity(e); this.releaseWork(e); s.employees = s.employees.filter(x => x !== e); this.emit('change'); }
  hire(id, name, autoDesk) {
    const s = this.s, c = s.candidates.find(x => x.id === id); if (!c) return false;
    let di = this.freeDesk(c.spec);
    if (di < 0 && autoDesk) { const d = deptOfSpec(c.spec), dc = DESK_COSTS[this.totalDesks()] || 0; if (s.deskCount[d] < DESK_MAX && s.money >= dc + c.cost && this.buyDesk(d)) di = this.freeDesk(c.spec); }
    if (di < 0) { this.toast(`Meja ${DEPTS[deptOfSpec(c.spec)].name} penuh! Beli meja baru, atau pecat karyawan yang ada.`, 'warn'); return false; }
    if (s.money < c.cost) { this.toast('Dana tidak cukup untuk merekrut 🥲', 'warn'); return false; }
    const e = JSON.parse(JSON.stringify(c)); delete e.cost; e.desk = di; e.name = this.cleanName(name, c.name);
    this.addMoney(-c.cost); s.candidates = s.candidates.filter(x => x.id !== id);
    s.employees.push(e); this.initEmpRuntime(e); e.x = ENTRY.x; e.y = ENTRY.y; e.cool = 10;
    this.goWork(e); this.say(e, 'Salam kenal! 🌿', 4); this.face(e, 'happy', 4);
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
    if (s.level < nx.lvl) { this.toast(`Butuh level ${nx.lvl} dulu 🔒`, 'warn'); return false; }
    if (s.money < nx.cost) { this.toast('Dana belum cukup 🥲', 'warn'); return false; }
    this.addMoney(-nx.cost); s.fac[k]++; this.resizeSlots();
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
      ['memo', 2, () => s.day >= 3 && !s.inbox.some(r => r.type === 'memo')], ['project', 2.5, () => s.day >= 4 && !s.inbox.some(r => r.type === 'project')], ['coffee', 0, () => false]];
    if (!kind) { const pool = kinds.filter(k => k[2]()); let x = Math.random() * pool.reduce((a, k) => a + k[1], 0); kind = pool[0][0]; for (const k of pool) { x -= k[1]; if (x <= 0) { kind = k[0]; break; } } }
    const e = pick(emps.filter(x => kind === 'repair' ? !x.broken : true)) || pick(emps);
    switch (kind) {
      case 'repair': e.broken = true; return this.addRequest({ type: 'repair', icon: '🔧', from: e.id, title: `Laptop ${e.name.split(' ')[0]} rusak`, body: `"Bos, laptop saya mati total dan kerjaan jadi lambat. Boleh diperbaiki atau diganti baru?"`, opts: [{ k: 'fix', label: 'Perbaiki', cost: r1(rnd(1.8, 3)) }, { k: 'new', label: 'Beli baru', cost: r1(rnd(6, 8)) }], ttl: 3 });
      case 'coffee': return this.addRequest({ type: 'coffee', icon: '☕', from: (emps.find(x => x.trait === 'kopi') || e).id, title: 'Stok biji kopi hampir habis', body: '"Mesin kopi tinggal beberapa cangkir lagi… tolong setujui pembelian biji kopi ya!"', opts: [{ k: 'buy', label: 'Beli stok', cost: 3 }, { k: 'premium', label: 'Biji premium', cost: 6 }], ttl: 3 });
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
  resolveRequest(id, action, optKey, memo) {
    const s = this.s, r = s.inbox.find(x => x.id === id); if (!r) return false;
    const e = r.from ? this.emp(r.from) : null;
    if (action === 'reject') {
      s.inbox = s.inbox.filter(x => x.id !== id); s.stat.rejected++;
      if (r.type === 'leave' && e) { e.mood = clamp(e.mood - 8); this.say(e, 'Yah… oke deh 🥲', 3); }
      else if (r.type === 'training' && e) e.mood = clamp(e.mood - 4);
      else if (r.type === 'repair' && e) { this.say(e, 'Terpaksa pakai yang rusak… 😵', 3); e.mood = clamp(e.mood - 3); }
      else if (r.type === 'project') this.addStat('service', -1);
      else if (r.type === 'memo') { this.addStat('risk', 1.5); }
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
    switch (r.type) {
      case 'repair': if (e) { e.broken = false; if (opt.k === 'new') e.deviceBonus = 1.12; e.mood = clamp(e.mood + 8); this.say(e, opt.k === 'new' ? 'Laptop baru! Kencang! 💻✨' : 'Sudah normal lagi! 🔧', 3); this.face(e, 'happy', 3); } break;
      case 'coffee': s.coffeeStock += opt.k === 'premium' ? 45 : 40; if (opt.k === 'premium') s.employees.forEach(x => { x.mood = clamp(x.mood + 3); }); this.toast(`☕ Stok kopi terisi (${s.coffeeStock} cangkir)`, 'good'); break;
      case 'leave': if (e) { this.cancelActivity(e); this.releaseWork(e); const t = e.task && this.task(e.task); if (t) { t.state = 'new'; t.emp = null; e.task = null; } e.st = 'sick'; e.sickT = 18; e.stress = clamp(e.stress - 30); e.mood = clamp(e.mood + 18); const d = this.goDeskPos(e); e.x = d.x; e.y = d.y; e.step = null; e.path = []; this.say(e, 'Makasih, Bos! Cuti dulu 🏖️', 4); } break;
      case 'training': if (e) { e.skill = Math.min(99, e.skill + 3); e.xp += 30; e.mood = clamp(e.mood + 6); this.say(e, 'Ilmu baru! 📚', 3); this.emit('fx', { kind: 'stars', x: e.x, y: e.y }); } break;
      case 'memo': this.addMoney(3); this.boost('service', 2); this.cut('risk', 2); this.addXp(25); this.toast('📝 Memo diterima Direksi: bonus Rp 3 jt & layanan naik', 'good'); break;
      case 'project': this.spawnProject(r.project); this.addXp(40); this.toast(`📁 Proyek ${r.project} dimulai! 3 tiket besar masuk`, 'good'); break;
    }
    this.emit('sfx', 'hire'); this.addLog(`Disetujui: ${r.title}`); this.checkMissions(); this.emit('change'); return true;
  }
  expireRequest(r) {
    const s = this.s, e = r.from ? this.emp(r.from) : null; s.inbox = s.inbox.filter(x => x.id !== r.id);
    if (e) e.mood = clamp(e.mood - 6);
    if (r.type === 'memo') { this.addStat('risk', 2); this.addStat('service', -2); }
    if (r.type === 'project') this.addStat('service', -2);
    this.toast(`⌛ Permintaan "${r.title}" kedaluwarsa tanpa keputusan`, 'bad'); this.addLog(`Kedaluwarsa: ${r.title}`);
  }
  spawnProject(name) {
    const s = this.s, lv = s.level - 1;
    for (const [spec, phase, work, reward] of [['ctrl', 'Analisis & kontrol', 75, 6.5], ['dev', 'Pengembangan', 100, 8.5], ['ops', 'Implementasi', 80, 7]]) {
      s.tasks.push({ id: nid('T'), title: `${name}: ${phase}`, sub: 'Proyek besar dari Direksi', spec, work: Math.round(work * (1 + lv * 0.03)), reward: r1(reward * (1 + lv * 0.07)), xp: 90, onsite: spec === 'ops', sec: 0, pri: 'high', deadline: s.day + 6, state: 'new', progress: 0, emp: null, late: 0 });
    }
  }

  // ---------- Misi ----------
  missionValue(m) {
    const s = this.s, st = s.stat;
    switch (m.key) {
      case 'assigned': return st.assigned; case 'tasksDone': return st.tasksDone; case 'cups': return st.cups; case 'hired': return st.hired;
      case 'psPlays': return st.psPlays; case 'mochi': return st.mochi; case 'perfect': return st.perfect; case 'mgWins': return st.mgWins;
      case 'facCoffee': return s.fac.coffee; case 'facPs': return s.fac.ps; case 'facPlay': return s.fac.play;
      case 'approved': return st.approved; case 'memos': return st.memos;
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
