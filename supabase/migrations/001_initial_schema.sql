-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_types table
CREATE TABLE IF NOT EXISTS public.event_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre_evento TEXT NOT NULL,
    fecha_evento DATE NOT NULL,
    hora_evento TIME NOT NULL,
    ubicacion TEXT NOT NULL,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    comunidad_autonoma TEXT,
    facturacion TEXT NOT NULL DEFAULT 'No' CHECK (facturacion IN ('No', 'Sí', 'Anticipo')),
    requiere_alta BOOLEAN DEFAULT false,
    tipo_evento UUID REFERENCES public.event_types(id),
    formato_banda TEXT NOT NULL DEFAULT 'Banda' CHECK (formato_banda IN ('Banda', 'Trío', 'Dúo')),
    cache_euros DECIMAL(10, 2) DEFAULT 0,
    anticipo_euros DECIMAL(10, 2) DEFAULT 0,
    persona_contacto TEXT,
    telefono_contacto TEXT,
    voz TEXT DEFAULT 'Julio' CHECK (voz IN ('Julio', 'Sustituto')),
    guitarra TEXT DEFAULT 'Santi' CHECK (guitarra IN ('Santi', 'Sustituto')),
    bajo TEXT DEFAULT 'Pablo' CHECK (bajo IN ('Pablo', 'Sustituto')),
    bateria TEXT DEFAULT 'Javi' CHECK (bateria IN ('Javi', 'Sustituto')),
    comentarios TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    can_create_events BOOLEAN DEFAULT false,
    can_edit_events BOOLEAN DEFAULT false,
    can_delete_events BOOLEAN DEFAULT false,
    can_view_accounting BOOLEAN DEFAULT false,
    can_manage_users BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for events
CREATE POLICY "Authenticated users can view events" ON public.events
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users with permission can create events" ON public.events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_permissions
            WHERE user_id = auth.uid() AND can_create_events = true
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users with permission can update events" ON public.events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_permissions
            WHERE user_id = auth.uid() AND can_edit_events = true
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users with permission can delete events" ON public.events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_permissions
            WHERE user_id = auth.uid() AND can_delete_events = true
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for event_types
CREATE POLICY "Authenticated users can view event types" ON public.event_types
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage event types" ON public.event_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for user_permissions
CREATE POLICY "Users can view their own permissions" ON public.user_permissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all permissions" ON public.user_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all permissions" ON public.user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'user'
    );
    
    INSERT INTO public.user_permissions (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default event types
INSERT INTO public.event_types (name) VALUES
    ('Concierto'),
    ('Festival'),
    ('Boda'),
    ('Evento Corporativo'),
    ('Fiesta Privada')
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at
    BEFORE UPDATE ON public.user_permissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();