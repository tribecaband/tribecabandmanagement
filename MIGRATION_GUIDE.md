# 🚀 Guía de Migración - Ubicaciones con Google Places

## 📋 Instrucciones Paso a Paso

### 🎯 Paso 1: Acceder a Supabase Dashboard
1. Ve a **https://supabase.com/dashboard**
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto **TriBeCa**
4. En el menú lateral, haz clic en **"SQL Editor"**

### 🛠️ Paso 2: Ejecutar la Migración Principal

⚠️ **Si tienes el error de sintaxis, usa la Migración Simplificada más abajo**

**Opción A - Migración Completa (copia y pega este SQL):**

```sql
-- ============================================
-- MIGRACIÓN DE UBICACIONES - TRIBECA
-- ============================================

-- Paso 1: Migrar campo location de TEXT a JSONB
DO $$
BEGIN
    -- Verificar si la columna location existe como TEXT
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'location'
        AND data_type = 'text'
    ) THEN
        -- Hacer backup de la columna existente
        ALTER TABLE events RENAME COLUMN location TO location_backup_text;
        RAISE NOTICE '✅ Backup creado: location_backup_text';

        -- Añadir nueva columna JSONB
        ALTER TABLE events ADD COLUMN location JSONB;
        RAISE NOTICE '✅ Nueva columna location JSONB creada';

    ELSIF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'location'
    ) THEN
        -- Crear columna JSONB si no existe
        ALTER TABLE events ADD COLUMN location JSONB;
        RAISE NOTICE '✅ Columna location JSONB creada';
    ELSE
        RAISE NOTICE '✅ Columna location ya existe como JSONB';
    END IF;
END $$;

-- Paso 2: Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_events_location_formatted_address
ON events USING GIN ((location->>'formatted_address') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_events_location_coordinates
ON events USING GIST (
    (POINT(
        ((location->'coordinates'->>'lng')::numeric),
        ((location->'coordinates'->>'lat')::numeric)
    ))
);

-- Paso 3: Función para migrar datos existentes
CREATE OR REPLACE FUNCTION migrate_text_locations_to_jsonb()
RETURNS INTEGER AS $$
DECLARE
    migrated_count INTEGER := 0;
    event_record RECORD;
BEGIN
    -- Solo proceder si existe la columna de backup
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'location_backup_text'
    ) THEN
        -- Migrar eventos que tienen texto pero no JSONB
        FOR event_record IN
            SELECT id, location_backup_text
            FROM events
            WHERE location_backup_text IS NOT NULL
            AND location_backup_text != ''
            AND location IS NULL
        LOOP
            -- Crear estructura LocationData básica desde el texto
            UPDATE events
            SET location = jsonb_build_object(
                'formatted_address', event_record.location_backup_text,
                'coordinates', jsonb_build_object('lat', 0, 'lng', 0),
                'address_components', '{}'::jsonb,
                'place_id', '',
                'place_types', '[]'::jsonb,
                'created_at', NOW()::text,
                'source', 'manual'
            )
            WHERE id = event_record.id;

            migrated_count := migrated_count + 1;
        END LOOP;

        RAISE NOTICE '✅ Migrados % eventos de texto a JSONB', migrated_count;
    ELSE
        RAISE NOTICE 'ℹ️  No hay datos antiguos para migrar';
    END IF;

    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la migración de datos automáticamente
SELECT migrate_text_locations_to_jsonb() as eventos_migrados;
```

---

### 🔧 **Opción B - Migración Simplificada (si hay errores)**

Si la migración anterior da errores de sintaxis, usa esta versión simplificada:

