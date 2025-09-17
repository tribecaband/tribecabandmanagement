-- Grant basic permissions to authenticated users for songs table
GRANT ALL PRIVILEGES ON songs TO authenticated;
GRANT SELECT ON songs TO anon;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own songs" ON songs;
DROP POLICY IF EXISTS "Users can view all songs" ON songs;
DROP POLICY IF EXISTS "Users can update their own songs" ON songs;
DROP POLICY IF EXISTS "Users can delete their own songs" ON songs;

-- Create RLS policies for songs table
-- Allow authenticated users to insert songs
CREATE POLICY "Users can insert their own songs" ON songs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = added_by);

-- Allow everyone to view all songs
CREATE POLICY "Users can view all songs" ON songs
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- Allow users to update their own songs
CREATE POLICY "Users can update their own songs" ON songs
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = added_by)
    WITH CHECK (auth.uid() = added_by);

-- Allow users to delete their own songs
CREATE POLICY "Users can delete their own songs" ON songs
    FOR DELETE
    TO authenticated
    USING (auth.uid() = added_by);