-- Verificar políticas RLS actuales para la tabla songs
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
WHERE tablename = 'songs';

-- Verificar permisos de roles para la tabla songs
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'songs' 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Verificar si RLS está habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'songs';