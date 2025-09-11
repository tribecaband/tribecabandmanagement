-- Revisar políticas RLS actuales para la tabla events
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
WHERE tablename = 'events';

-- Verificar permisos actuales para las tablas
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'events'
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Crear política de UPDATE para eventos
-- Permitir que usuarios autenticados actualicen eventos que han creado
CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Crear política de UPDATE para administradores (si existe un campo role)
-- Esta política permite a los administradores actualizar cualquier evento
CREATE POLICY "Admins can update all events" ON events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Asegurar que los usuarios autenticados tengan permisos básicos
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT ON events TO anon;

-- Verificar las políticas después de crearlas
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
WHERE tablename = 'events'
ORDER BY cmd, policyname;