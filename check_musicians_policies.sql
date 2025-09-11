-- Check RLS policies for musicians table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'musicians';

-- Check table permissions for anon and authenticated roles
SELECT 
  grantee, 
  table_name, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'musicians'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Check if there are any musicians in the table
SELECT COUNT(*) as total_musicians FROM musicians;

-- Sample musicians data
SELECT id, name, instrument, is_main FROM musicians LIMIT 5;