-- Verificar el estado actual de los usuarios y sus roles
SELECT 
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
FROM user_profiles
ORDER BY created_at DESC;

-- Verificar también los permisos asociados
SELECT 
  up.email,
  up.full_name,
  up.role,
  uper.can_create_events,
  uper.can_edit_events,
  uper.can_delete_events,
  uper.can_view_accounting,
  uper.can_manage_users
FROM user_profiles up
LEFT JOIN user_permissions uper ON up.id = uper.user_id
ORDER BY up.created_at DESC;