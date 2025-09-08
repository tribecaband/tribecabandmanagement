-- Debug: Verificar el estado actual del perfil del usuario
-- Mostrar todos los usuarios y sus roles
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.created_at,
    up.updated_at,
    au.email as auth_email,
    au.created_at as auth_created_at
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at DESC;

-- Verificar permisos del usuario
SELECT 
    up.id,
    up.email,
    up.role,
    uper.can_create_events,
    uper.can_edit_events,
    uper.can_delete_events,
    uper.can_view_accounting,
    uper.can_manage_users
FROM user_profiles up
LEFT JOIN user_permissions uper ON up.id = uper.user_id
ORDER BY up.created_at DESC;

-- Verificar si hay algún problema con las políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_permissions');

-- Mostrar información de la sesión actual
SELECT 
    current_user as current_db_user,
    session_user,
    current_setting('request.jwt.claims', true) as jwt_claims;