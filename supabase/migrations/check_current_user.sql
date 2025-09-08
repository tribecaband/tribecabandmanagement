-- Verificar el usuario actual y su rol
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.created_at,
    up.updated_at,
    -- Verificar permisos
    uperm.can_create_events,
    uperm.can_edit_events,
    uperm.can_delete_events,
    uperm.can_manage_users
FROM user_profiles up
LEFT JOIN user_permissions uperm ON up.id = uperm.user_id
ORDER BY up.created_at DESC
LIMIT 5;

-- Verificar específicamente usuarios con rol admin
SELECT 
    'ADMIN USERS:' as info,
    up.email,
    up.full_name,
    up.role
FROM user_profiles up
WHERE up.role = 'admin';

-- Verificar el usuario más reciente
SELECT 
    'MOST RECENT USER:' as info,
    up.email,
    up.full_name,
    up.role,
    up.updated_at
FROM user_profiles up
ORDER BY up.updated_at DESC
LIMIT 1;