```sql
-- ============================================
-- MIGRACIÓN SIMPLE DE UBICACIONES - TRIBECA
-- ============================================

-- Paso 1: Migrar campo location de TEXT a JSONB
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'location' AND data_type = 'text'
    ) THEN
        ALTER TABLE events RENAME COLUMN location TO location_backup_text;
        ALTER TABLE events ADD COLUMN location JSONB;
        RAISE NOTICE '✅ Migración TEXT a JSONB completada';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'location'
    ) THEN
        ALTER TABLE events ADD COLUMN location JSONB;
        RAISE NOTICE '✅ Columna location JSONB creada';
    ELSE
        RAISE NOTICE '✅ Columna location ya existe';
    END IF;
END $$;

-- Paso 2: Crear índice básico
CREATE INDEX IF NOT EXISTS idx_events_location_address
ON events ((location->>'formatted_address'));

-- Paso 3: Función de migración
CREATE OR REPLACE FUNCTION migrate_text_locations_to_jsonb()
RETURNS INTEGER AS $$
DECLARE
    migrated_count INTEGER := 0;
    event_record RECORD;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'location_backup_text'
    ) THEN
        FOR event_record IN
            SELECT id, location_backup_text FROM events
            WHERE location_backup_text IS NOT NULL
            AND location_backup_text != ''
            AND location IS NULL
        LOOP
            UPDATE events SET location = jsonb_build_object(
                'formatted_address', event_record.location_backup_text,
                'coordinates', jsonb_build_object('lat', 0, 'lng', 0),
                'address_components', '{}'::jsonb,
                'place_id', '',
                'place_types', '[]'::jsonb,
                'created_at', NOW()::text,
                'source', 'manual'
            ) WHERE id = event_record.id;
            migrated_count := migrated_count + 1;
        END LOOP;
        RAISE NOTICE '✅ Migrados % eventos', migrated_count;
    END IF;
    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Paso 4: Ejecutar migración
SELECT migrate_text_locations_to_jsonb() as eventos_migrados;
```

### ▶️ Paso 3: Ejecutar el SQL
1. **Pega el código SQL** en el editor
2. Haz clic en **"Run"** o presiona **Ctrl+Enter**
3. **Verifica los mensajes** en la parte inferior:
   - ✅ Deberías ver mensajes como "Backup creado", "Nueva columna creada", etc.
   - 📊 Al final verás cuántos eventos se migraron

### 🔍 Paso 4: Verificar la Migración

**Ejecuta esta consulta para verificar:**

```sql
-- Verificar el estado de la migración
SELECT
    COUNT(*) as total_events,
    COUNT(location) as events_with_location,
    COUNT(location_backup_text) as events_with_backup,
    pg_typeof(location) as location_type
FROM events
GROUP BY pg_typeof(location);
```

### 🎉 Paso 5: ¡Listo!

Si todo salió bien, deberías ver:
- ✅ **total_events**: Número total de eventos
- ✅ **events_with_location**: Eventos con nueva estructura JSON
- ✅ **location_type**: Debería ser `jsonb`

## 🚨 ¿Algo salió mal?

### Si tienes errores de permisos:
```sql
-- Verificar permisos en la tabla events
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'events';
```

### Si la tabla events no existe:
La tabla debe crearse primero. Revisa tu configuración inicial de Supabase.

### Para revertir los cambios (si es necesario):
```sql
-- SOLO SI NECESITAS REVERTIR
DROP INDEX IF EXISTS idx_events_location_formatted_address;
DROP INDEX IF EXISTS idx_events_location_coordinates;
ALTER TABLE events DROP COLUMN IF EXISTS location;
ALTER TABLE events RENAME COLUMN location_backup_text TO location;
```

## 📋 Checklist Final

- [ ] ✅ Migración SQL ejecutada sin errores
- [ ] 📊 Consulta de verificación muestra datos correctos
- [ ] 🚀 La aplicación carga sin errores
- [ ] 📍 Puedes crear eventos con ubicaciones
- [ ] 🗺️  Al hacer clic en ubicaciones se abre Google Maps

## 🎯 ¿Necesitas ayuda?

Si encuentras algún problema:
1. 📷 Haz screenshot del error
2. 💬 Comparte el mensaje de error exacto
3. 🔍 Ejecuta la consulta de verificación y comparte el resultado

¡La migración debería tomar menos de 1 minuto! 🚀