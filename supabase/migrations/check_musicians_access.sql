-- Grant SELECT permissions to anon and authenticated roles for musicians table
GRANT SELECT ON musicians TO anon;
GRANT SELECT ON musicians TO authenticated;

-- Create a permissive RLS policy for SELECT operations
CREATE POLICY "Allow public read access to musicians" ON musicians
  FOR SELECT
  TO public
  USING (true);

-- Verify the data exists
SELECT 'Total musicians:' as info, COUNT(*) as count FROM musicians;
SELECT 'Sample musicians:' as info, name, instrument FROM musicians LIMIT 3;