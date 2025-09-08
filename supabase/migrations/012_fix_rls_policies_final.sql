-- Eliminar TODAS las políticas existentes en user_profiles para evitar conflictos
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON user_profiles;

-- Eliminar función anterior si existe
DROP FUNCTION IF EXISTS public.is_admin_user(uuid);

-- Crear función simple para verificar admin sin recursión
CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM auth.users WHERE id = user_id LIMIT 1),
    'user'
  );
$$;

-- Crear políticas simples sin recursión
CREATE POLICY "allow_own_profile_select" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "allow_own_profile_update" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "allow_profile_insert" ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política especial para admin (usando auth.users directamente)
CREATE POLICY "admin_full_access" ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Asegurar permisos básicos
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- Verificar que las políticas se crearon correctamente
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_profiles';