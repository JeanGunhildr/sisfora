# SISFORA — Sistem Informasi Peminjaman Ruangan Fakultas

## 1. Nama Tim dan Daftar Anggota

**Nama Tim:** Mepet Deadline

**Daftar Anggota:**

1. Muhammad Rifqi Agus Setianto [H1D025113]
2. Felix Ogen Gelael [H1D025120]
3. Zuvika Dwi Yustina [H1D025124]
4. Anggit Latifah Kinanti [H1D025127]
5. Marcel Dwi Alansyah [H1D025130]

## 2. Deskripsi Permasalahan

Proses pencarian dan peminjaman ruangan di lingkungan fakultas sering kali belum terintegrasi dengan baik. Mahasiswa kesulitan mengetahui ketersediaan ruangan, jadwal penggunaan, dan fasilitas yang tersedia. Selain itu, pengajuan surat, proses persetujuan, serta pemantauan status peminjaman berpotensi memerlukan waktu dan koordinasi secara manual.

## 3. Solusi yang Dikembangkan

SISFORA merupakan aplikasi web yang mengintegrasikan pencarian ruangan, pengajuan peminjaman, persetujuan digital, dan pemantauan status dalam satu platform.

SISFORA memiliki empat role utama, yaitu Mahasiswa, Ketua Organisasi, Admin, dan Wakil Dekan III (WD III).

Fitur utama:

- **Visualisasi denah ruangan** dengan indikator status: hijau untuk tersedia, kuning/oranye untuk pengajuan yang sedang diproses, dan merah untuk peminjaman yang disetujui.
- **Mekanisme First Come, First Served (siapa cepat dia dapat)**: Pengguna yang submit terlebih dahulu langsung mengamankan jadwal ruangan di database. Jika pengajuan ditolak atau dibatalkan, slot waktu otomatis terbuka kembali.
- **Pengajuan peminjaman** untuk kepentingan umum maupun organisasi.
- **Persetujuan dan tanda tangan dokumen digital** oleh Ketua Organisasi dan WD III sesuai alur pengajuan.
- **Pemantauan status dan riwayat aktivitas** agar mahasiswa dapat mengetahui perkembangan pengajuan.
- **Feedback ruangan dan aplikasi** untuk mendukung evaluasi layanan.

Alur peminjaman umum adalah Mahasiswa → WD III, sedangkan peminjaman organisasi melalui Mahasiswa → Ketua Organisasi → WD III. Sistem juga membatasi setiap mahasiswa memiliki satu pengajuan aktif dalam satu waktu untuk mengurangi penyalahgunaan.

Lingkup pengembangan awal dibatasi pada satu fakultas.

## 4. Teknologi yang Digunakan

- **Bahasa pemrograman:** TypeScript
- **Framework:** Next.js App Router
- **UI dan styling:** Tailwind CSS v4 dan shadcn/ui
- **Database:** Supabase PostgreSQL
- **Autentikasi:** Supabase Auth
- **Penyimpanan dokumen:** Supabase Storage
- **Integrasi sesi:** `@supabase/ssr`
- **Layanan AI:** Untuk menerjemahkan prompt pengguna menjadi kriteria pencarian ruangan.

## 5. Petunjuk Instalasi dan Cara Menjalankan Aplikasi

### Prasyarat

Pastikan Node.js dan npm telah terpasang pada perangkat.

### Langkah instalasi

1. Clone repository:

   ```bash
   git clone https://github.com/JeanGunhildr/sisfora.git
   ```

2. Masuk ke direktori proyek:

   ```bash
   cd sisfora
   ```

3. Instal dependency:

   ```bash
   npm install
   ```

4. Konfigurasikan variabel lingkungan pada file `.env.local` sesuai kredensial Supabase yang digunakan:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

5. Pastikan database, migrasi, kebijakan akses, dan penyimpanan dokumen Supabase telah dikonfigurasi sesuai kebutuhan aplikasi.

6. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

7. Buka alamat berikut pada browser:

   ```text
   http://localhost:3000
   ```

**Catatan:** Jangan mengunggah file `.env.local` atau secret key ke repository publik. Pastikan versi dependency dan perintah yang digunakan sesuai dengan konfigurasi proyek.

---

**SISFORA — Mempermudah pencarian ruangan dan pengajuan peminjaman melalui sistem yang terintegrasi.**
