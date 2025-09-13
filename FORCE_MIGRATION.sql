-- ============================================
-- MIGRACIÓN FORZADA MANUAL - VARCHAR A JSONB
-- ============================================

-- Paso 1: Verificar estado actual
SELECT
    'Estado actual de columnas location:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name LIKE '%location%'
ORDER BY column_name;

-- Paso 2: Forzar migración manual
DO $$
BEGIN
    -- Verificar si la columna location existe como varchar/text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'location'
        AND data_type IN ('character varying', 'varchar', 'text')
    ) THEN
        RAISE NOTICE '🔄 Detectada columna location como varchar/text, iniciando migración forzada...';

        -- Paso 2a: Renombrar columna existente
        ALTER TABLE events RENAME COLUMN location TO location_backup_text;
        RAISE NOTICE '✅ Columna location renombrada a location_backup_text';

        -- Paso 2b: Crear nueva columna JSONB
        ALTER TABLE events ADD COLUMN location JSONB;
        RAISE NOTICE '✅ Nueva columna location JSONB creada';

    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'location'
        AND data_type = 'jsonb'
    ) THEN
        RAISE NOTICE '✅ La columna location ya es JSONB - no se necesita migración';

    ELSE
        RAISE NOTICE '❓ No se encontró columna location - creando nueva...';
        ALTER TABLE events ADD COLUMN location JSONB;
        RAISE NOTICE '✅ Columna location JSONB creada desde cero';
    END IF;
END $$;

-- Paso 3: Migrar datos si existe la columna backup
DO $$
DECLARE
    migrated_count INTEGER := 0;
    event_record RECORD;
BEGIN
    -- Verificar si existe la columna de backup con datos
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'location_backup_text'
    ) THEN
        RAISE NOTICE '🔄 Iniciando migración de datos de location_backup_text a location...';

        -- Migrar cada evento
        FOR event_record IN
            SELECT id, location_backup_text
            FROM events
            WHERE location_backup_text IS NOT NULL
            AND location_backup_text != ''
            AND (location IS NULL OR location = 'null'::jsonb)
        LOOP
            UPDATE events SET location = jsonb_build_object(
                'formatted_address', event_record.location_backup_text,
                'coordinates', jsonb_build_object('lat', 0, 'lng', 0),
                'address_components', jsonb_build_object(),
                'place_id', '',
                'place_types', jsonb_build_array(),
                'created_at', NOW()::text,
                'source', 'manual'
            ) WHERE id = event_record.id;

            migrated_count := migrated_count + 1;
        END LOOP;

        RAISE NOTICE '✅ Migrados % eventos de texto a JSONB', migrated_count;
    ELSE
        RAISE NOTICE 'ℹ️ No hay columna de backup - no hay datos para migrar';
    END IF;
END $$;

-- Paso 4: Verificación final
SELECT
    '=== VERIFICACIÓN FINAL ===' as titulo,
    NULL::text as column_name,
    NULL::text as data_type,
    NULL::text as estado
UNION ALL
SELECT
    'Columnas location encontradas:' as titulo,
    column_name,
    data_type,
    CASE
        WHEN data_type = 'jsonb' THEN '✅ CORRECTO'
        WHEN data_type IN ('character varying', 'varchar', 'text') THEN '❌ NECESITA MIGRACIÓN'
        ELSE '❓ DESCONOCIDO'
    END as estado
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name LIKE '%location%'
ORDER BY column_name;

-- Paso 5: Contar eventos
SELECT
    '=== RESUMEN DE DATOS ===' as info,
    COUNT(*) as total_events,
    COUNT(location) as events_with_jsonb_location,
    COUNT(location_backup_text) as events_with_backup_text
FROM events;