// Data statis game: spesialisasi, sifat, template tiket, fasilitas, misi.

// Dunia isometrik: grid 16 x 15 petak, petak 64x32 px
export const GW = 28, GH = 22, TW = 64, TH = 32;
export const OX = 933, OY = 330;            // posisi piksel petak (0,0)
export const WORLD_W = 2020, WORLD_H = 1430;

export const SPECS = {
  dev:  { name: 'Developer',        dept: 'Pengembangan Sistem',         emoji: '💻', color: '#8f8cf2', dark: '#6a67d6' },
  ops:  { name: 'Ops Engineer',     dept: 'Operasional & Infrastruktur', emoji: '🛠️', color: '#ffb86b', dark: '#e8924a' },
  ctrl: { name: 'Analis Kontrol',   dept: 'Pengendalian Sistem',         emoji: '🔍', color: '#6bb7ff', dark: '#4a93e0' },
  sec:  { name: 'Security',         dept: 'Pengendalian Sistem',         emoji: '🛡️', color: '#7a7aa8', dark: '#55557f' },
  dba:  { name: 'Database Admin',   dept: 'Operasional & Infrastruktur', emoji: '🗄️', color: '#5fd1b5', dark: '#3fb596' },
  pm:   { name: 'Project Manager',  dept: 'Pengembangan Sistem',         emoji: '📋', color: '#f2a640', dark: '#d4871f' }
};
export const SPEC_KEYS = Object.keys(SPECS);

export const TRAITS = {
  kopi:   { name: 'Pecinta Kopi',     emoji: '☕', desc: 'Kopi bikin energi & mood naik lebih banyak.' },
  gamer:  { name: 'Gamer Sejati',     emoji: '🎮', desc: 'Main PS menurunkan stres 50% lebih ampuh.' },
  rajin:  { name: 'Rajin Pangkal Pandai', emoji: '📚', desc: 'Kerja 10% lebih cepat, tapi lebih gampang stres.' },
  santai: { name: 'Santai Kayak di Pantai', emoji: '🌴', desc: 'Stres naik jauh lebih lambat.' },
  ceria:  { name: 'Si Ceria',         emoji: '🌿', desc: 'Mood naik lebih cepat dari kegiatan seru.' },
  teliti: { name: 'Teliti Banget',    emoji: '✨', desc: 'Hasil kerja lebih sering sempurna.' },
  kucing: { name: 'Pecinta Kucing',   emoji: '🐱', desc: 'Main bareng Mochi & di taman bermain = bahagia.' },
  begadang: { name: 'Anak Begadang',  emoji: '🌙', desc: 'Energi terkuras lebih lambat.' }
};
// Kebiasaan buruk (tidak semua karyawan punya): memengaruhi kinerja
export const QUIRKS = {
  lambat: { name: 'Lambat Kerja', emoji: '🐌', desc: 'Mengerjakan tiket 25% lebih lambat dari seharusnya.' },
  gosip:  { name: 'Suka Gosip',   emoji: '🗣️', desc: 'Sering menghampiri rekan untuk ngobrol & bergosip, bikin kerja tersendat.' }
};
export const rollQuirk = () => { const r = Math.random(); return r < 0.14 ? 'lambat' : r < 0.28 ? 'gosip' : null; };
export const TRAIT_KEYS = Object.keys(TRAITS);

export const RARITY = {
  N:   { name: 'N',   label: 'Biasa',    skill: [44, 58], salary: 0.8, color: '#a8a0c0', w: 58 },
  R:   { name: 'R',   label: 'Langka',   skill: [58, 72], salary: 1.1, color: '#6bb7ff', w: 28 },
  SR:  { name: 'SR',  label: 'Super',    skill: [70, 84], salary: 1.6, color: '#c58bff', w: 11 },
  SSR: { name: 'SSR', label: 'Legenda',  skill: [82, 95], salary: 2.4, color: '#ffc400', w: 3 }
};

