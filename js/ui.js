// Antarmuka DOM: HUD, panel, modal, toast, layar judul.
import { DIFFS, ECONS, LUNCH_MENUS, QUIRKS, SPECS, TRAITS, RARITY, PRIORITY, FACILITIES, DECOR, DESK_COSTS, DESK_LEVELS, DESK_MAX, DEPTS, DEPT_KEYS, deptOfSpec, LEVEL_TITLES, xpNeeded, MISSIONS, fmtMoney } from './data.js';
import { portrait, drawMochi } from './chibi.js';
import { sfx, setSound, isSound } from './audio.js';
import { playPatchRush } from './minigame.js';
import { hasSave, clearSave } from './store.js';
import { genLook } from './game.js';
import { NAMES_F, NAMES_M, SURNAMES } from './data.js';
const randomName = female => { const a = female ? NAMES_F : NAMES_M; return `${a[Math.floor(Math.random() * a.length)]} ${SURNAMES[Math.floor(Math.random() * SURNAMES.length)]}`; };

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const TITLES = { inbox: '📥 Inbox Persetujuan', tasks: '📋 Tiket Tugas', team: '👥 Tim Divisi TI', shop: '🛍️ Toko Kantor', missions: '🎯 Misi & Jurnal' };

export const DIR_LOOKS = [
  { female: false, hair: '#2b1b14', style: 'wavy', bangs: 0, eye: '#5a3320', skin: '#f8d2b4', skirt: false, acc: 'none' },
  { female: true, hair: '#5a3a26', style: 'long', bangs: 0, eye: '#4a2a18', skin: '#ffe0c8', skirt: true, acc: 'none' },
  { female: false, hair: '#3a2418', style: 'side', bangs: 0, eye: '#5a3320', skin: '#e3ad86', skirt: false, acc: 'none' },
  { female: true, hair: '#4a2f20', style: 'long', bangs: 0, eye: '#4a2a18', skin: '#f3c6a2', skirt: true, hijab: true, hijabColor: '#cfeedd', acc: 'none' }
];

export class UI {
  constructor(game, scene, hooks) {
    this.g = game; this.scene = scene; this.hooks = hooks;
    this.tab = null; this.sig = ''; this.focus = null; this.modalOpen = false; this.mq = []; this.hintDismissed = {}; this.lastHint = ''; this.lastMoney = 0; this.accT = 0;
    this.desktop = window.matchMedia('(min-width:1180px)');
    this.bind();
  }

  // ---------- Pengikatan ----------
  bind() {
    const g = this.g;
    document.querySelectorAll('#nav button').forEach(b => b.addEventListener('click', () => { sfx('tap'); this.openTab(b.dataset.tab, null, true); }));
    $('#panelClose').addEventListener('click', () => this.closePanel());
    document.querySelectorAll('#speed button').forEach(b => b.addEventListener('click', () => { sfx('tap'); this.g.s.speed = +b.dataset.speed; this.hud(true); }));
    $('#settingsBtn').addEventListener('click', () => { sfx('tap'); this.showSettings(); });
    $('#dirBtn').addEventListener('click', () => { sfx('tap'); this.showSettings(); });
    $('#panelBody').addEventListener('click', e => this.onPanelClick(e));
    this.scene.onTap = h => this.onSceneTap(h);
    g.on('toast', t => this.toast(t.text, t.kind));
    g.on('sfx', n => sfx(n));
    g.on('change', () => { this.render(true); this.hud(true); });
    g.on('levelup', d => this.enqueue(() => this.showLevelUp(d)));
    g.on('event', ev => this.enqueue(() => this.showEvent(ev)));
    g.on('lunchmenu', () => this.enqueue(() => this.showLunchDialog()));
    g.on('gameover', d => { clearSave(); this.mq = []; this.showGameOver(d); });
    g.on('report', r => this.enqueue(() => this.showReport(r)));
    $('#hint').addEventListener('click', e => { if (e.target.closest('button')) { this.hintDismissed[this.lastHint] = performance.now(); this.updateHint(true); } });
    this.desktop.addEventListener('change', () => this.afterModeChange());
    $('#zIn').addEventListener('click', () => { sfx('tap'); this.scene.zoomBy(1.25); });
    $('#zOut').addEventListener('click', () => { sfx('tap'); this.scene.zoomBy(0.8); });
    $('#zReset').addEventListener('click', () => { sfx('tap'); this.scene.resetView(); });
  }
  afterModeChange() { if (this.desktop.matches && !this.tab) this.openTab('tasks'); this.render(true); this.layout(); }
  // area peta yang tidak tertutup UI
  layout() {
    const d = this.desktop.matches, open = $('#panel').classList.contains('open');
    const inset = d ? { l: 104, r: 440, t: 76, b: 12 } : { l: 0, r: 0, t: 0, b: open ? Math.min($('#panel').offsetHeight || 0, window.innerHeight * 0.6) - 62 : 0 };
    this.scene.setInset(inset);
  }

  // ---------- Awal permainan ----------
  startSession() {
    $('#app').hidden = false; $('#title').hidden = true;
    const s = this.g.s; setSound(s.sound);
    this.layout();
    this.dirImg = '';
    this.hud(true);
    if (this.desktop.matches) this.openTab('tasks'); else this.closePanel();
  }

