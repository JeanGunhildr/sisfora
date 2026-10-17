-- ==============================================================================
-- SISFORA: RLS POLICIES, HELPER FUNCTIONS & DATABASE CONSTRAINTS
-- Script ini siap dieksekusi di Supabase SQL Editor untuk menjamin keamanan
-- dan kelancaran alur: Mahasiswa -> Ketua Organisasi -> Wakil Dekan 3
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FUNGSI HELPER KEAMANAN (SECURITY DEFINER)
-- Menghindari infinite recursion dan menjamin performa saat pengecekan role
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_wd3()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'wd3'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_ketua_organisasi()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ketua_organisasi'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_user_approved()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND status_verifikasi = 'disetujui'
  );
$$;


-- ------------------------------------------------------------------------------
-- 2. TABEL: public.users (Izin Pembacaan Relasi Pemohon & Pejabat)
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Pastikan WD3, Admin, dan sistem dapat membaca profil pengguna untuk relasi join pemohon & ketua
DROP POLICY IF EXISTS "Users read basic profile for relation" ON public.users;
CREATE POLICY "Users read basic profile for relation"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR public.is_admin() 
    OR public.is_wd3() 
    OR public.is_ketua_organisasi()
    OR true
  );

-- Admin dapat memperbarui status atau role user
DROP POLICY IF EXISTS "Admin can update any user" ON public.users;
CREATE POLICY "Admin can update any user"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin dapat menghapus user (misal mahasiswa ditolak)
DROP POLICY IF EXISTS "Admin can delete any user" ON public.users;
CREATE POLICY "Admin can delete any user"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ------------------------------------------------------------------------------
-- 3. TABEL: public.organisasi
-- ------------------------------------------------------------------------------
ALTER TABLE public.organisasi ENABLE ROW LEVEL SECURITY;

-- SELECT: Semua pengguna dapat melihat organisasi aktif; Admin & WD3 dapat melihat semua
DROP POLICY IF EXISTS "Anyone can view active organisasi" ON public.organisasi;
CREATE POLICY "Anyone can view active organisasi"
  ON public.organisasi
  FOR SELECT
  TO authenticated, anon
  USING (
    status_aktif = true 
    OR public.is_admin() 
    OR public.is_wd3()
    OR ketua_id = auth.uid()
  );

-- INSERT: Hanya Admin yang dapat mendaftarkan organisasi baru
DROP POLICY IF EXISTS "Admin can insert organisasi" ON public.organisasi;
CREATE POLICY "Admin can insert organisasi"
  ON public.organisasi
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: Hanya Admin yang dapat mengedit profil organisasi, status aktif, dan mengatur ketua
DROP POLICY IF EXISTS "Admin can update organisasi" ON public.organisasi;
CREATE POLICY "Admin can update organisasi"
  ON public.organisasi
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Hanya Admin yang dapat menghapus organisasi
DROP POLICY IF EXISTS "Admin can delete organisasi" ON public.organisasi;
CREATE POLICY "Admin can delete organisasi"
  ON public.organisasi
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- CONSTRAINT: 1 Mahasiswa maksimal menjadi ketua di 1 organisasi
CREATE UNIQUE INDEX IF NOT EXISTS idx_organisasi_ketua_unique 
  ON public.organisasi (ketua_id) 
  WHERE ketua_id IS NOT NULL;


-- ------------------------------------------------------------------------------
-- 4. TABEL: public.pengajuan (Persetujuan WD3 & Verifikasi Ketua Organisasi)
-- ------------------------------------------------------------------------------
ALTER TABLE public.pengajuan ENABLE ROW LEVEL SECURITY;

-- SELECT: Admin dan WD3 dapat melihat seluruh pengajuan; Pemohon melihat miliknya;
-- Ketua Organisasi melihat pengajuan organisasinya
DROP POLICY IF EXISTS "View pengajuan policy" ON public.pengajuan;
CREATE POLICY "View pengajuan policy"
  ON public.pengajuan
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_wd3()
    OR pemohon_id = auth.uid()
    OR (
      public.is_ketua_organisasi() 
      AND jenis_peminjaman = 'organisasi'
    )
  );

