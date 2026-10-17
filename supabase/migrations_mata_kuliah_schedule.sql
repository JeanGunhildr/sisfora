-- ==============================================================================
-- SISFORA - SKEMA TABEL MATA KULIAH & RLS UNTUK JADWAL / TIMELINE RUANGAN
-- Menggabungkan data peminjaman ruangan dan jadwal perkuliahan semester aktif
-- ==============================================================================

-- 1. BUAT TABEL MATA KULIAH
CREATE TABLE IF NOT EXISTS public.mata_kuliah (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ruangan_id uuid NOT NULL,
  kode_mk character varying NOT NULL,
  nama_mk character varying NOT NULL,
  dosen character varying NOT NULL,
  kelas character varying NOT NULL, -- Contoh: 'IF-A', 'SI-3B', 'TI-1A'
  hari character varying NOT NULL, -- 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
  jam_mulai time NOT NULL, -- e.g. '08:00:00'
  jam_selesai time NOT NULL, -- e.g. '10:30:00'
  sks integer NOT NULL DEFAULT 3,
  tahun_ajaran character varying DEFAULT '2025/2026 Ganjil',
  status_aktif boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT mata_kuliah_pkey PRIMARY KEY (id),
  CONSTRAINT mata_kuliah_ruangan_id_fkey FOREIGN KEY (ruangan_id) REFERENCES public.ruangan(id) ON DELETE CASCADE
);

-- Index untuk percepat query ketersediaan jadwal
CREATE INDEX IF NOT EXISTS idx_mata_kuliah_ruangan ON public.mata_kuliah(ruangan_id);
CREATE INDEX IF NOT EXISTS idx_mata_kuliah_hari ON public.mata_kuliah(hari);
CREATE INDEX IF NOT EXISTS idx_mata_kuliah_status ON public.mata_kuliah(status_aktif);

-- 2. SETUP ROW LEVEL SECURITY (RLS)
ALTER TABLE public.mata_kuliah ENABLE ROW LEVEL SECURITY;

-- Policy 1: Siapapun (anon & authenticated) dapat melihat jadwal mata kuliah aktif
DROP POLICY IF EXISTS "Anyone can view mata_kuliah" ON public.mata_kuliah;
CREATE POLICY "Anyone can view mata_kuliah"
  ON public.mata_kuliah
  FOR SELECT
  TO authenticated, anon
  USING (status_aktif = true OR public.is_admin());

-- Policy 2: Hanya Admin yang dapat menambah, mengubah, atau menghapus jadwal mata kuliah
DROP POLICY IF EXISTS "Admin can manage mata_kuliah" ON public.mata_kuliah;
CREATE POLICY "Admin can manage mata_kuliah"
  ON public.mata_kuliah
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. PERBAIKAN RLS PENGAJUAN: IZINKAN KETUA ORGANISASI MEMINJAM RUANGAN
-- Memastikan ketua_organisasi dan mahasiswa terverifikasi dapat mengajukan pinjam ruangan sendiri
DROP POLICY IF EXISTS "Insert pengajuan policy" ON public.pengajuan;
CREATE POLICY "Insert pengajuan policy"
  ON public.pengajuan
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (pemohon_id = auth.uid() AND (public.is_user_approved() OR public.is_ketua_organisasi()))
    OR public.is_admin()
  );

-- 4. GRANT PRIVILEGES
GRANT SELECT ON public.mata_kuliah TO anon, authenticated;
GRANT ALL ON public.mata_kuliah TO authenticated;

-- 5. CONTOH SEED DATA JADWAL KULIAH (Otomatis mengisi ke ruangan yang aktif jika ada)
DO $$
DECLARE
  v_ruang_1 uuid;
  v_ruang_2 uuid;
  v_ruang_3 uuid;
