// Event acak ala insiden kantor TI bank, dibuat imut.
import { SPECS, fmtMoney } from './data.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const withSpec = (g, ...sp) => g.emps.filter(e => sp.includes(e.spec));
const tier = x => (x && typeof x.tier === 'number' ? x.tier : 0);

export const EVENTS = [
  {
    id: 'serverdown', can: g => g.s.day >= 2, weight: g => 3 + (g.s.risk > 50 ? 2 : 0),
    build: g => ({
      id: 'serverdown', emoji: '💥', title: 'Server Ngambek! (>_<)', mood: 'bad',
      text: 'Server utama tiba-tiba mogok. Nasabah mulai ngomel di aplikasi mobile banking!',
      choices: [
        { label: '🛠️ Panggil tim Ops', hint: 'Aman, tapi tim kelelahan', run: g => {
          const ops = withSpec(g, 'ops', 'dba'); ops.forEach(e => { e.energy = Math.max(0, e.energy - 14); e.stress = Math.min(100, e.stress + 8); });
          if (ops.length) { g.addStat('service', 4); g.addXp(30); return { good: true, text: `Tim Ops sigap memperbaiki server! Layanan pulih. (+30 XP)` }; }
          g.addStat('service', -4); g.addStat('risk', 3); return { good: false, text: 'Belum ada tim Ops… diperbaiki seadanya. Layanan agak turun.' };
        } },
        { label: '😬 Restart paksa', hint: '50% berhasil, 50% makin kacau', run: g => {
          const ok = Math.random() < 0.5 + (g.s.fac.server - 1) * 0.08;
          if (ok) { g.addStat('service', 2); return { good: true, text: 'Restart berhasil! Semua nyala lagi. Fiuh~' }; }
          g.addStat('service', -10); g.addStat('risk', 8); g.addMoney(-4); return { good: false, text: 'Restartnya malah bikin kacau… layanan turun & biaya pemulihan Rp 4 jt.' };
        } },
        { label: '🕹️ Main Patch Rush!', hint: 'Mini-game: tangkap semua bug!', mg: true, run: (g, x) => {
          const t = tier(x);
          if (t === 2) { g.addStat('service', 6); g.addStat('security', 3); g.addXp(60); return { good: true, text: 'LUAR BIASA! Server pulih sempurna. (+60 XP)' }; }
          if (t === 1) { g.addStat('service', 2); g.addXp(20); return { good: true, text: 'Lumayan! Server pulih walau ada lecet. (+20 XP)' }; }
          g.addStat('service', -6); g.addStat('risk', 4); return { good: false, text: 'Bug-nya kabur semua… layanan turun.' };
        } }
      ]
    })
  },
  {
    id: 'phishing', can: g => g.s.day >= 2, weight: g => 3,
    build: g => ({
      id: 'phishing', emoji: '🎣', title: 'Email "Voucher Boba Gratis" 🧋', mood: 'warn',
      text: 'Ada email mencurigakan: "Klik di sini untuk voucher boba gratis!" Beberapa karyawan sudah melirik…',
      choices: [
        { label: '📣 Edukasi seluruh tim', hint: '−Rp 3 jt, keamanan naik', cost: 3, run: g => { g.addMoney(-3); g.addStat('security', 8); g.addStat('risk', -4); g.emps.forEach(e => e.mood = Math.max(0, e.mood - 2)); return { good: true, text: 'Tim jadi melek phishing! Keamanan +8.' }; } },
        { label: '🙈 Abaikan saja', hint: '40% ada yang kelepasan klik', run: g => {
          if (Math.random() < 0.4) { g.addStat('security', -8); g.addStat('risk', 10); return { good: false, text: 'Ada yang klik! Data terekspos sedikit… risiko naik.' }; }
          return { good: true, text: 'Untungnya tidak ada yang klik. Fiuh.' };
        } },
        { label: '🛡️ Serahkan ke Security', hint: 'Bergantung ada Security atau tidak', run: g => {
          const s = withSpec(g, 'sec')[0];
          if (s) { s.xp += 30; g.addStat('security', 6); g.say(s, 'Dilaporkan! 🚨'); return { good: true, text: `${s.name} memblokir domain jahat. Keamanan +6.` }; }
          g.addStat('security', 1); g.addStat('risk', 3); return { good: false, text: 'Belum ada spesialis Security… hanya diblokir seadanya.' };
        } }
      ]
    })
  },
  {
    id: 'audit', can: g => g.s.day >= 6, weight: g => 2 + (g.s.risk > 45 ? 1 : 0),
    build: g => ({
      id: 'audit', emoji: '📑', title: 'OJK-chan Datang Mengaudit', mood: 'warn',
      text: 'Tim auditor berseragam rapi tiba-tiba datang membawa map tebal dan senyum tipis…',
      choices: [
        { label: '📂 Siapkan dokumen rapi', hint: 'Hasil bergantung keamanan & risiko', run: g => {
          const sc = g.s.security * 0.5 + (100 - g.s.risk) * 0.5 + rnd(-10, 10);
          if (sc >= 58) { g.addMoney(10); g.addStat('service', 4); g.addStat('risk', -6); return { good: true, text: 'Audit lulus dengan pujian! Bonus Rp 10 jt dari Direksi.' }; }
          g.addMoney(-8); g.addStat('risk', 5); return { good: false, text: 'Ada temuan audit… denda Rp 8 jt. Perkuat kontrol & keamanan!' };
        } },
        { label: '☕ Sambut ramah + kopi', hint: '−Rp 1,5 jt, peluang lulus lebih besar', cost: 1.5, run: g => {
          g.addMoney(-1.5);
          const sc = g.s.security * 0.5 + (100 - g.s.risk) * 0.5 + rnd(-6, 14);
          if (sc >= 52) { g.addMoney(8); g.addStat('risk', -5); return { good: true, text: 'Auditor tersenyum, kopinya enak! Lulus & bonus Rp 8 jt.' }; }
          g.addMoney(-5); g.addStat('risk', 3); return { good: false, text: 'Kopinya enak, tapi temuannya tetap ada. Denda Rp 5 jt.' };
        } }
      ]
    })
  },
  {
    id: 'pizza', can: g => g.s.money > 12 && g.emps.length >= 2, weight: g => 2,
    build: g => ({
      id: 'pizza', emoji: '🍕', title: 'Jumat Pizza Party?', mood: 'good',
      text: 'Tim berbisik-bisik: "Bos… hari Jumat enaknya makan pizza bareng, ya kan?" Mata mereka berbinar-binar ✨',
      choices: [
        { label: '🍕 Traktir semua!', hint: '−Rp 4 jt, mood tim naik besar', cost: 4, run: g => { g.addMoney(-4); g.emps.forEach(e => { e.mood = Math.min(100, e.mood + 20); e.stress = Math.max(0, e.stress - 15); g.say(e, 'Yeay pizza! 🍕', 4); g.face(e, 'happy', 5); }); return { good: true, text: 'Semua kenyang & bahagia! Mood tim melonjak.' }; } },
        { label: '😶 Lain kali ya', hint: 'Tim agak kecewa', run: g => { g.emps.forEach(e => e.mood = Math.max(0, e.mood - 4)); return { good: false, text: 'Tim manggut-manggut sambil lesu…' }; } }
      ]
    })
  },
  {
    id: 'ddos', can: g => g.s.level >= 2, weight: g => 2,
    build: g => ({
      id: 'ddos', emoji: '🐈‍⬛', title: 'Kucing Hitam Hacker Menyerang!', mood: 'bad',
      text: 'Kucing hitam misterius mengirim jutaan permintaan ke server. Mobile banking mulai megap-megap!',
      choices: [
        { label: '🕹️ Hadapi sendiri (Patch Rush)', hint: 'Mini-game!', mg: true, run: (g, x) => {
          const t = tier(x);
          if (t === 2) { g.addStat('security', 6); g.addXp(70); g.addMoney(6); return { good: true, text: 'Si kucing hitam kabur ketakutan! Bonus Rp 6 jt & +70 XP.' }; }
          if (t === 1) { g.addStat('service', -2); g.addXp(25); return { good: true, text: 'Serangan berhasil ditahan walau agak lecet.' }; }
          g.addStat('service', -10); g.addStat('risk', 8); return { good: false, text: 'Serangannya kuat… layanan down sebentar.' };
        } },
        { label: '🛡️ Serahkan ke Security', hint: 'Peluang sesuai skill Security', run: g => {
          const s = withSpec(g, 'sec').sort((a, b) => b.skill - a.skill)[0];
          const p = s ? 0.35 + s.skill / 160 : 0.15;
          if (Math.random() < p) { g.addStat('security', 5); g.addXp(40); if (s) g.say(s, 'Tertangkap! 😼'); return { good: true, text: 'Serangan berhasil dipatahkan! Keamanan naik.' }; }
          g.addStat('service', -8); g.addStat('risk', 6); return { good: false, text: 'Pertahanan jebol sebentar… layanan turun.' };
        } },
        { label: '🔌 Matikan layanan sementara', hint: 'Aman tapi layanan turun', run: g => { g.addStat('service', -9); g.addStat('risk', -3); return { good: false, text: 'Layanan dimatikan 10 menit. Aman, tapi nasabah kesal.' }; } }
      ]
    })
  },
  {
    id: 'vip', can: g => g.s.day >= 4 && g.s.level >= 2, weight: g => 2,
    build: g => ({
      id: 'vip', emoji: '🎩', title: 'Direktur Utama Berkunjung!', mood: 'good',
      text: 'Bapak/Ibu Direktur Utama datang inspeksi mendadak ke divisi TI. Semua mendadak merapikan meja!',
      choices: [
        { label: '🏢 Tur kantor imut', hint: 'Bagus kalau fasilitas & mood bagus', run: g => {
          const fac = (g.s.fac.coffee > 0) + (g.s.fac.ps > 0) + (g.s.fac.play > 0);
          if (g.avgMood() >= 65 && fac >= 2) { g.addMoney(15); g.addStat('service', 3); g.addXp(60); return { good: true, text: 'Direktur Utama kagum! "Tim bahagia, kinerja luar biasa!" Bonus Rp 15 jt.' }; }
          g.addMoney(3); return { good: true, text: 'Direktur Utama tersenyum sopan. Bonus kecil Rp 3 jt.' };
        } },
        { label: '📊 Demo sistem', hint: 'Bagus kalau layanan tinggi', run: g => {
          if (g.s.service >= 72) { g.addMoney(12); g.addXp(50); return { good: true, text: 'Demo lancar tanpa error! Bonus Rp 12 jt.' }; }
          g.addStat('risk', 3); return { good: false, text: 'Demo sempat error… untung Direktur Utama sedang baik hati.' };
        } }
      ]
    })
  },
  {
    id: 'tourney', can: g => g.s.fac.ps > 0 && g.emps.length >= 2, weight: g => 3,
    build: g => {
      const cand = [...g.emps].sort((a, b) => (b.mood + (b.trait === 'gamer' ? 40 : 0)) - (a.mood + (a.trait === 'gamer' ? 40 : 0))).slice(0, 2);
      return {
        id: 'tourney', emoji: '🏆', title: 'Turnamen PS Antar Divisi!', mood: 'good',
        text: 'Divisi sebelah menantang tim TI turnamen NekoStation. Siapa jagoanmu?',
        choices: [
          ...cand.map(e => ({ label: `🎮 Kirim ${e.name}`, hint: `Mood ${Math.round(e.mood)}${e.trait === 'gamer' ? ' · Gamer Sejati!' : ''}`, run: g => {
            const p = 0.25 + e.mood / 200 + (e.trait === 'gamer' ? 0.3 : 0);
            g.emps.forEach(x => { x.mood = Math.min(100, x.mood + 12); x.stress = Math.max(0, x.stress - 10); });
            if (Math.random() < p) { g.addMoney(12); g.addXp(50); g.say(e, 'JUARA! 🏆', 5); g.face(e, 'happy', 5); return { good: true, text: `${e.name} juara turnamen! Hadiah Rp 12 jt & semua bersorak.` }; }
            g.say(e, 'Kalah tipis… 🥲', 4); return { good: true, text: `${e.name} kalah tipis, tapi semua senang bersorak bersama!` };
          } })),
          { label: '😴 Tidak ikut', hint: 'Mood tim sedikit turun', run: g => { g.emps.forEach(e => e.mood = Math.max(0, e.mood - 3)); return { good: false, text: 'Tim agak kecewa nggak bisa main.' }; } }
        ]
      };
    }
  },
  {
    id: 'bday', can: g => g.emps.length >= 1, weight: g => 2,
    build: g => {
      const e = pick(g.emps);
      return {
        id: 'bday', emoji: '🎂', title: `Ulang Tahun ${e.name}!`, mood: 'good', who: e.id,
        text: `${e.name} ulang tahun hari ini! Matanya berbinar-binar sambil pura-pura nggak ingat…`,
        choices: [
          { label: '🎂 Kue & kado', hint: '−Rp 2 jt, mood naik', cost: 2, run: g => { g.addMoney(-2); e.mood = 100; e.stress = Math.max(0, e.stress - 20); g.emps.forEach(x => x.mood = Math.min(100, x.mood + 6)); g.say(e, 'Terharu… 😭💚', 5); g.face(e, 'happy', 5); return { good: true, text: `${e.name} terharu! Semua ikut senang.` }; } },
          { label: '🎉 Ucapan hangat saja', hint: 'Gratis', run: g => { e.mood = Math.min(100, e.mood + 8); return { good: true, text: `${e.name} senyum: "Makasih, Bos!"` }; } }
        ]
      };
    }
  },
  {
    id: 'blackout', can: g => g.s.day >= 3, weight: g => 2,
    build: g => ({
      id: 'blackout', emoji: '⚡', title: 'Listrik Padam!', mood: 'bad',
      text: 'Lampu kantor berkedip lalu… gelap! Server mulai mengeluarkan bunyi "piip-piip" panik.',
      choices: [
        { label: '🔋 Nyalakan genset', hint: '−Rp 3 jt, aman', cost: 3, run: g => { g.addMoney(-3); return { good: true, text: 'Genset menyala, semua aman. Tim tepuk tangan!' }; } },
        { label: '🙏 Andalkan UPS', hint: 'Aman kalau server Lv.2+', run: g => {
          if (g.s.fac.server >= 2) { g.addStat('service', 1); return { good: true, text: 'UPS kucing menyelamatkan semuanya! 🐱⚡' }; }
          g.addStat('service', -9); g.addStat('risk', 6); return { good: false, text: 'UPS belum ada… server mati mendadak. Layanan turun.' };
        } }
      ]
    })
  },
  {
    id: 'training', can: g => g.emps.length >= 1, weight: g => 2,
    build: g => {
      const list = [...g.emps].sort((a, b) => a.skill - b.skill).slice(0, 2);
      return {
        id: 'training', emoji: '📚', title: 'Pelatihan Gratis dari Vendor', mood: 'good',
        text: 'Vendor menawarkan 1 kursi pelatihan teknologi terbaru. Siapa yang kamu kirim?',
        choices: [
          ...list.map(e => ({ label: `🎓 Kirim ${e.name}`, hint: `Skill ${e.skill} → +3`, run: g => { e.skill = Math.min(99, e.skill + 3); e.energy = Math.max(0, e.energy - 10); e.xp += 40; g.say(e, 'Ilmu baru! 📚', 4); return { good: true, text: `${e.name} pulang dengan ilmu baru. Skill +3!` }; } })),
          { label: '🙅 Lewatkan', hint: '', run: g => ({ good: true, text: 'Kesempatan dilewatkan.' }) }
        ]
      };
    }
  },
  {
    id: 'coffeepromo', can: g => g.s.fac.coffee > 0, weight: g => 2,
    build: g => ({
      id: 'coffeepromo', emoji: '☕', title: 'Promo Biji Kopi Spesial', mood: 'good',
      text: 'Kurir kopi langganan membawa promo: biji kopi arabika super harum, diskon besar-besaran!',
      choices: [
        { label: '☕ Borong stok', hint: '−Rp 3 jt, tim langsung bersemangat', cost: 3, run: g => { g.addMoney(-3); g.emps.forEach(e => { e.buff = 60; e.mood = Math.min(100, e.mood + 5); e.energy = Math.min(100, e.energy + 10); }); return { good: true, text: 'Kantor wangi kopi! Semua bersemangat 60 detik.' }; } },
        { label: '🙅 Nanti saja', hint: '', run: g => ({ good: true, text: 'Kurir kopi pergi sambil cemberut.' }) }
      ]
    })
  },
  {
    id: 'headhunt', can: g => g.s.day >= 5 && g.emps.length >= 3 && g.emps.some(e => e.skill >= 72), weight: g => 1.5,
    build: g => {
      const e = [...g.emps].sort((a, b) => b.skill - a.skill)[0];
      return {
        id: 'headhunt', emoji: '🕵️', title: `Pemburu Talenta Mengincar ${e.name}`, mood: 'warn',
        text: `Perusahaan lain menawari ${e.name} gaji lebih besar. ${e.name} menatapmu ragu-ragu…`,
        choices: [
          { label: '💰 Naikkan gaji', hint: 'Gaji harian +Rp 0,3 jt', run: g => { e.salary = Math.round((e.salary + 0.3) * 10) / 10; e.mood = Math.min(100, e.mood + 15); g.say(e, 'Makasih, Bos! 🥹', 4); return { good: true, text: `${e.name} tetap bertahan dan makin semangat!` }; } },
          { label: '🎁 Bonus Rp 5 jt', hint: 'Sekali bayar', cost: 5, run: g => { g.addMoney(-5); e.mood = Math.min(100, e.mood + 12); return { good: true, text: `${e.name} luluh dengan bonusnya. Tetap di sini!` }; } },
          { label: '🤞 Biarkan saja', hint: '30% resign', run: g => {
            if (Math.random() < 0.3) {
              g.cancelActivity(e); g.releaseWork(e); if (e.task) { const t = g.task(e.task); if (t) { t.state = 'new'; t.emp = null; } }
              g.s.employees = g.s.employees.filter(x => x.id !== e.id); return { good: false, text: `${e.name} pamit dengan mata berkaca-kaca… 😢` };
            }
            return { good: true, text: `${e.name} memilih setia. Fiuh!` };
          } }
        ]
      };
    }
  },
  {
    id: 'bugprod', can: g => g.s.day >= 3, weight: g => 2.5,
    build: g => ({
      id: 'bugprod', emoji: '🐛', title: 'Bug Muncul Setelah Rilis!', mood: 'bad',
      text: 'Fitur baru baru saja rilis, tiba-tiba angka saldo nasabah jadi emoji kucing 🐱. Gawat!',
      choices: [
        { label: '🌙 Hotfix malam ini', hint: 'Tim Dev lembur', run: g => {
          const d = withSpec(g, 'dev', 'ctrl'); d.forEach(e => { e.energy = Math.max(0, e.energy - 15); e.stress = Math.min(100, e.stress + 10); });
          if (d.length) { g.addStat('service', 3); g.addXp(30); return { good: true, text: 'Hotfix sukses! Saldo kembali normal. (+30 XP)' }; }
          g.addStat('service', -4); return { good: false, text: 'Tidak ada Dev… tambalan seadanya.' };
        } },
        { label: '⏪ Rollback', hint: 'Aman, tapi layanan turun sedikit', run: g => { g.addStat('service', -2); return { good: true, text: 'Rollback aman. Fitur ditunda dulu.' }; } },
        { label: '🕹️ Patch Rush!', hint: 'Mini-game!', mg: true, run: (g, x) => {
          const t = tier(x);
          if (t === 2) { g.addStat('service', 5); g.addXp(50); return { good: true, text: 'Semua bug tertangkap! Rilis jadi mulus. (+50 XP)' }; }
          if (t === 1) { g.addStat('service', 1); g.addXp(15); return { good: true, text: 'Bug mayoritas hilang.' }; }
          g.addStat('service', -5); g.addStat('risk', 4); return { good: false, text: 'Bug-nya banyak yang lolos…' };
        } }
      ]
    })
  }
];
