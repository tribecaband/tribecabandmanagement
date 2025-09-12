-- Fix RLS policies for musicians table
-- This ensures that musicians can be read by both anonymous and authenticated users

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to musicians" ON musicians;
DROP POLICY IF EXISTS "Allow anonymous read access to musicians" ON musicians;
DROP POLICY IF EXISTS "Allow authenticated read access to musicians" ON musicians;

-- Create policy to allow read access for anonymous users
CREATE POLICY "Allow anonymous read access to musicians" ON musicians
    FOR SELECT
    TO anon
    USING (true);

-- Create policy to allow read access for authenticated users
CREATE POLICY "Allow authenticated read access to musicians" ON musicians
    FOR SELECT
    TO authenticated
    USING (true);

-- Grant necessary permissions to roles
GRANT SELECT ON musicians TO anon;
GRANT SELECT ON musicians TO authenticated;

-- Verify RLS is enabled (should already be enabled)
ALTER TABLE musicians ENABLE ROW LEVEL SECURITY;