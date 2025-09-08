# Corrección del Sistema de Permisos de Administrador

## Problema Identificado

Se detectó una inconsistencia en el sistema donde los usuarios con rol 'admin' tenían todos sus permisos establecidos en FALSE en la tabla `user_permissions`, lo que contradecía el comportamiento esperado donde los administradores deberían tener acceso completo al sistema.

## Análisis del Problema

### Causa Raíz
1. **Registro de Nuevos Usuarios**: La función `handle_new_user()` creaba usuarios con permisos por defecto en FALSE, independientemente del rol asignado.
2. **Falta de Sincronización**: No existía un mecanismo automático para actualizar los permisos cuando un usuario cambiaba de rol a 'admin'.
3. **Inconsistencia de Datos**: Los usuarios admin existentes mantenían permisos restrictivos a pesar de su rol elevado.

### Comportamiento Esperado vs Actual
- **Esperado**: Usuarios admin con todos los permisos en TRUE
- **Actual**: Usuarios admin con todos los permisos en FALSE
- **Impacto**: Los administradores dependían únicamente de las políticas RLS que verifican el rol, pero la tabla de permisos mostraba información incorrecta

## Solución Implementada

### 1. Corrección Inmediata (Migración 003)

#### Actualización de Permisos Existentes
```sql
UPDATE public.user_permissions 
SET 
    can_create_events = true,
    can_edit_events = true,
    can_delete_events = true,
    can_view_accounting = true,
    can_manage_users = true,
    updated_at = NOW()
WHERE user_id IN (
    SELECT id FROM public.user_profiles WHERE role = 'admin'
);
```

#### Función de Sincronización Automática
- **Función**: `sync_user_permissions()`
- **Propósito**: Sincronizar automáticamente los permisos cuando cambia el rol de un usuario
- **Comportamiento**:
  - Rol cambia a 'admin' → Todos los permisos se establecen en TRUE
  - Rol cambia de 'admin' a 'user' → Todos los permisos se establecen en FALSE

#### Trigger de Sincronización
- **Trigger**: `sync_permissions_on_role_change`
- **Activación**: AFTER UPDATE OF role ON public.user_profiles
- **Función**: Ejecuta `sync_user_permissions()` automáticamente

### 2. Mejora del Registro de Usuarios

#### Función Actualizada: `handle_new_user()`
- Mantiene la lógica existente para usuarios regulares
- Preparada para asignar permisos completos si se registra un admin
- Establece permisos basados en el rol asignado durante el registro

### 3. Función de Mantenimiento

#### `fix_admin_permissions()`
- **Propósito**: Corregir manualmente cualquier inconsistencia
- **Uso**: Puede ejecutarse cuando sea necesario para mantener la coherencia
- **Funcionalidad**:
  - Actualiza todos los admin a permisos completos
  - Actualiza todos los usuarios regulares a permisos restrictivos

## Verificación y Pruebas

### Script de Prueba (Migración 004)

Se creó un sistema de pruebas automatizado que verifica:

1. **Permisos de Admin**: Confirma que todos los usuarios admin tienen permisos completos
2. **Permisos de Usuario Regular**: Verifica que los usuarios regulares tienen permisos restrictivos
3. **Existencia de Funciones**: Confirma que las funciones de sincronización existen
4. **Activación de Triggers**: Verifica que los triggers están activos

### Consultas de Verificación

```sql
-- Verificar permisos de administradores
SELECT prof.email, prof.role, perm.*
FROM public.user_profiles prof
JOIN public.user_permissions perm ON prof.id = perm.user_id
WHERE prof.role = 'admin';

-- Ejecutar pruebas automáticas
SELECT * FROM public.test_admin_permissions_sync();
```

## Beneficios de la Solución

### 1. Consistencia de Datos
- Los permisos en la base de datos ahora reflejan correctamente el rol del usuario
- Eliminación de discrepancias entre rol y permisos

### 2. Automatización
- Los cambios de rol se sincronizan automáticamente con los permisos
- No se requiere intervención manual para mantener la coherencia

### 3. Mantenibilidad
- Sistema de pruebas automatizado para verificar la integridad
- Función de corrección manual disponible para casos excepcionales

### 4. Transparencia
- Los permisos son visibles y verificables en la base de datos
- Facilita la auditoría y el debugging

## Funcionamiento del Sistema

### Flujo Normal
1. **Registro de Usuario**: Se crea con rol 'user' y permisos restrictivos
2. **Cambio a Admin**: Al actualizar el rol a 'admin', el trigger actualiza automáticamente todos los permisos a TRUE
3. **Cambio a Usuario**: Al cambiar de 'admin' a 'user', todos los permisos se establecen en FALSE

### Casos Especiales
- **Usuarios Existentes**: Corregidos mediante la migración inicial
- **Inconsistencias Futuras**: Pueden corregirse ejecutando `fix_admin_permissions()`

## Archivos Modificados

1. **003_fix_admin_permissions.sql**: Migración principal con correcciones y nuevas funciones
2. **004_test_admin_permissions.sql**: Sistema de pruebas y verificación
3. **admin_permissions_fix.md**: Este documento de documentación

## Conclusión

La implementación resuelve completamente el problema de inconsistencia entre roles y permisos, estableciendo un sistema robusto y automático que mantiene la coherencia de datos y facilita la administración del sistema de permisos.