-- Script para corregir políticas RLS y permisos en la tabla events

-- 1. Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;
DROP POLICY IF EXISTS "Enable read access for all users" ON events;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON events;
DROP POLICY IF EXISTS "Enable update for users based on email" ON events;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON events;

-- 2. Asegurar que RLS esté habilitado
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 3. Otorgar permisos básicos a los roles
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT ON events TO anon;

-- 4. Crear políticas RLS para SELECT (lectura)
CREATE POLICY "events_select_policy" ON events
    FOR SELECT
    USING (true); -- Permitir lectura a todos los usuarios autenticados

-- 5. Crear políticas RLS para INSERT (creación)
CREATE POLICY "events_insert_policy" ON events
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 6. Crear políticas RLS para UPDATE (actualización)
-- Permitir actualización si el usuario es el creador o es admin
CREATE POLICY "events_update_policy" ON events
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND (
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role = 'admin'
            )
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role = 'admin'
            )
        )
    );

-- 7. Crear políticas RLS para DELETE (eliminación)
CREATE POLICY "events_delete_policy" ON events
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND (
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role = 'admin'
            )
        )
    );

-- 8. Verificar que las políticas se crearon correctamente
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'events' AND schemaname = 'public'
ORDER BY policyname;

-- 9. Verificar permisos de tabla
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY grantee, privilege_type;