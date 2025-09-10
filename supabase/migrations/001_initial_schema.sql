-- Crear tabla de perfiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    permissions JSONB DEFAULT '{"create": false, "edit": false, "delete": false}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de eventos
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    comments TEXT,
    cache_amount DECIMAL(10,2) NOT NULL,
    cache_includes_iva BOOLEAN DEFAULT false,
    advance_amount DECIMAL(10,2) DEFAULT 0,
    advance_includes_iva BOOLEAN DEFAULT false,
    invoice_status VARCHAR(20) DEFAULT 'no' CHECK (invoice_status IN ('no', 'yes', 'advance')),
    is_active BOOLEAN DEFAULT true,
    event_types TEXT[] DEFAULT '{}',
    musicians JSONB DEFAULT '{}',
    band_format VARCHAR(20),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de músicos
CREATE TABLE musicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    instrument VARCHAR(50) NOT NULL,
    is_main BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de músicos por evento
CREATE TABLE event_musicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    musician_id UUID REFERENCES musicians(id),
    role VARCHAR(20) DEFAULT 'main' CHECK (role IN ('main', 'substitute')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de sustitutos
CREATE TABLE musician_substitutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    main_musician_id UUID REFERENCES musicians(id),
    substitute_musician_id UUID REFERENCES musicians(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_events_date ON events(event_date DESC);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_active ON events(is_active);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_active ON profiles(is_active);

-- Políticas RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE musicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_musicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE musician_substitutes ENABLE ROW LEVEL SECURITY;

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

-- Permisos básicos
GRANT SELECT ON profiles TO anon;
GRANT ALL PRIVILEGES ON profiles TO authenticated;
GRANT SELECT ON events TO anon;
GRANT ALL PRIVILEGES ON events TO authenticated;
GRANT SELECT ON musicians TO anon;
GRANT ALL PRIVILEGES ON musicians TO authenticated;
GRANT ALL PRIVILEGES ON event_musicians TO authenticated;
GRANT ALL PRIVILEGES ON musician_substitutes TO authenticated;

-- Datos iniciales
INSERT INTO musicians (name, instrument, is_main) VALUES
('Julio', 'voz', true),
('Santi', 'guitarra', true),
('Pablo', 'bajo', true),
('Javi', 'bateria', true);

INSERT INTO profiles (email, full_name, role, permissions, is_active) VALUES
('admin@tribeca.com', 'Administrador TriBeCa', 'admin', '{"create": true, "edit": true, "delete": true}', true);