export const NAMES_F = ['Nadia', 'Salsa', 'Alya', 'Citra', 'Intan', 'Putri', 'Nabila', 'Laila', 'Mika', 'Hikari', 'Sora', 'Mei', 'Aoi', 'Yuna', 'Kirana', 'Dewi', 'Rara', 'Bunga', 'Sakura', 'Tiara'];
export const NAMES_M = ['Raka', 'Bima', 'Dito', 'Fajar', 'Reza', 'Dimas', 'Arif', 'Bagas', 'Kenji', 'Haru', 'Rio', 'Yoga', 'Akira', 'Gilang', 'Satria', 'Eko'];
export const SURNAMES = ['P.', 'S.', 'R.', 'A.', 'W.', 'K.', 'M.', 'N.', 'H.', 'L.'];

export const HAIR_COLORS = ['#2b1b14', '#3a2418', '#4a2f20', '#1f1a1a', '#5a3a26', '#6b4630', '#7a5230', '#2a2f3a', '#3a2418', '#4a2f20'];
export const EYE_COLORS = ['#5a3320', '#4a2a18', '#6b4630', '#3a2418', '#5a3320', '#2f4a6a'];
export const SKINS = ['#ffe0c8', '#f8d2b4', '#f3c6a2', '#e3ad86', '#c98e66'];
export const HIJAB_COLORS = ['#cfeedd', '#d9d6ff', '#bfeee0', '#cfe6ff', '#ffe9b8', '#e9e2c8'];
export const HAIR_STYLES = ['wavy', 'wavy', 'side', 'messy'];

// Tiket: work = beban kerja, reward dalam juta rupiah
export const TASK_TEMPLATES = [
  { spec: 'dev', title: 'Perbaiki bug Internet Banking', sub: 'Tombol transfer ngambek', work: 55, reward: 3.2, xp: 40 },
  { spec: 'dev', title: 'Bikin fitur QRIS baru', sub: 'Biar bayar kopi makin gampang', work: 80, reward: 4.8, xp: 60 },
  { spec: 'dev', title: 'Mode gelap m-Banking', sub: 'Nasabah begadang minta ini', work: 45, reward: 2.6, xp: 35 },
  { spec: 'dev', title: 'Refactor modul Remittance', sub: 'Kodenya mirip mie instan', work: 90, reward: 5.4, xp: 70 },
  { spec: 'ops', title: 'Server lemot jam gajian', sub: 'Antrean transaksi menumpuk', work: 60, reward: 3.6, xp: 45, onsite: true },
  { spec: 'ops', title: 'Ganti kabel jaringan cabang', sub: 'Kabelnya digigit tikus', work: 40, reward: 2.4, xp: 30 },
  { spec: 'ops', title: 'Deploy patch malam hari', sub: 'Jangan sampai ada yang ngantuk', work: 70, reward: 4.2, xp: 55, onsite: true },
  { spec: 'ops', title: 'ATM offline di cabang', sub: 'Uang ada, koneksi nggak ada', work: 50, reward: 3.0, xp: 38 },
  { spec: 'ctrl', title: 'Review perubahan Core Banking', sub: 'Baca dokumen setebal bantal', work: 65, reward: 3.8, xp: 50 },
  { spec: 'ctrl', title: 'Uji UAT fitur baru', sub: 'Cari bug sebelum nasabah', work: 55, reward: 3.0, xp: 42 },
  { spec: 'ctrl', title: 'Audit hak akses karyawan', sub: 'Siapa pegang kunci apa?', work: 50, reward: 2.8, xp: 38 },
  { spec: 'ctrl', title: 'Rekonsiliasi log transaksi', sub: 'Selisih seribu rupiah dicari', work: 70, reward: 4.0, xp: 52 },
  { spec: 'sec', title: 'Pasang patch keamanan', sub: 'Celah kecil, bahaya besar', work: 50, reward: 3.4, xp: 45, sec: 3 },
  { spec: 'sec', title: 'Pindai kerentanan sistem', sub: 'Cari lubang sebelum maling', work: 65, reward: 4.0, xp: 55, sec: 4 },
  { spec: 'sec', title: 'Selidiki login mencurigakan', sub: 'IP dari planet antah berantah', work: 55, reward: 3.6, xp: 48, sec: 3 },
  { spec: 'sec', title: 'Pelatihan anti-phishing', sub: 'Jangan klik voucher boba gratis', work: 40, reward: 2.4, xp: 35, sec: 5 },
  { spec: 'dba', title: 'Backup database harian', sub: 'Tombol "simpan" paling penting', work: 45, reward: 2.6, xp: 36, onsite: true },
  { spec: 'dba', title: 'Optimasi query lambat', sub: 'Satu query = lima menit ngopi', work: 75, reward: 4.4, xp: 58 },
  { spec: 'dba', title: 'Arsipkan data lama', sub: 'Data 2009 minta pensiun', work: 55, reward: 3.0, xp: 42 },
  { spec: 'dba', title: 'Cek replikasi database', sub: 'Kembar harus sama persis', work: 50, reward: 3.0, xp: 40, onsite: true },
  { spec: 'pm', title: 'Rapat sprint planning', sub: 'Stand-up tapi duduk', work: 40, reward: 2.4, xp: 32 },
  { spec: 'pm', title: 'Susun roadmap kuartal', sub: 'Peta harta karun versi TI', work: 70, reward: 4.2, xp: 55 },
  { spec: 'pm', title: 'Laporan ke Direksi', sub: 'Grafiknya harus hijau', work: 55, reward: 3.4, xp: 45 },
  { spec: 'pm', title: 'Negosiasi dengan vendor', sub: 'Tawar-menawar dengan senyum', work: 60, reward: 3.8, xp: 48 }
];

