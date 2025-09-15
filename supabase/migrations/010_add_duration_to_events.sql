-- Add duration field to events table
-- Duration should be stored in minutes as INTEGER

-- Add the duration column
ALTER TABLE events
ADD COLUMN duration INTEGER;

-- Add comment to document the field
COMMENT ON COLUMN events.duration IS 'Duration of the event in minutes';

-- Add a check constraint to ensure duration is positive if provided
ALTER TABLE events
ADD CONSTRAINT events_duration_positive
CHECK (duration IS NULL OR duration > 0);

-- Test that the column was added successfully
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'duration'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'duration column was not added successfully to events table';
    END IF;

    RAISE NOTICE 'duration column added successfully to events table';
END
$$;