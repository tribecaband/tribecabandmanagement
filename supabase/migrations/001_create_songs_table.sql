-- Crear tabla de canciones
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    artist VARCHAR(200) NOT NULL,
    album VARCHAR(200),
    duration INTEGER, -- Duración en segundos
    deezer_id VARCHAR(50) UNIQUE,
    preview_url TEXT,
    album_cover TEXT,
    added_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar búsquedas
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_artist ON songs(artist);
CREATE INDEX idx_songs_added_by ON songs(added_by);
CREATE INDEX idx_songs_deezer_id ON songs(deezer_id);

-- Habilitar RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Permisos básicos
GRANT SELECT ON songs TO anon;
GRANT ALL PRIVILEGES ON songs TO authenticated;

-- Datos iniciales de canciones de ejemplo
INSERT INTO songs (title, artist, album, duration, deezer_id, preview_url, album_cover) VALUES
('Bohemian Rhapsody', 'Queen', 'A Night at the Opera', 355, '3135556', 'https://cdns-preview-d.dzcdn.net/stream/c-deda7fa9316d9e9e880d2c6207e92260-8.mp3', 'https://api.deezer.com/album/302127/image'),
('Hotel California', 'Eagles', 'Hotel California', 391, '14808965', 'https://cdns-preview-d.dzcdn.net/stream/c-d1c5f5c5c5c5c5c5c5c5c5c5c5c5c5c5-8.mp3', 'https://api.deezer.com/album/1652248/image'),
('Sweet Child O Mine', 'Guns N Roses', 'Appetite for Destruction', 356, '1109731', 'https://cdns-preview-d.dzcdn.net/stream/c-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6-8.mp3', 'https://api.deezer.com/album/119606/image');