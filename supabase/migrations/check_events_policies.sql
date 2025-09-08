-- Verificar políticas RLS actuales en la tabla events
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
WHERE tablename = 'events' AND schemaname = 'public'
ORDER BY policyname;

-- Verificar si RLS está habilitado en la tabla events
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'events' AND schemaname = 'public';

-- Verificar permisos de roles en la tabla events
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;