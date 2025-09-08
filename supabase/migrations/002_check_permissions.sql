-- Check and grant permissions for user_profiles and user_permissions tables

-- Grant permissions to authenticated users for user_profiles
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_permissions TO authenticated;

-- Grant basic read access to anon users (if needed for public operations)
GRANT SELECT ON user_profiles TO anon;
GRANT SELECT ON user_permissions TO anon;

-- Check current permissions (this will show in the migration output)
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name IN ('user_profiles', 'user_permissions') 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Also check RLS policies
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
WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'user_permissions')
ORDER BY tablename, policyname;