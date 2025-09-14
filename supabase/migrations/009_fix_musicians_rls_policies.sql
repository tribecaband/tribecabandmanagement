-- Fix RLS policies for musicians table to allow authenticated users to create musicians
-- The issue is that auth.role() = 'authenticated' is incorrect
-- We should use auth.uid() IS NOT NULL to check for authenticated users

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view all musicians" ON musicians;
DROP POLICY IF EXISTS "Authenticated users can manage musicians" ON musicians;
DROP POLICY IF EXISTS "Allow public read access to musicians" ON musicians;

-- Create correct RLS policies for musicians table
-- Allow anyone to read musicians (for public display)
CREATE POLICY "Allow public read access to musicians" ON musicians
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert new musicians
CREATE POLICY "Allow authenticated users to create musicians" ON musicians
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update musicians
CREATE POLICY "Allow authenticated users to update musicians" ON musicians
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete musicians
CREATE POLICY "Allow authenticated users to delete musicians" ON musicians
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Ensure the table has RLS enabled
ALTER TABLE musicians ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated role
GRANT SELECT ON musicians TO anon;
GRANT ALL PRIVILEGES ON musicians TO authenticated;

-- Verify the policies were created correctly
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'musicians'
ORDER BY policyname;

-- Test that we can see existing musicians
SELECT COUNT(*) as total_musicians FROM musicians;