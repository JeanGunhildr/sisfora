# SISFORA

**SISFORA (Sistem Informasi Peminjaman Ruangan Fakultas)** adalah aplikasi web untuk memudahkan mahasiswa mencari ruangan, mengajukan peminjaman, melakukan persetujuan secara digital, dan memantau status pengajuan dalam satu platform terintegrasi.

> **Status:** MVP/Hackathon. Lingkup pengembangan dibatasi pada satu fakultas. Data yang digunakan untuk demo harus diverifikasi sebelum diterapkan secara nyata.

## Fitur Utama

- **Pencarian Ruangan dengan AI:** Membantu pengguna mencari ruangan berdasarkan kebutuhan, kapasitas, fasilitas, tanggal, dan waktu melalui prompt bahasa alami.
- **Visualisasi Ketersediaan:** Menampilkan kondisi ruangan berdasarkan denah dan kode warna.
- **Penjadwalan Ruangan:** Pencarian berdasarkan hari atau tanggal, grafik pemakaian, serta fitur drag and drop untuk memilih slot waktu.
- **Pengajuan Peminjaman:** Mendukung peminjaman untuk kepentingan umum maupun organisasi.
- **Persetujuan Digital:** Mendukung peninjauan dan penandatanganan dokumen oleh pihak berwenang.
- **Pemantauan Status:** Menampilkan status pengajuan, riwayat aktivitas, dan alasan penolakan.
- **Feedback:** Pengguna dapat memberikan masukan mengenai ruangan maupun aplikasi tanpa harus meminjam ruangan terlebih dahulu.
- **Verifikasi Akun:** Registrasi mahasiswa menggunakan bukti Kartu Tanda Mahasiswa (KTM) yang diverifikasi oleh Admin.

## Role Pengguna

| Role                         | Hak Akses Utama                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Mahasiswa**                | Mencari ruangan, mengajukan peminjaman, mengunggah dokumen, memantau status, dan memberikan feedback.      |
| **Ketua Organisasi**         | Memeriksa kesesuaian anggota dan kepentingan organisasi serta menandatangani dokumen pengajuan organisasi. |
| **Admin**                    | Memverifikasi akun serta mengelola data gedung, ruangan, fasilitas, dan jadwal.                            |
| **Wakil Dekan III (WD III)** | Meninjau pengajuan dan memberikan keputusan akhir berupa persetujuan atau penolakan.                       |

## Alur Peminjaman

**Peminjaman Umum**

Mahasiswa memilih ruangan → Mengunggah surat PDF → Pengajuan diteruskan ke WD III → WD III menyetujui atau menolak → Status diperbarui dan dapat dipantau mahasiswa.

**Peminjaman Organisasi**

Mahasiswa memilih ruangan → Mengunggah surat PDF → Ketua Organisasi memeriksa pengajuan dan menandatangani dokumen → Pengajuan diteruskan ke WD III → WD III memberikan keputusan akhir → Status diperbarui.

Penolakan harus disertai alasan yang dapat dibaca mahasiswa. Pengajuan yang ditolak bersifat final dan mahasiswa dapat membuat pengajuan baru.

## Status dan Visualisasi Ruangan

| Warna     | Keterangan                                               |
| --------- | -------------------------------------------------------- |
| 🟢 Hijau  | Ruangan tersedia.                                        |
| 🟡 Kuning | Slot ditahan sementara saat pengajuan sedang dilengkapi. |
| 🟠 Oranye | Pengajuan telah dikirim dan menunggu keputusan.          |
| 🔴 Merah  | Peminjaman telah disetujui.                              |

Jika mahasiswa tidak mengirim pengajuan hingga batas waktu penahanan berakhir, slot akan dilepas kembali selama tidak ada konflik jadwal.

Setiap mahasiswa dibatasi memiliki **satu pengajuan peminjaman aktif** pada satu waktu untuk mencegah penyalahgunaan sistem.

## Dokumen dan Riwayat Aktivitas

Dokumen pengajuan diunggah dalam format PDF. Setelah penandatanganan berhasil, sistem menyimpan versi terbaru dengan menggantikan file sebelumnya untuk menghemat penyimpanan.

Riwayat aktivitas tetap dicatat secara terpisah, meliputi pelaku tindakan, waktu, perubahan status, dan alasan keputusan. Penggantian dokumen dilakukan hanya setelah file baru berhasil dibuat dan divalidasi.

Tanda tangan melalui aplikasi tidak otomatis merupakan tanda tangan elektronik tersertifikasi. Mekanisme penandatanganan dan integritas dokumen harus disesuaikan dengan implementasi yang digunakan.

## Teknologi

- **Framework:** Next.js App Router dan TypeScript
- **UI:** Tailwind CSS v4 dan shadcn/ui
- **Database:** Supabase PostgreSQL
- **Autentikasi:** Supabase Auth
- **Penyimpanan dokumen:** Supabase Storage dengan bucket privat
- **Integrasi sesi:** `@supabase/ssr`
- **AI:** Layanan AI untuk menerjemahkan prompt menjadi kriteria pencarian ruangan

## Keamanan Sistem

- Hak akses setiap role divalidasi di sisi server dan database menggunakan Row Level Security (RLS).
- Mahasiswa hanya dapat mengakses pengajuan dan dokumennya sendiri.
- Pengguna tidak dapat menentukan role Admin, Ketua Organisasi, atau WD III secara mandiri.
- Konflik jadwal diperiksa sebelum pengajuan disimpan dan sebelum persetujuan diberikan.
- Query hasil interpretasi AI harus divalidasi; AI tidak menentukan ketersediaan ruangan secara langsung.
- Dokumen dan bukti KTM disimpan secara privat.
- Perubahan status dan keputusan persetujuan dicatat untuk menjaga keterlacakan proses.

---

**SISFORA — Satu platform untuk pencarian ruangan, peminjaman, dan persetujuan yang lebih terintegrasi.**
