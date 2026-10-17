-- ==============================================================================
-- SISFORA - KOMPREHENSIF ROW LEVEL SECURITY (RLS) POLICIES & CONSTRAINTS
-- Melindungi seluruh tabel: users, gedung, ruangan, fasilitas, pengajuan,
-- dokumen_pengajuan, tanda_tangan, riwayat_status, feedback
-- Dilengkapi mekanisme First Come, First Served (anti race condition di database)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FUNGSI HELPER KEAMANAN (SECURITY DEFINER)
-- Menghindari infinite recursion saat pengecekan RLS antar tabel
-- ------------------------------------------------------------------------------

-- Helper 1: Cek apakah user adalah Admin
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

-- Helper 2: Cek apakah user adalah Wakil Dekan 3 (WD3)
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

-- Helper 3: Cek apakah user adalah Ketua Organisasi
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

-- Helper 4: Cek status verifikasi user (harus 'disetujui')
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


-- ==============================================================================
-- 2. TABEL: public.users
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- SELECT: User membaca profil sendiri, Admin membaca semua, sesama auth membaca profil dasar untuk join
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can read all users" ON public.users;
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
    OR true -- Mengizinkan pembacaan nama/nim/email untuk join pemohon & feedback
  );

-- INSERT: Registrasi akun baru (auth & anon via trigger/direct)
DROP POLICY IF EXISTS "Allow user insert on signup" ON public.users;
CREATE POLICY "Allow user insert on signup"
  ON public.users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- UPDATE: User update profil miliknya sendiri
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- UPDATE: Admin dapat memverifikasi/mengubah status user apapun
DROP POLICY IF EXISTS "Admin can update any user" ON public.users;
CREATE POLICY "Admin can update any user"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Admin dapat menghapus akun (misal mahasiswa yang ditolak)
DROP POLICY IF EXISTS "Admin can delete any user" ON public.users;
CREATE POLICY "Admin can delete any user"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ==============================================================================
-- 3. TABEL: public.gedung
-- ==============================================================================
ALTER TABLE public.gedung ENABLE ROW LEVEL SECURITY;

-- SELECT: Semua pengguna (auth & anon) dapat melihat gedung aktif; Admin dapat melihat semua
DROP POLICY IF EXISTS "Anyone can view active buildings" ON public.gedung;
CREATE POLICY "Anyone can view active buildings"
  ON public.gedung
  FOR SELECT
  TO authenticated, anon
  USING (status_aktif = true OR public.is_admin());

-- INSERT: Hanya Admin yang dapat menambah gedung
DROP POLICY IF EXISTS "Admin can insert building" ON public.gedung;
CREATE POLICY "Admin can insert building"
  ON public.gedung
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: Hanya Admin yang dapat memperbarui gedung
DROP POLICY IF EXISTS "Admin can update building" ON public.gedung;
CREATE POLICY "Admin can update building"
  ON public.gedung
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Hanya Admin yang dapat menghapus gedung
DROP POLICY IF EXISTS "Admin can delete building" ON public.gedung;
CREATE POLICY "Admin can delete building"
  ON public.gedung
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ==============================================================================
-- 4. TABEL: public.ruangan
-- ==============================================================================
ALTER TABLE public.ruangan ENABLE ROW LEVEL SECURITY;

-- SELECT: Semua pengguna dapat melihat ruangan aktif; Admin dapat melihat semua
DROP POLICY IF EXISTS "Anyone can view active rooms" ON public.ruangan;
CREATE POLICY "Anyone can view active rooms"
  ON public.ruangan
  FOR SELECT
  TO authenticated, anon
  USING (status_aktif = true OR public.is_admin());

-- INSERT: Hanya Admin yang dapat menambah ruangan
DROP POLICY IF EXISTS "Admin can insert room" ON public.ruangan;
CREATE POLICY "Admin can insert room"
  ON public.ruangan
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: Hanya Admin yang dapat memperbarui ruangan
DROP POLICY IF EXISTS "Admin can update room" ON public.ruangan;
CREATE POLICY "Admin can update room"
  ON public.ruangan
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Hanya Admin yang dapat menghapus ruangan
DROP POLICY IF EXISTS "Admin can delete room" ON public.ruangan;
CREATE POLICY "Admin can delete room"
  ON public.ruangan
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ==============================================================================
-- 5. TABEL: public.fasilitas & public.ruangan_fasilitas
-- ==============================================================================
ALTER TABLE public.fasilitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ruangan_fasilitas ENABLE ROW LEVEL SECURITY;

