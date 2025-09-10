-- Fix musicians field format and recalculate band_format
-- The musicians field should be an array, not an object

-- First, show current state
SELECT 
    id,
    name,
    band_format,
    musicians,
    jsonb_typeof(musicians) as musicians_type
FROM events 
ORDER BY created_at DESC;

-- Convert musicians from object {} to empty array [] where needed
UPDATE events 
SET musicians = '[]'::jsonb
WHERE musicians IS NULL 
   OR jsonb_typeof(musicians) = 'object' 
   OR (jsonb_typeof(musicians) = 'array' AND jsonb_array_length(musicians) = 0);

-- Now recalculate band_format based on the corrected musicians array
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
updated_at = NOW();

-- Show the results after update
SELECT 
    id,
    name,
    band_format,
    musicians,
    jsonb_typeof(musicians) as musicians_type,
    CASE 
        WHEN musicians IS NULL OR jsonb_typeof(musicians) != 'array' THEN 0
        ELSE jsonb_array_length(musicians)
    END as musician_count
FROM events 
ORDER BY created_at DESC;