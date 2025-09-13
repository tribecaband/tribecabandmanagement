-- ============================================
-- MIGRACIÓN SIMPLE DE UBICACIONES - TRIBECA
-- ============================================
-- Versión simplificada sin índices complejos

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

-- Paso 2: Crear índice básico para búsquedas de texto
-- (Solo si la extensión pg_trgm está disponible)
DO $$
BEGIN
    -- Intentar crear el índice GIN para búsquedas de texto
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_events_location_address ON events USING GIN ((location->>''formatted_address'') gin_trgm_ops)';
        RAISE NOTICE '✅ Índice de búsqueda de texto creado';
    ELSE
        -- Crear índice básico sin pg_trgm
        CREATE INDEX IF NOT EXISTS idx_events_location_address ON events ((location->>'formatted_address'));
        RAISE NOTICE '✅ Índice básico de dirección creado';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ No se pudo crear índice de búsqueda: %', SQLERRM;
END $$;

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
        RAISE NOTICE 'ℹ️ No hay datos antiguos para migrar';
    END IF;

    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Paso 4: Ejecutar la migración de datos automáticamente
SELECT migrate_text_locations_to_jsonb() as eventos_migrados;

-- Mostrar resumen final
SELECT
    'Migración completada' as status,
    COUNT(*) as total_events,
    COUNT(location) as events_with_jsonb_location,
    COUNT(location_backup_text) as events_with_backup
FROM events;