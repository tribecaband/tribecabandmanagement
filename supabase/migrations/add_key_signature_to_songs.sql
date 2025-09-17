-- Add key_signature field to songs table
ALTER TABLE songs ADD COLUMN key_signature TEXT DEFAULT '';

-- Add comment to the column
COMMENT ON COLUMN songs.key_signature IS 'Musical key signature in English notation (A, A#, B, C, C#, D, D#, E, F, F#, G, G#)';

-- Grant permissions for the new column
GRANT SELECT, UPDATE ON songs TO authenticated;
GRANT SELECT ON songs TO anon;