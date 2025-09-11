-- Script simplificado para corregir políticas RLS de eventos
-- Enfoque más permisivo para resolver el problema de actualización

-- 1. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;

-- 2. Asegurar que RLS esté habilitado
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 3. Otorgar permisos completos a usuarios autenticados
GRANT ALL PRIVILEGES ON events TO authenticated;
GRANT SELECT ON events TO anon;

-- 4. Crear políticas más permisivas

-- Política de SELECT: permitir lectura a todos
CREATE POLICY "events_select_all" ON events
    FOR SELECT
    USING (true);

-- Política de INSERT: permitir inserción a usuarios autenticados
CREATE POLICY "events_insert_authenticated" ON events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política de UPDATE: permitir actualización a usuarios autenticados
CREATE POLICY "events_update_authenticated" ON events
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política de DELETE: permitir eliminación a usuarios autenticados
CREATE POLICY "events_delete_authenticated" ON events
    FOR DELETE
    TO authenticated
    USING (true);

-- 5. Verificar las políticas creadas
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    pg_get_expr(polqual, polrelid) as using_expression,
    pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policies 
WHERE tablename = 'events' AND schemaname = 'public'
ORDER BY policyname;

-- 6. Verificar permisos
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY grantee, privilege_type;