export const PRIORITY = {
  low:  { name: 'Santai', mult: 0.85, days: 6, emoji: '🌱', color: '#7fd6a0' },
  mid:  { name: 'Biasa',  mult: 1.0,  days: 4, emoji: '⭐', color: '#ffc400' },
  high: { name: 'Genting', mult: 1.45, days: 3, emoji: '🔥', color: '#ff6b81' }
};

// Fasilitas yang bisa dibeli / di-upgrade
export const FACILITIES = {
  coffee: {
    name: 'Mesin Kopi', emoji: '☕', room: 'Pantry',
    levels: [
      { name: 'Teko Kopi Tubruk', cost: 8, lvl: 1, slots: 1, energy: 32, desc: 'Sederhana tapi nikmat. 1 orang sekali ngopi.' },
      { name: 'Mesin Espresso', cost: 20, lvl: 3, slots: 2, energy: 42, desc: 'Aroma harum! 2 orang bisa antre sekaligus.' },
      { name: 'Robot Barista Neko', cost: 42, lvl: 6, slots: 3, energy: 55, desc: 'Latte art kucing + energi maksimal. 3 slot.' }
    ]
  },
  snack: {
    name: 'Kulkas & Snack', emoji: '🧊', room: 'Pantry',
    levels: [
      { name: 'Kulkas Mini', cost: 10, lvl: 2, slots: 2, mood: 6, energy: 10, desc: 'Minuman dingin & cemilan. 2 orang sekali ambil.' },
      { name: 'Kulkas + Rak Snack', cost: 22, lvl: 4, slots: 3, mood: 9, energy: 15, desc: 'Keripik, cokelat, dan mochi! 3 slot.' },
      { name: 'Kulkas Besar Pintu Ganda', cost: 40, lvl: 6, slots: 3, mood: 12, energy: 20, disc: 0.1, stock: 1.3, desc: 'Stok lebih banyak (+30%) & belanja makan siang diskon 10%.' },
      { name: 'Smart Fridge + Dapur Mini', cost: 75, lvl: 9, slots: 4, mood: 16, energy: 26, disc: 0.2, stock: 1.6, desc: '4 slot, stok +60%, makan siang diskon 20%. Dapur kantor lengkap!' }
    ]
  },
  dining: {
    name: 'Ruang Makan', emoji: '🍽️', room: 'Pantry',
    levels: [
      { name: 'Ruang Makan Kecil', cost: 0, lvl: 1, slots: 0, seats: 21, desc: 'Awal yang sederhana: 21 kursi.' },
      { name: 'Ruang Makan Luas (2× lebih besar)', cost: 30, lvl: 5, slots: 0, seats: 42, desc: 'Pantry diperluas ke utara: 42 kursi, meja & jendela tambahan.' },
      { name: 'Kantin Besar (3× lebih besar)', cost: 65, lvl: 8, slots: 0, seats: 63, desc: 'Kantin kantor 3× luas awal: 63 kursi, semua karyawan makan lega.' }
    ]
  },
  hall: {
    name: 'Ruang Aula', emoji: '🎊', room: 'Aula Pesta',
    levels: [
      { name: 'Aula Sederhana', cost: 38, lvl: 6, slots: 28, party: 1, desc: 'Ruang pesta untuk seluruh karyawan setelah proyek rilis!' },
      { name: 'Aula + Panggung & Lampu Disko (2× lebih luas)', cost: 80, lvl: 10, slots: 28, party: 1.35, desc: 'Aula diperluas 2×, ada panggung, sound system & bola disko. Pesta 35% lebih seru!' },
      { name: 'Grand Ballroom (3× lebih luas)', cost: 150, lvl: 13, slots: 28, party: 1.7, desc: 'Aula raksasa 3× luas awal dengan lounge VIP & dua bola disko. Pesta 70% lebih seru!' }
    ]
  },
  ps: {
    name: 'Konsol PS', emoji: '🎮', room: 'Ruang Gim',
    levels: [
      { name: 'NekoStation Lawas', cost: 14, lvl: 2, slots: 2, rate: 1.0, desc: 'Cukup untuk main berdua. Stres turun!' },
      { name: 'NekoStation Pro + Sofa', cost: 32, lvl: 4, slots: 3, rate: 1.4, desc: '3 pemain, grafis makin kinclong.' },
      { name: 'Lounge VIP 4 Pemain', cost: 60, lvl: 7, slots: 4, rate: 1.9, desc: 'Turnamen kantor siap digelar!' }
    ]
  },
  play: {
    name: 'Taman Bermain', emoji: '🛝', room: 'Taman Bermain',
    levels: [
      { name: 'Kolam Bola Mini', cost: 16, lvl: 2, slots: 2, rate: 1.0, desc: 'Berenang di bola warna-warni!' },
      { name: 'Perosotan & Trampolin', cost: 34, lvl: 4, slots: 3, rate: 1.4, desc: 'Lompat-lompat sampai stres kabur.' },
      { name: 'Istana Pelangi', cost: 64, lvl: 7, slots: 4, rate: 1.9, desc: 'Istana bantal dengan pelangi sungguhan!' }
    ]
  },
  pool: {
    name: 'Kolam Renang', emoji: '🏊', room: 'Area Kolam',
    levels: [
      { name: 'Kolam Mini', cost: 28, lvl: 5, slots: 2, rate: 1.2, desc: 'Berendam santai! Stres turun cepat & mood naik.' },
      { name: 'Kolam + Gazebo', cost: 55, lvl: 8, slots: 3, rate: 1.6, desc: 'Kolam lebih besar dengan kursi santai & payung.' },
      { name: 'Resort Pool + Perosotan Air', cost: 95, lvl: 11, slots: 4, rate: 2.1, desc: 'Kolam resor mewah, 4 perenang sekaligus!' }
    ]
  },
  server: {
    name: 'Ruang Server', emoji: '🖥️', room: 'Ruang Server',
    levels: [
      { name: 'Rak Server Dasar', cost: 0, lvl: 1, slots: 2, sec: 0, desc: 'Awal yang sederhana.' },
      { name: 'Rak + UPS Kucing', cost: 24, lvl: 3, slots: 2, sec: 0.5, desc: 'Listrik aman. Keamanan naik pelan tiap hari.' },
      { name: 'Pendingin & Firewall Imut', cost: 48, lvl: 5, slots: 3, sec: 1.0, desc: '3 meja ops + keamanan naik lebih cepat.' },
      { name: 'Datacenter Mini Tier-3', cost: 90, lvl: 8, slots: 3, sec: 1.6, desc: 'Server adem, risiko turun, bank tenang.' }
    ]
  }
};