  // ---------- Panel ----------
  openTab(tab, focus, toggle) {
    if (toggle && !this.desktop.matches && this.tab === tab && $('#panel').classList.contains('open')) { this.closePanel(); return; }
    this.tab = tab; this.focus = focus || null; this.sig = '';
    $('#panel').classList.add('open');
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('#panelTitle').textContent = TITLES[tab];
    this.render(true); this.layout();
    if (focus) requestAnimationFrame(() => { const el = $('#panelBody').querySelector('.focus'); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  }
  closePanel() {
    if (this.desktop.matches) return;
    $('#panel').classList.remove('open'); this.tab = null;
    document.querySelectorAll('#nav button').forEach(b => b.classList.remove('on')); this.layout();
  }

  statusText(e) {
    const g = this.g;
    switch (e.st) {
      case 'sick': return e.hidden ? '🏖️ Sedang cuti (di luar kantor)' : '😵 Burnout — sedang pulih';
      case 'act': if (e.act && e.act.kind === 'meeting') return '📋 Rapat di Ruang Meeting'; return ({ coffee: '☕ Sedang ngopi', lunch: '🍽️ Makan siang', party: '🎉 Pesta di Aula', greet: '🙇 Menyambut Direksi', gossip: '🗣️ Bergosip (kerja tersendat)', snack: '🍪 Ngemil', ps: '🎮 Main PS', play: '🛝 Bermain seru', pool: '🏊 Berenang', nap: '😴 Tidur sebentar', summon: '📢 Dipanggil Kepala Divisi' })[e.act && e.act.kind] || '…';
      case 'act': return ({ coffee: '☕ Sedang ngopi', lunch: '🍽️ Makan siang', party: '🎉 Pesta di Aula', greet: '🙇 Menyambut Direksi', gossip: '🗣️ Bergosip', snack: '🍪 Ngemil', ps: '🎮 Main PS', play: '🛝 Bermain seru', nap: '😴 Tidur sebentar' })[e.act && e.act.kind] || '…';
      case 'queue': return '⏳ Antri fasilitas';
      case 'walk': if (e.onLeave) return '🚪 Berjalan ke pintu (cuti)'; if (e.leaving) return '🚪 Meninggalkan kantor'; return e.goal === 'act' || e.goal === 'queue' ? '🚶 Menuju istirahat' : '🚶 Berjalan';
      case 'work': { const t = g.task(e.task); return `💼 ${t ? t.title : 'Bekerja'}`; }
      default: return e.task ? '🚶 Menuju meja' : '💤 Menganggur — beri tugas!';
    }
  }

  bar(cls, key, pct) { return `<div class="bar ${cls}"><i data-bar="${key}" style="width:${pct.toFixed(0)}%"></i></div>`; }
  dyn(key) {
    const [k, id] = key.split(':'), g = this.g;
    if (k === 'tp') { const t = g.task(id); return t ? clamp(t.progress / t.work * 100) : 0; }
    const e = g.emp(id); if (!e) return 0;
    return k === 'en' ? e.energy : k === 'st' ? e.stress : e.mood;
  }
  updateDyn() {
    const root = $('#panelBody');
    root.querySelectorAll('[data-bar]').forEach(el => { el.style.width = this.dyn(el.dataset.bar).toFixed(0) + '%'; });
    root.querySelectorAll('[data-status]').forEach(el => { const e = this.g.emp(el.dataset.status); if (e) { const t = this.statusText(e); if (el.textContent !== t) el.textContent = t; } });
  }

  render(force) {
    if (!this.tab || !this.g.s) return;
    const view = this[this.tab + 'View']();
    if (!force && view.sig === this.sig) { this.updateDyn(); return; }
    const body = $('#panelBody'), top = body.scrollTop;
    if (view.sig === this.sig && !force) return;
    this.sig = view.sig; body.innerHTML = view.html; body.scrollTop = top; this.updateDyn();
  }

  // ----- Tab Tugas -----
  tasksView() {
    const g = this.g, s = g.s;
    const order = { doing: 0, done: 1, new: 2 };
    const tasks = [...s.tasks].sort((a, b) => order[a.state] - order[b.state] || a.deadline - b.deadline);
    const adv = g.loadAdvice().map(x => x.dept + x.open + x.staff).join(',') + DEPT_KEYS.map(k => g.deptLoad(k).open + ':' + g.deptLoad(k).staff).join(',');
    const sig = 'T' + s.day + Math.round(s.money * 2) + s.employees.length + (s.debt || 0) + (s.econ ? s.econ.id + s.econ.left : '') + adv + (s.auto ? 'a' : '') + (s.autoBreak ? 'b' : '') + tasks.map(t => t.id + t.state + (t.emp || '') + t.late + (g.emps.some(e => !e.task && e.st !== 'sick') ? 'i' : '')).join(',');
    let html = `<div class="toggles">
      <button class="tog ${s.auto ? 'on' : ''}" data-act="toggle" data-k="auto"><span class="sw"></span>🤖 Auto-tugas</button>
      <button class="tog ${s.autoBreak ? 'on' : ''}" data-act="toggle" data-k="autoBreak"><span class="sw"></span>☕ Auto-istirahat</button></div>`;
    const ec = g.econInfo(), di = g.diffInfo(), cost = g.dailyCost(), rw = g.runway();
    html += `<div class="card" style="border-left:7px solid ${rw < 3 ? '#e5484d' : rw < 7 ? '#e0a100' : '#2fae6a'}"><div class="t-title">💰 Keuangan <span class="chip">${di.emoji} ${di.name}</span></div>
      <div class="kv" style="margin-top:6px"><span>Kas</span><b class="${s.money < 0 ? 'r' : ''}">${fmtMoney(s.money)}</b><span>Biaya tetap / hari</span><b>${fmtMoney(cost)}</b><span>↳ gaji + operasional${s.debt ? ' + cicilan' : ''}</span><b>${fmtMoney(g.salaryTotal())} + ${fmtMoney(g.overhead())}${s.debt ? ' + ' + fmtMoney(g.debtPay()) : ''}</b><span>Kas cukup untuk</span><b class="${rw < 3 ? 'r' : ''}">${rw} hari tanpa pemasukan</b>${s.debt ? `<span>🏦 Utang</span><b class="r">${fmtMoney(s.debt)}</b>` : ''}</div>
      ${ec ? `<div class="t-sub" style="margin-top:6px;font-weight:800">${ec.emoji} ${ec.name} (${s.econ.left} hari lagi): ${ec.desc}</div>` : ''}${s.surcharge ? `<div class="t-sub" style="font-weight:800">🏷️ Kenaikan biaya vendor +${fmtMoney(s.surcharge.amt)}/hari (${s.surcharge.left} hari)</div>` : ''}
      <div class="t-sub" style="margin-top:4px">Pajak mingguan tiap 7 hari · ${di.bail >= 99 ? 'dana darurat tak terbatas' : di.bail ? 'sisa dana darurat: ' + Math.max(0, di.bail - (s.bailouts || 0)) + '×' : 'tanpa dana darurat — kas < −15 jt = bangkrut'}.</div></div>
    <div class="card"><div class="t-title">📊 Beban kerja per bidang</div>${DEPT_KEYS.map(k => {
      const L = g.deptLoad(k), D = DEPTS[k], pct = Math.min(100, L.per / 3.2 * 100), lv = { high: ['#e5484d', '🔴 Kewalahan'], mid: ['#e0a100', '🟡 Sibuk'], low: ['#2fae6a', '🟢 Santai'] }[L.level];
      return `<div style="margin-top:8px"><div class="t-sub" style="display:flex;justify-content:space-between;font-weight:800"><span style="color:#1f3a2e">${D.emoji} ${D.name}</span><span style="color:${lv[0]}">${lv[1]}</span></div>
        <div class="bar" style="height:9px;background:#e1eee6"><i style="width:${pct}%;background:${D.color}"></i></div>
        <div class="t-sub">${L.open} tiket (${L.waiting} menunggu${L.late ? `, ${L.late} telat` : ''}) · ${L.staff} karyawan${L.need ? ` <button class="btn sm" data-act="goteam" style="margin-left:4px">➕ Rekrut di bidang ini</button>` : ''}</div></div>`;
    }).join('')}</div>`;
    if (!tasks.length) html += `<div class="empty"><span class="big">🎉</span>Semua tiket beres! Tunggu tiket baru besok ya~</div>`;
    for (const t of tasks) {
      const sp = SPECS[t.spec], P = PRIORITY[t.pri], left = t.deadline - s.day;
      const dl = t.late ? `<span class="chip late">⏰ TELAT!</span>` : `<span class="chip ${left <= 1 ? 'late' : ''}">⏰ ${left <= 0 ? 'Hari ini' : left + ' hari'}</span>`;
      const e = t.emp ? g.emp(t.emp) : null;
      let act = '';
      if (t.state === 'new') act = `<button class="btn sm" data-act="assign" data-id="${t.id}">👉 Tugaskan</button>`;
      else if (t.state === 'doing' && e) act = `<div class="row" style="margin-top:8px"><div class="av sm" style="--rc:${RARITY[e.rarity].color}"><img src="${portrait(e.look, e.spec, 'focus', 40)}" alt=""></div><div class="grow"><div class="t-sub" style="margin:0">${esc(e.name)} sedang mengerjakan…</div>${this.bar('pr', 'tp:' + t.id, clamp(t.progress / t.work * 100))}</div><button class="btn ghost sm" data-act="unassign" data-id="${t.id}">Batal</button></div>`;
      else if (t.state === 'done') act = `<button class="btn gold sm" data-act="claim" data-id="${t.id}">🎉 Klaim ${t.q === 'perfect' ? '✨ Sempurna!' : ''}</button>`;
      const TD = DEPTS[deptOfSpec(t.spec)];
      html += `<div class="card ${t.state === 'done' ? 'done' : ''}" style="border-left:7px solid ${TD.color}">
        <div class="row"><div class="ico" style="background:${sp.color}">${sp.emoji}</div>
          <div class="grow"><div class="t-title">${esc(t.title)}</div><div class="t-sub">${esc(t.sub)}</div></div>
          ${t.state === 'new' || t.state === 'done' ? act : ''}</div>
        <div class="chips"><span class="chip" style="background:${TD.color}55;color:#1f3a2e;font-weight:900">${TD.emoji} Bidang: ${TD.name}</span><span class="chip" style="background:${sp.color}33;color:${sp.dark}">${sp.name}</span><span class="chip ${t.pri === 'high' ? 'hi' : t.pri === 'low' ? 'low' : ''}">${P.emoji} ${P.name}</span>${t.state !== 'done' ? dl : ''}<span class="chip money">💰 ${fmtMoney(t.reward)}</span><span class="chip xp">⭐ ${t.xp} XP</span>${t.onsite ? '<span class="chip">🖥️ di ruang server</span>' : ''}</div>
        ${t.state === 'doing' ? act : ''}</div>`;
    }
    return { html, sig };
  }

  // ----- Tab Inbox (persetujuan & memo) -----
  inboxView() {
    const g = this.g, s = g.s;
    const sig = 'B' + this.focus + s.day + '|' + s.inbox.map(r => r.id + r.opts.map(o => (s.money >= o.cost ? 1 : 0)).join('')).join(',') + '|' + s.memos.length + '|' + s.coffeeStock + '|' + s.snackStock + '|' + (s.projects || []).map(p => p.id + p.state).join(',');
    let html = `<div class="t-sub" style="margin:2px 4px 8px;font-weight:700">Karyawan, Direksi, dan klien mengajukan permintaan. Kamu yang memutuskan — ada yang butuh <b>memo resmi</b> ✍️. Stok kopi: <b>☕ ${s.coffeeStock}</b> · snack: <b>🍪 ${s.snackStock}</b>.</div>`;
    if (!s.inbox.length) html += `<div class="empty"><span class="big">📭</span>Tidak ada permintaan menunggu.<br>Bagus! Permintaan baru muncul tiap hari.</div>`;
    for (const r of s.inbox) {
      const e = r.from ? g.emp(r.from) : null, left = r.deadline - s.day;
      const who = e ? `<div class="av sm" style="--rc:${RARITY[e.rarity].color}"><img src="${portrait(e.look, e.spec, 'smile', 40)}" alt=""></div>` : `<div class="ico" style="background:#2c8a5c;width:34px;height:34px;font-size:18px">${r.icon}</div>`;
      const btns = r.opts.map(o => o.mg ? `<button class="btn lav sm" data-act="approvemg" data-id="${r.id}" data-k="${o.k}">🕹️ ${o.label}</button>` : r.memo
        ? `<button class="btn sm" data-act="memo" data-id="${r.id}" data-k="${o.k}">✍️ ${o.label}</button>`
        : `<button class="btn sm" data-act="approve" data-id="${r.id}" data-k="${o.k}" ${o.cost && s.money < o.cost ? 'disabled' : ''}>✅ ${o.label}${o.cost ? `<br><small>${fmtMoney(o.cost)}</small>` : ''}</button>`).join('');
      html += `<div class="card ${this.focus === r.id ? 'focus' : ''}"><div class="row">${who}<div class="grow"><div class="t-title">${r.icon} ${esc(r.title)}</div><div class="t-sub">${e ? 'Dari ' + esc(e.name) : 'Dari ' + esc(r.sender || 'Eksternal')}</div></div>
        <span class="chip ${left <= 1 ? 'late' : ''}">⏳ ${left <= 0 ? 'Hari ini' : left + ' hari'}</span></div>
        <div class="t-sub" style="margin-top:6px;font-weight:600;line-height:1.45">${esc(r.body)}</div>
        <div class="chips">${r.memo ? '<span class="chip warn">✍️ butuh memo</span>' : ''}${r.type === 'repair' ? '<span class="chip late">produktivitas −50% selama rusak</span>' : ''}</div>
        <div class="acts" style="margin-top:8px">${btns}${r.proj ? '' : `<button class="btn ghost sm" data-act="reject" data-id="${r.id}">❌ Tolak</button>`}</div></div>`;
    }
    const projs = s.projects || [];
    if (projs.length) html += `<div class="sec-title"><span>📁 Proyek</span></div>`;
    for (const p of projs) {
      const left = p.deadline - s.day;
      html += `<div class="card ${p.state === 'plan' ? 'done' : ''}"><div class="row"><div class="ico" style="background:#2c8a5c">📁</div><div class="grow"><div class="t-title">${esc(p.name)}</div><div class="t-sub">${p.state === 'plan' ? 'Disetujui — belum dimulai. Adakan rapat kick-off di Ruang Meeting!' : p.state === 'meeting' ? '📋 Rapat kick-off sedang berlangsung…' : p.state === 'wait' ? '⏸️ Menunggu keputusanmu di Inbox' : '⚙️ Sedang dikerjakan tim'}</div></div>${p.state === 'plan' ? `<span class="chip ${left <= 1 ? 'late' : ''}">⏳ ${left <= 0 ? 'Hari ini' : left + ' hari'}</span>` : ''}</div>
        ${this.stepper(p)}${p.state === 'plan' ? `<div class="acts" style="margin-top:8px"><button class="btn sm" data-act="kickoff" data-id="${p.id}">🗓️ Adakan rapat kick-off</button></div>` : ''}</div>`;
    }
    html += `<div class="sec-title"><span>🗂️ Arsip memo (${s.stat.memos})</span></div>`;
    html += s.memos.slice(0, 5).map(m => `<div class="card"><div class="t-title" style="font-size:12px">📝 ${esc(m.subject)}</div><div class="t-sub">Hari ${m.day} · kepada ${esc(m.to)}</div><div class="t-sub" style="margin-top:4px;font-weight:600">${esc(m.text.length > 130 ? m.text.slice(0, 130) + '…' : m.text)}</div></div>`).join('') || '<div class="t-sub" style="padding:0 6px">Belum ada memo yang kamu tulis.</div>';
    return { html, sig };
  }

  // Langkah proyek: Kick-off → Analisis → Pengembangan → Implementasi → Go-Live
  stepper(p) {
    const labels = ['Kick-off', 'Analisis', 'Develop', 'Implement', 'Go-Live'];
    const cur = p.state === 'plan' || p.state === 'meeting' ? 0 : (p.phase || 0) + 1 + (p.state === 'wait' ? 0 : 0);
    const steps = labels.map((l, i) => `<span class="chip" style="${i < cur ? 'background:#d7f5e2;color:#1a7a4a' : i === cur ? 'background:#fff1c2;color:#8a5a00;box-shadow:0 0 0 2px #ffd84d' : ''}">${i < cur ? '✔' : i === cur ? '▶' : '○'} ${l}</span>`).join('');
    const q = Math.max(0, Math.min(5, p.q || 0)), stars = '★'.repeat(Math.round(q)) + '☆'.repeat(5 - Math.round(q));
    return `<div class="chips" style="margin-top:8px">${steps}</div>${p.state !== 'plan' && p.state !== 'meeting' ? `<div class="t-sub" style="margin-top:4px">Kualitas proyek: <b style="color:#e0a000">${stars}</b></div>` : ''}`;
  }

  // ----- Tab Tim -----
  empCard(e) {
    const g = this.g, s = g.s, sp = SPECS[e.spec], R = RARITY[e.rarity], tr = TRAITS[e.trait];
    const btn = (k, ico, lbl) => `<button class="btn lav" data-act="brk" data-k="${k}" data-id="${e.id}" ${(k !== 'nap' && !s.fac[k]) || e.st === 'sick' ? 'disabled' : ''} title="${lbl}">${ico}</button>`;
    const tc = g.trainCost(e);
    const D = DEPTS[deptOfSpec(e.spec)], pl = g.perfLevel(e), q = e.quirk && QUIRKS[e.quirk];
    const perf = { good: ['#2fae6a', '🟢 Kinerja baik'], warn: ['#d99a00', '🟡 Perlu perhatian'], bad: ['#e5484d', '🔴 Kinerja buruk'] }[pl];
    return `<div class="card ${this.focus === e.id ? 'focus' : ''}" id="emp-${e.id}" style="border-left:7px solid ${D.color}">
      <div class="row"><div class="av" style="--rc:${R.color}"><img src="${portrait(e.look, e.spec, 'smile', 72)}" alt=""><span class="rar">${R.name}</span></div>
        <div class="grow"><div class="t-title">${esc(e.name)} <span class="chip">Lv.${e.lvl}</span>${e.sp ? ` <span class="chip late">SP${e.sp}</span>` : ''}</div>
          <div class="t-sub"><span class="chip" style="background:${D.color}44;color:#1f3a2e;font-weight:900">${D.emoji} ${D.name}</span> ${sp.emoji} ${sp.name}</div><div class="chips" style="margin-top:4px"><span class="chip" style="color:${perf[0]};font-weight:900">${perf[1]}</span>${q ? `<span class="chip late" title="${q.desc}">${q.emoji} ${q.name}</span>` : ''}</div>${(() => { const sg = g.suggestFor(e); return sg ? `<button class="btn sm ${sg.kind === 'fire' ? '' : 'gold'}" data-act="sugg" data-k="${sg.kind}" data-id="${e.id}" style="margin:5px 0 2px;${sg.kind === 'fire' ? 'background:linear-gradient(#ff8a8a,#e5484d);box-shadow:0 3px 0 #a82a2e;' : ''}">💡 Saran: ${sg.kind === 'fire' ? '🚪 Pecat' : '📄 Beri Surat Peringatan'} <small>(${sg.why})</small></button>` : ''; })()}
          <div class="chips"><span class="chip">${tr.emoji} ${tr.name}</span><span class="chip xp">💪 Skill ${e.skill}</span><span class="chip">💸 ${fmtMoney(e.salary)}/hari</span></div></div></div>
      <div class="t-sub" style="margin-top:6px">${tr.desc}</div>
      <div class="bars">
        <div class="mini"><span>⚡</span>${this.bar('en', 'en:' + e.id, e.energy)}</div>
        <div class="mini"><span>😣</span>${this.bar('st', 'st:' + e.id, e.stress)}</div>
        <div class="mini"><span>💚</span>${this.bar('mo', 'mo:' + e.id, e.mood)}</div></div>
      <div class="t-sub" style="margin-top:6px;font-weight:800" data-status="${e.id}">${esc(this.statusText(e))}</div>
      <div class="acts">${btn('coffee', '☕', 'Ngopi')}${btn('snack', '🍪', 'Ngemil')}${btn('ps', '🎮', 'Main PS')}${btn('play', '🛝', 'Bermain')}${btn('pool', '🏊', 'Berenang')}${btn('nap', '😴', 'Tidur')}
        <button class="btn mint" data-act="bonus" data-id="${e.id}" ${s.money < 1 ? 'disabled' : ''} title="Bonus Rp 1 jt">🎁</button>
        <button class="btn ghost" data-act="rename" data-id="${e.id}" title="Ganti nama">✏️</button><button class="btn lav" data-act="summon" data-id="${e.id}" title="Panggil ke ruangan" ${e.st === 'sick' ? 'disabled' : ''}>📢</button><button class="btn ghost" data-act="fire" data-id="${e.id}" title="Pecat" style="color:#d6334f">🚪</button><button class="btn gold" data-act="train" data-id="${e.id}" ${s.money < tc || e.skill >= 99 ? 'disabled' : ''} title="Kursus">📚 <small>${fmtMoney(tc).replace('Rp ', '')}</small></button></div></div>`;
  }
  teamView() {
    const g = this.g, s = g.s, crew = s.employees.filter(e => !e.leaving);
    const sig = 'M' + this.focus + g.loadAdvice().map(x => x.dept).join('') + crew.map(e => e.id + (e.suggK || '') + Math.floor(e.fails || 0) + (e.quirk || '') + (e.sp || 0) + (e.hidden ? 'h' : '') + e.lvl + e.skill + (s.fac.coffee ? 1 : 0) + (s.fac.snack ? 1 : 0) + (s.fac.ps ? 1 : 0) + (s.fac.play ? 1 : 0) + (s.money < 1 ? 0 : 1) + (s.money < g.trainCost(e) ? 0 : 1) + (e.st === 'sick' ? 's' : '')).join(',') + '|' + s.candidates.map(c => c.id + (s.money >= c.cost ? 1 : 0) + (g.freeDesk(c.spec) < 0 ? 'f' : '')).join(',') + g.totalDesks() + (s.money >= 1.5 ? 'r' : '');
    let html = `<div class="sec-title"><span>Tim kamu (${crew.length}/${g.totalDesks()} meja)</span></div>`;
    if (!crew.length) html += `<div class="empty"><span class="big">🪑</span>Belum ada karyawan.</div>`;
    const flagged = crew.filter(e => g.suggestFor(e)), adv = g.loadAdvice();
    if (flagged.length || adv.length) html += `<div class="card" style="border:2px solid #e5484d;background:#fff6f6"><div class="t-title">💡 Saran sistem untuk Kepala Divisi</div>${adv.map(x => `<div class="t-sub" style="margin-top:4px">📈 <b>${DEPTS[x.dept].name}</b> kebanjiran tiket (${x.open} tiket / ${x.staff} orang) → disarankan <b>rekrut karyawan</b> (lihat kandidat di bawah)</div>`).join('')}${flagged.map(e => { const sg = g.suggestFor(e); return `<div class="t-sub" style="margin-top:4px"><b>${esc(e.name)}</b> (${DEPTS[deptOfSpec(e.spec)].name}) → ${sg.kind === 'fire' ? '🚪 disarankan <b>dipecat</b>' : '📄 disarankan <b>Surat Peringatan</b>'} · ${sg.why}</div>`; }).join('')}</div>`;
    for (const dk of DEPT_KEYS) {
      const list = crew.filter(e => deptOfSpec(e.spec) === dk); if (!list.length) continue;
      const D = DEPTS[dk];
      html += `<div class="sec-title" style="border-left:6px solid ${D.color};padding-left:8px"><span>${D.emoji} ${D.name} (${list.length}/${s.deskCount[dk]} meja) · ${g.deptLoad(dk).open} tiket</span></div>` + list.map(e => this.empCard(e)).join('');
    }
    html += `<div class="sec-title"><span>🌿 Calon karyawan (baru tiap hari)</span><button class="btn ghost sm" data-act="reroll" ${s.money < 1.5 ? 'disabled' : ''}>🔄 Cari lagi · Rp 1,5 jt</button></div>`;
    for (const c of s.candidates) {
      const sp = SPECS[c.spec], R = RARITY[c.rarity], tr = TRAITS[c.trait], full = g.freeDesk(c.spec) < 0, maxed = full && s.deskCount[deptOfSpec(c.spec)] >= DESK_MAX;
      html += `<div class="card"><div class="row"><div class="av" style="--rc:${R.color}"><img src="${portrait(c.look, c.spec, 'happy', 72)}" alt=""><span class="rar">${R.name}</span></div>
        <div class="grow"><div class="t-title">${esc(c.name)} <span class="chip" style="background:${R.color}33;color:${R.color}">${R.label}</span></div><div class="t-sub">${sp.emoji} ${sp.name} · ${DEPTS[deptOfSpec(c.spec)].name}</div>
        <div class="chips"><span class="chip">${tr.emoji} ${tr.name}</span><span class="chip xp">💪 ${c.skill}</span>${g.loadAdvice().some(x => x.dept === deptOfSpec(c.spec)) ? '<span class="chip money">🔥 Dibutuhkan</span>' : ''}${c.quirk ? `<span class="chip late" title="${QUIRKS[c.quirk].desc}">${QUIRKS[c.quirk].emoji} ${QUIRKS[c.quirk].name}</span>` : ''}${full ? `<span class="chip late">🪑 ${maxed ? `departemen penuh (${DESK_MAX}/${DESK_MAX})` : 'butuh meja'}</span>` : ''}<span class="chip">💸 ${fmtMoney(c.salary)}/hari</span></div></div>
        <button class="btn mint sm" data-act="hire" data-id="${c.id}" ${maxed || s.money < c.cost ? 'disabled' : ''}>Rekrut<br><small>${fmtMoney(c.cost)}</small></button></div></div>`;
    }
    return { html, sig };
  }

  // ----- Tab Toko -----
  shopView() {
    const g = this.g, s = g.s;
    const tot = g.totalDesks(), nxD = tot < 27 ? { cost: DESK_COSTS[tot], lvl: DESK_LEVELS[tot] } : null;
    const sig = 'S' + this.focus + s.level + '|' + Object.entries(s.fac).map(([k, v]) => { const n = g.nextFac(k); return k + v + (n && s.money >= n.cost ? 1 : 0); }).join(',') + '|' + JSON.stringify(s.deskCount) + (nxD && s.money >= nxD.cost ? 'y' : 'n') + '|' + Object.entries(DECOR).map(([k, d]) => k + (s.decor[k] ? 1 : 0) + (s.money >= d.cost ? 1 : 0)).join(',');
    let html = `<div class="sec-title"><span>Fasilitas</span></div>`;
    for (const [k, F] of Object.entries(FACILITIES)) {
      const lv = s.fac[k], cur = lv ? F.levels[lv - 1] : null, nx = g.nextFac(k);
      const locked = nx && s.level < nx.lvl, poor = nx && s.money < nx.cost;
      html += `<div class="card ${this.focus === 'fac:' + k ? 'focus' : ''} ${locked ? 'locked' : ''}"><div class="row"><div class="shop-ico">${F.emoji}</div>
        <div class="grow"><div class="t-title">${F.name} <span class="chip">${F.room}</span></div>
        <div class="t-sub">${cur ? '✅ ' + cur.name : 'Belum dibeli'}</div>
        ${nx ? `<div class="t-sub" style="color:var(--pink2);font-weight:800;margin-top:3px">${lv ? '⬆️ ' : '✨ '}${nx.name}</div><div class="t-sub">${nx.desc}</div>` : `<div class="t-sub" style="color:var(--mint2);font-weight:800">Level maksimal! ✨</div>`}
        <div class="lvl-dots">${F.levels.map((_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>
        ${nx ? `<button class="btn ${locked ? 'ghost' : ''} sm" data-act="buyfac" data-k="${k}" ${locked || poor ? 'disabled' : ''}>${locked ? '🔒 Lv.' + nx.lvl : (lv ? 'Upgrade' : 'Beli')}<br><small>${fmtMoney(nx.cost)}</small></button>` : ''}</div></div>`;
    }
    html += `<div class="sec-title"><span>Meja kerja per departemen</span></div>`;
    for (const d of DEPT_KEYS) {
      const D = DEPTS[d], n = s.deskCount[d], lock = nxD && s.level < nxD.lvl;
      html += `<div class="card ${this.focus === 'desk:' + d ? 'focus' : ''}"><div class="row"><div class="shop-ico">${D.emoji}</div><div class="grow"><div class="t-title">${D.name}</div><div class="t-sub">${D.sub} · ${D.specs.map(x => SPECS[x].name).join(' / ')}</div><div class="lvl-dots">${Array.from({ length: DESK_MAX }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div></div>${n < DESK_MAX && nxD ? `<button class="btn sm" data-act="buydesk" data-k="${d}" ${lock || s.money < nxD.cost ? 'disabled' : ''}>${lock ? '🔒 Lv.' + nxD.lvl : '+ Meja'}<br><small>${fmtMoney(nxD.cost)}</small></button>` : '<span class="chip">Maks ✨</span>'}</div></div>`;
    }
    html += `<div class="sec-title"><span>Dekorasi (mood tim naik pelan-pelan)</span></div><div class="decor-grid">`;
    for (const [k, d] of Object.entries(DECOR)) {
      const own = s.decor[k], lock = s.level < d.lvl;
      html += `<div class="card ${lock ? 'locked' : ''}"><div class="shop-ico">${d.emoji}</div><div class="t-title" style="font-size:12px">${d.name}</div><div class="t-sub">${d.desc}</div>
        ${own ? '<div class="chip" style="margin-top:6px">✅ Terpasang</div>' : `<button class="btn sm" style="margin-top:6px" data-act="buydecor" data-k="${k}" ${lock || s.money < d.cost ? 'disabled' : ''}>${lock ? '🔒 Lv.' + d.lvl : fmtMoney(d.cost)}</button>`}</div>`;
    }
    html += '</div>';
    return { html, sig };
  }

  // ----- Tab Misi -----
  missionsView() {
    const g = this.g, s = g.s;
    const list = MISSIONS.map(m => ({ m, ms: s.missions[m.id] || { done: false, claimed: false }, v: g.missionValue(m) }));
    list.sort((a, b) => (b.ms.done && !b.ms.claimed) - (a.ms.done && !a.ms.claimed) || a.ms.claimed - b.ms.claimed);
    const sig = 'Q' + list.map(x => x.m.id + (x.ms.done ? 1 : 0) + (x.ms.claimed ? 1 : 0) + Math.min(x.v, x.m.need)).join(',') + s.log.length + (s.log[0] || '');
    let html = `<div class="sec-title"><span>Misi</span></div>`;
    for (const { m, ms, v } of list) {
      const pct = clamp(v / m.need * 100);
      html += `<div class="card ${ms.done && !ms.claimed ? 'done' : ''}" style="${ms.claimed ? 'opacity:.55' : ''}"><div class="row"><div class="ico" style="background:${ms.claimed ? '#b8e6cc' : ms.done ? '#ffc23d' : '#c9b4ff'}">${ms.claimed ? '✅' : ms.done ? '🎁' : '🎯'}</div>
        <div class="grow"><div class="t-title">${m.title}</div><div class="t-sub">${m.desc}</div>
        <div class="prog-line"><div class="bar pr"><i style="width:${pct.toFixed(0)}%"></i></div>${Math.min(v, m.need)}/${m.need}</div>
        <div class="chips"><span class="chip money">💰 ${fmtMoney(m.money)}</span>${m.xp ? `<span class="chip xp">⭐ ${m.xp} XP</span>` : ''}</div></div>
        ${ms.done && !ms.claimed ? `<button class="btn gold sm" data-act="claimm" data-id="${m.id}">Klaim!</button>` : ''}</div></div>`;
    }
    html += `<div class="sec-title"><span>📖 Jurnal kantor</span></div><div class="log">${s.log.slice(0, 14).map(l => `<div>${esc(l)}</div>`).join('') || '<div>Belum ada cerita.</div>'}</div>`;
    return { html, sig };
  }

  // ---------- Klik panel ----------
  onPanelClick(e) {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const g = this.g, id = b.dataset.id, k = b.dataset.k;
    switch (b.dataset.act) {
      case 'toggle': g.s[k] = !g.s[k]; sfx('tap'); break;
      case 'goteam': sfx('tap'); this.openTab('team'); return;
      case 'approve': g.resolveRequest(id, 'approve', k); break;
      case 'reject': g.resolveRequest(id, 'reject'); break;
      case 'memo': sfx('tap'); this.showMemoDialog(id, k); return;
      case 'approvemg': sfx('tap'); this.runRequestMinigame(id, k); return;
      case 'kickoff': sfx('tap'); this.showKickoffDialog(id); return;
      case 'assign': sfx('tap'); this.showAssign(id); return;
      case 'unassign': g.unassign(id); sfx('tap'); break;
      case 'claim': g.claimTask(id, true); break;
      case 'brk': { const em = g.emp(id); if (em && g.requestActivity(em, k, true)) { sfx('pop'); g.toast(`${em.name}: ${({ coffee: 'ngopi ☕', snack: 'ngemil 🍪', ps: 'main PS 🎮', play: 'main di taman 🛝', pool: 'berenang 🏊', nap: 'tidur sebentar 😴' })[k]}`, 'info'); } break; }
      case 'bonus': g.giveBonus(id); break;
      case 'train': g.train(id); break;
      case 'hire': sfx('tap'); this.showNameDialog(id, false); return;
      case 'rename': sfx('tap'); this.showNameDialog(id, true); return;
      case 'fire': sfx('tap'); this.showFireDialog(id); return;
      case 'sugg': sfx('tap'); if (k === 'fire') this.showFireDialog(id); else this.showSummonDialog(id); return;
      case 'summon': sfx('tap'); this.showSummonDialog(id); return;
      case 'reroll': g.rerollCandidates(); break;
      case 'buyfac': g.buyFacility(k); break;
      case 'buydesk': g.buyDesk(k); break;
      case 'buydecor': g.buyDecor(k); break;
      case 'claimm': g.claimMission(id); break;
    }
    this.render(true); this.hud(true);
  }

  onSceneTap(h) {
    const g = this.g;
    if (h.type === 'claim') { g.claimTask(h.id, true); return; }
    if (h.type === 'mochi') { g.petMochi(); return; }
    if (h.type === 'boss') { sfx('tap'); this.showSettings(); return; }
    if (h.type === 'gift') { const msg = g.collectGift(); this.scene.gift = null; this.scene.onFx({ kind: 'stars', x: h.x, y: h.y }); this.toast(msg, 'good'); this.hud(true); return; }
    if (h.type === 'emp' && g.s.inbox.some(r => r.from === h.id)) { sfx('tap'); this.openTab('inbox', g.s.inbox.find(r => r.from === h.id).id); return; }
    if (h.type === 'emp') { sfx('tap'); const e = g.emp(h.id); if (e) { g.face(e, 'happy', 1.5); g.say(e, ['Halo, Bos! 🌿', 'Ada apa?', 'Semangat! 💪', 'Hehe~'][Math.floor(Math.random() * 4)], 2); } this.openTab('team', h.id); if (e) this.scene.focusGrid(e.x, e.y); return; }
    if (h.type === 'desk') { sfx('tap'); this.openTab('shop', 'desk:' + h.dept); return; }
    if (h.type === 'room') {
      sfx('tap');
      if (h.kind === 'dining') { this.showLunchDialog(); return; } if (h.kind === 'inbox' || h.kind === 'meet') this.openTab('inbox'); else if (['ctrl', 'dev', 'ops'].includes(h.kind)) this.openTab('tasks'); else if (h.kind === 'boss') this.showSettings(); else if (h.kind !== 'garden') this.openTab('shop', 'fac:' + h.kind);
    }
  }

  // ---------- HUD ----------
  hud(force) {
    const g = this.g, s = g.s; if (!s) return;
    $('#dirName').textContent = s.name;
    $('#dirTitle').textContent = LEVEL_TITLES[Math.min(s.level, 10) - 1];
    $('#lvlBadge').textContent = s.level;
    const key = JSON.stringify(s.dirLook); if (this.dirKey !== key) { this.dirKey = key; $('#dirAvatar').src = portrait(s.dirLook, 'dir', 'happy', 64); }
    const need = xpNeeded(s.level); $('#xpFill').style.width = clamp(s.xp / need * 100) + '%'; $('#xpText').textContent = `${Math.floor(s.xp)}/${need} XP`;
    const st = g.stars(); $('#stars').textContent = '★'.repeat(st) + '☆'.repeat(5 - st); $('#stars').style.color = '#ffb400';
    const mEl = $('#money'); const txt = fmtMoney(s.money); if (mEl.textContent !== txt) { if (s.money > this.lastMoney) { mEl.classList.remove('bump'); void mEl.offsetWidth; mEl.classList.add('bump'); } mEl.textContent = txt; } this.lastMoney = s.money;
    mEl.style.color = s.money < 5 ? '#e5484d' : '';
    const h = Math.floor(s.hour), m = Math.floor((s.hour - h) * 60 / 10) * 10;
    $('#dayText').textContent = `Hari ${s.day}`; $('#hourText').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const setStat = (id, v, inv) => {
      const el = $(id), p = clamp(v), good = inv ? 100 - p : p;
      el.querySelector('i').style.width = p + '%'; el.querySelector('b').textContent = Math.round(p);
      el.querySelector('i').style.background = good >= 62 ? 'var(--mint)' : good >= 38 ? '#ffc23d' : 'var(--red)';
    };
    setStat('#stMood', g.avgMood()); setStat('#stSec', s.security); setStat('#stSvc', s.service); setStat('#stRisk', s.risk, true);
    document.querySelectorAll('#speed button').forEach(b => b.classList.toggle('on', +b.dataset.speed === s.speed));
    // titik notifikasi
    const idle = s.employees.some(e => !e.task && e.st !== 'sick') && s.tasks.some(t => t.state === 'new');
    $('#dotTasks').classList.toggle('on', idle || s.tasks.some(t => t.state === 'done'));
    $('#dotTeam').classList.toggle('on', s.employees.some(e => e.suggK) || g.loadAdvice().length > 0 || s.candidates.some(c => g.freeDesk(c.spec) >= 0 && s.money >= c.cost));
    $('#dotShop').classList.toggle('on', Object.keys(FACILITIES).some(k => { const n = g.nextFac(k); return n && s.level >= n.lvl && s.money >= n.cost && (s.fac[k] === 0); }));
    const lg = s.log.slice(0, 7).join('|'); if (this.lastLog !== lg) { this.lastLog = lg; $('#sideLog').innerHTML = `<h3>📖 Jurnal kantor</h3>${s.log.slice(0, 7).map(l => `<div>${esc(l)}</div>`).join('')}`; }
    $('#dotInbox').classList.toggle('on', s.inbox.length > 0 || (s.projects || []).some(p => p.state === 'plan'));
    $('#dotMissions').classList.toggle('on', Object.values(s.missions).some(x => x.done && !x.claimed));
  }

  // ---------- Petunjuk ----------
  computeHint() {
    const g = this.g, s = g.s;
    if ((s.projects || []).some(p => p.state === 'plan')) return ['📋', 'Proyek baru menunggu! Adakan rapat kick-off di tab Inbox agar tiket proyek mulai.'];
    if (s.inbox.length) return ['📥', `Ada ${s.inbox.length} permintaan menunggu persetujuanmu di tab Inbox!`];
    if (!s.stat.assigned && s.tasks.some(t => t.state === 'new')) return ['📋', 'Tap 📋 Tugas, pilih tiket, lalu "Tugaskan" ke karyawan ya!'];
    const idle = s.employees.find(e => !e.task && e.st === 'idle');
    if (idle && s.tasks.some(t => t.state === 'new') && !s.auto) return ['💤', `${idle.name} menganggur! Beri tiket atau nyalakan 🤖 Auto-tugas.`];
    const done = s.tasks.find(t => t.state === 'done'); if (done) return ['⭐', 'Ada hasil kerja! Tap gelembung "Klaim!" di atas karyawan.'];
    if (!s.fac.coffee && s.money >= 8) return ['☕', 'Beli Mesin Kopi di 🛍️ Toko biar tim nggak ngantuk!'];
    const hot = s.employees.find(e => e.stress > 72); if (hot) return ['😣', `${hot.name} stres berat! Suruh main PS atau ke taman bermain.`];
    if (s.candidates.some(c => g.freeDesk(c.spec) >= 0 && s.money >= c.cost)) return ['👥', 'Ada meja kosong! Rekrut teman baru di tab 👥 Tim.'];
    if (!s.fac.ps && s.level >= 2 && s.money >= 14) return ['🎮', 'Konsol PS sudah bisa dibeli! Stres tim bisa turun lho.'];
    if (!s.fac.play && s.level >= 2 && s.money >= 16) return ['🛝', 'Taman bermain terbuka! Kolam bola bikin mood naik.'];
    if (Object.values(s.missions).some(x => x.done && !x.claimed)) return ['🎁', 'Ada hadiah misi yang bisa diklaim di 🎯 Misi!'];
    if (s.stat.mochi < 3) return ['🐱', 'Tap Mochi, kucing putih itu, biar mood tim naik!'];
    return null;
  }
  updateHint(force) {
    const el = $('#hint'), h = this.computeHint(), now = performance.now();
    if (!h || this.modalOpen) { el.hidden = true; return; }
    const txt = h[1];
    if (this.hintDismissed[txt] && now - this.hintDismissed[txt] < 90000) { el.hidden = true; return; }
    this.lastHint = txt; el.hidden = false;
    const html = `<span class="mo">${h[0]}</span><span>${esc(txt)}</span><button aria-label="Tutup">✕</button>`;
    if (el.dataset.t !== txt) { el.innerHTML = html; el.dataset.t = txt; }
  }

  // ---------- Tick UI ----------
  tick(dt) {
    this.accT += dt;
    if (this.accT >= 0.2) { this.accT = 0; this.hud(); if (this.tab) this.render(false); this.hintT = (this.hintT || 0) + 1; if (this.hintT % 5 === 0) this.updateHint(); }
  }

  // ---------- Toast ----------
  toast(text, kind = 'info') {
    const box = $('#toasts');
    while (box.children.length >= 3) box.firstChild.remove();
    const el = document.createElement('div'); el.className = `toast ${kind}`; el.textContent = text; box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 3200);
  }

  // ---------- Modal ----------
  enqueue(fn) { if (this.modalOpen) this.mq.push(fn); else fn(); }
  openModal(html, onClose) {
    const m = $('#modal'); m.innerHTML = `<div class="modal">${html}</div>`; m.hidden = false; this.modalOpen = true; this.g.blocking = true; this.onClose = onClose || null;
    $('#hint').hidden = true;
    return m.firstElementChild;
  }
  closeModal() {
    const m = $('#modal'); m.hidden = true; m.innerHTML = ''; this.modalOpen = false;
    const cb = this.onClose; this.onClose = null;
    this.g.blocking = !!(this.g.pending || this.g.report);
    if (cb) cb();
    if (this.mq.length) { const n = this.mq.shift(); n(); }
  }

  // Dialog beri nama: untuk rekrut (isi nama sebelum bergabung) atau ganti nama karyawan
  showNameDialog(id, isRename) {
    const g = this.g, c = isRename ? g.emp(id) : g.s.candidates.find(x => x.id === id); if (!c) return;
    const sp = SPECS[c.spec], R = RARITY[c.rarity], tr = TRAITS[c.trait];
    const need = !isRename && g.freeDesk(c.spec) < 0, dept = deptOfSpec(c.spec), maxed = need && g.s.deskCount[dept] >= DESK_MAX, deskCost = DESK_COSTS[g.totalDesks()] || 0;
    const note = need ? (maxed ? `<div class="res bad" style="font-size:12px">Departemen ${DEPTS[dept].name} sudah penuh (${DESK_MAX} meja). Pecat salah satu karyawan dulu untuk merekrut.</div>` : `<div class="res" style="font-size:12px;border-color:#ffd84d">🪑 Meja ${DEPTS[dept].name} penuh. Kantor akan diperluas: beli meja baru ${fmtMoney(deskCost)} sekaligus rekrut.</div>`) : '';
    const root = this.openModal(`<div class="av" style="--rc:${R.color};width:84px;height:84px;margin:0 auto"><img src="${portrait(c.look, c.spec, 'happy', 84)}" alt=""></div>
      <h2>${isRename ? 'Ganti nama' : 'Rekrut karyawan baru'}</h2>
      <p>${sp.emoji} ${sp.name} · ${tr.emoji} ${tr.name} · 💪 Skill ${c.skill}${isRename ? '' : `<br>Biaya rekrut ${fmtMoney(c.cost)} · gaji ${fmtMoney(c.salary)}/hari`}</p>
      <div class="acts" style="margin:0 0 6px"><button class="btn lav sm" id="gM">👦 Cowok</button><button class="btn lav sm" id="gF">👧 Cewek</button><button class="btn mint sm" id="gR">🔀 Acak tampilan</button></div>
      <div class="field"><label>Nama karyawan</label><div class="row" style="gap:8px"><input id="inEmp" maxlength="14" value="${esc(c.name)}" autocomplete="off" style="flex:1"><button class="btn lav sm" id="rndName" title="Nama acak">🎲</button></div></div>
      ${note}<button class="btn block" id="okName" ${maxed || (need && g.s.money < deskCost + c.cost) ? 'disabled' : ''}>${isRename ? 'Simpan nama' : need ? `🪑 Beli meja & Rekrut ✨` : 'Rekrut ✨'}</button><button class="btn ghost block" style="margin-top:8px" data-close>Batal</button>`);
    const inp = root.querySelector('#inEmp'); setTimeout(() => { try { inp.focus(); inp.select(); } catch { /* abaikan */ } }, 60);
    const done = () => {
      const nm = inp.value;
      if (isRename) { g.rename(id, nm); this.closeModal(); }
      else { g.hire(id, nm, true); this.closeModal(); }
      this.render(true); this.hud(true);
    };
    root.querySelector('#okName').addEventListener('click', done);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') done(); });
    const refresh = (female, newName) => {
      const u = g.regenLook(id, female); if (!u) return;
      root.querySelector('.av img').src = portrait(u.look, u.spec, 'happy', 84);
      if (newName) inp.value = randomName(u.female);
    };
    root.querySelector('#gM').addEventListener('click', () => refresh(false, !isRename));
    root.querySelector('#gF').addEventListener('click', () => refresh(true, !isRename));
    root.querySelector('#gR').addEventListener('click', () => refresh(undefined, false));
    root.querySelector('#rndName').addEventListener('click', () => { sfx('pop'); inp.value = randomName(g.emp(id) ? g.emp(id).female : (g.s.candidates.find(x => x.id === id) || c).female); });
    root.addEventListener('click', e => { if (e.target.closest('[data-close]')) { sfx('tap'); this.closeModal(); } });
  }

  // Dialog menulis memo (wajib untuk proyek baru / memo ke Direksi)
  showMemoDialog(reqId, optKey) {
    const g = this.g, s = g.s, r = s.inbox.find(x => x.id === reqId); if (!r) return;
    const tpls = g.memoTemplates(r), toList = r.type === 'project' ? ['Tim Pengembangan', 'Seluruh Divisi TI', 'Direksi'] : ['Direksi', 'Seluruh Divisi TI'];
    const root = this.openModal(`<div class="big-emoji">📝</div><h2>Tulis Memo</h2><p>${esc(r.title)}</p>
      <div class="field"><label>Kepada</label><select id="mTo" class="sel">${toList.map(t => `<option>${t}</option>`).join('')}</select></div>
      <div class="field"><label>Perihal</label><input id="mSub" maxlength="60" value="${esc('Memo: ' + (r.project || r.title))}" autocomplete="off"></div>
      <div class="field"><label>Isi memo <small id="mCnt" style="color:var(--ink2)"></small></label><textarea id="mTxt" rows="5" maxlength="400" placeholder="Tulis memo resmi di sini…"></textarea></div>
      <div class="chips" style="justify-content:center;margin:0 0 8px">${tpls.map((t, i) => `<button class="chip" data-tpl="${i}" style="border:none;cursor:pointer;padding:5px 10px">✨ Contoh ${i + 1}</button>`).join('')}</div>
      <button class="btn block" id="mSend">Kirim Memo & ${r.type === 'project' ? 'Setujui Proyek' : 'Selesai'} ✅</button><button class="btn ghost block" style="margin-top:8px" data-close>Batal</button>`);
    const txt = root.querySelector('#mTxt'), cnt = root.querySelector('#mCnt'), upd = () => { const n = txt.value.trim().length; cnt.textContent = `(${n}/15 min)`; cnt.style.color = n >= 15 ? '#1f9a5a' : '#d6334f'; };
    txt.addEventListener('input', upd); upd(); setTimeout(() => { try { txt.focus(); } catch { /* abaikan */ } }, 60);
    root.querySelectorAll('[data-tpl]').forEach(b => b.addEventListener('click', () => { sfx('pop'); txt.value = tpls[+b.dataset.tpl]; upd(); }));
    root.querySelector('#mSend').addEventListener('click', () => {
      const ok = g.resolveRequest(reqId, 'approve', optKey, { to: root.querySelector('#mTo').value, subject: root.querySelector('#mSub').value, text: txt.value });
      if (ok) { this.closeModal(); this.render(true); this.hud(true); if (r.type === 'project') setTimeout(() => { const p = g.s.projects[g.s.projects.length - 1]; if (p && p.state === 'plan') this.showKickoffDialog(p.id); }, 120); }
    });
    root.addEventListener('click', e => { if (e.target.closest('[data-close]')) { sfx('tap'); this.closeModal(); } });
  }

  showGameOver(d) {
    const root = this.openModal(`<div style="font-size:54px;text-align:center">💸</div><h2>${esc(d.bank || 'Bank')} BANGKRUT!</h2>
      <p>${esc(d.why)}.<br>Kantor pusat menutup divisi TI-mu.</p>
      <div class="kv"><span>📅 Bertahan</span><b>${d.day} hari</b><span>⭐ Level</span><b>${d.level}</b><span>✅ Tiket selesai</span><b>${d.tasks}</b><span>🚀 Proyek Go-Live</span><b>${d.projects}</b><span>👥 Karyawan</span><b>${d.staff}</b></div>
      <p style="margin:8px 0">💡 Tips: pantau <b>Keuangan</b> di tab Tugas, jangan rekrut/beli fasilitas berlebihan, dan siapkan kas untuk insiden.</p>
      <button class="btn block" id="goAgain">🌿 Main Lagi</button>`);
    root.querySelector('#goAgain').addEventListener('click', () => { clearSave(); location.reload(); });
  }
  // Dialog menu makan siang: biaya dipotong saat jam makan siang untuk semua karyawan
  showLunchDialog() {
    const g = this.g, s = g.s, L = s.lunch; if (!L || L.day !== s.day || !['none', 'asked'].includes(L.state) || s.hour >= 12) return;
    const n = g.lunchDiners().length, disc = g.lunchDisc();
    const menus = LUNCH_MENUS.map(m => ({ m, total: g.lunchCost(m.id) }));
    const root = this.openModal(`<div style="font-size:42px;text-align:center">🍽️</div><h2>Menu makan siang hari ini</h2>
      <p>${n} karyawan akan makan di Ruang Makan pukul 12:00. Menu hari ini: <b>${g.lunchDish()}</b>.<br>Biaya dipotong dari kas saat makan siang.${disc ? ` <b>Diskon kulkas −${Math.round(disc * 100)}%</b>` : ''}</p>
      <div class="choices">${menus.map(({ m, total }) => `<button class="choice" data-m="${m.id}" ${total > s.money ? 'disabled' : ''}>${m.emoji} ${m.id === 'hemat' ? 'Nasi Kotak ' + g.lunchDish() : m.name} · ${total ? fmtMoney(total) : 'Gratis'}<small>${m.desc} (⚡+${m.energy} 💚${m.mood >= 0 ? '+' : ''}${m.mood}${m.stress ? ' 😣' + m.stress : ''}) · ${fmtMoney(m.cost * (1 - disc))}/orang</small></button>`).join('')}</div>
      <button class="btn ghost block" style="margin-top:10px" data-close>Nanti saja</button>`);
    root.addEventListener('click', ev => {
      if (ev.target.closest('[data-close]')) { sfx('tap'); L.state = 'asked'; this.closeModal(); return; }
      const b = ev.target.closest('.choice'); if (!b || b.disabled) return;
      if (g.orderLunch(b.dataset.m)) { sfx('buy'); this.closeModal(); this.render(true); this.hud(true); }
    });
  }

  showSummonDialog(id) {
    const g = this.g, e = g.emp(id); if (!e) return;
    const root = this.openModal(`<div class="av" style="--rc:${RARITY[e.rarity].color};width:84px;height:84px;margin:0 auto"><img src="${portrait(e.look, e.spec, 'stress', 84)}" alt=""></div>
      <h2>Panggil ${esc(e.name)}</h2><p>${SPECS[e.spec].emoji} ${SPECS[e.spec].name} · ⚡${Math.round(e.energy)} · 😣${Math.round(e.stress)} · 💚${Math.round(e.mood)}<br>Dia akan berjalan ke ruang Kepala Divisi. Pilih gayamu:</p>
      <div class="choices"><button class="choice" data-m="marah">😡 Marah-marah<small>Stres +, mood − (tim yang melihat jadi takut). Dia jadi terpacu 45 dtk. Bisa resign kalau mood sudah rendah!</small></button>
      <button class="choice" data-m="sp">📄 Surat Peringatan${e.suggK === 'sp' ? ' 💡 (disarankan)' : ''}<small>Resmi tercatat (SP${(e.sp || 0) + 1}). Mood turun, tapi dia jadi fokus 40 dtk. Setelah SP ke-3 disarankan pecat.</small></button>
      <button class="choice" data-m="tegur">😐 Tegur halus<small>Stres naik sedikit, jadi fokus sementara. Aman.</small></button>
      <button class="choice" data-m="semangat">🤗 Beri semangat<small>Mood naik, stres turun, dan bersemangat sementara.</small></button></div>
      <button class="btn ghost block" style="margin-top:10px" data-close>Batal</button>`);
    root.addEventListener('click', ev => {
      if (ev.target.closest('[data-close]')) { sfx('tap'); this.closeModal(); return; }
      const b = ev.target.closest('.choice'); if (!b) return;
      if (g.summon(id, b.dataset.m)) { this.closeModal(); this.scene.focusGrid(19, 4, 1.15); this.render(true); this.hud(true); }
    });
  }

  showFireDialog(id) {
    const g = this.g, e = g.emp(id); if (!e) return;
    const cost = g.fireCost(e), dept = DEPTS[deptOfSpec(e.spec)];
    const root = this.openModal(`<div class="av" style="--rc:${RARITY[e.rarity].color};width:84px;height:84px;margin:0 auto"><img src="${portrait(e.look, e.spec, 'stress', 84)}" alt=""></div>
      <h2>Pecat ${esc(e.name)}?</h2>${g.suggestFor(e) && g.suggestFor(e).kind === 'fire' ? `<p style="color:#d6334f;font-weight:800">💡 Disarankan: ${esc(g.suggestFor(e).why)}.</p>` : ''}<p>${SPECS[e.spec].emoji} ${SPECS[e.spec].name} · Lv.${e.lvl} · Skill ${e.skill}</p>
      <div class="kv"><span>💸 Pesangon (3× gaji harian)</span><b class="r">−${fmtMoney(cost)}</b><span>🪑 Meja ${dept.name}</span><b class="g">jadi kosong</b><span>💚 Mood tim lain</span><b class="r">−4</b></div>
      <p style="margin:6px 0 10px">Tiket yang sedang dikerjakan akan kembali ke antrean. Kamu bisa langsung merekrut pengganti di tab Tim.</p>
      <button class="btn block" id="okFire" style="background:linear-gradient(#ff8a8a,#e5484d);box-shadow:0 3px 0 #a82a2e" ${g.s.money < cost ? 'disabled' : ''}>🚪 Ya, pecat</button><button class="btn ghost block" style="margin-top:8px" data-close>Batal</button>`);
    root.querySelector('#okFire').addEventListener('click', () => { g.fire(id); this.closeModal(); this.render(true); this.hud(true); });
    root.addEventListener('click', e2 => { if (e2.target.closest('[data-close]')) { sfx('tap'); this.closeModal(); } });
  }

  // Dialog rapat kick-off proyek: pilih peserta & fokus proyek → peserta berkumpul di Ruang Meeting
  showKickoffDialog(pid) {
    const g = this.g, s = g.s, p = (s.projects || []).find(x => x.id === pid); if (!p) return;
    const crew = s.employees.filter(e => !e.leaving && e.st !== 'sick'), sel = new Set();
    const root = this.openModal(`<div class="big-emoji">📋</div><h2>Rapat Kick-off</h2><p>${esc(p.name)}<br>Pilih 2–6 peserta. Semakin lengkap perwakilan departemen & semakin tinggi skill, semakin bagus hasil proyek.</p>
      <div class="sec-title" style="justify-content:center">Peserta (<span id="kCnt">0</span>/6)</div>
      <div class="sel-list" style="max-height:34dvh;overflow:auto">${crew.map(e => `<button class="sel-item" data-id="${e.id}"><div class="av sm" style="--rc:${RARITY[e.rarity].color}"><img src="${portrait(e.look, e.spec, 'smile', 40)}" alt=""></div><div class="grow" style="text-align:left"><div class="t-title">${esc(e.name)}</div><div class="t-sub">${SPECS[e.spec].name} · ${DEPTS[deptOfSpec(e.spec)].name} · 💪${e.skill}</div></div><span class="chip" data-mark>＋</span></button>`).join('')}</div>
      <div class="sec-title" style="justify-content:center">Fokus proyek</div>
      <div class="choices"><button class="choice" data-sc="fast">⚡ Ngebut<small>Hadiah +30%, tenggat 4 hari, risiko +3</small></button><button class="choice" data-sc="balanced" style="border-color:#2fb36d">⚖️ Seimbang<small>Hadiah normal, tenggat 6 hari</small></button><button class="choice" data-sc="safe">🛡️ Aman<small>Hadiah −8%, tenggat 8 hari, risiko turun</small></button></div>
      <button class="btn block" id="kGo" style="margin-top:10px" disabled>Mulai Rapat 📋</button><button class="btn ghost block" style="margin-top:8px" data-close>Batal</button>`);
    let scope = 'balanced';
    const upd = () => { root.querySelector('#kCnt').textContent = sel.size; root.querySelector('#kGo').disabled = sel.size < 2; };
    root.querySelectorAll('.sel-item').forEach(b => b.addEventListener('click', () => { sfx('tap'); const id = b.dataset.id; if (sel.has(id)) sel.delete(id); else if (sel.size < 6) sel.add(id); else return; b.style.borderColor = sel.has(id) ? '#2fb36d' : ''; b.querySelector('[data-mark]').textContent = sel.has(id) ? '✔' : '＋'; upd(); }));
    root.querySelectorAll('[data-sc]').forEach(b => b.addEventListener('click', () => { sfx('tap'); scope = b.dataset.sc; root.querySelectorAll('[data-sc]').forEach(x => { x.style.borderColor = x === b ? '#2fb36d' : ''; }); }));
    root.querySelector('#kGo').addEventListener('click', () => { if (g.startKickoff(pid, [...sel], scope)) { this.closeModal(); this.scene.focusGrid(18.6, 12.8, 1.0); this.render(true); this.hud(true); } });
    root.addEventListener('click', e => { if (e.target.closest('[data-close]')) { sfx('tap'); this.closeModal(); } });
  }

  // Mini-game untuk opsi permintaan (mis. perbaiki bug kritis saat UAT proyek)
  runRequestMinigame(reqId, optKey) {
    const g = this.g, r = g.s.inbox.find(x => x.id === reqId); if (!r) return;
    const root = this.openModal('<div id="mgHost"></div>');
    playPatchRush(root.querySelector('#mgHost'), { title: r.title }).then(res => {
      if (res.tier >= 1) g.s.stat.mgWins++;
      this.closeModal(); g.resolveRequest(reqId, 'approve', optKey, null, { tier: res.tier }); this.render(true); this.hud(true);
    });
  }

  // Wizard awal permainan: rekrut 1 staf untuk tiap bidang & beri nama
  showStarterWizard(done) {
    const g = this.g, depts = DEPT_KEYS.filter(d => !g.s.employees.some(e => deptOfSpec(e.spec) === d));
    if (!depts.length) { g.s.starterDone = true; done(); return; }
    let step = 0, cands = [], sel = 0, name = '', named = false;
    const root = this.openModal('');
    const newPool = () => { cands = g.starterPool(depts[step], g.s.employees.map(e => e.name)); sel = 0; name = cands[0].name; named = false; };
    const paint = () => {
      const d = depts[step], D = DEPTS[d], c = cands[sel], last = step === depts.length - 1;
      root.innerHTML = `<div class="big-emoji">${D.emoji}</div><h2>Rekrut Tim Awal <small style="color:var(--ink2)">(${step + 1}/${depts.length})</small></h2>
        <p><b>${D.name}</b> · ${D.sub}<br>Pilih 1 staf untuk bidang ini, lalu beri nama.</p>
        <div class="sel-list">${cands.map((x, i) => `<button class="sel-item" data-i="${i}" style="${i === sel ? 'border-color:#2fb36d;box-shadow:0 0 0 3px #bfe8cf' : ''}"><div class="av sm" style="--rc:${RARITY[x.rarity].color}"><img src="${portrait(x.look, x.spec, 'happy', 40)}" alt=""></div><div class="grow" style="text-align:left"><div class="t-title">${esc(i === sel ? name || x.name : x.name)} <span class="chip" style="background:${RARITY[x.rarity].color}33;color:${RARITY[x.rarity].color}">${RARITY[x.rarity].label}</span></div><div class="t-sub">${SPECS[x.spec].emoji} ${SPECS[x.spec].name} · 💪${x.skill} · ${TRAITS[x.trait].emoji} ${TRAITS[x.trait].name}</div></div><span class="chip">${i === sel ? '✔' : '＋'}</span></button>`).join('')}</div>
        <div class="acts" style="margin:6px 0"><button class="btn lav sm" id="sM">👦 Cowok</button><button class="btn lav sm" id="sF">👧 Cewek</button><button class="btn mint sm" id="sR">🔀 Acak tampilan</button><button class="btn ghost sm" id="sP">🔄 Calon lain</button></div>
        <div class="field"><label>Nama staf</label><div class="row" style="gap:8px"><input id="stName" maxlength="14" value="${esc(name)}" autocomplete="off" style="flex:1"><button class="btn lav sm" id="sD" title="Nama acak">🎲</button></div></div>
        <button class="btn block" id="stNext">${last ? 'Mulai Bekerja ✨' : 'Lanjut ➜'}</button>`;
      const inp = root.querySelector('#stName'); inp.addEventListener('input', () => { name = inp.value; named = true; });
      root.querySelectorAll('.sel-item').forEach(b => b.addEventListener('click', () => { sfx('tap'); sel = +b.dataset.i; name = cands[sel].name; named = false; paint(); }));
      const regen = fem => { sfx('pop'); const x = cands[sel]; if (fem !== undefined) x.female = fem; x.look = genLook(x.female); if (!named || fem !== undefined) { name = randomName(x.female); x.name = name; named = false; } paint(); };
      root.querySelector('#sM').addEventListener('click', () => regen(false));
      root.querySelector('#sF').addEventListener('click', () => regen(true));
      root.querySelector('#sR').addEventListener('click', () => regen());
      root.querySelector('#sP').addEventListener('click', () => { sfx('pop'); newPool(); paint(); });
      root.querySelector('#sD').addEventListener('click', () => { sfx('pop'); name = randomName(cands[sel].female); cands[sel].name = name; named = false; paint(); });
      root.querySelector('#stNext').addEventListener('click', () => {
        g.addStarter(cands[sel], name || cands[sel].name); sfx('hire'); step++;
        if (step < depts.length) { newPool(); paint(); } else { g.s.starterDone = true; this.closeModal(); this.render(true); this.hud(true); done(); }
      });
    };
    newPool(); paint();
  }

  showAssign(taskId) {
    const g = this.g, t = g.task(taskId); if (!t) return;
    const list = [...g.emps].map(e => ({ e, match: g.matchFactor(e, t), busy: !!e.task || e.st === 'sick', other: !g.canDo(e, t) })).sort((a, b) => a.other - b.other || a.busy - b.busy || b.match - a.match || b.e.energy - a.e.energy);
    const rec = list.find(x => !x.busy && !x.other && x.match === 1);
    const root = this.openModal(`<h2>Siapa yang mengerjakan?</h2><p>${SPECS[t.spec].emoji} ${esc(t.title)}<br><b>Bidang: ${DEPTS[deptOfSpec(t.spec)].name}</b> — hanya karyawan bidang ini yang bisa mengerjakan.</p>
      <div class="sel-list">${list.map(({ e, match, busy, other }) => `<button class="sel-item" data-id="${e.id}" ${busy || other ? 'disabled' : ''}>
        <div class="av sm" style="--rc:${RARITY[e.rarity].color}"><img src="${portrait(e.look, e.spec, 'smile', 40)}" alt=""></div>
        <div class="grow" style="text-align:left"><div class="t-title">${esc(e.name)} ${rec && rec.e === e ? '<span class="chip" style="background:#fff1c2;color:#a37300">⭐ Rekomendasi</span>' : ''}</div>
        <div class="t-sub">${SPECS[e.spec].name} · ⚡${Math.round(e.energy)} · 😣${Math.round(e.stress)}</div></div>
        <span class="chip ${match === 1 ? 'money' : 'warn'}">${other ? 'Beda bidang' : busy ? (e.st === 'sick' ? 'Burnout' : 'Sibuk') : match === 1 ? 'Cocok 100%' : 'Cocok 80%'}</span></button>`).join('') || '<div class="empty">Belum ada karyawan.</div>'}</div>
      <button class="btn ghost block" data-close>Batal</button>`);
    root.addEventListener('click', ev => {
      if (ev.target.closest('[data-close]')) { sfx('tap'); this.closeModal(); return; }
      const b = ev.target.closest('.sel-item'); if (!b || b.disabled) return;
      if (g.assign(taskId, b.dataset.id)) { this.closeModal(); this.render(true); this.hud(true); }
    });
  }

  showEvent(ev) {
    const g = this.g;
    const root = this.openModal(`<div class="big-emoji">${ev.emoji}</div><h2>${esc(ev.title)}</h2><p>${esc(ev.text)}</p>
      <div class="choices">${ev.choices.map((c, i) => `<button class="choice" data-i="${i}" ${c.cost && g.s.money < c.cost ? 'disabled' : ''}>${c.label}${c.hint ? `<small>${esc(c.hint)}</small>` : ''}</button>`).join('')}</div>`);
    const showResult = res => {
      root.innerHTML = `<div class="big-emoji">${res.good ? '🌿' : '💦'}</div><h2>${res.good ? 'Hasilnya…' : 'Aduh…'}</h2><div class="res ${res.good ? '' : 'bad'}">${esc(res.text)}</div><button class="btn block" data-ok>Oke! 👍</button>`;
      sfx(res.good ? 'win' : 'oops');
      root.querySelector('[data-ok]').addEventListener('click', () => { sfx('tap'); this.closeModal(); this.render(true); this.hud(true); });
    };
    root.addEventListener('click', async e => {
      const b = e.target.closest('.choice'); if (!b || b.disabled || this.busyEvent) return;
      const i = +b.dataset.i, ch = ev.choices[i];
      sfx('tap'); this.busyEvent = true;
      try {
        let extra = {};
        if (ch.mg) { const r = await playPatchRush(root, { title: ev.title }); extra = { tier: r.tier }; if (r.tier >= 1) g.s.stat.mgWins++; }
        const res = g.resolveEvent(i, extra);
        if (res) showResult(res);
      } finally { this.busyEvent = false; }
    });
  }

  showLevelUp(d) {
    const g = this.g, s = g.s;
    this.scene.onFx({ kind: 'confetti' });
    const root = this.openModal(`<div class="big-emoji">🎉</div><h2>Naik Level ${d.level}!</h2><p>Kamu sekarang <b>${LEVEL_TITLES[Math.min(d.level, 10) - 1]}</b>. Bonus anggaran ${fmtMoney(d.bonus)} cair!</p>
      ${d.unlocks.length ? `<div class="sec-title" style="justify-content:center">Terbuka baru</div><div class="unlock">${d.unlocks.map(u => `<span>${u}</span>`).join('')}</div>` : ''}
      <button class="btn block" data-ok>Asyik! ✨</button>`);
    root.querySelector('[data-ok]').addEventListener('click', () => { sfx('tap'); this.closeModal(); this.hud(true); this.render(true); });
    g.checkMissions();
  }

  showReport(r) {
    const g = this.g, mvp = r.mvp && g.emp(r.mvp), happy = r.happy && g.emp(r.happy), net = r.income - r.expense;
    const root = this.openModal(`<div class="big-emoji">📊</div><h2>Rapor Minggu ke-${r.week}</h2><p>Direksi mengintip laporan divisi TI-mu…</p>
      <div class="kv"><span>💰 Pemasukan</span><b class="g">+${fmtMoney(r.income)}</b><span>💸 Pengeluaran</span><b class="r">−${fmtMoney(r.expense)}</b><span>📈 Selisih</span><b class="${net >= 0 ? 'g' : 'r'}">${net >= 0 ? '+' : ''}${fmtMoney(net)}</b><span>✅ Tiket selesai</span><b>${r.tasks}</b><span>⭐ Rating bank</span><b style="color:#ffb400">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</b></div>
      ${mvp ? `<div class="mvp"><div class="av sm" style="--rc:#ffc400"><img src="${portrait(mvp.look, mvp.spec, 'happy', 40)}" alt=""></div><div>🏆 Karyawan terbaik<br><b>${esc(mvp.name)}</b></div></div>` : ''}
      ${happy ? `<div class="mvp" style="background:#e6f6ea;border-color:#bfe3cb"><div class="av sm" style="--rc:#3fbf7f"><img src="${portrait(happy.look, happy.spec, 'happy', 40)}" alt=""></div><div>💚 Paling bahagia<br><b>${esc(happy.name)}</b></div></div>` : ''}
      <button class="btn block" data-ok>Lanjut minggu depan 🌿</button>`);
    sfx('win');
    root.querySelector('[data-ok]').addEventListener('click', () => { sfx('tap'); this.closeModal(); g.closeReport(); this.hud(true); });
  }

  showSettings() {
    const s = this.g.s, hooks = this.hooks;
    const root = this.openModal(`<h2>⚙️ Pengaturan</h2>
      <div class="toggles" style="flex-direction:column">
        <button class="tog ${s.sound ? 'on' : ''}" data-a="sound"><span class="sw"></span>🔊 Efek suara</button>
        <button class="tog ${s.autoBreak ? 'on' : ''}" data-a="autoBreak"><span class="sw"></span>☕ Karyawan istirahat otomatis</button></div>
      <div class="kv"><span>🏢 Bank</span><b>${esc(s.bank)}</b><span>📅 Hari ke-</span><b>${s.day}</b><span>✅ Tiket selesai</span><b>${s.stat.tasksDone}</b><span>☕ Cangkir kopi</span><b>${s.stat.cups}</b><span>🎮 Sesi PS</span><b>${s.stat.psPlays}</b><span>🛝 Sesi bermain</span><b>${s.stat.playPlays}</b><span>🐱 Elus Mochi</span><b>${s.stat.mochi}</b></div>
      <div class="acts"><button class="btn mint" data-a="save">💾 Simpan</button><button class="btn lav" data-a="export">⬇️ Ekspor</button><button class="btn lav" data-a="import">⬆️ Impor</button></div>
      ${window.__installPrompt ? '<button class="btn gold block" style="margin-top:10px" data-a="install">📲 Pasang sebagai aplikasi</button>' : ''}
      <button class="btn ghost block" style="margin-top:10px" data-a="howto">📖 Cara bermain</button>
      <button class="btn ghost block" style="margin-top:8px;color:#d6334f" data-a="reset">🗑️ Mulai game baru</button>
      <button class="btn block" style="margin-top:10px" data-a="close">Tutup</button>
      <input type="file" id="importFile" accept="application/json,.json" hidden>`);
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return; sfx('tap');
      switch (b.dataset.a) {
        case 'sound': s.sound = !s.sound; setSound(s.sound); b.classList.toggle('on', s.sound); break;
        case 'autoBreak': s.autoBreak = !s.autoBreak; b.classList.toggle('on', s.autoBreak); break;
        case 'save': hooks.save(); this.toast('Tersimpan! 💾', 'good'); break;
        case 'export': hooks.exportSave(); break;
        case 'import': root.querySelector('#importFile').click(); break;
        case 'howto': this.closeModal(); this.showHowTo(); break;
        case 'install': { const p = window.__installPrompt; if (p) { p.prompt(); window.__installPrompt = null; } this.closeModal(); break; }
        case 'reset': if (confirm('Yakin mulai game baru? Progres sekarang akan dihapus.')) { clearSave(); location.reload(); } break;
        case 'close': this.closeModal(); break;
      }
    });
    root.querySelector('#importFile').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; try { await hooks.importSave(await f.text()); } catch { this.toast('File save tidak valid 😢', 'bad'); } });
  }

  showHowTo() {
    const root = this.openModal(`<div class="big-emoji">🐱</div><h2>Cara Bermain</h2>
      <div class="kv" style="grid-template-columns:auto 1fr;text-align:left;font-weight:700;font-size:12.5px;line-height:1.45">
        <span>📋</span><span><b>Tugaskan tiket</b> ke karyawan (lebih untung kalau spesialisasinya cocok). Selesai? Tap gelembung ⭐ Klaim!</span>
        <span>⚡</span><span><b>Jaga energi, stres & mood.</b> Karyawan lelah = lambat. Kasih istirahat!</span>
        <span>☕</span><span><b>Mesin kopi</b> isi energi. <b>PS & taman bermain</b> menurunkan stres & menaikkan mood.</span>
        <span>🛍️</span><span>Beli fasilitas, meja & dekorasi di <b>Toko</b>. Level naik = fasilitas baru terbuka.</span>
        <span>👥</span><span><b>Rekrut</b> karyawan baru (butuh meja kosong). Ada yang langka ✨!</span>
        <span>🛡️</span><span>Jaga <b>Keamanan, Layanan</b> & rendahkan <b>Risiko</b> agar rating bank ⭐ naik.</span>
        <span>🐱</span><span>Tap <b>Mochi</b> si kucing & tap karyawan untuk menyapa.</span></div>
      <button class="btn block" data-ok>Mengerti! 💚</button>`);
    root.querySelector('[data-ok]').addEventListener('click', () => { sfx('tap'); this.closeModal(); });
  }

  showWelcome() {
    const s = this.g.s;
    const root = this.openModal(`<div class="big-emoji">🌿</div><h2>Selamat datang, ${esc(s.name)}-san!</h2>
      <p>Kamu adalah Direktur baru Divisi TI <b>${esc(s.bank)}</b>. Kelola tim chibi yang imut, jaga bank tetap aman, dan bikin kantor jadi tempat paling menyenangkan!</p>
      <div class="kv" style="grid-template-columns:auto 1fr;text-align:left;font-size:12.5px"><span>1️⃣</span><span>Buka <b>📋 Tugas</b> → tugaskan tiket ke karyawan</span><span>2️⃣</span><span>Beli <b>☕ Mesin Kopi</b> di Toko biar tim bertenaga</span><span>3️⃣</span><span>Naik level untuk buka <b>🎮 PS</b> & <b>🛝 Taman Bermain</b></span></div>
      <button class="btn block" data-ok>Ayo mulai! ✨</button>`);
    root.querySelector('[data-ok]').addEventListener('click', () => { sfx('pop'); this.closeModal(); this.g.s.speed = 1; this.hud(true); });
  }

  // ---------- Layar judul ----------
  showTitle(onStart) {
    const t = $('#title'); t.hidden = false; $('#app').hidden = true;
    const save = hasSave();
    const floats = DIR_LOOKS.map((l, i) => `<img class="float" style="left:${[4, 70, 10, 76][i]}%;top:${[8, 12, 70, 68][i]}%;animation-delay:${i * 0.5}s" src="${portrait(l, ['dev', 'pm', 'sec', 'dba'][i], 'happy', 110)}" alt="">`).join('');
    t.innerHTML = `${floats}<div class="title-card">
      <canvas class="mochi-hero" id="mochiHero" width="240" height="200"></canvas>
      <div class="logo">Neko Bank IT<small>✿ KANTOR TI PALING IMUT ✿</small></div>
      <div class="tagline">Kelola divisi teknologi informasi bank — ngopi, main PS, dan bikin nasabah tersenyum!</div>
      <div class="title-panel" id="titlePanel"></div></div>`;
    const cv = $('#mochiHero'), c = cv.getContext('2d'); let raf, t0 = performance.now();
    const loop = now => { c.clearRect(0, 0, 240, 200); drawMochi(c, { x: 120, y: 175, s: 3.2, t: (now - t0) / 1000, dir: 1 }); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const panel = $('#titlePanel');
    const stop = () => cancelAnimationFrame(raf);
    const menu = () => {
      panel.innerHTML = `${save ? `<button class="btn block" data-a="continue">▶ Lanjutkan Game</button><div style="height:10px"></div>` : ''}<button class="btn ${save ? 'ghost' : ''} block" data-a="new">${save ? '🌿 Game Baru' : '🌿 Mulai Bermain'}</button>
        <p style="font-size:11px;color:var(--ink2);font-weight:700;margin:12px 0 0">Tip: pasang ke layar utama (Add to Home Screen) biar bisa main seperti aplikasi & offline!</p>`;
    };
    const setup = () => {
      let pick = 0, name = '', bank = 'Bank Sakura Nusantara';
      panel.innerHTML = `<div class="field"><label>Namamu, Direktur</label><input id="inName" maxlength="14" placeholder="mis. Aguma" autocomplete="off"></div>
        <div class="field"><label>Nama bank</label><input id="inBank" maxlength="26" value="${esc(bank)}" autocomplete="off"></div>
        <div class="field"><label>Tingkat kesulitan</label><select class="sel" id="inDiff">${Object.entries(DIFFS).map(([k, d]) => `<option value="${k}" ${k === 'normal' ? 'selected' : ''}>${d.emoji} ${d.name} — ${d.desc}</option>`).join('')}</select></div>
        <div class="field"><label>Pilih penampilanmu</label></div>
        <div class="looks">${DIR_LOOKS.map((l, i) => `<button data-look="${i}" class="${i === 0 ? 'on' : ''}"><img src="${portrait(l, 'dir', 'happy', 74)}" alt=""></button>`).join('')}</div>
        <button class="btn block" data-a="go">Masuk Kantor ✨</button><button class="btn ghost block" style="margin-top:8px" data-a="back">Kembali</button>`;
      panel.querySelectorAll('[data-look]').forEach(b => b.addEventListener('click', () => { pick = +b.dataset.look; panel.querySelectorAll('[data-look]').forEach(x => x.classList.toggle('on', x === b)); sfx('tap'); }));
      panel.querySelector('[data-a=go]').addEventListener('click', () => { sfx('pop'); stop(); onStart({ mode: 'new', name: panel.querySelector('#inName').value.trim() || 'Direktur', bank: panel.querySelector('#inBank').value.trim() || 'Bank Sakura Nusantara', dirLook: DIR_LOOKS[pick], diff: panel.querySelector('#inDiff').value }); });
      panel.querySelector('[data-a=back]').addEventListener('click', () => { sfx('tap'); menu(); });
    };
    panel.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'continue') { sfx('pop'); stop(); onStart({ mode: 'continue' }); }
      else if (b.dataset.a === 'new') { sfx('tap'); if (save && !confirm('Memulai game baru akan menimpa save lama. Lanjut?')) return; setup(); }
    });
    menu();
  }
}
