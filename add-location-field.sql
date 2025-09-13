-- Migration to add/update location field to events table
-- This script will migrate from TEXT to JSONB for structured location data

DO $$
BEGIN
    -- Check if the location column exists as TEXT
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'location'
        AND data_type = 'text'
    ) THEN
        -- Rename old location column for backup
        ALTER TABLE events RENAME COLUMN location TO location_backup_text;
        RAISE NOTICE 'Backed up existing TEXT location column';

        -- Add new JSONB location column
        ALTER TABLE events ADD COLUMN location JSONB;
        RAISE NOTICE 'Added new JSONB location column';

    ELSIF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'location'
    ) THEN
        -- Add the location column as JSONB if it doesn't exist
        ALTER TABLE events ADD COLUMN location JSONB;
        RAISE NOTICE 'Location JSONB column added to events table';
    ELSE
        RAISE NOTICE 'Location column already exists as JSONB';
    END IF;

    -- Create index for location searches if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'events'
        AND indexname = 'idx_events_location_formatted_address'
    ) THEN
        CREATE INDEX idx_events_location_formatted_address
        ON events USING GIN ((location->>'formatted_address') gin_trgm_ops);
        RAISE NOTICE 'Created index for location formatted_address searches';
    END IF;

    -- Create index for coordinates if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'events'
        AND indexname = 'idx_events_location_coordinates'
    ) THEN
        CREATE INDEX idx_events_location_coordinates
        ON events USING GIST (
            (POINT(
                ((location->'coordinates'->>'lng')::numeric),
                ((location->'coordinates'->>'lat')::numeric)
            ))
        );
        RAISE NOTICE 'Created spatial index for location coordinates';
    END IF;
END $$;

-- Function to migrate old text locations to new structure (for manual execution)
CREATE OR REPLACE FUNCTION migrate_text_locations_to_jsonb()
RETURNS INTEGER AS $$
DECLARE
    migrated_count INTEGER := 0;
    event_record RECORD;
BEGIN
    -- Only proceed if backup column exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'location_backup_text'
    ) THEN
        -- Update events that have text location but no JSONB location
        FOR event_record IN
            SELECT id, location_backup_text
            FROM events
            WHERE location_backup_text IS NOT NULL
            AND location_backup_text != ''
            AND location IS NULL
        LOOP
            -- Create a basic LocationData structure from the text
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

        RAISE NOTICE 'Migrated % events from text to JSONB location', migrated_count;
    END IF;

    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Note: To migrate existing text locations, run:
-- SELECT migrate_text_locations_to_jsonb();