// Tingkat kesulitan & kondisi ekonomi: bikin kas mudah menipis, dan kebangkrutan bisa terjadi
export const DIFFS = {
  easy:   { name: 'Santai',  emoji: '🌱', income: 1.1,  over: 0.7, evt: 0.7, bail: 99, desc: 'Biaya ringan, dana darurat tak terbatas. Cocok untuk santai.' },
  normal: { name: 'Normal',  emoji: '⚖️', income: 1,    over: 1,   evt: 1,   bail: 2,  desc: 'Biaya operasional nyata & 2× dana darurat (berutang).' },
  hard:   { name: 'Sulit',   emoji: '🔥', income: 0.9,  over: 1.35, evt: 1.4, bail: 1,  desc: 'Biaya tinggi, insiden mahal, hanya 1× dana darurat.' },
  hell:   { name: 'Neraka',  emoji: '💀', income: 0.8,  over: 1.7, evt: 1.8, bail: 0,  desc: 'Tanpa dana darurat. Kas < −15 jt = BANGKRUT!' }
};
export const ECONS = {
  resesi:   { name: 'Resesi', emoji: '📉', reward: 0.78, over: 1, days: 6, desc: 'Nasabah menahan belanja: imbalan tiket −22%.' },
  inflasi:  { name: 'Inflasi', emoji: '🔺', reward: 1, over: 1.35, days: 7, desc: 'Harga naik: biaya operasional +35%.' },
  boom:     { name: 'Ekonomi Boom', emoji: '📈', reward: 1.18, over: 1, days: 5, desc: 'Transaksi ramai: imbalan tiket +18%.' }
};

