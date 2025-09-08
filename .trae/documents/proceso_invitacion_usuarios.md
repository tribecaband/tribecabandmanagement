# Proceso de Invitación de Usuarios

## Descripción General

El sistema de invitación permite a los administradores crear nuevos usuarios sin que estos tengan acceso directo al registro público. Los usuarios reciben un correo de invitación que les permite establecer su contraseña y acceder al sistema.

## Flujo Completo de Invitación

### 1. Administrador Envía Invitación

**Ubicación:** Panel de Administración → Botón "Invitar Usuario"

**Campos Requeridos:**
- Email del usuario
- Nombre completo
- Rol (user, manager, admin)
- Permisos específicos

**Proceso:**
1. El administrador completa el formulario de invitación
2. El sistema envía la invitación usando `supabase.auth.admin.inviteUserByEmail()`
3. Se incluyen los metadatos del usuario (nombre, rol, permisos) en la invitación
4. El sistema redirige al usuario invitado a `/auth/callback`

### 2. Usuario Recibe y Acepta Invitación

**Email de Invitación:**
- Contiene un enlace único con tokens de acceso
- El enlace incluye `type=invite` para identificar el tipo de callback
- Redirige a: `http://localhost:5173/auth/callback?access_token=...&refresh_token=...&type=invite`

### 3. Establecimiento de Contraseña

**Página:** `/auth/callback`

**Proceso:**
1. El sistema detecta `type=invite` en los parámetros URL
2. Establece la sesión usando los tokens de la invitación
3. Muestra el formulario de establecimiento de contraseña
4. El usuario ingresa y confirma su nueva contraseña
5. Se actualiza la contraseña usando `supabase.auth.updateUser()`
6. Redirige automáticamente a la aplicación principal

### 4. Creación Automática del Perfil

**Trigger de Base de Datos:** `handle_new_user_invitation()`

**Proceso:**
1. Se ejecuta automáticamente cuando el usuario acepta la invitación
2. Crea el perfil en `user_profiles` con los datos de la invitación
3. Asigna permisos por defecto según el rol
4. El usuario queda listo para usar el sistema

## Características de Seguridad

### Tokens Seguros
- Los enlaces de invitación contienen tokens únicos y temporales
- Los tokens expiran automáticamente
- No se pueden reutilizar

### Validación de Contraseña
- Mínimo 6 caracteres
- Confirmación requerida
- Validación en tiempo real

### Permisos por Defecto
- **Usuario:** Solo lectura de eventos
- **Manager:** Gestión de eventos
- **Admin:** Acceso completo

## Solución de Problemas

### Usuario No Recibe Email
1. Verificar que el email sea válido
2. Revisar carpeta de spam
3. Confirmar configuración SMTP de Supabase

### Error al Establecer Contraseña
1. Verificar que los tokens no hayan expirado
2. Asegurar que la contraseña cumpla los requisitos
3. Revisar logs del servidor para errores específicos

### Usuario No Puede Iniciar Sesión
1. Confirmar que completó el proceso de establecimiento de contraseña
2. Verificar que el perfil se creó correctamente en la base de datos
3. Revisar permisos y estado activo del usuario

## Comandos Útiles para Debugging

```sql
-- Verificar usuarios invitados
SELECT * FROM auth.users WHERE email_confirmed_at IS NOT NULL;

-- Verificar perfiles creados
SELECT * FROM public.user_profiles ORDER BY created_at DESC;

-- Verificar permisos de usuario
SELECT up.email, up.role, up.is_active, upe.* 
FROM user_profiles up 
LEFT JOIN user_permissions upe ON up.id = upe.user_id;
```

## Notas Importantes

- **No hay registro público:** Los usuarios solo pueden acceder mediante invitación
- **Contraseña obligatoria:** Todos los usuarios deben establecer una contraseña
- **Sesión automática:** Después de establecer la contraseña, el usuario queda logueado
- **Rol inmutable:** El rol se asigna durante la invitación y requiere admin para cambiar