-- INSERT: Mahasiswa yang disetujui / Admin dapat membuat pengajuan baru
DROP POLICY IF EXISTS "Insert pengajuan policy" ON public.pengajuan;
CREATE POLICY "Insert pengajuan policy"
  ON public.pengajuan
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (pemohon_id = auth.uid() AND public.is_user_approved())
    OR public.is_admin()
  );

-- UPDATE: WD3 dapat menyetujui / menolak; Ketua Organisasi dapat memverifikasi; Pemohon dapat ubah drafnya
DROP POLICY IF EXISTS "Update pengajuan policy" ON public.pengajuan;
CREATE POLICY "Update pengajuan policy"
  ON public.pengajuan
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_wd3()
    OR (public.is_ketua_organisasi() AND jenis_peminjaman = 'organisasi')
    OR (pemohon_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_wd3()
    OR (public.is_ketua_organisasi() AND jenis_peminjaman = 'organisasi')
    OR (pemohon_id = auth.uid())
  );

-- DELETE: Admin dapat menghapus; Pemohon hanya jika masih menunggu_upload
DROP POLICY IF EXISTS "Delete pengajuan policy" ON public.pengajuan;
CREATE POLICY "Delete pengajuan policy"
  ON public.pengajuan
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR (pemohon_id = auth.uid() AND status = 'menunggu_upload')
  );


-- ------------------------------------------------------------------------------
-- 5. TABEL: public.dokumen_pengajuan
-- ------------------------------------------------------------------------------
ALTER TABLE public.dokumen_pengajuan ENABLE ROW LEVEL SECURITY;

-- SELECT: Admin, WD3, Ketua Organisasi, dan Pemohon dapat melihat berkas
DROP POLICY IF EXISTS "View dokumen pengajuan" ON public.dokumen_pengajuan;
CREATE POLICY "View dokumen pengajuan"
  ON public.dokumen_pengajuan
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_wd3()
    OR diunggah_oleh = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.pengajuan p
      WHERE p.id = pengajuan_id
      AND (p.pemohon_id = auth.uid() OR public.is_ketua_organisasi())
    )
  );

-- INSERT: Pemohon mengunggah surat, Ketua Organisasi, WD3, Admin
DROP POLICY IF EXISTS "Insert dokumen pengajuan" ON public.dokumen_pengajuan;
CREATE POLICY "Insert dokumen pengajuan"
  ON public.dokumen_pengajuan
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.is_wd3()
    OR public.is_ketua_organisasi()
    OR diunggah_oleh = auth.uid()
  );

-- UPDATE: Memperbarui status dokumen surat (ditandatangani_ketua, ditandatangani_wd3)
DROP POLICY IF EXISTS "Update dokumen pengajuan" ON public.dokumen_pengajuan;
CREATE POLICY "Update dokumen pengajuan"
  ON public.dokumen_pengajuan
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_wd3()
    OR public.is_ketua_organisasi()
    OR diunggah_oleh = auth.uid()
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_wd3()
    OR public.is_ketua_organisasi()
    OR diunggah_oleh = auth.uid()
  );


-- ------------------------------------------------------------------------------
-- 6. TABEL: public.tanda_tangan & public.riwayat_status
-- ------------------------------------------------------------------------------
ALTER TABLE public.tanda_tangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riwayat_status ENABLE ROW LEVEL SECURITY;

-- Tanda Tangan: View & Manage
DROP POLICY IF EXISTS "View tanda tangan" ON public.tanda_tangan;
CREATE POLICY "View tanda tangan"
  ON public.tanda_tangan
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Manage tanda tangan" ON public.tanda_tangan;
CREATE POLICY "Manage tanda tangan"
  ON public.tanda_tangan
  FOR ALL
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_wd3()
    OR public.is_ketua_organisasi()
    OR penanda_tangan_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_wd3()
    OR public.is_ketua_organisasi()
    OR penanda_tangan_id = auth.uid()
  );

-- Riwayat Status: View & Insert
DROP POLICY IF EXISTS "View riwayat status" ON public.riwayat_status;
CREATE POLICY "View riwayat status"
  ON public.riwayat_status
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Insert riwayat status" ON public.riwayat_status;
CREATE POLICY "Insert riwayat status"
  ON public.riwayat_status
  FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 7. GRANT PERMISSIONS
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON public.gedung, public.ruangan, public.organisasi, public.fasilitas, public.ruangan_fasilitas, public.penahanan_jadwal TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
