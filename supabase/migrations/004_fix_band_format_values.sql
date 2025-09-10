-- Fix band format values for existing events
-- Check current band_format values and update incorrect ones

-- First, let's see what band_format values we currently have
SELECT band_format, COUNT(*) as count 
FROM events 
WHERE band_format IS NOT NULL 
GROUP BY band_format;

-- Update events that have incorrect band_format based on musician count
-- Handle cases where musicians might be null, empty array, or not an array
UPDATE events 
SET band_format = CASE 
    WHEN musicians IS NULL OR jsonb_typeof(musicians) != 'array' OR jsonb_array_length(musicians) = 0 THEN 'solo'
    WHEN jsonb_array_length(musicians) = 1 THEN 'solo'
    WHEN jsonb_array_length(musicians) = 2 THEN 'duo' 
    WHEN jsonb_array_length(musicians) = 3 THEN 'trio'
    WHEN jsonb_array_length(musicians) = 4 THEN 'quartet'
    WHEN jsonb_array_length(musicians) >= 5 THEN 'band'
    ELSE 'solo'
END,
updated_at = NOW()
WHERE (
    musicians IS NULL OR 
    jsonb_typeof(musicians) != 'array' OR
    (
        jsonb_typeof(musicians) = 'array' AND (
            (jsonb_array_length(musicians) = 0 AND band_format != 'solo') OR
            (jsonb_array_length(musicians) = 1 AND band_format != 'solo') OR
            (jsonb_array_length(musicians) = 2 AND band_format != 'duo') OR
            (jsonb_array_length(musicians) = 3 AND band_format != 'trio') OR
            (jsonb_array_length(musicians) = 4 AND band_format != 'quartet') OR
            (jsonb_array_length(musicians) >= 5 AND band_format != 'band')
        )
    )
);

-- Show the results after update
SELECT 
    name,
    band_format,
    CASE 
        WHEN musicians IS NULL OR jsonb_typeof(musicians) != 'array' THEN 0
        ELSE jsonb_array_length(musicians)
    END as musician_count,
    musicians
FROM events 
ORDER BY created_at DESC;