// Menu makan siang (biaya per orang, jt). Karyawan makan di Ruang Makan tiap jam 12:00.
export const LUNCH_MENUS = [
  { id: 'bekal', emoji: '🥪', name: 'Bawa bekal sendiri', cost: 0, energy: 8, mood: -2, stress: 0, desc: 'Gratis, tapi karyawan kurang senang.' },
  { id: 'hemat', emoji: '🍱', name: 'Nasi Kotak Hemat', cost: 0.12, energy: 15, mood: 2, stress: 0, desc: 'Murah meriah, cukup isi tenaga.' },
  { id: 'sehat', emoji: '🥗', name: 'Katering Sehat', cost: 0.22, energy: 25, mood: 6, stress: -3, desc: 'Salad, ayam panggang & buah. Energi & mood naik.' },
  { id: 'prasmanan', emoji: '🍛', name: 'Prasmanan Nusantara', cost: 0.4, energy: 36, mood: 12, stress: -8, desc: 'Rendang, sayur, sambal & kerupuk! Tim senang banget.' }
];
export const DISHES = ['Ayam Geprek', 'Soto Ayam', 'Gado-gado', 'Nasi Rames', 'Mie Ayam', 'Nasi Goreng Spesial', 'Rawon', 'Pecel Lele'];
export const PARTY_OPTS = { big: { cost: 6, mood: 22, stress: 14, xp: 40, label: 'Pesta Besar' }, small: { cost: 4, mood: 12, stress: 8, xp: 20, label: 'Syukuran' } };

