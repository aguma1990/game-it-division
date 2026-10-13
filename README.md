# 🌿 Neko Bank IT — Kantor TI Imut (PWA)

Game simulasi **mengelola divisi Teknologi Informasi sebuah bank**, versi baru dengan tampilan
**kantor isometrik tampak dari atas** (satu lantai penuh, tema hijau) dan karakter **chibi ala anime Jepang** yang menggemaskan.
Konsepnya sama dengan *Bank IT Director* (tiket, rekrutmen, anggaran, moral, keamanan, layanan, risiko,
level & XP), tetapi dengan permainan yang berbeda dan lebih hidup.

## Cara menjalankan

Tidak perlu build. Cukup layani folder ini lewat server statis apa pun:

```bash
cd NekoBankIT_Kawaii_PWA
python3 -m http.server 8080
# atau: npx serve .
```

Buka `http://localhost:8080`. Untuk di HP (satu jaringan Wi-Fi) buka `http://<IP-komputer>:8080`.
Pasang sebagai aplikasi lewat *Add to Home Screen* (iOS/Android) atau ikon "Install" di Chrome/Edge.
Service worker membuat game bisa dimainkan **offline** setelah dibuka sekali.
(Service worker butuh `localhost` atau HTTPS; file tidak bisa dibuka langsung via `file://`.)

## Kontrol peta
- **Geser** (drag) untuk menggeser kamera, **cubit / roda mouse** atau tombol ＋ − untuk zoom, ⌖ untuk reset tampilan.
- Tap karyawan, ruangan, atau meja kosong untuk membuka panel terkait.
- Tiga departemen bersekat kaca, masing-masing dengan area meja sendiri sejak awal permainan (1 meja terisi; ruangan melebar sampai 3 meja, lalu satu baris lagi, dan terakhir **Gedung Tambahan** di sisi selatan: sampai 9 meja per departemen): **Pengendalian Sistem** (Analis Kontrol & Security), **Pengembangan Sistem** (Developer & Project Manager), **Operasional & Infrastruktur** (Ops Engineer & DBA). Beli meja tambahan per departemen di tab Toko.
- **Ruang Kepala Divisi** di sayap timur: meja eksekutif, rak buku dengan trofi (jumlahnya mengikuti rating bintang), sofa tamu, dan karakter Direktur. Tap ruangan/Direktur untuk membuka profil & pengaturan.
- Zona lain: Pantry & Kopi dan Lounge PS (baris belakang), Ruang Server, dan Taman Bermain (baris depan).

## Cara bermain

| Aksi | Keterangan |
|---|---|
| 📋 **Tugas** | Tugaskan tiket ke karyawan. Cocok spesialisasi = 100% efisien, tidak cocok = 50%. Tap gelembung ⭐ *Klaim!* untuk bonus 10%. |
| ⚡😣💚 **Energi, stres, mood** | Karyawan lelah/stres bekerja lambat dan bisa *burnout*. Beri istirahat! |
| ☕ **Mesin kopi** (3 level) | Mengisi energi + efek semangat sementara. Naik ke Robot Barista Neko! |
| 🎮 **Konsol PS** (3 level) | Menurunkan stres, menaikkan mood. Main bareng = bonus. Ada turnamen PS antar divisi. |
| 🛝 **Taman bermain** (3 level) | Kolam bola → perosotan & trampolin → istana pelangi. |
| 🖥️ **Ruang server** (4 level) | Keamanan naik tiap hari, tiket *onsite* dikerjakan di sini. |
| 📢 **Panggil staf** | Tombol 📢 di kartu karyawan: panggil ke ruang Kepala Divisi lalu pilih gaya — **marah-marah** 😡, tegur halus 😐, atau beri semangat 🤗. |
| 🚪 **Pecat** | Tombol 🚪 di kartu karyawan (pesangon 3× gaji harian, mood tim −4). Mejanya langsung kosong untuk merekrut pengganti. |
| 👥 **Rekrut** | Calon baru tiap hari, ada rarity N/R/SR/SSR, sifat unik (Pecinta Kopi, Gamer Sejati, dst). |
| 📥 **Inbox persetujuan** | Karyawan/Direksi mengajukan permintaan: perangkat rusak, stok kopi habis, cuti, pelatihan, proyek baru, dan memo ke Direksi. Kamu yang memutuskan; proyek baru & memo wajib ditulis sebagai memo resmi. Permintaan yang dibiarkan sampai tenggat akan kedaluwarsa dengan konsekuensi. |
| 📋 **Ruang Meeting** | Proyek baru yang disetujui (dengan memo) tidak langsung jalan: kamu harus mengadakan **rapat kick-off** di tab Inbox, memilih 2–6 peserta dan fokus proyek. Peserta berkumpul di Ruang Meeting; setelah rapat selesai baru tiket proyek masuk. Perwakilan lengkap dari tiga departemen memberi hadiah lebih besar. |
| 🚀 **Siklus proyek** | Setelah kick-off: Analisis → *Review* (terima / minta revisi) → Pengembangan → *UAT* (perubahan klien atau bug kritis dengan mini-game) → Implementasi → **Go-Live** dengan syukuran opsional. Keputusanmu menentukan kualitas, bonus, dan rating peluncuran. |
| 🏊 **Kolam renang** | Fasilitas baru di Toko (3 level) di sayap timur. Stres turun & mood naik; karyawan Santai dapat bonus. |
| 🎲 **Event acak** | Server ngambek, phishing boba, audit OJK-chan, kucing hitam hacker, listrik padam, dll. |
| 🕹️ **Patch Rush** | Mini-game tap bug saat insiden terjadi. |
| 🐱 **Mochi** | Kucing maskot: tap untuk menaikkan mood tim, dan kadang membawa 🎁 kado kejutan. |
| 🎯 **Misi** | 19 misi berhadiah. Rapor mingguan menampilkan karyawan terbaik. |

Tujuan: jaga **Keamanan**, **Layanan**, **Mood**, dan rendahkan **Risiko** untuk meraih **rating ★5**,
naik ke level 10 (CIO Legendaris), dan buat kantor TI paling bahagia di Nusantara.

## Teknologi
- JavaScript ES Module murni + Canvas 2D (tanpa framework, tanpa build step).
- Karakter, ruangan, dan efek digambar **prosedural** (tidak ada aset gambar kecuali ikon aplikasi).
- Efek suara dari WebAudio (tanpa file audio).
- Penyimpanan otomatis di `localStorage`; ekspor/impor save JSON dari menu ⚙️.

## Struktur
```
index.html · manifest.webmanifest · sw.js
css/style.css
js/data.js      data statis (spesialisasi, tiket, fasilitas, misi)
js/game.js      logika game (tanpa DOM): waktu, AI karyawan, ekonomi, misi
js/events.js    event acak
js/chibi.js     karakter chibi 2D + Mochi
js/iso.js       penggambar dunia isometrik (lantai, dinding, furnitur)
js/scene.js     scene Canvas: kamera, karyawan, partikel, gelembung, hit-test
js/ui.js        HUD, panel, modal, layar judul
js/minigame.js  mini-game Patch Rush
js/audio.js · js/store.js · js/main.js
icons/          ikon PWA
```

## Rilis & cache
Setiap rilis jalankan `python3 bump.py <versi>` (mis. `python3 bump.py 4.2.3`). Skrip ini memasang `?v=<versi>` pada semua impor modul, CSS, dan service worker agar browser/HP tidak pernah memuat campuran file lama dan baru (penyebab layar hijau kosong).
