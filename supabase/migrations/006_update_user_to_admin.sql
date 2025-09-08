-- Actualizar el rol del usuario a admin
-- Esta migración actualiza el primer usuario registrado a rol admin
-- y asegura que sus permisos estén correctamente establecidos

DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Obtener el primer usuario (el más antiguo)
    SELECT id, email, full_name, role INTO user_record
    FROM user_profiles
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF user_record.id IS NOT NULL THEN
        -- Actualizar el rol a admin
        UPDATE user_profiles 
        SET role = 'admin', updated_at = NOW()
        WHERE id = user_record.id;
        
        -- Asegurar que todos los permisos estén en TRUE para admin
        UPDATE user_permissions 
        SET 
            can_create_events = TRUE,
            can_edit_events = TRUE,
            can_delete_events = TRUE,
            can_view_accounting = TRUE,
            can_manage_users = TRUE,
            updated_at = NOW()
        WHERE user_id = user_record.id;
        
        RAISE NOTICE 'Usuario % (%) actualizado a rol admin con permisos completos', user_record.full_name, user_record.email;
    ELSE
        RAISE NOTICE 'No se encontraron usuarios para actualizar';
    END IF;
END $$;

-- Verificar el resultado
SELECT 
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
WHERE up.role = 'admin'
ORDER BY up.created_at ASC;