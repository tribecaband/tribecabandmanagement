-- ============================================
-- MIGRACIÓN ULTRA SIMPLE - SIN ERRORES
-- ============================================

-- Paso 1: Solo crear la columna JSONB
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
        RAISE NOTICE '✅ Columna location ya existe como JSONB';
    END IF;
END $$;

-- Paso 2: Función de migración (SIN ÍNDICES POR AHORA)
CREATE OR REPLACE FUNCTION migrate_text_locations_to_jsonb()
RETURNS INTEGER AS $$
DECLARE
    migrated_count INTEGER := 0;
    event_record RECORD;
BEGIN
    -- Solo proceder si existe la columna de backup
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'location_backup_text'
    ) THEN
        -- Migrar eventos que tienen texto pero no JSONB
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
        RAISE NOTICE '✅ Migrados % eventos de texto a JSONB', migrated_count;
    ELSE
        RAISE NOTICE 'ℹ️ No hay datos antiguos para migrar';
    END IF;
    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Paso 3: Ejecutar migración de datos
SELECT migrate_text_locations_to_jsonb() as eventos_migrados;

-- Paso 4: Verificar resultado
SELECT
    'Migración completada' as status,
    COUNT(*) as total_events,
    COUNT(location) as events_with_jsonb_location,
    COUNT(location_backup_text) as events_with_backup
FROM events;