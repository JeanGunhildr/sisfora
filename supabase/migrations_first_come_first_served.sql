-- ==============================================================================
-- SISFORA - MIGRATION: MEKANISME FIRST COME, FIRST SERVED & ANTI RACE CONDITION
-- ==============================================================================
-- File: supabase/migrations_first_come_first_served.sql
-- Tujuan:
-- 1. Menghapus tabel dan tipe penahanan_jadwal (konsep penahanan jadwal dibatalkan).
-- 2. Mengaktifkan ekstensi btree_gist untuk mendukung exclusion constraint & range overlap.
-- 3. Memasang trigger fungsi anti-race condition dengan PostgreSQL Advisory Lock
--    untuk menjamin tidak ada 2 pengguna yang dapat membuking ruangan di jadwal bertabrakan.
-- 4. Memasang Partial Exclusion Constraint pada tabel public.pengajuan.
-- 5. Menambahkan fungsi helper RPC 'cek_ketersediaan_ruangan' untuk verifikasi live.
-- 6. Menyesuaikan kebijakan RLS tabel public.pengajuan.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HAPUS TABEL & TIPE PENAHANAN JADWAL (KONSEP RESMI DIBATALKAN)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.penahanan_jadwal CASCADE;
DROP TYPE IF EXISTS public.status_penahanan CASCADE;

-- ------------------------------------------------------------------------------
-- 2. AKTIFKAN EKSTENSI BTREE_GIST
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ------------------------------------------------------------------------------
-- 3. FUNGSI TRIGGER: CEK BENTROK JADWAL RUANGAN DENGAN ADVISORY LOCK (ANTI RACE CONDITION)
-- ------------------------------------------------------------------------------
-- Fungsi ini menjamin transaksi serial per ruangan menggunakan pg_advisory_xact_lock.
-- Dua pengguna yang menekan tombol submit pada milidetik yang sama akan diproses
-- secara berurutan: pengguna pertama berhasil mengamankan jadwal, sedangkan
-- pengguna kedua langsung ditolak dengan pesan error yang ramah dan jelas.
--
-- Status yang dianggap aktif membuking jadwal:
--   'menunggu_upload', 'menunggu_ketua', 'menunggu_wd3', 'disetujui'
-- Status yang membebaskan slot jadwal (dapat dibuking kembali):
--   'ditolak_ketua', 'ditolak_wd3', 'ditolak', 'dibatalkan', 'kedaluwarsa'
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_jadwal_ruangan_bentrok()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Cek hanya dilakukan jika status pengajuan merupakan status aktif
  IF NEW.status NOT IN ('ditolak_ketua', 'ditolak_wd3', 'ditolak', 'dibatalkan', 'kedaluwarsa') THEN
    
    -- 2. Kunci transaksi advisory berbasis ID ruangan
    -- Lock otomatis dilepas saat transaksi COMMIT atau ROLLBACK
    PERFORM pg_advisory_xact_lock(hashtext('ruangan_lock_' || NEW.ruangan_id::text));

    -- 3. Cek apakah ada permohonan lain yang jadwalnya bertabrakan (OVERLAPS)
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

-- ------------------------------------------------------------------------------
-- 4. PASANG TRIGGER PADA TABEL public.pengajuan
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_check_jadwal_ruangan_bentrok ON public.pengajuan;
CREATE TRIGGER trg_check_jadwal_ruangan_bentrok
  BEFORE INSERT OR UPDATE OF ruangan_id, tanggal_mulai, tanggal_selesai, status
  ON public.pengajuan
  FOR EACH ROW
  EXECUTE FUNCTION public.check_jadwal_ruangan_bentrok();

-- ------------------------------------------------------------------------------
-- 5. PARTIAL EXCLUSION CONSTRAINT PADA TABEL public.pengajuan (LAPISAN PERTAHANAN KEDUA)
-- ------------------------------------------------------------------------------
ALTER TABLE public.pengajuan DROP CONSTRAINT IF EXISTS no_overlapping_ruangan_schedule;
ALTER TABLE public.pengajuan
  ADD CONSTRAINT no_overlapping_ruangan_schedule
  EXCLUDE USING gist (
    ruangan_id WITH =,
    tstzrange(tanggal_mulai, tanggal_selesai) WITH &&
  )
  WHERE (status NOT IN ('ditolak_ketua', 'ditolak_wd3', 'ditolak', 'dibatalkan', 'kedaluwarsa'));

-- ------------------------------------------------------------------------------
-- 6. FUNGSI HELPER RPC: CEK KETERSEDIAAN JADWAL SECARA LIVE (DIPANGGIL FRONTEND)
-- ------------------------------------------------------------------------------
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

-- Berikan izin eksekusi ke peran authenticated dan anon
GRANT EXECUTE ON FUNCTION public.cek_ketersediaan_ruangan TO authenticated, anon;

-- ------------------------------------------------------------------------------
-- 7. AUDIT & UPDATE KEBIJAKAN RLS PADA TABEL public.pengajuan
-- ------------------------------------------------------------------------------
-- Memastikan mahasiswa terautentikasi dapat melihat jadwal peminjaman yang aktif
-- agar dapat memeriksa ketersediaan ruangan sebelum mengajukan
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

-- ------------------------------------------------------------------------------
-- SELESAI
-- ------------------------------------------------------------------------------