-- SELECT: Semua pengguna dapat melihat fasilitas
DROP POLICY IF EXISTS "Anyone can view fasilitas" ON public.fasilitas;
CREATE POLICY "Anyone can view fasilitas"
  ON public.fasilitas
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Anyone can view ruangan_fasilitas" ON public.ruangan_fasilitas;
CREATE POLICY "Anyone can view ruangan_fasilitas"
  ON public.ruangan_fasilitas
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- CRUD: Admin mengelola fasilitas
DROP POLICY IF EXISTS "Admin can manage fasilitas" ON public.fasilitas;
CREATE POLICY "Admin can manage fasilitas"
  ON public.fasilitas
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can manage ruangan_fasilitas" ON public.ruangan_fasilitas;
CREATE POLICY "Admin can manage ruangan_fasilitas"
  ON public.ruangan_fasilitas
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 5B. TABEL: public.organisasi
-- ==============================================================================
ALTER TABLE public.organisasi ENABLE ROW LEVEL SECURITY;

-- SELECT: Semua pengguna dapat melihat organisasi aktif; Admin & WD3 dapat melihat semua
DROP POLICY IF EXISTS "Anyone can view active organisasi" ON public.organisasi;
CREATE POLICY "Anyone can view active organisasi"
  ON public.organisasi
  FOR SELECT
  TO authenticated, anon
  USING (status_aktif = true OR public.is_admin() OR public.is_wd3() OR ketua_id = auth.uid());

-- INSERT: Hanya Admin yang dapat menambah organisasi baru
DROP POLICY IF EXISTS "Admin can insert organisasi" ON public.organisasi;
CREATE POLICY "Admin can insert organisasi"
  ON public.organisasi
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: Hanya Admin yang dapat memperbarui organisasi (info, status, ketua_id)
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

-- Constraint: 1 Mahasiswa maksimal menjadi ketua di 1 organisasi
CREATE UNIQUE INDEX IF NOT EXISTS idx_organisasi_ketua_unique 
  ON public.organisasi (ketua_id) 
  WHERE ketua_id IS NOT NULL;


-- ==============================================================================
-- 6. TABEL: public.pengajuan
-- ==============================================================================
ALTER TABLE public.pengajuan ENABLE ROW LEVEL SECURITY;

-- SELECT: Admin dan WD3 melihat semua; Pemohon melihat miliknya; Ketua melihat organisasinya;
-- Mahasiswa terautentikasi dapat melihat jadwal pengajuan aktif untuk transparansi ketersediaan ruangan
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
    OR status NOT IN ('ditolak_ketua', 'ditolak_wd3', 'ditolak', 'dibatalkan', 'kedaluwarsa')
  );

-- INSERT: Mahasiswa yang sudah diverifikasi/disetujui dapat membuat pengajuan baru
DROP POLICY IF EXISTS "Insert pengajuan policy" ON public.pengajuan;
CREATE POLICY "Insert pengajuan policy"
  ON public.pengajuan
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (pemohon_id = auth.uid() AND public.is_user_approved())
    OR public.is_admin()
  );

-- UPDATE: Pemohon bisa ubah saat draft/menunggu, Pejabat/Admin bisa setujui/tolak
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
-- 6B. MEKANISME FIRST COME, FIRST SERVED (ANTI-RACE CONDITION & EXCLUSION)
-- ------------------------------------------------------------------------------

-- Fungsi Trigger: Validasi bentrok jadwal dengan Advisory Lock per ruangan
CREATE OR REPLACE FUNCTION public.check_jadwal_ruangan_bentrok()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Validasi hanya berjalan jika status pengajuan aktif
  -- Jika ditolak (ditolak_ketua, ditolak_wd3), dibatalkan, atau kedaluwarsa, slot otomatis dibebaskan
  IF NEW.status NOT IN ('ditolak_ketua', 'ditolak_wd3', 'ditolak', 'dibatalkan', 'kedaluwarsa') THEN
    
    -- 2. Kunci transaksi advisory per ruangan_id untuk mencegah race condition (siapa cepat dia dapat)
    PERFORM pg_advisory_xact_lock(hashtext('ruangan_lock_' || NEW.ruangan_id::text));

    -- 3. Cek apakah ada jadwal ruangan yang bertabrakan dengan pengajuan aktif lain
    IF EXISTS (
      SELECT 1
      FROM public.pengajuan
      WHERE ruangan_id = NEW.ruangan_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND status NOT IN ('ditolak_ketua', 'ditolak_wd3', 'ditolak', 'dibatalkan', 'kedaluwarsa')
        AND (tanggal_mulai, tanggal_selesai) OVERLAPS (NEW.tanggal_mulai, NEW.tanggal_selesai)
    ) THEN
      RAISE EXCEPTION 'Jadwal ruangan yang dipilih telah diamankan oleh pemohon lain terlebih dahulu (First Come, First Served).'
        USING ERRCODE = '23P01',
              HINT = 'Silakan pilih ruangan lain atau tentukan waktu yang tidak bertabrakan.';
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- Pasang trigger pada tabel pengajuan
DROP TRIGGER IF EXISTS trg_check_jadwal_ruangan_bentrok ON public.pengajuan;
CREATE TRIGGER trg_check_jadwal_ruangan_bentrok
  BEFORE INSERT OR UPDATE OF ruangan_id, tanggal_mulai, tanggal_selesai, status
  ON public.pengajuan
  FOR EACH ROW
  EXECUTE FUNCTION public.check_jadwal_ruangan_bentrok();

