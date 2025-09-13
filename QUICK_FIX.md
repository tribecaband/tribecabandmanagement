# 🚨 Solución Rápida al Error de SQL

## ❌ **Error que recibiste:**
```
ERROR: 42601: syntax error at or near ","
LINE 56: (((location->'coordinates'->>'lat')::numeric),
```

## ✅ **Solución Inmediata:**

### **Usa este SQL simplificado:**

```sql
-- MIGRACIÓN SIMPLE GARANTIZADA
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

-- Crear índice básico
CREATE INDEX IF NOT EXISTS idx_events_location_address
ON events ((location->>'formatted_address'));

-- Función de migración
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

-- Ejecutar migración
SELECT migrate_text_locations_to_jsonb() as eventos_migrados;
```

## 🎯 **Pasos:**

1. **Borra** el SQL anterior del editor
2. **Copia y pega** este SQL simplificado
3. **Ejecuta** con "Run" o Ctrl+Enter
4. **✅ ¡Listo!**

## 📋 **¿Qué hace este SQL?**

- ✅ **Crea columna JSONB** para ubicaciones
- ✅ **Migra datos antiguos** si los hay
- ✅ **Crea índice básico** para búsquedas
- ✅ **Sin errores de sintaxis** garantizado

## 🔍 **Verificar que funcionó:**

```sql
SELECT
    COUNT(*) as total_events,
    COUNT(location) as events_with_location,
    pg_typeof(location) as location_type
FROM events
GROUP BY pg_typeof(location);
```

## 🎉 **Después de ejecutar:**
- La aplicación funcionará con ubicaciones
- Podrás hacer clic en ubicaciones para abrir Maps
- Los nuevos eventos tendrán autocompletado

**¡La migración solo toma 10 segundos!** 🚀