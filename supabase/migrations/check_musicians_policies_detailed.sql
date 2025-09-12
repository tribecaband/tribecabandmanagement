-- Verificar políticas RLS de la tabla musicians
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
WHERE tablename = 'musicians';

-- Verificar permisos de tabla para roles específicos
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'musicians' 
    AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'musicians';

-- Contar registros en la tabla
SELECT COUNT(*) as total_musicians FROM musicians;