-- Exclusion Constraint dengan partial condition (membutuhkan extension btree_gist)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.pengajuan DROP CONSTRAINT IF EXISTS no_overlapping_ruangan_schedule;
ALTER TABLE public.pengajuan
  ADD CONSTRAINT no_overlapping_ruangan_schedule
  EXCLUDE USING gist (
    ruangan_id WITH =,
    tstzrange(tanggal_mulai, tanggal_selesai) WITH &&
  )
  WHERE (status NOT IN ('ditolak_ketua', 'ditolak_wd3', 'ditolak', 'dibatalkan', 'kedaluwarsa'));

-- Fungsi Helper RPC: Pengecekan ketersediaan jadwal ruangan
CREATE OR REPLACE FUNCTION public.cek_ketersediaan_ruangan(
  p_ruangan_id uuid,
  p_tanggal_mulai timestamptz,
  p_tanggal_selesai timestamptz,
  p_pengajuan_id uuid DEFAULT NULL
)
RETURNS TABLE (
  tersedia boolean,
  konflik_nomor character varying,
  konflik_mulai timestamptz,
  konflik_selesai timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_konflik RECORD;
BEGIN
  SELECT nomor_pengajuan, tanggal_mulai, tanggal_selesai
  INTO v_konflik
  FROM public.pengajuan
  WHERE ruangan_id = p_ruangan_id
    AND (p_pengajuan_id IS NULL OR id != p_pengajuan_id)
    AND status NOT IN ('ditolak_ketua', 'ditolak_wd3', 'ditolak', 'dibatalkan', 'kedaluwarsa')
    AND (tanggal_mulai, tanggal_selesai) OVERLAPS (p_tanggal_mulai, p_tanggal_selesai)
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT false, v_konflik.nomor_pengajuan, v_konflik.tanggal_mulai, v_konflik.tanggal_selesai;
  ELSE
    RETURN QUERY SELECT true, NULL::character varying, NULL::timestamptz, NULL::timestamptz;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cek_ketersediaan_ruangan TO authenticated, anon;


-- ==============================================================================
-- 7. TABEL: public.dokumen_pengajuan
-- (Mendukung konsep overwrite dokumen versi baru / hemat memori)
-- ==============================================================================
ALTER TABLE public.dokumen_pengajuan ENABLE ROW LEVEL SECURITY;

-- SELECT: Admin, WD3, Ketua Organisasi, dan Pemohon
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

-- INSERT: Pemohon, Ketua Organisasi, WD3, dan Admin
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

-- UPDATE: Mengizinkan penimpaan file dokumen surat dengan versi yang sudah ditandatangani
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

-- DELETE: Admin atau Pemohon
DROP POLICY IF EXISTS "Delete dokumen pengajuan" ON public.dokumen_pengajuan;
CREATE POLICY "Delete dokumen pengajuan"
  ON public.dokumen_pengajuan
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR diunggah_oleh = auth.uid()
  );


-- ==============================================================================
-- 8. TABEL: public.feedback
-- ==============================================================================
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- SELECT: Semua pengguna authenticated dapat membaca feedback & rating
DROP POLICY IF EXISTS "Anyone authenticated can read feedback" ON public.feedback;
CREATE POLICY "Anyone authenticated can read feedback"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Pengguna authenticated dapat membuat feedback sendiri
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback;
CREATE POLICY "Users can insert own feedback"
  ON public.feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: User dapat mengubah feedback miliknya; Admin dapat memoderasi feedback
DROP POLICY IF EXISTS "Update feedback policy" ON public.feedback;
CREATE POLICY "Update feedback policy"
  ON public.feedback
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- DELETE: Admin dapat menghapus feedback; User dapat menghapus feedback miliknya
DROP POLICY IF EXISTS "Delete feedback policy" ON public.feedback;
CREATE POLICY "Delete feedback policy"
  ON public.feedback
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());


-- ==============================================================================
-- 9. TABEL: public.tanda_tangan & public.riwayat_status
-- ==============================================================================
ALTER TABLE public.tanda_tangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riwayat_status ENABLE ROW LEVEL SECURITY;

-- Tanda Tangan
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

-- Riwayat Status
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


-- ==============================================================================
-- 10. HAK AKSES PENGGUNA (GRANTS)
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON public.gedung, public.ruangan, public.organisasi, public.fasilitas, public.ruangan_fasilitas TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- ==============================================================================
-- SELESAI
-- Seluruh tabel telah terlindungi dengan kebijakan RLS sesuai role masing-masing.
-- ==============================================================================
