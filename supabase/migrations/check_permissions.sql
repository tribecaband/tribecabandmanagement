-- Check permissions for musicians and event_musicians tables
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name IN ('musicians', 'event_musicians') 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Grant permissions if missing
GRANT SELECT ON musicians TO anon;
GRANT SELECT ON musicians TO authenticated;
GRANT SELECT ON event_musicians TO anon;
GRANT SELECT ON event_musicians TO authenticated;

-- Check again after granting
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name IN ('musicians', 'event_musicians') 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;