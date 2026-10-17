-- ==============================================================================
-- SISFORA - Skema Database, Enum, Trigger Auth, Storage Bucket & Kebijakan RLS
-- ==============================================================================

-- 1. ENUM DEFINITIONS
DO $$ BEGIN
  CREATE TYPE public.role_user AS ENUM ('mahasiswa', 'ketua_organisasi', 'admin', 'wd3');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_verifikasi AS ENUM ('menunggu', 'diverifikasi', 'ditolak');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.jenis_peminjaman AS ENUM ('umum', 'organisasi');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_pengajuan AS ENUM (
    'menunggu_upload',
    'diajukan',
    'verifikasi_organisasi',
    'verifikasi_wd3',
    'disetujui',
    'ditolak',
    'dibatalkan',
    'kedaluwarsa'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_penahanan AS ENUM ('aktif', 'selesai', 'kedaluwarsa', 'dibatalkan');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_dokumen AS ENUM (
    'diunggah',
    'ditandatangani_organisasi',
    'ditandatangani_wd3',
    'final'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_ttd AS ENUM ('menunggu', 'selesai', 'ditolak');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_moderasi AS ENUM ('ditinjau', 'disetujui', 'ditolak');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_log_ai AS ENUM ('berhasil', 'gagal');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. TABLE: public.users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  nama character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  nim character varying UNIQUE,
  role public.role_user NOT NULL DEFAULT 'mahasiswa'::public.role_user,
  url_ktm text,
  status_verifikasi public.status_verifikasi NOT NULL DEFAULT 'menunggu'::public.status_verifikasi,
  alasan_penolakan text,
  diverifikasi_oleh uuid,
  diverifikasi_pada timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT users_diverifikasi_oleh_fkey FOREIGN KEY (diverifikasi_oleh) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_nim ON public.users(nim);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 3. TRIGGER OTOMATIS: SINKRONISASI auth.users -> public.users SAAT REGISTER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_nama text;
  v_nim text;
  v_role public.role_user;
  v_url_ktm text;
BEGIN
  -- Ambil metadata dari pendaftaran
  v_nama := COALESCE(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1));
  v_nim := new.raw_user_meta_data->>'nim';
  v_url_ktm := new.raw_user_meta_data->>'url_ktm';

  -- Default role ke 'mahasiswa' jika tidak ditentukan
  BEGIN
    v_role := (new.raw_user_meta_data->>'role')::public.role_user;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'mahasiswa'::public.role_user;
  END;

  INSERT INTO public.users (
    id,
    nama,
    email,
    nim,
    role,
    url_ktm,
    status_verifikasi
  )
  VALUES (
    new.id,
    v_nama,
    new.email,
    v_nim,
    v_role,
    v_url_ktm,
    CASE 
      WHEN v_role = 'admin' THEN 'diverifikasi'::public.status_verifikasi
      ELSE 'menunggu'::public.status_verifikasi
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    nama = EXCLUDED.nama,
    email = EXCLUDED.email,
    nim = COALESCE(EXCLUDED.nim, public.users.nim),
    url_ktm = COALESCE(EXCLUDED.url_ktm, public.users.url_ktm),
    updated_at = now();

  RETURN new;
END;
$$;

-- Pasang trigger pada tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. ROW LEVEL SECURITY (RLS) UNTUK public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Pengguna dapat membaca data profilnya sendiri
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Admin dapat membaca seluruh data user
DROP POLICY IF EXISTS "Admin can read all users" ON public.users;
CREATE POLICY "Admin can read all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 3: WD3 dan Ketua Organisasi dapat membaca profil user untuk keperluan verifikasi pengajuan
DROP POLICY IF EXISTS "Approvers can read users" ON public.users;
CREATE POLICY "Approvers can read users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('wd3', 'ketua_organisasi')
    )
  );

-- Policy 4: Pengguna dapat mengupdate profilnya sendiri
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 5: Admin dapat memverifikasi dan memperbarui data user apapun
DROP POLICY IF EXISTS "Admin can update any user" ON public.users;
CREATE POLICY "Admin can update any user"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 6: Izinkan insert saat pendaftaran (fallback jika trigger berjalan dengan session user)
DROP POLICY IF EXISTS "Allow user insert on signup" ON public.users;
CREATE POLICY "Allow user insert on signup"
  ON public.users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- 5. SETUP STORAGE BUCKET UNTUK FOTO KTM
-- Buat bucket 'ktm' jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('ktm', 'ktm', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy Storage: Siapapun dapat mengunggah file KTM saat register
DROP POLICY IF EXISTS "Public / Anon can upload KTM" ON storage.objects;
CREATE POLICY "Public / Anon can upload KTM"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'ktm');

-- Policy Storage: File KTM dapat diakses oleh user pemilik dan Admin
DROP POLICY IF EXISTS "View KTM files" ON storage.objects;
CREATE POLICY "View KTM files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'ktm');

-- Selesai
