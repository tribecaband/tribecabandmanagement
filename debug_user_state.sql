-- Consulta para verificar el estado actual del usuario
-- Primero verificamos todos los usuarios en user_profiles
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.role,
  up.created_at,
  up.updated_at
FROM user_profiles up
ORDER BY up.created_at DESC;

-- Verificamos los permisos de cada usuario
SELECT 
  up.email,
  up.full_name,
  up.role,
  perm.can_create_events,
  perm.can_edit_events,
  perm.can_delete_events,
  perm.can_view_accounting,
  perm.can_manage_users,
  perm.updated_at as permissions_updated_at
FROM user_profiles up
LEFT JOIN user_permissions perm ON up.id = perm.user_id
ORDER BY up.created_at DESC;

-- Verificamos si hay usuarios sin permisos asignados
SELECT 
  up.email,
  up.full_name,
  up.role
FROM user_profiles up
LEFT JOIN user_permissions perm ON up.id = perm.user_id
WHERE perm.user_id IS NULL;

-- Verificamos usuarios con rol admin que no tienen todos los permisos
SELECT 
  up.email,
  up.full_name,
  up.role,
  perm.can_create_events,
  perm.can_edit_events,
  perm.can_delete_events,
  perm.can_view_accounting,
  perm.can_manage_users
FROM user_profiles up
LEFT JOIN user_permissions perm ON up.id = perm.user_id
WHERE up.role = 'admin'
AND (
  perm.can_create_events = false OR
  perm.can_edit_events = false OR
  perm.can_delete_events = false OR
  perm.can_view_accounting = false OR
  perm.can_manage_users = false OR
  perm.user_id IS NULL
);