BEGIN
  -- Ambil 3 ID ruangan aktif teratas
  SELECT id INTO v_ruang_1 FROM public.ruangan WHERE status_aktif = true ORDER BY kapasitas DESC LIMIT 1;
  SELECT id INTO v_ruang_2 FROM public.ruangan WHERE status_aktif = true ORDER BY kapasitas DESC OFFSET 1 LIMIT 1;
  SELECT id INTO v_ruang_3 FROM public.ruangan WHERE status_aktif = true ORDER BY kapasitas DESC OFFSET 2 LIMIT 1;

  IF v_ruang_1 IS NOT NULL THEN
    INSERT INTO public.mata_kuliah (ruangan_id, kode_mk, nama_mk, dosen, kelas, hari, jam_mulai, jam_selesai, sks)
    VALUES
      (v_ruang_1, 'IF2101', 'Pemrograman Web Lanjut', 'Dr. Ir. Budi Santoso, M.Kom.', 'IF-3A', 'Senin', '08:00:00', '10:30:00', 3),
      (v_ruang_1, 'IF2105', 'Basis Data Terdistribusi', 'Prof. Siti Rahma, Ph.D.', 'IF-3B', 'Senin', '13:00:00', '15:30:00', 3),
      (v_ruang_1, 'IF3201', 'Kecerdasan Buatan', 'Ahmad Fauzi, M.T.', 'IF-5A', 'Selasa', '09:00:00', '11:30:00', 3),
      (v_ruang_1, 'IF1102', 'Struktur Data & Algoritma', 'Dr. Hendra Wijaya, S.Kom.', 'IF-1A', 'Rabu', '08:00:00', '11:00:00', 4),
      (v_ruang_1, 'IF2204', 'Jaringan Komputer', 'Doni Pratama, M.Kom.', 'IF-3A', 'Kamis', '10:00:00', '12:30:00', 3),
      (v_ruang_1, 'IF4102', 'Keamanan Informasi & Siber', 'Dr. Ir. Budi Santoso, M.Kom.', 'IF-7A', 'Jumat', '08:30:00', '11:00:00', 3)
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_ruang_2 IS NOT NULL THEN
    INSERT INTO public.mata_kuliah (ruangan_id, kode_mk, nama_mk, dosen, kelas, hari, jam_mulai, jam_selesai, sks)
    VALUES
      (v_ruang_2, 'SI1201', 'Analisis & Perancangan Sistem', 'Dewi Lestari, M.M.S.I.', 'SI-2A', 'Senin', '09:00:00', '11:30:00', 3),
      (v_ruang_2, 'SI2203', 'Manajemen Proyek TI', 'Rudi Hartono, M.T.', 'SI-4A', 'Selasa', '13:00:00', '15:30:00', 3),
      (v_ruang_2, 'SI3104', 'Enterprise Architecture', 'Dr. Siti Nurhaliza, M.Kom.', 'SI-6A', 'Rabu', '10:00:00', '12:30:00', 3),
      (v_ruang_2, 'TI1101', 'Kalkulus Informatika II', 'Drs. Supriyanto, M.Si.', 'TI-2B', 'Kamis', '08:00:00', '10:00:00', 2),
      (v_ruang_2, 'IF3108', 'Rekayasa Perangkat Lunak', 'Ahmad Fauzi, M.T.', 'IF-5B', 'Jumat', '13:30:00', '16:00:00', 3)
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_ruang_3 IS NOT NULL THEN
    INSERT INTO public.mata_kuliah (ruangan_id, kode_mk, nama_mk, dosen, kelas, hari, jam_mulai, jam_selesai, sks)
    VALUES
      (v_ruang_3, 'LAB201', 'Praktikum Jaringan Komputer', 'Doni Pratama, M.Kom.', 'LAB-A', 'Senin', '10:00:00', '12:00:00', 2),
      (v_ruang_3, 'LAB202', 'Praktikum Basis Data', 'Prof. Siti Rahma, Ph.D.', 'LAB-B', 'Selasa', '08:00:00', '10:30:00', 2),
      (v_ruang_3, 'LAB301', 'Praktikum Kecerdasan Buatan', 'Ahmad Fauzi, M.T.', 'LAB-C', 'Rabu', '13:00:00', '15:30:00', 2),
      (v_ruang_3, 'LAB101', 'Praktikum Pemrograman Dasar', 'Dr. Hendra Wijaya, S.Kom.', 'LAB-D', 'Kamis', '13:00:00', '16:00:00', 3),
      (v_ruang_3, 'LAB401', 'Praktikum Komputasi Awan', 'Dr. Ir. Budi Santoso, M.Kom.', 'LAB-E', 'Sabtu', '09:00:00', '12:00:00', 3)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
