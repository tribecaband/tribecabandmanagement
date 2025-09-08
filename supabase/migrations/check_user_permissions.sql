-- Consulta para verificar permisos de usuarios
SELECT 
    up.user_id,
    p.email,
    p.role,
    up.can_create_events,
    up.can_edit_events,
    up.can_delete_events,
    up.can_view_accounting,
    up.can_manage_users,
    up.updated_at
FROM user_permissions up
JOIN user_profiles p ON up.user_id = p.id
ORDER BY p.email;

-- Verificar usuarios sin permisos definidos
SELECT 
    p.id as user_id,
    p.email,
    p.role,
    'NO PERMISSIONS DEFINED' as status
FROM user_profiles p
LEFT JOIN user_permissions up ON p.id = up.user_id
WHERE up.user_id IS NULL;

-- Contar usuarios por estado de can_create_events
SELECT 
    can_create_events,
    COUNT(*) as user_count
FROM user_permissions
GROUP BY can_create_events;