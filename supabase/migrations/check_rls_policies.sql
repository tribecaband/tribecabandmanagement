-- Script para verificar políticas RLS y permisos en la tabla events

-- 1. Verificar políticas RLS existentes en la tabla events
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
WHERE tablename = 'events' AND schemaname = 'public';

-- 2. Verificar permisos de tabla para roles anon y authenticated
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- 3. Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'events' AND schemaname = 'public';

-- 4. Verificar roles y usuarios actuales
SELECT current_user, current_role;

-- 5. Mostrar información detallada de las políticas
SELECT 
    pol.polname AS policy_name,
    pol.polcmd AS command,
    pol.polpermissive AS permissive,
    pol.polroles AS roles,
    pg_get_expr(pol.polqual, pol.polrelid) AS using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' AND pc.relname = 'events';