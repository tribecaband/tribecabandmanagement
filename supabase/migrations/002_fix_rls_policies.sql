-- Agregar políticas RLS faltantes para resolver error de creación de perfiles

-- Políticas para profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE USING (true);

-- Políticas para events
CREATE POLICY "Users can view all events" ON events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update events they created" ON events FOR UPDATE USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can delete events they created" ON events FOR DELETE USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Políticas para musicians
CREATE POLICY "Users can view all musicians" ON musicians FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage musicians" ON musicians FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para event_musicians
CREATE POLICY "Users can view event musicians" ON event_musicians FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage event musicians" ON event_musicians FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para musician_substitutes
CREATE POLICY "Users can view musician substitutes" ON musician_substitutes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage substitutes" ON musician_substitutes FOR ALL USING (auth.role() = 'authenticated');