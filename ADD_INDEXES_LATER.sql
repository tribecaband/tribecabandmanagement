-- ============================================
-- AÑADIR ÍNDICES DESPUÉS (EJECUTAR SOLO SI LA MIGRACIÓN ANTERIOR FUNCIONÓ)
-- ============================================

-- Primero verificar que la columna location existe como JSONB
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'location'
        AND data_type = 'jsonb'
    ) THEN
        RAISE NOTICE '✅ Columna location JSONB confirmada, procediendo con índices';

        -- Intentar crear índice básico sin extensiones
        BEGIN
            CREATE INDEX IF NOT EXISTS idx_events_location_basic
            ON events ((location->>'formatted_address'));
            RAISE NOTICE '✅ Índice básico creado';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️ No se pudo crear índice básico: %', SQLERRM;
        END;

        -- Intentar habilitar pg_trgm y crear índice avanzado
        BEGIN
            CREATE EXTENSION IF NOT EXISTS pg_trgm;
            RAISE NOTICE '✅ Extensión pg_trgm habilitada';

            CREATE INDEX IF NOT EXISTS idx_events_location_search
            ON events USING GIN ((location->>'formatted_address') gin_trgm_ops);
            RAISE NOTICE '✅ Índice de búsqueda avanzado creado';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️ No se pudo crear índice avanzado (normal si no tienes permisos de superusuario): %', SQLERRM;
        END;

    ELSE
        RAISE NOTICE '❌ La columna location no existe como JSONB. Ejecuta primero la migración básica.';
    END IF;
END $$;