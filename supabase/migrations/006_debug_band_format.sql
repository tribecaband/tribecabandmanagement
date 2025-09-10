-- Debug query to check current band_format values and musician counts
SELECT 
    e.id,
    e.name,
    e.band_format,
    COUNT(em.musician_id) as actual_musician_count,
    CASE 
        WHEN COUNT(em.musician_id) = 1 THEN 'solo'
        WHEN COUNT(em.musician_id) = 2 THEN 'duo'
        WHEN COUNT(em.musician_id) = 3 THEN 'trio'
        WHEN COUNT(em.musician_id) = 4 THEN 'quartet'
        WHEN COUNT(em.musician_id) >= 5 THEN 'band'
        ELSE 'solo'
    END as expected_band_format
FROM events e
LEFT JOIN event_musicians em ON e.id = em.event_id
GROUP BY e.id, e.name, e.band_format
ORDER BY e.created_at DESC;

-- Update band_format based on actual musician count
UPDATE events 
SET band_format = (
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM event_musicians 
            WHERE event_id = events.id
        ) = 1 THEN 'solo'
        WHEN (
            SELECT COUNT(*) 
            FROM event_musicians 
            WHERE event_id = events.id
        ) = 2 THEN 'duo'
        WHEN (
            SELECT COUNT(*) 
            FROM event_musicians 
            WHERE event_id = events.id
        ) = 3 THEN 'trio'
        WHEN (
            SELECT COUNT(*) 
            FROM event_musicians 
            WHERE event_id = events.id
        ) = 4 THEN 'quartet'
        WHEN (
            SELECT COUNT(*) 
            FROM event_musicians 
            WHERE event_id = events.id
        ) >= 5 THEN 'band'
        ELSE 'solo'
    END
)
WHERE EXISTS (
    SELECT 1 FROM event_musicians WHERE event_id = events.id
);