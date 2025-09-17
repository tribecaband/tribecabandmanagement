-- Grant permissions for songs table to anon and authenticated roles

-- Grant SELECT permission to anon role (for public reading)
GRANT SELECT ON songs TO anon;

-- Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON songs TO authenticated;

-- Verify current permissions (this will show in the migration output)
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'songs' 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;