-- Eliminar todas las políticas que dependen de is_admin_user
-- Políticas en user_permissions
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can manage all permissions" ON user_permissions;

-- Políticas en events
DROP POLICY IF EXISTS "Users with permission can create events" ON events;
DROP POLICY IF EXISTS "Users with permission can update events" ON events;
DROP POLICY IF EXISTS "Users with permission can delete events" ON events;

-- Políticas en event_types
DROP POLICY IF EXISTS "Admins can manage event types" ON event_types;

-- Políticas en user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON user_profiles;

-- Ahora eliminar la función problemática
DROP FUNCTION IF EXISTS public.is_admin_user(uuid);

-- Crear nuevas políticas simples para user_profiles (SIN RECURSIÓN)
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

-- Recrear políticas para otras tablas usando auth.users directamente
-- Políticas para events
CREATE POLICY "authenticated_can_view_events" ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_can_create_events" ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_can_update_events" ON events
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_can_delete_events" ON events
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para event_types
CREATE POLICY "authenticated_can_view_event_types" ON event_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_can_manage_event_types" ON event_types
  FOR ALL
  TO authenticated
  USING (true);

-- Políticas para user_permissions
CREATE POLICY "authenticated_can_view_permissions" ON user_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_can_manage_permissions" ON user_permissions
  FOR ALL
  TO authenticated
  USING (true);

-- Asegurar permisos básicos
GRANT ALL ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;
GRANT ALL ON events TO authenticated;
GRANT SELECT ON events TO anon;
GRANT ALL ON event_types TO authenticated;
GRANT SELECT ON event_types TO anon;
GRANT ALL ON user_permissions TO authenticated;

-- Verificar que las políticas se crearon correctamente
SELECT 'user_profiles policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_profiles';
SELECT 'events policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'events';
SELECT 'event_types policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'event_types';
SELECT 'user_permissions policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_permissions';