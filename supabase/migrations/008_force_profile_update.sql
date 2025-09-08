-- Forzar actualización del perfil del usuario para resolver problemas de sesión
-- Actualizar el timestamp updated_at para forzar una recarga
UPDATE user_profiles 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'pablo.mc@gmail.com';

-- Asegurar que los permisos estén correctos
UPDATE user_permissions 
SET 
    can_create_events = TRUE,
    can_edit_events = TRUE,
    can_delete_events = TRUE,
    can_view_accounting = TRUE,
    can_manage_users = TRUE,
    updated_at = NOW()
WHERE user_id = (
    SELECT id FROM user_profiles WHERE email = 'pablo.mc@gmail.com'
);

-- Verificar el resultado
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.updated_at,
    uper.can_create_events,
    uper.can_edit_events,
    uper.can_delete_events,
    uper.can_view_accounting,
    uper.can_manage_users
FROM user_profiles up
LEFT JOIN user_permissions uper ON up.id = uper.user_id
WHERE up.email = 'pablo.mc@gmail.com';