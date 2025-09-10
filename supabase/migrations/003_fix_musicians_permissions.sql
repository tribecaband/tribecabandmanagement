-- Grant permissions for musicians table
GRANT SELECT ON musicians TO anon;
GRANT ALL PRIVILEGES ON musicians TO authenticated;

-- Check current permissions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'musicians' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;