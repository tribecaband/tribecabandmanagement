-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view all songs" ON songs;
DROP POLICY IF EXISTS "Users can insert songs" ON songs;
DROP POLICY IF EXISTS "Users can update their own songs" ON songs;
DROP POLICY IF EXISTS "Users can delete their own songs" ON songs;

-- Crear políticas RLS para la tabla songs

-- Política para SELECT: Todos pueden ver todas las canciones
CREATE POLICY "Users can view all songs" ON songs
    FOR SELECT
    USING (true);

-- Política para INSERT: Usuarios autenticados pueden insertar canciones
CREATE POLICY "Users can insert songs" ON songs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política para UPDATE: Usuarios pueden actualizar sus propias canciones
CREATE POLICY "Users can update their own songs" ON songs
    FOR UPDATE
    TO authenticated
    USING (added_by = auth.uid())
    WITH CHECK (added_by = auth.uid());

-- Política para DELETE: Usuarios pueden eliminar sus propias canciones
CREATE POLICY "Users can delete their own songs" ON songs
    FOR DELETE
    TO authenticated
    USING (added_by = auth.uid());

-- Asegurar que RLS esté habilitado
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Otorgar permisos básicos a los roles
GRANT SELECT ON songs TO anon;
GRANT ALL PRIVILEGES ON songs TO authenticated;

-- Verificar las políticas creadas
SELECT 
    policyname, 
    cmd, 
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'songs'
ORDER BY cmd, policyname;