// Tiga departemen, masing-masing punya area meja (maks 3 meja per departemen)
export const DEPTS = {
  ctrl: { name: 'Pengendalian Sistem', sub: 'Governance, Risk & Compliance', specs: ['ctrl', 'sec'], color: '#5fb8c8', emoji: '🔍' },
  dev:  { name: 'Pengembangan Sistem', sub: 'System Development', specs: ['dev', 'pm'], color: '#6fcf8a', emoji: '💻' },
  ops:  { name: 'Operasional & Infrastruktur', sub: 'Operations & Infrastructure', specs: ['ops', 'dba'], color: '#c8b86a', emoji: '🛠️' }
};
export const DEPT_KEYS = ['ctrl', 'dev', 'ops'];
export const deptOfSpec = sp => DEPT_KEYS.find(k => DEPTS[k].specs.includes(sp));
export const DESK_MAX = 9;                    // 3 meja/baris: 2 baris di gedung utama + 1 baris di Gedung Tambahan
export const DESK_COSTS = [0, 0, 0, 10, 16, 24, 30, 38, 46, 54, 62, 72, 82, 92, 104, 116, 128, 140, 152, 166, 180, 196, 212, 228, 246, 264, 282];   // biaya meja berdasarkan jumlah meja total
export const DESK_LEVELS = [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 12, 13, 13, 13, 14, 14, 15, 15];

export const DECOR = {
  plant:   { name: 'Monstera Imut',      emoji: '🪴', cost: 4,  lvl: 1, mood: 1, desc: 'Tanaman bikin mata adem. Mood +' },
  aquarium:{ name: 'Akuarium Ikan Koi',  emoji: '🐠', cost: 10, lvl: 2, mood: 1, desc: 'Ikan berenang, stres kabur.' },
  poster:  { name: 'Poster Idol & Anime', emoji: '🌟', cost: 8, lvl: 3, mood: 1, desc: 'Semangat nonton, semangat kerja!' },
  beanbag: { name: 'Bean Bag Jumbo',     emoji: '🛋️', cost: 14, lvl: 4, mood: 1, desc: 'Tempat ngadem paling empuk.' },
  neon:    { name: 'Neon Bintang Hijau', emoji: '⭐', cost: 18, lvl: 5, mood: 1, desc: 'Vibes kantor jadi estetik.' }
};

export const LEVEL_TITLES = ['Staf Magang', 'Staf TI', 'Ketua Tim', 'Kepala Seksi', 'Kepala Bagian', 'Kepala Divisi', 'Direktur TI', 'Direktur Senior', 'CIO', 'CIO Legendaris'];
export const xpNeeded = lvl => Math.round(1.5 * (120 + 90 * (lvl - 1) + 12 * (lvl - 1) * (lvl - 1)));

