-- ==============================================================================
-- UPDATE RLS & FUNGSI HELPER ADMIN SISFORA
-- Mencegah Infinite Recursion pada public.users dan Mengizinkan Admin CRUD
-- ==============================================================================

-- 1. FUNGSI HELPER: is_admin() (SECURITY DEFINER)
-- Menghindari infinite recursion saat pengecekan RLS
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

-- 2. HAK AKSES PADA public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Pengguna biasa dapat membaca profil mereka sendiri
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- Admin dapat membaca seluruh data user
DROP POLICY IF EXISTS "Admin can read all users" ON public.users;
CREATE POLICY "Admin can read all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admin dapat memperbarui status verifikasi dan profil user
DROP POLICY IF EXISTS "Admin can update any user" ON public.users;
CREATE POLICY "Admin can update any user"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin dapat menghapus user jika diperlukan (misal akun spam)
DROP POLICY IF EXISTS "Admin can delete any user" ON public.users;
CREATE POLICY "Admin can delete any user"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- User dapat mengupdate profil miliknya sendiri
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Izinkan registrasi akun baru (INSERT)
DROP POLICY IF EXISTS "Allow user insert on signup" ON public.users;
CREATE POLICY "Allow user insert on signup"
  ON public.users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Berikan hak akses eksplisit ke role authenticated dan service_role
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.users TO authenticated, anon, service_role;