export const MISSIONS = [
  { id: 'm_appr', title: 'Setujui 3 permintaan di Inbox', desc: 'Buka tab Inbox dan putuskan permintaan karyawan.', need: 3, key: 'approved', money: 5, xp: 50 },
  { id: 'm_memo', title: 'Tulis memo pertamamu', desc: 'Beberapa permintaan butuh memo resmi darimu.', need: 1, key: 'memos', money: 4, xp: 40 },
  { id: 'm_assign', title: 'Tugaskan tiket pertama', desc: 'Buka tab Tugas, pilih tiket, lalu pilih karyawan.', need: 1, key: 'assigned', money: 3, xp: 30 },
  { id: 'm_done3', title: 'Selesaikan 3 tiket', desc: 'Tim kecilmu pasti bisa!', need: 3, key: 'tasksDone', money: 4, xp: 50 },
  { id: 'm_coffee', title: 'Beli Mesin Kopi', desc: 'Kafein = bahan bakar para engineer.', need: 1, key: 'facCoffee', money: 4, xp: 40 },
  { id: 'm_cups', title: 'Seruput 10 cangkir kopi', desc: 'Biarkan tim ngopi di pantry.', need: 10, key: 'cups', money: 4, xp: 50 },
  { id: 'm_hire', title: 'Rekrut teman baru', desc: 'Beli meja kalau penuh, lalu rekrut di tab Tim.', need: 1, key: 'hired', money: 5, xp: 50 },
  { id: 'm_snack', title: 'Beli Kulkas & Snack', desc: 'Perut kenyang, hati senang.', need: 1, key: 'facSnack', money: 4, xp: 40 },
  { id: 'm_ps', title: 'Beli Konsol PS', desc: 'Istirahat main game itu produktif (katanya).', need: 1, key: 'facPs', money: 6, xp: 60 },
  { id: 'm_mochi', title: 'Elus Mochi 10 kali', desc: 'Tap kucing putih yang keliling kantor.', need: 10, key: 'mochi', money: 3, xp: 40 },
  { id: 'm_psplay', title: 'Sesi main PS ×5', desc: 'Stres turun, mood naik.', need: 5, key: 'psPlays', money: 5, xp: 60 },
  { id: 'm_pool', title: 'Buka Kolam Renang', desc: 'Tim butuh berendam setelah lembur!', need: 1, key: 'facPool', money: 12, xp: 110 },
  { id: 'm_proj1', title: 'Go-Live proyek pertama', desc: 'Setujui proyek, rapat kick-off, lalu luncurkan!', need: 1, key: 'projects', money: 15, xp: 140 },
  { id: 'm_proj3', title: 'Luncurkan 3 proyek', desc: 'Divisi TI jadi andalan Direksi.', need: 3, key: 'projects', money: 40, xp: 260 },
  { id: 'm_scold', title: 'Bos Galak: marahi staf 3 kali', desc: 'Panggil staff ke ruangan lewat tab Tim (hati-hati, mereka bisa resign!).', need: 3, key: 'scolds', money: 6, xp: 60 },
  { id: 'm_play', title: 'Buka Taman Bermain', desc: 'Kolam bola warna-warni menunggu!', need: 1, key: 'facPlay', money: 7, xp: 70 },
  { id: 'm_done10', title: 'Selesaikan 10 tiket', desc: 'Mulai jadi tim andalan bank.', need: 10, key: 'tasksDone', money: 8, xp: 90 },
  { id: 'm_lv5', title: 'Capai Level 5', desc: 'Jadi Kepala Bagian!', need: 5, key: 'level', money: 15, xp: 0 },
  { id: 'm_team5', title: 'Tim beranggotakan 5 orang', desc: 'Makin ramai makin seru.', need: 5, key: 'team', money: 10, xp: 100 },
  { id: 'm_perfect', title: '5 hasil kerja sempurna ✨', desc: 'Karyawan bahagia = hasil sempurna.', need: 5, key: 'perfect', money: 8, xp: 90 },
  { id: 'm_mg', title: 'Menangkan Patch Rush', desc: 'Selesaikan mini-game saat ada insiden.', need: 1, key: 'mgWins', money: 8, xp: 80 },
  { id: 'm_star4', title: 'Rating bank 4 bintang', desc: 'Jaga layanan, keamanan, dan mood.', need: 4, key: 'stars', money: 12, xp: 120 },
  { id: 'm_day14', title: 'Bertahan sampai Hari ke-14', desc: 'Dua minggu penuh cerita!', need: 14, key: 'day', money: 10, xp: 100 },
  { id: 'm_memo5', title: 'Tulis 5 memo', desc: 'Pemimpin yang baik rajin berkomunikasi.', need: 5, key: 'memos', money: 12, xp: 110 },
  { id: 'm_done30', title: 'Selesaikan 30 tiket', desc: 'Divisi TI makin tangguh.', need: 30, key: 'tasksDone', money: 18, xp: 160 },
  { id: 'm_lv10', title: 'Capai Level 10', desc: 'CIO Legendaris!', need: 10, key: 'level', money: 60, xp: 0 },
  { id: 'm_star5', title: 'Rating bank 5 bintang', desc: 'Divisi TI terbaik se-Nusantara!', need: 5, key: 'stars', money: 40, xp: 300 }
];

export const fmtMoney = v => {
  const a = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (a >= 1000) return `${sign}Rp ${(a / 1000).toFixed(2).replace('.', ',')} M`;
  if (a >= 100) return `${sign}Rp ${Math.round(a)} jt`;
  return `${sign}Rp ${a.toFixed(1).replace('.', ',')} jt`;
};
